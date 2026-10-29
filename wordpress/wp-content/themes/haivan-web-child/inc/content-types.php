<?php
/**
 * Loại nội dung giữ URL cũ + hỗ trợ Polylang (cùng slug ở hai ngôn ngữ).
 *
 *  /diem-den/<slug>                      -> diem_den  (trang điểm đến + danh sách bài của điểm đó; archive /diem-den)
 *  /diem-den/<điểm>/<slug bài>           -> bai_viet  (bài viết theo điểm đến; điểm = taxonomy hv_location)
 *  /chung-toi/bao-chi-tin-tuc/<slug>     -> tin_tuc   (tin công ty; archive /chung-toi/bao-chi-tin-tuc)
 *  /uu-dai/<id>                          -> uu_dai
 *  (không public) hv_route               -> tuyến phổ biến ở trang chủ
 *
 * bai_viet không dịch qua Polylang (web cũ để nội dung tiếng Việt dưới /en/ với vỏ tiếng Anh): /en/diem-den/<điểm>/<slug> trả 200 như cũ.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'init',
	static function () {
		$common = array(
			'public'       => true,
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields' ),
			'menu_icon'    => 'dashicons-location-alt',
		);

		register_post_type(
			'diem_den',
			array_merge(
				$common,
				array(
					'label'       => 'Điểm đến',
					'labels'      => array(
						'name'          => 'Điểm đến',
						'singular_name' => 'Điểm đến',
						'add_new_item'  => 'Thêm điểm đến',
						'edit_item'     => 'Sửa điểm đến',
					),
					'has_archive' => 'diem-den',
					'rewrite'     => array( 'slug' => 'diem-den', 'with_front' => false ),
					'menu_icon'   => 'dashicons-location-alt',
				)
			)
		);

		register_post_type(
			'tin_tuc',
			array_merge(
				$common,
				array(
					'label'       => 'Tin tức',
					'labels'      => array(
						'name'          => 'Tin tức',
						'singular_name' => 'Tin tức',
						'add_new_item'  => 'Thêm bài tin tức',
						'edit_item'     => 'Sửa bài tin tức',
					),
					'has_archive' => 'chung-toi/bao-chi-tin-tuc',
					'rewrite'     => array( 'slug' => 'chung-toi/bao-chi-tin-tuc', 'with_front' => false ),
					'menu_icon'   => 'dashicons-megaphone',
				)
			)
		);

		register_post_type(
			'uu_dai',
			array_merge(
				$common,
				array(
					'label'       => 'Ưu đãi',
					'labels'      => array(
						'name'          => 'Bài ưu đãi',
						'menu_name'     => 'Bài ưu đãi (chi tiết)',
						'singular_name' => 'Bài ưu đãi',
						'add_new_item'  => 'Thêm ưu đãi',
						'edit_item'     => 'Sửa ưu đãi',
					),
					'has_archive' => 'uu-dai', // /uu-dai = trang tổng hợp ưu đãi (archive-uu_dai.php).
					'rewrite'     => array( 'slug' => 'uu-dai', 'with_front' => false ),
					'menu_icon'   => 'dashicons-tickets-alt',
				)
			)
		);

		// Bài viết theo điểm đến: URL /diem-den/<điểm>/<slug>. Tự xử lý rewrite (hv_post_type_link + rule bên dưới).
		register_taxonomy(
			'hv_location',
			'bai_viet',
			array(
				'label'              => 'Điểm đến của bài',
				'labels'             => array(
					'name'          => 'Điểm đến của bài',
					'singular_name' => 'Điểm đến',
					'menu_name'     => 'Điểm đến (nhóm bài)',
					'add_new_item'  => 'Thêm điểm đến',
					'edit_item'     => 'Sửa điểm đến',
				),
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => true,
				'show_admin_column'  => true,
				'show_in_rest'       => true,
				'hierarchical'       => true, // ô chọn dạng checkbox trong editor; mỗi bài chỉ dùng 1 điểm.
				'rewrite'            => false,
				'query_var'          => false,
			)
		);
		register_taxonomy(
			'hv_tag',
			'bai_viet',
			array(
				'label'              => 'Thẻ bài viết',
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => true,
				'show_in_rest'       => true,
				'hierarchical'       => false,
				'rewrite'            => false,
				'query_var'          => false,
			)
		);
		register_post_type(
			'bai_viet',
			array_merge(
				$common,
				array(
					'label'       => 'Bài viết điểm đến',
					'labels'      => array(
						'name'          => 'Bài viết điểm đến',
						'singular_name' => 'Bài viết điểm đến',
						'add_new_item'  => 'Thêm bài viết điểm đến',
						'edit_item'     => 'Sửa bài viết điểm đến',
					),
					'has_archive' => false,
					'rewrite'     => false,
					'taxonomies'  => array( 'hv_location', 'hv_tag' ),
					'menu_icon'   => 'dashicons-admin-post',
					'menu_position' => 20,
				)
			)
		);

		register_post_type(
			'hv_route',
			array(
				'label'               => 'Tuyến phổ biến',
				'labels'              => array(
					'name'          => 'Tuyến phổ biến',
					'singular_name' => 'Tuyến phổ biến',
					'add_new_item'  => 'Thêm tuyến phổ biến',
					'edit_item'     => 'Sửa tuyến phổ biến',
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title', 'thumbnail', 'page-attributes' ),
				'menu_icon'           => 'dashicons-randomize',
				'menu_position'       => 21,
			)
		);
	},
	5
);


/**
 * Giữ lại các ID thuộc ngôn ngữ $lang. Lọc bằng API Polylang thay vì tham số truy vấn "lang"/tax_query:
 * hai cách đó chỉ có tác dụng khi Polylang đã gắn bộ lọc vào truy vấn (không đúng ở admin/WP-CLI).
 *
 * @param int[]  $ids  Danh sách ID bài.
 * @param string $lang Mã ngôn ngữ.
 * @return int[]
 */
