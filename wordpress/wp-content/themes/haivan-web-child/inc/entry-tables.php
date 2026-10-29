<?php
/**
 * Bảng trong nội dung biên tập (trang, tin, bài): bọc khung cuộn ngang (tabindex=0, role=region, aria-label) để dùng được bằng
 * bàn phím và điện thoại, và gắn scope cho ô tiêu đề (<th>). Không đụng vào dữ liệu lưu trong DB: chỉ chạy lúc hiển thị.
 * CSS: assets/css/content.css (.hv-table-wrap), JS mờ mép: assets/js/site.js.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Nhãn của bảng: <caption>, hoặc tiêu đề/đoạn ngắn đứng ngay trước bảng, hoặc nhãn chung.
 *
 * @param string $table  HTML của <table>.
 * @param string $before HTML đứng trước bảng.
 */
function hv_table_label( $table, $before ) {
	$text = '';
	if ( preg_match( '#<caption[^>]*>(.*?)</caption>#is', $table, $m ) ) {
		$text = $m[1];
	} elseif ( preg_match( '#<(h[1-6]|p)[^>]*>((?:(?!</\1>).)*)</\1>\s*$#is', $before, $m ) ) {
		$text = $m[2];
	}
	$text = trim( (string) preg_replace( '/\s+/u', ' ', wp_strip_all_tags( $text ) ) );
	if ( '' === $text || mb_strlen( $text ) > 100 ) {
		return hv_t( 'table_label' );
	}
	return $text;
}

/**
 * Gắn scope cho <th> chưa có: hàng đầu = col, các hàng sau = row.
 *
 * @param string $table HTML của <table>.
 */
function hv_table_scopes( $table ) {
	$row = -1;
	return (string) preg_replace_callback(
		'#<tr\b[^>]*>.*?</tr>#is',
		static function ( $m ) use ( &$row ) {
			++$row;
			$scope = 0 === $row ? 'col' : 'row';
			return preg_replace( '#<th\b(?![^>]*\bscope=)#i', '<th scope="' . $scope . '"', $m[0] );
		},
		$table
	);
}

/**
 * @param string $content HTML nội dung.
 * @return string
 */
function hv_wrap_entry_tables( $content ) {
	if ( ! is_singular() || ! in_the_loop() || ! is_main_query() || false === stripos( $content, '<table' ) ) {
		return $content;
	}
	$out = '';
	$pos = 0;
	if ( ! preg_match_all( '#<table\b.*?</table>#is', $content, $all, PREG_OFFSET_CAPTURE ) ) {
		return $content;
	}
	foreach ( $all[0] as $hit ) {
		list( $table, $at ) = $hit;
		$before = substr( $content, 0, $at );
		$out   .= substr( $content, $pos, $at - $pos );
		$pos    = $at + strlen( $table );
		// Đã bọc rồi (MKT tự dựng khung) thì để nguyên.
		if ( 1 === preg_match( '#class="[^"]*hv-table-scroll[^"]*"[^>]*>\s*$#i', $before ) ) {
			$out .= $table;
			continue;
		}
		$out .= '<div class="hv-table-wrap"><div class="hv-table-scroll" tabindex="0" role="region" aria-label="' . esc_attr( hv_table_label( $table, substr( $before, -800 ) ) ) . '">' . hv_table_scopes( $table ) . '</div></div>';
	}
	return $out . substr( $content, $pos );
}
add_filter( 'the_content', 'hv_wrap_entry_tables', 20 );

/**
 * Bỏ khối trống do nhập nội dung cũ để lại (đoạn rỗng, đoạn chỉ có &nbsp;/<br>, chuỗi <br> liên tiếp): chúng chỉ tạo
 * khoảng trắng thừa giữa các khối; tiêu đề rỗng chỉ làm hỏng dàn ý. Chỉ chạy lúc hiển thị, không sửa DB; khối có class/id/role (khối của theme, vd. vùng trạng thái) được giữ.
 *
 * @param string $content HTML nội dung.
 * @return string
 */
function hv_strip_blank_blocks( $content ) {
	if ( ! is_singular() || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	// Khối chỉ chứa khoảng trắng/&nbsp;/<br>/ký tự rộng 0 sau khi bóc thẻ (kể cả span lồng nhau) và không có ảnh/khung nhúng/liên kết/bảng.
	$out = preg_replace_callback(
		'#<(p|h[1-6])(?![^>]*\b(?:class|id|role)=)\b[^>]*>(.*?)</\1>#isu',
		static function ( $m ) {
			if ( preg_match( '#<(?:img|picture|svg|iframe|video|audio|canvas|object|embed|input|button|table|a)\b#i', $m[2] ) ) {
				return $m[0];
			}
			$text = preg_replace( '/[\s\x{00A0}\x{200B}-\x{200D}\x{FEFF}]+/u', '', html_entity_decode( wp_strip_all_tags( $m[2] ), ENT_QUOTES, 'UTF-8' ) );
			return '' === $text ? '' : $m[0];
		},
		$content
	);
	$out = is_string( $out ) ? preg_replace( '#(?:<br\s*/?>\s*){2,}#i', '<br>', $out ) : null;
	return is_string( $out ) ? $out : $content;
}
add_filter( 'the_content', 'hv_strip_blank_blocks', 21 );
