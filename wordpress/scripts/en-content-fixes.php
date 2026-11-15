<?php
/**
 * wp eval-file /scripts/en-content-fixes.php   (dry-run mặc định; HV_APPLY=1 để ghi)
 *
 * Bản tiếng Anh còn chữ tiếng Việt (rà soát 11/2026):
 *  1. Ưu đãi hôm nay: điền các ô tiếng Anh (title_en...) theo tên bài tiếng Việt; ô đã có giá trị thì giữ (MKT sửa tay).
 *  2. Trang en "Rental cars" (dich-vu/xe-hop-dong) đổi tên thành "Private hire" như trang chủ.
 *  3. Trang dịch vụ en mang nguyên nội dung tiếng Việt: thay bằng bản dịch trong data/en-service-pages.json
 *     (khoá = đường dẫn trang, chỉ trang Polylang en; chỉ ghi khi nội dung hiện tại vẫn còn chữ tiếng Việt).
 *  4. Điểm đến (/en/diem-den): tạo bản en cho các bài diem_den từ data/en-destinations.json.
 * Idempotent. Sao lưu DB trước khi chạy trên VPS.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
if ( ! function_exists( 'pll_set_post_language' ) ) {
	WP_CLI::error( 'Cần Polylang đang bật.' );
}
$apply = '1' === (string) ( getenv( 'HV_APPLY' ) ?: '0' );
$tag   = $apply ? '~' : '[dry]';
$n     = 0;
$has_vi = static fn( $s ) => remove_accents( wp_strip_all_tags( (string) $s ) ) !== wp_strip_all_tags( (string) $s );
/** Nội dung chủ yếu là tiếng Việt (> 30% số từ có dấu): bản en chưa dịch. Trang MKT đã dịch tay chỉ còn vài tên riêng có dấu thì giữ. */
$mostly_vi = static function ( $s ) {
	$words = preg_split( '/\s+/u', trim( wp_strip_all_tags( (string) $s ) ), -1, PREG_SPLIT_NO_EMPTY );
	if ( ! $words ) {
		return false;
	}
	$vi = count( array_filter( $words, static fn( $w ) => remove_accents( $w ) !== $w ) );
	return $vi / count( $words ) > 0.3;
};

/* 1. Ưu đãi */
$offers = array(
	'Tặng bạn 50k'                    => array( 'title_en' => '50k off your first trip', 'badge_en' => 'Hai Van app', 'unit_en' => 'off your first booking', 'cond_en' => 'When you book for the first time in the Hai Van app.', 'cta_en' => 'Get the app' ),
	'Hà Nội đi Điện Biên, xe Eco'     => array( 'title_en' => 'Hanoi to Dien Bien, Eco coach', 'badge_en' => 'Book 7 days ahead', 'price_en' => '500,000đ', 'unit_en' => '/ 2 tickets, 250k each', 'cond_en' => 'Group of 4: 800,000đ. Eco coach with 44 leather berths.' ),
	'Hà Nội đi Điện Biên'             => array( 'title_en' => 'Hanoi to Dien Bien', 'badge_en' => 'Book 3 days ahead', 'price_en' => '900,000đ', 'unit_en' => '/ 2 Luxury tickets, 450k each', 'cond_en' => 'Royal Cabin 1,200,000đ / 2 tickets. Save up to 130,000đ.' ),
	'Sài Gòn đi Vũng Tàu, hàng cuối'  => array( 'title_en' => 'Saigon to Vung Tau, back row', 'badge_en' => 'Group deal', 'unit_en' => '/ 3 tickets, 4 tickets 789k', 'cond_en' => 'Book the whole back row. Limited seats per trip.' ),
	'Sài Gòn đi Vũng Tàu'             => array( 'title_en' => 'Saigon to Vung Tau', 'badge_en' => 'Save 101k', 'unit_en' => '/ 2 Luxury tickets, 210k each', 'cond_en' => 'Book at least 1 hour ahead. Combo-labelled trips only.' ),
);
foreach ( get_posts( array( 'post_type' => 'hv_offer', 'numberposts' => -1, 'post_status' => 'any', 'suppress_filters' => true ) ) as $p ) {
	$fields = $offers[ trim( $p->post_title ) ] ?? null;
	if ( ! $fields ) {
		// Ưu đãi không có tên tiếng Anh bị ẩn ở bản en (offers-render.php): báo để MKT điền ô tiếng Anh trong wp-admin.
		if ( 'publish' === $p->post_status && '' === (string) get_post_meta( $p->ID, 'hv_offer_title_en', true ) ) {
			WP_CLI::warning( "offer #{$p->ID} \"{$p->post_title}\": chưa có tên tiếng Anh, sẽ ẩn ở /en/" );
		}
		continue;
	}
	foreach ( $fields as $k => $v ) {
		if ( '' !== (string) get_post_meta( $p->ID, 'hv_offer_' . $k, true ) ) {
			continue;
		}
		++$n;
		WP_CLI::log( "{$tag} offer #{$p->ID} {$k}" );
		if ( $apply ) {
			update_post_meta( $p->ID, 'hv_offer_' . $k, $v );
		}
	}
}

