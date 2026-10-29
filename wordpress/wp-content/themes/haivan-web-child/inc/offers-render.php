<?php
/**
 * Ưu đãi hôm nay: truy vấn ưu đãi đang hiệu lực (xuất bản, trong lịch, theo "Thứ tự") và dựng rail thẻ màu.
 * Dữ liệu nhập: offers.php. Cùng dữ liệu được REST /haivan-web/v1/home dùng lại (home-rest.php).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array<int,array<string,mixed>> Ưu đãi đang hiệu lực, sắp theo Thứ tự.
 */
function hv_active_offers( $limit = 12 ) {
	$posts = get_posts(
		array(
			'post_type'        => 'hv_offer',
			'post_status'      => 'publish',
			'numberposts'      => max( 40, (int) $limit ),
			'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'suppress_filters' => true, // ưu đãi dùng chung cho vi/en.
		)
	);
	$out = array();
	foreach ( $posts as $p ) {
		$m = hv_offer_meta( $p->ID );
		if ( 'active' !== hv_schedule_state( $m['start'], $m['end'] ) || '' === $m['price'] ) {
			continue;
		}
		$m['id']    = $p->ID;
		$m['title'] = get_the_title( $p );
		$m['image'] = hv_media_or_url( get_post_thumbnail_id( $p->ID ), $m['image_url'], 'medium_large', 900, 600 );
		$out[]      = $m;
		if ( count( $out ) >= $limit ) {
			break;
		}
	}
	return $out;
}

/** HTML một thẻ ưu đãi (đã escape). */
function hv_offer_card_html( array $o ) {
	$link  = '' !== $o['link'] ? hv_link_for_lang( $o['link'] ) : '';
	$style = ( 'sale' === $o['badge_style'] && 'coral' !== $o['tone'] ) ? 'sale' : 'on-fill';
	$h     = '<li><article class="hv-pcard hv-tone-' . esc_attr( $o['tone'] ) . '"><h3>' . esc_html( $o['title'] ) . '</h3>';
	if ( '' !== $o['badge'] ) {
		$h .= '<span class="hv-badge hv-badge--' . esc_attr( $style ) . '">' . ( 'sale' === $style ? hv_icon( 'tag' ) : '' ) . esc_html( $o['badge'] ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	}
	$h .= '<p class="hv-pcard-price"><strong class="hv-num">' . esc_html( $o['price'] ) . '</strong>' . ( '' !== $o['unit'] ? '<small>' . esc_html( $o['unit'] ) . '</small>' : '' ) . '</p>';
	$h .= '' !== $o['cond'] ? '<p class="hv-pcard-cond">' . esc_html( $o['cond'] ) . '</p>' : '';
	$foot = '';
	if ( '' !== $link ) {
		$foot .= '<a class="hv-pcard-go" href="' . esc_url( $link ) . '" aria-label="' . esc_attr( trim( ( '' !== $o['cta'] ? $o['cta'] : hv_t( 'booking_label' ) ) . ': ' . $o['title'] ) ) . '">' . esc_html( '' !== $o['cta'] ? $o['cta'] : hv_t( 'booking_label' ) ) . hv_icon( 'chevron-right', 'hv-ic--sm' ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	}
	if ( $o['image'] ) {
		$foot .= '<div class="hv-pcard-photo"><img src="' . esc_url( $o['image']['url'] ) . '" width="' . (int) $o['image']['w'] . '" height="' . (int) $o['image']['h'] . '" loading="lazy" decoding="async" alt=""></div>';
	} elseif ( '' !== $o['icon'] ) {
		$foot .= '<span class="hv-ico hv-ico--sm" aria-hidden="true">' . hv_icon( $o['icon'] ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	}
	return $h . ( '' !== $foot ? '<div class="hv-pcard-foot">' . $foot . '</div>' : '' ) . '</article></li>';
}

/** Các thẻ ưu đãi (chuỗi <li>…); rỗng khi không có ưu đãi hiệu lực, để template ẩn cả khối. */
function hv_render_offer_cards() {
	return implode( '', array_map( 'hv_offer_card_html', hv_active_offers() ) );
}
