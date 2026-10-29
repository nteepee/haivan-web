<?php
/**
 * Trích nội dung chính từ HTML Next.js (SSG) của web cũ thành HTML sạch cho WordPress.
 * Bỏ header/footer/breadcrumb/menu trái, mọi thuộc tính style/class, ảnh placeholder (data:).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

const HVI_INLINE = array( 'a', 'b', 'strong', 'em', 'i', 'u', 'span', 'br', 'img', 'small', 'sup', 'sub', 'label', 'font' );
const HVI_BLOCK  = array( 'div', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'section', 'article', 'blockquote', 'main', 'aside', 'header', 'footer', 'figure', 'dl', 'dt', 'dd', 'pre' );
const HVI_SKIP   = array( 'script', 'style', 'noscript', 'svg', 'button', 'input', 'select', 'textarea', 'form', 'iframe', 'video', 'audio', 'canvas', 'link', 'meta', 'nav' );

/**
 * @param string $html     HTML đầy đủ của trang.
 * @param string $assets   Thư mục assets đã lưu (archive/old-site/assets) để nhận diện ảnh cục bộ.
 * @return array{title:string,seo_title:string,seo_desc:string,html:string,images:string[],hidden_h1:string}|null
 */
function hvi_extract_page( $html, $assets ) {
	$doc = new DOMDocument();
	$prev = libxml_use_internal_errors( true );
	$ok   = $doc->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_NOWARNING | LIBXML_NOERROR | LIBXML_COMPACT );
	libxml_clear_errors();
	libxml_use_internal_errors( $prev );
	if ( ! $ok ) {
		return null;
	}
	$xp = new DOMXPath( $doc );

	$out = array(
		'title'     => '',
		'seo_title' => '',
		'seo_desc'  => '',
		'html'      => '',
		'images'    => array(),
		'hidden_h1' => '',
	);
	$t = $xp->query( '//title' )->item( 0 );
	if ( $t ) {
		$out['seo_title'] = trim( $t->textContent );
	}
	$m = $xp->query( "//meta[@name='description']/@content" )->item( 0 );
	if ( $m ) {
		$out['seo_desc'] = trim( $m->nodeValue );
	}

	// #__next > div > [header, main, footer]
	$kids = $xp->query( "//*[@id='__next']/div/*" );
	if ( ! $kids || $kids->length < 2 ) {
		return null;
	}
	$main = $kids->item( 1 );
	$col  = $xp->query( ".//div[contains(concat(' ',normalize-space(@class),' '),' ant-col-md-18 ')]", $main )->item( 0 );
	$root = $col ? $col : $main;

	// Breadcrumb: cha của liên kết "Trang chủ".
	foreach ( iterator_to_array( $xp->query( ".//a[@href='/']", $root ) ) as $a ) {
		if ( 'Trang chủ' === trim( $a->textContent ) && $a->parentNode && $a->parentNode !== $root && mb_strlen( trim( $a->parentNode->textContent ) ) < 200 ) {
			$a->parentNode->parentNode->removeChild( $a->parentNode );
		}
	}

	$h1 = $xp->query( './/h1', $root )->item( 0 );
	if ( $h1 ) {
		$out['hidden_h1'] = trim( $h1->textContent );
	}

	$images       = array();
	$out['html']  = hvi_clean( hvi_children( $root, $assets, $images ) );
	$out['images'] = $images;
	$out['title'] = $out['hidden_h1'];
	return $out;
}

/** Style có display:none (phần tử ẩn, ví dụ h1 tiêu đề trang). */
function hvi_hidden( DOMElement $el ) {
	return (bool) preg_match( '/display\s*:\s*none/i', $el->getAttribute( 'style' ) );
}

/**
 * Chuyển các con của $node thành HTML, gom chuỗi inline rời thành <p>.
 *
 * @param string[] $images Danh sách ảnh cục bộ tìm thấy (tham chiếu).
 */
function hvi_children( DOMNode $node, $assets, array &$images ) {
	$out    = '';
	$inline = '';
	$flush  = static function () use ( &$out, &$inline ) {
		if ( '' !== trim( wp_strip_all_tags( $inline, false ) ) || false !== strpos( $inline, '<img' ) ) {
			$out .= '<p>' . trim( $inline ) . '</p>';
		}
		$inline = '';
	};
	foreach ( $node->childNodes as $c ) {
		if ( XML_TEXT_NODE === $c->nodeType ) {
			$inline .= esc_html( preg_replace( '/\s+/u', ' ', $c->nodeValue ) );
			continue;
		}
		if ( XML_ELEMENT_NODE !== $c->nodeType ) {
			continue;
		}
		/** @var DOMElement $c */
		$tag = strtolower( $c->tagName );
		if ( in_array( $tag, HVI_SKIP, true ) || hvi_hidden( $c ) ) {
			continue;
		}
		if ( in_array( $tag, HVI_INLINE, true ) ) {
			$inline .= hvi_inline( $c, $assets, $images );
			continue;
		}
		// Khối.
		$flush();
		$out .= hvi_block( $c, $tag, $assets, $images );
	}
	$flush();
	return $out;
}

