<?php
/**
 * Dữ liệu header/footer dùng chung với app Next.js.
 *
 * REST: GET /wp-json/haivan-web/v1/layout  (hợp đồng = apps/booking/src/schemas/layout.ts).
 * Menu do MKT sửa trong Giao diện > Menu (theo từng ngôn ngữ Polylang). Menu trống → dùng
 * data/layout-seed.json (bản sao apps/booking/src/content/layout-fallback.json).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HV_LAYOUT_LANGS = array( 'vi', 'en' );

/**
 * Bản mẫu (seed) của layout.
 *
 * @return array<string,mixed>
 */
function hv_layout_seed() {
	static $seed = null;
	if ( null === $seed ) {
		$raw  = file_get_contents( HV_WEB_DIR . '/data/layout-seed.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		$seed = json_decode( (string) $raw, true );
		if ( ! is_array( $seed ) ) {
			$seed = array(
				'version'  => 1,
				'hotline'  => '',
				'vi'       => array( 'primary' => array(), 'footer_columns' => array(), 'company' => array( 'name' => '', 'lines' => array() ) ),
				'en'       => array( 'primary' => array(), 'footer_columns' => array(), 'company' => array( 'name' => '', 'lines' => array() ) ),
			);
		}
	}
	return $seed;
}

/**
 * Thiết lập chung (hotline, ứng dụng, thông tin công ty), mặc định lấy từ seed.
 *
 * @return array<string,mixed>
 */
function hv_layout_settings() {
	$seed     = hv_layout_seed();
	$cr       = $seed['copyright'] ?? '';
	$defaults = array(
		'hotline'   => (string) ( $seed['hotline'] ?? '' ),
		'messenger' => (string) ( $seed['messenger'] ?? '' ),
		'ios'       => (string) ( $seed['apps']['ios'] ?? '' ),
		'android'   => (string) ( $seed['apps']['android'] ?? '' ),
		// Trường tuỳ chọn của footer/dải app (hợp đồng layout v1 mở rộng).
		'partners'  => hv_layout_logos_to_text( $seed['partners'] ?? array() ),
		'members'   => hv_layout_logos_to_text( $seed['members'] ?? array() ),
		'payments'  => hv_layout_logos_to_text( $seed['payments'] ?? array() ),
		'social_facebook' => (string) ( $seed['social']['facebook'] ?? '' ),
		'social_youtube'  => (string) ( $seed['social']['youtube'] ?? '' ),
		'cert_href' => (string) ( $seed['certificate']['href'] ?? '' ),
		'cert_img'  => (string) ( $seed['certificate']['img'] ?? '' ),
		'cert_alt'  => (string) ( $seed['certificate']['alt'] ?? '' ),
		'qr'        => (string) ( $seed['qr'] ?? '' ),
		'badge_appstore'      => (string) ( $seed['badges']['appstore'] ?? '' ),
		'badge_playstore'     => (string) ( $seed['badges']['playstore'] ?? '' ),
		'badge_appstore_icon' => (string) ( $seed['badges']['appstore_icon'] ?? '' ),
		'badge_playstore_icon' => (string) ( $seed['badges']['playstore_icon'] ?? '' ),
		'copyright' => is_array( $cr ) ? (string) ( $cr['vi'] ?? '' ) : (string) $cr,
		'copyright_en' => is_array( $cr ) ? (string) ( $cr['en'] ?? '' ) : '',
		'logo_white' => (string) ( $seed['logo_white'] ?? '' ),
	);
	foreach ( HV_LAYOUT_LANGS as $lang ) {
		$defaults[ 'company_name_' . $lang ]  = (string) ( $seed[ $lang ]['company']['name'] ?? '' );
		$defaults[ 'company_lines_' . $lang ] = implode( "\n", (array) ( $seed[ $lang ]['company']['lines'] ?? array() ) );
	}
	$saved = get_option( 'hv_layout_settings', array() );
	$saved = is_array( $saved ) ? array_filter( $saved, static fn( $v ) => is_string( $v ) ) : array();
	return array_merge( $defaults, $saved );
}

/**
 * URL tuyệt đối cùng host → đường dẫn tương đối (hợp đồng dùng href tương đối).
 */
function hv_relative_href( $url ) {
	$url = (string) $url;
	if ( '' === $url || '#' === $url ) {
		return '#';
	}
	$parts = wp_parse_url( $url );
	if ( false === $parts ) {
		return '#';
	}
	// Scheme không phải http(s): tel:/mailto:/sms: giữ nguyên (đừng biến "tel:1900..." thành "/1900...");
	// scheme khác (javascript:, data:...) không hợp lệ làm href menu.
	if ( ! empty( $parts['scheme'] ) && ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) {
		return in_array( strtolower( $parts['scheme'] ), array( 'tel', 'mailto', 'sms' ), true ) ? $url : '#';
	}
	$home_host = (string) wp_parse_url( home_url(), PHP_URL_HOST );
	if ( ! empty( $parts['host'] ) && 0 !== strcasecmp( $parts['host'], $home_host ) ) {
		return $url; // liên kết ngoài giữ nguyên.
	}
	$path = $parts['path'] ?? '/';
	$path = '/' . ltrim( $path, '/' );
	if ( '/' !== $path ) {
		$path = rtrim( $path, '/' );
	}
	if ( isset( $parts['query'] ) && '' !== $parts['query'] ) {
		$path .= '?' . $parts['query'];
	}
	if ( isset( $parts['fragment'] ) && '' !== $parts['fragment'] ) {
		$path .= '#' . $parts['fragment'];
	}
	return $path;
}

/**
 * Menu được gán cho (location, lang) hoặc 0.
 */
function hv_menu_id_for( $location, $lang ) {
	$theme = get_option( 'stylesheet' );
	$poly  = get_option( 'polylang' );
	if ( is_array( $poly ) && isset( $poly['nav_menus'][ $theme ][ $location ][ $lang ] ) ) {
		return (int) $poly['nav_menus'][ $theme ][ $location ][ $lang ];
	}
	if ( 'vi' === $lang && ! function_exists( 'pll_current_language' ) ) {
		$locations = get_nav_menu_locations();
		return (int) ( $locations[ $location ] ?? 0 );
	}
	return 0;
}

/**
 * Cây menu {label, href, children?} hoặc null khi menu chưa gán / rỗng.
 *
 * @return array<int,array<string,mixed>>|null
 */
function hv_menu_tree( $location, $lang ) {
	$menu_id = hv_menu_id_for( $location, $lang );
	if ( $menu_id <= 0 ) {
		return null;
	}
	$items = wp_get_nav_menu_items( $menu_id );
	if ( ! is_array( $items ) || ! $items ) {
		return null;
	}
	$by_parent = array();
	foreach ( $items as $item ) {
		if ( ! empty( $item->_invalid ) ) {
			continue;
		}
		$by_parent[ (int) $item->menu_item_parent ][] = $item;
	}
	$build = static function ( $parent_id ) use ( &$build, $by_parent ) {
		$nodes = array();
		foreach ( $by_parent[ $parent_id ] ?? array() as $item ) {
			$label = trim( html_entity_decode( wp_strip_all_tags( (string) $item->title ), ENT_QUOTES, 'UTF-8' ) );
			if ( '' === $label ) {
				continue;
			}
			$node     = array(
				'label' => $label,
				'href'  => hv_relative_href( (string) $item->url ),
			);
			$children = $build( (int) $item->ID );
			if ( $children ) {
				$node['children'] = $children;
			}
			$nodes[] = $node;
		}
		return $nodes;
	};
	$tree = $build( 0 );
	return $tree ? $tree : null;
}

/**
 * Khối layout của một ngôn ngữ.
 *
 * @return array<string,mixed>
 */
function hv_layout_for_lang( $lang ) {
	$lang = 'en' === $lang ? 'en' : 'vi';
	$seed = hv_layout_seed()[ $lang ];
	$s    = hv_layout_settings();

	$primary = hv_menu_tree( 'hv_primary', $lang );
	$footer  = hv_menu_tree( 'hv_footer', $lang );

	$columns = array();
	if ( $footer ) {
		foreach ( $footer as $col ) {
			$columns[] = array(
				'title' => $col['label'],
				'items' => $col['children'] ?? array(),
			);
		}
	} else {
		$columns = $seed['footer_columns'];
	}

	$lines = array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $s[ 'company_lines_' . $lang ] ) ?: array() ), static fn( $l ) => '' !== $l ) );

	return array(
		'primary'        => $primary ? $primary : $seed['primary'],
		'footer_columns' => $columns,
		'company'        => array(
			'name'  => $s[ 'company_name_' . $lang ],
			'lines' => $lines,
		),
	);
}

