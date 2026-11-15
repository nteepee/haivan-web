<?php
/**
 * Báo app Next làm mới dữ liệu giá ngay khi MKT đổi chương trình giảm giá, combo, tuyến chính hoặc luật giá.
 *
 * Next cache booking-config (chương trình + tuyến) và giữ mã ERP/luật giá trong bộ nhớ; không báo thì giá/ưu đãi trên site Next
 * chỉ đổi khi hết hạn cache (lưới an toàn 60 s). Mọi thay đổi (lưu bài, đổi trạng thái, vào/ra thùng rác, xoá hẳn, sửa meta
 * hv_promo_* / hv_corridor_* / hv_rule_* kể cả qua WP-CLI) gom lại thành MỘT lần POST <Next>/api/hv/revalidate ở cuối request
 * (hook shutdown: sau khi mọi meta đã ghi xong, Next đọc lại sẽ thấy bản mới), không chặn (blocking=false, timeout ngắn).
 *
 * Cấu hình (hằng trong wp-config hoặc biến môi trường cùng tên):
 * - HV_NEXT_INTERNAL_URL: gốc app Next tới được từ WP (mặc định như inc/v2.php).
 * - HV_REVALIDATE_SECRET: bí mật header X-HV-Secret (≥ 16 ký tự, cùng giá trị phía Next); trống thì dùng HV_WP_SHARED_SECRET.
 * Không có bí mật hợp lệ → không gửi gì (Next vẫn tự làm mới theo hạn cache).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Loại bài ảnh hưởng giá/ưu đãi hiển thị hoặc tổng tiền thanh toán ở Next. */
const HV_NEXT_REVALIDATE_TYPES = array( 'hv_promo', 'hv_corridor', 'hv_rule' );

/** Meta của các loại bài trên (đổi meta trực tiếp, vd WP-CLI hoặc script seed, cũng phải báo). */
const HV_NEXT_REVALIDATE_META = '/^hv_(promo|corridor|rule)_/';

/** @return string Bí mật gửi Next; '' = tắt. */
function hv_next_revalidate_secret() {
	$own = defined( 'HV_REVALIDATE_SECRET' ) ? (string) HV_REVALIDATE_SECRET : (string) getenv( 'HV_REVALIDATE_SECRET' );
	if ( strlen( trim( $own ) ) >= 16 ) {
		return trim( $own );
	}
	return function_exists( 'hv_shared_secret' ) ? hv_shared_secret() : '';
}

/** @return string Gốc app Next nội bộ, không có dấu / cuối. */
function hv_next_internal_url() {
	$url = defined( 'HV_NEXT_INTERNAL_URL' ) ? (string) HV_NEXT_INTERNAL_URL : (string) getenv( 'HV_NEXT_INTERNAL_URL' );
	return rtrim( '' !== trim( $url ) ? trim( $url ) : 'http://host.docker.internal:3010', '/' );
}

/** Đánh dấu cần báo Next; gửi một lần ở shutdown dù có bao nhiêu thay đổi trong request. */
function hv_next_revalidate_queue() {
	static $queued = false;
	if ( $queued ) {
		return;
	}
	$queued = true;
	add_action( 'shutdown', 'hv_next_revalidate_send' );
}

/** @param WP_Post|null $post */
function hv_next_revalidate_is_price_post( $post ) {
	return $post instanceof WP_Post && in_array( $post->post_type, HV_NEXT_REVALIDATE_TYPES, true ) && ! wp_is_post_revision( $post ) && ! wp_is_post_autosave( $post );
}

/**
 * POST không chặn tới Next. Lỗi (Next tắt, sai URL) không ảnh hưởng thao tác của MKT: Next vẫn tự làm mới sau hạn cache.
 *
 * @return bool true nếu đã gửi.
 */
function hv_next_revalidate_send() {
	$secret = hv_next_revalidate_secret();
	if ( '' === $secret ) {
		return false;
	}
	$res = wp_remote_post(
		hv_next_internal_url() . '/api/hv/revalidate',
		array(
			'blocking'    => false,
			'timeout'     => 2,
			'redirection' => 0,
			'headers'     => array( 'X-HV-Secret' => $secret ),
			'body'        => '',
		)
	);
	return ! is_wp_error( $res );
}

add_action(
	'save_post',
	static function ( $post_id, $post ) {
		if ( hv_next_revalidate_is_price_post( $post ) ) {
			hv_next_revalidate_queue();
		}
	},
	10,
	2
);

// Xuất bản theo lịch, vào/ra thùng rác, chuyển nháp: đổi trạng thái là đổi việc chương trình có chạy hay không.
add_action(
	'transition_post_status',
	static function ( $new_status, $old_status, $post ) {
		if ( $new_status !== $old_status && hv_next_revalidate_is_price_post( $post ) ) {
			hv_next_revalidate_queue();
		}
	},
	10,
	3
);

add_action(
	'deleted_post',
	static function ( $post_id, $post = null ) {
		if ( hv_next_revalidate_is_price_post( $post ) ) {
			hv_next_revalidate_queue();
		}
	},
	10,
	2
);

foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hv_meta_hook ) {
	add_action(
		$hv_meta_hook,
		static function ( $meta_id, $object_id, $meta_key ) {
			if ( is_string( $meta_key ) && 1 === preg_match( HV_NEXT_REVALIDATE_META, $meta_key ) ) {
				hv_next_revalidate_queue();
			}
		},
		10,
		3
	);
}
unset( $hv_meta_hook );
