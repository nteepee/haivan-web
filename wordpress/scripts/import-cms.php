<?php
/**
 * wp eval-file /scripts/import-cms.php
 *
 * Đồng bộ nội dung biên tập từ CMS cũ (cms.haivan.com) sang WordPress, CHỈ bằng GET tới API công khai
 * (không trang admin, không đăng nhập, không ghi vào CMS). Chạy lại được (idempotent + tăng dần).
 *
 *   api/location(+/<slug>?page=N)  -> CPT diem_den (trang điểm đến) + term hv_location
 *   api/news(+/<slug>)             -> CPT bai_viet (/diem-den/<điểm>/<slug>), tags -> hv_tag
 *   api/get-news(+/<slug>)         -> CPT tin_tuc  (/chung-toi/bao-chi-tin-tuc/<slug>)
 *   api/promotion-listing/-detail  -> CPT uu_dai   (/uu-dai/<id>)
 * Ảnh đại diện + ảnh/tài liệu trong nội dung từ host Hải Vân được đưa vào Media (dedupe theo URL nguồn) và URL
 * trong nội dung được viết lại sang bản local. Nội dung đi qua hvs_clean_html (kses + allowlist iframe CTA/YouTube).
 *
 * Bảo vệ việc của MKT: dùng dấu hv_imported_hash/hv_imported_at (lib/helpers.php). Bài MKT đã sửa, đã gỡ xuống/nháp
 * hoặc chưa rõ nguồn bị BỎ QUA và liệt kê cuối báo cáo; bài trong thùng rác không bao giờ tạo lại (kể cả FORCE).
 * Mỗi bài còn lưu hv_cms_fp (dấu vân tay dữ liệu CMS đã nhập): CMS không đổi => không làm gì.
 *
 * Biến môi trường (docker compose --profile tools run --rm -T -e NAME=value wpcli eval-file /scripts/import-cms.php):
 *   HV_CMS_MODE=all        fetch (chỉ tải JSON vào cache) | measure (đo dung lượng ảnh bằng GET Range, không tải) |
 *                          import (đọc cache + ghi WP, vẫn tải phần còn thiếu) | all (= fetch rồi import, mặc định)
 *   HV_CMS_OFFLINE=0       1 = không gọi API, chỉ dùng cache JSON (ảnh chưa có thì bỏ qua, trừ khi HV_CMS_FILES_ONLINE=1)
 *   HV_CMS_FILES_ONLINE=0  1 = khi offline vẫn tải ảnh/tệp còn thiếu
 *   HV_CMS_REFRESH=0       1 = bỏ cache chi tiết, tải lại hết
 *   HV_CMS_DELAY_MS=1200   giãn cách giữa hai request API (CMS giới hạn 60 req/phút)
 *   HV_CMS_FILE_DELAY_MS=250  giãn cách giữa hai request ảnh
 *   HV_CMS_NEWS_TTL_H=24   tải lại chi tiết tin công ty sau N giờ (danh sách tin không có nội dung để so sánh)
 *   HV_CMS_CACHE=/cms-cache  thư mục cache (wordpress/data/cms-cache)
 *   HV_IMPORT_SIDELOAD=1   0 = không tải ảnh (giữ URL cms.haivan.com)
 *   HV_IMPORT_FORCE=0      1 = ghi đè cả bài MKT đã sửa/gỡ xuống (trừ thùng rác)
 *   HV_IMPORT_LIMIT=0      giới hạn số bài mỗi loại (thử nghiệm)
 *   HV_CMS_RETRY_FAILED=0  1 = thử lại ảnh từng bị 404/403
 *   HV_CMS_TYPES=all       danh sách ngăn bởi dấu phẩy: diem_den,bai_viet,tin_tuc,uu_dai
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/cms-source.php';
require_once __DIR__ . '/lib/cms-media.php';

/** Tăng khi cách ánh xạ dữ liệu CMS -> WP đổi (buộc các bài chưa bị MKT sửa được ghi lại theo cách mới). */
const HVC_MAP_VERSION = '5';

add_filter( 'wp_revisions_to_keep', '__return_zero' ); // ghi của script không sinh bản sửa đổi.
if ( function_exists( 'wp_defer_term_counting' ) ) {
	wp_defer_term_counting( true );
}

