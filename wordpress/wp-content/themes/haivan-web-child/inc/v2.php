<?php
/**
 * Design system v2 dùng chung cho mọi template (tinh thần "Tử tế từ Tâm – Chu đáo từ Hành"): một bộ thành phần,
 * một bộ biến (assets/css/v2.css). Đổi ở đây là đổi trên mọi trang. Chữ riêng của trang chủ: inc/home-v2.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** URL ảnh trong assets/img/v2. */
function hv2_img( $name ) {
	return HV_WEB_URI . '/assets/img/v2/' . $name;
}

/** <img> ảnh v2 có kích thước thật (lấy từ file) để không nhảy layout. */
function hv2_img_tag( $name, $alt, $attrs = '' ) {
	static $dims = array();
	if ( ! isset( $dims[ $name ] ) ) {
		$size           = @getimagesize( HV_WEB_DIR . '/assets/img/v2/' . $name ); // phpcs:ignore WordPress.PHP.NoSilencedErrors -- thiếu file thì bỏ kích thước.
		$dims[ $name ] = $size ? array( (int) $size[0], (int) $size[1] ) : array( 0, 0 );
	}
	list( $w, $h ) = $dims[ $name ];
	$wh = $w ? ' width="' . $w . '" height="' . $h . '"' : '';
	return '<img src="' . esc_url( hv2_img( $name ) ) . '"' . $wh . ' alt="' . esc_attr( $alt ) . '" ' . ( '' !== $attrs ? $attrs : 'loading="lazy" decoding="async"' ) . '>';
}

/** Đầu khối: dòng số thứ tự + H2 hai vế (vế sau tô vàng). */
function hv2_head( $no, $id, $eyebrow, $a, $b, $tail = '' ) {
	echo '<div class="hv2-head"><div><p class="hv2-eyebrow">' . ( '' !== $no ? '<span>' . esc_html( $no ) . '</span>' : '' ) . esc_html( $eyebrow ) . '</p>';
	echo '<h2 id="' . esc_attr( $id ) . '">' . esc_html( $a ) . ' <em>' . esc_html( $b ) . '</em></h2></div>';
	echo $tail; // phpcs:ignore WordPress.Security.EscapeOutput -- $tail dựng và escape tại chỗ gọi.
	echo '</div>';
}

/** Liên kết chữ có mũi tên (dùng ở đầu khối). */
function hv2_link( $href, $label ) {
	return '<a class="hv2-textlink" href="' . esc_url( $href ) . '">' . esc_html( $label ) . '<span aria-hidden="true">↗</span></a>';
}

/** Hotline hiển thị + href tel:. */
function hv2_hotline() {
	$h = (string) hv_layout_settings()['hotline'];
	$h = '' !== $h ? $h : '1900 6763';
	return array( $h, 'tel:' . preg_replace( '/\D+/', '', $h ) );
}

/** Tiêu đề tin: bỏ emoji, câu viết hoa toàn bộ thì đưa về chữ thường (giữ tên riêng hay gặp). */
function hv2_clean_title( $t ) {
	$t = trim( (string) preg_replace( '/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}\x{200D}]/u', '', html_entity_decode( (string) $t, ENT_QUOTES, 'UTF-8' ) ) );
	$letters = preg_replace( '/[^\p{L}]/u', '', $t );
	if ( '' !== $letters && mb_strtoupper( $letters, 'UTF-8' ) === $letters ) {
		$t = mb_strtolower( $t, 'UTF-8' );
		$t = mb_strtoupper( mb_substr( $t, 0, 1, 'UTF-8' ), 'UTF-8' ) . mb_substr( $t, 1, null, 'UTF-8' );
		foreach ( array( 'hải vân', 'haivan', 'havaz', 'việt nam', 'hà nội', 'sài gòn', 'vũng tàu', 'điện biên', 'sơn la', 'mộc châu', 'tân sơn nhất', 'long thành', 'phú quốc', 'tết' ) as $name ) {
			$t = preg_replace_callback( '/(?<!\p{L})' . preg_quote( $name, '/' ) . '(?!\p{L})/iu', static fn( $m ) => in_array( $name, array( 'haivan', 'havaz' ), true ) ? mb_strtoupper( $m[0], 'UTF-8' ) : mb_convert_case( $m[0], MB_CASE_TITLE, 'UTF-8' ), $t );
		}
	}
	return trim( preg_replace( '/\s+/u', ' ', $t ) );
}

/**
 * Nhãn mục cho dòng số thứ tự trên đầu trang: trang con lấy tên trang cha (Chúng tôi, Dịch vụ…), lưu trữ lấy tên loại.
 */
function hv2_section_label( array $trail = array() ) {
	if ( count( $trail ) > 2 ) {
		return (string) $trail[1][0];
	}
	if ( is_post_type_archive( 'uu_dai' ) ) {
		return hv_t( 'offers_title' );
	}
	if ( is_search() ) {
		return 'en' === hv_lang() ? 'Search' : 'Tìm kiếm';
	}
	return 'en' === hv_lang() ? 'Hai Van' : 'Hải Vân';
}