/** Ảnh hợp lệ theo hợp đồng: "/assets/..." (không //host, không /\host) hoặc https. Sai thì rỗng. */
function hv_layout_img( $v ) {
	$v = trim( (string) $v );
	// URL Media của chính site -> đường dẫn tương đối (cùng origin sau nginx gốc, Next cũng nạp được).
	$home = untrailingslashit( home_url() );
	if ( '' !== $home && 0 === strpos( $v, $home . '/' ) ) {
		$v = substr( $v, strlen( $home ) );
	}
	return 1 === preg_match( '#^(/(?![/\\\\])|https://)#', $v ) && ! preg_match( '/[\x00-\x20"\'<>]/', $v ) ? $v : '';
}

/** Liên kết ngoài hợp lệ: chỉ http(s). */
function hv_layout_http( $v ) {
	$v = esc_url_raw( trim( (string) $v ), array( 'http', 'https' ) );
	return $v;
}

/** Danh sách logo {img,href?,alt} -> văn bản "img | href | alt" mỗi dòng (ô nhập của MKT). */
function hv_layout_logos_to_text( $list ) {
	$lines = array();
	foreach ( (array) $list as $it ) {
		if ( is_array( $it ) && ! empty( $it['img'] ) ) {
			$lines[] = $it['img'] . ' | ' . ( $it['href'] ?? '' ) . ' | ' . ( $it['alt'] ?? '' );
		}
	}
	return implode( "\n", $lines );
}

