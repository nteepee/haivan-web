<?php
/**
 * Các khối trang chủ (HTML dựng từ CPT/cài đặt của MKT). Mọi giá trị đều được escape tại chỗ in.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tiêu đề khối: h2 + liên kết "xem tất cả" + (khi là rail) cặp mũi tên cuộn. Mũi tên ẩn cho tới khi JS bật,
 * rail vẫn cuộn bằng vuốt/phím không cần JS. Nhãn cố định, đích do template truyền.
 *
 * @param string $rail_id Id của ul.hv-hrail mà mũi tên điều khiển ('' = không có mũi tên).
 * @param bool   $grid    true = rail thành lưới khi đủ chỗ (ẩn mũi tên từ 60rem).
 */
function hv_block_head( $id, $title, $href = '', $link_label = '', $rail_id = '', $grid = false ) {
	echo '<div class="hv-section-head"><h2 id="' . esc_attr( $id ) . '">' . esc_html( $title ) . '</h2><div class="hv-section-head-end">';
	if ( '' !== $href ) {
		echo '<a class="hv-link" href="' . esc_url( $href ) . '">' . esc_html( $link_label ) . hv_icon( 'chevron-right', 'hv-ic--sm' ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	}
	if ( '' !== $rail_id ) {
		echo '<div class="hv-rail-ctrls" data-for="' . esc_attr( $rail_id ) . '"' . ( $grid ? ' data-grid' : '' ) . ' hidden>';
		echo '<button class="hv-rail-btn hv-rail-prev" type="button" aria-label="' . esc_attr( sprintf( hv_t( 'rail_prev' ), $title ) ) . '" aria-controls="' . esc_attr( $rail_id ) . '">' . hv_icon( 'chevron-left' ) . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="hv-rail-btn hv-rail-next" type="button" aria-label="' . esc_attr( sprintf( hv_t( 'rail_next' ), $title ) ) . '" aria-controls="' . esc_attr( $rail_id ) . '">' . hv_icon( 'chevron-right' ) . '</button></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</div></div>';
}

/** Rail ngang (scroll-snap, mờ mép phải): $items là chuỗi <li> đã dựng và escape. */
function hv_rail( $id, $label, $items, $cls = '' ) {
	echo '<div class="hv-rail-wrap"><ul class="hv-hrail ' . esc_attr( $cls ) . '" id="' . esc_attr( $id ) . '" tabindex="0" aria-label="' . esc_attr( $label ) . '">' . $items . '</ul></div>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $items đã escape khi dựng.
}

/** "Quận 1 - Vũng Tàu" -> "Quận 1 đi Vũng Tàu". */
function hv_route_label( $title ) {
	return str_replace( ' - ', ' đi ', (string) $title );
}

/** "2h" -> "2 giờ"; "4h15" -> "4 giờ 15" (bản tiếng Anh giữ nguyên). */
function hv_route_time_label( $t ) {
	if ( 'en' === hv_lang() ) {
		return trim( (string) $t ); // "11h" giữ nguyên ở bản tiếng Anh.
	}
	return trim( (string) preg_replace( array( '/(\d+)\s*h\s*(\d+)/i', '/(\d+)\s*h\b/i' ), array( '$1 giờ $2', '$1 giờ' ), (string) $t ) ); // "4h15" -> "4 giờ 15", "2h" -> "2 giờ".
}

/** Thẻ ảnh WP (attachment) 16:9 cho thẻ, hoặc khung trống cùng tỉ lệ. */
function hv_card_image( $post, $size, $cls ) {
	if ( has_post_thumbnail( $post ) ) {
		return get_the_post_thumbnail( $post, $size, array( 'class' => $cls, 'loading' => 'lazy', 'decoding' => 'async', 'alt' => hv_image_alt( $post ) ) );
	}
	return '';
}

/** Dải 4 cam kết có nguồn (tổng đài, vé QR, giữ đúng giường, VNPay-QR); nội dung cố định theo comp, hotline lấy từ Layout. */
function hv_render_trust() {
	$hotline = hv_layout_settings()['hotline'];
	$items   = array(
		array( 'headset', sprintf( hv_t( 'trust_1_t' ), $hotline ), hv_t( 'trust_1_d' ) ),
		array( 'qr-code', hv_t( 'trust_2_t' ), hv_t( 'trust_2_d' ) ),
		array( 'bed-double', hv_t( 'trust_3_t' ), hv_t( 'trust_3_d' ) ),
		array( 'credit-card', hv_t( 'trust_4_t' ), hv_t( 'trust_4_d' ) ),
	);
	echo '<ul class="hv-trust">';
	foreach ( $items as $it ) {
		echo '<li><span class="hv-ico" aria-hidden="true">' . hv_icon( $it[0] ) . '</span><div><h3>' . esc_html( $it[1] ) . '</h3><p>' . esc_html( $it[2] ) . '</p></div></li>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	}
	echo '</ul>';
}

/**
 * Thẻ 4 tuyến chính (CPT hv_corridor đang bật). Thẻ dẫn tới trang tuyến chiều đi (landing ab); tuyến chưa có trang thì dẫn
 * tới trang tìm chuyến điền sẵn điểm đón/trả mặc định. Giá và thời gian chạy lấy từ bài hv_route của landing đó nếu có.
 * Trả chuỗi rỗng khi chưa có tuyến chính nào.
 */
function hv_render_corridor_cards() {
	$lang   = hv_lang();
	$prefix = hv_lang_prefix( $lang );
	$out    = '';
	foreach ( hv_corridors_enabled() as $c ) {
		$name  = $c['label'][ $lang ] ?: $c['label']['vi'];
		$post  = get_posts( array( 'post_type' => 'hv_corridor', 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'hv_corridor_id', 'meta_value' => $c['id'], 'suppress_filters' => true ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		$img   = $post ? hv_card_image( $post[0], 'medium_large', '' ) : '';
		$route = $c['landing']['ab'] ? hv_route_find( $c['landing']['ab'] ) : null;
		$price = $route ? trim( preg_replace( '/^\s*Từ\s*/iu', '', (string) get_post_meta( $route->ID, 'hv_route_price', true ) ) ) : '';
		$time  = $route ? hv_route_time_label( get_post_meta( $route->ID, 'hv_route_time', true ) ) : '';
		$href  = $c['landing']['ab'] ? $prefix . '/xe-khach/' . $c['landing']['ab'] : hv_corridor_search_url( $c, 'ab' );
		$out  .= '<li class="hv-rcard"><div class="hv-rcard-img">' . $img . '</div><div class="hv-rcard-body"><h3>' . esc_html( $name ) . '</h3>'; // phpcs:ignore WordPress.Security.EscapeOutput
		if ( '' !== $time ) {
			$out .= '<p class="hv-rcard-time">' . hv_icon( 'clock', 'hv-ic--sm' ) . '<span class="hv-num">' . esc_html( $time ) . '</span></p>';
		}
		if ( '' !== $price ) {
			$out .= '<p class="hv-rcard-price"><small>' . esc_html( hv_t( 'from_price' ) ) . '</small> <strong class="hv-num">' . esc_html( $price ) . '</strong></p>';
		}
		$out .= '<a class="hv-btn hv-btn--sm hv-rcard-go" href="' . esc_url( $href ) . '" aria-label="' . esc_attr( sprintf( hv_t( 'book_route_aria' ), $name ) ) . '">' . esc_html( hv_t( 'booking_label' ) ) . '</a></div></li>';
	}
	return $out;
}

/**
 * Thẻ tuyến phổ biến. Không lọc: 4 tuyến chính (hv_corridor); chưa có tuyến chính nào thì rơi về CPT hv_route.
 * Có $filter (trang sân bay): luôn là CPT hv_route.
 *
 * @param int    $limit  Số thẻ tối đa.
 * @param string $filter Biểu thức chính quy (PCRE, không có dấu phân cách) lọc theo hv_route_path; rỗng = mọi tuyến.
 */
function hv_render_route_cards( $limit = 9, $filter = '' ) {
	if ( '' === $filter ) {
		$cards = hv_render_corridor_cards();
		if ( '' !== $cards ) {
			return $cards;
		}
	}
	$q = new WP_Query(
		array(
			'post_type'        => 'hv_route',
			'post_status'      => 'publish',
			'posts_per_page'   => '' !== $filter ? 50 : max( 1, min( 24, (int) $limit ) ),
			'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'no_found_rows'    => true,
			'suppress_filters' => true, // tuyến dùng chung cho vi/en.
			'meta_key'         => 'hv_route_path', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_compare'     => 'EXISTS',
		)
	);
	$prefix = hv_lang_prefix();
	$out    = '';
	while ( $q->have_posts() ) {
		$q->the_post();
		$id   = get_the_ID();
		$path = (string) get_post_meta( $id, 'hv_route_path', true );
		if ( ! hv_valid_route_path( $path ) || 'publish' !== get_post_status( $id ) || ( '' !== $filter && 1 !== preg_match( '#' . $filter . '#', $path ) ) ) {
			continue;
		}
		if ( substr_count( $out, '<li class="hv-rcard">' ) >= max( 1, (int) $limit ) ) {
			break;
		}
		$price = trim( preg_replace( '/^\s*Từ\s*/iu', '', (string) get_post_meta( $id, 'hv_route_price', true ) ) );
		$time  = hv_route_time_label( get_post_meta( $id, 'hv_route_time', true ) );
		$name  = hv_route_label( get_the_title() );
		$img   = hv_card_image( $id, 'medium_large', '' );
		$out  .= '<li class="hv-rcard"><div class="hv-rcard-img">' . $img . '</div><div class="hv-rcard-body"><h3>' . esc_html( $name ) . '</h3>'; // phpcs:ignore WordPress.Security.EscapeOutput
		if ( '' !== $time ) {
			$out .= '<p class="hv-rcard-time">' . hv_icon( 'clock', 'hv-ic--sm' ) . '<span class="hv-num">' . esc_html( $time ) . '</span></p>';
		}
		if ( '' !== $price ) {
			$out .= '<p class="hv-rcard-price"><small>' . esc_html( hv_t( 'from_price' ) ) . '</small> <strong class="hv-num">' . esc_html( $price ) . '</strong></p>';
		}
		$out .= '<a class="hv-btn hv-btn--sm hv-rcard-go" href="' . esc_url( $prefix . '/xe-khach/' . $path ) . '" aria-label="' . esc_attr( sprintf( hv_t( 'book_route_aria' ), $name ) ) . '">' . esc_html( hv_t( 'booking_label' ) ) . '</a></div></li>';
	}
	wp_reset_postdata();
	return $out;
}

/** Thẻ tuyến đi/đến sân bay: tuyến hv_route có đường dẫn chứa san-bay, tan-son-nhat hoặc noi-bai (chỉ tuyến có thật). */
function hv_render_airport_route_cards() {
	return hv_render_route_cards( 12, '(?:san-bay|tan-son-nhat|noi-bai)' );
}

/** Rail điểm đến: các điểm đến có ảnh đại diện. */
function hv_render_dest_rail( $limit = 10 ) {
	$q   = new WP_Query(
		array(
			'post_type'      => 'diem_den',
			'post_status'    => 'publish',
			'posts_per_page' => 30,
			'orderby'        => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'no_found_rows'  => true,
			'meta_key'       => '_thumbnail_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_compare'   => 'EXISTS',
		)
	);
	$out = '';
	$n   = 0;
	while ( $q->have_posts() && $n < $limit ) {
		$q->the_post();
		$out .= '<li class="hv-dcard"><a href="' . esc_url( get_permalink() ) . '">' . hv_card_image( get_the_ID(), 'medium', '' ) . '<span class="hv-dcard-name">' . esc_html( get_the_title() ) . '</span></a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
		++$n;
	}
	wp_reset_postdata();
	return $out;
}

/** 3 tin mới nhất (tin_tuc) có tiêu đề + ảnh đại diện. */
function hv_render_news_cards( $limit = 3 ) {
	$q   = new WP_Query(
		array(
			'post_type'      => 'tin_tuc',
			'post_status'    => 'publish',
			'posts_per_page' => (int) $limit,
			'orderby'        => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'no_found_rows'  => true,
		)
	);
	$out = '';
	while ( $q->have_posts() ) {
		$q->the_post();
		$out .= '<li class="hv-ncard"><a href="' . esc_url( get_permalink() ) . '"><span class="hv-ncard-img">' . hv_card_image( get_the_ID(), 'medium_large', '' ) . '</span><div class="hv-ncard-body"><h3>' . esc_html( get_the_title() ) . '</h3><span class="hv-ncard-more">' . esc_html( hv_t( 'read_more' ) ) . '</span></div></a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	wp_reset_postdata();
	return $out;
}

/** Mosaic phòng chờ (4 ảnh) + danh sách địa chỉ. */
function hv_render_rooms() {
	$s = hv_home_settings();
	echo '<div class="hv-mosaic">';
	for ( $n = 1; $n <= 4; $n++ ) {
		$img = hv_home_img( $s[ "mosaic_{$n}_img" ] );
		if ( '' === $img ) {
			continue;
		}
		echo '<figure class="hv-photo"><img src="' . esc_url( $img ) . '" width="815" height="544" loading="lazy" decoding="async" alt="' . esc_attr( hv_home_text( "mosaic_{$n}_alt" ) ) . '"></figure>';
	}
	echo '</div>';
	$lines = array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', hv_home_text( 'addresses' ) ) ?: array() ) );
	if ( $lines ) {
		echo '<ul class="hv-addrs">';
		foreach ( $lines as $line ) {
			$p = array_map( 'trim', explode( '|', $line, 2 ) );
			echo '<li class="hv-addr"><span class="hv-ico hv-ico--sm" aria-hidden="true">' . hv_icon( 'map-pin' ) . '</span><div><h3>' . esc_html( $p[0] ) . '</h3>' . ( isset( $p[1] ) && '' !== $p[1] ? '<p>' . esc_html( $p[1] ) . '</p>' : '' ) . '</div></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</ul>';
	}
}