function hvi_inline( DOMElement $el, $assets, array &$images ) {
	$tag = strtolower( $el->tagName );
	if ( 'br' === $tag ) {
		return '<br>';
	}
	if ( 'img' === $tag ) {
		return hvi_img( $el, $assets, $images );
	}
	$inner = '';
	foreach ( $el->childNodes as $c ) {
		if ( XML_TEXT_NODE === $c->nodeType ) {
			$inner .= esc_html( preg_replace( '/\s+/u', ' ', $c->nodeValue ) );
		} elseif ( XML_ELEMENT_NODE === $c->nodeType ) {
			$ctag = strtolower( $c->tagName );
			if ( in_array( $ctag, HVI_SKIP, true ) || hvi_hidden( $c ) ) {
				continue;
			}
			// Khối lồng trong thẻ inline (vd. <a><div>..</div></a>): lấy nội dung phẳng.
			$inner .= in_array( $ctag, HVI_BLOCK, true ) ? ' ' . hvi_flat_text( $c ) . ' ' : hvi_inline( $c, $assets, $images );
		}
	}
	if ( '' === trim( $inner ) ) {
		return '';
	}
	switch ( $tag ) {
		case 'a':
			$href = trim( $el->getAttribute( 'href' ) );
			if ( '' === $href || 0 === stripos( $href, 'javascript:' ) ) {
				return $inner;
			}
			return '<a href="' . esc_url( $href ) . '">' . $inner . '</a>';
		case 'b':
		case 'strong':
			return '<strong>' . $inner . '</strong>';
		case 'em':
		case 'i':
			return '<em>' . $inner . '</em>';
		case 'u':
		case 'sup':
		case 'sub':
			return '<' . $tag . '>' . $inner . '</' . $tag . '>';
		default:
			return $inner;
	}
}

function hvi_flat_text( DOMNode $n ) {
	return esc_html( trim( preg_replace( '/\s+/u', ' ', $n->textContent ) ) );
}

function hvi_img( DOMElement $el, $assets, array &$images ) {
	$src = trim( $el->getAttribute( 'src' ) );
	if ( '' === $src || 0 === strpos( $src, 'data:' ) ) {
		return '';
	}
	// next/image: /_next/image?url=%2Fassets%2F...&w=..
	if ( false !== strpos( $src, '/_next/image' ) ) {
		parse_str( (string) wp_parse_url( $src, PHP_URL_QUERY ), $q );
		$src = isset( $q['url'] ) ? (string) $q['url'] : $src;
	}
	if ( false !== strpos( $src, '/icons/' ) || false !== strpos( $src, 'aria-hidden' ) || 'presentation' === $el->getAttribute( 'role' ) ) {
		return ''; // biểu tượng giao diện, không phải nội dung.
	}
	$alt = trim( $el->getAttribute( 'alt' ) );
	if ( 0 === strpos( $src, '/assets/' ) ) {
		$file = rtrim( $assets, '/' ) . '/' . ltrim( substr( $src, strlen( '/assets/' ) ), '/' );
		if ( is_file( $file ) ) {
			$images[] = $file;
			return '<img src="hv-local:' . esc_attr( $file ) . '" alt="' . esc_attr( $alt ) . '">';
		}
		return '';
	}
	if ( preg_match( '#^https?://(?:cms\.)?haivan\.com/#i', $src ) ) {
		return '<img src="' . esc_url( $src ) . '" alt="' . esc_attr( $alt ) . '">';
	}
	return '';
}

function hvi_block( DOMElement $el, $tag, $assets, array &$images ) {
	switch ( $tag ) {
		case 'h1':
			return ''; // tiêu đề trang do post_title.
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			$t = trim( preg_replace( '/\s+/u', ' ', $el->textContent ) );
			return '' === $t ? '' : '<' . $tag . '>' . esc_html( $t ) . '</' . $tag . '>';
		case 'ul':
		case 'ol':
			$items = '';
			foreach ( $el->childNodes as $li ) {
				if ( XML_ELEMENT_NODE === $li->nodeType && 'li' === strtolower( $li->tagName ) ) {
					$inner = hvi_children( $li, $assets, $images );
					$inner = preg_replace( '#^<p>(.*)</p>$#s', '$1', $inner ); // li một đoạn: bỏ <p>.
					if ( '' !== trim( wp_strip_all_tags( $inner ) ) ) {
						$items .= '<li>' . $inner . '</li>';
					}
				}
			}
			return '' === $items ? '' : "<$tag>$items</$tag>";
		case 'table':
			$inner = hvi_children( $el, $assets, $images );
			return '' === $inner ? '' : '<table>' . $inner . '</table>';
		case 'thead':
		case 'tbody':
		case 'tfoot':
		case 'tr':
		case 'td':
		case 'th':
			$inner = hvi_children( $el, $assets, $images );
			if ( 'td' === $tag || 'th' === $tag ) {
				$inner = preg_replace( '#^<p>(.*)</p>$#s', '$1', $inner );
			}
			return '' === trim( wp_strip_all_tags( $inner ) ) && false === strpos( $inner, '<img' ) ? '' : "<$tag>$inner</$tag>";
		case 'blockquote':
			$inner = hvi_children( $el, $assets, $images );
			return '' === $inner ? '' : '<blockquote>' . $inner . '</blockquote>';
		default: // div, section, p, ...
			return hvi_children( $el, $assets, $images );
	}
}

/** Dọn đoạn rỗng/trùng lặp. */
function hvi_clean( $html ) {
	$html = preg_replace( '#<p>\s*</p>#u', '', $html );
	$html = preg_replace( '#(<br>\s*){3,}#', '<br><br>', $html );
	$html = preg_replace( '/[ \t]+/u', ' ', $html );
	return trim( $html );
}
