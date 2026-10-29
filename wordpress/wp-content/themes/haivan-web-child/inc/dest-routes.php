<?php
/**
 * Trang điểm đến: khối H2 "Xe Hải Vân đi {X}" liên kết các tuyến /xe-khach/... liên quan.
 * Tự suy từ hv_route_path chứa slug điểm đến; MKT ghi đè bằng meta hv_dest_route_paths của bài Điểm đến
 * (mỗi dòng một đường dẫn a/b, thứ tự là thứ tự hiện).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** @return array<int,array{path:string,post:WP_Post}> Mọi tuyến xuất bản có đường dẫn hợp lệ (theo thứ tự MKT). */
function hv_all_routes() {
	static $routes = null;
	if ( null === $routes ) {
		$routes = array();
		$posts  = get_posts(
			array(
				'post_type'        => 'hv_route',
				'post_status'      => 'publish',
				'numberposts'      => 100,
				'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
				'suppress_filters' => true,
			)
		);
		foreach ( $posts as $p ) {
			$path = (string) get_post_meta( $p->ID, 'hv_route_path', true );
			if ( hv_valid_route_path( $path ) ) {
				$routes[] = array( 'path' => $path, 'post' => $p );
			}
		}
	}
	return $routes;
}

/**
 * Tuyến liên quan của một điểm đến: ghi đè của MKT nếu có, không thì tuyến có đường dẫn chứa slug
 * (tuyến mà điểm đến là đích đứng trước).
 *
 * @param string $slug    Slug điểm đến.
 * @param int    $post_id Bài điểm đến (đọc meta ghi đè), 0 = không có.
 * @return array<int,array{path:string,post:WP_Post}>
 */
function hv_dest_routes( $slug, $post_id = 0 ) {
	$all      = hv_all_routes();
	$override = $post_id ? hv_route_lines( (string) get_post_meta( $post_id, 'hv_dest_route_paths', true ) ) : array();
	if ( $override ) {
		$by_path = array();
		foreach ( $all as $r ) {
			$by_path[ $r['path'] ] = $r;
		}
		$out = array();
		foreach ( $override as $path ) {
			if ( isset( $by_path[ $path ] ) ) {
				$out[] = $by_path[ $path ];
			}
		}
		return $out;
	}
	$slug = strtolower( trim( (string) $slug ) );
	if ( strlen( $slug ) < 3 ) {
		return array();
	}
	$to = array();
	$in = array();
	foreach ( $all as $r ) {
		$segs = explode( '/', $r['path'] );
		if ( end( $segs ) === $slug ) {
			$to[] = $r;
		} elseif ( false !== strpos( $r['path'], $slug ) ) {
			$in[] = $r;
		}
	}
	return array_merge( $to, $in );
}

/** Tuyến đầu tiên của một điểm đến (dùng cho CTA trong bài), hoặc chuỗi rỗng. */
function hv_route_for_destination( $slug ) {
	$r = hv_dest_routes( $slug );
	return $r ? $r[0]['path'] : '';
}

/** In khối H2 "Xe Hải Vân đi {X}" + thẻ tuyến; không có tuyến thì in dải CTA chung. */
function hv_render_dest_routes( $name, $slug, $post_id ) {
	$routes = hv_dest_routes( $slug, $post_id );
	if ( ! $routes ) {
		echo hv_cta_shortcode(); // phpcs:ignore WordPress.Security.EscapeOutput -- đã escape trong hv_cta_shortcode().
		return;
	}
	$prefix = hv_lang_prefix();
	echo '<section class="hv-dest-routes" aria-labelledby="hv-dest-routes"><h2 id="hv-dest-routes">' . esc_html( sprintf( hv_t( 'dest_routes' ), $name ) ) . '</h2><ul class="hv-dest-routes__list">';
	foreach ( $routes as $r ) {
		$id    = $r['post']->ID;
		$price = trim( preg_replace( '/^\s*Từ\s*/iu', '', (string) get_post_meta( $id, 'hv_route_price', true ) ) );
		$time  = hv_route_time_label( get_post_meta( $id, 'hv_route_time', true ) );
		$label = hv_route_label( get_the_title( $r['post'] ) );
		echo '<li class="hv-dest-route"><div><h3>' . esc_html( $label ) . '</h3><p class="hv-muted">';
		echo '' !== $time ? esc_html( $time ) : '';
		echo '' !== $time && '' !== $price ? ' · ' : '';
		echo '' !== $price ? esc_html( hv_t( 'from_price' ) . ' ' . $price ) : '';
		echo '</p></div><a class="hv-btn hv-btn--sm" href="' . esc_url( $prefix . '/xe-khach/' . $r['path'] ) . '" aria-label="' . esc_attr( sprintf( hv_t( 'book_route_aria' ), $label ) ) . '">' . esc_html( hv_t( 'booking_label' ) ) . '</a></li>';
	}
	echo '</ul><p><a class="hv-link" href="' . esc_url( $prefix . '/xe-khach' ) . '">' . esc_html( hv_t( 'dest_routes_all' ) ) . '</a></p></section>';
}

/* Meta box ghi đè trên bài Điểm đến ------------------------------------- */

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box(
			'hv-dest-routes',
			'Tuyến xe liên quan (khối "Xe Hải Vân đi ...")',
			static function ( $post ) {
				wp_nonce_field( 'hv_dest_routes_save', 'hv_dest_routes_nonce' );
				echo '<p class="description">Để trống: tự lấy các tuyến có đường dẫn chứa slug điểm đến (' . esc_html( $post->post_name ) . '). Muốn chọn tay: mỗi dòng một đường dẫn tuyến, vd. <code>my-dinh/dien-bien</code>.</p>';
				echo '<textarea class="widefat" rows="4" name="hv_dest_route_paths">' . esc_textarea( (string) get_post_meta( $post->ID, 'hv_dest_route_paths', true ) ) . '</textarea>';
			},
			'diem_den',
			'side'
		);
	}
);

add_action(
	'save_post_diem_den',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_dest_routes_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_dest_routes_nonce'] ) ), 'hv_dest_routes_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$lines = hv_route_lines( isset( $_POST['hv_dest_route_paths'] ) ? sanitize_textarea_field( wp_unslash( $_POST['hv_dest_route_paths'] ) ) : '' );
		$lines = array_values( array_filter( $lines, 'hv_valid_route_path' ) );
		update_post_meta( $post_id, 'hv_dest_route_paths', implode( "\n", $lines ) );
	}
);
