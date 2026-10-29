<?php
/**
 * Trang chủ / landing: tuyến phổ biến do MKT sửa (CPT hv_route) + shortcode [haivan_popular_routes].
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Trang có tóm tắt (dùng làm phụ đề hero).
add_action(
	'init',
	static function () {
		add_post_type_support( 'page', 'excerpt' );
	}
);

/** Đường dẫn tuyến hợp lệ: "quan-1/vung-tau". */
function hv_valid_route_path( $path ) {
	return (bool) preg_match( '#^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*){1,2}$#', (string) $path );
}

/* Metabox cho hv_route ------------------------------------------------- */

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-route-fields', 'Thông tin tuyến', 'hv_route_metabox', 'hv_route', 'normal', 'high' );
	}
);

function hv_route_metabox( $post ) {
	wp_nonce_field( 'hv_route_save', 'hv_route_nonce' );
	$v = static fn( $k ) => esc_attr( (string) get_post_meta( $post->ID, $k, true ) );
	echo '<p><label>Đường dẫn tuyến trên trang đặt vé (vd. <code>quan-1/vung-tau</code> → /xe-khach/quan-1/vung-tau)<br>';
	echo '<input type="text" class="widefat" name="hv_route_path" value="' . $v( 'hv_route_path' ) . '" pattern="[a-z0-9\-]+(/[a-z0-9\-]+){1,2}"></label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<p><label>Giá hiển thị (vd. <code>Từ 140.000đ</code>)<br><input type="text" class="widefat" name="hv_route_price" value="' . $v( 'hv_route_price' ) . '"></label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<p><label>Thời gian chạy (vd. <code>2h</code>)<br><input type="text" class="widefat" name="hv_route_time" value="' . $v( 'hv_route_time' ) . '"></label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<p class="description">Ảnh tuyến: đặt Ảnh đại diện. Thứ tự: thuộc tính "Thứ tự" (menu order).</p>';
}

add_action(
	'save_post_hv_route',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_route_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_route_nonce'] ) ), 'hv_route_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$path = isset( $_POST['hv_route_path'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['hv_route_path'] ) ), '/' ) : '';
		update_post_meta( $post_id, 'hv_route_path', hv_valid_route_path( $path ) ? $path : '' );
		foreach ( array( 'hv_route_price', 'hv_route_time' ) as $k ) {
			update_post_meta( $post_id, $k, isset( $_POST[ $k ] ) ? sanitize_text_field( wp_unslash( $_POST[ $k ] ) ) : '' );
		}
	}
);

/* Hiển thị -------------------------------------------------------------- */

/**
 * @param array<string,string>|string $atts Thuộc tính shortcode (limit).
 */
function hv_popular_routes_shortcode( $atts = array() ) {
	$atts = shortcode_atts( array( 'limit' => '12' ), is_array( $atts ) ? $atts : array(), 'haivan_popular_routes' );
	$q    = new WP_Query(
		array(
			'post_type'        => 'hv_route',
			'post_status'      => 'publish',
			'posts_per_page'   => max( 1, min( 24, (int) $atts['limit'] ) ),
			'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'no_found_rows'    => true,
			'suppress_filters' => true, // tuyến dùng chung cho vi/en.
		)
	);
	if ( ! $q->have_posts() ) {
		return '';
	}
	$prefix = hv_lang_prefix();
	ob_start();
	echo '<ul class="hv-routes">';
	while ( $q->have_posts() ) {
		$q->the_post();
		$id   = get_the_ID();
		$path = (string) get_post_meta( $id, 'hv_route_path', true );
		if ( ! hv_valid_route_path( $path ) ) {
			continue;
		}
		$price = (string) get_post_meta( $id, 'hv_route_price', true );
		$time  = (string) get_post_meta( $id, 'hv_route_time', true );
		$meta  = trim( $price . ( '' !== $price && '' !== $time ? ' · ' : '' ) . $time );
		echo '<li class="hv-route"><a href="' . esc_url( $prefix . '/xe-khach/' . $path ) . '">';
		if ( has_post_thumbnail( $id ) ) {
			echo wp_get_attachment_image( get_post_thumbnail_id( $id ), 'medium_large', false, array( 'class' => 'hv-route__img', 'loading' => 'lazy', 'decoding' => 'async', 'alt' => hv_image_alt( $id ) ) );
		} else {
			echo '<span class="hv-route__img hv-route__img--empty" aria-hidden="true"></span>';
		}
		echo '<span class="hv-route__body"><strong class="hv-route__name">' . esc_html( get_the_title() ) . '</strong>';
		if ( '' !== $meta ) {
			echo '<span class="hv-route__meta">' . esc_html( $meta ) . '</span>';
		}
		echo '<span class="hv-route__cta">' . esc_html( hv_t( 'book_route' ) ) . '</span></span></a></li>';
	}
	echo '</ul>';
	wp_reset_postdata();
	return (string) ob_get_clean();
}
add_shortcode( 'haivan_popular_routes', 'hv_popular_routes_shortcode' );
