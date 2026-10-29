<?php
/**
 * wp eval-file /scripts/set-page-order.php
 * Đặt "Thứ tự" (menu_order) của trang tĩnh theo thứ tự trong lib/pages-manifest.php (khớp menu web cũ), để thanh điều hướng cùng mục
 * trên trang nội dung đúng thứ tự. Idempotent và an toàn với MKT: chỉ đổi trang đang có menu_order = 0 (chưa ai xếp tay).
 * Biến: HV_DRY_RUN=1.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
$dry      = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$manifest = require __DIR__ . '/lib/pages-manifest.php';
global $wpdb;
$n = 0;
$i = 0;
foreach ( array_keys( $manifest['pages'] ) as $path ) {
	++$i;
	foreach ( array( 'vi', 'en' ) as $lang ) {
		$id = (int) hvs_find_page( $path, $lang );
		if ( ! $id ) {
			continue;
		}
		$order = (int) get_post_field( 'menu_order', $id );
		$p     = get_post( $id );
		// Dấu nhập (hv_imported_hash) tính cả menu_order: bài còn nguyên bản nhập thì đóng dấu lại để importer không coi là MKT đã sửa.
		$stamp    = (string) get_post_meta( $id, 'hv_imported_hash', true );
		$pristine = '' !== $stamp && $stamp === md5( implode( "\0", array( $p->post_title, $p->post_content, $p->post_excerpt, (string) $order ) ) );
		$stale    = '' !== $stamp && ! $pristine && $order > 0 && $stamp === md5( implode( "\0", array( $p->post_title, $p->post_content, $p->post_excerpt, '0' ) ) );
		if ( 0 === $order ) {
			if ( ! $dry ) {
				$wpdb->update( $wpdb->posts, array( 'menu_order' => $i * 10 ), array( 'ID' => $id ) );
				clean_post_cache( $id );
			}
			++$n;
		}
		if ( ! $dry && ( $pristine || $stale ) ) {
			hvs_stamp_import( $id );
		}
	}
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "đặt thứ tự cho {$n} trang." );
