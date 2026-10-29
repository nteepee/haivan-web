<?php
/**
 * Tách nội dung HTML thành khối cấp cao nhất và bỏ khối lặp liền kề (dùng bởi content-dedupe.php và content-merge.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/content-tools.php';

/**
 * Tách HTML thành khối cấp cao nhất.
 *
 * @return array<int,array{sep:string,html:string}>
 */
function hvd_blocks( $html ) {
	$block_tags = array( 'p', 'div', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'blockquote', 'figure', 'section', 'pre', 'hr' );
	preg_match_all( '/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/s', $html, $m, PREG_SET_ORDER | PREG_OFFSET_CAPTURE );
	$tokens = array();
	$cursor = 0;
	$depth  = 0;
	$start  = 0;
	$sep    = '';
	$flush  = static function ( $from, $to ) use ( &$tokens, &$sep, $html ) {
		$chunk = substr( $html, $from, $to - $from );
		if ( '' === trim( $chunk ) ) {
			$sep .= $chunk;
			return;
		}
		// Khoảng trắng đầu/cuối thuộc phần ngăn cách để ghép lại đúng nguyên văn.
		preg_match( '/^(\s*)(.*?)(\s*)$/s', $chunk, $p );
		$tokens[] = array( 'sep' => $sep . $p[1], 'html' => $p[2] );
		$sep      = $p[3];
	};
	foreach ( $m as $t ) {
		$name   = strtolower( $t[2][0] );
		$close  = '/' === $t[1][0];
		$self   = '/' === $t[3][0] || 'hr' === $name;
		$offset = $t[0][1];
		$end    = $offset + strlen( $t[0][0] );
		if ( ! in_array( $name, $block_tags, true ) ) {
			continue;
		}
		if ( 0 === $depth ) {
			if ( $close ) {
				continue; // đóng thừa
			}
			$flush( $cursor, $offset );
			$start  = $offset;
			$cursor = $offset;
			if ( $self ) {
				$flush( $start, $end );
				$cursor = $end;
				continue;
			}
			$depth = 1;
			continue;
		}
		if ( $self ) {
			continue;
		}
		$depth += $close ? -1 : 1;
		if ( 0 === $depth ) {
			$flush( $start, $end );
			$cursor = $end;
		}
	}
	if ( $cursor < strlen( $html ) ) {
		$flush( $cursor, strlen( $html ) );
	}
	if ( '' !== $sep && $tokens ) {
		$tokens[ count( $tokens ) - 1 ]['tail'] = $sep;
	}
	return $tokens;
}

/** Khoá so sánh của khối: bỏ khoảng trắng thừa. */
function hvd_key( $html ) {
	return preg_replace( '/\s+/u', ' ', trim( $html ) );
}

/** Dãy khối có đủ nội dung để coi là "bản lặp" (chữ >= 20 ký tự hoặc có ảnh). */
function hvd_significant( array $keys ) {
	$joined = implode( ' ', $keys );
	return false !== stripos( $joined, '<img' ) || mb_strlen( hvc_visible( $joined ) ) >= 20;
}

/**
 * Bỏ các dãy khối lặp liền kề.
 *
 * @return array{0:string,1:int} Nội dung mới và số khối đã bỏ.
 */
function hvd_dedupe( $html ) {
	$tokens = hvd_blocks( $html );
	$tail   = '';
	if ( $tokens && isset( $tokens[ count( $tokens ) - 1 ]['tail'] ) ) {
		$tail = $tokens[ count( $tokens ) - 1 ]['tail'];
	}
	$removed = 0;
	do {
		$found = false;
		$n     = count( $tokens );
		$keys  = array_map( static fn( $t ) => hvd_key( $t['html'] ), $tokens );
		for ( $k = intdiv( $n, 2 ); $k >= 1 && ! $found; $k-- ) {
			for ( $i = 0; $i + 2 * $k <= $n; $i++ ) {
				if ( array_slice( $keys, $i, $k ) !== array_slice( $keys, $i + $k, $k ) || ! hvd_significant( array_slice( $keys, $i, $k ) ) ) {
					continue;
				}
				// Bản lặp đầy đủ, cộng phần lặp dở dang ngay sau (nếu có).
				$t = 0;
				while ( $t < $k && $i + 2 * $k + $t < $n && $keys[ $i + 2 * $k + $t ] === $keys[ $i + $t ] ) {
					++$t;
				}
				$drop = $k + $t;
				array_splice( $tokens, $i + $k, $drop );
				$removed += $drop;
				$found    = true;
				break;
			}
		}
	} while ( $found );
	if ( ! $removed ) {
		return array( $html, 0 );
	}
	$out = '';
	foreach ( $tokens as $t ) {
		$out .= $t['sep'] . $t['html'];
	}
	return array( $out . $tail, $removed );
}

