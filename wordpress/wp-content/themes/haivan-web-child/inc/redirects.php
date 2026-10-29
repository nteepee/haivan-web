<?php
/**
 * Chuyển hướng 301 cho các trang rác còn sót từ web cũ (không sửa DB, chạy được cả khi trang đã bị xoá):
 *  - /dat-ve-nhanhs/* (slug thừa chữ "s")  -> /dat-ve-nhanh (trang tìm vé);
 *  - mảnh vụn rỗng của /dat-ve-nhanh/* (header, footer, slide...) -> /dat-ve-nhanh;
 *  - /mobile -> dải tải app ở trang chủ (#hv-app);
 *  - /tuyen-duong/<tuyến cũ> -> trang tuyến tương ứng, tuyến đã bỏ (Đà Lạt, Hà Giang, Sa Pa) -> /xe-khach.
 * Áp dụng cho cả /en/. Giữ nguyên query string (utm_*, aff_sid). MKT thêm/bớt quy tắc bằng filter hv_redirect_rules.
 * Các trang nguồn được scripts/seo-hardening.php đặt noindex để rời sitemap Rank Math.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Quy tắc: [ đường dẫn không tiền tố ngôn ngữ, đích, khớp cả cây con? ]. Quy tắc cụ thể đặt trước quy tắc chung.
 *
 * @return array<int,array{0:string,1:string,2:bool}>
 */
function hv_redirect_rules() {
	$rules = array(
		// Tuyến cũ có trang đặt vé tương ứng.
		array( '/tuyen-duong/ha-noi-dien-bien-ban-phu-muong-lay', '/xe-khach/my-dinh/dien-bien', false ),
		array( '/tuyen-duong/ha-noi-son-la', '/xe-khach/my-dinh/son-la', false ),
		array( '/tuyen-duong/tan-son-nhat-vung-tau', '/xe-khach/tan-son-nhat/vung-tau', false ),
		// Tuyến đã bỏ và mục cha: về danh sách tuyến đang chạy.
		array( '/tuyen-duong', '/xe-khach', true ),
		// Trang tìm vé và mảnh vụn của nó.
		array( '/dat-ve-nhanhs', '/dat-ve-nhanh', true ),
	);
	// Bài trùng chủ đề đã gộp (scripts/content-merge.php, docs/seo/duplicate-groups.md) và trang thanh toán Viettel đã gỡ.
	$rules[] = array( '/ho-tro/thanh-toan-viettel', '/ho-tro/huong-dan-thanh-toan', false );
	foreach (
		array(
			'/diem-den/dien-bien/xe-tai-ha-noi-dien-bien-2'                                      => '/diem-den/dien-bien/xe-tai-ha-noi-dien-bien',
			'/diem-den/ha-noi/so-dien-thoai-benh-vien-ung-buou-ha-noi-2'                          => '/diem-den/ha-noi/so-dien-thoai-benh-vien-ung-buou-ha-noi',
			'/diem-den/ho-chi-minh/huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020-2'        => '/diem-den/ho-chi-minh/huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020',
			'/diem-den/vung-tau/tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat-2'           => '/diem-den/vung-tau/tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat',
			'/diem-den/dien-bien/top-nha-xe-dien-bien-ha-noi-uy-tin-chat-luong-cao'               => '/diem-den/dien-bien/tong-hop-nha-xe-ha-noi-di-dien-bien-chat-luong-nhat',
			'/diem-den/dien-bien/gui-hang-xe-tai-ha-noi-dien-bien-danh-sach-cac-don-vi-uy-tin'    => '/diem-den/dien-bien/xe-tai-ha-noi-dien-bien',
			'/diem-den/ha-giang/cap-nhat-thong-tin-ma-buu-dien-ha-giang-moi-nhat'                 => '/diem-den/ha-giang/cap-nhat-chi-tiet-ma-buu-dien-ha-giang',
			'/diem-den/ha-giang/kinh-nghiem-chon-xe-ha-noi-di-ha-giang-chat-luong-nhat'           => '/diem-den/ha-giang/tong-hop-xe-ha-noi-ha-giang-chat-luong-nhat',
			'/diem-den/son-la/tong-hop-cac-dia-chi-buu-cuc-viettel-post-son-la'                   => '/diem-den/son-la/viettel-post-son-la',
		) as $from => $to
	) {
		$rules[] = array( $from, $to, false );
	}
	foreach ( array( 'footer', 'header', 'slide', 'slide_banner', 'gioithieu', 'lienhe', 'khach-hang-noi', 'giave', 'taisao' ) as $frag ) {
		$rules[] = array( '/dat-ve-nhanh/' . $frag, '/dat-ve-nhanh', false );
	}
	$rules[] = array( '/mobile', '/#hv-app', false );
	return (array) apply_filters( 'hv_redirect_rules', $rules );
}

/**
 * Đích chuyển hướng cho một đường dẫn (đã bỏ tiền tố ngôn ngữ), hoặc null nếu không phải trang rác.
 *
 * @param string $path Đường dẫn bắt đầu bằng "/".
 * @return string|null
 */
function hv_redirect_target( $path ) {
	$path = '/' . trim( rawurldecode( (string) $path ), '/' );
	foreach ( hv_redirect_rules() as $rule ) {
		list( $from, $to, $tree ) = $rule;
		if ( $path === $from || ( $tree && 0 === strpos( $path, $from . '/' ) ) ) {
			return $to;
		}
	}
	return null;
}

add_action(
	'template_redirect',
	static function () {
		if ( is_admin() || is_preview() || ! in_array( $_SERVER['REQUEST_METHOD'] ?? 'GET', array( 'GET', 'HEAD' ), true ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			return;
		}
		$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$path = (string) wp_parse_url( $uri, PHP_URL_PATH );
		$lang = 1 === preg_match( '#^/en(?=/|$)#', $path ) ? '/en' : '';
		$to   = hv_redirect_target( '' !== $lang ? (string) preg_replace( '#^/en#', '', $path ) : $path );
		if ( null === $to ) {
			return;
		}
		$query = (string) wp_parse_url( $uri, PHP_URL_QUERY );
		$frag  = '';
		if ( false !== strpos( $to, '#' ) ) {
			list( $to, $frag ) = explode( '#', $to, 2 );
			$frag              = '#' . $frag;
		}
		$to = $lang . $to; // "/dat-ve-nhanh" hoặc "/en/dat-ve-nhanh"; trang chủ là "/" hoặc "/en/".
		wp_safe_redirect( $to . ( '' !== $query ? '?' . $query : '' ) . $frag, 301, 'Hai Van' );
		exit;
	},
	1
);
