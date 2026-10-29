<?php
/**
 * wp eval-file /scripts/seed-corridors.php   (HV_DRY_RUN=1 chỉ báo cáo; HV_FORCE=1 ghi đè tuyến đã seed)
 * Dữ liệu cho ô tìm vé theo tuyến, idempotent, không ghi đè việc của MKT:
 *  1. 4 tuyến chính (CPT hv_corridor: sg-vt, hn-db, hn-moc, hn-sl) từ lib/corridors-seed.php. Mã tuyến đã có (kể cả nháp)
 *     thì GIỮ NGUYÊN; đã vào thùng rác = MKT đã xoá, không tạo lại. Ảnh đại diện lấy từ bài hv_route/diem_den cùng tuyến (chỉ khi chưa có).
 *  2. 3 chương trình khứ hồi MẪU (CPT hv_promo), TẮT HẾT: giảm 20.000đ/ghế chiều về cho sg-vt, hn-moc, hn-sl, mã ERP lấy từ biến môi trường HV_SEED_ROUNDTRIP_CODE
 *     (booking.haivan.com không giảm cho Điện Biên nên hn-db không có). Bật sau khi luồng áp mã ẩn của Next đã kiểm chứng.
 *     Không còn combo mẫu: combo trên booking.haivan.com là mẹo viết tay, không phải cơ chế ERP (loại Combo vẫn có trong CPT).
 *     Khoá meta hv_promo_seed; đã có hoặc đã xoá thì không tạo lại. Chỉ bật được sau khi nhập mã ERP (xem inc/promos.php).
 * Chạy lại an toàn. Sau khi chạy: GET /wp-json/haivan-web/v1/booking-config.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
$dry   = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$force = '1' === (string) ( getenv( 'HV_FORCE' ) ?: '0' );
$say   = static fn( $m ) => WP_CLI::log( ( $dry ? '(thử) ' : '' ) . $m );

if ( ! post_type_exists( 'hv_corridor' ) || ! post_type_exists( 'hv_promo' ) || ! function_exists( 'hv_corridor_parse_stops' ) ) {
	WP_CLI::error( 'Child theme haivan-web-child chưa bật hoặc thiếu inc/corridors.php, inc/promos.php.' );
}

/** Bài hv_corridor có mã $id (mọi trạng thái, kể cả thùng rác), hoặc null. */
$find_corridor = static function ( $id ) {
	$posts = get_posts(
		array(
			'post_type'        => 'hv_corridor',
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ),
			'numberposts'      => 1,
			'meta_key'         => 'hv_corridor_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => $id, // phpcs:ignore WordPress.DB.SlowDBQuery
			'orderby'          => 'ID',
			'order'            => 'ASC',
			'suppress_filters' => true,
		)
	);
	return $posts ? $posts[0] : null;
};

/** Ảnh đại diện gợi ý cho thẻ tuyến: ảnh của hv_route khớp trang tuyến chiều đi, hoặc điểm đến cùng tên. */
$thumb_for = static function ( array $c ) {
	foreach ( array( $c['landing_ab'], $c['landing_ba'] ) as $path ) {
		$route = $path ? hv_route_find( $path ) : null;
		if ( $route && get_post_thumbnail_id( $route->ID ) ) {
			return (int) get_post_thumbnail_id( $route->ID );
		}
	}
	$dest = array( 'sg-vt' => 'vung-tau', 'hn-db' => 'dien-bien', 'hn-moc' => 'moc-chau', 'hn-sl' => 'son-la' )[ $c['id'] ] ?? '';
	$post = '' !== $dest ? get_posts( array( 'post_type' => 'diem_den', 'name' => $dest, 'post_status' => 'publish', 'numberposts' => 1, 'suppress_filters' => true ) ) : array();
	return $post ? (int) get_post_thumbnail_id( $post[0]->ID ) : 0;
};