$env = static function ( $k, $d ) {
	$v = getenv( $k );
	return false === $v || '' === $v ? $d : $v;
};
$mode     = (string) $env( 'HV_CMS_MODE', 'all' );
$force    = '1' === (string) $env( 'HV_IMPORT_FORCE', '0' );
$sideload = '0' !== (string) $env( 'HV_IMPORT_SIDELOAD', '1' );
$limit    = (int) $env( 'HV_IMPORT_LIMIT', 0 );
$types    = 'all' === (string) $env( 'HV_CMS_TYPES', 'all' ) ? array( 'diem_den', 'bai_viet', 'tin_tuc', 'uu_dai' ) : array_map( 'trim', explode( ',', (string) $env( 'HV_CMS_TYPES', '' ) ) );
if ( ! in_array( $mode, array( 'all', 'fetch', 'measure', 'import' ), true ) ) {
	WP_CLI::error( 'HV_CMS_MODE phải là all|fetch|measure|import' );
}
if ( 'measure' !== $mode && ! hvs_has_polylang() ) {
	WP_CLI::error( 'Cần Polylang (chạy setup.sh trước).' );
}

$client = new HV_Cms_Client(
	array(
		'cache_dir'     => $env( 'HV_CMS_CACHE', '/cms-cache' ),
		'api_delay_ms'  => (int) $env( 'HV_CMS_DELAY_MS', 1200 ),
		'file_delay_ms' => (int) $env( 'HV_CMS_FILE_DELAY_MS', 250 ),
		'offline'       => '1' === (string) $env( 'HV_CMS_OFFLINE', '0' ),
		'refresh'       => '1' === (string) $env( 'HV_CMS_REFRESH', '0' ),
		'files_online'  => '1' === (string) $env( 'HV_CMS_FILES_ONLINE', '0' ),
	)
);
$log = static function ( $m ) {
	WP_CLI::log( '[' . gmdate( 'H:i:s' ) . '] ' . $m );
};
$t0 = microtime( true );

/* ======================================================================
 * 1. Thu thập (danh sách + chi tiết, có cache)
 * ==================================================================== */
$log( '== Danh sách từ CMS' . ( $client->offline ? ' (offline: chỉ cache)' : '' ) );
$lists = hvc_collect_lists( $client, $log );
if ( ! $lists['locations'] && ! $lists['api_news'] && ! $lists['get_news'] ) {
	WP_CLI::error( 'Không có dữ liệu từ CMS (mạng lỗi và cache trống).' );
}
$log( '== Chi tiết' );
$data = hvc_fetch_details( $client, $lists, $log, (int) $env( 'HV_CMS_NEWS_TTL_H', 24 ) );
$log( sprintf( 'Mạng: %d request, %.1f MB, %d thử lại, %d lỗi; cache dùng lại: %d', $client->stats['requests'], $client->stats['bytes'] / 1048576, $client->stats['retries'], count( $client->stats['failed'] ), $client->stats['cache_hits'] ) );
foreach ( $client->stats['failed'] as $u => $why ) {
	WP_CLI::warning( "GET $u: $why" );
}

/** Ảnh đại diện/trong nội dung của một bản ghi -> danh sách URL (cho đo dung lượng). */
$collect_assets = static function () use ( $lists, $data ) {
	$feat = array();
	$cont = array();
	$docs = array();
	$ext  = 0;
	$add  = static function ( $html ) use ( &$cont, &$docs, &$ext ) {
		$a    = hvc_content_assets( (string) $html );
		$cont = array_merge( $cont, $a['images'] );
		$docs = array_merge( $docs, $a['docs'] );
		$ext += count( $a['external'] );
	};
	foreach ( $lists['locations'] as $loc ) {
		if ( $u = hvc_asset_url( $loc['image'] ?? '' ) ) {
			$feat[] = $u;
		}
	}
	foreach ( $data['posts'] as $r ) {
		$p = $r['detail']['post'] ?? array_merge( $r['list'] ?? array(), $r['api'] ?? array() );
		if ( $u = hvc_asset_url( $p['image'] ?? '' ) ) {
			$feat[] = $u;
		}
		$add( $p['content'] ?? '' );
	}
	foreach ( $data['news'] as $r ) {
		$p = $r['detail']['data_news_detail'] ?? $r['list'];
		if ( $u = hvc_asset_url( $p['image'] ?? '' ) ) {
			$feat[] = $u;
		}
		$add( $p['content'] ?? '' );
	}
	return array(
		'featured' => array_values( array_unique( $feat ) ),
		'content'  => array_values( array_unique( $cont ) ),
		'docs'     => array_values( array_unique( $docs ) ),
		'external' => $ext,
	);
};

if ( 'fetch' === $mode ) {
	WP_CLI::success( sprintf( 'Đã tải cache: %d bài điểm đến, %d tin, %d điểm đến, %d ưu đãi (%.0fs).', count( $data['posts'] ), count( $data['news'] ), count( $lists['locations'] ), count( $data['promos'] ), microtime( true ) - $t0 ) );
	return;
}

/* ======================================================================
 * 2. Đo dung lượng ảnh (GET Range 0-0, không tải ảnh)
 * ==================================================================== */
