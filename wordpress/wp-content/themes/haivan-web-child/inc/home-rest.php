<?php
/**
 * REST GET /wp-json/haivan-web/v1/home (chỉ đọc, công khai): banner và ưu đãi đang hiệu lực cho Next dùng lại.
 * Cache 10 phút (transient + Cache-Control); xoá cache ngay khi MKT lưu/xoá banner hay ưu đãi.
 * Ảnh trả về là đường dẫn tương đối (/assets/... hoặc /wp-content/uploads/...). Liên kết là đường dẫn nội bộ hoặc https.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HV_HOME_REST_KEY = 'hv_home_rest_v1';
const HV_HOME_REST_TTL = 600;

/** Bỏ khoá rỗng/null để payload gọn. */
function hv_rest_compact( array $a ) {
	return array_filter( $a, static fn( $v ) => null !== $v && '' !== $v );
}

/** @return array{url:string,width:int,height:int}|null */
function hv_rest_image( $img ) {
	return $img ? array( 'url' => $img['url'], 'width' => (int) $img['w'], 'height' => (int) $img['h'] ) : null;
}

/** @return array<string,mixed> */
function hv_home_rest_payload() {
	$banners = array();
	foreach ( hv_active_banners( 'web' ) as $b ) {
		$row = array(
			'id'    => $b['id'],
			'kind'  => $b['kind'],
			'title' => $b['title'],
			'link'  => $b['link'],
		);
		if ( 'designed' === $b['kind'] ) {
			$row += array(
				'eyebrow'  => $b['eyebrow'],
				'headline' => $b['headline'],
				'sub'      => $b['sub'],
				'button'   => $b['btn'],
				'tone'     => $b['tone'],
				'cutout'   => hv_rest_image( $b['cutout'] ),
			);
		} else {
			$row += array( 'desktop' => hv_rest_image( $b['desktop'] ), 'mobile' => hv_rest_image( $b['mobile'] ) );
		}
		$banners[] = hv_rest_compact( $row );
	}
	$offers = array();
	foreach ( hv_active_offers() as $o ) {
		$offers[] = hv_rest_compact(
			array(
				'id'          => $o['id'],
				'title'       => $o['title'],
				'badge'       => $o['badge'],
				'badge_style' => $o['badge_style'],
				'price'       => $o['price'],
				'unit'        => $o['unit'],
				'condition'   => $o['cond'],
				'tone'        => $o['tone'],
				'image'       => hv_rest_image( $o['image'] ),
				'icon'        => $o['icon'],
				'link'        => $o['link'],
				'cta'         => $o['cta'],
				'ends'        => $o['end'],
			)
		);
	}
	return array( 'banners' => $banners, 'offers' => $offers );
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'haivan-web/v1',
			'/home',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					$data = get_transient( HV_HOME_REST_KEY );
					if ( ! is_array( $data ) ) {
						$data = hv_home_rest_payload();
						set_transient( HV_HOME_REST_KEY, $data, HV_HOME_REST_TTL );
					}
					return new WP_REST_Response( $data, 200 );
				},
			)
		);
	}
);

/** Cache-Control công khai 10 phút (core mặc định gửi no-cache cho REST). */
add_filter(
	'rest_post_dispatch',
	static function ( $response, $server, $request ) {
		if ( '/haivan-web/v1/home' === $request->get_route() && $response instanceof WP_REST_Response && 200 === $response->get_status() ) {
			$response->header( 'Cache-Control', 'public, max-age=' . HV_HOME_REST_TTL );
			$response->header( 'Access-Control-Allow-Origin', '*' );
		}
		return $response;
	},
	99,
	3
);

/** Xoá cache khi banner/ưu đãi đổi. */
function hv_home_rest_flush( $post_id ) {
	if ( in_array( get_post_type( $post_id ), array( 'hv_banner', 'hv_offer' ), true ) ) {
		delete_transient( HV_HOME_REST_KEY );
	}
}
foreach ( array( 'save_post', 'deleted_post', 'trashed_post', 'untrashed_post' ) as $hv_hook ) {
	add_action( $hv_hook, 'hv_home_rest_flush' );
}
