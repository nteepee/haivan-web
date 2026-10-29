<?php
/**
 * wp eval-file /scripts/seed-banners.php
 * Tạo banner trang chủ (hv_banner) MỘT LẦN, chạy lại không tạo trùng và không sửa banner MKT đã có (khoá meta hv_banner_seed).
 *  - 2 banner /assets/page (đã dùng ở comp trang chủ): ảnh nằm ở Next (/assets/...), không chép vào theme/Media.
 *  - Banner của CMS cũ (GET https://cms.haivan.com/api/list-banner): mobile_banner -> banner chỉ hiện trên điện thoại,
 *    web_banner -> banner desktop, web_popup -> popup, app_banner (dành cho app) -> nháp. Ảnh tải vào Media.
 * Biến: HV_DRY_RUN=1 chỉ báo cáo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/cms-media.php';

$dry = '1' === getenv( 'HV_DRY_RUN' );

$seeds = array(
	'assets-page1' => array( 'title' => 'Đặt xe limousine sân bay Tân Sơn Nhất, TP. Hồ Chí Minh, Vũng Tàu', 'type' => 'web', 'order' => 1, 'link' => '/xe-san-bay', 'desktop_url' => '/assets/page/page1.jpg' ),
	'assets-page2' => array( 'title' => 'Tặng bạn 50k khi đặt vé lần đầu qua ứng dụng Hải Vân', 'type' => 'web', 'order' => 2, 'link' => '/dat-ve-nhanh', 'desktop_url' => '/assets/page/page2.jpg' ),
);

// Banner của CMS cũ (chỉ GET).
$res = wp_remote_get( 'https://cms.haivan.com/api/list-banner', array( 'timeout' => 20, 'headers' => array( 'Accept' => 'application/json' ) ) );
$cms = array();
if ( ! is_wp_error( $res ) && 200 === wp_remote_retrieve_response_code( $res ) ) {
	$json = json_decode( wp_remote_retrieve_body( $res ), true );
	$cms  = is_array( $json['data'] ?? null ) ? $json['data'] : array();
} else {
	WP_CLI::warning( 'Không đọc được list-banner của CMS: chỉ tạo 2 banner /assets/page.' );
}
// Mô tả (alt) theo nội dung ảnh đã xem: CMS đặt tên "Mặc định"/"Mobile banner_13102023" không đủ làm alt.
$cms_titles = array(
	141 => 'Dịch vụ Hải Vân: xe sân bay, xe liên tỉnh, vận chuyển hàng hoá, xe hợp đồng. Hotline 1900 6763',
	177 => 'Banner ứng dụng Hải Vân (CMS 177, dành cho app, để nháp)',
);
$order = 3;
foreach ( $cms as $b ) {
	$id    = (int) ( $b['id'] ?? 0 );
	$image = hvc_asset_url( (string) ( $b['image'] ?? '' ) );
	if ( $id <= 0 || ! $image || empty( $b['is_active'] ) ) {
		continue;
	}
	$type  = (string) ( $b['type'] ?? '' );
	$title = trim( wp_strip_all_tags( (string) ( $b['name'] ?? '' ) ) );
	$link  = (string) ( $b['link'] ?? '' );
	$seeds[ 'cms-' . $id ] = array(
		'title'      => $cms_titles[ $id ] ?? ( '' !== $title ? $title : 'Banner Hải Vân (CMS ' . $id . ')' ),
		'type'       => 'web_popup' === $type ? 'popup' : 'web',
		'order'      => $order++,
		'link'       => 1 === preg_match( '#^https?://#', $link ) ? $link : '',
		'cms_image'  => $image,
		'cms_kind'   => $type,
		'status'     => 'app_banner' === $type ? 'draft' : 'publish', // app_banner là banner trong app, không dành cho web.
		'start'      => substr( str_replace( ' ', 'T', (string) ( $b['start_time'] ?? '' ) ), 0, 16 ),
		'end'        => substr( str_replace( ' ', 'T', (string) ( $b['end_time'] ?? '' ) ), 0, 16 ),
	);
}

$made = 0;
foreach ( $seeds as $key => $d ) {
	$exists = get_posts( array( 'post_type' => 'hv_banner', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_banner_seed', 'meta_value' => $key, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( $exists ) {
		WP_CLI::log( "= {$key}: đã có (#{$exists[0]}), giữ nguyên" );
		continue;
	}
	if ( get_posts( array( 'post_type' => 'hv_banner', 'post_status' => 'trash', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_banner_seed', 'meta_value' => $key ) ) ) { // phpcs:ignore WordPress.DB.SlowDBQuery
		WP_CLI::log( "= {$key}: MKT đã xoá, không tạo lại" );
		continue;
	}
	WP_CLI::log( "+ {$key}: {$d['title']} [{$d['type']}, " . ( $d['status'] ?? 'publish' ) . ']' );
	if ( $dry ) {
		continue;
	}
	$id = wp_insert_post(
		array(
			'post_type'   => 'hv_banner',
			'post_status' => $d['status'] ?? 'publish',
			'post_title'  => $d['title'],
			'menu_order'  => $d['order'],
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $id->get_error_message() );
		continue;
	}
	update_post_meta( $id, 'hv_banner_seed', $key );
	update_post_meta( $id, 'hv_banner_type', $d['type'] );
	update_post_meta( $id, 'hv_banner_link', $d['link'] );
	update_post_meta( $id, 'hv_banner_start', $d['start'] ?? '' );
	update_post_meta( $id, 'hv_banner_end', $d['end'] ?? '' );
	if ( ! empty( $d['desktop_url'] ) ) {
		update_post_meta( $id, 'hv_banner_desktop_url', $d['desktop_url'] );
	}
	if ( ! empty( $d['cms_image'] ) ) {
		update_post_meta( $id, 'hv_banner_cms_id', (string) $key );
		$att = hvs_sideload( $d['cms_image'], $id, $d['title'] );
		if ( ! $att ) {
			WP_CLI::warning( "  không tải được ảnh {$d['cms_image']}" );
		} elseif ( 'mobile_banner' === $d['cms_kind'] ) {
			update_post_meta( $id, 'hv_banner_mobile_id', (string) $att ); // chỉ ảnh điện thoại: banner chỉ hiện trên điện thoại.
		} else {
			set_post_thumbnail( $id, $att );
		}
	}
	++$made;
}
WP_CLI::success( ( $dry ? '(thử) ' : '' ) . "tạo {$made} banner." );