if ( 'measure' === $mode ) {
	$assets = $collect_assets();
	$all    = array_values( array_unique( array_merge( $assets['featured'], $assets['content'], $assets['docs'] ) ) );
	$log( sprintf( 'URL riêng biệt: %d (đại diện %d, trong nội dung %d, tài liệu %d); ảnh host ngoài (không tải): %d', count( $all ), count( $assets['featured'] ), count( $assets['content'] ), count( $assets['docs'] ), $assets['external'] ) );
	$sizes_file = $client->cache_dir . '/asset-sizes.json';
	$sizes      = is_file( $sizes_file ) ? json_decode( (string) file_get_contents( $sizes_file ), true ) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions
	$sizes      = is_array( $sizes ) ? $sizes : array();
	$n          = 0;
	foreach ( $all as $u ) {
		if ( isset( $sizes[ $u ] ) && 200 !== (int) ( $sizes[ $u ]['status'] ?? 0 ) && 206 !== (int) ( $sizes[ $u ]['status'] ?? 0 ) && 404 !== (int) ( $sizes[ $u ]['status'] ?? 0 ) ) {
			unset( $sizes[ $u ] ); // lỗi tạm: đo lại.
		}
		if ( isset( $sizes[ $u ] ) ) {
			continue;
		}
		$sizes[ $u ] = $client->probe_size( $u );
		if ( 0 === ++$n % 100 ) {
			$client->write_file( $sizes_file, (string) wp_json_encode( $sizes, JSON_UNESCAPED_SLASHES ) );
			$log( "  đã đo $n URL mới" );
		}
	}
	$client->write_file( $sizes_file, (string) wp_json_encode( $sizes, JSON_UNESCAPED_SLASHES ) );
	$tot = array( 'ok' => 0, 'bytes' => 0, 'missing' => 0, 'error' => 0, 'unknown' => 0 );
	$big = array();
	$set = array_flip( $all );
	foreach ( array_intersect_key( $sizes, $set ) as $u => $s ) {
		$st = (int) $s['status'];
		if ( 200 === $st || 206 === $st ) {
			++$tot['ok'];
			$tot['bytes'] += (int) $s['bytes'];
			$tot['unknown'] += 0 === (int) $s['bytes'] ? 1 : 0;
			$big[ $u ] = (int) $s['bytes'];
		} elseif ( in_array( $st, array( 403, 404, 410 ), true ) ) {
			++$tot['missing'];
		} else {
			++$tot['error'];
		}
	}
	arsort( $big );
	WP_CLI::log( sprintf( 'ĐO: %d URL; tải được %d (%.1f MB = %.2f GB), thiếu(404/403) %d, lỗi tạm %d, không rõ dung lượng %d', count( $all ), $tot['ok'], $tot['bytes'] / 1048576, $tot['bytes'] / 1073741824, $tot['missing'], $tot['error'], $tot['unknown'] ) );
	foreach ( array_slice( $big, 0, 5, true ) as $u => $b ) {
		WP_CLI::log( sprintf( '  lớn nhất: %.1f MB %s', $b / 1048576, $u ) );
	}
	WP_CLI::success( sprintf( 'Đo xong (%.0fs, %d request).', microtime( true ) - $t0, $client->stats['requests'] ) );
	return;
}

/* ======================================================================
 * 3. Ghi vào WP
 * ==================================================================== */
global $wpdb;
$media = new HV_Cms_Media( $client, $sideload, '1' === (string) $env( 'HV_CMS_RETRY_FAILED', '0' ) );
$log( sprintf( 'Media đã biết (dedupe): %d', $media->known() ) );

$stats = array();
foreach ( array( 'diem_den', 'bai_viet', 'tin_tuc', 'uu_dai' ) as $t ) {
	$stats[ $t ] = array( 'created' => 0, 'updated' => 0, 'unchanged' => 0, 'kept' => 0, 'failed' => 0, 'draft' => 0, 'seen' => 0 );
}
$kept   = array(); // "loại #id slug" => lý do.
$errors = array();
$notes  = array(); // ghi chú dữ liệu (slug trùng...).
$tagmap = array();

/** Chuẩn hoá thời điểm CMS ('YYYY-MM-DD HH:MM:SS' giờ VN, hoặc ISO UTC) -> giờ site, không ở tương lai. */
$cms_date = static function ( $published, $created = '' ) {
	$published = trim( (string) $published );
	if ( preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $published ) ) {
		$d = $published;
	} elseif ( '' !== trim( (string) $created ) && false !== strtotime( (string) $created ) ) {
		$d = get_date_from_gmt( gmdate( 'Y-m-d H:i:s', strtotime( (string) $created ) ) );
	} else {
		$d = current_time( 'mysql' );
	}
	$now = current_time( 'mysql' );
	return $d > $now ? $now : $d; // ngày tương lai làm WP chuyển sang "lên lịch" (không còn 200).
};