/** Trang Polylang en theo đường dẫn. */
$en_page = static function ( $path ) {
	foreach ( get_posts( array( 'post_type' => 'page', 'numberposts' => -1, 'post_status' => 'publish', 'suppress_filters' => true, 'lang' => '' ) ) as $p ) {
		if ( get_page_uri( $p ) === $path && function_exists( 'pll_get_post_language' ) && 'en' === pll_get_post_language( $p->ID ) ) {
			return $p;
		}
	}
	return null;
};

/* 2. Tên trang xe hợp đồng */
$p = $en_page( 'dich-vu/xe-hop-dong' );
if ( $p && 'Rental cars' === $p->post_title ) {
	++$n;
	WP_CLI::log( "{$tag} page #{$p->ID} title → Private hire" );
	if ( $apply ) {
		wp_update_post( array( 'ID' => $p->ID, 'post_title' => 'Private hire' ) );
	}
}

/* 3. Trang dịch vụ đã dịch */
$file  = __DIR__ . '/data/en-service-pages.json';
$pages = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array();
foreach ( (array) $pages as $path => $d ) {
	$p = $en_page( $path );
	if ( ! $p ) {
		WP_CLI::warning( "{$path}: không có trang en" );
		continue;
	}
	// replace_if_vi: trang en đã dịch gần hết, còn vài cụm tiếng Việt (vd. tên chương trình) thì vẫn thay bằng bản trong JSON.
	if ( ! empty( $d['replace_if_vi'] ) ? $has_vi( $p->post_content ) : $mostly_vi( $p->post_content ) ) {
		++$n;
		WP_CLI::log( "{$tag} page #{$p->ID} {$path} content" );
		if ( $apply ) {
			wp_update_post( array( 'ID' => $p->ID, 'post_content' => wp_slash( $d['content'] ) ) );
		}
	}
	foreach ( array( 'rank_math_title' => 'rm_title', 'rank_math_description' => 'rm_desc' ) as $meta => $k ) {
		$cur = (string) get_post_meta( $p->ID, $meta, true );
		if ( '' !== ( $d[ $k ] ?? '' ) && ( '' === $cur || $has_vi( $cur ) ) && $cur !== $d[ $k ] ) {
			++$n;
			WP_CLI::log( "{$tag} page #{$p->ID} {$meta}" );
			if ( $apply ) {
				update_post_meta( $p->ID, $meta, $d[ $k ] );
			}
		}
	}
}
/* 4. Điểm đến tiếng Anh: mỗi bài diem_den vi chưa có bản en thì tạo bản en (cùng slug, ảnh, thứ tự, tuyến liên quan)
 * từ data/en-destinations.json. Bài viết (bai_viet) không dịch: trang en vẫn liệt kê bài tiếng Việt của điểm đó. */
