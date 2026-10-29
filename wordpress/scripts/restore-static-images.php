<?php
/**
 * wp eval-file /scripts/restore-static-images.php
 *
 * Trang tĩnh nhập từ bản chụp web cũ mất ảnh (ảnh nạp lười, HTML đã lưu chỉ còn ảnh giữ chỗ). Nguồn đường dẫn ảnh gốc:
 * bundle JS của từng trang trong archive/old-site/_next/static/chunks/pages/<đường dẫn>-<hash>.js, nơi các chuỗi
 * "/assets/..." xuất hiện theo đúng thứ tự dựng trang. Quy tắc (chỉ khi web cũ rõ ràng dùng ảnh):
 *   - ảnh thật (cạnh ngắn >= 200px theo lib/asset-dims.json, không phải icon/logo/svg) đứng TRƯỚC tiêu đề nội dung đầu tiên
 *     của trang = dải ảnh đầu trang (web cũ đặt ngay dưới đường dẫn);
 *   - dải > 6 ảnh (ảnh từng bước hướng dẫn thanh toán) bỏ qua vì không có vị trí từng ảnh;
 *   - cặp ảnh pc/mobile của cùng một banner chỉ lấy bản pc.
 * Ảnh dùng URL /assets/... (do Next phục vụ), không chép vào theme hay Media. Idempotent (dải có lớp hv-photo-strip thì bỏ qua),
 * không đụng trang MKT đã sửa. Biến: HV_DRY_RUN=1.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

$dry      = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$manifest = require __DIR__ . '/lib/pages-manifest.php';
$dims     = json_decode( (string) file_get_contents( __DIR__ . '/lib/asset-dims.json' ), true ) ?: array();
$chunks   = '/archive/old-site/_next/static/chunks/pages';
if ( ! is_dir( $chunks ) ) {
	WP_CLI::error( "Không thấy {$chunks} (archive chưa mount?)." );
}

/** Chuẩn hoá để so tiêu đề: chữ thường, bỏ dấu câu/khoảng trắng. */
$norm = static fn( $s ) => preg_replace( '/[^\p{L}\p{N}]+/u', '', mb_strtolower( html_entity_decode( wp_strip_all_tags( (string) $s ), ENT_QUOTES, 'UTF-8' ) ) );

