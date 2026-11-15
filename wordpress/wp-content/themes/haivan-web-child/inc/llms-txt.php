<?php
/**
 * /llms.txt (chuẩn llmstxt.org): bản tóm tắt Markdown cho các mô hình ngôn ngữ và công cụ tìm kiếm AI.
 * Sinh từ dữ liệu thật nên tự cập nhật: tuyến = bài hv_route đã xuất bản (tiêu đề + mô tả SEO),
 * trang khác = menu chính và các cột footer (Giao diện → Menu). Link tuyệt đối theo home_url() của site đang chạy.
 * Cache transient 1 giờ, xoá khi lưu bài/trang/menu hoặc đổi thiết lập layout.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HV_LLMS_TXT_CACHE = 'hv_llms_txt_v1';

/** Một dòng link Markdown "- [nhãn](url): mô tả"; nhãn/mô tả bỏ thẻ HTML và xuống dòng. */
function hv_llms_link( $label, $href, $desc = '' ) {
	$clean = static fn( $s ) => trim( (string) preg_replace( '/\s+/u', ' ', wp_strip_all_tags( html_entity_decode( (string) $s, ENT_QUOTES, 'UTF-8' ) ) ) );
	$label = str_replace( array( '[', ']' ), array( '(', ')' ), $clean( $label ) );
	$url   = 1 === preg_match( '#^https?://#i', (string) $href ) ? (string) $href : home_url( '/' . ltrim( (string) $href, '/' ) );
	$desc  = $clean( $desc );
	return '- [' . $label . '](' . esc_url_raw( $url ) . ')' . ( '' !== $desc ? ': ' . $desc : '' );
}

/** Tuyến đã xuất bản: [ path => [ title, description ] ], tuyến phía Nam trước, rồi theo đường dẫn. */
function hv_llms_routes() {
	$out = array();
	foreach (
		get_posts(
			array(
				'post_type'        => 'hv_route',
				'post_status'      => 'publish',
				'numberposts'      => 100,
				'suppress_filters' => true, // không lọc theo ngôn ngữ Polylang.
			)
		) as $post
	) {
		$path = trim( (string) get_post_meta( $post->ID, 'hv_route_path', true ), '/' );
		if ( 1 !== preg_match( '#^[a-z0-9-]+/[a-z0-9-]+$#', $path ) ) {
			continue;
		}
		$out[ $path ] = array( $post->post_title, (string) get_post_meta( $post->ID, 'hv_route_meta_description', true ) );
	}
	$south = static fn( $p ) => 1 === preg_match( '#(vung-tau|tan-son-nhat|quan-1)#', $p ) ? 0 : 1;
	uksort( $out, static fn( $a, $b ) => array( $south( $a ), $a ) <=> array( $south( $b ), $b ) );
	return $out;
}