/* ---------- 1. Tuyến chính ---------- */
foreach ( require __DIR__ . '/lib/corridors-seed.php' as $c ) {
	$errs  = array();
	$stops = array(
		'a' => hv_corridor_parse_stops( $c['stops_a'], $errs ),
		'b' => hv_corridor_parse_stops( $c['stops_b'], $errs ),
	);
	if ( $errs ) {
		WP_CLI::warning( "{$c['id']}: dữ liệu seed sai, bỏ qua: " . implode( ' ', $errs ) );
		continue;
	}
	$post = $find_corridor( $c['id'] );
	if ( $post && 'trash' === $post->post_status ) {
		$say( "= tuyến {$c['id']}: MKT đã xoá, không tạo lại" );
		continue;
	}
	if ( $post && ! $force ) {
		$say( "= tuyến {$c['id']}: đã có (#{$post->ID}), giữ nguyên" );
	} else {
		$say( ( $post ? '~' : '+' ) . " tuyến {$c['id']}: {$c['label_vi']}" );
		if ( ! $dry ) {
			$id = $post ? $post->ID : wp_insert_post( array( 'post_type' => 'hv_corridor', 'post_status' => 'publish', 'post_title' => $c['label_vi'], 'menu_order' => $c['order'] ), true );
			if ( is_wp_error( $id ) ) {
				WP_CLI::warning( $id->get_error_message() );
				continue;
			}
			if ( $post ) {
				wp_update_post( array( 'ID' => $id, 'post_title' => $c['label_vi'], 'menu_order' => $c['order'], 'post_status' => 'publish' ) );
			}
			$meta = array(
				'id'         => $c['id'],
				'label_en'   => $c['label_en'],
				'enabled'    => '1',
				'sleeper'    => $c['sleeper'] ? '1' : '0',
				'max_days'   => (string) $c['max_days'],
				'landing_ab' => (string) $c['landing_ab'],
				'landing_ba' => (string) $c['landing_ba'],
				'stops_a'    => hv_corridor_stops_to_text( $stops['a'] ),
				'stops_b'    => hv_corridor_stops_to_text( $stops['b'] ),
				'default_a'  => $c['default_a'],
				'default_b'  => $c['default_b'],
			);
			foreach ( array( 'a', 'b' ) as $side ) {
				foreach ( $c[ $side ] as $k => $v ) {
					$meta[ "{$side}_{$k}" ] = $v;
				}
			}
			foreach ( $meta as $k => $v ) {
				update_post_meta( $id, 'hv_corridor_' . $k, $v );
			}
			$post = get_post( $id );
		}
	}
	// Ảnh thẻ: chỉ khi bài chưa có ảnh và chưa từng được seed ảnh (MKT đã gỡ ảnh thì không đặt lại).
	if ( $post && ! $dry && ! has_post_thumbnail( $post->ID ) && ! get_post_meta( $post->ID, 'hv_corridor_thumb_seeded', true ) ) {
		$thumb = $thumb_for( $c );
		if ( $thumb ) {
			set_post_thumbnail( $post->ID, $thumb );
			update_post_meta( $post->ID, 'hv_corridor_thumb_seeded', '1' );
			$say( "  ảnh thẻ {$c['id']}: attachment #{$thumb}" );
		} else {
			WP_CLI::warning( "{$c['id']}: không tìm được ảnh gợi ý, thẻ trang chủ sẽ để khung trống (đặt Ảnh đại diện trong admin)." );
		}
	}
}

