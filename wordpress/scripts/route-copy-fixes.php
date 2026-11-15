<?php
/**
 * wp eval-file /scripts/route-copy-fixes.php   (dry-run mặc định; HV_APPLY=1 để ghi)
 *
 * Sửa câu chữ trang tuyến theo góp ý biên tập: thay chuỗi cố định trong mọi meta hv_route_* của bài hv_route,
 * giữ nguyên phần MKT đã sửa tay ở chỗ khác. Cùng danh sách đã sửa trong lib/route-landing-seed*.php để seed lại không mất.
 * Idempotent: chạy lại không đổi gì khi chuỗi gốc không còn.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

$apply = '1' === (string) ( getenv( 'HV_APPLY' ) ?: '0' );
$pairs = require __DIR__ . '/lib/route-copy-fixes-pairs.php';

global $wpdb;
$rows = $wpdb->get_results(
	"SELECT m.meta_id, m.post_id, m.meta_key, m.meta_value FROM {$wpdb->postmeta} m
	 JOIN {$wpdb->posts} p ON p.ID = m.post_id
	 WHERE p.post_type = 'hv_route' AND m.meta_key LIKE 'hv\\_route\\_%'"
);
$n = 0;
foreach ( $rows as $r ) {
	$v = $r->meta_value;
	if ( is_serialized( $v ) ) {
		continue;
	}
	$new = strtr( $v, $pairs );
	if ( $new === $v ) {
		continue;
	}
	++$n;
	WP_CLI::log( sprintf( '%s #%d %s', $apply ? '~' : '[dry]', $r->post_id, $r->meta_key ) );
	if ( $apply ) {
		update_post_meta( (int) $r->post_id, $r->meta_key, wp_slash( $new ), $v );
	}
}
if ( $apply && $n ) {
	wp_cache_flush();
}
WP_CLI::success( ( $apply ? '' : '[dry-run] ' ) . "{$n} trường cần sửa." );
