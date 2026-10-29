<?php
/**
 * wp eval-file /scripts/content-relink.php   (dry-run mặc định; HV_APPLY=1 để ghi; HV_REPORT=1 in kiểm tra link chết/mồ côi)
 *
 * Dựng lại link nội bộ của bài điểm đến + tin công ty (bai_viet, tin_tuc) và các trang (page, diem_den) theo audit mục 4/6,
 * từ bản nhập mới, deterministic, chạy lại không đổi gì:
 *  1. Link trong nội dung ("href" của <a>):
 *     - URL tuyệt đối haivan.com / www / cms.haivan.com thành đường dẫn tương đối; bỏ ?fbclid / utm_*, ?en thừa; chữ thường cho /diem-den, /chung-toi;
 *     - đường dẫn cũ /tin-tuc/<slug>, /tuyen-duong/<slug>, /xe-lien-tinh, /xe-khach?from=...&to=..., /dich-vu-xe-cho-thue/... sang trang sống;
 *     - tuyến chết/ngưng (/xe-khach/ha-noi/dien-bien -> /xe-khach/my-dinh/dien-bien; Hà Giang, Sapa, Lào Cai, Tuyên Quang, ... không còn tuyến):
 *       bỏ thẻ <a> giữ chữ; đoạn chỉ gồm một CTA kiểu ">>> Đặt vé ... : Tại Đây" thì bỏ cả đoạn;
 *     - anchor "tại đây" thành nhãn mô tả đích; đoạn CTA "...: Tại Đây" trỏ tuyến sống: bỏ đoạn (khối cuối bài đã có link đặt vé).
 *  2. Hai khối cuối cùng của bài (lib/relink-map.csv: cụm, bài cùng cụm sibling_1/2):
 *     - <p class="hv-context-link">: gợi ý đặt vé theo cụm, sau ~150 ký tự chữ đầu tiên;
 *     - <p class="hv-context-outro">: link các tuyến chính của cụm, hotline 1900 6763, 2 bài cùng chủ đề; đặt trước các shortcode [haivan_cta] cuối bài.
 *     Chỉ THÊM khi bài chưa có (bài đã có thì giữ, chỉ chuẩn hoá: bỏ emoji/mũi tên, link Mộc Châu sang landing tuyến).
 *     HV_RELINK_REBUILD=1 dựng lại cả hai khối từ mẫu (bỏ khối cũ).
 *     Bài thuộc nhóm bắc cầu (content-bridge.php) không có khối context-link: hộp hv-seo-bridge đảm nhiệm.
 * Không đụng: link ngoài (bệnh viện, bit.ly, maps...), mailto:, tel:, link tới bài/trang khác còn sống.
 * Idempotent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-links.php';

$run     = new HVC_Run( 'content-relink' );
$report  = '1' === (string) ( getenv( 'HV_REPORT' ) ?: '0' );
$rebuild = '1' === (string) ( getenv( 'HV_RELINK_REBUILD' ) ?: '0' );
$csv     = hvl_csv();
$labels  = hvl_labels();

/* ---------------------------------------------------------------- chỉ mục bài */
global $wpdb;
$by_path = array(); // đường dẫn chữ thường => ID (bài + trang đang publish)
$by_slug = array(); // slug bài viết/tin => đường dẫn (để đổi /tin-tuc/<slug>)
$path_by_id = array();
$titles     = array(); // đường dẫn chữ thường => [kiểu bài, tiêu đề chữ thuần] (nhãn thay anchor "tại đây")
foreach ( $wpdb->get_results( "SELECT ID, post_type, post_name, post_title FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ('bai_viet','tin_tuc','diem_den','page')" ) as $p ) { // phpcs:ignore WordPress.DB.PreparedSQL
	$path = strtolower( hvc_post_path( (int) $p->ID ) );
	if ( '' === $path ) {
		continue;
	}
	$by_path[ rtrim( $path, '/' ) ]  = (int) $p->ID;
	$path_by_id[ (int) $p->ID ]      = rtrim( $path, '/' );
	$titles[ rtrim( $path, '/' ) ] = array( $p->post_type, hvl_plain( hvc_visible( $p->post_title ) ) );
	if ( in_array( $p->post_type, array( 'bai_viet', 'tin_tuc' ), true ) ) {
		$by_slug[ $p->post_name ] = rtrim( $path, '/' );
	}
}

// Bài đã gộp vào bài khác (content-merge.php): slug cũ => đường dẫn bài chuẩn; link nội bộ tới bài cũ được đổi sang bài chuẩn.
$merged = array();
foreach ( $wpdb->get_results( "SELECT p.post_name, pm.meta_value FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = 'hv_merged_into' WHERE p.post_status = 'trash'" ) as $mrow ) { // phpcs:ignore WordPress.DB.PreparedSQL
	if ( isset( $path_by_id[ (int) $mrow->meta_value ] ) ) {
		$merged[ preg_replace( '/__trashed$/', '', $mrow->post_name ) ] = $path_by_id[ (int) $mrow->meta_value ];
	}
}