/** Nội dung llms.txt (chưa cache). */
function hv_llms_txt_build() {
	$s       = function_exists( 'hv_layout_settings' ) ? hv_layout_settings() : array();
	$hotline = trim( (string) ( $s['hotline'] ?? '' ) );
	$hotline = '' !== $hotline ? $hotline : '1900 6763';
	$routes  = hv_llms_routes();
	$seen    = array();
	$lines   = array(
		'# Hãng xe Hải Vân (HAIVAN)',
		'',
		'> Website đặt vé chính thức của Hãng xe Hải Vân (Công ty Liên doanh Vận chuyển Quốc tế Hải Vân, thành lập năm 1994): xe limousine Sài Gòn – Vũng Tàu và sân bay Tân Sơn Nhất – Vũng Tàu, xe giường nằm Hà Nội đi Điện Biên, Sơn La, Mộc Châu. Đặt vé, chọn chỗ và thanh toán trực tuyến trên website, ứng dụng HAIVAN hoặc tổng đài ' . $hotline . '.',
		'',
		'Thông tin chính:',
		'',
		'- Tổng đài đặt vé và hỗ trợ: ' . $hotline,
		'- Hạng xe: Royal (22–24 giường cabin), Luxury (34–36 giường), Eco (44 giường); hạng xe của từng chuyến xem ở trang tuyến.',
		'- Quầy vé tại sân bay Tân Sơn Nhất: nhà ga T1 (cột B5), T2 (cột GF12), T3 (cột A17 – A18).',
		'- Trẻ em từ 6 tuổi hoặc nặng trên 25 kg cần mua vé riêng.',
		'- Tích điểm 10% khi đặt qua các kênh của Hải Vân, dành cho thành viên chương trình "Tôi yêu Hải Vân": ' . home_url( '/chung-toi/chuong-trinh-khach-hang-than-thiet' ),
		'- Đổi, trả vé theo quy định của từng tuyến, xem Quy chế: ' . home_url( '/chinh-sach/quy-che' ),
		'- Giá vé thay đổi theo ngày, giờ và hạng xe; giá hiện hành và chỗ trống luôn xem trên trang tìm chuyến, không dùng giá cũ.',
		'',
	);

	if ( $routes ) {
		$lines[] = '## Tuyến xe';
		$lines[] = '';
		foreach ( $routes as $path => $r ) {
			$href          = '/xe-khach/' . $path;
			$seen[ $href ] = true;
			$lines[]       = hv_llms_link( 'Xe ' . str_replace( ' - ', ' đi ', $r[0] ), $href, $r[1] );
		}
		$lines[] = '';
	}

	$lines[]           = '## Đặt vé';
	$lines[]           = '';
	$lines[]           = hv_llms_link( 'Tìm chuyến và đặt vé xe khách', '/xe-khach', 'Chọn điểm đi, điểm đến, ngày đi; xem giờ chạy, giá và chọn chỗ trên sơ đồ xe.' );
	$seen['/xe-khach'] = true;
	$lines[]           = '';

	// Các trang khác lấy từ menu chính + cột footer (bỏ trùng, bỏ tuyến đã liệt kê, bỏ link ngoài).
	$groups = array();
	if ( function_exists( 'hv_layout_for_lang' ) ) {
		$layout = hv_layout_for_lang( 'vi' );
		foreach ( (array) $layout['primary'] as $item ) {
			// Mục con trước: mục cha thường trỏ trùng trang của một mục con nhưng mang nhãn nhóm chung ("Dịch vụ").
			$groups[] = array( (string) $item['label'], array_merge( (array) ( $item['children'] ?? array() ), array( $item ) ) );
		}
		foreach ( (array) $layout['footer_columns'] as $col ) {
			$groups[] = array( (string) $col['title'], (array) $col['items'] );
		}
	}
	$merged = array();
	foreach ( $groups as list( $title, $items ) ) {
		foreach ( $items as $item ) {
			$href = '/' . trim( (string) wp_parse_url( (string) ( $item['href'] ?? '' ), PHP_URL_PATH ), '/' );
			$raw      = (string) ( $item['href'] ?? '' );
			$external = 1 === preg_match( '#^https?://#i', $raw ) && wp_parse_url( $raw, PHP_URL_HOST ) !== wp_parse_url( home_url(), PHP_URL_HOST );
			if ( '/' === $href || $external || isset( $seen[ $href ] ) ) {
				continue;
			}
			$seen[ $href ]      = true;
			$merged[ $title ][] = hv_llms_link( (string) ( $item['label'] ?? '' ), $href );
		}
	}
	foreach ( $merged as $title => $items ) {
		$lines[] = '## ' . wp_strip_all_tags( $title );
		$lines[] = '';
		array_push( $lines, ...$items );
		$lines[] = '';
	}

	$lines[] = '## Optional';
	$lines[] = '';
	$lines[] = hv_llms_link( 'English version', '/en/', 'Hai Van coach booking site in English.' );
	$lines[] = hv_llms_link( 'Sitemap trang tuyến', '/xe-khach/sitemap.xml' );
	$lines[] = hv_llms_link( 'Sitemap toàn site', '/sitemap_index.xml' );
	return implode( "\n", $lines ) . "\n";
}

/** Nội dung llms.txt có cache. */
function hv_llms_txt() {
	$text = get_transient( HV_LLMS_TXT_CACHE );
	if ( ! is_string( $text ) || '' === $text ) {
		$text = hv_llms_txt_build();
		set_transient( HV_LLMS_TXT_CACHE, $text, HOUR_IN_SECONDS );
	}
	return $text;
}

$hv_llms_flush = static function () {
	delete_transient( HV_LLMS_TXT_CACHE );
};
add_action( 'save_post', $hv_llms_flush );
add_action( 'deleted_post', $hv_llms_flush );
add_action( 'wp_update_nav_menu', $hv_llms_flush );
add_action( 'update_option_hv_layout_settings', $hv_llms_flush );

add_action(
	'template_redirect',
	static function () {
		$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( '/llms.txt' !== $path ) {
			return;
		}
		status_header( 200 );
		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'Cache-Control: public, max-age=3600' );
		header( 'X-Robots-Tag: noindex' );
		echo hv_llms_txt(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- text/plain, link đã esc_url_raw.
		exit;
	},
	0
);
