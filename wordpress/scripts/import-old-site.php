<?php
/**
 * wp eval-file /scripts/import-old-site.php
 *
 * Nhập nội dung từ bản chụp web cũ (archive/old-site, chỉ đọc; compose gắn tại /archive):
 *   - Trang tĩnh   pages/<đường dẫn>.html          -> trang WP cùng slug (vi, và bản sao sang en)
 *   - Tin tức      pages/chung-toi/bao-chi-tin-tuc/*.next-data.json -> CPT tin_tuc    } chỉ khi HV_IMPORT_LEGACY_CONTENT=1:
 *   - Điểm đến     pages/diem-den/*.next-data.json -> CPT diem_den                      } nội dung biên tập nay lấy từ CMS
 *   - Ưu đãi       pages/uu-dai/*.next-data.json   -> CPT uu_dai (nếu có)               } bằng import-cms.php (đầy đủ hơn, có bai_viet)
 *   - Tuyến phổ biến pages/index.next-data.json (pageProps.list_route) -> CPT hv_route
 * Chịu được file thiếu (re-crawl chưa xong): bỏ qua và báo cuối.
 * Nội dung luôn đi qua hvs_clean_html (kses + allowlist iframe) vì WP-CLI không tự chạy kses.
 * Chạy lại an toàn cho MỌI loại bài (trang vi/en, tin tức, điểm đến, ưu đãi, tuyến phổ biến): mỗi bài được đóng dấu
 * (hv_imported_hash + hv_imported_at) khi script ghi; lần sau BỎ QUA bài nếu MKT đã sửa (post_modified_gmt > mốc hoặc
 * hash khác), không còn ở trạng thái publish, hoặc không rõ nguồn (chưa đóng dấu); bài trong thùng rác không bao giờ
 * được tạo lại (kể cả khi FORCE). Chỉ HV_IMPORT_FORCE=1 mới ghi đè bài MKT đã sửa / đã gỡ xuống.
 *
 * Biến môi trường (docker compose ... run -e NAME=value wpcli ...):
 *   HV_ARCHIVE=/archive/old-site   HV_IMPORT_SIDELOAD=1 (tải ảnh vào Media, chỉ GET từ cms.haivan.com)
 *   HV_IMPORT_EN=1 (bản sao nội dung trang tĩnh sang /en/)   HV_IMPORT_FORCE=0   HV_IMPORT_LIMIT=0 (giới hạn số bài mỗi loại, 0 = hết)
 *   HV_IMPORT_LEGACY_CONTENT=0 (1 = nhập tin tức/điểm đến/ưu đãi từ bản chụp; mặc định tắt vì import-cms.php thay thế và chạy lại
 *   script này sau import-cms.php sẽ ghi đè bài CMS bằng bản chụp cũ)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/html-extract.php';

// Ghi của script không sinh bản sửa đổi (mỗi lần chạy lại sẽ phình bảng posts); bản sửa đổi chỉ dành cho MKT.
add_filter( 'wp_revisions_to_keep', '__return_zero' );

$archive  = rtrim( getenv( 'HV_ARCHIVE' ) ?: '/archive/old-site', '/' );
$sideload = '0' !== (string) ( getenv( 'HV_IMPORT_SIDELOAD' ) ?: '1' );
$with_en  = '0' !== (string) ( getenv( 'HV_IMPORT_EN' ) ?: '1' );
$force    = '1' === (string) ( getenv( 'HV_IMPORT_FORCE' ) ?: '0' );
$limit    = (int) ( getenv( 'HV_IMPORT_LIMIT' ) ?: 0 );
$legacy   = '1' === (string) ( getenv( 'HV_IMPORT_LEGACY_CONTENT' ) ?: '0' );
$cms      = 'https://cms.haivan.com';

if ( ! is_dir( $archive . '/pages' ) ) {
	WP_CLI::error( "Không thấy $archive/pages (gắn archive/ vào /archive trong compose?)." );
}
if ( ! hvs_has_polylang() ) {
	WP_CLI::error( 'Cần Polylang (chạy setup.sh trước).' );
}
$manifest = require __DIR__ . '/lib/pages-manifest.php';

$stats = array(
	'pages'        => 0,
	'pages_kept'   => 0,
	'kept'         => array(), // bài bỏ qua vì MKT đã sửa/gỡ/xoá: "loại #id" => lý do.
	'pages_missing' => array(),
	'pages_noimg'  => array(),
	'news'         => 0,
	'destinations' => 0,
	'offers'       => 0,
	'routes'       => 0,
	'images'       => 0,
	'errors'       => array(),
);

/** Đọc JSON, null nếu thiếu/hỏng. */
$read_json = static function ( $file ) use ( &$stats ) {
	if ( ! is_file( $file ) ) {
		return null;
	}
	$d = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! is_array( $d ) ) {
		$stats['errors'][] = 'JSON hỏng: ' . basename( $file );
		return null;
	}
	return $d;
};

