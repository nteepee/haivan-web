<?php
/**
 * Dựng header/footer: menu desktop có dropdown, bảng menu điện thoại, dải tải app, footer "mast".
 * Cùng cấu trúc và tên lớp với Next (apps/booking/src/components/layout).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Đường dẫn hiện tại đã bỏ tiền tố ngôn ngữ, dùng đánh dấu aria-current cho menu. */
function hv_current_path() {
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '/'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$path = (string) wp_parse_url( $uri, PHP_URL_PATH );
	$path = preg_replace( '#^/en(?=/|$)#', '', $path );
	return '' === $path ? '/' : rtrim( $path, '/' );
}

/** Mục menu có là trang hiện tại (hoặc cha của nó) không? Chỉ xét href nội bộ, không xét "/" . */
function hv_nav_is_current( array $item ) {
	$cur  = hv_current_path();
	$hrefs = array( (string) $item['href'] );
	foreach ( (array) ( $item['children'] ?? array() ) as $c ) {
		$hrefs[] = (string) $c['href'];
	}
	foreach ( $hrefs as $h ) {
		$h = rtrim( (string) wp_parse_url( preg_replace( '#^/en(?=/|$)#', '', $h ), PHP_URL_PATH ), '/' );
		if ( '' !== $h && ( $cur === $h || 0 === strpos( $cur, $h . '/' ) ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Menu chính (desktop): mục có con = liên kết + dropdown (JS mở/đóng), mục thường = liên kết.
 *
 * @param array<int,array<string,mixed>> $items Cây menu.
 */
function hv_render_primary_nav( array $items ) {
	echo '<nav class="hv-nav" id="hv-nav" aria-label="' . esc_attr( hv_t( 'main_menu' ) ) . '">';
	foreach ( $items as $i => $item ) {
		$cur     = hv_nav_is_current( $item ) ? ' aria-current="page"' : '';
		$has_sub = ! empty( $item['children'] );
		echo '<div class="hv-nav-item">';
		if ( $has_sub ) {
			$id = 'hv-dd-' . (int) $i;
			echo '<a class="hv-nav-link" ' . hv_link_attrs( $item['href'] ) . $cur . ' data-hv-dd aria-haspopup="true" aria-expanded="false" aria-controls="' . esc_attr( $id ) . '">' . esc_html( $item['label'] ) . hv_icon( 'chevron-down' ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<div class="hv-dropdown" id="' . esc_attr( $id ) . '" hidden>';
			foreach ( $item['children'] as $child ) {
				echo '<a ' . hv_link_attrs( $child['href'] ) . '>' . esc_html( $child['label'] ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
			}
			echo '</div>';
		} else {
			echo '<a class="hv-nav-link" ' . hv_link_attrs( $item['href'] ) . $cur . '>' . esc_html( $item['label'] ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div>';
	}
	echo '</nav>';
}

/**
 * Bảng menu điện thoại: nút "Menu" mở bảng dưới header, mục cha và con xếp liên tiếp, Đăng nhập, ngôn ngữ.
 *
 * @param array<int,array<string,mixed>> $items  Cây menu.
 * @param array<string,string>           $switch Đổi ngôn ngữ.
 */
function hv_render_mobile_menu( array $items, array $switch ) {
	echo '<div class="hv-menu-toggle">';
	echo '<button type="button" class="hv-menu-btn" data-hv-burger aria-expanded="false" aria-controls="hv-main-menu" aria-label="' . esc_attr( hv_t( 'open_menu' ) ) . '" data-label-open="' . esc_attr( hv_t( 'open_menu' ) ) . '" data-label-close="' . esc_attr( hv_t( 'close_menu' ) ) . '">';
	echo hv_icon( 'menu', 'hv-ic--open' ) . hv_icon( 'x', 'hv-ic--close' ) . '<span>' . esc_html( hv_t( 'menu' ) ) . '</span></button>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<nav id="hv-main-menu" class="hv-menu-panel" aria-label="' . esc_attr( hv_t( 'main_menu' ) ) . '" hidden><ul>';
	foreach ( $items as $item ) {
		echo '<li><a class="hv-menu-link" ' . hv_link_attrs( $item['href'] ) . '>' . esc_html( $item['label'] ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		foreach ( (array) ( $item['children'] ?? array() ) as $child ) {
			echo '<a class="hv-menu-link hv-menu-sub" ' . hv_link_attrs( $child['href'] ) . '>' . esc_html( $child['label'] ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</li>';
	}
	echo '<li><a class="hv-menu-link" data-hv-login data-hv-login-mobile rel="nofollow" href="' . esc_url( hv_login_url() ) . '">' . esc_html( hv_t( 'login' ) ) . '</a></li>';
	echo '<li><a class="hv-menu-link" data-hv-lang="' . esc_attr( $switch['lang'] ) . '" lang="' . esc_attr( $switch['lang'] ) . '" href="' . esc_url( $switch['url'] ) . '">' . esc_html( 'en' === $switch['lang'] ? 'English' : 'Tiếng Việt' ) . '</a></li>';
	echo '</ul></nav></div>';
}

/** Một ảnh logo (đường dẫn /assets/... hoặc https, đã kiểm ở REST/setting). */
function hv_logo_img( $src, $alt, $w, $h, $cls = '' ) {
	return '<img src="' . esc_url( $src ) . '" width="' . (int) $w . '" height="' . (int) $h . '" alt="' . esc_attr( $alt ) . '" loading="lazy"' . ( '' !== $cls ? ' class="' . esc_attr( $cls ) . '"' : '' ) . '>';
}

/**
 * Nền dải tải app: vàng thương hiệu, trừ khi khối liền trước cũng vàng (/uu-dai) thì nền ấm để ranh giới là đổi nền.
 */
function hv_app_band_ground() {
	return is_post_type_archive( 'uu_dai' ) ? 'warm' : 'yellow';
}

/**
 * Dải tải app (v3): tiêu đề, gạch đầu dòng, QR, huy hiệu, ảnh điện thoại.
 *
 * @param string $ground Nền section: 'yellow' (mặc định) hoặc 'warm'.
 */
function hv_render_app_band( $ground = 'yellow' ) {
	$ground = 'warm' === $ground ? 'warm' : 'yellow';
	$p = hv_layout_payload();
	$h = hv_home_settings();
	if ( empty( $p['apps'] ) || empty( $p['badges'] ) ) {
		return;
	}
	$ticks = array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', hv_home_text( 'app_bullets' ) ) ?: array() ) );
	// Tiêu đề dải app là <p> (không phải heading): trang đã có H1 + các H2 nội dung, dải này lặp ở mọi trang nên không được chen vào dàn ý.
	echo '<section id="hv-app" class="hv-section hv-section--' . $ground . ' hv-app-band" aria-labelledby="hv-app-title"><div class="hv-container hv-app"><div class="hv-app-text">';
	echo '<p class="hv-app-title" id="hv-app-title">' . esc_html( hv_t( 'app_title' ) ) . '</p>';
	if ( $ticks ) {
		echo '<ul class="hv-ticks">';
		foreach ( $ticks as $t ) {
			// "ý | /đường-dẫn" = ý là liên kết nội bộ (tiền tố /en cho bản tiếng Anh); đường dẫn sai dạng thì chỉ hiện chữ.
			$parts = array_map( 'trim', explode( '|', $t, 2 ) );
			$href  = isset( $parts[1] ) ? hv_search_local_path( $parts[1], '' ) : '';
			$text  = '' !== $href ? '<a class="hv-ticks__link" href="' . esc_url( hv_lang_prefix() . $href ) . '">' . esc_html( $parts[0] ) . '</a>' : esc_html( $parts[0] );
			echo '<li>' . hv_icon( 'check', 'hv-ic--sm' ) . $text . '</li>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $text đã escape ở trên.
		}
		echo '</ul>';
	}
	echo '<div class="hv-app-qr">';
	if ( ! empty( $p['qr'] ) ) {
		echo hv_logo_img( $p['qr'], hv_t( 'qr_alt' ), 128, 128, 'hv-qr' ); // phpcs:ignore WordPress.Security.EscapeOutput
	} else {
		echo '<span></span>';
	}
	echo '<div><p>' . esc_html( hv_t( 'qr_scan' ) ) . '</p><ul class="hv-badges">';
	echo '<li><a href="' . esc_url( $p['apps']['ios'] ) . '" target="_blank" rel="noopener">' . hv_logo_img( $p['badges']['appstore'], hv_t( 'app_store' ), 140, 44 ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<li><a href="' . esc_url( $p['apps']['android'] ) . '" target="_blank" rel="noopener">' . hv_logo_img( $p['badges']['playstore'], hv_t( 'play_store' ), 140, 44 ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</ul></div></div></div>';
	if ( '' !== $h['app_phone'] ) {
		echo hv_logo_img( $h['app_phone'], hv_t( 'app_phone_alt' ), 640, 656, 'hv-app-phone' ); // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</div></section>';
}

/** Nhóm logo ở footer (Đối tác/Thành viên/Thanh toán/Chứng nhận): nhãn nhỏ + hàng logo cao cố định trên chip sáng; mảng rỗng = ẩn cả nhóm. */
function hv_render_logo_group( $title, array $logos ) {
	if ( ! $logos ) {
		return;
	}
	echo '<section class="hv-footer-group"><p class="hv-footer-head">' . esc_html( $title ) . '</p><ul class="hv-chips">';
	foreach ( $logos as $l ) {
		$img = hv_logo_img( $l['img'], $l['alt'], 120, 32 );
		echo '<li>' . ( ! empty( $l['href'] ) ? '<a href="' . esc_url( $l['href'] ) . '" target="_blank" rel="noopener">' . $img . '</a>' : $img ) . '</li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</ul></section>';
}

/** Hàng biểu tượng liên kết ngoài (mạng xã hội, cửa hàng ứng dụng). */
function hv_render_icon_row( $title, array $links ) {
	if ( ! $links ) {
		return;
	}
	echo '<section class="hv-footer-group"><p class="hv-footer-head">' . esc_html( $title ) . '</p><ul class="hv-footer-icons">';
	foreach ( $links as $l ) {
		echo '<li><a href="' . esc_url( $l['href'] ) . '" target="_blank" rel="noopener" aria-label="' . esc_attr( $l['alt'] ) . '"><img src="' . esc_url( $l['icon'] ) . '" width="32" height="32" alt="" loading="lazy"></a></li>';
	}
	echo '</ul></section>';
}
