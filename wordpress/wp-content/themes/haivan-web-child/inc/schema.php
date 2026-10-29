<?php
/**
 * JSON-LD bổ sung cho Rank Math (chạy sau bộ lọc gỡ Person ở hardening.php):
 *  - bài điểm đến (bai_viet) và tin công ty (tin_tuc): Article (BlogPosting / NewsArticle do scripts/seo-hardening.php chọn
 *    trong Rank Math) có headline, datePublished/dateModified, image, author + publisher là Organization "Hải Vân"; thêm BreadcrumbList;
 *  - trang điểm đến (diem_den): CollectionPage (danh sách bài của điểm) + BreadcrumbList, không có Article.
 * Breadcrumb lấy từ hv_post_trail(), cùng nguồn với breadcrumb hiển thị.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** URL tuyệt đối từ đường dẫn tương đối hoặc URL sẵn có. */
function hv_schema_abs_url( $url ) {
	$url = (string) $url;
	return 0 === strpos( $url, '/' ) ? home_url( $url ) : $url;
}

/** BreadcrumbList từ đường dẫn [[nhãn, URL], ...]; mục cuối (trang hiện tại) không cần URL. */
function hv_schema_breadcrumb( array $trail, $page_url ) {
	$items = array();
	$last  = count( $trail ) - 1;
	foreach ( $trail as $i => $crumb ) {
		$item = array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => wp_strip_all_tags( (string) $crumb[0] ) );
		if ( $i === $last ) {
			$item['item'] = $page_url;
		} elseif ( '' !== (string) $crumb[1] ) {
			$item['item'] = hv_schema_abs_url( $crumb[1] );
		} else {
			continue; // mục cha không có trang riêng: không đưa vào danh sách.
		}
		$items[] = $item;
	}
	foreach ( $items as $n => $item ) {
		$items[ $n ]['position'] = $n + 1;
	}
	return array( '@type' => 'BreadcrumbList', '@id' => $page_url . '#breadcrumb', 'itemListElement' => $items );
}

/** Ảnh đầu tiên trong thân bài còn sống (bỏ host đã chết), dùng khi bài không có ảnh đại diện. */
function hv_schema_first_content_image( WP_Post $post ) {
	if ( preg_match_all( '#<img\b[^>]*\bsrc\s*=\s*(["\'])(.*?)\1#is', (string) $post->post_content, $m ) ) {
		foreach ( $m[2] as $src ) {
			$src = html_entity_decode( $src, ENT_QUOTES, 'UTF-8' );
			if ( ! hv_is_dead_image_url( $src ) && 1 === preg_match( '#^(?:https://|/(?!/))#', $src ) ) {
				return hv_schema_abs_url( $src );
			}
		}
	}
	return '';
}

add_filter(
	'rank_math/json_ld',
	static function ( $data ) {
		if ( ! is_singular( array( 'bai_viet', 'tin_tuc', 'diem_den' ) ) || ! is_array( $data ) || ! $data ) {
			return $data;
		}
		$post = get_queried_object();
		if ( ! $post instanceof WP_Post ) {
			return $data;
		}
		$url   = (string) get_permalink( $post );
		$types = array( 'Article', 'BlogPosting', 'NewsArticle' );
		$org   = null;
		foreach ( $data as $entity ) {
			if ( is_array( $entity ) && isset( $entity['@type'] ) && 'Organization' === $entity['@type'] && ! empty( $entity['@id'] ) ) {
				$org = array( '@id' => $entity['@id'] );
			}
		}
		$crumb = hv_schema_breadcrumb( hv_post_trail( $post ), $url );
		foreach ( $data as $key => $entity ) {
			if ( ! is_array( $entity ) || ! isset( $entity['@type'] ) ) {
				continue;
			}
			$type = is_array( $entity['@type'] ) ? (string) reset( $entity['@type'] ) : (string) $entity['@type'];
			if ( 'diem_den' === $post->post_type && in_array( $type, $types, true ) ) {
				unset( $data[ $key ] ); // trang điểm đến là trang danh sách, không phải bài báo.
				continue;
			}
			if ( 'WebPage' === $type ) {
				$data[ $key ]['breadcrumb'] = array( '@id' => $crumb['@id'] );
				if ( 'diem_den' === $post->post_type ) {
					$data[ $key ]['@type'] = 'CollectionPage';
				}
			}
			if ( in_array( $type, $types, true ) ) {
				if ( $org ) {
					$data[ $key ]['author']    = $org; // tên người đăng nhập không lộ ra ngoài (xem hardening.php).
					$data[ $key ]['publisher'] = $org;
				}
				if ( empty( $entity['image'] ) ) {
					$img = hv_schema_first_content_image( $post );
					if ( '' !== $img ) {
						$data[ $key ]['image'] = array( '@type' => 'ImageObject', 'url' => $img );
					}
				}
				if ( empty( $entity['headline'] ) ) {
					$data[ $key ]['headline'] = wp_strip_all_tags( get_the_title( $post ) );
				}
			}
		}
		$data['hvBreadcrumb'] = $crumb;
		return $data;
	},
	100
);
