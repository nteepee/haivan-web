<?php
/**
 * wp eval-file /scripts/relativize-media-urls.php   (HV_DRY_RUN=1 chỉ báo cáo)
 * Đổi URL ảnh/tệp tuyệt đối của chính site trong post_content (vd. http://localhost:8180/wp-content/uploads/...) thành đường dẫn
 * tương đối (/wp-content/uploads/...): đúng ở mọi host (nginx gốc, staging, production), không lộ cổng dev. Chỉ đổi khi URL đứng
 * ngay trước "/wp-content/"; không đụng postmeta, GUID, link bài. Tương đương
 *   wp search-replace 'http://localhost:8180/wp-content/' '/wp-content/' wp_posts --include-columns=post_content --precise
 * nhưng bài còn nguyên bản nhập được đóng dấu lại (hv_imported_hash) để importer không coi là "MKT đã sửa".
 * Ghi thẳng DB: không đổi post_modified. Biến: HV_ABS_BASE (mặc định = siteurl, vd. http://localhost:8180).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

global $wpdb;
$dry  = '1' === getenv( 'HV_DRY_RUN' );
$base = untrailingslashit( (string) ( getenv( 'HV_ABS_BASE' ) ?: get_option( 'siteurl' ) ) );
if ( 1 !== preg_match( '#^https?://[A-Za-z0-9.-]+(:\d+)?$#', $base ) ) {
	WP_CLI::error( "HV_ABS_BASE không hợp lệ: {$base}" );
}
$from = $base . '/wp-content/';
$to   = '/wp-content/';
$like = '%' . $wpdb->esc_like( $from ) . '%';

$stat = array( 'rows' => 0, 'occurrences' => 0, 'restamped' => 0 );
$last = 0;
do {
	$rows = $wpdb->get_results( $wpdb->prepare( "SELECT ID, post_type, post_content FROM {$wpdb->posts} WHERE ID > %d AND post_content LIKE %s ORDER BY ID LIMIT 200", $last, $like ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	foreach ( $rows as $row ) {
		$last = (int) $row->ID;
		$new  = str_replace( $from, $to, $row->post_content, $n );
		if ( 0 === $n ) {
			continue;
		}
		++$stat['rows'];
		$stat['occurrences'] += $n;
		if ( $dry ) {
			continue;
		}
		$revision = 'revision' === $row->post_type;
		$stamp    = $revision ? '' : (string) get_post_meta( $row->ID, 'hv_imported_hash', true );
		$pristine = '' !== $stamp && $stamp === hvs_state_hash( $row->ID );
		$ok       = $wpdb->update( $wpdb->posts, array( 'post_content' => $new ), array( 'ID' => $row->ID ) );
		if ( false === $ok ) {
			WP_CLI::warning( "#{$row->ID}: không ghi được ({$wpdb->last_error})" );
			continue;
		}
		clean_post_cache( $row->ID );
		if ( $pristine ) {
			hvs_stamp_import( $row->ID );
			++$stat['restamped'];
		}
	}
} while ( count( $rows ) === 200 );

WP_CLI::log( sprintf( '%s%d bài, %d chỗ "%s" -> "%s"; đóng dấu lại %d bài còn nguyên bản nhập.', $dry ? '(thử) ' : '', $stat['rows'], $stat['occurrences'], $from, $to, $stat['restamped'] ) );
WP_CLI::success( $dry ? 'Dry-run xong, chưa ghi gì.' : 'Xong.' );