/** Tìm bài theo id CMS, kể cả thùng rác. */
$find_old = static function ( $type, $old_id ) use ( $wpdb ) {
	$id = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->prepare(
			"SELECT p.ID FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = 'hv_old_id' AND m.meta_value = %s WHERE p.post_type = %s AND p.post_status NOT IN ('auto-draft','inherit') ORDER BY p.ID ASC LIMIT 1",
			(string) $old_id,
			$type
		)
	);
	return $id ? (int) $id : 0;
};

/** Term hv_tag theo slug CMS. */
$tag_term = static function ( $slug, $name ) use ( &$tagmap ) {
	$slug = sanitize_title( (string) $slug );
	if ( '' === $slug ) {
		return 0;
	}
	if ( isset( $tagmap[ $slug ] ) ) {
		return $tagmap[ $slug ];
	}
	$t = get_term_by( 'slug', $slug, 'hv_tag' );
	if ( ! $t ) {
		$r = wp_insert_term( hvs_clean_text( $name ) ?: $slug, 'hv_tag', array( 'slug' => $slug ) );
		$tagmap[ $slug ] = is_wp_error( $r ) ? 0 : (int) $r['term_id'];
	} else {
		$tagmap[ $slug ] = (int) $t->term_id;
	}
	return $tagmap[ $slug ];
};

/**
 * Tạo/cập nhật một bản ghi CMS thành bài WP.
 *
 * @param string               $type   CPT.
 * @param string               $old_id Id CMS (meta hv_old_id).
 * @param string               $fp     Dấu vân tay dữ liệu CMS.
 * @param array<string,mixed>  $rec    title, slug, content, excerpt, date, status(publish|draft), menu_order?, image (URL chuẩn hoá hoặc ''),
 *                                     meta (array k=>v), seo_title, seo_desc, terms (taxonomy => ids), lang (vi|'' ).
 * @param bool                 $fp_ok  Dữ liệu đầy đủ (false: chi tiết lỗi, dùng danh sách; lần sau thử lại).
 * @return string created|updated|unchanged|kept|failed
 */
