<?php
/**
 * wp eval-file /scripts/seed-v4.php   (HV_DRY_RUN=1 chỉ báo cáo; HV_FORCE=1 ghi đè cả trang MKT đã sửa)
 * Dữ liệu cho thiết kế v4, idempotent, không ghi đè việc của MKT:
 *  1. Banner ảnh thật đầu tiên (slide "ảnh thật" cho kính có gì để làm mờ): /assets/design/home-hero.jpg (+ bản 720px cho điện thoại),
 *     nạp vào Media. Khoá meta hv_banner_seed = home-hero-photo; MKT đã xoá thì không tạo lại.
 *  2. Footer (vi + en), cột "Về chúng tôi"/"About us": thêm liên kết tới trang chương trình khách hàng thân thiết (chỉ khi chưa có).
 *  3. Trang "Chương trình khách hàng thân thiết" (vi + en): nội dung sạch (xem lib/membership-content.php), Rank Math title/description.
 *     Chỉ ghi khi trang còn nguyên bản nhập (hvs_may_overwrite); MKT đã sửa thì giữ nguyên, trừ khi HV_FORCE=1. Rank Math title/description ghi cùng lúc (chỉ khi trang được phép ghi).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/membership-content.php';

$dry   = '1' === getenv( 'HV_DRY_RUN' );
$force = '1' === getenv( 'HV_FORCE' );
$say   = static fn( $m ) => WP_CLI::log( ( $dry ? '(thử) ' : '' ) . $m );

/* ---------- 1. Banner ảnh thật ---------- */
$key  = 'home-hero-photo';
$find = static function ( $status ) use ( $key ) {
	return get_posts( array( 'post_type' => 'hv_banner', 'post_status' => $status, 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_banner_seed', 'meta_value' => $key, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
};
if ( $find( 'any' ) ) {
	$say( "= banner {$key}: đã có" );
} elseif ( $find( 'trash' ) ) {
	$say( "= banner {$key}: MKT đã xoá, không tạo lại" );
} else {
	$alt = 'Nhân viên Hải Vân đón khách và đỡ vali lên xe sân bay Tân Sơn Nhất, Vũng Tàu bên bờ biển';
	$say( "+ banner {$key}: slide ảnh thật đầu tiên (thứ tự 0)" );
	if ( ! $dry ) {
		$id = wp_insert_post( array( 'post_type' => 'hv_banner', 'post_status' => 'publish', 'post_title' => $alt, 'menu_order' => 0 ), true );
		if ( is_wp_error( $id ) ) {
			WP_CLI::warning( $id->get_error_message() );
		} else {
			foreach ( array( 'hv_banner_seed' => $key, 'hv_banner_type' => 'web', 'hv_banner_kind' => 'image', 'hv_banner_link' => '/xe-san-bay' ) as $k => $v ) {
				update_post_meta( $id, $k, $v );
			}
			$desk = hvs_sideload( __DIR__ . '/lib/seed-assets/home-hero.jpg', $id, $alt );
			$mob  = hvs_sideload( __DIR__ . '/lib/seed-assets/home-hero-720.jpg', $id, $alt );
			if ( $desk ) {
				set_post_thumbnail( $id, $desk );
			} else {
				WP_CLI::warning( '  không nạp được ảnh desktop; slide sẽ không hiện.' );
			}
			if ( $mob ) {
				update_post_meta( $id, 'hv_banner_mobile_id', (string) $mob );
			}
			delete_transient( 'hv_home_rest_v1' );
		}
	}
}

/* ---------- 2. Footer: liên kết chương trình khách hàng thân thiết ---------- */
foreach (
	array(
		'footer-vi' => array( 'parent' => 'Về chúng tôi', 'title' => 'Khách hàng thân thiết', 'url' => '/chung-toi/chuong-trinh-khach-hang-than-thiet' ),
		'footer-en' => array( 'parent' => 'About us', 'title' => 'Loyalty program', 'url' => '/en/chung-toi/chuong-trinh-khach-hang-than-thiet' ),
	) as $slug => $m
) {
	$menu = wp_get_nav_menu_object( $slug );
	if ( ! $menu ) {
		WP_CLI::warning( "menu {$slug} không có, bỏ qua." );
		continue;
	}
	$items  = wp_get_nav_menu_items( $menu->term_id );
	$parent = 0;
	$exists = false;
	$last   = 0;
	foreach ( (array) $items as $it ) {
		if ( $it->url === $m['url'] || untrailingslashit( (string) $it->url ) === home_url( $m['url'] ) ) {
			$exists = true;
		}
		if ( 0 === (int) $it->menu_item_parent && $it->title === $m['parent'] ) {
			$parent = (int) $it->ID;
		}
	}
	foreach ( (array) $items as $it ) {
		if ( (int) $it->menu_item_parent === $parent ) {
			$last = max( $last, (int) $it->menu_order );
		}
	}
	if ( $exists ) {
		$say( "= {$slug}: đã có liên kết chương trình" );
	} elseif ( ! $parent ) {
		WP_CLI::warning( "{$slug}: không thấy cột \"{$m['parent']}\" (MKT đã đổi tên?), bỏ qua." );
	} else {
		$say( "+ {$slug}: thêm \"{$m['title']}\" vào cột \"{$m['parent']}\"" );
		if ( ! $dry ) {
			$r = wp_update_nav_menu_item(
				$menu->term_id,
				0,
				array(
					'menu-item-title'     => $m['title'],
					'menu-item-url'       => $m['url'],
					'menu-item-type'      => 'custom',
					'menu-item-status'    => 'publish',
					'menu-item-parent-id' => $parent,
					'menu-item-position'  => $last + 1,
				)
			);
			if ( is_wp_error( $r ) ) {
				WP_CLI::warning( $r->get_error_message() );
			}
		}
	}
}

/* ---------- 3. Trang chương trình ---------- */
$seo = array(
	'vi' => array(
		'id'    => 48,
		'title' => 'Chương trình khách hàng thân thiết "Tôi yêu Hải Vân" | Hải Vân',
		'desc'  => 'Tích điểm, lên hạng Bạc, Vàng, Kim cương và đổi vé miễn phí với chương trình "Tôi yêu Hải Vân". Xem tiêu chí xét hạng, quyền lợi và tham gia ngay.',
	),
	'en' => array(
		'id'    => 49,
		'title' => 'Loyalty program "Tôi yêu Hải Vân" (I Love Hai Van) | Hải Vân',
		'desc'  => 'Earn points, climb from Member to Diamond and redeem free tickets with the "Tôi yêu Hải Vân" loyalty program. See the criteria and benefits, then join.',
	),
);
foreach ( $seo as $lang => $d ) {
	$post = get_post( $d['id'] );
	if ( ! $post || 'page' !== $post->post_type || 'chuong-trinh-khach-hang-than-thiet' !== $post->post_name ) {
		WP_CLI::warning( "trang #{$d['id']} ({$lang}) không đúng, bỏ qua." );
		continue;
	}
	list( $ok, $why ) = hvs_may_overwrite( $post->ID, $force );
	if ( ! $ok ) {
		$say( "= trang #{$post->ID} ({$lang}): giữ nguyên ({$why}: MKT đã sửa), dùng HV_FORCE=1 để ghi đè" );
		continue;
	}
	$html = hvs_clean_html( hvs_membership_html( $lang ) );
	if ( $html === $post->post_content ) {
		$say( "= trang #{$post->ID} ({$lang}): nội dung đã đúng" );
	} else {
		$say( "~ trang #{$post->ID} ({$lang}): ghi nội dung sạch (" . strlen( $post->post_content ) . ' -> ' . strlen( $html ) . ' byte)' );
		if ( ! $dry ) {
			$r = wp_update_post( array( 'ID' => $post->ID, 'post_content' => $html ), true );
			if ( is_wp_error( $r ) ) {
				WP_CLI::warning( $r->get_error_message() );
				continue;
			}
			hvs_stamp_import( $post->ID );
		}
	}
	if ( ! $dry ) {
		update_post_meta( $post->ID, 'rank_math_title', $d['title'] );
		update_post_meta( $post->ID, 'rank_math_description', $d['desc'] );
	}
	$say( "~ trang #{$post->ID} ({$lang}): Rank Math title/description" );
}
WP_CLI::success( 'Xong seed-v4.' );
