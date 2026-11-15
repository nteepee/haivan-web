<?php
/**
 * Chuyển hướng 301 cho các trang rác còn sót từ web cũ (không sửa DB, chạy được cả khi trang đã bị xoá):
 *  - /dat-ve-nhanhs/* (slug thừa chữ "s")  -> /dat-ve-nhanh (trang tìm vé);
 *  - mảnh vụn rỗng của /dat-ve-nhanh/* (header, footer, slide...) -> /dat-ve-nhanh;
 *  - /mobile -> dải tải app ở trang chủ (#hv-app); /haivanplus (sản phẩm đã ngừng) -> trang chủ;
 *  - /tuyen-duong/<tuyến cũ> -> trang tuyến tương ứng, tuyến đã bỏ (Đà Lạt, Hà Giang, Sa Pa) -> /xe-khach.
 *  - /bus-app/<mã xe> (QR trên xe): 302 theo thiết bị sang App Store / Google Play / #hv-app, noindex, không cache.
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
	$rules[] = array( '/app', '/#hv-app', false ); // link cũ trong tin tức (Lào Cai - Sapa) trỏ /app
	// HAIVANplus đã ngừng: trang gỡ khỏi web, link cũ về trang chủ.
	$rules[] = array( '/haivanplus', '/', true );
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

/**
 * Đích của link QR dán trên xe /bus-app/<mã xe> (web cũ gọi apigw.haivan.com/api/qrcode/bus rồi sang OneLink AppsFlyer).
 * Chọn đích theo User-Agent: iPhone/iPad/iPod -> App Store, Android -> Google Play, còn lại -> dải tải app ở trang chủ.
 * Mã xe được gắn làm chiến dịch (App Store `ct`, Play `referrer` utm_*) để đo lượt tải theo xe; mã lạ thì bỏ qua.
 *
 * @param string $bus  Mã xe trong URL (có thể rỗng).
 * @param string $ua   User-Agent của khách.
 * @param string $lang Tiền tố ngôn ngữ "" hoặc "/en".
 * @return string URL tuyệt đối (cửa hàng) hoặc đường dẫn nội bộ.
 */
function hv_bus_app_target( $bus, $ua, $lang = '' ) {
	$campaign = 1 === preg_match( '/^[A-Za-z0-9._-]{1,32}$/', (string) $bus ) ? 'bus-' . $bus : '';
	// Giống web cũ: mã xe hợp lệ đi qua AppsFlyer OneLink để team app giữ số liệu quét QR theo từng xe; OneLink tự chuyển store theo thiết bị.
	if ( '' !== $campaign ) {
		return 'https://haivan-app.onelink.me/BX9S/' . rawurlencode( (string) $bus );
	}
	if ( 1 === preg_match( '/iPhone|iPad|iPod/i', (string) $ua ) ) {
		return 'https://apps.apple.com/vn/app/id1440552948' . ( '' !== $campaign ? '?ct=' . rawurlencode( $campaign ) : '' );
	}
	if ( false !== stripos( (string) $ua, 'Android' ) ) {
		$referrer = 'utm_source=bus&utm_medium=qr' . ( '' !== $campaign ? '&utm_campaign=' . $campaign : '' );
		return 'https://play.google.com/store/apps/details?id=com.havaz_app&referrer=' . rawurlencode( $referrer );
	}
	return $lang . '/#hv-app';
}

add_action(
	'template_redirect',
	static function () {
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( 1 !== preg_match( '#^(/en)?/bus-app(?:/([^/?\#]*))?/?(?:[?\#]|$)#', $uri, $m ) ) {
			return;
		}
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? (string) wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$to = hv_bus_app_target( rawurldecode( $m[2] ?? '' ), $ua, $m[1] ?? '' );
		// Đích phụ thuộc User-Agent: cấm nginx/CDN cache (302 + no-store) và không cho lập chỉ mục.
		nocache_headers();
		header( 'Vary: User-Agent' );
		header( 'X-Robots-Tag: noindex, nofollow' );
		wp_redirect( $to, 302, 'Hai Van' ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- đích cố định (App Store/Play/nội bộ), không lấy từ input.
		exit;
	},
	0
);

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
