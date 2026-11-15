<?php
/**
 * Tag theo dõi của haivan.com (lấy từ <head> web cũ ngày 2026-11-13): Google Tag Manager, Google Analytics 4, Facebook Pixel,
 * xác minh tên miền Facebook và fb:app_id. Cùng bộ mã với app Next (components/layout/site-tags.tsx).
 * Biến môi trường (compose WP): HV_TRACKING=0 tắt toàn bộ; HV_GTM_ID / HV_GA_ID / HV_FB_PIXEL_ID đè mã (chuỗi rỗng = tắt tag đó).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Mã đang dùng; mã sai định dạng (không phải chữ/số/gạch) bị bỏ để không chèn được script qua biến môi trường.
 *
 * @return array{gtm:string,ga:string,pixel:string}
 */
function hv_site_tags() {
	$pick = static function ( $env, $fallback, $pattern ) {
		$v = getenv( $env );
		$v = false === $v ? $fallback : trim( $v );
		return preg_match( $pattern, $v ) ? $v : '';
	};
	return array(
		'gtm'   => $pick( 'HV_GTM_ID', 'GTM-NW5R7PS6', '/^[A-Za-z0-9-]+$/' ),
		'ga'    => $pick( 'HV_GA_ID', 'G-767KL5QKKR', '/^[A-Za-z0-9-]+$/' ),
		'pixel' => $pick( 'HV_FB_PIXEL_ID', '963493464903338', '/^\d+$/' ),
	);
}

/** Bật khi không có HV_TRACKING=0; không chạy trong trang quản trị và khung xem trước Customizer. */
function hv_site_tags_on() {
	return '0' !== getenv( 'HV_TRACKING' ) && ! is_admin() && ! is_customize_preview();
}

add_action(
	'wp_head',
	static function () {
		if ( ! hv_site_tags_on() ) {
			return;
		}
		$t = hv_site_tags();
		echo '<meta name="facebook-domain-verification" content="spk838pfadabdtsh46tiiaqprhk167">' . "\n";
		echo '<meta property="fb:app_id" content="1472935092906816">' . "\n";
		if ( '' !== $t['gtm'] ) {
			echo "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" . esc_js( $t['gtm'] ) . "');</script>\n";
		}
		if ( '' !== $t['ga'] ) {
			echo '<script async src="' . esc_url( 'https://www.googletagmanager.com/gtag/js?id=' . $t['ga'] ) . '"></script>' . "\n";
			echo "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" . esc_js( $t['ga'] ) . "');</script>\n";
		}
		if ( '' !== $t['pixel'] ) {
			echo "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" . esc_js( $t['pixel'] ) . "');fbq('track','PageView');</script>\n";
		}
	},
	1
);

add_action(
	'wp_body_open',
	static function () {
		if ( ! hv_site_tags_on() ) {
			return;
		}
		$t = hv_site_tags();
		if ( '' !== $t['gtm'] ) {
			echo '<noscript><iframe src="' . esc_url( 'https://www.googletagmanager.com/ns.html?id=' . $t['gtm'] ) . '" height="0" width="0" style="display:none;visibility:hidden" title="gtm"></iframe></noscript>' . "\n";
		}
		if ( '' !== $t['pixel'] ) {
			echo '<noscript><img height="1" width="1" style="display:none" alt="" src="' . esc_url( 'https://www.facebook.com/tr?id=' . $t['pixel'] . '&ev=PageView&noscript=1' ) . '"></noscript>' . "\n";
		}
	},
	1
);
