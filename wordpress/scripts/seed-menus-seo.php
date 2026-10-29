<?php
/**
 * wp eval-file /scripts/seed-menus-seo.php
 * Đưa menu header/footer đang chạy (Giao diện > Menu, mỗi ngôn ngữ một menu) về cùng bản với data/layout-seed.json:
 *  - nhóm tuyến xe (con của "Tuyến đường" ở header, các mục /xe-khach/... ở cột "Xe liên tỉnh" của footer) được đồng bộ về danh sách seed:
 *    header = mỗi tuyến một mục (chiều đi), footer = đủ hai chiều theo cặp. Chỉ dựng lại khi danh sách đường dẫn khác seed
 *    (thêm/bớt/đổi thứ tự); khi đường dẫn đã đúng thì chỉ đổi nhãn đang là nhãn seed cũ, nhãn MKT sửa được giữ;
 *  - tên điểm đến ở footer /en/ bằng tiếng Anh (chỉ đổi nhãn đang đúng nhãn tiếng Việt cũ).
 * Idempotent. Biến: HV_DRY_RUN=1 chỉ báo cáo.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
$dry  = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$seed = hv_layout_seed();

// Nhãn seed cũ (để đổi nhãn khi danh sách đường dẫn đã đúng): theo đường dẫn không tiền tố ngôn ngữ.
$legacy_routes = array(
	'/xe-khach/quan-1/vung-tau'         => array( 'Quận 1 - Vũng Tàu', 'District 1 - Vung Tau' ),
	'/xe-khach/vung-tau/quan-1-san-bay' => array( 'Vũng Tàu - Quận 1 Sân Bay', 'Vũng Tàu - Quận 1 / Sân bay', 'Vung Tau - District 1 / Airport' ),
	'/xe-khach/tan-son-nhat/vung-tau'   => array( 'Tân Sơn Nhất - Vũng Tàu', 'Tan Son Nhat - Vung Tau' ),
	'/xe-khach/vung-tau/tan-son-nhat'   => array( 'Vũng Tàu - Tân Sơn Nhất', 'Vung Tau - Tan Son Nhat' ),
	'/xe-khach/my-dinh/dien-bien'       => array( 'Mỹ Đình - Điện Biên', 'My Dinh - Dien Bien' ),
	'/xe-khach/yen-nghia/dien-bien'     => array( 'Yên Nghĩa - Điện Biên', 'Yen Nghia - Dien Bien' ),
	'/xe-khach/my-dinh/son-la'          => array( 'Mỹ Đình - Sơn La', 'My Dinh - Son La' ),
	'/xe-khach/my-dinh/moc-chau'        => array( 'Mỹ Đình - Mộc Châu', 'My Dinh - Moc Chau' ),
);
$legacy_dest = array(
	'/diem-den/vung-tau'  => array( 'Bà Rịa - Vũng Tàu' ),
	'/diem-den/dien-bien' => array( 'Điện Biên' ),
	'/diem-den/son-la'    => array( 'Sơn La' ),
	'/diem-den/moc-chau'  => array( 'Mộc Châu' ),
	'/diem-den/ha-noi'    => array( 'Hà Nội' ),
);

$norm = static function ( $href ) {
	$h = preg_replace( '#^/en(?=/|$)#', '', (string) $href );
	return '' === $h ? '/' : rtrim( $h, '/' );
};
$path_of  = static function ( $item ) use ( $norm ) {
	return $norm( wp_parse_url( (string) $item->url, PHP_URL_PATH ) ?: '' );
};
$is_route = static fn( $p ) => 0 === strpos( $p, '/xe-khach/' );

$changes = 0;
foreach ( HV_LAYOUT_LANGS as $lang ) {
	foreach ( array( 'hv_primary', 'hv_footer' ) as $location ) {
		$menu_id = hv_menu_id_for( $location, $lang );
		if ( $menu_id <= 0 ) {
			WP_CLI::warning( "{$location}/{$lang}: chưa gán menu, bỏ qua" );
			continue;
		}
		$items  = (array) wp_get_nav_menu_items( $menu_id );
		$groups = 'hv_primary' === $location
			? array_map( static fn( $n ) => $n['children'] ?? array(), $seed[ $lang ]['primary'] )
			: array_map( static fn( $c ) => $c['items'], $seed[ $lang ]['footer_columns'] );
		// Nhóm tuyến theo seed: nhóm đầu tiên có lá /xe-khach/...
		$want = array();
		foreach ( $groups as $children ) {
			$routes = array_values( array_filter( $children, static fn( $l ) => $is_route( $norm( $l['href'] ) ) ) );
			if ( $routes ) {
				$want = $routes;
				break;
			}
		}
		$cur = array_values( array_filter( $items, static fn( $it ) => $is_route( $path_of( $it ) ) && (int) $it->menu_item_parent > 0 ) );
		usort( $cur, static fn( $a, $b ) => (int) $a->menu_order <=> (int) $b->menu_order );
		$want_paths = array_map( static fn( $l ) => $norm( $l['href'] ), $want );
		$cur_paths  = array_map( $path_of, $cur );

		if ( $want && $cur && $want_paths !== $cur_paths ) {
			// Dựng lại nhóm tuyến: giữ cha và vị trí của mục đầu tiên, các mục phía sau đẩy xuống.
			$parent = (int) $cur[0]->menu_item_parent;
			$start  = (int) $cur[0]->menu_order;
			WP_CLI::log( "~ {$location}/{$lang}: dựng lại nhóm tuyến (" . count( $cur ) . ' -> ' . count( $want ) . ' mục)' );
			if ( ! $dry ) {
				$gone = array_map( static fn( $it ) => (int) $it->ID, $cur );
				foreach ( $gone as $id ) {
					wp_delete_post( $id, true );
				}
				foreach ( $items as $it ) {
					if ( ! in_array( (int) $it->ID, $gone, true ) && (int) $it->menu_order >= $start ) {
						wp_update_post( array( 'ID' => $it->ID, 'menu_order' => (int) $it->menu_order + count( $want ) ) );
					}
				}
				foreach ( $want as $i => $leaf ) {
					wp_update_nav_menu_item(
						$menu_id,
						0,
						array(
							'menu-item-title'     => $leaf['label'],
							'menu-item-url'       => $leaf['href'],
							'menu-item-type'      => 'custom',
							'menu-item-status'    => 'publish',
							'menu-item-parent-id' => $parent,
							'menu-item-position'  => $start + $i,
						)
					);
				}
				$items = (array) wp_get_nav_menu_items( $menu_id );
			}
			++$changes;
		}

		// Đường dẫn đã đúng: đổi nhãn đang là nhãn seed cũ theo seed hiện tại; nhãn MKT sửa được giữ.
		$labels = array();
		foreach ( $groups as $children ) {
			foreach ( $children as $leaf ) {
				$labels[ $norm( $leaf['href'] ) ] = $leaf['label'];
			}
		}
		foreach ( $items as $it ) {
			$key   = $path_of( $it );
			$old   = array_merge( $legacy_routes[ $key ] ?? array(), 'en' === $lang ? ( $legacy_dest[ $key ] ?? array() ) : array() );
			$title = trim( html_entity_decode( (string) $it->title, ENT_QUOTES, 'UTF-8' ) );
			if ( isset( $labels[ $key ] ) && $title !== $labels[ $key ] && in_array( $title, $old, true ) ) {
				WP_CLI::log( "~ {$location}/{$lang}: \"{$title}\" -> \"{$labels[ $key ]}\"" );
				if ( ! $dry ) {
					wp_update_nav_menu_item( $menu_id, $it->ID, array( 'menu-item-title' => $labels[ $key ], 'menu-item-url' => $it->url, 'menu-item-type' => 'custom', 'menu-item-status' => 'publish', 'menu-item-parent-id' => (int) $it->menu_item_parent, 'menu-item-position' => (int) $it->menu_order ) );
				}
				++$changes;
			}
		}
	}
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . ( $changes ? "{$changes} thay đổi menu." : 'Menu đã đúng, không đổi.' ) );