/** Văn bản "img | href | alt" -> danh sách logo hợp lệ (dòng sai bị bỏ). */
function hv_layout_text_to_logos( $text ) {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) ?: array() as $line ) {
		$p   = array_map( 'trim', explode( '|', $line ) );
		$img = hv_layout_img( $p[0] ?? '' );
		if ( '' === $img ) {
			continue;
		}
		$item = array( 'img' => $img );
		$href = hv_layout_http( $p[1] ?? '' );
		if ( '' !== $href ) {
			$item['href'] = $href;
		}
		$item['alt'] = '' !== ( $p[2] ?? '' ) ? $p[2] : 'Logo';
		$out[]       = $item;
	}
	return $out;
}

/**
 * Dòng bản quyền với năm luôn là năm hiện tại (giờ Việt Nam): thay {year}, và năm gõ tay đứng một mình sau © ("© 2020").
 * Khoảng năm ("© 2008-2026") giữ nguyên.
 *
 * @param mixed $text Dòng bản quyền MKT nhập.
 */
function hv_copyright_text( $text ) {
	$year = wp_date( 'Y', null, new DateTimeZone( 'Asia/Ho_Chi_Minh' ) );
	$text = str_replace( '{year}', $year, trim( (string) $text ) );
	return trim( (string) preg_replace( '/(©\s*)\d{4}(?![\d–-])/u', '${1}' . $year, $text ) );
}

/**
 * Trường tuỳ chọn của hợp đồng: vắng = Next dùng layout-fallback.json; mảng rỗng = ẩn hàng đó.
 *
 * @param array<string,string> $s Thiết lập.
 * @return array<string,mixed>
 */