/** Đường dẫn ảnh CMS ("/userfiles/photos/165/a b.png" hoặc "images/2020/x.jpg") -> URL đã mã hoá. */
$cms_url = static function ( $path ) use ( $cms ) {
	$path = '/' . ltrim( preg_replace( '#/{2,}#', '/', (string) $path ), '/' );
	return $cms . implode( '/', array_map( 'rawurlencode', explode( '/', $path ) ) );
};

/** Gắn ảnh đại diện (tải từ CMS khi bật sideload). */
$set_cover = static function ( $post_id, $image_path, $alt ) use ( $sideload, $cms_url, &$stats ) {
	if ( ! $sideload || '' === (string) $image_path || has_post_thumbnail( $post_id ) ) {
		return;
	}
	$att = hvs_sideload( str_replace( '%2F', '/', $cms_url( $image_path ) ), $post_id, hvs_clean_text( $alt ) );
	if ( $att ) {
		set_post_thumbnail( $post_id, $att );
		++$stats['images'];
	}
};

/** Tìm bài CPT theo id cũ. */
$find_old = static function ( $type, $old_id ) {
	$f = get_posts(
		array(
			'post_type'        => $type,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ), // trash: không tạo lại bản MKT đã xoá.
			'meta_key'         => 'hv_old_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => (string) $old_id, // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts'      => 1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		)
	);
	return $f ? (int) $f[0] : 0;
};

/**
 * Tạo/cập nhật bài CPT (ngôn ngữ vi). Trả 0 (và ghi vào $stats['kept']) khi giữ nguyên bản hiện có.
 * Mọi trường văn bản được làm sạch ở đây để không đường nào bỏ sót.
 */
$upsert = static function ( $type, $old_id, array $post ) use ( $find_old, $force, &$stats ) {
	$id = $find_old( $type, $old_id );
	list( $ok, $why ) = hvs_may_overwrite( $id, $force );
	if ( ! $ok ) {
		$stats['kept'][ "$type #$old_id" ] = $why;
		return 0;
	}
	foreach ( array( 'post_title', 'post_excerpt' ) as $k ) {
		if ( isset( $post[ $k ] ) ) {
			$post[ $k ] = hvs_clean_text( $post[ $k ] );
		}
	}
	if ( isset( $post['post_content'] ) ) {
		$post['post_content'] = hvs_clean_html( $post['post_content'] );
	}
	$post = array_merge( array( 'post_type' => $type, 'post_status' => 'publish' ), $post );
	if ( $id ) {
		$post['ID'] = $id;
		unset( $post['post_name'] ); // giữ slug đã có (MKT có thể đã đổi).
		$res = wp_update_post( $post, true );
	} else {
		$post['post_author'] = 1;
		$res                 = wp_insert_post( $post, true );
	}
	if ( is_wp_error( $res ) ) {
		$stats['errors'][] = "$type #$old_id: " . $res->get_error_message();
		return 0;
	}
	$res = (int) $res;
	update_post_meta( $res, 'hv_old_id', (string) $old_id );
	pll_set_post_language( $res, 'vi' );
	return $res;
};

/** Đóng dấu sau khi mọi trường (meta, ảnh) đã ghi xong. */
$stamp = static function ( $post_id ) {
	hvs_stamp_import( (int) $post_id );
};

/* ======================================================================
 * 1. Trang tĩnh
 * ==================================================================== */