function hv_ids_in_lang( array $ids, $lang ) {
	if ( ! function_exists( 'pll_get_post_language' ) ) {
		return $ids;
	}
	return array_values(
		array_filter(
			$ids,
			static fn( $id ) => pll_get_post_language( (int) $id ) === $lang
		)
	);
}

/** Cho Polylang dịch các loại nội dung này. */
add_filter(
	'pll_get_post_types',
	static function ( $types, $is_settings ) {
		foreach ( array( 'diem_den', 'tin_tuc', 'uu_dai' ) as $type ) {
			$types[ $type ] = $type;
		}
		return $types;
	},
	10,
	2
);

/**
 * Trang (page) cùng slug ở vi và en: Polylang bản miễn phí thêm hậu tố "-en". Cho phép trùng slug khi
 * hai trang khác ngôn ngữ (tương đương "share slugs" của bản Pro) để giữ URL /en/<slug cũ>.
 */
add_filter(
	'wp_unique_post_slug',
	static function ( $slug, $post_id, $post_status, $post_type, $post_parent, $original_slug ) {
		if ( $slug === $original_slug || 'page' !== $post_type || ! function_exists( 'pll_get_post_language' ) ) {
			return $slug;
		}
		$lang = pll_get_post_language( $post_id );
		if ( ! $lang ) {
			return $slug;
		}
		$same_slug = get_posts(
			array(
				'post_type'        => 'page',
				'name'             => $original_slug,
				'post_parent'      => (int) $post_parent,
				'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
				'post__not_in'     => array( (int) $post_id ),
				'numberposts'      => 50,
				'fields'           => 'ids',
				'suppress_filters' => true,
			)
		);
		return hv_ids_in_lang( $same_slug, $lang ) ? $slug : $original_slug;
	},
	10,
	6
);

/**
 * Giải đường dẫn trang theo ngôn ngữ hiện tại (core dùng get_page_by_path, không biết ngôn ngữ).
 */
add_filter(
	'request',
	static function ( $query_vars ) {
		if ( empty( $query_vars['pagename'] ) || ! function_exists( 'pll_default_language' ) || is_admin() ) {
			return $query_vars;
		}
		$lang = ! empty( $query_vars['lang'] ) ? sanitize_key( $query_vars['lang'] ) : pll_default_language();
		$path = trim( (string) $query_vars['pagename'], '/' );
		$leaf = basename( $path );
		$ids  = hv_ids_in_lang(
			get_posts(
				array(
					'post_type'        => 'page',
					'name'             => $leaf,
					'post_status'      => 'publish',
					'numberposts'      => 50,
					'fields'           => 'ids',
					'suppress_filters' => true,
				)
			),
			$lang
		);
		foreach ( $ids as $id ) {
			if ( trim( (string) get_page_uri( $id ), '/' ) === $path ) {
				unset( $query_vars['pagename'] );
				$query_vars['page_id'] = (int) $id;
				break;
			}
		}
		return $query_vars;
	},
	20
);

/* ======================================================================
 * Bài viết điểm đến: /diem-den/<điểm>/<slug>
 * ==================================================================== */

