<?php
/**
 * Shortcode [haivan_cta route="a/b"]: dải đặt vé trong bài (thay iframe https://cms.haivan.com/api/cta/<n> của CMS cũ).
 * Có route -> liên kết /xe-khach/<a>/<b>; không có -> /xe-khach. Luôn kèm nút gọi hotline.
 * Thuộc tính: route (a/b), title, text, n (số khung CMS cũ, chỉ lưu vết, không dùng để dựng).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Nhãn tuyến ("Mỹ Đình đi Điện Biên") từ bài hv_route có hv_route_path trùng; rỗng nếu không có. */
function hv_route_title_by_path( $path ) {
	$post = function_exists( 'hv_route_find' ) ? hv_route_find( $path ) : null;
	return $post ? hv_route_label( get_the_title( $post ) ) : '';
}

/**
 * @param array<string,string>|string $atts Thuộc tính shortcode.
 */
function hv_cta_shortcode( $atts = array() ) {
	$atts  = shortcode_atts( array( 'route' => '', 'title' => '', 'text' => '', 'n' => '' ), is_array( $atts ) ? $atts : array(), 'haivan_cta' );
	$route = 1 === preg_match( '#^[a-z0-9-]+/[a-z0-9-]+$#', (string) $atts['route'] ) ? $atts['route'] : '';
	$label = '' !== $route ? hv_route_title_by_path( $route ) : '';
	$prefix = hv_lang_prefix();
	$href  = $prefix . '/xe-khach' . ( '' !== $route ? '/' . $route : '' );
	$title = '' !== trim( $atts['title'] ) ? trim( $atts['title'] ) : ( '' !== $label ? sprintf( hv_t( 'cta_title_route' ), $label ) : hv_t( 'cta_title' ) );
	$text  = '' !== trim( $atts['text'] ) ? trim( $atts['text'] ) : hv_t( 'cta_text' );
	$set   = hv_layout_settings();
	$tel   = preg_replace( '/[^0-9+]/', '', $set['hotline'] );
	ob_start();
	?>
<aside class="hv-cta" aria-label="<?php echo esc_attr( hv_t( 'booking_label' ) ); ?>">
	<div class="hv-cta-text">
		<p class="hv-cta-title"><?php echo esc_html( $title ); ?></p>
		<p><?php echo esc_html( $text ); ?></p>
	</div>
	<div class="hv-cta-actions">
		<a class="hv-btn hv-btn--lg" href="<?php echo esc_url( $href ); ?>"><?php echo esc_html( hv_t( 'cta_button' ) ); ?></a>
		<?php if ( '' !== $tel ) : ?>
			<a class="hv-btn hv-btn--ghost hv-btn--lg" href="tel:<?php echo esc_attr( $tel ); ?>"><?php echo hv_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( sprintf( hv_t( 'cta_call' ), $set['hotline'] ) ); ?></a>
		<?php endif; ?>
	</div>
</aside>
	<?php
	return (string) ob_get_clean();
}
add_shortcode( 'haivan_cta', 'hv_cta_shortcode' );
