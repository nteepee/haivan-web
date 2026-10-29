<?php
/**
 * Sửa lúc hiển thị cho nội dung nhập từ web cũ (không đụng vào DB, chạy lại trên production là xong):
 *  - <h1> trong thân bài thành <h2> (trang đã có đúng một H1 là tiêu đề bài);
 *  - bỏ ảnh dán từ host đã chết (Google Docs lhN.googleusercontent.com, Facebook scontent... và ...fna.fbcdn.net): chúng chỉ để lại khung trắng.
 * Ảnh hỏng khác (404 của host báo chí, tệp upload bị mất) do assets/js/site.js ẩn khi tải lỗi.
 * Khối trống: hv_strip_blank_blocks() (entry-tables.php). Ảnh méo, chữ dài tràn, bảng: assets/css/content.css.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Host ảnh đã chết (mẫu PCRE trên tên host viết thường). Thêm host qua filter hv_dead_image_hosts.
 *
 * @return string[]
 */
function hv_dead_image_host_patterns() {
	return (array) apply_filters(
		'hv_dead_image_hosts',
		array(
			'#^lh\d*\.googleusercontent\.com$#',
			'#^scontent[^/]*\.fbcdn\.net$#',
			'#\.fna\.fbcdn\.net$#',
		)
	);
}

/** URL ảnh thuộc host đã chết? */
function hv_is_dead_image_url( $url ) {
	$host = strtolower( (string) wp_parse_url( html_entity_decode( (string) $url, ENT_QUOTES, 'UTF-8' ), PHP_URL_HOST ) );
	if ( '' === $host ) {
		return false;
	}
	foreach ( hv_dead_image_host_patterns() as $re ) {
		if ( 1 === preg_match( $re, $host ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Bỏ thẻ <img> trỏ host chết và các khung bọc chỉ còn lại khoảng trống (<a>, <figure>).
 *
 * @param string $content HTML nội dung.
 * @return string
 */
function hv_strip_dead_images( $content ) {
	$removed = 0;
	$out     = preg_replace_callback(
		'#<img\b[^>]*>#i',
		static function ( $m ) use ( &$removed ) {
			if ( 1 === preg_match( '#\b(?:src|data-src)\s*=\s*(["\'])(.*?)\1#is', $m[0], $src ) && hv_is_dead_image_url( $src[2] ) ) {
				++$removed;
				return '';
			}
			return $m[0];
		},
		$content
	);
	if ( ! is_string( $out ) ) {
		return $content;
	}
	if ( $removed > 0 ) {
		$space = '(?:\s|&nbsp;|&#160;|\x{00A0})*';
		$out   = preg_replace( '#<a\b(?![^>]*\b(?:id|name)=)[^>]*>' . $space . '</a>#iu', '', $out );
		$out   = is_string( $out ) ? preg_replace( '#<figure\b[^>]*>' . $space . '(?:<figcaption\b[^>]*>' . $space . '</figcaption>)?' . $space . '</figure>#iu', '', $out ) : null;
	}
	return is_string( $out ) ? $out : $content;
}

/**
 * @param string $content HTML nội dung.
 * @return string
 */
function hv_fix_entry_content( $content ) {
	if ( ! is_singular() || ! in_the_loop() || ! is_main_query() || '' === $content ) {
		return $content;
	}
	if ( false !== stripos( $content, '<h1' ) ) {
		$content = (string) preg_replace( '#<(/?)h1\b#i', '<$1h2', $content );
	}
	if ( false !== stripos( $content, '<img' ) ) {
		$content = hv_strip_dead_images( $content );
	}
	return $content;
}
// Trước khi bọc bảng (20) và bỏ khối trống (21): ảnh bị bỏ có thể để lại đoạn rỗng.
add_filter( 'the_content', 'hv_fix_entry_content', 19 );
