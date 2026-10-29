<?php
/**
 * Hàm dựng HTML dùng trong header.php / footer.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Liên kết nội bộ (href tương đối) → thẻ <a>, mở tab mới cho liên kết ngoài.
 */
function hv_link_attrs( $href ) {
	$external = (bool) preg_match( '#^https?://#i', $href );
	return 'href="' . esc_url( $href ) . '"' . ( $external ? ' target="_blank" rel="noopener"' : '' );
}

/**
 * URL của trang hiện tại ở ngôn ngữ còn lại (Polylang) hoặc phỏng đoán theo tiền tố /en.
 *
 * @return array{lang:string,label:string,url:string}
 */
function hv_language_switch() {
	$current = hv_lang();
	$target  = 'vi' === $current ? 'en' : 'vi';
	$url     = '';
	if ( function_exists( 'pll_the_languages' ) ) {
		$langs = pll_the_languages( array( 'raw' => 1, 'hide_if_no_translation' => 0 ) );
		if ( is_array( $langs ) && ! empty( $langs[ $target ]['url'] ) ) {
			$url = $langs[ $target ]['url'];
		}
	}
	if ( '' === $url ) {
		$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$bare = preg_replace( '#^/en(?=/|$)#', '', $path );
		$bare = '' === $bare ? '/' : $bare;
		$url  = 'en' === $target ? '/en' . ( '/' === $bare ? '' : $bare ) : $bare;
	}
	return array(
		'lang'  => $target,
		'label' => strtoupper( $target ),
		'url'   => hv_relative_href( $url ), // tương đối: đúng host kể cả khi đứng sau nginx gốc.
	);
}

/**
 * URL đăng nhập (Next.js) mang next = đường dẫn hiện tại.
 */
function hv_login_url() {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$uri = '/' . ltrim( (string) preg_replace( '/[\x00-\x1F\x7F]/', '', $uri ), '/' );
	return hv_lang_prefix() . '/tai-khoan/dang-nhap?next=' . rawurlencode( substr( $uri, 0, 500 ) );
}

/**
 * Breadcrumb thuần cho trang bài/điểm đến (Rank Math không biết nhãn "Điểm đến" của CPT tự quản URL).
 *
 * @param array<int,array{0:string,1:string}> $trail Các mục [nhãn, URL]; mục cuối không có URL thì là trang hiện tại.
 */
function hv_breadcrumb_trail( array $trail ) {
	echo '<nav class="hv-breadcrumbs" aria-label="breadcrumb"><ol class="hv-crumbs">';
	$last = count( $trail ) - 1;
	foreach ( $trail as $i => $item ) {
		echo '<li>';
		if ( $i < $last && '' !== $item[1] ) {
			echo '<a href="' . esc_url( $item[1] ) . '">' . esc_html( $item[0] ) . '</a>';
		} elseif ( $i < $last ) {
			echo '<span>' . esc_html( $item[0] ) . '</span>'; // cha không có trang riêng: chữ thường, không đánh dấu là trang hiện tại.
		} else {
			echo '<span aria-current="page">' . esc_html( $item[0] ) . '</span>';
		}
		echo '</li>';
	}
	echo '</ol></nav>';
}

/**
 * Đường dẫn breadcrumb của bài điểm đến (bai_viet), tin công ty (tin_tuc) và trang điểm đến (diem_den).
 * Dùng chung cho breadcrumb hiển thị (template) và BreadcrumbList JSON-LD (inc/schema.php) để hai nơi luôn khớp.
 *
 * @param WP_Post|int|null $post Bài; null = bài hiện tại.
 * @return array<int,array{0:string,1:string}> Các mục [nhãn, URL]; mục cuối không có URL là trang hiện tại.
 */
function hv_post_trail( $post = null ) {
	$post   = get_post( $post );
	$prefix = hv_lang_prefix();
	if ( ! $post ) {
		return array();
	}
	if ( 'tin_tuc' === $post->post_type ) {
		return array(
			array( hv_t( 'home' ), home_url( '/' ) ),
			array( hv_t( 'about_us' ), home_url( $prefix . '/chung-toi/gioi-thieu' ) ),
			array( hv_t( 'news' ), get_post_type_archive_link( 'tin_tuc' ) ?: home_url( '/chung-toi/bao-chi-tin-tuc' ) ),
			array( get_the_title( $post ), '' ),
		);
	}
	$trail = array(
		array( hv_t( 'home' ), home_url( '/' ) ),
		array( hv_t( 'explore' ), home_url( $prefix . '/diem-den' ) ),
		array( hv_t( 'destinations' ), get_post_type_archive_link( 'diem_den' ) ?: home_url( '/diem-den' ) ),
	);
	if ( 'bai_viet' === $post->post_type ) {
		$slug  = hv_post_location_slug( $post->ID );
		$terms = get_the_terms( $post->ID, 'hv_location' );
		if ( '' !== $slug && is_array( $terms ) && $terms ) {
			$trail[] = array( reset( $terms )->name, home_url( '/diem-den/' . $slug ) );
		}
	}
	$trail[] = array( get_the_title( $post ), '' );
	return $trail;
}

/**
 * Phân trang dạng liên kết ?page=N (trang 1 = URL gốc, không tham số).
 *
 * @param int    $current Trang hiện tại.
 * @param int    $total   Tổng số trang.
 * @param string $base    URL gốc (không có ?page).
 */
