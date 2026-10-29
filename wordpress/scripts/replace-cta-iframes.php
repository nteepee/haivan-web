<?php
/**
 * wp eval-file /scripts/replace-cta-iframes.php
 *
 * Thay mọi <iframe src="https://cms.haivan.com/api/cta/<n>"> trong nội dung bài bằng shortcode [haivan_cta] của theme
 * (không còn phụ thuộc cms.haivan.com/api/cta và CSP frame-src). Idempotent: bài đã thay không còn iframe nên chạy lại không đổi gì.
 *
 * Tuyến của shortcode: bài bai_viet có điểm đến (taxonomy hv_location) -> tuyến đầu tiên của điểm đó
 * (hv_route_for_destination: tuyến có điểm đến là đích, rồi tuyến chứa slug); không có tuyến -> CTA chung (/xe-khach).
 * Số n của khung CMS không suy ra được tuyến (CMS trả lỗi cho api/cta, chỉ lưu vết ở n="..").
 *
 * Ghi thẳng DB (không đổi post_modified; bài còn nguyên bản nhập thì đóng dấu lại để importer không coi là MKT đã sửa).
 * Biến: HV_DRY_RUN=1 chỉ báo cáo (nên chạy trước), HV_SAMPLE=N in N ví dụ trước/sau.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

global $wpdb;
$dry    = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$sample = (int) ( getenv( 'HV_SAMPLE' ) ?: 0 );
if ( ! function_exists( 'hv_route_for_destination' ) ) {
	WP_CLI::error( 'Theme haivan-web-child chưa kích hoạt (thiếu hv_route_for_destination).' );
}

/** Iframe CTA: ba dạng bọc (div.fluidMedia, đoạn <p> chỉ chứa iframe, iframe trần). */
$iframe = '<iframe\b[^>]*\bsrc=["\']https?://cms\.haivan\.com/api/cta/(\d+)[^"\']*["\'][^>]*>\s*(?:</iframe\s*>)?';
$passes = array(
	// Hai bài dán mã nhúng dưới dạng chữ (&lt;div ...&gt;&lt;iframe ...&gt;): người đọc thấy mã, thay luôn phần chữ đó.
	'#&lt;div\b(?:(?!&lt;/div&gt;).)*?api/cta/(\d+)(?:(?!&lt;/div&gt;).)*?&lt;/div&gt;#is',
	'#<div\b[^>]*class=["\'][^"\']*fluidMedia[^"\']*["\'][^>]*>\s*' . $iframe . '\s*</div>#i',
	'#<p\b[^>]*>\s*' . $iframe . '\s*</p>#i',
	'#' . $iframe . '#i',
);

$rows = $wpdb->get_results( "SELECT ID, post_type, post_status, post_content FROM {$wpdb->posts} WHERE post_content LIKE '%cms.haivan.com/api/cta/%' AND post_type <> 'revision' ORDER BY ID" ); // phpcs:ignore WordPress.DB.PreparedSQL
$stat = array( 'posts' => 0, 'iframes' => 0, 'routed' => 0, 'generic' => 0, 'restamped' => 0 );
$by_route = array();
foreach ( $rows as $row ) {
	$route = '';
	if ( 'bai_viet' === $row->post_type ) {
		$terms = get_the_terms( (int) $row->ID, 'hv_location' );
		if ( is_array( $terms ) && $terms ) {
			$route = hv_route_for_destination( reset( $terms )->slug );
		}
	}
	$count   = 0;
	$content = $row->post_content;
	foreach ( $passes as $re ) {
		$content = preg_replace_callback(
			$re,
			static function ( $m ) use ( $route, &$count ) {
				++$count;
				return '[haivan_cta' . ( '' !== $route ? ' route="' . $route . '"' : '' ) . ' n="' . (int) $m[1] . '"]';
			},
			$content
		);
	}
	if ( 0 === $count || $content === $row->post_content ) {
		continue;
	}
	++$stat['posts'];
	$stat['iframes'] += $count;
	$stat[ '' !== $route ? 'routed' : 'generic' ] += $count;
	$by_route[ '' !== $route ? $route : '(chung)' ] = ( $by_route[ '' !== $route ? $route : '(chung)' ] ?? 0 ) + $count;
	if ( $sample > 0 ) {
		--$sample;
		$p = strpos( $content, '[haivan_cta' );
		WP_CLI::log( sprintf( '#%d %s: ...%s...', $row->ID, get_the_title( (int) $row->ID ), substr( wp_strip_all_tags( substr( $content, max( 0, $p - 120 ), 260 ) ), 0, 200 ) ) );
	}
	if ( $dry ) {
		continue;
	}
	$stamp  = (string) get_post_meta( $row->ID, 'hv_imported_hash', true );
	$pristine = '' !== $stamp && $stamp === hvs_state_hash( $row->ID );
	$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $row->ID ) );
	clean_post_cache( (int) $row->ID );
	if ( $pristine ) {
		hvs_stamp_import( (int) $row->ID );
		++$stat['restamped'];
	}
}
arsort( $by_route );
WP_CLI::log( 'Theo tuyến: ' . wp_json_encode( $by_route, JSON_UNESCAPED_UNICODE ) );
WP_CLI::success( sprintf( '%sbài đổi %d, iframe thay %d (có tuyến %d, CTA chung %d), đóng dấu lại %d.', $dry ? '[dry-run] ' : '', $stat['posts'], $stat['iframes'], $stat['routed'], $stat['generic'], $stat['restamped'] ) );
