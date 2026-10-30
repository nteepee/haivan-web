<?php
/**
 * Trang /xe-san-bay (giữ URL): H1 của trang, một câu giới thiệu, nút gọi tổng đài, thẻ tìm vé và các tuyến đi/đến sân bay
 * lấy từ hv_route (chỉ tuyến có thật; không có tuyến thì ẩn cả khối). Mỗi khối một nền, liền nhau, không margin giữa chúng.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv_set    = hv_layout_settings();
$hv_tel    = preg_replace( '/[^0-9+]/', '', $hv_set['hotline'] );
$hv_routes = hv_render_airport_route_cards();
?>
<article <?php post_class( 'hv-container hv-page' ); ?>>
	<?php hv_breadcrumb_trail( hv_page_trail( get_post() ) ); ?>
	<?php
	$hv_actions = '' !== $hv_tel ? '<p class="hv-actions"><a class="hv2-btn" href="tel:' . esc_attr( $hv_tel ) . '">' . esc_html( sprintf( hv_t( 'cta_call' ), $hv_set['hotline'] ) ) . '</a></p>' : '';
	hv2_page_head( hv2_section_label( hv_page_trail( get_post() ) ), get_the_title(), hv_t( 'airport_intro' ), $hv_actions );
	?>
	<?php if ( '' !== trim( wp_strip_all_tags( get_the_content() ) ) ) : ?>
		<div class="hv-entry"><?php the_content(); ?></div>
	<?php endif; ?>
</article>
<section class="hv-section hv-section--warm" aria-labelledby="hv-airport-find">
	<div class="hv-container">
		<div class="hv-section-head"><h2 id="hv-airport-find"><?php echo esc_html( hv_t( 'airport_find' ) ); ?></h2></div>
		<?php echo do_shortcode( '[haivan_search]' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	</div>
</section>
<?php if ( '' !== $hv_routes ) : ?>
<section class="hv-section hv-section--grey" aria-labelledby="hv-airport-routes">
	<div class="hv-container">
		<div class="hv-section-head"><h2 id="hv-airport-routes"><?php echo esc_html( hv_t( 'airport_routes' ) ); ?></h2></div>
		<ul class="hv-rcards"><?php echo $hv_routes; // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape trong hv_render_route_cards(). ?></ul>
	</div>
</section>
<?php endif; ?>
<?php get_footer(); ?>
