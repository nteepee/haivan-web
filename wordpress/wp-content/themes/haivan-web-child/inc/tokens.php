<?php
/**
 * Phông Nunito tự host (vietnamese + latin). Biến thiết kế nằm ở assets/css/tokens.css (bản sao docs/design/tokens.css).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** @font-face in thẳng vào <head> (cần URL theme, tránh chờ thêm một request CSS cho LCP). */
function hv_fonts_css() {
	$f = HV_WEB_URI . '/assets/fonts/';
	return <<<CSS
@font-face{font-family:"Nunito";font-style:normal;font-weight:200 1000;font-display:swap;src:url({$f}nunito-vietnamese.woff2) format("woff2");unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:"Nunito";font-style:normal;font-weight:200 1000;font-display:swap;src:url({$f}nunito-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:200 1000;font-display:swap;src:url({$f}nunito-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
CSS;
}

add_action(
	'wp_head',
	static function () {
		$f = HV_WEB_URI . '/assets/fonts/';
		printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( $f . 'nunito-vietnamese.woff2' ) );
		printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( $f . 'nunito-latin.woff2' ) );
		echo '<style id="hv-fonts">' . hv_fonts_css() . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput -- hằng số nội bộ.
	},
	1
);
