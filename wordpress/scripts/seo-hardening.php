<?php
/**
 * wp eval-file /scripts/seo-hardening.php
 * Bổ sung cấu hình SEO cho Rank Math (chạy sau seo-setup.php; idempotent, không đè giá trị MKT đã chọn):
 *  1. Schema mặc định cho bài điểm đến (BlogPosting), tin công ty (NewsArticle) và trang điểm đến (Article, theme đổi thành CollectionPage):
 *     chỉ đặt khi loại nội dung đó chưa có lựa chọn. Breadcrumb + Article đầy đủ do theme bổ sung (inc/schema.php).
 *  2. Trang nội dung mang nguyên tiêu đề/mô tả của trang chủ (nhập lại từ web cũ): xoá hai meta đó để dùng "Tên trang | Hải Vân".
 *  2b. Trang điểm đến chỉ có tiêu đề là tên điểm: xoá meta để dùng tiêu đề mô tả của theme.
 *  3. Trang rác: noindex (Rank Math tự bỏ khỏi sitemap) cho trang đã được theme chuyển hướng 301 (inc/redirects.php) và trang
 *     mảnh vụn/rỗng chưa có đích tốt hơn (/dat-ve-nhanh/{baiviet,khachhang,taiapp}, /dich-vu/hang-hoa/tra-cuu-don).
 * Biến: HV_DRY_RUN=1 chỉ báo cáo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
$dry = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );

/* 1. Schema mặc định ------------------------------------------------------ */
$opts    = get_option( 'rank-math-options-titles', array() );
$opts    = is_array( $opts ) ? $opts : array();
$changed = array();
foreach ( array( 'bai_viet' => 'BlogPosting', 'tin_tuc' => 'NewsArticle', 'diem_den' => 'Article' ) as $pt => $article ) {
	if ( '' === (string) ( $opts[ "pt_{$pt}_default_rich_snippet" ] ?? '' ) ) {
		$opts[ "pt_{$pt}_default_rich_snippet" ]  = 'article';
		$opts[ "pt_{$pt}_default_article_type" ]  = $article;
		$opts[ "pt_{$pt}_add_meta_box" ]          = 'on';
		$changed[]                                = "{$pt}={$article}";
	}
}
WP_CLI::log( $changed ? 'Schema mặc định: ' . implode( ', ', $changed ) : 'Schema mặc định đã đặt, giữ nguyên.' );
if ( $changed && ! $dry ) {
	update_option( 'rank-math-options-titles', $opts );
}

/* 2. Tiêu đề/mô tả trùng trang chủ ---------------------------------------- */
$home_titles = array();
$home_descs  = array();
$front       = (int) get_option( 'page_on_front' );
$fronts      = array( $front );
if ( function_exists( 'pll_get_post_translations' ) && $front > 0 ) {
	$fronts = array_values( array_map( 'intval', (array) pll_get_post_translations( $front ) ) ) ?: array( $front );
}
foreach ( $fronts as $fid ) {
	$t = trim( (string) get_post_meta( $fid, 'rank_math_title', true ) );
	$d = trim( (string) get_post_meta( $fid, 'rank_math_description', true ) );
	if ( '' !== $t ) {
		$home_titles[] = $t;
	}
	if ( '' !== $d ) {
		$home_descs[] = $d;
	}
}
$dupes = 0;
foreach ( get_posts( array( 'post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true ) ) as $pid ) {
	if ( in_array( (int) $pid, $fronts, true ) ) {
		continue;
	}
	foreach ( array( 'rank_math_title' => $home_titles, 'rank_math_description' => $home_descs ) as $key => $same ) {
		if ( in_array( trim( (string) get_post_meta( $pid, $key, true ) ), $same, true ) ) {
			WP_CLI::log( "~ #{$pid} " . get_the_title( $pid ) . ": bỏ {$key} trùng trang chủ" );
			if ( ! $dry ) {
				delete_post_meta( $pid, $key );
			}
			++$dupes;
		}
	}
}

/* 2b. Trang điểm đến: tiêu đề nhập lại chỉ là tên điểm ("Mộc Châu") -> bỏ để theme dựng "Xe đi Mộc Châu, du lịch Mộc Châu | Hải Vân" (inc/seo.php). */
$hubs = 0;
foreach ( get_posts( array( 'post_type' => 'diem_den', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true ) ) as $pid ) {
	$mt = trim( (string) get_post_meta( $pid, 'rank_math_title', true ) );
	if ( '' !== $mt && $mt === trim( (string) get_the_title( $pid ) ) ) {
		WP_CLI::log( "~ #{$pid} {$mt}: bỏ rank_math_title chỉ là tên điểm" );
		if ( ! $dry ) {
			delete_post_meta( $pid, 'rank_math_title' );
		}
		++$hubs;
	}
}

/* 3. Trang rác: noindex --------------------------------------------------- */
$extra = array( '/dat-ve-nhanh/baiviet', '/dat-ve-nhanh/khachhang', '/dat-ve-nhanh/taiapp', '/dich-vu/hang-hoa/tra-cuu-don' );
$noidx = 0;
foreach ( get_posts( array( 'post_type' => 'page', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true ) ) as $pid ) {
	$path = '/' . trim( (string) wp_parse_url( get_permalink( $pid ), PHP_URL_PATH ), '/' );
	$path = (string) preg_replace( '#^/en(?=/|$)#', '', $path );
	if ( '' === $path || '/' === $path || ( null === hv_redirect_target( $path ) && ! in_array( $path, $extra, true ) ) ) {
		continue;
	}
	$robots = get_post_meta( $pid, 'rank_math_robots', true );
	$robots = is_array( $robots ) ? $robots : array();
	if ( in_array( 'noindex', $robots, true ) ) {
		continue;
	}
	$robots = array_values( array_diff( $robots, array( 'index' ) ) );
	array_unshift( $robots, 'noindex' );
	WP_CLI::log( "~ #{$pid} {$path}: noindex" . ( null !== hv_redirect_target( $path ) ? ' (301 -> ' . hv_redirect_target( $path ) . ')' : '' ) );
	if ( ! $dry ) {
		update_post_meta( $pid, 'rank_math_robots', $robots );
	}
	++$noidx;
}
if ( ! $dry && class_exists( '\\RankMath\\Sitemap\\Cache' ) ) {
	\RankMath\Sitemap\Cache::invalidate_storage(); // sitemap đã lưu cache: dựng lại để trang noindex rời sitemap ngay.
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "trùng trang chủ: {$dupes}; tiêu đề điểm đến: {$hubs}; noindex: {$noidx}." );
