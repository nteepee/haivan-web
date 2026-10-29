<?php
/**
 * wp eval-file /scripts/content-dedupe.php   (dry-run mặc định; HV_APPLY=1 để ghi; HV_REPORT=1 quét thêm các bài khác)
 *
 * Bỏ bản lặp nguyên văn của khối nội dung trên các trang bị nhân đôi khi nhập từ web cũ:
 *   /chung-toi/lien-he, /haivanplus, /dat-ve-nhanhs/khachhang, /dat-ve-nhanh/khachhang (và bản /en/ của chúng).
 * Thuật toán: tách nội dung thành khối cấp cao nhất (p, div, ul, ol, h1-h6, table, blockquote, figure, section, pre, hr; chữ lẻ giữa các khối
 * là một khối riêng); nếu một dãy k khối liền nhau lặp lại NGUYÊN VĂN ngay sau chính nó thì xoá bản lặp, kể cả bản lặp dở dang đứng cuối.
 * Chỉ coi là lặp khi dãy có chữ >= 20 ký tự hoặc có ảnh (không xoá đoạn trống). Chỉ chạm các trang trong danh sách trắng ở trên.
 * Idempotent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-tools.php';
require_once __DIR__ . '/lib/content-blocks.php';

$run    = new HVC_Run( 'content-dedupe' );
$report = '1' === (string) ( getenv( 'HV_REPORT' ) ?: '0' );

$whitelist = array( 'chung-toi/lien-he', 'haivanplus', 'dat-ve-nhanhs/khachhang', 'dat-ve-nhanh/khachhang' );

/** Đường dẫn trang không có tiền tố ngôn ngữ. */
$page_key = static function ( $id ) {
	$path = trim( hvc_post_path( $id ), '/' );
	return preg_replace( '#^en/#', '', $path );
};

foreach ( $run->posts( array( 'page' ) ) as $row ) {
	if ( ! in_array( $page_key( $row->ID ), $whitelist, true ) ) {
		continue;
	}
	list( $new, $n ) = hvd_dedupe( $row->post_content );
	if ( $n ) {
		$run->hit( 'khoi-lap-nguyen-van', (int) $row->ID, $n );
		$run->sample( 'khoi-lap-nguyen-van', (int) $row->ID, $row->post_content, $new );
		$run->commit( $row, array( 'post_content' => $new ) );
	}
}

if ( $report ) {
	$other = array();
	foreach ( $run->posts( array( 'page', 'diem_den', 'bai_viet', 'tin_tuc' ), array( 'publish' ) ) as $row ) {
		if ( 'page' === $row->post_type && in_array( $page_key( $row->ID ), $whitelist, true ) ) {
			continue;
		}
		list( , $n ) = hvd_dedupe( $row->post_content );
		if ( $n ) {
			$other[] = '#' . $row->ID . '(' . $row->post_type . ')x' . $n;
		}
	}
	$run->notes[] = sprintf( 'Bài khác còn dãy khối lặp liền kề (chưa sửa, cần MKT xem): %d %s', count( $other ), implode( ' ', array_slice( $other, 0, 40 ) ) );
}

$run->finish();
