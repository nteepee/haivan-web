<?php
/**
 * wp eval-file /scripts/route-copy-v3-north.php
 * Nội dung trang tuyến phía Bắc bản v3: 9 hướng có sẵn (Hà Nội ⇄ Điện Biên, Yên Nghĩa → Điện Biên, Mỹ Đình → Bản Phủ / Mường Chà,
 * Hà Nội ⇄ Mộc Châu, Hà Nội ⇄ Sơn La) và 2 chiều về mới (Bản Phủ → Mỹ Đình, Mường Chà → Mỹ Đình). Dữ liệu: lib/route-copy-v3-north-data.php.
 *  1. Tạo bài hv_route cho chiều về chưa có (hv_route_path, thời gian, ảnh lấy từ chiều đi).
 *  2. Ghi đủ bộ trường landing (meta hv_route_*) cho cả 11 hướng; ô nào đã đúng thì bỏ qua (idempotent, chạy lại không đổi gì).
 * Trước khi ghi, kiểm tra dữ liệu: đủ trường, đúng số ô "|" mỗi dòng, không còn chữ cũ (Mường Trà, Bán Phủ, thuật tiện, tên hạng cũ,
 * chính sách cũ). Sai thì dừng, không ghi gì.
 * Ghi đè chữ đang có trên WP: đây là bản chốt của brief SEO v3; sửa tiếp trong WP admin sau khi chạy.
 * Biến: HV_DRY_RUN=1 chỉ báo cáo; HV_ONLY=a/b chỉ xử lý một hướng.
 */

if ( ! defined( 'ABSPATH' ) || ! defined( 'WP_CLI' ) ) {
	exit( 1 );
}
if ( ! function_exists( 'hv_route_find' ) || ! function_exists( 'hv_route_clean_html' ) ) {
	WP_CLI::error( 'Theme haivan-web-child chưa nạp (thiếu hv_route_find / hv_route_clean_html).' );
}

$dry  = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$only = trim( (string) ( getenv( 'HV_ONLY' ) ?: '' ) );
$data = require __DIR__ . '/lib/route-copy-v3-north-data.php';

// Trường landing => meta key; [số ô tối thiểu, tối đa] cho ô nhiều dòng (null = văn bản/HTML một khối).
$fields = array(
	'seo_title'        => array( 'hv_route_seo_title', null ),
	'meta_description' => array( 'hv_route_meta_description', null ),
	'h1'               => array( 'hv_route_h1', null ),
	'intro'            => array( 'hv_route_intro', null ),
	'schedule_text'    => array( 'hv_route_schedule_text', null ),
	'content_html'     => array( 'hv_route_content_html', null ),
	'faq'              => array( 'hv_route_faq', array( 2, 2 ) ),
	'pickup_points'    => array( 'hv_route_pickup_points', array( 3, 3 ) ),
	'offices'          => array( 'hv_route_offices', array( 7, 7 ) ),
	'vehicle_classes'  => array( 'hv_route_vehicle_classes', array( 6, 6 ) ),
	'related'          => array( 'hv_route_related', array( 2, 2 ) ),
	'reverse'          => array( 'hv_route_reverse', array( 2, 2 ) ),
	'round_trip_note'  => array( 'hv_route_round_trip_note', null ),
	'facts'            => array( 'hv_route_facts', array( 2, 2 ) ),
	'reasons_head'     => array( 'hv_route_reasons_head', array( 4, 4 ) ),
	'reasons'          => array( 'hv_route_reasons', array( 3, 3 ) ),
	'stops_intro'      => array( 'hv_route_stops_intro', null ),
	'stops'            => array( 'hv_route_stops', array( 3, 3 ) ),
	'rating'           => array( 'hv_route_rating', array( 3, 3 ) ),
	'reviews'          => array( 'hv_route_reviews', array( 2, 2 ) ),
	'stats'            => array( 'hv_route_stats', array( 2, 2 ) ),
	'story'            => array( 'hv_route_story', null ),
);
$html_fields = array( 'schedule_text', 'content_html' );
// Chữ cũ không được còn trên trang (lỗi chính tả, tên hạng cũ, chính sách cũ, dữ kiện đã bỏ theo brief).
$banned = array(
	'Mường Trà', 'Bán Phủ', 'thuật tiện', 'Royal Cabin', 'Cao cấp', 'Tiết kiệm', 'Siêu rẻ', 'Phổ thông', 'Trung cấp',
	'cam kết hoàn', 'chưa có chính sách', 'dưới 6 tuổi', 'vẫn sẽ được hoàn', 'không được hoàn tiền trong trường hợp',
	'8 tấn', '4–12', '4 đến 12 tiếng', '10 bệnh viện', 'trung chuyển miễn phí', 'Ba điểm đón cố định', '30 phút đến 1 giờ',
	'1900 9398', 'Thông tư 50', '300.000đ',
);
// Sơn La trả ở Mỹ Đình / Nguyễn Tuân / Châu Văn Liêm: câu trung chuyển từ 01 Nguyễn Hoàng là của tuyến Điện Biên.
$banned_by_path = array(
	'my-dinh/son-la' => array( 'Nguyễn Hoàng' ),
	'son-la/my-dinh' => array( 'Nguyễn Hoàng' ),
);

