<?php
/**
 * Làm sạch nội dung nhập từ web cũ. WP-CLI không tự chạy kses (không có người dùng), nên mọi nội dung
 * script nhập vào DB phải đi qua các hàm này; sau đó MKT sửa trong admin vẫn bị kses lọc
 * (DISALLOW_UNFILTERED_HTML), khớp với nội dung đã nhập.
 *
 * Lựa chọn iframe: chỉ giữ iframe https tới
 *   - https://www.youtube.com/embed/<id> (và youtube-nocookie.com),
 *   - https://cms.haivan.com/api/cta/<số> (form CTA của tin cũ): được nhận rồi đổi thành shortcode [haivan_cta n="<số>"],
 * dựng lại từ đầu với thuộc tính cho phép + sandbox + lazy; mọi iframe khác bị bỏ. Lưu ý: khi MKT lưu lại
 * bài trong admin, kses của WP sẽ gỡ iframe (editor không có quyền unfiltered_html) - chủ ý.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

/** src iframe được phép. */
function hvs_iframe_src_allowed( $src ) {
	return 1 === preg_match(
		'#^https://(?:www\.youtube(?:-nocookie)?\.com/embed/[A-Za-z0-9_-]{6,20}|cms\.haivan\.com/api/cta/\d+)(?:\?[A-Za-z0-9=&_%.-]*)?$#',
		(string) $src
	);
}

/** Đọc một thuộc tính HTML từ chuỗi thẻ (không phân biệt hoa thường), '' nếu thiếu. */
function hvs_html_attr( $tag, $name ) {
	if ( preg_match( '/\s' . preg_quote( $name, '/' ) . '\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'>]+))/i', $tag, $m ) ) {
		return html_entity_decode( (string) ( $m[1] ?? '' ) . (string) ( $m[2] ?? '' ) . (string) ( $m[3] ?? '' ), ENT_QUOTES, 'UTF-8' );
	}
	return '';
}

/**
 * Làm sạch HTML nội dung: bỏ script/style/object/embed (kèm nội dung), iframe ngoài danh sách cho phép,
 * rồi wp_kses_post (gỡ thuộc tính on*, javascript:, form...).
 *
 * @param string $html HTML thô.
 * @return string HTML an toàn.
 */
function hvs_clean_html( $html ) {
	$html = (string) $html;
	if ( '' === $html ) {
		return '';
	}
	// Khối có nội dung thực thi/hiển thị lạ: bỏ cả nội dung (kses chỉ bỏ thẻ, để lại chữ bên trong).
	$html = preg_replace( '#<(script|style|object|embed|template|noscript|applet|form)\b[^>]*>.*?</\1\s*>#is', '', $html );
	$html = preg_replace( '#</?(?:script|style|object|embed|template|noscript|applet|meta|link|base)\b[^>]*>#i', '', $html );

	// iframe hợp lệ → token, dựng lại sau kses.
	$frames = array();
	$html   = preg_replace_callback(
		'#<iframe\b[^>]*>.*?</iframe\s*>|<iframe\b[^>]*/?>#is',
		static function ( $m ) use ( &$frames ) {
			$tag = $m[0];
			$src = trim( hvs_html_attr( $tag, 'src' ) );
			if ( ! hvs_iframe_src_allowed( $src ) ) {
				return '';
			}
			// Khung CTA của CMS cũ: bài nhập mới dùng shortcode của theme (không còn phụ thuộc cms.haivan.com/api/cta).
			if ( preg_match( '#^https://cms\.haivan\.com/api/cta/(\d+)#', $src, $cta ) ) {
				$frames[] = '[haivan_cta n="' . (int) $cta[1] . '"]';
				return 'HVIFRAMETOKEN' . ( count( $frames ) - 1 ) . 'X';
			}
			$attrs = array(
				'src'            => esc_url( $src, array( 'https' ) ),
				'title'          => sanitize_text_field( hvs_html_attr( $tag, 'title' ) ),
				'loading'        => 'lazy',
				'referrerpolicy' => 'strict-origin-when-cross-origin',
				'sandbox'        => 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
			);
			foreach ( array( 'width', 'height' ) as $dim ) {
				$v = hvs_html_attr( $tag, $dim );
				if ( preg_match( '/^\d{1,4}%?$/', $v ) ) {
					$attrs[ $dim ] = $v;
				}
			}
			$style = safecss_filter_attr( hvs_html_attr( $tag, 'style' ) );
			if ( '' !== $style ) {
				$attrs['style'] = $style;
			}
			$out = '<iframe';
			foreach ( $attrs as $k => $v ) {
				if ( '' === $v ) {
					continue;
				}
				$out .= ' ' . $k . '="' . esc_attr( $v ) . '"';
			}
			$frames[] = $out . ' allowfullscreen></iframe>';
			return 'HVIFRAMETOKEN' . ( count( $frames ) - 1 ) . 'X';
		},
		$html
	);

	$html = wp_kses_post( $html );

	foreach ( $frames as $i => $frame ) {
		$html = str_replace( 'HVIFRAMETOKEN' . $i . 'X', $frame, $html );
	}
	return $html;
}

/**
 * Văn bản thuần (tiêu đề, tóm tắt): giải mã thực thể, bỏ thẻ (kể cả nội dung script/style), gọn khoảng trắng.
 * Hiển thị luôn qua esc_html; lưu ở dạng thuần.
 *
 * @param string $text Chuỗi thô.
 */
function hvs_clean_text( $text ) {
	return trim( wp_strip_all_tags( html_entity_decode( (string) $text, ENT_QUOTES, 'UTF-8' ) ) );
}