/**
 * Đầu trang nội dung theo bản mẫu: dòng nhãn mục (chỉ trang kể chuyện nhiều khối mới đánh số, truyền $no = '01'), H1 lớn nét mảnh, đoạn dẫn (tuỳ chọn), rồi ảnh/phần thêm (HTML đã escape).
 * Mọi template (page, lưu trữ, tìm kiếm, ưu đãi, sân bay, 404) dùng chung hàm này để giữ một kiểu. $title_b = vế sau tô vàng.
 */
function hv2_page_head( $label, $title, $lead = '', $after = '', $title_b = '', $no = '' ) {
	echo '<header class="hv2-page-head"><p class="hv2-eyebrow">' . ( '' !== $no ? '<span>' . esc_html( $no ) . '</span>' : '' ) . esc_html( $label ) . '</p>';
	echo '<h1>' . esc_html( $title ) . ( '' !== $title_b ? ' <em>' . esc_html( $title_b ) . '</em>' : '' ) . '</h1>';
	if ( '' !== trim( (string) $lead ) ) {
		echo '<p class="hv2-page-lead">' . esc_html( $lead ) . '</p>';
	}
	echo $after; // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape tại chỗ gọi.
	echo '</header>';
}

/** Nhóm tuyến của một ưu đãi theo đường dẫn đặt vé (khớp landing hai chiều của tuyến chính); '' = ưu đãi chung. */
function hv2_offer_group( array $o ) {
	foreach ( hv_corridors_enabled() as $c ) {
		foreach ( array( 'ab', 'ba' ) as $d ) {
			if ( $c['landing'][ $d ] && false !== strpos( (string) $o['link'], '/xe-khach/' . $c['landing'][ $d ] ) ) {
				return $c['id'];
			}
		}
	}
	return '';
}

/**
 * Thẻ ưu đãi v2 (trang chủ khối 05 và trang /uu-dai dùng chung). $variant: 'dark' = trên nền than (thẻ đầu vàng),
 * 'light' = trên nền giấy (thẻ trắng vạch vàng, có ngày kết thúc và nhóm tuyến để lọc). Rỗng = ''.
 */
function hv2_offer_cards( array $offers, $variant = 'dark', $until = '' ) {
	if ( ! $offers ) {
		return '';
	}
	$h = '<ul class="hv2-offers hv2-offers--' . esc_attr( $variant ) . '">';
	foreach ( $offers as $i => $o ) {
		$link = '' !== $o['link'] ? hv_link_for_lang( $o['link'] ) : '';
		$cta  = '' !== $o['cta'] ? $o['cta'] : hv_t( 'booking_label' );
		$h   .= '<li class="hv2-offer' . ( 0 === $i && 'dark' === $variant ? ' hv2-offer--lead' : '' ) . '" data-group="' . esc_attr( hv2_offer_group( $o ) ?: 'chung' ) . '">';
		if ( 'light' === $variant && ! empty( $o['image']['url'] ) ) {
			$h .= '<span class="hv2-offer-img"><img src="' . esc_url( $o['image']['url'] ) . '" width="' . (int) $o['image']['w'] . '" height="' . (int) $o['image']['h'] . '" loading="lazy" decoding="async" alt=""></span>';
		}
		$h .= '' !== $o['badge'] ? '<span class="hv2-offer-tag">' . esc_html( $o['badge'] ) . '</span>' : '';
		$h .= '<h3>' . esc_html( $o['title'] ) . '</h3><p class="hv2-offer-price"><strong>' . esc_html( $o['price'] ) . '</strong>' . ( '' !== $o['unit'] ? ' <small>' . esc_html( $o['unit'] ) . '</small>' : '' ) . '</p>';
		$h .= '' !== $o['cond'] ? '<p class="hv2-offer-cond">' . esc_html( $o['cond'] ) . '</p>' : '';
		if ( '' !== $until && '' !== $o['end'] && false !== strtotime( $o['end'] ) ) {
			$h .= '<p class="hv2-offer-end">' . esc_html( $until . ' ' . wp_date( 'd/m/Y', strtotime( $o['end'] ) ) ) . '</p>';
		}
		$h .= '' !== $link ? '<a class="hv2-offer-go" href="' . esc_url( $link ) . '" aria-label="' . esc_attr( $cta . ': ' . $o['title'] ) . '">' . esc_html( $cta ) . ' <span aria-hidden="true">→</span></a>' : '';
		$h .= '</li>';
	}
	return $h . '</ul>';
}

/** Hàng tab "cùng mục" dưới đầu trang (Giới thiệu và mọi trang nội dung dùng chung). $nav = hv_page_subnav(). */
function hv2_subnav_tabs( array $nav ) {
	if ( ! $nav ) {
		return;
	}
	echo '<nav class="hv2-tabs" aria-label="' . esc_attr( hv_t( 'subnav' ) ) . '"><ul class="hv-subnav">';
	foreach ( $nav as $i ) {
		echo '<li><a href="' . esc_url( $i[1] ) . '"' . ( $i[2] ? ' aria-current="page"' : '' ) . '>' . esc_html( $i[0] ) . '</a></li>';
	}
	echo '</ul></nav>';
}

/** Mọi trang WP mang lớp .hv2: biến, reset và thành phần của v2.css áp chung (trang chủ chỉ thêm home-v2.css). */
add_filter(
	'body_class',
	static function ( $classes ) {
		$classes[] = 'hv2';
		return $classes;
	}
);