$file  = __DIR__ . '/data/en-destinations.json';
$dests = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array();
foreach ( get_posts( array( 'post_type' => 'diem_den', 'numberposts' => -1, 'post_status' => 'publish', 'lang' => 'vi' ) ) as $vi ) {
	$d = $dests[ $vi->post_name ] ?? null;
	if ( ! $d ) {
		WP_CLI::warning( "diem_den {$vi->post_name}: chưa có bản dịch trong en-destinations.json" );
		continue;
	}
	$tr = pll_get_post_translations( $vi->ID );
	if ( ! empty( $tr['en'] ) ) {
		continue;
	}
	// Lần chạy trước dừng giữa chừng: bản en cùng slug đã có nhưng chưa nối bản dịch thì nối lại, không tạo trùng.
	// Truy vấn theo slug là truy vấn bài lẻ: Polylang bỏ qua 'lang', nên tự lọc ngôn ngữ và loại chính bài vi.
	$left = array_values(
		array_filter(
			get_posts( array( 'post_type' => 'diem_den', 'name' => $vi->post_name, 'post_status' => array( 'draft', 'publish' ), 'numberposts' => 10, 'fields' => 'ids', 'lang' => '' ) ),
			static fn( $id ) => (int) $id !== (int) $vi->ID && 'en' === pll_get_post_language( (int) $id )
		)
	);
	if ( $left ) {
		++$n;
		WP_CLI::log( "{$tag} diem_den {$vi->post_name}: nối bản en có sẵn #{$left[0]}" );
		if ( $apply ) {
			pll_save_post_translations( array_merge( $tr, array( 'en' => (int) $left[0] ) ) );
			wp_update_post( array( 'ID' => (int) $left[0], 'post_status' => 'publish' ) );
		}
		continue;
	}
	++$n;
	WP_CLI::log( "{$tag} diem_den {$vi->post_name} → en \"{$d['title']}\"" );
	if ( ! $apply ) {
		continue;
	}
	// Tạo nháp trước rồi gán ngôn ngữ, sau đó mới xuất bản: hook save_post_diem_den chỉ đồng bộ tên term theo bài vi.
	$id = wp_insert_post(
		wp_slash(
			array(
				'post_type'    => 'diem_den',
				'post_status'  => 'draft',
				'post_title'   => $d['title'],
				'post_name'    => $vi->post_name,
				'post_content' => '<p>' . esc_html( $d['intro'] ) . '</p>',
				'post_excerpt' => $d['intro'],
				'menu_order'   => $vi->menu_order,
			)
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $id->get_error_message() );
		continue;
	}
	pll_set_post_language( $id, 'en' );
	pll_save_post_translations( array_merge( $tr, array( 'en' => $id ) ) );
	foreach ( array( '_thumbnail_id', 'hv_dest_route_paths', 'hv_location_id' ) as $k ) {
		$v = get_post_meta( $vi->ID, $k, true );
		if ( '' !== (string) $v ) {
			update_post_meta( $id, $k, $v );
		}
	}
	update_post_meta( $id, 'rank_math_title', $d['rm_title'] );
	update_post_meta( $id, 'rank_math_description', $d['rm_desc'] );
	wp_update_post( array( 'ID' => $id, 'post_status' => 'publish' ) );
	// Trang điểm đến lấy bài theo slug (= slug term hv_location): giữ đúng slug bản vi nếu WP đã thêm hậu tố -2.
	if ( get_post_field( 'post_name', $id ) !== $vi->post_name ) {
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_name' => $vi->post_name ), array( 'ID' => $id ) );
		clean_post_cache( $id );
	}
	// Bước đổi slug ở trên làm core ghi _wp_old_slug = slug hiện tại; meta đó khiến 404 bên vi bị chuyển sang bài en.
	delete_post_meta( $id, '_wp_old_slug', $vi->post_name );
}
if ( $apply && $n ) {
	wp_cache_flush();
	flush_rewrite_rules( false );
}
WP_CLI::success( ( $apply ? '' : '[dry-run] ' ) . "{$n} thay đổi." );
