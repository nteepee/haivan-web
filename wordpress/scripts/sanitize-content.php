<?php
/**
 * wp eval-file /scripts/sanitize-content.php
 *
 * Làm sạch bài ĐÃ nhập trước đây (khi importer chưa lọc): chạy hvs_clean_html lên nội dung, hvs_clean_text lên
 * tiêu đề/tóm tắt của trang, tin tức, điểm đến, ưu đãi, tuyến phổ biến (và bản sửa đổi của chúng).
 * Idempotent: chạy lại không đổi gì khi đã sạch. Ghi thẳng DB nên KHÔNG đổi post_modified (không làm bài trông như
 * "MKT đã sửa"), nhưng cập nhật dấu nhập nếu bài còn nguyên bản nhập.
 *
 * Biến môi trường (docker compose ... run -e NAME=value wpcli ...):
 *   HV_DRY_RUN=1            chỉ báo cáo, không ghi
 *   HV_BASELINE_UNKNOWN=1   bài CPT nhập từ bản cũ (có hv_old_id; tuyến phổ biến có hv_route_path) mà chưa có dấu nhập: coi nội dung hiện tại là
 *                           bản nhập nguyên gốc (chỉ dùng khi chắc chưa ai sửa, vd. môi trường local) để importer
 *                           còn cập nhật được; mặc định các bài này được giữ nguyên khi nhập lại.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

global $wpdb;
$dry      = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$baseline = '1' === (string) ( getenv( 'HV_BASELINE_UNKNOWN' ) ?: '0' );
$types    = array( 'page', 'tin_tuc', 'bai_viet', 'diem_den', 'uu_dai', 'hv_route' );

$in   = implode( ',', array_map( static fn( $t ) => $wpdb->prepare( '%s', $t ), $types ) );
$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.PreparedSQL
	"SELECT ID, post_type, post_status, post_parent, post_title, post_content, post_excerpt, menu_order, post_modified_gmt
	   FROM {$wpdb->posts}
	  WHERE post_status <> 'auto-draft'
	    AND ( post_type IN ($in)
	       OR ( post_type = 'revision' AND post_parent IN ( SELECT ID FROM {$wpdb->posts} WHERE post_type IN ($in) ) ) )
	  ORDER BY ID"
);

$stat = array( 'scanned' => count( $rows ), 'changed' => 0, 'restamped' => 0, 'baselined' => 0 );
foreach ( $rows as $row ) {
	$title   = $row->post_title;
	$excerpt = $row->post_excerpt;
	$content = hvs_clean_html( $row->post_content );
	// Chỉ đổi tiêu đề/tóm tắt khi có thẻ HTML (không giải mã thực thể: giữ idempotent, "&amp;" vẫn nguyên).
	if ( $title !== wp_strip_all_tags( $title ) || false !== strpos( $title, '<' ) ) {
		$title = hvs_clean_text( $title );
	}
	if ( $excerpt !== wp_strip_all_tags( $excerpt ) || false !== strpos( $excerpt, '<' ) ) {
		$excerpt = hvs_clean_text( $excerpt );
	}
	$dirty = $content !== $row->post_content || $title !== $row->post_title || $excerpt !== $row->post_excerpt;

	$is_revision = 'revision' === $row->post_type;
	$stamp_hash  = $is_revision ? '' : (string) get_post_meta( $row->ID, 'hv_imported_hash', true );
	$stamp_at    = $is_revision ? '' : (string) get_post_meta( $row->ID, 'hv_imported_at', true );
	$old_hash    = hvs_state_hash( $row->ID );
	// Còn nguyên bản nhập? (dấu mới khớp hash hiện tại, hoặc dấu cũ kiểu md5(nội dung) của importer đời đầu.)
	$pristine = '' !== $stamp_hash && ( $stamp_hash === $old_hash || $stamp_hash === md5( $row->post_content ) );

	if ( $dirty ) {
		++$stat['changed'];
		WP_CLI::log( sprintf( '%s #%d (%s): làm sạch%s', $row->post_type, $row->ID, $row->post_status, $dry ? ' [dry-run]' : '' ) );
		if ( ! $dry ) {
			$wpdb->update(
				$wpdb->posts,
				array( 'post_title' => $title, 'post_content' => $content, 'post_excerpt' => $excerpt ),
				array( 'ID' => $row->ID )
			);
			clean_post_cache( $row->ID );
		}
	}
	if ( $is_revision || $dry ) {
		continue;
	}
	$legacy_unknown = '' === $stamp_hash && ( '' !== (string) get_post_meta( $row->ID, 'hv_old_id', true ) || '' !== (string) get_post_meta( $row->ID, 'hv_route_path', true ) );
	$needs_stamp    = $pristine ? ( $dirty || '' === $stamp_at || $stamp_hash !== hvs_state_hash( $row->ID ) ) : ( $baseline && $legacy_unknown && 'publish' === $row->post_status );
	if ( $needs_stamp ) {
		hvs_stamp_import( (int) $row->ID );
		if ( $pristine ) {
			++$stat['restamped'];
		} else {
			++$stat['baselined'];
		}
	}
}

WP_CLI::success( sprintf( 'Đã quét %d, làm sạch %d, đóng dấu lại %d, đóng dấu bài chưa rõ nguồn %d%s.', $stat['scanned'], $stat['changed'], $stat['restamped'], $stat['baselined'], $dry ? ' (dry-run)' : '' ) );
