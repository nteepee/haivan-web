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
 * Thẻ ưu đãi v2 (trang chủ khối 05 và trang /uu-dai dùng chung). $variant: 'dark' = trên nền than (mọi thẻ như nhau, không thẻ nào nổi bật kẻo trông như đang được chọn),
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
		$h   .= '<li class="hv2-offer" data-group="' . esc_attr( hv2_offer_group( $o ) ?: 'chung' ) . '">';
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

/** OA Zalo theo vùng: 'nam' = Hải Vân (Sài Gòn, Vũng Tàu), 'bac' = Hải Vân Xuân Tráng (Hà Nội, Tây Bắc). */
function hv2_zalo_urls() {
	return array(
		'nam' => 'https://zalo.me/708526450733753395',
		'bac' => 'https://zalo.me/haivanxuantrang',
	);
}

/**
 * Form nhận báo giá qua Zalo (dùng chung cho Xe hợp đồng, Gửi hàng…). Không lưu dữ liệu: v2.js ghép các ô thành tin
 * nhắn, chép vào bộ nhớ tạm rồi mở OA Zalo đúng vùng (lựa chọn mang data-zalo="bac|nam"); không có JS thì nút vẫn mở Zalo.
 *
 * @param string $id     Id form.
 * @param array  $fields Mỗi ô: ['key','label','type' (chips|select|text|tel|date|number), 'options' => [[nhãn, vùng|''],…], 'placeholder'].
 * @param array  $o      'prefix' (câu mở đầu tin nhắn), 'submit', 'note', 'copied' (báo đã chép), 'zalo' ('nam'|'bac' mặc định).
 */
function hv2_zalo_lead( $id, array $fields, array $o ) {
	$urls = hv2_zalo_urls();
	$def  = isset( $urls[ $o['zalo'] ?? '' ] ) ? $o['zalo'] : 'nam';
	list( $hot, $tel ) = hv2_hotline();
	echo '<form class="hv2-leadform" id="' . esc_attr( $id ) . '" action="' . esc_url( $urls[ $def ] ) . '" method="get" target="_blank" data-hv2-lead data-zalo-nam="' . esc_url( $urls['nam'] ) . '" data-zalo-bac="' . esc_url( $urls['bac'] ) . '" data-zalo="' . esc_attr( $def ) . '" data-prefix="' . esc_attr( $o['prefix'] ) . '" data-copied="' . esc_attr( $o['copied'] ) . '" data-fail="' . esc_attr( 'en' === hv_lang() ? 'Could not copy automatically. Copy the message below and paste it into Zalo.' : 'Chưa chép tự động được. Bạn chép đoạn tin nhắn bên dưới rồi dán vào Zalo nhé.' ) . '">';
	foreach ( $fields as $n => $f ) {
		$fid = $id . '-' . $f['key'];
		$req = ! empty( $f['required'] ) ? ' required' : '';
		if ( 'chips' === $f['type'] ) {
			echo '<fieldset class="hv2-leadform-field hv2-leadform-field--wide"><legend>' . esc_html( $f['label'] ) . '</legend><div class="hv2-chips">';
			foreach ( $f['options'] as $k => $opt ) {
				echo '<label class="hv2-chip"><input type="radio" name="' . esc_attr( $fid ) . '" value="' . esc_attr( $opt[0] ) . '"' . ( '' !== ( $opt[1] ?? '' ) ? ' data-zalo="' . esc_attr( $opt[1] ) . '"' : '' ) . ( 0 === $k ? ' checked' : '' ) . ' data-label="' . esc_attr( $f['label'] ) . '"><span>' . esc_html( $opt[0] ) . '</span></label>';
			}
			echo '</div></fieldset>';
			continue;
		}
		echo '<div class="hv2-leadform-field' . ( ! empty( $f['wide'] ) ? ' hv2-leadform-field--wide' : '' ) . '"><label for="' . esc_attr( $fid ) . '">' . esc_html( $f['label'] ) . '</label>';
		if ( 'select' === $f['type'] ) {
			echo '<select id="' . esc_attr( $fid ) . '" data-label="' . esc_attr( $f['label'] ) . '">';
			foreach ( $f['options'] as $opt ) {
				echo '<option value="' . esc_attr( $opt[0] ) . '"' . ( '' !== ( $opt[1] ?? '' ) ? ' data-zalo="' . esc_attr( $opt[1] ) . '"' : '' ) . '>' . esc_html( $opt[0] ) . '</option>';
			}
			echo '</select>';
		} else {
			$type = in_array( $f['type'], array( 'tel', 'date', 'number' ), true ) ? $f['type'] : 'text';
			echo '<input id="' . esc_attr( $fid ) . '" type="' . esc_attr( $type ) . '" data-label="' . esc_attr( $f['label'] ) . '"' . ( 'number' === $type ? ' min="1" inputmode="numeric"' : '' ) . ( 'tel' === $type ? ' autocomplete="tel" inputmode="tel"' : '' ) . ' placeholder="' . esc_attr( $f['placeholder'] ?? '' ) . '"' . $req . '>';
		}
		echo '</div>';
	}
	echo '<div class="hv2-leadform-foot"><button class="hv2-btn hv2-btn--yellow" type="submit">' . esc_html( $o['submit'] ) . '</button>';
	echo '<a class="hv2-textlink" href="' . esc_url( $tel ) . '">' . esc_html( $hot ) . '<span aria-hidden="true">↗</span></a></div>';
	echo '<p class="hv2-leadform-note" role="status" aria-live="polite">' . esc_html( $o['note'] ) . '</p>';
	echo '<textarea class="hv2-leadform-copy" rows="6" readonly hidden aria-label="' . esc_attr( 'en' === hv_lang() ? 'Message to paste into Zalo' : 'Tin nhắn để dán vào Zalo' ) . '"></textarea></form>';
}

/** Mọi trang WP mang lớp .hv2: biến, reset và thành phần của v2.css áp chung (trang chủ chỉ thêm home-v2.css). */
add_filter(
	'body_class',
	static function ( $classes ) {
		$classes[] = 'hv2';
		return $classes;
	}
);
