<?php
/**
 * REST GET /wp-json/haivan-web/v1/route/<a>/<b>: nội dung landing tuyến theo hợp đồng
 * docs/route-landing-contract.md (zod: apps/booking/src/schemas/route-landing.ts).
 * Có bài hv_route xuất bản với hv_route_path = a/b -> 200; chưa có -> 404 (Next dùng CMS + mẫu).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Các dòng không rỗng của một ô nhiều dòng. */
function hv_route_lines( $text ) {
	return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', (string) $text ) ?: array() ), static fn( $l ) => '' !== $l ) );
}

/** Tách một dòng "a | b | c" thành mảng đã trim. */
function hv_route_cells( $line, $min ) {
	$p = array_map( 'trim', explode( '|', $line ) );
	return count( $p ) >= $min && '' !== $p[0] ? $p : null;
}

/** Chỉ nhận http/https cho map_url. */
function hv_route_http( $u ) {
	return esc_url_raw( trim( (string) $u ), array( 'http', 'https' ) );
}

/** @return array{label:string,path:string}|null */
function hv_route_link_from( $line ) {
	$p = hv_route_cells( $line, 2 );
	return $p && 1 === preg_match( '#^[a-z0-9-]+/[a-z0-9-]+$#', $p[1] ) ? array( 'label' => $p[0], 'path' => $p[1] ) : null;
}

/**
 * Payload hợp đồng của một bài hv_route; trường chưa nhập bị bỏ.
 *
 * @param WP_Post $post Bài tuyến.
 * @return array<string,mixed>
 */
function hv_route_payload( WP_Post $post ) {
	$m   = static fn( $k ) => (string) get_post_meta( $post->ID, $k, true );
	$out = array( 'path' => $m( 'hv_route_path' ) );
	foreach ( array( 'seo_title', 'meta_description', 'h1', 'intro', 'round_trip_note' ) as $k ) {
		if ( '' !== trim( $m( 'hv_route_' . $k ) ) ) {
			$out[ $k ] = trim( $m( 'hv_route_' . $k ) );
		}
	}
	foreach ( array( 'schedule_text', 'content_html' ) as $k ) {
		$html = hv_route_clean_html( $m( 'hv_route_' . $k ) ); // lọc lại khi xuất: bài nhập bằng WP-CLI không qua kses.
		if ( '' !== trim( $html ) ) {
			$out[ $k ] = $html;
		}
	}
	$list = static function ( $key, callable $map ) use ( $m ) {
		$items = array();
		foreach ( hv_route_lines( $m( $key ) ) as $line ) {
			$item = $map( $line );
			if ( $item ) {
				$items[] = $item;
			}
		}
		return $items;
	};
	$faq = $list( 'hv_route_faq', static function ( $l ) {
		$p = hv_route_cells( $l, 2 );
		return $p && '' !== $p[1] ? array( 'q' => $p[0], 'a' => wp_strip_all_tags( implode( ' | ', array_slice( $p, 1 ) ) ) ) : null;
	} );
	$pickup = $list( 'hv_route_pickup_points', static function ( $l ) {
		$p = hv_route_cells( $l, 2 );
		return $p && '' !== $p[1] ? array_filter( array( 'name' => $p[0], 'address' => $p[1], 'note' => $p[2] ?? '' ), static fn( $v ) => '' !== $v ) : null;
	} );
	$offices = $list( 'hv_route_offices', static function ( $l ) {
		$p = hv_route_cells( $l, 2 );
		if ( ! $p || '' === $p[1] ) {
			return null;
		}
		return array_filter( array( 'name' => $p[0], 'address' => $p[1], 'hours' => $p[2] ?? '', 'note' => $p[3] ?? '', 'map_url' => hv_route_http( $p[4] ?? '' ) ), static fn( $v ) => '' !== $v );
	} );
	$classes = $list( 'hv_route_vehicle_classes', static function ( $l ) {
		$p = hv_route_cells( $l, 1 );
		if ( ! $p ) {
			return null;
		}
		$seats = isset( $p[1] ) && ctype_digit( $p[1] ) && (int) $p[1] > 0 ? (int) $p[1] : null;
		$amen  = array_values( array_filter( array_map( 'trim', explode( ';', $p[4] ?? '' ) ), static fn( $v ) => '' !== $v ) );
		return array_filter( array( 'name' => $p[0], 'seats' => $seats, 'price_from' => $p[2] ?? '', 'text' => $p[3] ?? '', 'amenities' => $amen ), static fn( $v ) => null !== $v && '' !== $v && array() !== $v );
	} );
	$related = $list( 'hv_route_related', 'hv_route_link_from' );
	foreach ( array( 'faq' => $faq, 'pickup_points' => $pickup, 'offices' => $offices, 'vehicle_classes' => $classes, 'related_routes' => $related ) as $k => $v ) {
		if ( $v ) {
			$out[ $k ] = $v;
		}
	}
	$rev = '' !== trim( $m( 'hv_route_reverse' ) ) ? hv_route_link_from( trim( $m( 'hv_route_reverse' ) ) ) : null;
	if ( $rev ) {
		$out['reverse_route'] = $rev;
	}
	$out['updated_at'] = wp_date( 'c', (int) strtotime( $post->post_modified_gmt . ' UTC' ) );
	return $out;
}

/** Bài tuyến xuất bản có hv_route_path = $path, hoặc null. */
function hv_route_find( $path ) {
	$posts = get_posts(
		array(
			'post_type'        => 'hv_route',
			'post_status'      => 'publish',
			'numberposts'      => 1,
			'meta_key'         => 'hv_route_path', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => $path, // phpcs:ignore WordPress.DB.SlowDBQuery
			'orderby'          => 'ID',
			'order'            => 'ASC',
			'suppress_filters' => true,
		)
	);
	return $posts ? $posts[0] : null;
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'haivan-web/v1',
			'/route/(?P<a>[a-z0-9-]+)/(?P<b>[a-z0-9-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'args'                => array(
					'a' => array( 'type' => 'string', 'pattern' => '^[a-z0-9-]+$' ),
					'b' => array( 'type' => 'string', 'pattern' => '^[a-z0-9-]+$' ),
				),
				'callback'            => static function ( WP_REST_Request $req ) {
					$path = $req['a'] . '/' . $req['b'];
					$post = hv_route_find( $path );
					if ( ! $post ) {
						return new WP_REST_Response( array( 'code' => 'hv_route_not_found', 'message' => 'Chưa có nội dung cho tuyến này.' ), 404 );
					}
					return new WP_REST_Response( hv_route_payload( $post ), 200 );
				},
			)
		);
	}
);

/** Công khai, cache 1 giờ cho 200 (404 ngắn hơn để bài mới lên nhanh). Đặt sau mọi filter của core. */
add_filter(
	'rest_post_dispatch',
	static function ( $response, $server, $request ) {
		if ( 0 === strpos( (string) $request->get_route(), '/haivan-web/v1/route/' ) && $response instanceof WP_REST_Response ) {
			$status = $response->get_status();
			if ( 200 === $status ) {
				$response->header( 'Cache-Control', 'public, max-age=3600' );
			} elseif ( 404 === $status ) {
				$response->header( 'Cache-Control', 'public, max-age=300' );
			}
		}
		return $response;
	},
	999,
	3
);