/** Slug gốc của điểm gắn với bài (term đầu tiên của hv_location), '' nếu chưa gắn. */
function hv_post_location_slug( $post_id ) {
	$terms = get_the_terms( (int) $post_id, 'hv_location' );
	if ( ! is_array( $terms ) || ! $terms ) {
		return '';
	}
	return (string) reset( $terms )->slug;
}

/**
 * Rewrite tự quản: web cũ phục vụ bài theo slug bài (đoạn <điểm> không quan trọng, kể cả sai điểm vẫn 200),
 * nên rule chỉ bắt slug bài; URL chuẩn (permalink, canonical, sitemap) luôn dùng điểm thật của bài.
 */
add_action(
	'init',
	static function () {
		add_rewrite_rule( '^diem-den/([^/]+)/([^/]+)/?$', 'index.php?bai_viet=$matches[2]', 'top' );
		add_rewrite_rule( '^en/diem-den/([^/]+)/([^/]+)/?$', 'index.php?bai_viet=$matches[2]&lang=en', 'top' );
	},
	6
);

add_filter(
	'post_type_link',
	static function ( $link, $post ) {
		if ( ! $post instanceof WP_Post || 'bai_viet' !== $post->post_type ) {
			return $link;
		}
		if ( ! in_array( $post->post_status, array( 'publish', 'private' ), true ) && '' === (string) $post->post_name ) {
			return $link;
		}
		$loc = hv_post_location_slug( $post->ID );
		return home_url( '/diem-den/' . ( '' !== $loc ? $loc : 'tong-hop' ) . '/' . $post->post_name );
	},
	10,
	2
);

/**
 * Đoạn <điểm> trên URL không ép khớp điểm thật của bài (như web cũ: 200, canonical trỏ URL chuẩn), nên không để core
 * đổi sang permalink. Chỉ chuẩn hoá dấu "/" cuối (như các trang khác: /slug/ -> /slug).
 *
 * @param string|false $redirect_url  URL core định chuyển tới.
 * @param string       $requested_url URL được yêu cầu.
 */
add_filter(
	'redirect_canonical',
	static function ( $redirect_url, $requested_url ) {
		if ( ! is_singular( 'bai_viet' ) ) {
			return $redirect_url;
		}
		$p    = wp_parse_url( (string) $requested_url );
		$path = (string) ( $p['path'] ?? '' );
		if ( '/' !== $path && '/' === substr( $path, -1 ) && ! empty( $p['host'] ) ) {
			return ( $p['scheme'] ?? 'http' ) . '://' . $p['host'] . ( isset( $p['port'] ) ? ':' . $p['port'] : '' )
				. rtrim( $path, '/' ) . ( isset( $p['query'] ) ? '?' . $p['query'] : '' );
		}
		return false;
	},
	10,
	2
);

/* ======================================================================
 * Trang điểm đến: danh sách bài, phân trang ?page=N
 * ==================================================================== */

/** Số bài mỗi trang điểm đến (như API cũ: 10/trang). */
const HV_DEST_PER_PAGE = 10;

/**
 * `page` là query var của lõi (trang con <!--nextpage--> của bài), nên ?page=N trên điểm đến sẽ bị lõi coi là 404
 * hoặc redirect sang /slug/N. Lấy N ra khỏi query vars trước khi lõi xử lý.
 */
add_filter(
	'request',
	static function ( $vars ) {
		if ( ! empty( $vars['diem_den'] ) && isset( $_GET['page'] ) && ! is_admin() ) { // phpcs:ignore WordPress.Security.NonceVerification
			$n = (int) $_GET['page']; // phpcs:ignore WordPress.Security.NonceVerification,WordPress.Security.ValidatedSanitizedInput
			$GLOBALS['hv_dest_page'] = $n >= 1 ? $n : 1;
			unset( $vars['page'] );
		}
		return $vars;
	}
);

/** Trang hiện tại của danh sách bài trên trang điểm đến (1 nếu không có ?page). */
function hv_dest_page() {
	return isset( $GLOBALS['hv_dest_page'] ) ? max( 1, (int) $GLOBALS['hv_dest_page'] ) : 1;
}

/**
 * Bài của một điểm đến, mới nhất trước.
 *
 * @param string $loc_slug Slug term hv_location.
 * @param int    $page     Trang (1..).
 * @return WP_Query
 */
function hv_destination_query( $loc_slug, $page = 1 ) {
	return new WP_Query(
		array(
			'post_type'              => 'bai_viet',
			'post_status'            => 'publish',
			'posts_per_page'         => HV_DEST_PER_PAGE,
			'paged'                  => max( 1, (int) $page ),
			'orderby'                => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'tax_query'              => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array(
					'taxonomy' => 'hv_location',
					'field'    => 'slug',
					'terms'    => sanitize_title( $loc_slug ),
				),
			),
			'ignore_sticky_posts'    => true,
			'no_found_rows'          => false,
			'update_post_term_cache' => true,
			'suppress_filters'       => true,
		)
	);
}