$stat = array( 'pages' => 0, 'restored' => 0, 'photos' => 0, 'skipped' => array(), 'none' => 0 );
// Loại: các khối con của landing /dat-ve-nhanh* (không phải trang nội dung) và trang chỉ có ảnh từng bước.
$exclude = '#^(dat-ve-nhanh|chinh-sach/huong-dan-thanh-toan-vnpay$)#';
foreach ( array_keys( $manifest['pages'] ) as $path ) {
	if ( 1 === preg_match( $exclude, $path ) ) {
		continue;
	}
	$files = glob( $chunks . '/' . $path . '-*.js' );
	$files = array_values( array_filter( (array) $files, static fn( $f ) => 1 === preg_match( '#/' . preg_quote( basename( $path ), '#' ) . '-[0-9a-f]{20}\.js$#', $f ) ) );
	if ( ! $files ) {
		continue; // trang không có bundle riêng (vd. landing /dat-ve-nhanh dùng mẫu khác).
	}
	++$stat['pages'];
	$js = (string) file_get_contents( $files[0] );
	// Chuỗi theo thứ tự: ảnh "/assets/..." và văn bản children:"...".
	preg_match_all( '#"(/assets/[A-Za-z0-9_/.-]+\.(?:jpe?g|png|webp))"|children:("(?:[^"\\\\]|\\\\.)*")#', $js, $m, PREG_SET_ORDER );
	$seq = array();
	foreach ( $m as $t ) {
		if ( ! empty( $t[1] ) ) {
			$seq[] = array( 'img', $t[1] );
		} else {
			$txt = json_decode( $t[2], true );
			if ( is_string( $txt ) && mb_strlen( $txt ) > 3 ) {
				$seq[] = array( 'txt', $txt );
			}
		}
	}
	$result = array();
	foreach ( array( 'vi', 'en' ) as $lang ) {
		$page = get_post( (int) hvs_find_page( $path, $lang ) );
		if ( ! $page || 'publish' !== $page->post_status ) {
			continue;
		}
		if ( false !== strpos( $page->post_content, 'hv-photo-strip' ) ) {
			$result[ $lang ] = 'đã có dải ảnh';
			continue;
		}
		$may = hvs_may_overwrite( (int) $page->ID );
		if ( ! $may[0] ) {
			$stat['skipped'][] = "{$lang}:{$path} ({$may[1]})";
			continue;
		}
		// Tiêu đề trong nội dung (h2-h4 và đoạn chỉ có chữ đậm).
		preg_match_all( '#<(?:h[2-4]|strong)\b[^>]*>(.*?)</(?:h[2-4]|strong)>#is', $page->post_content, $hm );
		$heads = array_flip( array_filter( array_map( $norm, $hm[1] ) ) );
		$photos = array();
		foreach ( $seq as $t ) {
			if ( 'txt' === $t[0] && '' !== $norm( $t[1] ) && isset( $heads[ $norm( $t[1] ) ] ) ) {
				break; // gặp tiêu đề nội dung đầu tiên: hết dải ảnh đầu trang.
			}
			if ( 'img' === $t[0] && isset( $dims[ $t[1] ] ) && min( $dims[ $t[1] ] ) >= 200 && ! preg_match( '#/(icons|mobile/icons)/|/(icon|icn|logo)[-_]#i', $t[1] ) && ! in_array( $t[1], $photos, true ) ) {
				$photos[] = $t[1];
			}
		}
		// Cặp pc/mobile của cùng banner: chỉ giữ bản pc.
		if ( in_array( '/assets/chung-toi/pc.jpg', $photos, true ) ) {
			$photos = array_values( array_diff( $photos, array( '/assets/chung-toi/mobile.jpeg' ) ) );
		}
		if ( ! $photos || count( $photos ) > 6 ) {
			$result[ $lang ] = $photos ? 'bỏ qua (' . count( $photos ) . ' ảnh từng bước)' : 'không có ảnh';
			continue;
		}
		$alt  = esc_attr( wp_strip_all_tags( $page->post_title ) );
		$html = '<div class="hv-photo-strip hv-photo-strip--' . count( $photos ) . '">';
		foreach ( $photos as $src ) {
			[ $w, $h ] = $dims[ $src ];
			$html     .= '<figure class="hv-photo"><img src="' . esc_url( $src ) . '" width="' . (int) $w . '" height="' . (int) $h . '" alt="' . $alt . '" loading="lazy" decoding="async"></figure>';
		}
		$html .= '</div>' . "\n";
		$result[ $lang ] = count( $photos ) . ' ảnh: ' . implode( ', ', array_map( 'basename', $photos ) );
		++$stat['restored'];
		$stat['photos'] += count( $photos );
		if ( ! $dry ) {
			global $wpdb;
			$wpdb->update( $wpdb->posts, array( 'post_content' => $html . $page->post_content ), array( 'ID' => $page->ID ) );
			clean_post_cache( (int) $page->ID );
			hvs_stamp_import( (int) $page->ID );
		}
	}
	WP_CLI::log( sprintf( '%-48s vi: %s | en: %s', $path, $result['vi'] ?? '-', $result['en'] ?? '-' ) );
}
WP_CLI::log( 'Bỏ qua do MKT đã sửa: ' . ( $stat['skipped'] ? implode( '; ', $stat['skipped'] ) : 'không có' ) );
WP_CLI::success( sprintf( '%sQuét %d trang có bundle, khôi phục %d bản (vi+en), %d ảnh.', $dry ? '[dry-run] ' : '', $stat['pages'], $stat['restored'], $stat['photos'] ) );