WP_CLI::log( '== Trang tĩnh' );
foreach ( array_keys( $manifest['pages'] ) as $path ) {
	$file = "$archive/pages/$path.html";
	if ( ! is_file( $file ) ) {
		$stats['pages_missing'][] = $path;
		continue;
	}
	$page_id = hvs_find_page( $path, 'vi' );
	if ( ! $page_id ) {
		$stats['errors'][] = "Chưa có trang WP cho $path (chạy seed-site.php)";
		continue;
	}
	$ex = hvi_extract_page( (string) file_get_contents( $file ), "$archive/assets" ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! $ex || '' === $ex['html'] ) {
		$stats['errors'][] = "Không trích được nội dung: $path";
		continue;
	}

	// Mỗi bản (vi, en) được kiểm riêng: bản en MKT đã dịch không bị ghi đè bằng nội dung vi.
	$targets = array( $page_id );
	if ( $with_en ) {
		$en = hvs_find_page( $path, 'en' );
		if ( $en ) {
			$targets[] = $en;
		}
	}
	$writable = array();
	foreach ( $targets as $tid ) {
		list( $ok, $why ) = hvs_may_overwrite( $tid, $force );
		if ( $ok ) {
			$writable[] = $tid;
		} else {
			++$stats['pages_kept'];
			$stats['kept'][ "page #$tid ($path)" ] = $why;
		}
	}
	if ( ! $writable ) {
		continue;
	}
	// Ảnh cục bộ (archive/assets) -> Media.
	$html = $ex['html'];
	foreach ( array_unique( $ex['images'] ) as $img ) {
		$att = hvs_sideload( $img, $page_id, '' ); // file cục bộ trong archive, không qua mạng.
		if ( $att ) {
			$html = str_replace( 'hv-local:' . esc_attr( $img ), wp_get_attachment_url( $att ), $html );
			++$stats['images'];
		}
	}
	$html = preg_replace( '#<img src="hv-local:[^"]*"[^>]*>#', '', $html ); // ảnh không nạp được: bỏ.
	if ( false === strpos( $html, '<img' ) ) {
		$stats['pages_noimg'][] = $path; // trang cũ có ảnh lazy-load không lưu được: MKT bổ sung.
	}
	$html = hvs_clean_html( $html );

	foreach ( $writable as $tid ) {
		wp_update_post( array( 'ID' => $tid, 'post_content' => $html ), true );
		if ( '' !== $ex['seo_title'] ) {
			update_post_meta( $tid, 'rank_math_title', hvs_clean_text( $ex['seo_title'] ) );
		}
		if ( '' !== $ex['seo_desc'] ) {
			update_post_meta( $tid, 'rank_math_description', hvs_clean_text( $ex['seo_desc'] ) );
		}
		$stamp( $tid );
	}
	++$stats['pages'];
}

/* ======================================================================
 * 2. Tin tức  (/chung-toi/bao-chi-tin-tuc/<slug>)
 * ==================================================================== */
WP_CLI::log( $legacy ? '== Tin tức' : '== Tin tức/Điểm đến/Ưu đãi: bỏ qua (dùng import-cms.php; HV_IMPORT_LEGACY_CONTENT=1 để nhập từ bản chụp)' );
$n = 0;
foreach ( $legacy ? ( glob( "$archive/pages/chung-toi/bao-chi-tin-tuc/*.next-data.json" ) ?: array() ) : array() as $f ) {
	if ( $limit && $n >= $limit ) {
		break;
	}
	$d = $read_json( $f );
	$a = $d['props']['pageProps']['news']['data_news_detail'] ?? null;
	if ( ! is_array( $a ) || empty( $a['slug'] ) || empty( $a['title'] ) ) {
		$stats['errors'][] = 'Tin thiếu dữ liệu: ' . basename( $f );
		continue;
	}
	$content = str_replace( 'https://cms.haivan.com//', 'https://cms.haivan.com/', (string) ( $a['content'] ?? '' ) );
	$id      = $upsert(
		'tin_tuc',
		$a['id'] ?? $a['slug'],
		array(
			'post_title'   => (string) $a['title'],
			'post_name'    => sanitize_title( (string) $a['slug'] ),
			'post_content' => $content,
			'post_excerpt' => (string) ( $a['description'] ?? '' ),
			'post_date'    => ! empty( $a['published_at'] ) ? (string) $a['published_at'] : current_time( 'mysql' ),
		)
	);
	if ( $id ) {
		$set_cover( $id, $a['image'] ?? '', (string) $a['title'] );
		$stamp( $id );
		++$stats['news'];
		++$n;
	}
}

/* ======================================================================
 * 3. Điểm đến  (/diem-den/<slug>)
 * ==================================================================== */
WP_CLI::log( '== Điểm đến' );
$n = 0;
foreach ( $legacy ? ( glob( "$archive/pages/diem-den/*.next-data.json" ) ?: array() ) : array() as $f ) {
	if ( $limit && $n >= $limit ) {
		break;
	}
	$d   = $read_json( $f );
	$loc = $d['props']['pageProps']['data']['location'] ?? null;
	if ( ! is_array( $loc ) || empty( $loc['slug'] ) || empty( $loc['name'] ) ) {
		continue;
	}
	$desc    = trim( (string) ( $loc['description'] ?? '' ) );
	$content = '' !== $desc ? '<p>' . esc_html( $desc ) . '</p>' : '';
	$id      = $upsert(
		'diem_den',
		$loc['id'] ?? $loc['slug'],
		array(
			'post_title'   => (string) $loc['name'],
			'post_name'    => sanitize_title( (string) $loc['slug'] ),
			'post_content' => $content,
			'post_excerpt' => $desc,
			'menu_order'   => -1 * (int) ( $loc['priority'] ?? 0 ),
		)
	);
	if ( $id ) {
		$set_cover( $id, $loc['image'] ?? '', (string) $loc['name'] );
		$stamp( $id );
		++$stats['destinations'];
		++$n;
	}
}