function hv_layout_optional_fields( array $s ) {
	$out = array();
	foreach ( array( 'partners', 'members', 'payments' ) as $k ) {
		$out[ $k ] = hv_layout_text_to_logos( $s[ $k ] ?? '' );
	}
	$social = array_filter(
		array(
			'facebook' => hv_layout_http( $s['social_facebook'] ?? '' ),
			'youtube'  => hv_layout_http( $s['social_youtube'] ?? '' ),
		)
	);
	if ( $social ) {
		$out['social'] = $social;
	}
	$cert_href = hv_layout_http( $s['cert_href'] ?? '' );
	$cert_img  = hv_layout_img( $s['cert_img'] ?? '' );
	if ( '' !== $cert_href && '' !== $cert_img ) {
		$out['certificate'] = array( 'href' => $cert_href, 'img' => $cert_img );
		if ( '' !== trim( (string) ( $s['cert_alt'] ?? '' ) ) ) {
			$out['certificate']['alt'] = trim( $s['cert_alt'] );
		}
	}
	if ( '' !== hv_layout_img( $s['qr'] ?? '' ) ) {
		$out['qr'] = hv_layout_img( $s['qr'] );
	}
	$appstore  = hv_layout_img( $s['badge_appstore'] ?? '' );
	$playstore = hv_layout_img( $s['badge_playstore'] ?? '' );
	if ( '' !== $appstore && '' !== $playstore ) {
		$out['badges'] = array( 'appstore' => $appstore, 'playstore' => $playstore );
		foreach ( array( 'appstore_icon', 'playstore_icon' ) as $k ) {
			if ( '' !== hv_layout_img( $s[ 'badge_' . $k ] ?? '' ) ) {
				$out['badges'][ $k ] = hv_layout_img( $s[ 'badge_' . $k ] );
			}
		}
	}
	$cr_vi = hv_copyright_text( $s['copyright'] ?? '' );
	$cr_en = hv_copyright_text( $s['copyright_en'] ?? '' );
	if ( '' !== $cr_vi || '' !== $cr_en ) {
		// Mỗi ngôn ngữ một dòng (Next nhận chuỗi hoặc {vi,en}); thiếu bên nào thì mượn bên kia để không bỏ trống.
		$out['copyright'] = array( 'vi' => '' !== $cr_vi ? $cr_vi : $cr_en, 'en' => '' !== $cr_en ? $cr_en : $cr_vi );
	}
	if ( '' !== hv_layout_img( $s['logo_white'] ?? '' ) ) {
		$out['logo_white'] = hv_layout_img( $s['logo_white'] );
	}
	return $out;
}

/**
 * Toàn bộ payload REST.
 *
 * @return array<string,mixed>
 */
function hv_layout_payload() {
	static $cache = null; // header + footer + REST dùng chung một lần dựng trong mỗi request.
	if ( null !== $cache ) {
		return $cache;
	}
	$s   = hv_layout_settings();
	$out = array(
		'version' => 1,
		'hotline' => $s['hotline'],
	);
	if ( '' !== $s['messenger'] ) {
		$out['messenger'] = $s['messenger'];
	}
	if ( '' !== $s['ios'] && '' !== $s['android'] ) {
		$out['apps'] = array(
			'ios'     => $s['ios'],
			'android' => $s['android'],
		);
	}
	$out = array_merge( $out, hv_layout_optional_fields( $s ) );
	foreach ( HV_LAYOUT_LANGS as $lang ) {
		$out[ $lang ] = hv_layout_for_lang( $lang );
	}
	$cache = $out;
	return $out;
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'haivan-web/v1',
			'/layout',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return new WP_REST_Response( hv_layout_payload(), 200 );
				},
			)
		);
	}
);

/**
 * Endpoint công khai, cache 1 giờ (CDN/trình duyệt/Next). Đặt sau mọi filter của core
 * (core mặc định gửi no-cache cho REST).
 */
add_filter(
	'rest_post_dispatch',
	static function ( $response, $server, $request ) {
		if ( '/haivan-web/v1/layout' === $request->get_route() && $response instanceof WP_REST_Response && 200 === $response->get_status() ) {
			$response->header( 'Cache-Control', 'public, max-age=3600' );
			$response->header( 'Access-Control-Allow-Origin', '*' );
		}
		return $response;
	},
	999,
	3
);

