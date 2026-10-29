<?php
/**
 * Giao diện admin cho banner và ưu đãi: cột danh sách (ảnh xem trước, kiểu, trạng thái, lịch, thứ tự),
 * sắp xếp mặc định theo "Thứ tự", nạp CSS/JS riêng chỉ trên màn hình của hai loại bài này.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

hv_admin_default_order( 'hv_banner' );
hv_admin_default_order( 'hv_offer' );

/** Màn hình đang xem có phải của banner/ưu đãi không. */
function hv_mkt_screen() {
	$s = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	return $s && in_array( $s->post_type, array( 'hv_banner', 'hv_offer', 'hv_corridor', 'hv_promo' ), true );
}

add_action(
	'admin_enqueue_scripts',
	static function () {
		if ( ! hv_mkt_screen() ) {
			return;
		}
		wp_enqueue_style( 'hv-tokens', HV_WEB_URI . '/assets/css/tokens.css', array(), HV_WEB_VERSION );
		wp_enqueue_style( 'hv-admin-mkt', HV_WEB_URI . '/assets/css/admin-mkt.css', array( 'hv-tokens' ), HV_WEB_VERSION );
		wp_enqueue_script( 'hv-admin-mkt', HV_WEB_URI . '/assets/js/admin-mkt.js', array(), HV_WEB_VERSION, true );
	}
);

add_filter(
	'enter_title_here',
	static function ( $text, $post ) {
		if ( 'hv_offer' === $post->post_type ) {
			return 'Tên tuyến, vd. Sài Gòn đi Vũng Tàu';
		}
		return 'hv_banner' === $post->post_type ? 'Mô tả ngắn của banner (hiện cho người dùng đọc màn hình)' : $text;
	},
	10,
	2
);

/** Cột: bỏ "Ngày", thêm các cột của MKT sau tiêu đề. */
function hv_mkt_columns( array $cols, array $extra ) {
	$out = array( 'cb' => $cols['cb'] ?? '', 'hv_thumb' => 'Xem trước', 'title' => $cols['title'] ?? 'Tiêu đề' );
	return $out + $extra;
}

add_filter(
	'manage_hv_banner_posts_columns',
	static fn( $cols ) => hv_mkt_columns( $cols, array( 'hv_kind' => 'Kiểu', 'hv_status' => 'Trạng thái và lịch', 'menu_order' => 'Thứ tự' ) )
);
add_filter(
	'manage_hv_offer_posts_columns',
	static fn( $cols ) => hv_mkt_columns( $cols, array( 'hv_price' => 'Giá và huy hiệu', 'hv_status' => 'Trạng thái và lịch', 'menu_order' => 'Thứ tự' ) )
);
foreach ( array( 'hv_banner', 'hv_offer' ) as $hv_pt ) {
	add_filter( "manage_edit-{$hv_pt}_sortable_columns", static fn( $c ) => $c + array( 'menu_order' => 'menu_order' ) );
}

add_action(
	'manage_hv_banner_posts_custom_column',
	static function ( $col, $post_id ) {
		$post = get_post( $post_id );
		$m    = hv_banner_meta( $post_id );
		if ( 'hv_thumb' === $col ) {
			if ( 'designed' === $m['kind'] ) {
				$cut = hv_media_or_url( $m['cutout_id'], $m['cutout_url'], 'medium', 900, 356 );
				echo '<span class="hv-thumb hv-thumb--designed hv-tone-' . esc_attr( $m['tone'] ) . '"><b>' . esc_html( mb_substr( $m['headline'], 0, 40 ) ) . '</b>' . ( $cut ? '<img src="' . esc_url( $cut['url'] ) . '" alt="">' : '' ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
				return;
			}
			$d   = hv_media_or_url( get_post_thumbnail_id( $post_id ), hv_clean_link( $m['desktop_url'] ), 'medium', 3334, 1156 );
			$mob = hv_media_or_url( $m['mobile_id'], $m['mobile_url'], 'medium', 1000, 540 );
			$img = $d ?: $mob;
			echo $img ? '<img class="hv-thumb" src="' . esc_url( $img['url'] ) . '" alt="">' . ( $d ? '' : '<br><small>chỉ điện thoại</small>' ) : '<small>Chưa có ảnh</small>'; // phpcs:ignore WordPress.Security.EscapeOutput
		} elseif ( 'hv_kind' === $col ) {
			echo esc_html( 'designed' === $m['kind'] ? 'Thiết kế sẵn' : 'Ảnh poster' ) . '<br><small>' . esc_html( 'popup' === $m['type'] ? 'Popup' : 'Carousel' ) . '</small>';
		} elseif ( 'hv_status' === $col ) {
			hv_admin_status_cell( $post, $m['start'], $m['end'] );
		} elseif ( 'menu_order' === $col ) {
			echo (int) $post->menu_order;
		}
	},
	10,
	2
);

add_action(
	'manage_hv_offer_posts_custom_column',
	static function ( $col, $post_id ) {
		$post = get_post( $post_id );
		$m    = hv_offer_meta( $post_id );
		if ( 'hv_thumb' === $col ) {
			$img = hv_media_or_url( get_post_thumbnail_id( $post_id ), $m['image_url'], 'thumbnail', 150, 150 );
			echo '<span class="hv-thumb hv-thumb--offer hv-tone-' . esc_attr( $m['tone'] ) . '">' . ( $img ? '<img src="' . esc_url( $img['url'] ) . '" alt="">' : '' ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		} elseif ( 'hv_price' === $col ) {
			echo '<strong>' . esc_html( $m['price'] ) . '</strong> ' . esc_html( $m['unit'] ) . ( '' !== $m['badge'] ? '<br><small>' . esc_html( $m['badge'] ) . '</small>' : '' );
		} elseif ( 'hv_status' === $col ) {
			hv_admin_status_cell( $post, $m['start'], $m['end'] );
		} elseif ( 'menu_order' === $col ) {
			echo (int) $post->menu_order;
		}
	},
	10,
	2
);