/* ======================================================================
 * 4. Ưu đãi  (/uu-dai/<id>)  — bản chụp hiện không có mẫu; nhận dạng linh hoạt nếu có
 * ==================================================================== */
foreach ( $legacy ? ( glob( "$archive/pages/uu-dai/*.next-data.json" ) ?: array() ) : array() as $f ) {
	$d = $read_json( $f );
	$p = $d['props']['pageProps'] ?? array();
	$o = $p['promotion'] ?? $p['data'] ?? $p['data_promotion'] ?? null;
	if ( is_array( $o ) && isset( $o['data'] ) && is_array( $o['data'] ) ) {
		$o = $o['data'];
	}
	$old = basename( $f, '.next-data.json' );
	if ( ! is_array( $o ) || empty( $o['title'] ) ) {
		$stats['errors'][] = 'Ưu đãi không nhận dạng được: ' . basename( $f );
		continue;
	}
	$id = $upsert(
		'uu_dai',
		$o['id'] ?? $old,
		array(
			'post_title'   => (string) $o['title'],
			'post_name'    => sanitize_title( (string) $old ),
			'post_content' => (string) ( $o['content'] ?? $o['description'] ?? '' ),
			'post_excerpt' => (string) ( $o['description'] ?? '' ),
		)
	);
	if ( $id ) {
		$set_cover( $id, $o['image'] ?? '', (string) $o['title'] );
		$stamp( $id );
		++$stats['offers'];
	}
}

/* ======================================================================
 * 5. Tuyến phổ biến trang chủ (list_route của __NEXT_DATA__ trang chủ cũ)
 * ==================================================================== */
WP_CLI::log( '== Tuyến phổ biến' );
$home = $read_json( "$archive/pages/index.next-data.json" );
$list = $home['props']['pageProps']['list_route'] ?? array();
$ord  = 0;
foreach ( is_array( $list ) ? $list : array() as $r ) {
	$slug = trim( (string) ( $r['slug'] ?? '' ), '/' );
	if ( ! hv_valid_route_path( $slug ) || empty( $r['name'] ) ) {
		continue;
	}
	$img = ! empty( $r['img_path'] ) && $sideload ? str_replace( '%2F', '/', $cms_url( $r['img_path'] ) ) : '';
	$res = '';
	$id  = hvs_upsert_route(
		array(
			'path'  => $slug,
			'name'  => (string) $r['name'],
			'price' => hvs_clean_text( (string) ( $r['price_avg'] ?? '' ) ),
			'time'  => hvs_clean_text( (string) ( $r['run_time'] ?? '' ) ),
			'order' => $ord++,
			'image' => $img,
		),
		$force,
		$res
	);
	if ( $id ) {
		++$stats['routes'];
	} elseif ( 'kept' === $res ) {
		$stats['kept'][ "hv_route $slug" ] = 'edited/removed';
	}
}

flush_rewrite_rules( false );

/* ---- Báo cáo ---- */
WP_CLI::log( '' );
WP_CLI::log( sprintf( 'Trang tĩnh nhập: %d (bản vi/en giữ nguyên vì MKT đã sửa/gỡ/xoá: %d)', $stats['pages'], $stats['pages_kept'] ) );
if ( $stats['kept'] ) {
	WP_CLI::log( sprintf( 'Giữ nguyên %d bài (không ghi đè; HV_IMPORT_FORCE=1 để ép, trừ thùng rác):', count( $stats['kept'] ) ) );
	foreach ( array_slice( $stats['kept'], 0, 30, true ) as $k => $why ) {
		WP_CLI::log( "  - $k: $why" );
	}
}
WP_CLI::log( sprintf( 'Tin tức: %d | Điểm đến: %d | Ưu đãi: %d | Tuyến phổ biến: %d | Ảnh vào Media: %d', $stats['news'], $stats['destinations'], $stats['offers'], $stats['routes'], $stats['images'] ) );
if ( $stats['pages_missing'] ) {
	WP_CLI::warning( 'Thiếu file HTML trong archive (re-crawl?): ' . implode( ', ', $stats['pages_missing'] ) );
}
if ( $stats['pages_noimg'] ) {
	WP_CLI::log( 'Trang không còn ảnh trong nội dung (ảnh web cũ nạp lười, không lưu được): ' . count( $stats['pages_noimg'] ) . ' trang - MKT bổ sung ảnh.' );
}
foreach ( array_slice( $stats['errors'], 0, 20 ) as $e ) {
	WP_CLI::warning( $e );
}
WP_CLI::success( 'Nhập xong.' );
