<?php
/**
 * SEO phía theme: robots.txt, tiêu đề trang cho Rank Math.
 * Rank Math lo sitemap_index.xml, meta robots, canonical và JSON-LD cơ bản (đồ thị tri thức: Tổ chức "Hải Vân", xem
 * scripts/seo-setup.php, scripts/seo-hardening.php); theme bổ sung: dòng Sitemap của Next, chặn đường dẫn đăng nhập,
 * tiêu đề mô tả cho trang điểm đến / danh sách, và JSON-LD Article + BreadcrumbList (inc/schema.php).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * robots.txt: chặn bẫy thu thập (hơn nghìn URL /tai-khoan/dang-nhap?next=... sinh từ nút Đăng nhập), giữ nguyên các dòng Sitemap.
 * Quy tắc thêm vào nhóm "User-agent: *" sẵn có của Rank Math/WordPress.
 */
add_filter(
	'robots_txt',
	static function ( $output ) {
		$rules = array( 'Disallow: /tai-khoan/', 'Disallow: /en/tai-khoan/', 'Disallow: /*?next=' );
		$lines = preg_split( '/\r\n|\r|\n/', trim( (string) $output ) ) ?: array();
		$lines = array_values( array_filter( $lines, static fn( $l ) => ! in_array( trim( $l ), $rules, true ) ) ); // chạy lại không nhân đôi.
		$ua    = null;
		$last  = null;
		foreach ( $lines as $i => $l ) {
			if ( null === $ua ) {
				if ( 1 === preg_match( '/^user-agent:\s*\*\s*$/i', trim( $l ) ) ) {
					$ua   = $i;
					$last = $i;
				}
				continue;
			}
			if ( '' === trim( $l ) || 1 === preg_match( '/^(?:user-agent|sitemap):/i', trim( $l ) ) ) {
				break;
			}
			$last = $i;
		}
		if ( null === $ua ) {
			$lines = array_merge( array( 'User-agent: *' ), $rules, array( '' ), $lines );
		} else {
			array_splice( $lines, $last + 1, 0, $rules );
		}
		$output = implode( "\n", $lines );
		$line   = 'Sitemap: ' . home_url( '/xe-khach/sitemap.xml' );
		if ( false === strpos( $output, $line ) ) {
			$output = rtrim( $output ) . "\n" . $line;
		}
		return $output . "\n";
	},
	99
);

/** Thương hiệu cuối tiêu đề. */
function hv_seo_brand_suffix() {
	return 'en' === hv_lang() ? ' | Hai Van' : ' | Hải Vân';
}

/** Thêm "trang N" cho trang phân trang để tiêu đề không trùng nhau. */
function hv_seo_paged( $title, $page ) {
	return (int) $page > 1 ? sprintf( 'en' === hv_lang() ? '%s - page %d' : '%s - trang %d', $title, (int) $page ) : $title;
}

/**
 * Điểm đến có tuyến xe Hải Vân (theo slug trang điểm đến). Điểm đến khác (Hà Giang, Sa Pa... đã ngừng) không được viết "Xe đi X".
 *
 * @return string[]
 */
function hv_seo_served_destinations() {
	return (array) apply_filters( 'hv_served_destinations', array( 'vung-tau', 'ho-chi-minh', 'dien-bien', 'son-la', 'moc-chau', 'ha-noi' ) );
}

/**
 * Tiêu đề trang theo Rank Math:
 *  - /diem-den và /chung-toi/bao-chi-tin-tuc: tiếng Việt, không còn "Archive";
 *  - trang điểm đến: "Xe đi Mộc Châu, du lịch Mộc Châu | Hải Vân" (điểm có tuyến) hoặc "Du lịch X: cẩm nang & kinh nghiệm | Hải Vân";
 *  - trang nội dung mang nguyên tiêu đề trang chủ (nhập lại từ web cũ): dùng tên trang.
 * Tiêu đề MKT đã nhập riêng cho bài (rank_math_title khác tiêu đề trang chủ) luôn được giữ.
 */
