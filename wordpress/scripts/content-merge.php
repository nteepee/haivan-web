<?php
/**
 * wp eval-file /scripts/content-merge.php   (dry-run mặc định; HV_APPLY=1 để ghi; HV_VERBOSE=1 in phần được gộp)
 *
 * Gộp bài trùng chủ đề theo quyết định của chủ (docs/seo/duplicate-groups.md):
 *  - Nhóm A: bản `-2` đưa vào thùng rác, 301 về bản gốc (không gộp nội dung).
 *  - Nhóm B (chỉ các nhóm đánh dấu GỘP): bài giàu thông tin nhất (số từ + ảnh + đề mục; hoà thì bài mới hơn) làm chuẩn; từ các bài
 *    còn lại chỉ đưa vào chuẩn phần chưa có: đoạn văn có >= 30% từ khoá chưa nằm trong chuẩn, đặt vào mục cùng đề mục (khớp >= 50%) hoặc
 *    thành mục mới ở cuối bài (đề mục chuyển về cấp của bài chuẩn). Không nối cả bài; bỏ đoạn quảng cáo liên hệ, khối context/bắc cầu và
 *    shortcode CTA của bài phụ; ảnh chỉ giữ nếu là ảnh trong Media còn file và chưa có trong bài chuẩn. Rồi bài phụ vào thùng rác.
 *  Bài phụ có meta hv_merged_into = ID bài chuẩn (đã giải xong chuỗi A rồi B). content-relink.php dùng meta này để đổi mọi link nội bộ
 *  còn trỏ tới bài phụ; 301 nằm ở theme (inc/redirects.php): script cảnh báo nếu thiếu quy tắc. Nhóm C, nhóm dương tính giả và
 *  nhóm MKT quyết KHÔNG nằm trong script này.
 * Idempotent: bài đã trong thùng rác bỏ qua; nhóm còn một bài sống thì không làm gì.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-blocks.php';
require_once __DIR__ . '/lib/content-links.php';

$run     = new HVC_Run( 'content-merge' );
$verbose = '1' === (string) ( getenv( 'HV_VERBOSE' ) ?: '0' );
global $wpdb;

/** Nhóm A: [bản phụ, bản gốc] (slug bai_viet). */
$group_a = array(
	array( 'xe-tai-ha-noi-dien-bien-2', 'xe-tai-ha-noi-dien-bien' ),
	array( 'so-dien-thoai-benh-vien-ung-buou-ha-noi-2', 'so-dien-thoai-benh-vien-ung-buou-ha-noi' ),
	array( 'huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020-2', 'huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020' ),
	array( 'tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat-2', 'tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat' ),
);
/** Nhóm B đánh dấu GỘP: các slug trong nhóm (chuẩn chọn theo thông tin). */
$group_b = array(
	array( 'tong-hop-nha-xe-ha-noi-di-dien-bien-chat-luong-nhat', 'top-nha-xe-dien-bien-ha-noi-uy-tin-chat-luong-cao' ),
	array( 'xe-tai-ha-noi-dien-bien', 'gui-hang-xe-tai-ha-noi-dien-bien-danh-sach-cac-don-vi-uy-tin' ),
	array( 'cap-nhat-thong-tin-ma-buu-dien-ha-giang-moi-nhat', 'cap-nhat-chi-tiet-ma-buu-dien-ha-giang' ),
	array( 'tong-hop-xe-ha-noi-ha-giang-chat-luong-nhat', 'kinh-nghiem-chon-xe-ha-noi-di-ha-giang-chat-luong-nhat' ),
	array( 'tong-hop-cac-dia-chi-buu-cuc-viettel-post-son-la', 'viettel-post-son-la' ),
);