/** Trang cũ /tuyen-duong/<slug>: đích sống, hoặc false = không có tuyến tương ứng. */
$tuyen_duong = array(
	'tan-son-nhat-vung-tau'            => '/xe-khach/tan-son-nhat/vung-tau',
	'ho-chinh-minh-vung-tau'           => '/xe-khach/quan-1/vung-tau',
	'ha-noi-son-la'                    => '/xe-khach/my-dinh/son-la',
	'ha-noi-dien-bien-ban-phu-muong-lay' => '/xe-khach/my-dinh/dien-bien',
);
/** Tuyến cũ/sai đã biết => tuyến sống thay thế. Mọi tuyến /xe-khach/a/b khác không sống => false (bỏ link). */
$route_alias = array(
	'ha-noi/dien-bien' => 'my-dinh/dien-bien',
	'ha-noi/son-la'    => 'my-dinh/son-la',
	'ha-noi/moc-chau'  => 'my-dinh/moc-chau',
);
/** Trang cũ đã đổi chỗ. */
$page_alias = array(
	'/dich-vu-xe-cho-thue/phuong-tien'  => '/dich-vu/xe-hop-dong/phuong-tien',
	'/ho-tro/thanh-toan-viettel'        => '/ho-tro/huong-dan-thanh-toan', // trang đã gỡ (301 ở theme)
	'/en/ho-tro/thanh-toan-viettel'     => '/en/ho-tro/huong-dan-thanh-toan',
);

/* ---------------------------------------------------------------- chuẩn hoá href */

/**
 * Tính href mới.
 *
 * @return string|false|null chuỗi = href mới; false = đích chết (bỏ thẻ <a>); null = giữ nguyên.
 */
