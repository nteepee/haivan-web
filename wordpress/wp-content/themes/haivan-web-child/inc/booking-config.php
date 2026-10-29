<?php
/**
 * REST GET /wp-json/haivan-web/v1/booking-config: 4 tuyến chính + chương trình giảm giá đang chạy, theo hợp đồng
 * plans/261029-1444-core-routes-search-promos/contract.md (version 1). Công khai, Cache-Control public max-age=300.
 *
 * hv_booking_config() là nguồn duy nhất: REST trả đúng mảng này, còn ô tìm vé [haivan_search] nhúng cùng mảng
 * dưới dạng JSON inline (không gọi REST lần nữa).
 *
 * Chương trình chỉ xuất khi: bài đã xuất bản + bật + có mã ERP + hôm nay (giờ Việt Nam) nằm trong [book_from, book_to]
 * + tuyến của nó đang bật. Mã ERP KHÔNG nằm trong dữ liệu công khai (chỉ có has_code: true): mã đi qua
 * GET /wp-json/haivan-web/v1/promo-codes, chỉ trả khi header X-HV-Secret khớp HV_WP_SHARED_SECRET (server Next gọi, xem cuối tệp).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @param string|null $today      "YYYY-MM-DD" giờ Việt Nam (null = hôm nay); tham số để kiểm thử.
 * @param bool        $with_codes true = giữ trường code (chỉ cho hv_promo_codes(), không bao giờ ra HTML/REST công khai).
 * @return array{version:int,corridors:array<int,array<string,mixed>>,promos:array<int,array<string,mixed>>}
 */
function hv_booking_config( $today = null, $with_codes = false ) {
	$today     = $today ?? hv_today_vn();
	$corridors = hv_corridors_enabled();
	$live      = array_flip( array_column( $corridors, 'id' ) );
	$promos    = array();
	if ( $live ) {
		$posts = get_posts(
			array(
				'post_type'        => 'hv_promo',
				'post_status'      => 'publish',
				'numberposts'      => -1,
				'orderby'          => array( 'ID' => 'ASC' ),
				'suppress_filters' => true,
				'meta_key'         => 'hv_promo_enabled', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'       => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
			)
		);
		foreach ( $posts as $p ) {
			$promo = hv_promo_payload( $p->ID );
			if ( ! $promo || ! isset( $live[ $promo['corridor'] ] ) ) {
				continue;
			}
			if ( ( null !== $promo['book_from'] && $promo['book_from'] > $today ) || ( null !== $promo['book_to'] && $promo['book_to'] < $today ) ) {
				continue;
			}
			if ( ! $with_codes ) {
				unset( $promo['code'] );
				$promo['has_code'] = true; // hv_promo_payload chỉ trả chương trình có mã hợp lệ.
			}
			$promos[] = $promo;
		}
	}
	return array(
		'version'   => 1,
		'corridors' => $corridors,
		'promos'    => $promos,
	);
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'haivan-web/v1',
			'/booking-config',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static fn() => new WP_REST_Response( hv_booking_config(), 200 ),
			)
		);
	}
);

/** Công khai, cache 5 phút (ngắn để bật/tắt chương trình có hiệu lực nhanh). Đặt sau mọi filter của core. */
add_filter(
	'rest_post_dispatch',
	static function ( $response, $server, $request ) {
		if ( '/haivan-web/v1/booking-config' === $request->get_route() && $response instanceof WP_REST_Response && 200 === $response->get_status() ) {
			$response->header( 'Cache-Control', 'public, max-age=300' );
		}
		return $response;
	},
	999,
	3
);

/**
 * Mã ERP theo chương trình đang chạy: { "<id chương trình>": "<mã>" }, cùng bộ lọc với booking-config công khai.
 *
 * @return array<string,string>
 */
function hv_promo_codes() {
	$codes = array();
	foreach ( hv_booking_config( null, true )['promos'] as $promo ) {
		$codes[ (string) $promo['id'] ] = (string) $promo['code'];
	}
	return $codes;
}

/**
 * Mọi mã của mọi bài hv_promo (kể cả tắt, nháp, hết hạn) để BFF che mã trong response/log. Chỉ trả qua /promo-codes có bí mật.
 *
 * @return string[]
 */
function hv_promo_all_codes() {
	global $wpdb;
	$rows = $wpdb->get_col( "SELECT DISTINCT m.meta_value FROM {$wpdb->postmeta} m INNER JOIN {$wpdb->posts} p ON p.ID = m.post_id WHERE m.meta_key = 'hv_promo_code' AND m.meta_value <> '' AND p.post_type = 'hv_promo'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	return array_values( array_filter( array_map( 'strval', (array) $rows ), 'hv_promo_valid_code' ) );
}

/** Bí mật dùng chung WP <-> server Next: hằng HV_WP_SHARED_SECRET hoặc biến môi trường cùng tên; trống = tắt endpoint. */
function hv_shared_secret() {
	$secret = defined( 'HV_WP_SHARED_SECRET' ) ? (string) HV_WP_SHARED_SECRET : (string) getenv( 'HV_WP_SHARED_SECRET' );
	return strlen( $secret ) >= 16 ? $secret : '';
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'haivan-web/v1',
			'/promo-codes',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => static function ( WP_REST_Request $req ) {
					$secret = hv_shared_secret();
					$given  = (string) $req->get_header( 'X-HV-Secret' );
					if ( '' !== $secret && '' !== $given && hash_equals( $secret, $given ) ) {
						return true;
					}
					return new WP_Error( 'hv_forbidden', 'Forbidden', array( 'status' => 403 ) );
				},
				'callback'            => static fn() => new WP_REST_Response( array( 'codes' => (object) hv_promo_codes(), 'mask' => hv_promo_all_codes() ), 200 ),
			)
		);
	}
);

/** Mã không bao giờ vào cache dùng chung (nginx, CDN, trình duyệt), kể cả khi trả 403. */
add_filter(
	'rest_post_dispatch',
	static function ( $response, $server, $request ) {
		if ( '/haivan-web/v1/promo-codes' === $request->get_route() && $response instanceof WP_REST_Response ) {
			$response->header( 'Cache-Control', 'no-store, private' );
		}
		return $response;
	},
	999,
	3
);