/** Bài bai_viet đang publish theo slug, hoặc null. */
$by_slug = static function ( $slug ) use ( $wpdb ) {
	$row = $wpdb->get_row( $wpdb->prepare( "SELECT ID, post_type, post_status, post_name, post_parent, post_title, post_content, post_excerpt, post_date FROM {$wpdb->posts} WHERE post_type = 'bai_viet' AND post_name = %s", $slug ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	return ( $row && 'publish' === $row->post_status ) ? $row : null;
};

/** Khối thuộc phần tự sinh (context, bắc cầu, shortcode CTA) hay không. */
$is_special = static function ( $html ) {
	return (bool) preg_match( '#^(?:<p class="hv-context-(?:link|outro)"|<!-- hv-seo-bridge|<div class="hv-seo-bridge"|\[haivan_cta)#', ltrim( $html ) );
};
$is_heading = static fn( $html ) => (bool) preg_match( '#^<h([1-6])\b#i', ltrim( $html ) );
$norm_tokens = static function ( $text ) {
	return array_flip( hvl_tokens( $text ) );
};
/** Số từ + 50/ảnh + 10/đề mục của phần thân (không tính khối tự sinh). */
$info_score = static function ( $row ) use ( $is_special, $is_heading ) {
	$score = 0;
	foreach ( hvd_blocks( $row->post_content ) as $b ) {
		if ( $is_special( $b['html'] ) ) {
			continue;
		}
		$score += str_word_count( remove_accents( hvc_visible( $b['html'] ) ) ) + 50 * preg_match_all( '#<img\b#i', $b['html'] ) + ( $is_heading( $b['html'] ) ? 10 : 0 );
	}
	return $score;
};
/** Ảnh Media local còn file? */
$img_ok = static function ( $src ) {
	$path = (string) wp_parse_url( html_entity_decode( $src ), PHP_URL_PATH );
	return 0 === strpos( $path, '/wp-content/uploads/' ) && is_file( ABSPATH . ltrim( $path, '/' ) );
};
$img_key = static fn( $src ) => preg_replace( '/-(?:\d+x\d+|scaled)(?=\.\w+$)/', '', strtolower( basename( (string) wp_parse_url( html_entity_decode( $src ), PHP_URL_PATH ) ) ) );

/**
 * Gộp phần chưa có của $donor vào nội dung $canon (chuỗi). Trả [nội dung mới, số khối thêm, mô tả].
 */
$merge_into = static function ( $canon, $donor ) use ( $is_special, $is_heading, $norm_tokens, $img_ok, $img_key ) {
	$ct = hvd_blocks( $canon );
	$dt = array_values( array_filter( hvd_blocks( $donor ), static fn( $b ) => ! $is_special( $b['html'] ) ) );
	// Từ khoá đã có trong bài chuẩn và ảnh đã có.
	$have = array();
	$imgs = array();
	foreach ( $ct as $b ) {
		if ( ! $is_special( $b['html'] ) ) {
			$have += $norm_tokens( hvc_visible( $b['html'] ) );
		}
		if ( preg_match_all( '#<img\b[^>]*\bsrc=(["\'])(.*?)\1#i', $b['html'], $m ) ) {
			foreach ( $m[2] as $src ) {
				$imgs[ $img_key( $src ) ] = true;
			}
		}
	}
	// Cấp đề mục: min của chuẩn / của bài phụ.
	$lvl = static function ( array $tokens ) use ( $is_heading ) {
		$min = 7;
		foreach ( $tokens as $b ) {
			if ( $is_heading( $b['html'] ) && preg_match( '#^\s*<h([1-6])#i', $b['html'], $m ) ) {
				$min = min( $min, (int) $m[1] );
			}
		}
		return 7 === $min ? 2 : $min;
	};
	$c_min = $lvl( $ct );
	$d_min = $lvl( $dt );
	// Mục của chuẩn: [chỉ số khối đề mục (-1 = mở bài), từ khoá đề mục, chỉ số khối cuối của mục].
	$sections = array();
	$cur      = array( 'idx' => -1, 'tok' => array(), 'end' => -1 );
	foreach ( $ct as $i => $b ) {
		if ( $is_special( $b['html'] ) ) {
			continue;
		}
		if ( $is_heading( $b['html'] ) ) {
			$sections[] = $cur;
			$cur        = array( 'idx' => $i, 'tok' => $norm_tokens( hvc_visible( $b['html'] ) ), 'end' => $i );
		} else {
			$cur['end'] = $i;
		}
	}
	$sections[] = $cur;
	// Mục của bài phụ.
	$dsec = array();
	$dcur = array( 'head' => null, 'blocks' => array() );
	foreach ( $dt as $b ) {
		if ( $is_heading( $b['html'] ) ) {
			$dsec[] = $dcur;
			$dcur   = array( 'head' => $b, 'blocks' => array() );
		} else {
			$dcur['blocks'][] = $b;
		}
	}
	$dsec[] = $dcur;

	$insert   = array(); // chỉ số khối chuẩn => [khối thêm sau nó]
	$appended = array(); // mục mới cuối bài
	$added    = 0;
	$notes    = array();
	foreach ( $dsec as $s ) {
		if ( null !== $s['head'] && preg_match( '/hải vân|đặt vé|liên hệ|hotline|tổng đài|bạn có biết/iu', hvc_visible( $s['head']['html'] ) ) ) {
			continue; // mục quảng cáo/thương hiệu của bài phụ
		}
		$uniq = array();
		foreach ( $s['blocks'] as $b ) {
			$vis = hvc_visible( $b['html'] );
			if ( mb_strlen( $vis ) < 40 && false === stripos( $b['html'], '<img' ) ) {
				continue;
			}
			if ( preg_match( '/(?:hotline|tổng đài|liên hệ|đặt vé)[^.]{0,60}(?:1900|0\d{9})/iu', $vis ) && mb_strlen( $vis ) < 220 ) {
				continue; // đoạn quảng cáo liên hệ
			}
			$html = $b['html'];
			// Ảnh: bỏ ảnh không phải Media local còn file hoặc đã có trong chuẩn.
			if ( false !== stripos( $html, '<img' ) ) {
				$html = preg_replace_callback(
					'#<img\b[^>]*\bsrc=(["\'])(.*?)\1[^>]*>#i',
					static fn( $m ) => ( $img_ok( $m[2] ) && ! isset( $imgs[ $img_key( $m[2] ) ] ) ) ? $m[0] : '',
					$html
				);
				$vis = hvc_visible( $html );
				if ( '' === $vis && false === stripos( $html, '<img' ) ) {
					continue;
				}
			}
			$tok = $norm_tokens( $vis );
			if ( $tok ) {
				$unseen = count( array_diff_key( $tok, $have ) );
				if ( $unseen / count( $tok ) < 0.3 && false === stripos( $html, '<img' ) ) {
					continue; // đã có trong chuẩn
				}
				if ( $unseen / count( $tok ) < 0.3 ) {
					$html = preg_replace( '#<img\b[^>]*>#i', '', $html ); // chỉ ảnh thừa chữ trùng
					if ( '' === trim( hvc_visible( $html ) ) ) {
						continue;
					}
				}
			}
			$uniq[] = $html;
			$have  += $tok;
			if ( preg_match_all( '#<img\b[^>]*\bsrc=(["\'])(.*?)\1#i', $html, $mm ) ) {
				foreach ( $mm[2] as $src ) {
					$imgs[ $img_key( $src ) ] = true;
				}
			}
		}
		if ( ! $uniq ) {
			continue;
		}
		// Tìm mục chuẩn cùng đề mục.
		$best  = null;
		$score = 0;
		if ( null === $s['head'] ) {
			$best = 0; // mở bài
		} else {
			$ht = $norm_tokens( hvc_visible( $s['head']['html'] ) );
			foreach ( $sections as $k => $sec ) {
				if ( -1 === $sec['idx'] || ! $ht || ! $sec['tok'] ) {
					continue;
				}
				$j = count( array_intersect_key( $ht, $sec['tok'] ) ) / count( $ht + $sec['tok'] );
				if ( $j > $score ) {
					$score = $j;
					$best  = $k;
				}
			}
			if ( $score < 0.5 ) {
				$best = null;
			}
		}
		if ( null !== $best && $sections[ $best ]['end'] >= 0 ) {
			$insert[ $sections[ $best ]['end'] ] = array_merge( $insert[ $sections[ $best ]['end'] ] ?? array(), $uniq );
			$added                              += count( $uniq );
			$notes[]                             = sprintf( '+%d khối vào mục "%s"', count( $uniq ), null === $s['head'] ? 'mở bài' : mb_substr( hvc_visible( $s['head']['html'] ), 0, 40 ) );
		} elseif ( null !== $s['head'] ) {
			preg_match( '#^\s*<h([1-6])#i', $s['head']['html'], $hm );
			$new_lvl = max( 1, min( 6, $c_min + ( (int) $hm[1] - $d_min ) ) );
			$head    = preg_replace( '#^(\s*)<h[1-6]\b#i', '$1<h' . $new_lvl, $s['head']['html'] );
			$head    = preg_replace( '#</h[1-6]>\s*$#i', '</h' . $new_lvl . '>', $head );
			$appended[] = $head;
			$added++;
			foreach ( $uniq as $u ) {
				$appended[] = $u;
				$added++;
			}
			$notes[] = sprintf( 'mục mới "%s" (%d khối)', mb_substr( hvc_visible( $s['head']['html'] ), 0, 40 ), count( $uniq ) );
		} else { // mở bài không khớp mục nào (chuẩn không có mục mở bài): thêm cuối
			foreach ( $uniq as $u ) {
				$appended[] = $u;
				$added++;
			}
			$notes[] = sprintf( '+%d khối mở bài vào cuối', count( $uniq ) );
		}
	}
	if ( ! $added ) {
		return array( $canon, 0, array() );
	}
	// Dựng lại: chèn sau khối cuối của mục; mục mới chèn trước dãy khối tự sinh ở cuối bài.
	$tail_start = count( $ct );
	while ( $tail_start > 0 && $is_special( $ct[ $tail_start - 1 ]['html'] ) ) {
		--$tail_start;
	}
	$out = '';
	foreach ( $ct as $i => $b ) {
		if ( $i === $tail_start && $appended ) {
			$out .= "\r\n\r\n" . implode( "\r\n\r\n", $appended );
		}
		$out .= $b['sep'] . $b['html'];
		foreach ( $insert[ $i ] ?? array() as $extra ) {
			$out .= "\r\n\r\n" . $extra;
		}
	}
	if ( $tail_start >= count( $ct ) && $appended ) {
		$out .= "\r\n\r\n" . implode( "\r\n\r\n", $appended );
	}
	$last = $ct ? end( $ct ) : null;
	return array( $out . ( $last['tail'] ?? '' ), $added, $notes );
};

/** Đưa bài $donor vào thùng rác, ghi meta trỏ về bài chuẩn. */
$retire = static function ( $donor, $canon_id ) use ( $run ) {
	if ( $run->apply ) {
		update_post_meta( (int) $donor->ID, 'hv_merged_into', (int) $canon_id );
		wp_trash_post( (int) $donor->ID );
	}
	$run->changed[ (int) $donor->ID ] = true;
};

/* ---------------- Nhóm A ---------------- */
$redirects = array(); // ID phụ => ID đích
foreach ( $group_a as $pair ) {
	$donor = $by_slug( $pair[0] );
	$orig  = $by_slug( $pair[1] );
	if ( ! $donor || ! $orig ) {
		continue;
	}
	$run->hit( 'nhom-a-thung-rac', (int) $donor->ID );
	$redirects[ (int) $donor->ID ] = (int) $orig->ID;
	$retire( $donor, (int) $orig->ID );
}

/* ---------------- Nhóm B ---------------- */
foreach ( $group_b as $slugs ) {
	$rows = array_values( array_filter( array_map( $by_slug, $slugs ) ) );
	if ( count( $rows ) < 2 ) {
		continue;
	}
	usort(
		$rows,
		static function ( $a, $b ) use ( $info_score ) {
			return array( $info_score( $b ), $b->post_date, $b->ID ) <=> array( $info_score( $a ), $a->post_date, $a->ID );
		}
	);
	$canon   = array_shift( $rows );
	$content = $canon->post_content;
	foreach ( $rows as $donor ) {
		list( $content, $n, $notes ) = $merge_into( $content, $donor->post_content );
		$run->hit( 'nhom-b-khoi-gop-vao-chuan', (int) $canon->ID, $n );
		$run->hit( 'nhom-b-thung-rac', (int) $donor->ID );
		$redirects[ (int) $donor->ID ] = (int) $canon->ID;
		foreach ( $redirects as $from => $to ) { // bài phụ trước đó trỏ vào bài này vẫn đúng; nếu bài này là chuẩn thì giữ
			if ( $to === (int) $donor->ID ) {
				$redirects[ $from ] = (int) $canon->ID;
			}
		}
		{
			$run->notes[] = sprintf( 'B: giữ #%d "%s" (thông tin %d); gộp #%d "%s" (%d): %s', $canon->ID, $canon->post_name, $info_score( $canon ), $donor->ID, $donor->post_name, $info_score( $donor ), $notes ? implode( '; ', $notes ) : 'không có gì mới để thêm' );
		}
		$retire( $donor, (int) $canon->ID );
	}
	if ( $content !== $canon->post_content ) {
		$run->sample( 'nhom-b-khoi-gop-vao-chuan', (int) $canon->ID, $canon->post_content, $content );
	}
	$run->commit( $canon, array( 'post_content' => $content ) );
	if ( $run->apply && $rows ) {
		update_post_meta( (int) $canon->ID, 'hv_merged_from', implode( ',', array_map( static fn( $r ) => (int) $r->ID, $rows ) ) );
	}
}

/* ---------------- Giải chuỗi A -> B và kiểm 301 ---------------- */
if ( $run->apply ) {
	// Bài phụ đã trỏ vào một bài về sau cũng bị gộp: trỏ thẳng tới bài chuẩn cuối cùng.
	$all = $wpdb->get_results( "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = 'hv_merged_into'" ); // phpcs:ignore WordPress.DB.PreparedSQL
	$map = array();
	foreach ( $all as $r ) {
		$map[ (int) $r->post_id ] = (int) $r->meta_value;
	}
	foreach ( $map as $from => $to ) {
		$guard = 0;
		while ( isset( $map[ $to ] ) && $guard++ < 10 ) {
			$to = $map[ $to ];
		}
		if ( $to !== $map[ $from ] ) {
			update_post_meta( $from, 'hv_merged_into', $to );
			$redirects[ $from ] = $to;
		}
	}
}
foreach ( $redirects as $from => $to ) {
	$guard = 0;
	while ( isset( $redirects[ $to ] ) && $guard++ < 10 ) {
		$to = $redirects[ $to ];
	}
	$redirects[ $from ] = $to;
}
foreach ( $redirects as $from => $to ) {
	$from_path = str_replace( '__trashed', '', rtrim( hvc_post_path( $from ), '/' ) );
	$to_path   = str_replace( '__trashed', '', rtrim( hvc_post_path( $to ), '/' ) );
	if ( function_exists( 'hv_redirect_target' ) && hv_redirect_target( $from_path ) !== $to_path ) {
		$run->notes[] = "THIẾU 301 trong inc/redirects.php: array( '$from_path', '$to_path', false ),";
	}
}

$run->finish();