/* ---------- 2. Chương trình giảm giá mẫu (tắt) ---------- */
// Mã ERP không nằm trong mã nguồn: truyền bằng `docker compose run -e HV_SEED_ROUNDTRIP_CODE=<MÃ_ERP> ...`; không có thì để trống (chương trình không bật được).
$seed_code   = trim( (string) ( getenv( 'HV_SEED_ROUNDTRIP_CODE' ) ?: '' ) );
$promos      = array(
	'roundtrip-sg-vt'  => array( 'title' => 'Khứ hồi giảm 20.000đ/ghế chiều về – Sài Gòn – Vũng Tàu (mẫu, tắt)', 'corridor' => 'sg-vt', 'type' => 'roundtrip', 'per_seat_vnd' => '20000', 'code' => $seed_code ),
	'roundtrip-hn-moc' => array( 'title' => 'Khứ hồi giảm 20.000đ/ghế chiều về – Hà Nội – Mộc Châu (mẫu, tắt)', 'corridor' => 'hn-moc', 'type' => 'roundtrip', 'per_seat_vnd' => '20000', 'code' => $seed_code ),
	'roundtrip-hn-sl'  => array( 'title' => 'Khứ hồi giảm 20.000đ/ghế chiều về – Hà Nội – Sơn La (mẫu, tắt)', 'corridor' => 'hn-sl', 'type' => 'roundtrip', 'per_seat_vnd' => '20000', 'code' => $seed_code ),
);
foreach ( $promos as $seed_key => $p ) {
	$exists = get_posts( array( 'post_type' => 'hv_promo', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_promo_seed', 'meta_value' => $seed_key, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	$trash  = get_posts( array( 'post_type' => 'hv_promo', 'post_status' => 'trash', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_promo_seed', 'meta_value' => $seed_key, 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( $exists ) {
		// Chương trình mẫu cũ chưa có mã: điền mã (vẫn TẮT); đã có mã hoặc MKT sửa thì giữ nguyên.
		if ( '' !== $p['code'] && '' === trim( (string) get_post_meta( $exists[0], 'hv_promo_code', true ) ) ) {
			$say( "~ chương trình {$seed_key}: điền mã từ HV_SEED_ROUNDTRIP_CODE (vẫn tắt)" );
			if ( ! $dry ) {
				update_post_meta( $exists[0], 'hv_promo_code', $p['code'] );
			}
		} else {
			$say( "= chương trình {$seed_key}: đã có (#{$exists[0]}), giữ nguyên" );
		}
		continue;
	}
	if ( $trash ) {
		$say( "= chương trình {$seed_key}: MKT đã xoá, không tạo lại" );
		continue;
	}
	$say( "+ chương trình {$seed_key} (tắt" . ( '' !== $p['code'] ? ', có mã' : ', chưa có mã' ) . ')' );
	if ( $dry ) {
		continue;
	}
	$id = wp_insert_post( array( 'post_type' => 'hv_promo', 'post_status' => 'publish', 'post_title' => $p['title'] ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $id->get_error_message() );
		continue;
	}
	$meta = array_merge(
		array( 'seed' => $seed_key, 'enabled' => '0', 'code' => '', 'direction' => 'both', 'weekdays' => array() ), // 'code' bị ghi đè bởi mã của chương trình mẫu bên dưới.
		array_diff_key( $p, array( 'title' => 1 ) )
	);
	foreach ( $meta as $k => $v ) {
		update_post_meta( $id, 'hv_promo_' . $k, $v );
	}
}

/* Combo mẫu cũ (chưa ai bật hoặc sửa): chuyển vào thùng rác. */
foreach ( get_posts( array( 'post_type' => 'hv_promo', 'post_status' => 'publish', 'numberposts' => 5, 'fields' => 'ids', 'meta_key' => 'hv_promo_seed', 'meta_value' => 'combo-sg-vt', 'suppress_filters' => true ) ) as $cid ) { // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( '1' !== (string) get_post_meta( $cid, 'hv_promo_enabled', true ) ) {
		$say( "- combo mẫu #{$cid}: bỏ (mẹo viết tay, không phải cơ chế ERP)" );
		if ( ! $dry ) {
			wp_trash_post( $cid );
		}
	}
}

/* ---------- Kết quả ---------- */
if ( ! $dry ) {
	$cfg = hv_booking_config();
	WP_CLI::success( count( $cfg['corridors'] ) . ' tuyến đang bật, ' . count( $cfg['promos'] ) . ' chương trình đang chạy (mẫu đều tắt). Kiểm tra: GET /wp-json/haivan-web/v1/booking-config' );
}
