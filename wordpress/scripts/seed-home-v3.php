<?php
/**
 * wp eval-file /scripts/seed-home-v3.php   (HV_DRY_RUN=1 chỉ báo cáo)
 * Gieo nội dung trang chủ v3 MỘT LẦN, chạy lại không nhân bản và không ghi đè việc của MKT:
 *  - banner: slide dựng sẵn "Hà Nội đi Điện Biên 900.000đ" (xe tách nền vào Media), xếp banner limousine và
 *    "Tặng bạn 50k" ngay sau; banner CMS không có trong comp (xe sân bay/xe liên tỉnh…) chuyển sang Nháp.
 *    Việc sắp xếp/chuyển Nháp chỉ làm lần đầu (khoá meta hv_banner_v3), sau đó MKT toàn quyền.
 *  - 5 ưu đãi "Ưu đãi hôm nay" từ docs/reference/route-landing/*.json (khoá meta hv_offer_seed); ưu đãi MKT đã xoá không tạo lại.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

$dry = '1' === getenv( 'HV_DRY_RUN' );
$say = static fn( $m ) => WP_CLI::log( ( $dry ? '(thử) ' : '' ) . $m );

/** Bài theo khoá seed (kể cả thùng rác khi $trash). */
$find = static function ( $type, $meta, $key, $trash = false ) {
	return get_posts( array( 'post_type' => $type, 'post_status' => $trash ? 'trash' : 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => $meta, 'meta_value' => $key, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
};

/* ---------- Banner ---------- */
$designed_key = 'designed-dien-bien-900';
if ( $find( 'hv_banner', 'hv_banner_seed', $designed_key ) ) {
	$say( "= banner {$designed_key}: đã có" );
} elseif ( $find( 'hv_banner', 'hv_banner_seed', $designed_key, true ) ) {
	$say( "= banner {$designed_key}: MKT đã xoá, không tạo lại" );
} else {
	$say( '+ banner dựng sẵn: Hà Nội đi Điện Biên, 900.000đ cho 2 vé Luxury (xanh dương)' );
	if ( ! $dry ) {
		$id = wp_insert_post( array( 'post_type' => 'hv_banner', 'post_status' => 'publish', 'post_title' => 'Hà Nội đi Điện Biên, 900.000đ cho 2 vé Luxury, đặt trước 3 ngày', 'menu_order' => 1 ), true );
		if ( is_wp_error( $id ) ) {
			WP_CLI::warning( $id->get_error_message() );
		} else {
			$meta = array(
				'hv_banner_seed'     => $designed_key,
				'hv_banner_type'     => 'web',
				'hv_banner_kind'     => 'designed',
				'hv_banner_eyebrow'  => 'Hà Nội đi Điện Biên',
				'hv_banner_headline' => '900.000đ cho 2 vé Luxury',
				'hv_banner_sub'      => 'Đặt trước 3 ngày, tiết kiệm đến 130.000đ.',
				'hv_banner_btn'      => 'Xem ưu đãi',
				'hv_banner_tone'     => 'blue',
				'hv_banner_link'     => '/xe-khach/my-dinh/dien-bien',
				'hv_banner_v3'       => '1',
			);
			foreach ( $meta as $k => $v ) {
				update_post_meta( $id, $k, $v );
			}
			$att = hvs_sideload( __DIR__ . '/lib/seed-assets/xe-hanoi-dienbien.webp', $id, 'Xe Royal vàng và xe Luxury trắng của Hải Vân chạy tuyến Hà Nội đi Điện Biên' );
			if ( $att ) {
				update_post_meta( $id, 'hv_banner_cutout_id', (string) $att );
			} else {
				WP_CLI::warning( '  không nạp được ảnh xe tách nền; slide vẫn hiện chữ.' );
			}
		}
	}
}

// Banner cũ: xếp thứ tự theo comp, banner không có trong comp thành Nháp (một lần).
$plan = array(
	'assets-page1' => array( 'order' => 2, 'draft' => false ),
	'assets-page2' => array( 'order' => 3, 'draft' => false ),
	'cms-141'      => array( 'order' => 4, 'draft' => true ),
);
foreach ( $plan as $key => $p ) {
	$ids = $find( 'hv_banner', 'hv_banner_seed', $key );
	if ( ! $ids || get_post_meta( $ids[0], 'hv_banner_v3', true ) ) {
		continue;
	}
	$say( "~ banner {$key} (#{$ids[0]}): thứ tự {$p['order']}" . ( $p['draft'] ? ', chuyển Nháp (không có trong comp)' : '' ) );
	if ( ! $dry ) {
		wp_update_post( array( 'ID' => $ids[0], 'menu_order' => $p['order'], 'post_status' => $p['draft'] ? 'draft' : get_post_status( $ids[0] ) ) );
		update_post_meta( $ids[0], 'hv_banner_v3', '1' );
	}
}

/* ---------- Ưu đãi ---------- */
$offers = array(
	'sg-vt-419'   => array( 'title' => 'Sài Gòn đi Vũng Tàu', 'badge' => 'Tiết kiệm 101k', 'badge_style' => 'sale', 'price' => '419k', 'unit' => '/ 2 vé Luxury, 210k mỗi người', 'cond' => 'Đặt trước ít nhất 1 tiếng. Chỉ chuyến có nhãn Combo.', 'tone' => 'teal', 'image_url' => '/assets/design/don-khach.jpg', 'link' => '/xe-khach/quan-1/vung-tau' ),
	'sg-vt-group' => array( 'title' => 'Sài Gòn đi Vũng Tàu, hàng cuối', 'badge' => 'Đi nhóm', 'price' => '599k', 'unit' => '/ 3 vé, 4 vé 789k', 'cond' => 'Combo trọn hàng cuối, số suất mỗi chuyến có hạn.', 'tone' => 'blue', 'image_url' => '/assets/design/phuong_tien_6.jpg', 'link' => '/xe-khach/quan-1/vung-tau' ),
	'hn-db-900'   => array( 'title' => 'Hà Nội đi Điện Biên', 'badge' => 'Đặt trước 3 ngày', 'price' => '900.000đ', 'unit' => '/ 2 vé Luxury, 450k mỗi vé', 'cond' => 'Royal Cabin 1.200.000đ / 2 vé. Tiết kiệm đến 130.000đ.', 'tone' => 'orange', 'image_url' => '/assets/design/route-mydinh-dienbien.jpg', 'link' => '/xe-khach/my-dinh/dien-bien' ),
	'hn-db-eco'   => array( 'title' => 'Hà Nội đi Điện Biên, xe Eco', 'badge' => 'Đặt trước 7 ngày', 'price' => '500.000đ', 'unit' => '/ 2 vé, 250k mỗi vé', 'cond' => 'Nhóm 4 vé 800.000đ. Xe Eco 44 giường bọc da.', 'tone' => 'leaf', 'image_url' => '/assets/design/class-economy.jpg', 'link' => '/xe-khach/my-dinh/dien-bien' ),
	'app-50k'     => array( 'title' => 'Tặng bạn 50k', 'badge' => 'Ứng dụng Hải Vân', 'price' => '50k', 'unit' => 'cho lần đặt vé đầu tiên', 'cond' => 'Khi đặt lần đầu qua ứng dụng Hải Vân.', 'tone' => 'coral', 'icon' => 'smartphone', 'link' => '/dat-ve-nhanh', 'cta' => 'Tải ứng dụng' ),
);
$order = 1;
foreach ( $offers as $key => $d ) {
	$n = $order++;
	if ( $find( 'hv_offer', 'hv_offer_seed', $key ) ) {
		$say( "= ưu đãi {$key}: đã có, giữ nguyên" );
		continue;
	}
	if ( $find( 'hv_offer', 'hv_offer_seed', $key, true ) ) {
		$say( "= ưu đãi {$key}: MKT đã xoá, không tạo lại" );
		continue;
	}
	$say( "+ ưu đãi {$key}: {$d['title']} {$d['price']}" );
	if ( $dry ) {
		continue;
	}
	$id = wp_insert_post( array( 'post_type' => 'hv_offer', 'post_status' => 'publish', 'post_title' => $d['title'], 'menu_order' => $n ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $id->get_error_message() );
		continue;
	}
	update_post_meta( $id, 'hv_offer_seed', $key );
	update_post_meta( $id, 'hv_offer_badge_style', 'on-fill' );
	foreach ( $d as $k => $v ) {
		if ( 'title' !== $k ) {
			update_post_meta( $id, 'hv_offer_' . $k, $v );
		}
	}
}
if ( ! $dry ) {
	delete_transient( 'hv_home_rest_v1' );
}
WP_CLI::success( 'Xong. Kiểm: /wp-admin/edit.php?post_type=hv_banner và post_type=hv_offer.' );
