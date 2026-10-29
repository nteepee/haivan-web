<?php
/**
 * Thu thập dữ liệu biên tập từ API công khai của CMS (chỉ GET) cho import-cms.php.
 *
 * Endpoint (đọc từ bundle web cũ):
 *   api/location                    danh sách điểm đến
 *   api/location/<slug>?page=N      trang điểm đến: location, rightPosts, topPosts, Posts (phân trang 10/trang)
 *   api/news?page=N                 TẤT CẢ bài viết điểm đến, 20/trang, có content (không có location/published_at)
 *   api/news/<slug>                 chi tiết bài điểm đến: post, tags, page_title, rightPosts
 *   api/get-news                    tin công ty (danh sách đầy đủ, không phân trang)
 *   api/get-news/<slug>             chi tiết tin: data_news_detail
 *   api/promotion-listing, api/promotion-detail?id=   ưu đãi
 * Bài điểm đến: danh sách "Posts" của trang điểm đến cho meta (location_id, published_at, meta_*); danh sách
 * "api/news" cho nội dung; chi tiết cho tags. Hai danh sách không tăng views_count nên dùng để phát hiện thay đổi.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/cms-client.php';

/** Khoá trường hay đổi vì lượt xem, không tính vào dấu vân tay. */
const HVC_VOLATILE_KEYS = array( 'views_count', 'updated_at' );

/** Bỏ đệ quy các trường dao động vì lượt xem (views_count, updated_at tự đổi mỗi lần có người xem bài). */
function hvc_strip_volatile( $data ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}
	foreach ( HVC_VOLATILE_KEYS as $k ) {
		unset( $data[ $k ] );
	}
	foreach ( $data as $k => $v ) {
		if ( is_array( $v ) ) {
			$data[ $k ] = hvc_strip_volatile( $v );
		}
	}
	if ( ! array_is_list( $data ) ) {
		ksort( $data );
	}
	return $data;
}

