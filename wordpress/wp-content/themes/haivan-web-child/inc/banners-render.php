<?php
/**
 * Banner trang chủ: truy vấn banner đang hiệu lực, dựng carousel (CSS scroll-snap, mũi tên + đếm "1/3" bằng JS nhỏ,
 * vẫn vuốt và cuộn được khi không có JS) và popup. Dữ liệu nhập: banners.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * URL ảnh trong thư viện Media -> đường dẫn tương đối (/wp-content/uploads/...), đúng cả ở /en/ (home_url() có tiền tố /en
 * nên hv_layout_img() không bỏ được host). Ảnh ngoài thư viện đi qua hv_layout_img().
 */
function hv_local_media_url( $url ) {
	$url  = (string) $url;
	$base = (string) wp_upload_dir()['baseurl'];
	if ( '' !== $base && 0 === strpos( $url, $base . '/' ) ) {
		return (string) wp_parse_url( $base, PHP_URL_PATH ) . substr( $url, strlen( $base ) );
	}
	return hv_layout_img( $url );
}

/** Ảnh từ ID media (kèm kích thước) hoặc URL /assets (kích thước mặc định); không có = null. */
function hv_media_or_url( $id, $url, $size, $w, $h ) {
	$img = (int) $id ? wp_get_attachment_image_src( (int) $id, $size ) : false;
	if ( $img ) {
		return array( 'url' => hv_local_media_url( $img[0] ), 'w' => (int) $img[1], 'h' => (int) $img[2] );
	}
	return '' !== $url ? array( 'url' => $url, 'w' => $w, 'h' => $h ) : null;
}

/**
 * Banner đang hiệu lực, đã sắp xếp. Banner ảnh không có ảnh nào bị bỏ; slide thiết kế sẵn phải có tiêu đề.
 *
 * @param string $type web|popup.
 * @return array<int,array<string,mixed>>
 */
function hv_active_banners( $type = 'web' ) {
	$posts = get_posts(
		array(
			'post_type'        => 'hv_banner',
			'post_status'      => 'publish',
			'numberposts'      => 20,
			'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'suppress_filters' => true,
		)
	);
	$out = array();
	foreach ( $posts as $p ) {
		$m = hv_banner_meta( $p->ID );
		if ( $m['type'] !== $type || 'active' !== hv_schedule_state( $m['start'], $m['end'] ) ) {
			continue;
		}
		$item = array(
			'id'          => $p->ID,
			'kind'        => $m['kind'],
			'title'       => get_the_title( $p ),
			'link'        => $m['link'],
			'mobile_show' => '1' === $m['mobile_show'],
		);
		if ( 'designed' === $m['kind'] && 'web' === $type ) {
			if ( '' === $m['headline'] ) {
				continue;
			}
			$item += array(
				'eyebrow'  => $m['eyebrow'],
				'headline' => $m['headline'],
				'sub'      => $m['sub'],
				'btn'      => $m['btn'],
				'tone'     => $m['tone'],
				'cutout'   => hv_media_or_url( $m['cutout_id'], $m['cutout_url'], 'large', 900, 356 ),
				'desktop'  => null,
				'mobile'   => null,
			);
		} else {
			$d_id = (int) get_post_thumbnail_id( $p->ID );
			$desk = hv_media_or_url( $d_id, hv_clean_link( $m['desktop_url'] ), 'full', 3334, 1156 );
			$mob  = hv_media_or_url( $m['mobile_id'], $m['mobile_url'], 'large', 1000, 540 );
			if ( ! $desk && ! $mob ) {
				continue;
			}
			$item['kind']    = 'image';
			$item['desktop'] = $desk;
			$item['mobile']  = $mob;
		}
		$out[] = $item;
	}
	return $out;
}

/** Thẻ <picture> của một banner ảnh. $first: ảnh đầu tiên không lazy, ưu tiên tải. */
function hv_banner_picture( array $b, $first ) {
	$main = $b['desktop'] ?: $b['mobile'];
	$attr = $first ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
	$html = '<picture>';
	if ( $b['desktop'] && $b['mobile'] ) {
		$html .= '<source media="(max-width: 39.9375em)" srcset="' . esc_url( $b['mobile']['url'] ) . '">';
	}
	$html .= '<img src="' . esc_url( $main['url'] ) . '" width="' . (int) $main['w'] . '" height="' . (int) $main['h'] . '" alt="' . esc_attr( $b['title'] ) . '" ' . $attr . '></picture>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $attr là hằng số.
	return $html;
}

/** Tiêu đề slide thiết kế sẵn: từ đầu tiên có chữ số (vd. "900.000đ") được bọc để phóng to. Đã escape. */
function hv_banner_headline_html( $headline ) {
	if ( 1 === preg_match( '/^(\S*\d\S*)(\s.*)?$/su', $headline, $m ) ) {
		return '<span class="hv-slide-big">' . esc_html( $m[1] ) . '</span>' . esc_html( $m[2] ?? '' );
	}
	return esc_html( $headline );
}

