<?php
/**
 * Mục lục tự động cho bài điểm đến (bai_viet) và tin công ty (tin_tuc), cả vi và en:
 *  - gắn id ổn định, không trùng cho mọi h2/h3 trong thân bài (giữ id sẵn có; bỏ qua khối bắc cầu .hv-seo-bridge và .hv-context-*);
 *  - từ 3 tiêu đề trở lên: chèn hộp "Mục lục" ngay trước h2 đầu tiên (sau đoạn mở đầu); bài đã có hộp mục lục thì không chèn thêm;
 *  - cột phải (template-parts/side-posts.php) in lại cùng danh sách, dính khi cuộn ở khổ >= 64rem; JS (site.js) tô mục đang đọc.
 * Chạy lúc hiển thị, không sửa DB. CSS: assets/css/article.css.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Danh sách mục lục của bài đang hiển thị (đặt bởi bộ lọc the_content).
 *
 * @param array<int,array{id:string,text:string,level:int}>|null $set Đặt giá trị (null = chỉ đọc).
 * @return array<int,array{id:string,text:string,level:int}>
 */
function hv_toc_items( $set = null ) {
	static $items = array();
	if ( null !== $set ) {
		$items = $set;
	}
	return $items;
}

/** Slug không dấu từ chữ tiêu đề (đ -> d). */
function hv_toc_slug( $text ) {
	$s = strtolower( remove_accents( $text ) );
	$s = trim( (string) preg_replace( '/[^a-z0-9]+/', '-', $s ), '-' );
	return substr( $s, 0, 60 );
}

/** Danh sách lồng nhau: h2 là mục cha, h3 là mục con của h2 đứng trước. */
function hv_toc_list_html( array $items ) {
	$out  = '<ol class="hv-toc__list">';
	$open = false;
	foreach ( $items as $it ) {
		$link = '<a href="#' . esc_attr( $it['id'] ) . '">' . esc_html( $it['text'] ) . '</a>';
		if ( 3 === $it['level'] && $open ) {
			$out .= ( 'sub' === $open ? '' : '<ol>' ) . '<li>' . $link . '</li>';
			$open = 'sub';
			continue;
		}
		if ( $open ) {
			$out .= ( 'sub' === $open ? '</ol>' : '' ) . '</li>';
		}
		$out .= '<li>' . $link;
		$open = 'li';
	}
	if ( $open ) {
		$out .= ( 'sub' === $open ? '</ol>' : '' ) . '</li>';
	}
	return $out . '</ol>';
}

/**
 * Khối mục lục. $variant: 'inline' (trong bài) hoặc 'side' (cột phải).
 *
 * @param array<int,array{id:string,text:string,level:int}> $items Mục.
 */
function hv_toc_html( array $items, $variant = 'inline' ) {
	$label = hv_t( 'toc' );
	return '<nav class="hv-toc hv-toc--' . esc_attr( $variant ) . '" aria-label="' . esc_attr( $label ) . '" data-hv-toc><details class="hv-toc__box" open><summary>' . esc_html( $label ) . '</summary>' . hv_toc_list_html( $items ) . '</details></nav>';
}

/**
 * @param string $content HTML nội dung.
 * @return string
 */
function hv_add_toc( $content ) {
	if ( ! is_singular( array( 'bai_viet', 'tin_tuc' ) ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	hv_toc_items( array() );
	if ( false === stripos( $content, '<h' ) ) {
		return $content;
	}
	// Vùng bỏ qua: khối bắc cầu và đoạn liên kết đặt vé cuối bài.
	$skip = array();
	if ( preg_match_all( '#<div\b[^>]*\bhv-seo-bridge\b.*?</div>|<p\b[^>]*\bhv-context-[a-z]+\b.*?</p>#is', $content, $m, PREG_OFFSET_CAPTURE ) ) {
		foreach ( $m[0] as $hit ) {
			$skip[] = array( $hit[1], $hit[1] + strlen( $hit[0] ) );
		}
	}
	if ( ! preg_match_all( '#<(h[23])\b([^>]*)>(.*?)</\1>#is', $content, $heads, PREG_OFFSET_CAPTURE | PREG_SET_ORDER ) ) {
		return $content;
	}
	$used = array();
	if ( preg_match_all( '#\bid\s*=\s*(["\'])(.*?)\1#i', $content, $ids ) ) {
		$used = array_flip( $ids[2] );
	}
	$items = array();
	$out   = '';
	$pos   = 0;
	$first = null;
	foreach ( $heads as $h ) {
		list( $whole, $at ) = $h[0];
		foreach ( $skip as $range ) {
			if ( $at >= $range[0] && $at < $range[1] ) {
				continue 2;
			}
		}
		$text = trim( (string) preg_replace( '/\s+/u', ' ', html_entity_decode( wp_strip_all_tags( $h[3][0] ), ENT_QUOTES, 'UTF-8' ) ) );
		if ( '' === $text ) {
			continue;
		}
		$attrs = $h[2][0];
		if ( preg_match( '#\bid\s*=\s*(["\'])(.*?)\1#i', $attrs, $idm ) ) {
			$id = $idm[2];
		} else {
			$base = hv_toc_slug( $text );
			$base = '' !== $base ? $base : 'muc-' . ( count( $items ) + 1 );
			$id   = $base;
			for ( $n = 2; isset( $used[ $id ] ); $n++ ) {
				$id = $base . '-' . $n;
			}
			$used[ $id ] = true;
			$attrs      .= ' id="' . esc_attr( $id ) . '"';
		}
		$level   = 'h3' === strtolower( $h[1][0] ) ? 3 : 2;
		$items[] = array( 'id' => $id, 'text' => $text, 'level' => $level );
		$out    .= substr( $content, $pos, $at - $pos );
		if ( null === $first && 2 === $level ) {
			$first = strlen( $out ); // vị trí chèn hộp: ngay trước h2 đầu tiên.
		}
		$out .= '<' . $h[1][0] . $attrs . '>' . $h[3][0] . '</' . $h[1][0] . '>';
		$pos  = $at + strlen( $whole );
	}
	$out .= substr( $content, $pos );
	if ( count( $items ) < 3 || false !== strpos( $content, 'hv-toc' ) || false !== stripos( $content, 'ez-toc' ) ) {
		return $out; // ít tiêu đề, hoặc bài đã có mục lục riêng: chỉ gắn id.
	}
	hv_toc_items( $items );
	$box = hv_toc_html( $items, 'inline' );
	return null !== $first ? substr( $out, 0, $first ) . $box . substr( $out, $first ) : $box . $out;
}
// Sau hv_fix_entry_content (19), bọc bảng (20) và bỏ khối trống (21): tiêu đề đã ở dạng cuối cùng.
add_filter( 'the_content', 'hv_add_toc', 25 );
