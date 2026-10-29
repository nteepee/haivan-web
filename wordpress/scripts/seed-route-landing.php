<?php
/**
 * wp eval-file /scripts/seed-route-landing.php
 * Điền nội dung landing (meta hv_route_*) cho các hướng đã có bài hv_route (lib/route-landing-seed.php, 8 hướng: Sài Gòn ⇄ Vũng Tàu, Hà Nội ⇄ Điện Biên / Sơn La / Mộc Châu).
 * Idempotent và an toàn với MKT: bài đã có dấu hv_route_landing_seed (đã seed) hoặc đã có bất kỳ trường landing nào thì GIỮ NGUYÊN.
 * Hướng chưa có bài hv_route bị bỏ qua và liệt kê (seed-route-posts.php tạo bài còn thiếu).
 * Biến: HV_DRY_RUN=1 chỉ báo cáo; HV_FORCE=1 ghi đè.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
$dry   = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$force = '1' === (string) ( getenv( 'HV_FORCE' ) ?: '0' );
$seed  = require __DIR__ . '/lib/route-landing-seed.php';
$keys  = array(
	'seo_title' => 'hv_route_seo_title', 'meta_description' => 'hv_route_meta_description', 'h1' => 'hv_route_h1', 'intro' => 'hv_route_intro',
	'schedule_text' => 'hv_route_schedule_text', 'content_html' => 'hv_route_content_html', 'faq' => 'hv_route_faq',
	'pickup_points' => 'hv_route_pickup_points', 'offices' => 'hv_route_offices', 'vehicle_classes' => 'hv_route_vehicle_classes',
	'related' => 'hv_route_related', 'reverse' => 'hv_route_reverse', 'round_trip_note' => 'hv_route_round_trip_note',
);
$n = 0;
foreach ( $seed as $path => $d ) {
	$post = hv_route_find( $path );
	if ( ! $post ) {
		WP_CLI::warning( "{$path}: chưa có bài hv_route xuất bản, bỏ qua" );
		continue;
	}
	$has = false;
	foreach ( $keys as $meta ) {
		if ( '' !== (string) get_post_meta( $post->ID, $meta, true ) ) {
			$has = true;
			break;
		}
	}
	if ( ! $force && ( $has || get_post_meta( $post->ID, 'hv_route_landing_seed', true ) ) ) {
		WP_CLI::log( "= {$path}: đã có nội dung landing (#{$post->ID}), giữ nguyên" );
		continue;
	}
	$warn = array();
	if ( mb_strlen( $d['seo_title'] ) > 60 ) {
		$warn[] = 'title ' . mb_strlen( $d['seo_title'] );
	}
	if ( mb_strlen( $d['meta_description'] ) > 155 ) {
		$warn[] = 'meta ' . mb_strlen( $d['meta_description'] );
	}
	WP_CLI::log( "+ {$path} (#{$post->ID}) " . ( $warn ? '[quá dài: ' . implode( ', ', $warn ) . ']' : '' ) );
	if ( $dry ) {
		continue;
	}
	foreach ( $keys as $k => $meta ) {
		$v = (string) ( $d[ $k ] ?? '' );
		$v = in_array( $k, array( 'schedule_text', 'content_html' ), true ) ? hv_route_clean_html( $v ) : $v;
		update_post_meta( $post->ID, $meta, $v );
	}
	update_post_meta( $post->ID, 'hv_route_landing_seed', '1' );
	++$n;
}
WP_CLI::log( 'Chưa có dữ kiện landing (không bịa): Điện Biên – Hà Nội khứ hồi, Yên Nghĩa → Điện Biên, Mỹ Đình → Bản Phủ / Mường Chà, Tân Sơn Nhất ⇄ Vũng Tàu. Bài hv_route cho các hướng có landing: chạy seed-route-posts.php (tạo bài còn thiếu rồi gọi script này).' );
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "seed {$n} hướng." );
