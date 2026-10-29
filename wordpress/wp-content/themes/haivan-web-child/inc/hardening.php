<?php
/**
 * Giảm bề mặt tấn công (WP cùng origin với BFF Next: XSS ở WP = gọi được BFF bằng phiên người dùng)
 * và giảm rò rỉ thông tin (tên đăng nhập, phiên bản).
 * Hằng DISALLOW_FILE_EDIT / DISALLOW_UNFILTERED_HTML đặt ở wp-config (compose.yaml).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ------------------------------------------------------------------ */
/* Thông tin phiên bản / khám phá API                                  */
/* ------------------------------------------------------------------ */

add_filter( 'xmlrpc_enabled', '__return_false' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'rest_output_link_wp_head', 10 ); // link api.w.org + alternate JSON của từng bài.
remove_action( 'template_redirect', 'rest_output_link_header', 11 );
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'feed_links', 2 );
remove_action( 'wp_head', 'feed_links_extra', 3 );
add_filter( 'the_generator', '__return_empty_string' );

// Header X-Pingback lộ đường dẫn xmlrpc.
add_filter(
	'wp_headers',
	static function ( $headers ) {
		unset( $headers['X-Pingback'] );
		return $headers;
	}
);

/**
 * Tài nguyên lõi WP gắn ?ver=<phiên bản WP> khi không có phiên bản riêng: thay bằng băm có muối (vẫn đổi khi
 * nâng cấp để phá cache, nhưng không lộ số phiên bản).
 */
$hv_mask_wp_ver = static function ( $src ) {
	global $wp_version;
	if ( is_string( $src ) && false !== strpos( $src, 'ver=' . $wp_version ) ) {
		$mask = substr( hash_hmac( 'sha256', (string) $wp_version, wp_salt() ), 0, 10 );
		$src  = str_replace( 'ver=' . $wp_version, 'ver=' . $mask, $src );
	}
	return $src;
};
add_filter( 'script_loader_src', $hv_mask_wp_ver, 20 );
add_filter( 'style_loader_src', $hv_mask_wp_ver, 20 );

/* ------------------------------------------------------------------ */
/* Không lộ tên đăng nhập (liệt kê tác giả)                            */
/* ------------------------------------------------------------------ */

/** Trả 404 bằng mẫu 404 của theme và dừng. */
function hv_render_404() {
	global $wp_query;
	if ( $wp_query instanceof WP_Query ) {
		$wp_query->set_404();
	}
	status_header( 404 );
	nocache_headers();
	$tpl = get_404_template();
	if ( $tpl ) {
		include $tpl;
	}
	exit;
}

// Không có archive tác giả: /author/<tên> không có rewrite rule.
add_filter( 'author_rewrite_rules', '__return_empty_array' );
add_filter( 'author_link', static fn() => home_url( '/' ), 99 );

/*
 * ?author=N và /author/*: 404, chạy ở ưu tiên 1 để đi TRƯỚC redirect_canonical (ưu tiên 10, vốn 301 ?author=1
 * sang /author/<tên đăng nhập>). Áp dụng cho cả người đã đăng nhập: quản trị dùng màn hình admin, không cần front-end.
 */