$upsert = static function ( $type, $old_id, $fp, array $rec, $fp_ok = true ) use ( &$stats, &$kept, &$errors, &$notes, $find_old, $force, $media, $cms_date, $wpdb ) {
	++$stats[ $type ]['seen'];
	$label = "$type #$old_id {$rec['slug']}";
	$id    = $find_old( $type, $old_id );
	// '!' = chi tiết lỗi (lần sau thử lại); '~' = chạy không tải ảnh (lần sau có ảnh sẽ cập nhật tiếp, nếu MKT chưa sửa).
	$stamp_fp = $fp . '@' . HVC_MAP_VERSION . ( $fp_ok ? '' : '!' ) . ( $media->enabled ? '' : '~' );
	if ( $id && ! $force && (string) get_post_meta( $id, 'hv_cms_fp', true ) === $stamp_fp ) {
		++$stats[ $type ]['unchanged'];
		return 'unchanged';
	}
	// Bài do script giữ ở nháp vì CMS chưa xuất bản vẫn được cập nhật (vd. CMS xuất bản sau).
	$extra = '0' === (string) get_post_meta( $id, 'hv_cms_status', true ) ? array( 'draft' ) : array();
	list( $ok, $why ) = hvs_may_overwrite( $id, $force, $extra );
	if ( ! $ok ) {
		++$stats[ $type ]['kept'];
		$kept[ $label ] = $why;
		return 'kept';
	}

	$title   = hvs_clean_text( $rec['title'] );
	$content = hvs_clean_html( $media->rewrite_content( (string) $rec['content'], $title ) );
	$post    = array(
		'post_type'    => $type,
		'post_title'   => $title,
		'post_content' => $content,
		'post_excerpt' => hvs_clean_text( $rec['excerpt'] ),
		'post_status'  => $rec['status'],
		'post_date'    => $rec['date'],
		'menu_order'   => (int) ( $rec['menu_order'] ?? 0 ),
	);
	// GMT đi cùng ngày giờ CMS (nếu để core tự suy, wp_update_post giữ GMT cũ khi ngày đổi; nháp có ngày "nổi").
	$post['post_date_gmt'] = 'publish' === $rec['status'] ? get_gmt_from_date( $rec['date'] ) : '0000-00-00 00:00:00';
	$slug    = (string) $rec['slug'];
	$lower   = strtolower( $slug );
	if ( $id ) {
		$post['ID'] = $id;
		// Slug CMS đổi (và MKT chưa đổi slug WP): theo CMS.
		$prev = (string) get_post_meta( $id, 'hv_cms_slug', true );
		if ( '' !== $prev && $prev !== $lower && get_post_field( 'post_name', $id ) === $prev ) {
			$post['post_name'] = sanitize_title( $slug );
		}
		$res = wp_update_post( wp_slash( $post ), true );
	} else {
		$post['post_name']   = sanitize_title( $slug );
		$post['post_author'] = 1;
		$res                 = wp_insert_post( wp_slash( $post ), true );
	}
	if ( is_wp_error( $res ) || ! $res ) {
		++$stats[ $type ]['failed'];
		$errors[ $label ] = is_wp_error( $res ) ? $res->get_error_message() : 'wp_insert_post trả 0';
		return 'failed';
	}
	$pid     = (int) $res;
	$created = ! $id;
	// Slug lưu theo sanitize_title (chữ thường; bỏ "&" và "-" đầu/cuối). Không khôi phục slug "nguyên văn" của CMS: WP cũng
	// chuẩn hoá đường dẫn yêu cầu bằng sanitize_title_for_query nên /…/j&t-… và /…/…-nao- vẫn khớp, còn slug lưu
	// nguyên văn (vd. kết thúc bằng "-") lại không bao giờ khớp được.
	$now_name = (string) get_post_field( 'post_name', $pid );
	if ( $now_name !== sanitize_title( $slug ) ) {
		$notes[] = "$label: slug WP '$now_name' khác slug CMS '$slug'" . ( $created ? ' (slug trùng bài khác)' : '' );
	}

	update_post_meta( $pid, 'hv_old_id', (string) $old_id );
	update_post_meta( $pid, 'hv_cms_slug', $lower );
	update_post_meta( $pid, 'hv_cms_status', 'publish' === $rec['status'] ? '1' : '0' );
	foreach ( (array) ( $rec['meta'] ?? array() ) as $k => $v ) {
		if ( '' === (string) $v ) {
			delete_post_meta( $pid, $k );
		} else {
			update_post_meta( $pid, $k, wp_slash( is_string( $v ) ? hvs_clean_text( $v ) : $v ) );
		}
	}
	foreach ( array( 'rank_math_title' => 'seo_title', 'rank_math_description' => 'seo_desc' ) as $mk => $rk ) {
		$v = hvs_clean_text( (string) ( $rec[ $rk ] ?? '' ) );
		if ( '' !== $v ) {
			update_post_meta( $pid, $mk, wp_slash( $v ) );
		}
	}
	foreach ( (array) ( $rec['terms'] ?? array() ) as $tax => $term_ids ) {
		wp_set_object_terms( $pid, array_map( 'intval', $term_ids ), $tax );
	}
	if ( ! empty( $rec['lang'] ) ) {
		pll_set_post_language( $pid, $rec['lang'] );
	}
	if ( '' !== (string) $rec['image'] ) {
		$cur = (int) get_post_thumbnail_id( $pid );
		$src = $cur ? (string) get_post_meta( $cur, 'hv_import_source', true ) : '';
		if ( ! $cur || hvc_asset_url( $src ) !== $rec['image'] ) {
			$att = $media->get( $rec['image'], $title );
			if ( $att ) {
				set_post_thumbnail( $pid, $att );
			}
		}
	}
	hvs_stamp_import( $pid );
	update_post_meta( $pid, 'hv_cms_fp', $stamp_fp );
	++$stats[ $type ][ $created ? 'created' : 'updated' ];
	if ( 'publish' !== $rec['status'] ) {
		++$stats[ $type ]['draft'];
	}
	return $created ? 'created' : 'updated';
};

/** Giải phóng bộ nhớ giữa các vòng lặp dài. */
$tick = static function ( $i, $total, $what ) use ( $log ) {
	if ( 0 === $i % 50 ) {
		wp_cache_flush();
		gc_collect_cycles();
		$log( sprintf( '  %s: %d/%d', $what, $i, $total ) );
	}
};

