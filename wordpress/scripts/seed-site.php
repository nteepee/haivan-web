<?php
/**
 * wp eval-file /scripts/seed-site.php
 * Tạo khung trang với slug cũ (vi + en), trang chủ, menu mẫu, tuyến phổ biến mẫu. Chạy lại an toàn: chỉ tạo cái còn
 * thiếu; không xoá trang, không đổi trang chủ/menu đã có, không đụng tuyến phổ biến MKT đã sửa/xoá.
 * Nội dung thật: scripts/import-old-site.php.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
if ( ! hvs_has_polylang() ) {
	WP_CLI::error( 'Cần Polylang với ngôn ngữ vi/en (chạy configure-site.php trước).' );
}
$manifest = require __DIR__ . '/lib/pages-manifest.php';
$first    = hvs_is_first_run();

/* Nội dung mẫu mặc định của WP: chỉ dọn lần đầu (sau đó 'privacy-policy' có thể là trang chính sách thật của MKT). */
if ( $first ) {
	foreach ( array( 'hello-world' => 'post', 'sample-page' => 'page', 'privacy-policy' => 'page' ) as $slug => $type ) {
		$p = get_page_by_path( $slug, OBJECT, $type );
		if ( $p ) {
			wp_delete_post( $p->ID, true );
		}
	}
}

$by_depth = static function ( array $items ) {
	uksort(
		$items,
		static fn( $a, $b ) => substr_count( $a, '/' ) <=> substr_count( $b, '/' ) ?: strcmp( $a, $b )
	);
	return $items;
};

/* Trang cha: nháp (web cũ không có URL này). */
foreach ( $by_depth( $manifest['parents'] ) as $path => $titles ) {
	$vi = hvs_ensure_page( $path, $titles[0], 'vi', 'draft' );
	$en = hvs_ensure_page( $path, $titles[1] ?? $titles[0], 'en', 'draft' );
	hvs_link_translations( $vi, $en );
}

/* Trang nội dung. */
$n = 0;
foreach ( $by_depth( $manifest['pages'] ) as $path => $def ) {
	list( $vi_title, $en_title, $tpl ) = $def;
	$vi = hvs_ensure_page( $path, $vi_title, 'vi', 'publish', $tpl );
	$en = hvs_ensure_page( $path, $en_title ? $en_title : $vi_title, 'en', 'publish', $tpl );
	hvs_link_translations( $vi, $en );
	++$n;
}
WP_CLI::log( "Đã đảm bảo $n trang (vi + en) và " . count( $manifest['parents'] ) . ' trang cha.' );

/* Trang chủ. */
$home_vi = hvs_find_page( 'trang-chu', 'vi' );
if ( ! $home_vi ) {
	$home_vi = hvs_ensure_page( 'trang-chu', 'Đặt vé xe khách Hải Vân', 'vi' );
}
$home_en = hvs_find_page( 'home', 'en' );
if ( ! $home_en ) {
	$home_en = hvs_ensure_page( 'home', 'Book Hai Van coach tickets', 'en' );
}
hvs_link_translations( $home_vi, $home_en );
foreach ( array( $home_vi => 'Xe limousine & xe giường nằm chất lượng cao, đón trả tận nơi trên toàn quốc.', $home_en => 'Premium limousine and sleeper coaches with door-to-door pick-up across Vietnam.' ) as $id => $excerpt ) {
	if ( '' === get_post_field( 'post_excerpt', $id ) ) {
		wp_update_post( array( 'ID' => $id, 'post_excerpt' => $excerpt ) );
	}
}
// Trang chủ tĩnh: chỉ đặt khi chưa có (MKT có thể đã chọn trang khác); trang chủ trong thùng rác thì không dùng.
if ( $home_vi && 'trash' !== get_post_status( $home_vi ) && ( $first || ! (int) get_option( 'page_on_front' ) ) ) {
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $home_vi );
	update_option( 'page_for_posts', 0 );
}

/* Menu mẫu từ layout seed (menu đã có mục thì giữ nguyên). */
if ( function_exists( 'hv_seed_menus' ) ) {
	$menus = hv_seed_menus( false );
	WP_CLI::log( 'Menu: ' . implode( ', ', array_keys( $menus ) ) );
} else {
	WP_CLI::warning( 'Theme haivan-web-child chưa kích hoạt: bỏ qua seed menu.' );
}

/* Tuyến phổ biến mẫu: các mục con của "Tuyến đường" trong layout seed. */
$seed   = hv_layout_seed();
$routes = array();
foreach ( $seed['vi']['primary'] as $item ) {
	if ( '/xe-khach' === $item['href'] ) {
		$routes = $item['children'] ?? array();
		break;
	}
}
$order = 0;
$new   = 0;
foreach ( $routes as $r ) {
	if ( ! preg_match( '#^/xe-khach/([a-z0-9-]+/[a-z0-9-]+)$#', $r['href'], $m ) ) {
		continue;
	}
	// Tuyến đã có (đã sửa/nháp/thùng rác) được giữ nguyên: chỉ tạo tuyến còn thiếu.
	$st = '';
	hvs_upsert_route( array( 'path' => $m[1], 'name' => $r['label'], 'order' => $order++, 'create_only' => true ), false, $st );
	if ( 'created' === $st ) {
		++$new;
	}
}
WP_CLI::log( "Tuyến phổ biến mẫu: tạo mới $new / " . $order );

// home_url của ngôn ngữ phụ thuộc trang chủ tĩnh vừa đặt: xoá cache danh sách ngôn ngữ của Polylang.
if ( method_exists( PLL()->model, 'clean_languages_cache' ) ) {
	PLL()->model->clean_languages_cache();
}
flush_rewrite_rules( false );
update_option( 'hv_site_configured', gmdate( 'c' ), false ); // từ giờ các script không đặt lại tuỳ chọn MKT.
WP_CLI::success( 'Seed xong.' );
