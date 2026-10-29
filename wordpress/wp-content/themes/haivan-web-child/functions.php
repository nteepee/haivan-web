<?php
/**
 * Hải Vân Web child theme.
 *
 * Toàn bộ logic nằm trong inc/*.php (PHP/JS thuần). Theme cha (Flatsome) chỉ cung cấp
 * shortcode/CSS của UX Builder cho nội dung do MKT dựng; muốn đổi theme cha thì sửa
 * dòng `Template:` trong style.css.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HV_WEB_VERSION', '1.6.0' );
define( 'HV_WEB_DIR', get_stylesheet_directory() );
define( 'HV_WEB_URI', get_stylesheet_directory_uri() );

foreach (
	array(
		'i18n', 'i18n-labels', 'tokens', 'icons', 'admin-fields', 'layout', 'layout-admin', 'template-tags', 'chrome',
		'content-types', 'search-shortcode', 'home-settings', 'mkt-shared', 'banners', 'banners-render', 'offers', 'offers-render',
		'corridors', 'promos', 'booking-config', 'mkt-admin', 'home-rest', 'home', 'home-blocks', 'cta', 'entry-tables',
		'route-meta', 'route-rest', 'dest-routes', 'content-fixes', 'toc', 'redirects', 'seo', 'schema', 'hardening',
	) as $hv_inc
) {
	require_once HV_WEB_DIR . '/inc/' . $hv_inc . '.php';
}

add_action(
	'after_setup_theme',
	static function () {
		load_child_theme_textdomain( 'haivan-web', HV_WEB_DIR . '/languages' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
		register_nav_menus(
			array(
				'hv_primary' => 'Header: menu chính (khớp REST layout.primary)',
				'hv_footer'  => 'Footer: cột cấp 1 = tiêu đề cột, cấp 2 = liên kết (khớp REST layout.footer_columns)',
			)
		);
	}
);

add_action(
	'wp_enqueue_scripts',
	static function () {
		$css = HV_WEB_URI . '/assets/css/';
		// tokens.css luôn nạp đầu tiên; mọi CSS khác phụ thuộc vào nó.
		wp_enqueue_style( 'hv-tokens', $css . 'tokens.css', array(), HV_WEB_VERSION );
		wp_enqueue_style( 'hv-base', $css . 'base.css', array( 'hv-tokens' ), HV_WEB_VERSION );
		wp_enqueue_style( 'hv-chrome', $css . 'chrome.css', array( 'hv-base' ), HV_WEB_VERSION );
		wp_enqueue_style( 'hv-footer', $css . 'footer.css', array( 'hv-chrome' ), HV_WEB_VERSION );
		if ( is_front_page() ) {
			wp_enqueue_style( 'hv-promo-tones', $css . 'promo-tones.css', array( 'hv-footer' ), HV_WEB_VERSION );
			wp_enqueue_style( 'hv-home', $css . 'home.css', array( 'hv-promo-tones' ), HV_WEB_VERSION );
			wp_enqueue_style( 'hv-home-rails', $css . 'home-rails.css', array( 'hv-home' ), HV_WEB_VERSION );
			wp_enqueue_style( 'hv-home-blocks', $css . 'home-blocks.css', array( 'hv-home-rails' ), HV_WEB_VERSION );
			wp_enqueue_script( 'hv-home', HV_WEB_URI . '/assets/js/home.js', array(), HV_WEB_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
		} else {
			wp_enqueue_style( 'hv-content', $css . 'content.css', array( 'hv-footer' ), HV_WEB_VERSION );
			wp_enqueue_style( 'hv-article', $css . 'article.css', array( 'hv-content' ), HV_WEB_VERSION );
			if ( is_page( 'xe-san-bay' ) ) { // trang sân bay dùng lại thẻ tuyến của trang chủ.
				wp_enqueue_style( 'hv-home-blocks', $css . 'home-blocks.css', array( 'hv-article' ), HV_WEB_VERSION );
			}
			if ( is_post_type_archive( 'uu_dai' ) ) { // trang /uu-dai dùng lại thẻ ưu đãi của trang chủ.
				wp_enqueue_style( 'hv-promo-tones', $css . 'promo-tones.css', array( 'hv-article' ), HV_WEB_VERSION );
				wp_enqueue_style( 'hv-home-rails', $css . 'home-rails.css', array( 'hv-promo-tones' ), HV_WEB_VERSION );
				wp_enqueue_style( 'hv-offers-page', $css . 'offers-page.css', array( 'hv-home-rails' ), HV_WEB_VERSION );
			}
		}
		wp_enqueue_script( 'hv-site', HV_WEB_URI . '/assets/js/site.js', array(), HV_WEB_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
		wp_add_inline_script( 'hv-site', 'window.HV_SITE=' . wp_json_encode( hv_site_js_config() ) . ';', 'before' );
	},
	20
);

/**
 * Cấu hình truyền cho JS (không chứa bí mật).
 *
 * @return array<string,mixed>
 */
function hv_site_js_config() {
	$lang = hv_lang();
	return array(
		'lang'      => $lang,
		'prefix'    => hv_lang_prefix( $lang ),
		'sessionUrl' => '/api/hv/auth/session',
		'logoutUrl' => '/api/hv/auth/logout',
		'i18n'      => array(
			'login'    => hv_t( 'login' ),
			'account'  => hv_t( 'account' ),
			'profile'  => hv_t( 'personal_infor' ),
			'offers'   => hv_t( 'my_offer' ),
			'loyalty'  => hv_t( 'intro4' ),
			'trips'    => hv_t( 'my_trip' ),
			'logout'   => hv_t( 'logout' ),
			'logoutFailed' => hv_t( 'logout_failed' ),
			'accountLabel' => hv_t( 'account' ),
		),
	);
}