/* ---- 3a. Dọn mô hình cũ: bài điểm đến từng nhập nhầm thành tin_tuc (hv_old_id = dd-<id>) ---- */
$legacy = $wpdb->get_results( "SELECT p.ID, p.post_title FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = 'hv_old_id' AND m.meta_value LIKE 'dd-%' WHERE p.post_type = 'tin_tuc' AND p.post_status <> 'trash'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
$legacy_removed = 0;
foreach ( $legacy as $row ) {
	list( $ok, $why ) = hvs_may_overwrite( (int) $row->ID, $force );
	if ( $ok ) {
		wp_delete_post( (int) $row->ID, true );
		++$legacy_removed;
	} else {
		$kept[ "tin_tuc #{$row->ID} (nhập nhầm từ bài điểm đến, nên chuyển/xoá tay)" ] = $why;
	}
}
if ( $legacy_removed ) {
	$log( "Đã xoá $legacy_removed tin_tuc nhập nhầm từ bài điểm đến (nay là bai_viet)." );
}

/* ---- 3b. Điểm đến ---- */
$loc_by_id = array(); // id CMS => [slug, name].
foreach ( $lists['locations'] as $slug => $loc ) {
	$loc_by_id[ (string) $loc['id'] ] = array( 'slug' => strtolower( $slug ), 'name' => (string) $loc['name'] );
}
if ( in_array( 'diem_den', $types, true ) ) {
	$log( '== Điểm đến' );
	$n = 0;
	foreach ( $lists['locations'] as $slug => $loc ) {
		if ( $limit && ++$n > $limit ) {
			break;
		}
		$extra = $lists['loc_extra'][ $slug ]['location'] ?? array();
		$loc   = array_merge( $loc, is_array( $extra ) ? $extra : array() );
		$desc  = trim( (string) ( $loc['description'] ?? '' ) );
		$rec   = array(
			'title'      => (string) $loc['name'],
			'slug'       => (string) $slug,
			'content'    => '' !== $desc ? '<p>' . esc_html( $desc ) . '</p>' : '',
			'excerpt'    => $desc,
			'date'       => current_time( 'mysql' ),
			'status'     => 1 === (int) ( $loc['status'] ?? 1 ) ? 'publish' : 'draft',
			'menu_order' => isset( $loc['priority'] ) && is_numeric( $loc['priority'] ) ? (int) $loc['priority'] : 999,
			'image'      => (string) ( hvc_asset_url( $loc['image'] ?? '' ) ?: '' ),
			'meta'       => array(
				'hv_location_id'   => (string) $loc['id'],
				'hv_seo_keywords'  => (string) ( $loc['seo_keyword'] ?? '' ),
			),
			'seo_title'  => (string) $loc['name'],
			'seo_desc'   => $desc,
			'lang'       => 'vi',
		);
		$res   = $upsert( 'diem_den', (string) $loc['id'], hvc_fingerprint( $loc ), $rec );
		if ( in_array( $res, array( 'created', 'updated', 'unchanged' ), true ) ) {
			hv_ensure_location_term( strtolower( $slug ), (string) $loc['name'] );
		}
	}
}

/* ---- 3c. Bài viết theo điểm đến ---- */
if ( in_array( 'bai_viet', $types, true ) ) {
	$log( sprintf( '== Bài viết điểm đến (%d)', count( $data['posts'] ) ) );
	$i = 0;
	foreach ( $data['posts'] as $id => $r ) {
		if ( $limit && $i >= $limit ) {
			break;
		}
		$tick( ++$i, count( $data['posts'] ), 'bài' );
		$detail = $r['detail'];
		// Hai bài trùng slug (không phân biệt hoa thường): API chi tiết tra theo slug nên trả bài kia; bỏ bản chi tiết đó.
		if ( is_array( $detail ) && isset( $detail['post']['id'] ) && (string) $detail['post']['id'] !== (string) $id ) {
			$notes[] = "bai_viet #$id {$r['api']['slug']}: slug trùng bài #{$detail['post']['id']}, API chi tiết trả bài kia nên bỏ thẻ của bài này";
			$detail  = null;
		}
		$p      = is_array( $detail ) && ! empty( $detail['post'] ) ? $detail['post'] : array_merge( (array) $r['list'], (array) $r['api'] );
		if ( empty( $p['slug'] ) || empty( $p['title'] ) ) {
			++$stats['bai_viet']['failed'];
			$errors[ "bai_viet #$id" ] = 'thiếu slug/title';
			continue;
		}
		// Nội dung: danh sách api/news là nguồn đã so khớp dấu vân tay; chi tiết cùng nội dung.
		$content = (string) ( $p['content'] ?? ( $r['api']['content'] ?? '' ) );
		$lid     = (string) ( $p['location_id'] ?? ( $r['list']['location_id'] ?? '' ) );
		$loc     = $loc_by_id[ $lid ] ?? null;
		if ( ! $loc && ! empty( $r['list']['_loc_slug'] ) ) {
			$loc = array( 'slug' => strtolower( (string) $r['list']['_loc_slug'] ), 'name' => (string) $r['list']['_loc_slug'] );
		}
		$terms = array();
		if ( $loc ) {
			$term_id = hv_ensure_location_term( $loc['slug'], $loc['name'] );
			if ( $term_id ) {
				$terms['hv_location'] = array( $term_id );
			}
		} else {
			$errors[ "bai_viet #$id {$p['slug']}" ] = "không xác định được điểm đến (location_id=$lid): bài vẫn nhập, URL dùng /diem-den/tong-hop/";
		}
		$tag_ids = array();
		foreach ( (array) ( $detail['tags'] ?? array() ) as $tg ) {
			if ( ! empty( $tg['slug'] ) && ( $tid = $tag_term( $tg['slug'], (string) ( $tg['name'] ?? '' ) ) ) ) {
				$tag_ids[] = $tid;
			}
		}
		$terms['hv_tag'] = $tag_ids;
		$rec = array(
			'title'     => (string) $p['title'],
			'slug'      => (string) $p['slug'],
			'content'   => $content,
			'excerpt'   => (string) ( $p['description'] ?? '' ),
			'date'      => $cms_date( $p['published_at'] ?? '', $p['created_at'] ?? '' ),
			'status'    => 1 === (int) ( $p['status'] ?? 0 ) ? 'publish' : 'draft',
			'image'     => (string) ( hvc_asset_url( $p['image'] ?? '' ) ?: '' ),
			'meta'      => array(
				'hv_views'        => (string) ( $p['views_count'] ?? '' ),
				'hv_location_id'  => $lid,
				'hv_seo_keywords' => (string) ( $p['meta_keywords'] ?? '' ),
			),
			// meta_title của CMS đôi khi chỉ là slug (dữ liệu nhập lỗi): khi đó dùng tiêu đề bài.
			'seo_title' => ( '' === trim( (string) ( $p['meta_title'] ?? '' ) ) || 0 === strcasecmp( trim( (string) $p['meta_title'] ), (string) $p['slug'] ) ) ? (string) $p['title'] : (string) $p['meta_title'],
			'seo_desc'  => (string) ( $p['meta_desc'] ?? '' ),
			'terms'     => $terms,
			'lang'      => '',
		);
		$upsert( 'bai_viet', (string) $id, $r['fp'], $rec, is_array( $detail ) && ! empty( $detail['post'] ) );
	}
}

/* ---- 3d. Tin công ty ---- */
if ( in_array( 'tin_tuc', $types, true ) ) {
	$log( sprintf( '== Tin công ty (%d)', count( $data['news'] ) ) );
	$i = 0;
	foreach ( $data['news'] as $slug => $r ) {
		if ( $limit && $i >= $limit ) {
			break;
		}
		$tick( ++$i, count( $data['news'] ), 'tin' );
		$d = is_array( $r['detail'] ) && ! empty( $r['detail']['data_news_detail'] ) ? $r['detail']['data_news_detail'] : null;
		$p = $d ?: $r['list'];
		if ( empty( $p['id'] ) || empty( $p['title'] ) ) {
			++$stats['tin_tuc']['failed'];
			$errors[ "tin_tuc $slug" ] = 'thiếu id/title';
			continue;
		}
		$rec = array(
			'title'     => (string) $p['title'],
			'slug'      => (string) $p['slug'],
			'content'   => (string) ( $d['content'] ?? '' ),
			'excerpt'   => (string) ( $p['description'] ?? '' ),
			'date'      => $cms_date( $d['published_at'] ?? '', $d['created_at'] ?? '' ),
			// Web cũ liệt kê và phục vụ mọi tin trong api/get-news, kể cả status=0 (3 tin): luôn xuất bản.
			'status'    => 'publish',
			'image'     => (string) ( hvc_asset_url( $p['image'] ?? '' ) ?: '' ),
			'meta'      => array( 'hv_views' => (string) ( $d['views_count'] ?? '' ) ),
			'seo_title' => (string) $p['title'],
			'seo_desc'  => (string) ( $p['description'] ?? '' ),
			'lang'      => 'vi',
		);
		if ( ! $d ) {
			// Chi tiết lỗi: không có nội dung, đừng ghi đè bản đã có bằng bản rỗng.
			$errors[ "tin_tuc $slug" ] = 'chi tiết không tải được; bỏ qua lần này';
			++$stats['tin_tuc']['failed'];
			continue;
		}
		$upsert( 'tin_tuc', (string) $p['id'], $r['fp'] . hvc_fingerprint( array( 'c' => md5( (string) $d['content'] ), 'p' => $d['published_at'] ?? '' ) ), $rec );
	}
}

/* ---- 3e. Ưu đãi ---- */
if ( in_array( 'uu_dai', $types, true ) ) {
	$log( sprintf( '== Ưu đãi (%d)', count( $data['promos'] ) ) );
	foreach ( $data['promos'] as $id => $r ) {
		$d = is_array( $r['detail'] ) ? ( $r['detail']['data'] ?? $r['detail'] ) : array();
		$p = array_merge( (array) $r['list'], is_array( $d ) && ! array_is_list( $d ) ? $d : array() );
		if ( empty( $p['title'] ) ) {
			++$stats['uu_dai']['failed'];
			$errors[ "uu_dai #$id" ] = 'không nhận dạng được dữ liệu ưu đãi';
			continue;
		}
		$rec = array(
			'title'     => (string) $p['title'],
			'slug'      => (string) $id, // URL cũ: /uu-dai/<id>.
			'content'   => (string) ( $p['content'] ?? $p['description'] ?? '' ),
			'excerpt'   => (string) ( $p['description'] ?? '' ),
			'date'      => $cms_date( $p['publish_time'] ?? ( $p['published_at'] ?? '' ), $p['created_at'] ?? '' ),
			'status'    => isset( $p['status'] ) && ! (int) $p['status'] ? 'draft' : 'publish',
			'image'     => (string) ( hvc_asset_url( $p['image'] ?? '' ) ?: '' ),
			'meta'      => array(),
			'seo_title' => (string) $p['title'],
			'seo_desc'  => (string) ( $p['description'] ?? '' ),
			'lang'      => 'vi',
		);
		$upsert( 'uu_dai', (string) $id, $r['fp'], $rec );
	}
}

/* ---- 3f. Bản ghi WP không còn trong CMS (chỉ báo cáo, không xoá) ---- */
$orphans = array();
if ( $lists['complete'] && ! $limit ) {
	$present = array(
		'bai_viet' => array_keys( $data['posts'] ),
		'tin_tuc'  => array_map( static fn( $r ) => (string) ( $r['list']['id'] ?? '' ), $data['news'] ),
		'diem_den' => array_map( static fn( $l ) => (string) $l['id'], $lists['locations'] ),
	);
	foreach ( $present as $type => $ids ) {
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT p.ID, m.meta_value old FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = 'hv_old_id' WHERE p.post_type = %s AND p.post_status NOT IN ('trash','auto-draft')", $type ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$set  = array_flip( array_map( 'strval', $ids ) );
		foreach ( $rows as $row ) {
			if ( ! isset( $set[ (string) $row->old ] ) && 0 !== strpos( (string) $row->old, 'dd-' ) ) {
				$orphans[] = "$type #{$row->old} (WP ID {$row->ID})";
			}
		}
	}
}

if ( function_exists( 'wp_defer_term_counting' ) ) {
	wp_defer_term_counting( false );
}
flush_rewrite_rules( false );

/* ======================================================================
 * 4. Báo cáo
 * ==================================================================== */
WP_CLI::log( '' );
WP_CLI::log( '================ BÁO CÁO import-cms ================' );
foreach ( $stats as $t => $s ) {
	WP_CLI::log( sprintf( '%-9s thấy %4d | tạo %4d | cập nhật %4d | không đổi %4d | giữ nguyên (MKT sửa/gỡ/xoá) %3d | lỗi %3d | nháp %3d', $t, $s['seen'], $s['created'], $s['updated'], $s['unchanged'], $s['kept'], $s['failed'], $s['draft'] ) );
}
WP_CLI::log( sprintf( 'Ảnh: tải mới %d (%.1f MB), dùng lại %d, lỗi %d, bỏ qua %d, ảnh host ngoài giữ URL %d', $media->stats['downloaded'], $media->stats['bytes'] / 1048576, $media->stats['reused'], $media->stats['failed'], $media->stats['skipped'], $media->stats['external'] ) );
WP_CLI::log( sprintf( 'Mạng: %d request, %.1f MB, %d thử lại; thời gian %.0fs', $client->stats['requests'], $client->stats['bytes'] / 1048576, $client->stats['retries'], microtime( true ) - $t0 ) );
if ( $kept ) {
	WP_CLI::log( sprintf( 'Giữ nguyên %d bản ghi (HV_IMPORT_FORCE=1 để ép, trừ thùng rác):', count( $kept ) ) );
	foreach ( array_slice( $kept, 0, 40, true ) as $k => $why ) {
		WP_CLI::log( "  - $k: $why" );
	}
}
if ( $orphans ) {
	WP_CLI::log( sprintf( 'Có %d bài WP không còn trong CMS (không xoá): %s', count( $orphans ), implode( '; ', array_slice( $orphans, 0, 15 ) ) ) );
}
foreach ( array_slice( $notes, 0, 30 ) as $nline ) {
	WP_CLI::log( "ghi chú: $nline" );
}
if ( $media->errors ) {
	WP_CLI::log( sprintf( 'Ảnh/tệp không tải được: %d (xem thêm: %s/image-failures.json cho 404/403)', count( $media->errors ), $client->cache_dir ) );
	foreach ( array_slice( $media->errors, 0, 25, true ) as $u => $why ) {
		WP_CLI::log( "  - $u: $why" );
	}
}
foreach ( array_slice( $errors, 0, 30, true ) as $k => $why ) {
	WP_CLI::warning( "$k: $why" );
}
WP_CLI::success( 'Nhập CMS xong.' );