/** md5 ổn định của dữ liệu (bỏ trường dao động). */
function hvc_fingerprint( $data ) {
	return md5( (string) wp_json_encode( hvc_strip_volatile( $data ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
}

/**
 * Dấu vân tay một bài điểm đến từ hai danh sách (không cần tải chi tiết).
 *
 * @param array<string,mixed>|null $l Mục trong danh sách trang điểm đến (meta; có thể null).
 * @param array<string,mixed>|null $a Mục trong api/news (nội dung; có thể null).
 */
function hvc_post_print( $l, $a ) {
	if ( is_array( $l ) ) {
		unset( $l['_loc_order'] ); // thứ tự đổi khi có bài mới, không phải thay đổi của bài.
	}
	if ( is_array( $a ) ) {
		$a['content'] = md5( (string) ( $a['content'] ?? '' ) );
	}
	return hvc_fingerprint( array( 'l' => is_array( $l ) ? $l : null, 'a' => is_array( $a ) ? $a : null ) );
}

/**
 * Tải toàn bộ danh sách.
 *
 * @param HV_Cms_Client $c   Client.
 * @param callable      $log fn(string).
 * @return array<string,mixed> locations, loc_extra, loc_posts (id=>item+_loc_slug), api_news (id=>item), get_news (slug=>item), promos, complete.
 */
function hvc_collect_lists( HV_Cms_Client $c, callable $log ) {
	$out = array(
		'locations' => array(), // slug => item.
		'loc_extra' => array(), // slug => [location, rightPosts, topPosts, total].
		'loc_posts' => array(), // id => item (+ _loc_slug).
		'api_news'  => array(), // id => item.
		'get_news'  => array(), // slug => item.
		'promos'    => array(), // id => item.
		'complete'  => true,    // false khi một danh sách không tải được (không kết luận "đã xoá").
	);

	$d = $c->api_json( 'api/location', 'lists', 'location' );
	if ( ! is_array( $d ) || ! isset( $d['data'] ) || ! is_array( $d['data'] ) ) {
		$out['complete'] = false;
		$log( 'LỖI: không tải được api/location' );
		return $out;
	}
	foreach ( $d['data'] as $loc ) {
		if ( ! empty( $loc['slug'] ) ) {
			$out['locations'][ (string) $loc['slug'] ] = $loc;
		}
	}
	$log( sprintf( 'Điểm đến: %d', count( $out['locations'] ) ) );

	foreach ( array_keys( $out['locations'] ) as $slug ) {
		$page = 1;
		$last = 1;
		do {
			$p = $c->api_json( 'api/location/' . rawurlencode( $slug ) . '?page=' . $page, 'lists', "location-$slug-p$page" );
			if ( ! is_array( $p ) || ! isset( $p['Posts']['data'] ) ) {
				$out['complete'] = false;
				$log( "LỖI: trang điểm đến $slug p$page" );
				break;
			}
			if ( 1 === $page ) {
				$out['loc_extra'][ $slug ] = array(
					'location'  => $p['location'] ?? array(),
					'rightPosts' => $p['rightPosts'] ?? array(),
					'topPosts'  => $p['topPosts'] ?? array(),
					'total'     => (int) ( $p['Posts']['total'] ?? 0 ),
				);
			}
			$last = (int) ( $p['Posts']['last_page'] ?? 1 );
			foreach ( $p['Posts']['data'] as $i => $item ) {
				if ( empty( $item['id'] ) ) {
					continue;
				}
				$item['_loc_slug']  = $slug;
				$item['_loc_order'] = ( $page - 1 ) * 10 + $i; // thứ tự CMS trong trang điểm đến.
				$out['loc_posts'][ (string) $item['id'] ] = $item;
			}
			++$page;
		} while ( $page <= $last );
		$log( sprintf( '  %s: %d bài (trang %d)', $slug, $out['loc_extra'][ $slug ]['total'] ?? 0, $last ) );
	}

	$page = 1;
	$last = 1;
	do {
		$p = $c->api_json( 'api/news?page=' . $page, 'lists', "news-p$page" );
		if ( ! is_array( $p ) || ! isset( $p['data'] ) ) {
			$out['complete'] = false;
			$log( "LỖI: api/news p$page" );
			break;
		}
		$last = (int) ( $p['meta']['last_page'] ?? 1 );
		foreach ( $p['data'] as $item ) {
			if ( ! empty( $item['id'] ) ) {
				$out['api_news'][ (string) $item['id'] ] = $item;
			}
		}
		++$page;
	} while ( $page <= $last );
	$log( sprintf( 'api/news: %d bài (%d trang)', count( $out['api_news'] ), $last ) );

	$g = $c->api_json( 'api/get-news', 'lists', 'get-news' );
	if ( ! is_array( $g ) || ! isset( $g['data_news'] ) || ! is_array( $g['data_news'] ) ) {
		$out['complete'] = false;
		$log( 'LỖI: api/get-news' );
	} else {
		foreach ( $g['data_news'] as $item ) {
			if ( ! empty( $item['slug'] ) ) {
				$out['get_news'][ (string) $item['slug'] ] = $item;
			}
		}
		$log( sprintf( 'Tin công ty: %d', count( $out['get_news'] ) ) );
	}

	$pl = $c->api_json( 'api/promotion-listing', 'lists', 'promotion-listing' );
	if ( ! is_array( $pl ) ) {
		$out['complete'] = false;
		$log( 'LỖI: api/promotion-listing' );
	} else {
		$rows = isset( $pl['data'] ) && is_array( $pl['data'] ) ? $pl['data'] : ( array_is_list( $pl ) ? $pl : array() );
		foreach ( $rows as $item ) {
			if ( is_array( $item ) && isset( $item['id'] ) ) {
				$out['promos'][ (string) $item['id'] ] = $item;
			}
		}
		$log( sprintf( 'Ưu đãi: %d', count( $out['promos'] ) ) );
	}
	return $out;
}

/**
 * Tải chi tiết từng bài/tin (dùng cache; chỉ gọi mạng khi dấu vân tay danh sách đổi hoặc chưa có).
 *
 * @param HV_Cms_Client       $c    Client.
 * @param array<string,mixed> $lists Kết quả hvc_collect_lists().
 * @param callable            $log  fn(string).
 * @param int                 $news_ttl_h Tin công ty: giờ trước khi tải lại chi tiết (danh sách tin không có nội dung để so).
 * @return array<string,mixed> posts (id => [fp, list, api, detail]), news (slug => [fp, list, detail]), promos (id => [fp, list, detail]).
 */
function hvc_fetch_details( HV_Cms_Client $c, array $lists, callable $log, $news_ttl_h = 24 ) {
	$fp_file = $c->cache_dir . '/fingerprints.json';
	$fp      = is_file( $fp_file ) ? json_decode( (string) file_get_contents( $fp_file ), true ) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions
	$fp      = is_array( $fp ) ? $fp : array();
	$out     = array( 'posts' => array(), 'news' => array(), 'promos' => array() );
	$save    = static function () use ( $c, $fp_file, &$fp ) {
		$c->write_file( $fp_file, (string) wp_json_encode( $fp, JSON_UNESCAPED_SLASHES ) );
	};

	// Bài điểm đến: hợp của danh sách trang điểm đến (meta) và api/news (nội dung).
	$ids = array_unique( array_merge( array_keys( $lists['loc_posts'] ), array_keys( $lists['api_news'] ) ) );
	sort( $ids, SORT_NUMERIC );
	$n = 0;
	foreach ( $ids as $id ) {
		$id   = (string) $id;
		$l    = $lists['loc_posts'][ $id ] ?? null;
		$a    = $lists['api_news'][ $id ] ?? null;
		$slug = (string) ( $a['slug'] ?? $l['slug'] ?? '' );
		if ( '' === $slug ) {
			continue;
		}
		$print = hvc_post_print( $l, $a );
		$before = $c->stats['requests'];
		$d      = $c->api_detail( 'api/news/' . rawurlencode( $slug ), 'detail-news', $id, $print, $fp, 0 );
		// Chỉ giữ phần dùng đến (rightPosts kèm cả nội dung 6 bài khác: ~400 KB/bài, không cần trong bộ nhớ).
		$d = is_array( $d ) ? array_intersect_key( $d, array( 'post' => 1, 'tags' => 1 ) ) : null;
		$out['posts'][ $id ] = array( 'fp' => $print, 'list' => $l, 'api' => $a, 'detail' => $d );
		if ( $c->stats['requests'] > $before && 0 === ++$n % 25 ) {
			$save();
			$log( sprintf( '  chi tiết bài: %d đã tải (%d/%d)', $n, count( $out['posts'] ), count( $ids ) ) );
		}
	}
	$save();

	// Tin công ty.
	$ttl = max( 0, (int) $news_ttl_h ) * 3600;
	$n   = 0;
	foreach ( $lists['get_news'] as $slug => $item ) {
		$print  = hvc_fingerprint( $item );
		$before = $c->stats['requests'];
		$d      = $c->api_detail( 'api/get-news/' . rawurlencode( (string) $slug ), 'detail-getnews', (string) $slug, $print, $fp, $ttl );
		$d = is_array( $d ) ? array_intersect_key( $d, array( 'data_news_detail' => 1 ) ) : null;
		$out['news'][ (string) $slug ] = array( 'fp' => $print, 'list' => $item, 'detail' => $d );
		if ( $c->stats['requests'] > $before && 0 === ++$n % 25 ) {
			$save();
			$log( sprintf( '  chi tiết tin: %d đã tải', $n ) );
		}
	}
	$save();

	// Ưu đãi (hiện CMS trả danh sách rỗng).
	foreach ( $lists['promos'] as $id => $item ) {
		$print = hvc_fingerprint( $item );
		$d     = $c->api_detail( 'api/promotion-detail?id=' . rawurlencode( (string) $id ), 'detail-promo', (string) $id, $print, $fp, $ttl );
		$out['promos'][ (string) $id ] = array( 'fp' => $print, 'list' => $item, 'detail' => $d );
	}
	$save();
	return $out;
}