/** 404 khi ?page vượt số trang (không trả trang rỗng 200). */
add_action(
	'template_redirect',
	static function () {
		if ( ! is_singular( 'diem_den' ) || ! isset( $GLOBALS['hv_dest_page'] ) ) {
			return;
		}
		$q = hv_destination_query( (string) get_post_field( 'post_name', get_queried_object_id() ), hv_dest_page() );
		if ( hv_dest_page() > max( 1, (int) $q->max_num_pages ) ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			nocache_headers();
		}
	},
	5
);

/** Canonical của trang ?page=N giữ nguyên tham số (trang 1 = URL gốc), để Rank Math không dồn mọi trang về trang 1. */
add_filter(
	'rank_math/frontend/canonical',
	static function ( $canonical ) {
		if ( is_singular( 'diem_den' ) && hv_dest_page() > 1 && $canonical ) {
			return add_query_arg( 'page', hv_dest_page(), $canonical );
		}
		return $canonical;
	}
);

/**
 * Mỗi điểm đến (diem_den) có một term hv_location cùng slug; tạo/đồng bộ tên khi MKT lưu điểm đến.
 */
add_action(
	'save_post_diem_den',
	static function ( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || 'publish' !== $post->post_status || '' === $post->post_name ) {
			return;
		}
		hv_ensure_location_term( $post->post_name, $post->post_title );
	},
	10,
	2
);

/**
 * @param string $slug Slug điểm.
 * @param string $name Tên hiển thị.
 * @return int term_id hoặc 0.
 */
function hv_ensure_location_term( $slug, $name ) {
	$slug = sanitize_title( $slug );
	$term = get_term_by( 'slug', $slug, 'hv_location' );
	if ( $term instanceof WP_Term ) {
		if ( $term->name !== $name && '' !== $name ) {
			wp_update_term( $term->term_id, 'hv_location', array( 'name' => $name ) );
		}
		return (int) $term->term_id;
	}
	$res = wp_insert_term( '' !== $name ? $name : $slug, 'hv_location', array( 'slug' => $slug ) );
	return is_wp_error( $res ) ? 0 : (int) $res['term_id'];
}

/** Archive: /diem-den liệt kê hết điểm đến theo thứ tự ưu tiên; tin tức 12 bài/trang. */
add_action(
	'pre_get_posts',
	static function ( $q ) {
		if ( is_admin() || ! $q->is_main_query() ) {
			return;
		}
		if ( $q->is_post_type_archive( 'diem_den' ) ) {
			$q->set( 'posts_per_page', 60 );
			$q->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
		} elseif ( $q->is_post_type_archive( 'tin_tuc' ) ) {
			$q->set( 'posts_per_page', 12 );
		}
	}
);

/**
 * Cho phép công cụ ngoài (vd. Content Agent) đặt SEO title/description qua WP REST (Application Password):
 * meta của Rank Math không có sẵn trong REST. Chỉ người có quyền sửa bài mới ghi được; giá trị là văn bản thuần.
 */
add_action(
	'init',
	static function () {
		foreach ( array( 'bai_viet', 'tin_tuc', 'diem_den', 'uu_dai' ) as $type ) {
			foreach ( array( 'rank_math_title', 'rank_math_description' ) as $key ) {
				register_post_meta(
					$type,
					$key,
					array(
						'type'              => 'string',
						'single'            => true,
						'show_in_rest'      => true,
						'sanitize_callback' => 'sanitize_text_field',
						'auth_callback'     => static function ( $allowed, $meta_key, $post_id ) {
							return current_user_can( 'edit_post', (int) $post_id );
						},
					)
				);
			}
		}
	},
	7
);

/**
 * Không "làm đẹp" dấu câu (wptexturize): nó đổi " - " thành gạch en, " ' " thành nháy cong, "x" thành "×" trong tiêu đề/nội dung.
 * Web cũ hiển thị đúng chữ biên tập viên gõ (tiêu đề có dấu gạch ngang thường); giữ nguyên để tiêu đề trang khớp
 * với trang cũ và tiêu đề/mô tả SEO.
 */
add_action(
	'init',
	static function () {
		foreach ( array( 'the_title', 'the_content', 'the_excerpt', 'single_post_title' ) as $hook ) {
			remove_filter( $hook, 'wptexturize' );
		}
	},
	20
);