/* ------------------------------------------------------------------ */
/* Seed menu thật từ bản mẫu (gọi bởi scripts/seed-site.php)           */
/* ------------------------------------------------------------------ */

/**
 * Tạo menu "Header (vi)", "Footer (en)"... từ seed khi chưa có mục nào, rồi gán theo ngôn ngữ.
 * Vị trí đã gán menu (còn tồn tại) thì bỏ qua hoàn toàn: không tạo, không gán lại (giữ lựa chọn của MKT).
 *
 * @param bool $force Ghi đè menu đã có mục.
 * @return array<string,int> tên menu => id
 */
function hv_seed_menus( $force = false ) {
	$seed    = hv_layout_seed();
	$theme   = get_option( 'stylesheet' );
	$created = array();
	$poly    = get_option( 'polylang' );
	$poly    = is_array( $poly ) ? $poly : array();
	$via_pll = function_exists( 'PLL' ) && isset( PLL()->options['nav_menus'] );
	if ( $via_pll ) {
		$poly['nav_menus'] = (array) PLL()->options['nav_menus'];
	}

	$add_items = static function ( $menu_id, array $nodes, $parent_id ) use ( &$add_items ) {
		foreach ( $nodes as $node ) {
			$item_id = wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'     => $node['label'],
					'menu-item-url'       => $node['href'],
					'menu-item-type'      => 'custom',
					'menu-item-status'    => 'publish',
					'menu-item-parent-id' => $parent_id,
				)
			);
			if ( ! is_wp_error( $item_id ) && ! empty( $node['children'] ) ) {
				$add_items( $menu_id, $node['children'], (int) $item_id );
			}
		}
	};

	foreach ( HV_LAYOUT_LANGS as $lang ) {
		$sets = array(
			'hv_primary' => array( 'Header (' . $lang . ')', $seed[ $lang ]['primary'] ),
			'hv_footer'  => array(
				'Footer (' . $lang . ')',
				array_map(
					static fn( $col ) => array(
						'label'    => $col['title'],
						'href'     => '#',
						'children' => $col['items'],
					),
					$seed[ $lang ]['footer_columns']
				),
			),
		);
		foreach ( $sets as $location => $def ) {
			list( $name, $nodes ) = $def;
			// Vị trí này (ngôn ngữ này) đã gán một menu còn tồn tại: MKT đang dùng, không tạo/gán lại.
			$assigned = (int) ( $poly['nav_menus'][ $theme ][ $location ][ $lang ] ?? 0 );
			if ( ! $force && $assigned > 0 && wp_get_nav_menu_object( $assigned ) ) {
				$created[ $name ] = $assigned;
				continue;
			}
			$menu = wp_get_nav_menu_object( $name );
			if ( ! $menu ) {
				$menu_id = wp_create_nav_menu( $name );
				if ( is_wp_error( $menu_id ) ) {
					continue;
				}
			} else {
				$menu_id = (int) $menu->term_id;
				if ( $force ) {
					foreach ( (array) wp_get_nav_menu_items( $menu_id ) as $old ) {
						wp_delete_post( $old->ID, true );
					}
				}
			}
			if ( ! wp_get_nav_menu_items( $menu_id ) ) {
				$add_items( $menu_id, $nodes, 0 );
			}
			$poly['nav_menus'][ $theme ][ $location ][ $lang ] = (int) $menu_id;
			if ( 'vi' === $lang ) {
				$locs              = get_theme_mod( 'nav_menu_locations', array() );
				$locs              = is_array( $locs ) ? $locs : array();
				$locs[ $location ] = (int) $menu_id;
				set_theme_mod( 'nav_menu_locations', $locs );
			}
			$created[ $name ] = (int) $menu_id;
		}
	}
	if ( $via_pll ) {
		// Polylang giữ tuỳ chọn trong bộ nhớ và ghi lại khi kết thúc tiến trình: ghi qua nó để không bị ghi đè.
		PLL()->options['nav_menus'] = $poly['nav_menus'];
	} else {
		update_option( 'polylang', $poly );
	}
	return $created;
}
