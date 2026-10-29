<?php
/**
 * wp eval-file /scripts/seed-route-posts.php
 * Landing tuyến 2 chiều cho SEO (Hà Nội ⇄ Mộc Châu, Sơn La ⇄ Hà Nội, Điện Biên ⇄ Hà Nội):
 *  1. Tạo bài hv_route (hv_route_path, giá "Từ", thời gian) cho hướng chưa có bài; ảnh lấy từ bài chiều đi / tuyến chính.
 *  2. Điền nội dung landing (seed-route-landing.php, dữ liệu lib/route-landing-seed.php) cho bài chưa có nội dung.
 *  3. Làm mới SEO title + H1 theo bảng phân vai từ khoá hai chiều (docs/seo/route-keywords.md, title ≤ 60 ký tự): chiều đi giữ từ khoá đầu, chiều về chỉ từ khoá chiều về.
 *     Chỉ ghi đè khi ô đang trống, đang là giá trị seed cũ, hoặc đúng giá trị script này ghi lần trước (không đè chữ MKT sửa).
 *  4. Điền "chiều ngược lại" cho chiều đi còn trống.
 *  5. Gán landing ab/ba cho tuyến chính (hv_corridor) khi ô đang trống và bài landing đã có.
 * Idempotent. Biến: HV_DRY_RUN=1 chỉ báo cáo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
$dry  = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$seed = require __DIR__ . '/lib/route-landing-seed.php';

/* 1. Bài hv_route mới ---------------------------------------------------- */
// path => [tiêu đề (dạng "A - B"), giá từ, thời gian chạy, nguồn ảnh: đường dẫn hv_route có sẵn hoặc "corridor:<id>"].
$new = array(
	'my-dinh/moc-chau'  => array( 'Mỹ Đình - Mộc Châu', 'Từ 270.000đ', '4h15', 'corridor:hn-moc' ),
	'moc-chau/my-dinh'  => array( 'Mộc Châu - Mỹ Đình', 'Từ 270.000đ', '4h20', 'corridor:hn-moc' ),
	'son-la/my-dinh'    => array( 'Sơn La - Mỹ Đình', 'Từ 330.000đ', '6h', 'my-dinh/son-la' ),
	'dien-bien/my-dinh' => array( 'Điện Biên - Mỹ Đình', 'Từ 485.000đ', '11h', 'my-dinh/dien-bien' ),
);
global $wpdb;
$next_order = (int) $wpdb->get_var( "SELECT MAX(menu_order) FROM {$wpdb->posts} WHERE post_type = 'hv_route'" ) + 1; // phpcs:ignore WordPress.DB.DirectDatabaseQuery
$created    = 0;
foreach ( $new as $path => $d ) {
	if ( hv_route_find( $path ) ) {
		WP_CLI::log( "= {$path}: đã có bài hv_route" );
		continue;
	}
	$thumb = 0;
	if ( 0 === strpos( $d[3], 'corridor:' ) ) {
		$cp = get_posts( array( 'post_type' => 'hv_corridor', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_corridor_id', 'meta_value' => substr( $d[3], 9 ), 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		$thumb = $cp ? (int) get_post_thumbnail_id( $cp[0] ) : 0;
	} else {
		$src   = hv_route_find( $d[3] );
		$thumb = $src ? (int) get_post_thumbnail_id( $src ) : 0;
	}
	WP_CLI::log( "+ {$path}: tạo bài hv_route \"{$d[0]}\"" . ( $thumb ? " (ảnh #{$thumb})" : ' (chưa có ảnh)' ) );
	if ( $dry ) {
		continue;
	}
	$id = wp_insert_post(
		array(
			'post_type'   => 'hv_route',
			'post_status' => 'publish',
			'post_title'  => $d[0],
			'menu_order'  => $next_order++,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "{$path}: " . $id->get_error_message() );
		continue;
	}
	update_post_meta( $id, 'hv_route_path', $path );
	update_post_meta( $id, 'hv_route_price', $d[1] );
	update_post_meta( $id, 'hv_route_time', $d[2] );
	if ( $thumb ) {
		set_post_thumbnail( $id, $thumb );
	}
	++$created;
}

/* 2. Nội dung landing ---------------------------------------------------- */
if ( ! $dry ) {
	require __DIR__ . '/seed-route-landing.php';
}

/* 3 + 4. SEO title / H1 / chiều ngược lại -------------------------------- */
// Bài không có nội dung landing đầy đủ (chưa có dữ kiện của Hải Vân): chỉ đặt title + H1, Next ghép với CMS và mẫu.
$title_only = array(
	'tan-son-nhat/vung-tau' => array( 'Xe sân bay Tân Sơn Nhất đi Vũng Tàu: giờ chạy | Hải Vân', 'Xe sân bay Tân Sơn Nhất đi Vũng Tàu' ),
	'vung-tau/tan-son-nhat' => array( 'Xe Vũng Tàu đi sân bay Tân Sơn Nhất: giờ chạy | Hải Vân', 'Xe Vũng Tàu đi sân bay Tân Sơn Nhất' ),
	'yen-nghia/dien-bien'   => array( 'Xe khách Yên Nghĩa đi Điện Biên: giờ chạy, giá vé | Hải Vân', 'Xe khách Yên Nghĩa đi Điện Biên' ),
);
// Giá trị seed cũ (trước khi có bảng phân vai), coi như chưa ai sửa tay.
$legacy = array(
	'Xe Sài Gòn đi Vũng Tàu: giờ chạy, giá vé | Hải Vân', 'Đặt vé xe Sài Gòn đi Vũng Tàu',
	'Xe Vũng Tàu đi Sài Gòn: giờ chạy, giá vé | Hải Vân', 'Đặt vé xe Vũng Tàu đi Sài Gòn',
	'Xe Hà Nội đi Điện Biên: giường nằm, giá vé | Hải Vân', 'Đặt vé xe Hà Nội đi Điện Biên',
	'Xe Hà Nội đi Sơn La: giường nằm, limousine | Hải Vân', 'Đặt vé xe Hà Nội đi Sơn La',
);
$want = $title_only;
foreach ( $seed as $path => $d ) {
	$want[ $path ] = array( $d['seo_title'], $d['h1'] );
}
$refreshed = 0;
foreach ( $want as $path => $pair ) {
	$post = hv_route_find( $path );
	if ( ! $post ) {
		continue;
	}
	$written = json_decode( (string) get_post_meta( $post->ID, 'hv_route_seo_written', true ), true );
	$written = is_array( $written ) ? $written : array();
	$touched = false;
	foreach ( array( 'hv_route_seo_title' => $pair[0], 'hv_route_h1' => $pair[1] ) as $key => $value ) {
		$cur = trim( (string) get_post_meta( $post->ID, $key, true ) );
		if ( $cur === $value ) {
			$written[ $key ] = $value;
			continue;
		}
		if ( '' === $cur || in_array( $cur, $legacy, true ) || ( isset( $written[ $key ] ) && $written[ $key ] === $cur ) ) {
			WP_CLI::log( "~ {$path}: {$key} = {$value}" );
			if ( ! $dry ) {
				update_post_meta( $post->ID, $key, $value );
			}
			$written[ $key ] = $value;
			$touched         = true;
			++$refreshed;
		} else {
			WP_CLI::log( "= {$path}: {$key} do MKT sửa, giữ nguyên" );
		}
	}
	if ( ! $dry ) {
		if ( $touched ) {
			wp_update_post( array( 'ID' => $post->ID ) ); // cập nhật post_modified để lastmod của sitemap tuyến đổi theo.
		}
		update_post_meta( $post->ID, 'hv_route_seo_written', wp_json_encode( $written, JSON_UNESCAPED_UNICODE ) );
		if ( isset( $seed[ $path ] ) && '' === trim( (string) get_post_meta( $post->ID, 'hv_route_reverse', true ) ) && '' !== (string) ( $seed[ $path ]['reverse'] ?? '' ) ) {
			update_post_meta( $post->ID, 'hv_route_reverse', $seed[ $path ]['reverse'] );
			WP_CLI::log( "~ {$path}: hv_route_reverse = {$seed[ $path ]['reverse']}" );
		}
	}
}

/* 5. Landing của tuyến chính -------------------------------------------- */
$landings = array(
	'sg-vt' => array( 'ab' => 'quan-1/vung-tau', 'ba' => 'vung-tau/quan-1-san-bay' ),
	'hn-db' => array( 'ab' => 'my-dinh/dien-bien', 'ba' => 'dien-bien/my-dinh' ),
	'hn-moc' => array( 'ab' => 'my-dinh/moc-chau', 'ba' => 'moc-chau/my-dinh' ),
	'hn-sl' => array( 'ab' => 'my-dinh/son-la', 'ba' => 'son-la/my-dinh' ),
);
foreach ( $landings as $cid => $dirs ) {
	$cp = get_posts( array( 'post_type' => 'hv_corridor', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_corridor_id', 'meta_value' => $cid, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( ! $cp ) {
		WP_CLI::warning( "Tuyến chính {$cid}: không tìm thấy hv_corridor, bỏ qua" );
		continue;
	}
	foreach ( $dirs as $k => $path ) {
		$cur = trim( (string) get_post_meta( $cp[0], "hv_corridor_landing_{$k}", true ), '/' );
		if ( '' !== $cur ) {
			continue;
		}
		$route = hv_route_find( $path );
		if ( ! $route || '' === trim( (string) get_post_meta( $route->ID, 'hv_route_h1', true ) ) ) {
			WP_CLI::log( "= {$cid}.{$k}: chưa có landing {$path}, để trống" );
			continue;
		}
		WP_CLI::log( "~ {$cid}.landing_{$k} = {$path}" );
		if ( ! $dry ) {
			update_post_meta( $cp[0], "hv_corridor_landing_{$k}", $path );
		}
	}
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "tạo {$created} bài hv_route, làm mới {$refreshed} ô SEO." );