$map_href = static function ( $href ) use ( $by_path, $by_slug, $merged, $tuyen_duong, $route_alias, $page_alias ) {
	$raw = html_entity_decode( trim( $href ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	if ( '' === $raw || preg_match( '#^(?:mailto:|tel:|sms:|javascript:|\#)#i', $raw ) ) {
		return null;
	}
	$path  = '';
	$query = '';
	$frag  = '';
	if ( preg_match( '#^https?://([^/?\#]+)([^?\#]*)(\?[^\#]*)?(\#.*)?$#i', $raw, $m ) ) {
		$host = strtolower( preg_replace( '/^www\./', '', $m[1] ) );
		if ( 'l.facebook.com' === $host && preg_match( '#^/l\.php#', $m[2] ) && preg_match( '/[?&]u=([^&]+)/', $m[3] ?? '', $u ) ) {
			return '/'; // liên kết bọc qua Facebook trỏ về haivan.com
		}
		if ( ! in_array( $host, array( 'haivan.com', 'cms.haivan.com' ), true ) ) {
			return null; // link ngoài
		}
		$path  = $m[2];
		$query = $m[3] ?? '';
		$frag  = $m[4] ?? '';
	} elseif ( '/' === $raw[0] && ( ! isset( $raw[1] ) || '/' !== $raw[1] ) ) {
		preg_match( '#^([^?\#]*)(\?[^\#]*)?(\#.*)?$#', $raw, $m );
		$path  = $m[1];
		$query = $m[2] ?? '';
		$frag  = $m[3] ?? '';
	} else {
		return null;
	}
	$path = '' === $path ? '/' : $path;
	parse_str( ltrim( $query, '?' ), $q );
	$lpath = strtolower( rtrim( $path, '/' ) );
	$lpath = '' === $lpath ? '/' : $lpath;

	// Đích đặc biệt theo đường dẫn.
	if ( isset( $page_alias[ $lpath ] ) ) {
		return $page_alias[ $lpath ] . $frag;
	}
	if ( '/en' === $lpath ) {
		return '/' . $frag;
	}
	if ( '/xe-lien-tinh' === $lpath ) {
		return '/xe-khach';
	}
	if ( preg_match( '#^/tin-tuc/([^/]+)$#', $lpath, $s ) ) {
		return $by_slug[ $s[1] ] ?? '/';
	}
	if ( preg_match( '#^/tuyen-duong/([^/]+)$#', $lpath, $s ) ) {
		return $tuyen_duong[ $s[1] ] ?? false;
	}
	if ( in_array( $lpath, array( '/xe-khach', '/xe-khach/tim-chuyen' ), true ) && isset( $q['to'] ) ) {
		$to = mb_strtolower( (string) $q['to'] );
		if ( preg_match( '/điện biên|dien bien/u', $to ) ) {
			return '/xe-khach/my-dinh/dien-bien';
		}
		if ( preg_match( '/sơn la|son la/u', $to ) ) {
			return '/xe-khach/my-dinh/son-la';
		}
		if ( preg_match( '/mộc châu|moc chau|xuân tráng|xuan trang/u', $to ) ) {
			return hvl_route_live( '/xe-khach/my-dinh/moc-chau' ) ? '/xe-khach/my-dinh/moc-chau' : '/diem-den/moc-chau';
		}
		if ( preg_match( '/hà giang|ha giang|lào cai|lao cai|sa pa|sapa|tuyên quang/u', $to ) ) {
			return false;
		}
		return '/xe-khach';
	}
	if ( preg_match( '#^/xe-khach/([^/]+/[^/]+)$#', $lpath, $s ) ) {
		$route = $s[1];
		$route = $route_alias[ $route ] ?? $route;
		return hvl_route_live( '/xe-khach/' . $route ) ? '/xe-khach/' . $route : false;
	}
	if ( preg_match( '#^/tag/#', $lpath ) ) {
		return false; // web cũ có trang thẻ, bản mới không có
	}
	if ( preg_match( '#^/(?:diem-den|chung-toi)(?:/|$)#', $lpath ) ) {
		$out = $lpath; // đường dẫn bài/điểm đến luôn chữ thường
		if ( preg_match( '#^/diem-den/[^/]+/([^/]+)$#', $lpath, $s ) || preg_match( '#^/chung-toi/bao-chi-tin-tuc/([^/]+)$#', $lpath, $s ) ) {
			// Bài tra theo slug, đoạn điểm đến có thể lệch: về đường dẫn chuẩn; slug không còn bài nào = đích chết.
			if ( ! isset( $by_path[ $lpath ] ) ) {
				if ( isset( $by_slug[ $s[1] ] ) ) {
					$out = $by_slug[ $s[1] ];
				} elseif ( isset( $merged[ $s[1] ] ) ) {
					$out = $merged[ $s[1] ]; // bài đã gộp: về bài chuẩn
				} else {
					return false;
				}
			}
		} elseif ( preg_match( '#^/diem-den/[^/]+$#', $lpath ) && ! isset( $by_path[ $lpath ] ) ) {
			return false;
		}
	} else {
		$out = rtrim( $path, '/' );
		$out = '' === $out ? '/' : $out;
	}
	// Bỏ tham số theo dõi và ?en thừa; giữ tham số khác (vd. ?page=2).
	foreach ( array_keys( $q ) as $k ) {
		if ( 'fbclid' === $k || 0 === strpos( $k, 'utm_' ) || ( 'en' === $k && '' === (string) $q[ $k ] ) ) {
			unset( $q[ $k ] );
		}
	}
	$qs = $q ? '?' . http_build_query( $q ) : '';
	return $out . $qs . $frag;
};

/** Anchor chung chung cần thay bằng nhãn mô tả. */
$generic_anchor = '/^(?:tại đây|ở đây|xem tại đây|click vào đây|bấm vào đây|nhấn vào đây|đây)$/iu';
/** Chữ của anchor đã bỏ ký hiệu trang trí đầu (">>>", "►►►"). */
$strip_deco = static fn( $t ) => trim( preg_replace( '/^(?:[►▶»>\s]|&gt;|&raquo;)+/u', '', $t ) );

/**
 * Sửa mọi thẻ <a> trong $html.
 * Thẻ bị bỏ được đánh dấu để dọn đoạn sau: "\x01D" = bỏ cả chữ (CTA), "\x01U...\x02" = bỏ thẻ giữ chữ; đoạn <p> mà phần còn lại
 * không còn chữ nào thì bị bỏ nguyên đoạn (câu quảng cáo trỏ về trang chết không còn ý nghĩa).
 */
$link_fix = static function ( $html, $id ) use ( $run, $map_href, $labels, $titles, $generic_anchor, $strip_deco ) {
	$out = preg_replace_callback(
		'#<a\b([^>]*)>((?:(?!<a\b).)*?)</a>#is',
		static function ( $m ) use ( $run, $id, $map_href, $labels, $titles, $generic_anchor, $strip_deco ) {
			if ( ! preg_match( '#(?<![\w-])href\s*=\s*(["\'])(.*?)\1#is', $m[1], $h ) ) {
				return $m[0];
			}
			$attrs = $m[1];
			$inner = $m[2];
			$text  = hvc_visible( $inner );
			$new   = $map_href( $h[2] );
			$old   = html_entity_decode( $h[2], ENT_QUOTES | ENT_HTML5 );
			$cta   = (bool) preg_match( '/(?:[:\-–]\s*)?(?:tại đây|ở đây)$/iu', $text ) && mb_strlen( $text ) > 12;
			$final = null === $new ? $old : $new;

			if ( false === $new ) { // đích chết: bỏ thẻ; CTA thì bỏ luôn chữ
				$run->hit( 'href-chet-bo-link', $id );
				return $cta ? "\x01D" : "\x01U" . $inner . "\x02";
			}
			if ( $cta && preg_match( '#^/xe-khach#', $final ) ) {
				// CTA kiểu "Đặt vé ... : Tại Đây": khối cuối bài đã có link đặt vé.
				$run->hit( 'cta-tai-day-bo-doan', $id );
				return "\x01D";
			}
			$changed = false;
			$strip   = preg_replace( '#\sdata-mce-(?:href|src)\s*=\s*(["\']).*?\1#is', '', $attrs ); // vết trình soạn thảo cũ, trùng href
			if ( $strip !== $attrs ) {
				$run->hit( 'anchor-thuoc-tinh-cu', $id );
				$attrs   = $strip;
				$changed = true;
			}
			if ( null !== $new && $new !== $old ) {
				$run->hit( 'href-sua', $id );
				$attrs   = preg_replace( '#(?<![\w-])href\s*=\s*(["\']).*?\1#is', 'href="' . esc_attr( $new ) . '"', $attrs, 1 );
				$changed = true;
			}
			if ( '/' === ( $final[0] ?? '' ) ) {
				// Link nội bộ: bỏ thuộc tính trình soạn thảo cũ (style, target, data-mce-href).
				$clean = preg_replace( '#\s(?:style|data-mce-href)\s*=\s*(["\']).*?\1#is', '', $attrs );
				$clean = preg_replace( '#\starget\s*=\s*(["\'])_(?:new|blank)\1#i', '', $clean );
				if ( $clean !== $attrs ) {
					$run->hit( 'anchor-thuoc-tinh-cu', $id );
					$attrs   = $clean;
					$changed = true;
				}
			}
			if ( $cta ) {
				// Anchor CTA trỏ trang không phải tuyến: bỏ ký hiệu đầu và đuôi ": Tại Đây", giữ phần mô tả.
				$clean = preg_replace( '/^((?:\s|<[^>]+>)*)(?:&gt;|[►▶»>])+\s*/u', '$1', $inner );
				$clean = preg_replace( '/\s*[:\-–]?\s*(?:tại đây|ở đây)((?:\s|<\/[a-z]+>)*)$/iu', '$1', $clean );
				if ( null !== $clean && $clean !== $inner && '' !== hvc_visible( $clean ) ) {
					$run->hit( 'anchor-tai-day', $id );
					$inner   = $clean;
					$changed = true;
				}
				if ( '/' === $final ) {
					// CTA về trang chủ đứng một mình trong đoạn: khối cuối bài đã có link thương hiệu, bỏ cả đoạn.
					$run->hit( 'cta-tai-day-bo-doan', $id );
					return "\x01U<a" . $attrs . '>' . $inner . "</a>\x02";
				}
			}
			if ( preg_match( $generic_anchor, $strip_deco( $text ) ) ) {
				$label = $labels[ $final ] ?? $labels[ preg_replace( '#\?.*$#', '', $final ) ] ?? null;
				$key   = strtolower( rtrim( (string) strtok( $final, '?#' ), '/' ) );
				if ( ! $label && '/diem-den' === $key ) {
					$label = 'chuyên mục điểm đến của Hải Vân';
				} elseif ( ! $label && isset( $titles[ $key ] ) ) {
					$label = 'diem_den' === $titles[ $key ][0] ? 'chuyên mục điểm đến ' . $titles[ $key ][1] : $titles[ $key ][1];
				}
				if ( $label ) {
					$run->hit( 'anchor-tai-day', $id );
					$inner   = esc_html( $label );
					$changed = true;
				}
			}
			if ( ! $changed ) {
				return $m[0];
			}
			$result = '<a' . $attrs . '>' . $inner . '</a>';
			$run->sample( 'href-sua', $id, $m[0], $result );
			return $result;
		},
		$html
	);
	if ( null === $out ) {
		WP_CLI::error( 'Regex link lỗi: ' . preg_last_error_msg() );
	}
	if ( false !== stripos( $out, 'cms.haivan.com' ) ) {
		// Máy chủ CMS cũ không còn công khai: chữ hiển thị trỏ về haivan.com (thuộc tính href đã được xử lý ở trên).
		$out = hvc_text_map( $out, static fn( $t ) => hvc_replace( $run, 'cms-host-trong-chu', $id, 'cms.haivan.com', 'haivan.com', $t ) );
	}
	if ( false !== strpos( $out, "\x01" ) ) {
		$run->hit( 'doan-link-chet-da-go', $id );
		$out = preg_replace_callback(
			'#<p\b[^>]*>(?:(?!</p>).)*?</p>\s*#is',
			static function ( $m ) {
				if ( false === strpos( $m[0], "\x01" ) ) {
					return $m[0];
				}
				$rest = hvc_visible( preg_replace( '/\x01D|\x01U.*?\x02/s', '', $m[0] ) );
				$rest = trim( preg_replace( '/^(?:[►▶»>\s:\-–])+/u', '', $rest ) );
				return mb_strlen( $rest ) < 3 ? '' : $m[0];
			},
			$out
		);
		$out = preg_replace( '/\x01D|\x01U|\x02/', '', $out );
	}
	return $out;
};

/** Chữ "haivan.com" trơn (không nằm trong thẻ <a>) thành liên kết về trang chủ: nhãn thương hiệu + miền. */
$link_brand_mentions = static function ( $html, $id ) use ( $run ) {
	$parts = preg_split( '/(<(?:script|style)\b[^>]*>.*?<\/(?:script|style)>|<!--.*?-->|<[^>]*>)/is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	$in_a  = 0;
	foreach ( $parts as $i => $p ) {
		if ( 1 === $i % 2 ) {
			if ( preg_match( '#^<a\b#i', $p ) ) {
				++$in_a;
			} elseif ( preg_match( '#^</a\s*>#i', $p ) ) {
				$in_a = max( 0, $in_a - 1 );
			}
			continue;
		}
		if ( $in_a || '' === $p || false === stripos( $p, 'haivan.com' ) ) {
			continue;
		}
		$parts[ $i ] = preg_replace_callback(
			'#(?<![\w/@.\-])(?:https?://)?(?:www\.)?haivan\.com/?(?![\w/.\-@])#iu',
			static function () use ( $run, $id ) {
				$run->hit( 'haivan-com-thanh-link', $id );
				return '<a href="/">Hãng xe Hải Vân (haivan.com)</a>';
			},
			$p
		);
		$run->sample( 'haivan-com-thanh-link', $id, $p, $parts[ $i ] );
	}
	return implode( '', $parts );
};

/* ---------------------------------------------------------------- khối cuối bài */

/** Bộ tuyến chính theo cụm: [văn bản => đường dẫn]. */
$route_sets = static function ( $cluster ) {
	$vt = array(
		'Xe đi Vũng Tàu từ Sài Gòn (Quận 1)'            => '/xe-khach/quan-1/vung-tau',
		'Xe Vũng Tàu đi Sài Gòn'                         => '/xe-khach/vung-tau/quan-1-san-bay',
		'Xe Sân bay Tân Sơn Nhất đi Vũng Tàu'           => '/xe-khach/tan-son-nhat/vung-tau',
		'Xe Vũng Tàu đi Sân bay Tân Sơn Nhất'           => '/xe-khach/vung-tau/tan-son-nhat',
	);
	$db = array(
		'Xe giường nằm Hà Nội đi Điện Biên (Mỹ Đình)'   => '/xe-khach/my-dinh/dien-bien',
		'Xe Yên Nghĩa đi Điện Biên'                      => '/xe-khach/yen-nghia/dien-bien',
		'Xe Điện Biên về Hà Nội (Mỹ Đình)'               => '/xe-khach/dien-bien/my-dinh',
	);
	$sl = array(
		'Xe đi Sơn La từ Hà Nội (Mỹ Đình)'              => '/xe-khach/my-dinh/son-la',
		'Xe Sơn La về Hà Nội (Mỹ Đình)'                  => '/xe-khach/son-la/my-dinh',
	);
	$mc = array(
		'Xe đi Hà Nội – Mộc Châu (Mỹ Đình)'              => '/xe-khach/my-dinh/moc-chau',
		'Xe Mộc Châu về Hà Nội (Mỹ Đình)'                => '/xe-khach/moc-chau/my-dinh',
	);
	switch ( $cluster ) {
		case 'vung-tau':
		case 'ho-chi-minh':
			return $vt;
		case 'dien-bien':
			return $db + array_slice( $sl, 0, 1 );
		case 'son-la':
			return $sl + array_slice( $mc, 0, 1 ) + array_slice( $db, 0, 1 );
		case 'moc-chau':
			return $mc + array_slice( $sl, 0, 1 ) + array_slice( $db, 0, 1 );
		case 'ha-noi': // bài Hà Nội (bệnh viện, bến xe): chỉ tuyến Tây Bắc xuất phát từ Hà Nội, không dẫn sang Vũng Tàu
			return $mc + $sl + $db;
		default: // tin công ty, Hà Nội và cụm khác: tuyến chủ lực hai miền
			return array_slice( $vt, 0, 2 ) + array_slice( $mc, 0, 1 ) + array_slice( $sl, 0, 1 ) + array_slice( $db, 0, 1 );
	}
};

/** Liên kết các tuyến còn sống trong bộ, nối "a, b và c". */
$link_list = static function ( array $set ) {
	$items = array();
	foreach ( $set as $text => $path ) {
		if ( hvl_route_live( $path ) ) {
			$items[] = hvl_a( $path, $text );
		}
	}
	if ( count( $items ) > 1 ) {
		$last = array_pop( $items );
		return implode( ', ', $items ) . ' và ' . $last;
	}
	return implode( '', $items );
};

/** Bài $path => [href, tiêu đề] nếu tồn tại. */
$post_link = static function ( $path ) use ( $by_path ) {
	$id = $by_path[ rtrim( strtolower( $path ), '/' ) ] ?? 0;
	return $id ? array( strtolower( rtrim( $path, '/' ) ), get_the_title( $id ) ) : null;
};

$build_outro = static function ( $row, $c, $keep_sibs = '' ) use ( $route_sets, $link_list, $post_link ) {
	$cluster = hvl_cluster( $row, $c );
	$sibs    = array();
	foreach ( array( 'sibling_1', 'sibling_2' ) as $k ) {
		$l = $c && '' !== $c[ $k ] ? $post_link( $c[ $k ] ) : null;
		if ( $l ) {
			$sibs[] = '<a href="' . esc_attr( $l[0] ) . '">' . esc_html( hvl_plain( $l[1] ) ) . '</a>';
		}
	}
	if ( '' !== $keep_sibs ) {
		$sibs = array( $keep_sibs ); // dựng lại khối nhưng giữ nguyên danh sách bài cùng chủ đề đang có
	}
	return '<p class="hv-context-outro"><strong>Đặt vé và liên hệ <a href="/">Hãng xe Hải Vân</a>:</strong> Đặt trực tuyến '
		. $link_list( $route_sets( $cluster ) ) . ' (Hotline: <strong>1900 6763</strong>).'
		. ( $sibs ? ' Xem thêm bài viết cùng chủ đề: ' . implode( ' | ', $sibs ) . '.' : '' ) . '</p>';
};

$build_context = static function ( $row, $c ) use ( $route_sets, $link_list ) {
	$cluster = hvl_cluster( $row, $c );
	$title   = esc_html( hvl_plain( hvc_visible( $row->post_title ) ) );
	$lead    = in_array( $cluster, array( 'vung-tau', 'ho-chi-minh' ), true )
		? "Gợi ý di chuyển cho hành trình $title:"
		: ( 'tin_tuc' === $cluster ? 'Đặt vé trực tuyến tại <a href="/">Hãng xe Hải Vân</a>:' : "Đồng hành cùng <a href=\"/\">Hãng xe Hải Vân</a> trên chuyến đi $title:" );
	return '<p class="hv-context-link"><em><strong>' . $lead . '</strong> Đặt vé ' . $link_list( $route_sets( $cluster ) ) . ' tại <a href="/"><strong>Hãng xe Hải Vân</strong></a>.</em></p>';
};

/** Chèn $block sau </p> đầu tiên mà tổng chữ hiển thị đứng trước đạt $min ký tự; không có thì chèn vào cuối (trước shortcode cuối). */
$insert_after_visible = static function ( $html, $block, $min ) {
	if ( preg_match_all( '#</p>#i', $html, $m, PREG_OFFSET_CAPTURE ) ) {
		$prev = 0;
		$sum  = 0;
		foreach ( $m[0] as $e ) {
			$end  = $e[1] + 4;
			$sum += mb_strlen( hvc_visible( substr( $html, $prev, $end - $prev ) ) );
			$prev = $end;
			if ( $sum >= $min ) {
				return substr( $html, 0, $end ) . "\r\n\r\n" . $block . substr( $html, $end );
			}
		}
	}
	return null;
};

/** Thêm khối vào cuối bài, trước các shortcode [haivan_cta ...] đứng cuối. */
$append_before_tail = static function ( $html, $block ) {
	if ( preg_match( '#(\s*(?:\[haivan_cta[^\]]*\]\s*)+)$#', $html, $m, PREG_OFFSET_CAPTURE ) ) {
		return substr( $html, 0, $m[0][1] ) . "\r\n\r\n" . $block . $m[0][0];
	}
	return rtrim( $html ) . "\r\n\r\n" . $block;
};

/** Chuẩn hoá khối context đã có: bỏ emoji/mũi tên, link Mộc Châu sang landing tuyến. */
$normalize_blocks = static function ( $html, $id ) use ( $run ) {
	return preg_replace_callback(
		'#<p class="hv-context-(?:link|outro)">.*?</p>#s',
		static function ( $m ) use ( $run, $id ) {
			$b = $m[0];
			$b = preg_replace( '/\s*[\x{2190}-\x{21FF}]\s*/u', ' – ', $b ); // mũi tên trong chữ liên kết
			$b = preg_replace( '/[\x{1F000}-\x{1FFFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}\x{200D}]\s*/u', '', $b );
			$b = preg_replace( '#\s+(</(?:a|strong|em)>)#', '$1', $b ); // chữ cuối liên kết sót dấu cách sau khi bỏ emoji
			$b = preg_replace( '#\s+:</strong>#', ':</strong>', $b );
			$b = preg_replace( '#(<(?:em|strong)>)\s+#', '$1', $b );
			$b = preg_replace( '#(<p class="hv-context-(?:link|outro)">)\s+#', '$1', $b );
			if ( hvl_route_live( '/xe-khach/my-dinh/moc-chau' ) ) {
				$b = str_replace( 'href="/diem-den/moc-chau"', 'href="/xe-khach/my-dinh/moc-chau"', $b );
			}
			if ( $b !== $m[0] ) {
				$run->hit( 'khoi-context-chuan-hoa', $id );
				$run->sample( 'khoi-context-chuan-hoa', $id, $m[0], $b );
			}
			return $b;
		},
		$html
	);
};

/**
 * Link tự trỏ về chính bài: bỏ thẻ <a> trong thân bài (giữ chữ); trong khối "Xem thêm bài viết cùng chủ đề" bỏ mục trỏ về chính bài
 * hoặc lặp đích. Khối rỗng thì bỏ cả câu.
 */
$clean_self = static function ( $html, $self, $id ) use ( $run ) {
	$parts = preg_split( '#(<p class="hv-context-(?:link|outro)">.*?</p>)#s', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	foreach ( $parts as $i => $part ) {
		if ( 0 === $i % 2 ) { // thân bài
			$parts[ $i ] = preg_replace_callback(
				'#<a\b([^>]*)>((?:(?!<a\b).)*?)</a>#is',
				static function ( $m ) use ( $self, $run, $id ) {
					if ( preg_match( '#(?<![\w-])href\s*=\s*(["\'])(.*?)\1#is', $m[1], $h ) && strtolower( rtrim( (string) strtok( html_entity_decode( $h[2] ), '?#' ), '/' ) ) === $self ) {
						$run->hit( 'link-tu-tro-bo', $id );
						return $m[2];
					}
					return $m[0];
				},
				$part
			);
		} elseif ( false !== strpos( $part, 'hv-context-outro' ) && preg_match( '#^(<p class="hv-context-outro">.*?)\s?Xem thêm bài viết cùng chủ đề: (.*)\.</p>$#s', $part, $m ) ) {
			preg_match_all( '#<a href="([^"]+)">.*?</a>#s', $m[2], $links, PREG_SET_ORDER );
			$seen = array();
			$keep = array();
			foreach ( $links as $l ) {
				$h = strtolower( rtrim( html_entity_decode( $l[1] ), '/' ) );
				if ( $h === $self || isset( $seen[ $h ] ) ) {
					continue;
				}
				$seen[ $h ] = true;
				$keep[]     = $l[0];
			}
			if ( count( $keep ) !== count( $links ) ) {
				$run->hit( 'khoi-cung-chu-de-don-lap', $id );
				$parts[ $i ] = $m[1] . ( $keep ? ' Xem thêm bài viết cùng chủ đề: ' . implode( ' | ', $keep ) . '.' : '' ) . '</p>';
			}
		}
	}
	return implode( '', $parts );
};

/* ---------------------------------------------------------------- chạy: biến đổi từng bài */
$types   = array( 'bai_viet', 'tin_tuc', 'diem_den', 'page' );
$pending = array(); // ID => array( dòng DB, nội dung mới )
$info    = array(); // ID bài viết/tin => thông tin để cân bằng link
foreach ( $run->posts( $types ) as $row ) {
	$id      = (int) $row->ID;
	$content = $link_fix( $row->post_content, $id );
	$is_art  = in_array( $row->post_type, array( 'bai_viet', 'tin_tuc' ), true ) && 'publish' === $row->post_status;
	if ( $is_art ) {
		$content = $link_brand_mentions( $content, $id );
		$content = $clean_self( $content, rtrim( strtolower( hvc_post_path( $id ) ), '/' ), $id );
		$c       = $csv[ strtolower( hvc_post_path( $id ) ) ] ?? null;
		$bridge  = '' !== hvl_bridge_type( $row, $c );

		if ( $rebuild ) {
			$content = preg_replace( '#\s*<p class="hv-context-(?:link|outro)">.*?</p>#s', '', $content );
		}
		$content = $normalize_blocks( $content, $id );

		if ( false === strpos( $content, 'hv-context-link' ) && false === strpos( $content, 'hv-seo-bridge' ) && ! $bridge ) {
			$new     = $insert_after_visible( $content, $build_context( $row, $c ), 150 );
			$content = null !== $new ? $new : $append_before_tail( $content, $build_context( $row, $c ) ); // bài ngắn: cuối bài, trước khối outro
			$run->hit( 'context-link-them', $id );
		}
		if ( 'ha-noi' === hvl_cluster( $row, $c ) && preg_match( '#<p class="hv-context-outro">(?:(?!</p>).)*href="/xe-khach/(?:quan-1/vung-tau|vung-tau/|tan-son-nhat/vung-tau)#s', $content ) ) {
			// Bài Hà Nội: khối cuối không dẫn sang Vũng Tàu; giữ danh sách bài cùng chủ đề đang có.
			$keep    = preg_match( '#Xem thêm bài viết cùng chủ đề: (.*)\.</p>#s', $content, $ks ) ? $ks[1] : '';
			$content = preg_replace( '#<p class="hv-context-outro">.*?</p>#s', str_replace( '$', '\\$', $build_outro( $row, $c, $keep ) ), $content, 1 );
			$run->hit( 'outro-ha-noi-bo-link-vung-tau', $id );
		}
		if ( false === strpos( $content, 'hv-context-outro' ) ) {
			$content = $append_before_tail( $content, $build_outro( $row, $c ) );
			$run->hit( 'context-outro-them', $id );
		}
		$info[ $id ] = array(
			'cluster' => hvl_cluster( $row, $c ),
			'csv'     => $c,
			'tok'     => hvl_tokens( $row->post_title ),
			'path'    => rtrim( strtolower( hvc_post_path( $id ) ), '/' ),
			'title'   => hvl_plain( hvc_visible( $row->post_title ) ),
		);
	}
	$pending[ $id ] = array( $row, $content );
}

/* ---------------------------------------------------------------- cân bằng link nội bộ giữa các bài */
$target_inbound = max( 1, (int) ( getenv( 'HV_RELINK_INBOUND' ) ?: 2 ) ); // mỗi bài được >= N bài khác trong cụm link tới
$article_links  = static function ( $html ) use ( $by_path ) {
	$out = array();
	if ( preg_match_all( '#<a\b[^>]*?(?<![\w-])href\s*=\s*(["\'])(.*?)\1#is', $html, $m ) ) {
		foreach ( $m[2] as $h ) {
			$h = strtolower( rtrim( strtok( html_entity_decode( $h ), '?#' ), '/' ) );
			if ( isset( $by_path[ $h ] ) ) {
				$out[ $by_path[ $h ] ] = true;
			}
		}
	}
	return $out;
};
$in  = array(); // ID bài => [ID bài link tới nó => true]
$out = array();
foreach ( $info as $id => $i ) {
	foreach ( $article_links( $pending[ $id ][1] ) as $target => $_ ) {
		if ( $target !== $id && isset( $info[ $target ] ) ) {
			$in[ $target ][ $id ] = true;
			$out[ $id ][ $target ] = true;
		}
	}
}
$sib_count = static function ( $html ) {
	return preg_match( '#Xem thêm bài viết cùng chủ đề: (.*)\.</p>#s', $html, $m ) ? substr_count( $m[1], '<a ' ) : 0;
};
$add_sibling = static function ( $html, $href, $title ) {
	$link = '<a href="' . esc_attr( $href ) . '">' . esc_html( $title ) . '</a>';
	if ( preg_match( '#(<p class="hv-context-outro">(?:(?!</p>).)*?Xem thêm bài viết cùng chủ đề: (?:(?!</p>).)*?)\.</p>#s', $html ) ) {
		return preg_replace( '#(<p class="hv-context-outro">(?:(?!</p>).)*?Xem thêm bài viết cùng chủ đề: (?:(?!</p>).)*?)\.</p>#s', '$1 | ' . str_replace( '$', '\\$', $link ) . '.</p>', $html, 1 );
	}
	return preg_replace( '#(<p class="hv-context-outro">(?:(?!</p>).)*?)</p>#s', '$1 Xem thêm bài viết cùng chủ đề: ' . str_replace( '$', '\\$', $link ) . '.</p>', $html, 1 );
};
$no_donor = array();
$ids      = array_keys( $info );
usort( $ids, static fn( $a, $b ) => array( count( $in[ $a ] ?? array() ), $a ) <=> array( count( $in[ $b ] ?? array() ), $b ) );
foreach ( $ids as $x ) {
	$need = $target_inbound - count( $in[ $x ] ?? array() );
	if ( $need <= 0 ) {
		continue;
	}
	$cands = array();
	foreach ( $info as $d => $di ) {
		if ( $d === $x || $di['cluster'] !== $info[ $x ]['cluster'] || isset( $out[ $d ][ $x ] ) || false === strpos( $pending[ $d ][1], 'hv-context-outro' ) ) {
			continue;
		}
		$related = ( $di['csv'] && in_array( strtolower( $di['csv']['sibling_1'] ), array( $info[ $x ]['path'] ), true ) )
			|| ( $di['csv'] && strtolower( $di['csv']['sibling_2'] ) === $info[ $x ]['path'] ) ? 0 : 1;
		$inter   = count( array_intersect( $di['tok'], $info[ $x ]['tok'] ) );
		$union   = count( array_unique( array_merge( $di['tok'], $info[ $x ]['tok'] ) ) );
		$sim     = $union ? $inter / $union : 0;
		$full    = $sib_count( $pending[ $d ][1] ) >= 3 ? 1 : 0;
		$cands[] = array( $full, $related, -round( $sim, 4 ), $sib_count( $pending[ $d ][1] ), $d );
	}
	sort( $cands );
	foreach ( array_slice( $cands, 0, $need ) as $cd ) {
		$d                      = $cd[4];
		$pending[ $d ][1]       = $add_sibling( $pending[ $d ][1], $info[ $x ]['path'], $info[ $x ]['title'] );
		$out[ $d ][ $x ]        = true;
		$in[ $x ][ $d ]         = true;
		$run->hit( 'link-cung-chu-de-bo-sung', $d );
	}
	if ( count( $cands ) < $need ) {
		$no_donor[] = $x;
	}
}

/* ---------------------------------------------------------------- ghi */
foreach ( $pending as $id => $pc ) {
	list( $row, $content ) = $pc;
	if ( $content !== $row->post_content ) {
		$run->sample( 'tong-hop', $id, $row->post_content, $content );
	}
	$run->commit( $row, array( 'post_content' => $content ) );
}

/* ---------------------------------------------------------------- kiểm tra (chỉ đọc, theo nội dung sẽ có sau khi ghi) */
if ( $report ) {
	$dead = array();
	foreach ( $pending as $id => $pc ) {
		if ( ! preg_match_all( '#<a\b[^>]*?(?<![\w-])href\s*=\s*(["\'])(.*?)\1#is', $pc[1], $hm ) ) {
			continue;
		}
		foreach ( $hm[2] as $h ) {
			$target = $map_href( $h );
			$t      = null === $target ? html_entity_decode( $h ) : $target;
			if ( false === $target ) {
				$dead[ $h ][] = $id;
			} elseif ( '/' === ( $t[0] ?? '' ) ) {
				$tp = strtolower( rtrim( strtok( $t, '?#' ), '/' ) );
				if ( '' !== $tp && ! isset( $by_path[ $tp ] ) && ! preg_match( '#^/(?:xe-khach|wp-content|assets|en/|app|tai-khoan|diem-den$)#', $tp ) ) {
					$dead[ '(không có trang) ' . $tp ][] = $id;
				}
			}
		}
	}
	foreach ( $dead as $h => $ids_ ) {
		$run->notes[] = sprintf( 'link chết còn lại: %s (%d bài: %s)', $h, count( array_unique( $ids_ ) ), implode( ',', array_slice( array_unique( $ids_ ), 0, 8 ) ) );
	}
	$hist = array( 0 => 0, 1 => 0, 2 => 0 );
	foreach ( array_keys( $info ) as $a ) {
		++$hist[ min( count( $in[ $a ] ?? array() ), 2 ) ];
	}
	$run->notes[] = sprintf( 'Bài viết/tin theo số bài khác link tới (sau khi ghi): 0 link=%d, 1 link=%d, >=2 link=%d (trên %d bài)%s', $hist[0], $hist[1], $hist[2], count( $info ), $no_donor ? '; không đủ bài cùng cụm để bù: ' . implode( ',', $no_donor ) : '' );
}

$run->finish();