add_action(
	'template_redirect',
	static function () {
		if ( is_author() || isset( $_GET['author'] ) || isset( $_GET['author_name'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			hv_render_404();
		}
	},
	1
);

// oEmbed (/wp-json/oembed/1.0/embed?url=...) trả author_name/author_url.
add_filter(
	'oembed_response_data',
	static function ( $data ) {
		unset( $data['author_name'], $data['author_url'] );
		return $data;
	}
);

// Rank Math: nhãn "Written by <tác giả>" trong thẻ twitter:label/data của Slack/Twitter.
add_filter(
	'rank_math/opengraph/slack_enhanced_data',
	static function ( $data ) {
		$author = is_singular() ? get_the_author() : '';
		foreach ( (array) $data as $label => $value ) {
			if ( '' !== $author && $value === $author ) {
				unset( $data[ $label ] );
			}
		}
		return $data;
	}
);

// JSON-LD của Rank Math: bỏ thực thể Person của tác giả (tên đăng nhập + hash gravatar của email) và thuộc tính author.
add_filter(
	'rank_math/json_ld',
	static function ( $data ) {
		$org = array( '@type' => 'Organization', 'name' => get_bloginfo( 'name' ) );
		foreach ( (array) $data as $key => $entity ) {
			if ( ! is_array( $entity ) ) {
				continue;
			}
			if ( isset( $entity['@type'] ) && 'Person' === $entity['@type'] ) {
				unset( $data[ $key ] ); // thực thể tác giả; thực thể công ty có @type là mảng [Person, Organization].
				continue;
			}
			if ( isset( $entity['author'] ) ) {
				$data[ $key ]['author'] = $org;
			}
		}
		return $data;
	},
	99
);

// Feed (/feed, /comments/feed) có <dc:creator> = tên đăng nhập; web cũ không có feed → 404, bỏ liên kết feed.
foreach ( array( 'do_feed', 'do_feed_rdf', 'do_feed_rss', 'do_feed_rss2', 'do_feed_atom' ) as $hv_feed_hook ) {
	add_action( $hv_feed_hook, 'hv_render_404', 1 );
}
// Sitemap lõi WP có sitemap người dùng; sitemap thật do Rank Math (sitemap_index.xml).
add_filter( 'wp_sitemaps_enabled', '__return_false' );

// Không lộ danh sách user qua REST cho khách; khoá cả namespace /wp/v2 cho khách (kể cả ?rest_route=).
add_filter(
	'rest_endpoints',
	static function ( $endpoints ) {
		if ( ! is_user_logged_in() ) {
			unset( $endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
		}
		return $endpoints;
	}
);
add_filter(
	'rest_authentication_errors',
	static function ( $result ) {
		// $result có thể là true (lõi trả true cho khách không kèm nonce): chỉ giữ nguyên lỗi có sẵn.
		if ( is_wp_error( $result ) || is_user_logged_in() ) {
			return $result;
		}
		$route = isset( $GLOBALS['wp']->query_vars['rest_route'] ) ? '/' . ltrim( (string) $GLOBALS['wp']->query_vars['rest_route'], '/' ) : '';
		if ( 0 === strpos( $route, '/wp/v2' ) || 0 === strpos( $route, '/wp-site-health' ) ) {
			return new WP_Error( 'rest_forbidden', 'Yêu cầu đăng nhập.', array( 'status' => 401 ) );
		}
		return $result;
	},
	101 // sau rest_cookie_check_errors (100) để trạng thái đăng nhập đã chốt.
);

/* ------------------------------------------------------------------ */
/* Flatsome: chặn HTML/script thô từ admin (bypass DISALLOW_UNFILTERED_HTML) */
/* ------------------------------------------------------------------ */

/**
 * Flatsome echo thẳng theme_mod "Header/Footer/Body Scripts" (Flatsome > Advanced > Global Settings) và các khối HTML
 * (sau header, trước footer) lên mọi trang: một admin bị phishing = JS chạy cùng origin với BFF. Child theme không
 * dùng chúng, nên vô hiệu ở 3 lớp: (1) filter theme_mod trả rỗng, (2) gỡ các hàm echo, (3) ẩn trang Advanced + AJAX lưu.
 * Muốn bật lại (chỉ cho người vận hành, không qua admin UI): define( 'HV_ALLOW_FLATSOME_RAW_HTML', true ) trong wp-config.
 */
function hv_flatsome_raw_html_allowed() {
	return defined( 'HV_ALLOW_FLATSOME_RAW_HTML' ) && HV_ALLOW_FLATSOME_RAW_HTML;
}

if ( ! hv_flatsome_raw_html_allowed() ) {
	foreach ( array( 'html_scripts_header', 'html_scripts_footer', 'html_scripts_before_body', 'html_scripts_after_body', 'html_after_header', 'html_before_footer', 'html_after_footer' ) as $hv_mod ) {
		add_filter( 'theme_mod_' . $hv_mod, '__return_empty_string', PHP_INT_MAX );
	}
	add_action(
		'init',
		static function () {
			remove_action( 'wp_head', 'flatsome_custom_header_js' );
			remove_action( 'wp_footer', 'flatsome_footer_scripts' );
			remove_action( 'wp_footer', 'flatsome_before_body_close', apply_filters( 'flatsome_before_body_close_priority', 9999 ) );
			remove_action( 'flatsome_after_body_open', 'flatsome_after_body_open' );
			remove_action( 'wp_ajax_of_ajax_post_action', 'of_ajax_callback' );
		},
		99
	);
	add_action(
		'admin_menu',
		static function () {
			remove_submenu_page( 'flatsome-panel', 'optionsframework' );
		},
		9999
	);
}

/* ------------------------------------------------------------------ */
/* Hiệu năng (LCP): không nạp Flatsome/jQuery khi trang không dùng      */
/* ------------------------------------------------------------------ */

/** Trang dùng UX Builder / shortcode Flatsome (hoặc đang xem trong Customizer/UX Builder)? */
function hv_page_needs_flatsome() {
	if ( is_customize_preview() || isset( $_GET['app'] ) || isset( $_GET['ux_builder'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return true;
	}
	if ( is_singular() ) {
		$content = (string) get_post_field( 'post_content', get_queried_object_id() );
		if ( 1 === preg_match( '/\[(?:section|row|ux_[a-z_]+)\b/', $content ) ) {
			return true;
		}
	}
	return (bool) apply_filters( 'hv_load_flatsome_assets', false );
}

/** $handle (hoặc phụ thuộc của nó) có phụ thuộc $target không? */
function hv_script_depends_on( WP_Scripts $scripts, $handle, $target, array &$seen = array() ) {
	if ( isset( $seen[ $handle ] ) || ! isset( $scripts->registered[ $handle ] ) ) {
		return false;
	}
	$seen[ $handle ] = true;
	foreach ( (array) $scripts->registered[ $handle ]->deps as $dep ) {
		if ( $dep === $target || hv_script_depends_on( $scripts, $dep, $target, $seen ) ) {
			return true;
		}
	}
	return false;
}

/*
 * Header/footer của child theme là PHP/JS thuần (không gọi hàm Flatsome): flatsome.css/js, live-search, jQuery +
 * migrate, hoverIntent chỉ làm chậm LCP. Gỡ chúng trừ khi trang có shortcode UX Builder (section/row/ux_*),
 * hoặc đang trong Customizer/UX Builder, hoặc filter hv_load_flatsome_assets trả true.
 */
add_action(
	'wp_enqueue_scripts',
	static function () {
		if ( is_admin() || hv_page_needs_flatsome() ) {
			return;
		}
		$parent = trailingslashit( get_template_directory_uri() );
		foreach ( wp_styles()->registered as $handle => $item ) {
			if ( is_string( $item->src ) && 0 === strpos( $item->src, $parent ) ) {
				wp_dequeue_style( $handle );
				wp_deregister_style( $handle );
			}
		}
		foreach ( wp_scripts()->registered as $handle => $item ) {
			if ( is_string( $item->src ) && 0 === strpos( $item->src, $parent ) ) {
				wp_dequeue_script( $handle );
				wp_deregister_script( $handle );
			}
		}
		// style.css của child chỉ chứa khai báo theme (CSS thật ở assets/css/*.css): bỏ một request thừa.
		wp_dequeue_style( 'flatsome-style' );
		// jQuery & đồng bọn chỉ bỏ khi không còn script nào trong hàng đợi cần tới (plugin khác, thanh admin...).
		$scripts = wp_scripts();
		$libs    = array( 'jquery', 'jquery-core', 'jquery-migrate', 'hoverIntent' );
		$needed  = false;
		foreach ( $scripts->queue as $queued ) {
			foreach ( $libs as $lib ) {
				$seen = array();
				if ( $queued === $lib || hv_script_depends_on( $scripts, $queued, $lib, $seen ) ) {
					$needed = true;
					break 2;
				}
			}
		}
		if ( ! $needed ) {
			foreach ( $libs as $lib ) {
				wp_dequeue_script( $lib );
			}
		}
	},
	PHP_INT_MAX
);

// CSS tuỳ chỉnh/font của Flatsome (đọc theme_mod của Customizer) vô nghĩa khi không nạp Flatsome.
add_action(
	'wp',
	static function () {
		if ( is_admin() || hv_page_needs_flatsome() ) {
			return;
		}
		if ( class_exists( 'Kirki_Modules_CSS' ) ) {
			remove_action( 'wp_head', array( Kirki_Modules_CSS::get_instance(), 'print_styles_inline' ), 999 );
		}
		remove_action( 'wp_head', 'flatsome_custom_css', 100 );
		remove_action( 'wp_head', 'flatsome_javascript_detection', 0 );
		remove_action( 'wp_head', 'flatsome_viewport_meta', 1 );
	}
);

/*
 * Markup thừa của Flatsome in sau footer qua wp_footer: #main-menu (sidebar mobile có Search, Newsletter, icon mạng xã hội
 * trỏ "http://url"), lớp phủ body, popup cookie, khối UX Block. Header/footer của child tự dựng nên gỡ hết, ở mọi trang.
 */
add_action(
	'wp',
	static function () {
		remove_action( 'wp_footer', 'flatsome_mobile_menu', 7 );
		remove_action( 'wp_footer', 'flatsome_body_overlay' );
		remove_action( 'wp_footer', 'flatsome_cookie_notice_template' );
		remove_action( 'wp_footer', 'ux_block_frontend' );
		remove_action( 'wp_footer', 'flatsome_account_login_lightbox' );
		remove_action( 'wp_footer', 'flatsome_sticky_add_to_cart_template' );
	}
);

// Emoji script thừa → nhẹ trang (LCP).
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );

// Không đoán URL khi 404 (vd. /uu-dai → bài đầu tiên có slug bắt đầu bằng "uu-dai"): chỉ redirect có chủ đích.
add_filter( 'do_redirect_guess_404_permalink', '__return_false' );
