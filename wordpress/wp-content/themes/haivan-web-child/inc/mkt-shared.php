<?php
/**
 * Dùng chung cho banner và ưu đãi do MKT quản lý: bảng màu khuyến mãi (chọn theo tên token, không nhập mã hex),
 * lịch hiệu lực (bắt đầu/kết thúc), làm sạch liên kết, cột "Trạng thái" trong danh sách admin.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Màu khuyến mãi v3: slug => nhãn. Slug khớp --color-promo-<slug> / --color-on-<slug> trong tokens.css. */
const HV_PROMO_TONES = array(
	'blue'   => 'Xanh dương đậm',
	'orange' => 'Cam',
	'teal'   => 'Xanh teal',
	'coral'  => 'San hô (đỏ)',
	'leaf'   => 'Xanh lá',
);

/** Slug màu hợp lệ, sai thì dùng $default. */
function hv_promo_tone( $v, $default = 'blue' ) {
	$v = is_string( $v ) ? $v : '';
	return isset( HV_PROMO_TONES[ $v ] ) ? $v : $default;
}

/** Ô chọn màu (select + ô xem trước). Tên token hiện trong ngoặc để MKT và dev gọi cùng một tên. */
function hv_promo_tone_field( $name, $value ) {
	$value = hv_promo_tone( $value );
	echo '<select name="' . esc_attr( $name ) . '" data-hv-tone>';
	foreach ( HV_PROMO_TONES as $slug => $label ) {
		echo '<option value="' . esc_attr( $slug ) . '"' . selected( $value, $slug, false ) . '>' . esc_html( $label . ' (promo-' . $slug . ')' ) . '</option>';
	}
	echo '</select> <span class="hv-swatch hv-swatch--' . esc_attr( $value ) . '" data-hv-swatch aria-hidden="true"></span>';
}

/** Chuỗi ngày giờ hợp lệ: "YYYY-MM-DD" hoặc "YYYY-MM-DDTHH:MM"; sai = rỗng. */
function hv_clean_when( $v, $with_time ) {
	$v  = trim( (string) $v );
	$re = $with_time ? '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/' : '/^\d{4}-\d{2}-\d{2}$/';
	if ( 1 !== preg_match( $re, $v ) ) {
		return '';
	}
	return false === strtotime( $v ) ? '' : $v;
}

/**
 * Trạng thái theo lịch (giờ site): active | upcoming | expired.
 * Mốc chỉ có ngày: bắt đầu tính từ 00:00, kết thúc tính hết 23:59 của ngày đó.
 */
function hv_schedule_state( $start, $end, $now = null ) {
	$now   = $now ?? wp_date( 'Y-m-d\TH:i' );
	$start = '' === $start ? '' : ( 10 === strlen( $start ) ? $start . 'T00:00' : $start );
	$end   = '' === $end ? '' : ( 10 === strlen( $end ) ? $end . 'T23:59' : $end );
	if ( '' !== $start && $start > $now ) {
		return 'upcoming';
	}
	if ( '' !== $end && $end < $now ) {
		return 'expired';
	}
	return 'active';
}

/** Nhãn trạng thái hiển thị trong cột admin: [slug, nhãn]. Bài nháp/chờ duyệt được ưu tiên hơn lịch. */
function hv_admin_status( $post, $start, $end ) {
	if ( 'publish' !== $post->post_status ) {
		return array( 'draft', 'Nháp (không hiện)' );
	}
	$state = hv_schedule_state( $start, $end );
	$map   = array(
		'active'   => 'Đang hiển thị',
		'upcoming' => 'Chưa đến ngày',
		'expired'  => 'Đã hết hạn',
	);
	return array( $state, $map[ $state ] );
}

/** Ô trạng thái trong cột admin: chấm màu + chữ (không chỉ dùng màu). */
function hv_admin_status_cell( $post, $start, $end ) {
	list( $slug, $label ) = hv_admin_status( $post, $start, $end );
	echo '<span class="hv-status hv-status--' . esc_attr( $slug ) . '">' . esc_html( $label ) . '</span>';
	$fmt = static fn( $v ) => '' === $v ? '' : esc_html( 10 === strlen( $v ) ? wp_date( 'd/m/Y', strtotime( $v ) ) : wp_date( 'd/m/Y H:i', strtotime( $v ) ) );
	if ( '' !== $start || '' !== $end ) {
		echo '<br><small>' . ( '' !== $start ? 'Từ ' . $fmt( $start ) : '' ) . ( '' !== $start && '' !== $end ? ' · ' : '' ) . ( '' !== $end ? 'đến ' . $fmt( $end ) : '' ) . '</small>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $fmt đã escape.
	}
}

/**
 * Liên kết do MKT nhập: "/duong-dan" nội bộ (không "//"), https/http, hoặc đường dẫn tuyến "a/b" (-> /xe-khach/a/b).
 * Sai = rỗng.
 */
function hv_clean_link( $v ) {
	$v = trim( (string) $v );
	if ( '' === $v ) {
		return '';
	}
	if ( hv_valid_route_path( $v ) ) {
		return '/xe-khach/' . $v;
	}
	if ( 1 === preg_match( '#^/(?![/\\\\])[^\s"\'<>]*$#', $v ) ) {
		return $v;
	}
	return esc_url_raw( $v, array( 'https', 'http' ) );
}

/** Thêm tiền tố ngôn ngữ cho liên kết trang đặt vé (Next có bản /en); liên kết khác giữ nguyên. */
function hv_link_for_lang( $href ) {
	return 0 === strpos( $href, '/xe-khach/' ) ? hv_lang_prefix() . $href : $href;
}

/** Ảnh URL do MKT nhập: "/assets/..." hoặc https; sai = rỗng. */
function hv_clean_image_url( $v ) {
	return hv_layout_img( $v );
}

/** Thiết lập chung cho danh sách admin của CPT do MKT quản lý: mặc định sắp theo "Thứ tự". */
function hv_admin_default_order( $post_type ) {
	add_action(
		'pre_get_posts',
		static function ( $q ) use ( $post_type ) {
			if ( is_admin() && $q->is_main_query() && $post_type === $q->get( 'post_type' ) && ! $q->get( 'orderby' ) ) {
				$q->set( 'orderby', array( 'menu_order' => 'ASC', 'ID' => 'ASC' ) );
			}
		}
	);
}