/* 1. Kiểm tra dữ liệu (dừng trước khi ghi nếu sai) ------------------------ */
$errors = array();
foreach ( $data as $path => $d ) {
	if ( 1 !== preg_match( '#^[a-z0-9-]+/[a-z0-9-]+$#', $path ) ) {
		$errors[] = "{$path}: đường dẫn sai dạng a/b";
	}
	foreach ( $fields as $k => $spec ) {
		if ( ! array_key_exists( $k, $d ) || ! is_string( $d[ $k ] ) ) {
			$errors[] = "{$path}: thiếu trường {$k}";
			continue;
		}
		$text = $d[ $k ];
		foreach ( array_merge( $banned, $banned_by_path[ $path ] ?? array() ) as $word ) {
			if ( false !== mb_strpos( $text, $word ) ) { // phân biệt hoa thường: "giá tiết kiệm" hợp lệ, tên hạng cũ "Tiết kiệm" thì không.
				$errors[] = "{$path}.{$k}: còn chữ cũ \"{$word}\"";
			}
		}
		if ( null === $spec[1] ) {
			continue;
		}
		foreach ( hv_route_lines( $text ) as $i => $line ) {
			$cells = count( explode( '|', $line ) );
			if ( $cells < $spec[1][0] || $cells > $spec[1][1] ) {
				$errors[] = sprintf( '%s.%s dòng %d: %d ô, cần %d', $path, $k, $i + 1, $cells, $spec[1][1] );
			}
		}
	}
	foreach ( array( 'hv_route_related' => $d['related'] ?? '', 'hv_route_reverse' => $d['reverse'] ?? '' ) as $key => $text ) {
		foreach ( hv_route_lines( $text ) as $line ) {
			if ( ! hv_route_link_from( $line ) ) {
				$errors[] = "{$path}.{$key}: liên kết sai \"{$line}\"";
			}
		}
	}
	if ( mb_strlen( $d['seo_title'] ?? '' ) > 60 ) {
		$errors[] = "{$path}: title " . mb_strlen( $d['seo_title'] ) . ' ký tự (> 60)';
	}
	if ( mb_strlen( $d['meta_description'] ?? '' ) > 160 ) {
		$errors[] = "{$path}: meta " . mb_strlen( $d['meta_description'] ) . ' ký tự (> 160)';
	}
	if ( isset( $d['create'] ) && ( empty( $d['create']['title'] ) || empty( $d['create']['thumb_from'] ) ) ) {
		$errors[] = "{$path}: 'create' thiếu title hoặc thumb_from";
	}
}
if ( '' !== $only && ! isset( $data[ $only ] ) ) {
	$errors[] = "HV_ONLY={$only}: không có trong dữ liệu";
}
if ( $errors ) {
	WP_CLI::error( "Dữ liệu chưa đạt, không ghi gì:\n- " . implode( "\n- ", $errors ) );
}

/* 2. Tạo bài + ghi trường ------------------------------------------------- */
global $wpdb;
$created = 0;
$changed = 0;
foreach ( $data as $path => $d ) {
	if ( '' !== $only && $only !== $path ) {
		continue;
	}
	$post = hv_route_find( $path );
	if ( ! $post ) {
		if ( empty( $d['create'] ) ) {
			WP_CLI::warning( "{$path}: chưa có bài hv_route xuất bản và không thuộc danh sách tạo mới, bỏ qua" );
			continue;
		}
		$c     = $d['create'];
		$src   = hv_route_find( $c['thumb_from'] );
		$thumb = $src ? (int) get_post_thumbnail_id( $src ) : 0;
		WP_CLI::log( "+ {$path}: tạo bài hv_route \"{$c['title']}\"" . ( $thumb ? " (ảnh #{$thumb} từ {$c['thumb_from']})" : ' (chưa có ảnh)' ) );
		if ( $dry ) {
			continue;
		}
		$order = (int) $wpdb->get_var( "SELECT MAX(menu_order) FROM {$wpdb->posts} WHERE post_type = 'hv_route'" ) + 1; // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$id    = wp_insert_post(
			array(
				'post_type'   => 'hv_route',
				'post_status' => 'publish',
				'post_title'  => $c['title'],
				'menu_order'  => $order,
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			WP_CLI::warning( "{$path}: " . $id->get_error_message() );
			continue;
		}
		update_post_meta( $id, 'hv_route_path', $path );
		if ( ! empty( $c['time'] ) ) {
			update_post_meta( $id, 'hv_route_time', $c['time'] );
		}
		if ( $thumb ) {
			set_post_thumbnail( $id, $thumb );
		}
		// seed-route-landing.php coi bài đã seed là có chủ, không đè.
		update_post_meta( $id, 'hv_route_landing_seed', '1' );
		$post = get_post( $id );
		++$created;
	}

	$diff = array();
	foreach ( $fields as $k => $spec ) {
		$want = in_array( $k, $html_fields, true ) ? hv_route_clean_html( $d[ $k ] ) : $d[ $k ];
		$have = (string) get_post_meta( $post->ID, $spec[0], true );
		if ( $have !== $want ) {
			$diff[ $spec[0] ] = $want;
		}
	}
	if ( ! $diff ) {
		WP_CLI::log( "= {$path} (#{$post->ID}): đã đúng bản v3" );
		continue;
	}
	WP_CLI::log( "~ {$path} (#{$post->ID}): " . implode( ', ', array_map( static fn( $m ) => substr( $m, 9 ), array_keys( $diff ) ) ) );
	if ( $dry ) {
		continue;
	}
	foreach ( $diff as $meta => $value ) {
		update_post_meta( $post->ID, $meta, wp_slash( $value ) );
	}
	// Cập nhật post_modified để updated_at (lastmod sitemap, cache Next) đổi theo.
	$res = wp_update_post( array( 'ID' => $post->ID ), true );
	if ( is_wp_error( $res ) ) {
		WP_CLI::warning( "{$path}: không cập nhật được ngày sửa: " . $res->get_error_message() );
	}
	++$changed;
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "tạo {$created} bài, cập nhật {$changed} hướng." );