function hv_query_pagination( $current, $total, $base ) {
	if ( $total < 2 ) {
		return;
	}
	$url   = static function ( $n ) use ( $base ) {
		return 1 === $n ? $base : add_query_arg( 'page', $n, $base );
	};
	$shown = array();
	for ( $n = 1; $n <= $total; $n++ ) {
		if ( 1 === $n || $total === $n || abs( $n - $current ) <= 2 ) {
			$shown[] = $n;
		}
	}
	echo '<nav class="navigation pagination" aria-label="' . esc_attr( hv_t( 'pagination' ) ) . '"><div class="nav-links">';
	if ( $current > 1 ) {
		echo '<a class="page-numbers prev" rel="prev" href="' . esc_url( $url( $current - 1 ) ) . '">&larr;</a>';
	}
	$prev = 0;
	foreach ( $shown as $n ) {
		if ( $prev && $n - $prev > 1 ) {
			echo '<span class="page-numbers dots">&hellip;</span>';
		}
		if ( $n === $current ) {
			echo '<span class="page-numbers current" aria-current="page">' . (int) $n . '</span>';
		} else {
			echo '<a class="page-numbers" href="' . esc_url( $url( $n ) ) . '">' . (int) $n . '</a>';
		}
		$prev = $n;
	}
	if ( $current < $total ) {
		echo '<a class="page-numbers next" rel="next" href="' . esc_url( $url( $current + 1 ) ) . '">&rarr;</a>';
	}
	echo '</div></nav>';
}

/** Ngày giờ hiển thị như web cũ ("14:30 - 24/10/2020"). */
function hv_post_datetime( $post = null ) {
	return get_the_date( 'H:i - d/m/Y', $post );
}

/**
 * Liên kết của một trang cha trong breadcrumb: chính nó khi đã xuất bản; nếu là nháp (web cũ không có URL mục cha, vd. /chung-toi)
 * thì trang con đầu tiên đã xuất bản của nó (theo "Thứ tự"), để cha luôn là liên kết.
 *
 * @param int $id ID trang cha.
 * @return string URL hoặc rỗng nếu không có trang nào để dẫn tới.
 */
function hv_page_trail_url( $id ) {
	if ( 'publish' === get_post_status( $id ) ) {
		return (string) get_permalink( $id );
	}
	$kids = get_posts(
		array(
			'post_type'   => 'page',
			'post_status' => 'publish',
			'post_parent' => (int) $id,
			'numberposts' => 1,
			'orderby'     => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
		)
	);
	return $kids ? (string) get_permalink( $kids[0] ) : '';
}

/**
 * Đường dẫn breadcrumb của một trang (page): Trang chủ > các trang cha > trang hiện tại.
 * Trang cha chưa xuất bản (nháp) hiện chữ, không có liên kết.
 *
 * @return array<int,array{0:string,1:string}>
 */
function hv_page_trail( $post ) {
	$trail = array( array( hv_t( 'home' ), home_url( hv_lang_prefix() . '/' ) ) );
	foreach ( array_reverse( get_post_ancestors( $post ) ) as $anc_id ) {
		$trail[] = array( get_the_title( $anc_id ), hv_page_trail_url( $anc_id ) );
	}
	$trail[] = array( get_the_title( $post ), '' );
	return $trail;
}

/**
 * Các trang cùng mục (anh em của trang hiện tại, hoặc con của nó khi là trang cha) cho thanh điều hướng cạnh bài.
 *
 * @return array<int,array{0:string,1:string,2:bool}> [nhãn, URL, là trang hiện tại]
 */
function hv_page_subnav( $post ) {
	$parent = $post->post_parent ? (int) $post->post_parent : (int) $post->ID;
	$pages  = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'post_parent'    => $parent,
			'numberposts'    => 30,
			'orderby'        => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
		)
	);
	if ( count( $pages ) < 2 ) {
		return array();
	}
	$out = array();
	foreach ( $pages as $p ) {
		$out[] = array( get_the_title( $p ), get_permalink( $p ), (int) $p->ID === (int) $post->ID );
	}
	return $out;
}

/**
 * Văn bản thay thế (alt) cho ảnh đại diện của một bài: ưu tiên alt MKT đã nhập cho ảnh trong Media, không có thì lấy tiêu đề bài.
 *
 * @param WP_Post|int|null $post Bài.
 * @return string
 */
function hv_image_alt( $post = null ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return '';
	}
	$thumb = (int) get_post_thumbnail_id( $post );
	$alt   = $thumb > 0 ? trim( (string) get_post_meta( $thumb, '_wp_attachment_image_alt', true ) ) : '';
	return '' !== $alt ? $alt : trim( wp_strip_all_tags( get_the_title( $post ) ) );
}

/**
 * Ảnh đại diện đầu trang: khung 16:9 nhưng không rộng quá cỡ thật của tệp (ảnh nhỏ kéo giãn sẽ mờ).
 * Chiều rộng thật lấy từ metadata của bản "large" (hoặc tệp gốc nếu nhỏ hơn); CSS đọc --hv-nat để giới hạn max-width.
 */
function hv_featured_photo( $post = null ) {
	$id = (int) get_post_thumbnail_id( $post );
	if ( $id < 1 ) {
		return '';
	}
	$src   = wp_get_attachment_image_src( $id, 'large' );
	$style = ( $src && (int) $src[1] > 0 ) ? ' style="--hv-nat: ' . (int) $src[1] . 'px"' : '';
	return '<figure class="hv-photo"' . $style . '>' . get_the_post_thumbnail( $post, 'large', array( 'fetchpriority' => 'high', 'alt' => hv_image_alt( $post ) ) ) . '</figure>'; // phpcs:ignore WordPress.Security.EscapeOutput -- WP dựng thẻ img đã escape; số nguyên ép kiểu.
}