add_filter(
	'rank_math/frontend/title',
	static function ( $title ) {
		$vi = 'vi' === hv_lang();
		if ( is_post_type_archive( 'uu_dai' ) ) {
			return hv_t( 'offers_page_h1' ) . ( $vi ? ' – Vé xe Hải Vân' : hv_seo_brand_suffix() );
		}
		if ( is_post_type_archive( 'diem_den' ) ) {
			return hv_seo_paged( $vi ? 'Điểm đến & kinh nghiệm du lịch' : 'Destinations & travel guides', get_query_var( 'paged' ) ) . hv_seo_brand_suffix();
		}
		if ( is_post_type_archive( 'tin_tuc' ) ) {
			return hv_seo_paged( $vi ? 'Tin tức & báo chí' : 'News & press', get_query_var( 'paged' ) ) . hv_seo_brand_suffix();
		}
		if ( is_singular( 'diem_den' ) ) {
			$post = get_queried_object();
			if ( $post instanceof WP_Post && '' === trim( (string) get_post_meta( $post->ID, 'rank_math_title', true ) ) ) {
				$name   = get_the_title( $post );
				$served = in_array( $post->post_name, hv_seo_served_destinations(), true );
				if ( $vi ) {
					$base = $served ? sprintf( 'Xe đi %1$s, du lịch %1$s', $name ) : sprintf( 'Du lịch %s: cẩm nang & kinh nghiệm', $name );
				} else {
					$base = $served ? sprintf( 'Bus to %1$s and %1$s travel guide', $name ) : sprintf( '%s travel guide & tips', $name );
				}
				return hv_seo_paged( $base, function_exists( 'hv_dest_page' ) ? hv_dest_page() : 1 ) . hv_seo_brand_suffix();
			}
		}
		if ( is_singular( 'page' ) && ! is_front_page() ) {
			$front = (int) get_option( 'page_on_front' );
			$home  = $front > 0 ? trim( (string) get_post_meta( $front, 'rank_math_title', true ) ) : '';
			$post  = get_queried_object();
			if ( '' !== $home && $post instanceof WP_Post && trim( (string) $title ) === $home ) {
				return get_the_title( $post ) . hv_seo_brand_suffix();
			}
		}
		// Bản en: tên site (%sitename% của Rank Math) là "Hải Vân" → viết không dấu như mọi chữ tiếng Anh khác.
		return $vi ? $title : str_replace( 'Hải Vân', 'Hai Van', (string) $title );
	},
	20
);

/**
 * Mô tả: /uu-dai dùng mô tả riêng; trang nội dung trùng nguyên văn mô tả trang chủ (nhập lại từ web cũ) lấy đoạn đầu của chính trang.
 */
add_filter(
	'rank_math/frontend/description',
	static function ( $desc ) {
		if ( is_post_type_archive( 'uu_dai' ) ) {
			return hv_t( 'offers_page_desc' );
		}
		// Rank Math mặc định "<Loại> Archive - Hải Vân": viết mô tả thật cho hai archive (cả vi lẫn en).
		$vi = 'vi' === hv_lang();
		if ( is_post_type_archive( 'diem_den' ) ) {
			return $vi ? 'Kinh nghiệm du lịch, xe đi và cẩm nang các điểm đến trên tuyến xe Hải Vân: Hà Nội, Điện Biên, Sơn La, Mộc Châu, Vũng Tàu, Sài Gòn.' : 'Travel guides for destinations on the Hai Van coach network: Hanoi, Dien Bien, Son La, Moc Chau, Vung Tau and Ho Chi Minh City.';
		}
		if ( is_post_type_archive( 'tin_tuc' ) ) {
			return $vi ? 'Tin tức, thông cáo và bài báo chí về hãng xe Hải Vân.' : 'News, announcements and press coverage of Hai Van coaches.';
		}
		if ( ! $vi && hv_has_vi( (string) $desc ) ) {
			// Bản en không bao giờ hiện mô tả tiếng Việt (mô tả cũ / mô tả mặc định của site): dùng mô tả tiếng Anh chung.
			return 'Hai Van coaches: intercity buses, private hire and airport transfers in Vietnam. Book online or call 1900 6763.';
		}
		if ( is_singular( 'page' ) && ! is_front_page() ) {
			$front = (int) get_option( 'page_on_front' );
			$home  = $front > 0 ? trim( (string) get_post_meta( $front, 'rank_math_description', true ) ) : '';
			$post  = get_queried_object();
			if ( '' !== $home && $post instanceof WP_Post && trim( (string) $desc ) === $home ) {
				$own = trim( (string) preg_replace( '/\s+/u', ' ', wp_strip_all_tags( strip_shortcodes( (string) $post->post_content ) ) ) );
				return '' !== $own ? wp_html_excerpt( $own, 155, '…' ) : '';
			}
		}
		return $desc;
	}
);

/** Thẻ og/twitter của bản en: mô tả/tiêu đề tiếng Việt (bài cũ, mặc định site) thay bằng bản tiếng Anh như thẻ description. */
foreach ( array( 'rank_math/opengraph/facebook/og_description', 'rank_math/opengraph/twitter/twitter_description' ) as $hv_hook ) {
	add_filter(
		$hv_hook,
		static function ( $desc ) {
			return 'en' === hv_lang() ? (string) apply_filters( 'rank_math/frontend/description', (string) $desc ) : $desc;
		},
		20
	);
}
foreach ( array( 'rank_math/opengraph/facebook/og_title', 'rank_math/opengraph/twitter/twitter_title' ) as $hv_hook ) {
	add_filter(
		$hv_hook,
		static function ( $title ) {
			return 'en' === hv_lang() ? str_replace( 'Hải Vân', 'Hai Van', (string) $title ) : $title;
		},
		20
	);
}
