<?php
/**
 * Template Name: Landing tìm vé
 * Template Post Type: page
 *
 * Landing /dat-ve-nhanh*: thẻ H1 + [haivan_search] (cùng kiểu thẻ tìm vé của trang chủ) + nội dung trang.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
?>
<section class="hv-section hv-section--warm hv-landing" aria-label="<?php echo esc_attr( hv_t( 'booking_label' ) ); ?>">
	<div class="hv-container">
		<div class="hv-hero-card">
			<h1><?php echo esc_html( get_the_title() ); ?></h1>
			<?php echo do_shortcode( '[haivan_search]' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</div>
		<?php if ( has_excerpt() ) : ?>
			<p class="hv-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php endif; ?>
	</div>
</section>
<?php if ( '' !== trim( get_the_content() ) ) : ?>
<div class="hv-container hv-page"><div class="hv-entry"><?php the_content(); ?></div></div>
<?php endif; ?>
<?php get_footer(); ?>
