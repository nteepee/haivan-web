<?php
/**
 * wp eval-file /scripts/configure-site.php
 * Cấu hình Polylang (vi mặc định, en dưới /en/), Rank Math và các tuỳ chọn chung.
 * Chạy lại an toàn: chỉ Polylang (cấu trúc URL) và các cài đặt bảo mật được ép lại; tên site, module Rank Math...
 * chỉ đặt ở lần đầu (xem hvs_is_first_run).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
if ( ! function_exists( 'PLL' ) ) {
	WP_CLI::error( 'Polylang chưa bật.' );
}
require_once __DIR__ . '/lib/helpers.php';
$first = hvs_is_first_run(); // false: site đã cấu hình, không đụng tới tuỳ chọn MKT có thể đã sửa.

/* ---- Polylang ----------------------------------------------------------- */
$model = PLL()->model;
$have  = wp_list_pluck( $model->get_languages_list(), 'slug' );

$wanted = array(
	'vi' => array( 'name' => 'Tiếng Việt', 'slug' => 'vi', 'locale' => 'vi', 'rtl' => 0, 'term_group' => 0, 'flag' => 'vn' ),
	'en' => array( 'name' => 'English', 'slug' => 'en', 'locale' => 'en_US', 'rtl' => 0, 'term_group' => 1, 'flag' => 'us' ),
);
foreach ( $wanted as $slug => $args ) {
	if ( in_array( $slug, $have, true ) ) {
		continue;
	}
	$res = $model->add_language( $args );
	if ( is_wp_error( $res ) ) {
		WP_CLI::error( 'Polylang add_language(' . $slug . '): ' . $res->get_error_message() );
	}
	WP_CLI::log( "Polylang: thêm ngôn ngữ $slug" );
}

$desired = array(
	'default_lang'  => 'vi',
	'force_lang'    => 1,     // /en/ (thư mục), vi không tiền tố.
	'hide_default'  => true,
	'rewrite'       => true,  // bỏ /language/ khỏi URL.
	'redirect_lang' => true,  // URL trang chủ là /en/ (không phải /en/<slug trang>); vi ở "/" nhờ hide_default.
	'browser'       => false, // không tự đoán ngôn ngữ theo trình duyệt: URL xác định ngôn ngữ.
	'media_support' => false,
);
$post_types = array_values( array_unique( array_merge( (array) PLL()->options['post_types'], array( 'diem_den', 'tin_tuc', 'uu_dai' ) ) ) );
$desired['post_types'] = $post_types;
// Ghi qua đối tượng tuỳ chọn của Polylang (nó giữ bản sao trong bộ nhớ và ghi lại khi kết thúc tiến trình;
// update_option() trực tiếp sẽ bị ghi đè bằng giá trị cũ).
foreach ( $desired as $k => $v ) {
	PLL()->options[ $k ] = $v;
}
if ( method_exists( PLL()->model, 'clean_languages_cache' ) ) {
	PLL()->model->clean_languages_cache(); // home_url của ngôn ngữ được cache theo tuỳ chọn.
}
WP_CLI::log( 'Polylang: đã cấu hình (vi mặc định, en tại /en/).' );

/* ---- Tuỳ chọn chung (chỉ lần đầu; MKT sửa ở Cài đặt) -------------------- */
if ( $first ) {
	update_option( 'blogname', 'Hải Vân' );
	update_option( 'blogdescription', 'Hãng xe Hải Vân - xe liên tỉnh, xe hợp đồng, xe sân bay' );
	update_option( 'default_comment_status', 'closed' );
	update_option( 'default_ping_status', 'closed' );
	update_option( 'default_pingback_flag', 0 );
	update_option( 'users_can_register', 0 );
	update_option( 'show_avatars', 0 );
	update_option( 'uploads_use_yearmonth_folders', 1 );
}

/*
 * blog_public: noindex chỉ khi WP_ENV_TYPE đặt rõ local/development/staging (hvs_env_is_non_production).
 *  - Môi trường không phải production: luôn ép noindex mỗi lần chạy (không để bản thử bị lập chỉ mục).
 *  - Production: lần đầu đặt 1 (cho lập chỉ mục); các lần sau KHÔNG đổi (MKT có thể chủ ý noindex trước ngày ra mắt),
 *    nhưng báo to nếu đang noindex để không bỏ sót.
 */
if ( hvs_env_is_non_production() ) {
	update_option( 'blog_public', 0 );
	WP_CLI::log( 'blog_public=0 (môi trường ' . wp_get_environment_type() . ': noindex).' );
} elseif ( $first ) {
	update_option( 'blog_public', 1 );
	WP_CLI::log( 'blog_public=1 (production: cho phép lập chỉ mục).' );
} elseif ( ! (int) get_option( 'blog_public' ) ) {
	WP_CLI::warning( 'Môi trường production nhưng blog_public=0 (noindex). Ra mắt: wp option update blog_public 1.' );
}

/* ---- Rank Math ---------------------------------------------------------- */
if ( defined( 'RANK_MATH_VERSION' ) ) {
	if ( $first ) {
		// Chỉ module cần thiết (không analytics/seo-analysis/AI: gọi dịch vụ ngoài, nặng).
		update_option( 'rank_math_modules', array( 'sitemap', 'redirections', 'rich-snippet' ) );
		update_option( 'rank_math_is_configured', true );
		update_option( 'rank_math_registration_skip', 1 );
		delete_transient( '_rank_math_activation_redirect' );
		delete_option( 'rank_math_wizard_completed' );
		$sitemap = get_option( 'rank-math-options-sitemap', array() );
		$sitemap = is_array( $sitemap ) ? $sitemap : array();
		foreach ( array( 'page', 'diem_den', 'bai_viet', 'tin_tuc', 'uu_dai' ) as $pt ) {
			$sitemap[ 'pt_' . $pt . '_sitemap' ] = 'on';
		}
		$sitemap['pt_post_sitemap'] = 'off';
		update_option( 'rank-math-options-sitemap', $sitemap );
		WP_CLI::log( 'Rank Math: module sitemap/redirections/rich-snippet.' );
	}
	// Loại bài thêm sau lần cài đầu (bai_viet): đưa vào sitemap nếu MKT chưa quyết định (khoá chưa có); không đụng lựa chọn đã có.
	$sitemap = get_option( 'rank-math-options-sitemap', array() );
	$sitemap = is_array( $sitemap ) ? $sitemap : array();
	if ( ! isset( $sitemap['pt_bai_viet_sitemap'] ) ) {
		$sitemap['pt_bai_viet_sitemap'] = 'on';
		update_option( 'rank-math-options-sitemap', $sitemap );
		WP_CLI::log( 'Rank Math: thêm bai_viet vào sitemap.' );
	}
	// Bảo mật (luôn ép, không phải tuỳ chọn của MKT): không có trang/sitemap tác giả (lộ tên đăng nhập).
	$titles = get_option( 'rank-math-options-titles', array() );
	$titles = is_array( $titles ) ? $titles : array();
	if ( ( $titles['disable_author_archives'] ?? '' ) !== 'on' ) {
		$titles['disable_author_archives'] = 'on';
		update_option( 'rank-math-options-titles', $titles );
		WP_CLI::log( 'Rank Math: tắt archive tác giả.' );
	}
}

// Polylang cần biết sitemap/term ngôn ngữ: xoá cache rewrite để seed-site tạo rule đúng.
flush_rewrite_rules( false );