/** HTML một slide (ảnh poster hoặc thiết kế sẵn). */
function hv_banner_slide_html( array $b, $first ) {
	$link = '' !== $b['link'] ? hv_link_for_lang( $b['link'] ) : '';
	$tag  = '' !== $link ? 'a' : 'div';
	$href = '' !== $link ? ' href="' . esc_url( $link ) . '"' : '';
	if ( 'designed' !== $b['kind'] ) {
		$cls  = 'hv-slide' . ( ! $b['desktop'] ? ' hv-slide--phone' : '' );
		$main = $b['desktop'] ?: $b['mobile'];
		// Ảnh thật (tỉ lệ khung gần vuông hơn poster 3334:1156) phủ kín khung thay vì lọt thỏm; poster giữ nguyên "contain".
		if ( $main && $main['h'] > 0 && $main['w'] / $main['h'] < 2.2 ) {
			$cls .= ' hv-slide--photo';
		}
		return '<' . $tag . ' class="' . esc_attr( $cls ) . '"' . $href . '>' . hv_banner_picture( $b, $first ) . '</' . $tag . '>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	$cls   = 'hv-slide hv-slide--promo hv-tone-' . $b['tone'] . ( $b['cutout'] ? '' : ' hv-slide--noimg' );
	$label = '' !== $link ? ' aria-label="' . esc_attr( trim( $b['eyebrow'] . ', ' . $b['headline'] . ( '' !== $b['sub'] ? ', ' . $b['sub'] : '' ), ', ' ) ) . '"' : '';
	$html  = '<' . $tag . ' class="' . esc_attr( $cls ) . '"' . $href . $label . '><div class="hv-slide-copy">';
	$html .= '' !== $b['eyebrow'] ? '<span class="hv-badge hv-badge--on-fill">' . esc_html( $b['eyebrow'] ) . '</span>' : '';
	$html .= '<p class="hv-slide-title">' . hv_banner_headline_html( $b['headline'] ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput -- đã escape trong hv_banner_headline_html().
	$html .= '' !== $b['sub'] ? '<p class="hv-slide-sub">' . esc_html( $b['sub'] ) . '</p>' : '';
	$html .= '' !== $link && '' !== $b['btn'] ? '<span class="hv-btn hv-btn--ghost hv-slide-cta">' . esc_html( $b['btn'] ) . '</span>' : '';
	$html .= '</div>';
	if ( $b['cutout'] ) {
		$html .= '<img src="' . esc_url( $b['cutout']['url'] ) . '" width="' . (int) $b['cutout']['w'] . '" height="' . (int) $b['cutout']['h'] . '" alt="" ' . ( $first ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"' ) . '>'; // phpcs:ignore WordPress.Security.EscapeOutput -- thuộc tính hằng số.
	}
	return $html . '</' . $tag . '>';
}

/** Carousel banner. Trả chuỗi rỗng khi chưa có banner hiệu lực. */
function hv_render_banner_carousel() {
	$banners = hv_active_banners( 'web' );
	if ( ! $banners ) {
		return '';
	}
	$n = count( $banners );
	ob_start();
	echo '<div class="hv-hero-banner" role="region" aria-roledescription="carousel" aria-label="' . esc_attr( hv_t( 'banner_region' ) ) . '" data-hv-carousel>';
	echo '<div class="hv-slides" tabindex="0" data-hv-slides>';
	foreach ( $banners as $i => $b ) {
		echo hv_banner_slide_html( $b, 0 === $i ); // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv_banner_slide_html().
	}
	echo '</div>';
	if ( $n > 1 ) {
		echo '<button class="hv-slide-btn hv-slide-prev" type="button" data-hv-slide="-1" aria-label="' . esc_attr( hv_t( 'banner_prev' ) ) . '">' . hv_icon( 'chevron-left' ) . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="hv-slide-btn hv-slide-next" type="button" data-hv-slide="1" aria-label="' . esc_attr( hv_t( 'banner_next' ) ) . '">' . hv_icon( 'chevron-right' ) . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<p class="hv-slide-count" aria-hidden="true"><output data-hv-count>1</output>/' . (int) $n . '</p>';
	}
	echo '</div>';
	return (string) ob_get_clean();
}

/**
 * Popup đầu tiên đang hiệu lực: chỉ in <template> (ảnh chưa tải); home.js hiện sau khi trình duyệt rảnh,
 * 1 lần/24 giờ (cookie hv_popup_seen), không hiện trên điện thoại trừ khi banner bật "hiện trên điện thoại".
 */
function hv_render_popup_template() {
	$list = hv_active_banners( 'popup' );
	if ( ! $list ) {
		return '';
	}
	$b    = $list[0];
	$link = '' !== $b['link'] ? hv_link_for_lang( $b['link'] ) : '';
	$img  = hv_banner_picture( $b, 0 ); // ảnh nằm trong <template> nên chưa được tải cho tới khi JS hiện popup.
	ob_start();
	echo '<template id="hv-popup-tpl" data-mobile="' . ( $b['mobile_show'] ? '1' : '0' ) . '" data-id="' . (int) $b['id'] . '">';
	echo '<dialog class="hv-popup" aria-label="' . esc_attr( $b['title'] ) . '">';
	echo '' !== $link ? '<a class="hv-popup-link" href="' . esc_url( $link ) . '">' . $img . '</a>' : $img; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<form method="dialog"><button class="hv-popup-close" aria-label="' . esc_attr( hv_t( 'popup_close' ) ) . '">' . hv_icon( 'x' ) . '</button></form>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</dialog></template>';
	return (string) ob_get_clean();
}
