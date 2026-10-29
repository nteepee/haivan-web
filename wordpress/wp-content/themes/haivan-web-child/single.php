<?php
/**
 * Bài mặc định (ưu đãi, bài WP thường). Tin công ty, bài điểm đến, điểm đến có mẫu riêng: single-tin_tuc.php, single-bai_viet.php, single-diem_den.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
while ( have_posts() ) :
	the_post();
	?>
<article <?php post_class( 'hv-container hv-page' ); ?>>
	<?php hv_breadcrumb_trail( array( array( hv_t( 'home' ), home_url( hv_lang_prefix() . '/' ) ), array( get_the_title(), '' ) ) ); ?>
	<header class="hv-page-head">
		<h1><?php echo esc_html( get_the_title() ); ?></h1>
		<p class="hv-meta"><?php echo esc_html( hv_t( 'published' ) . ' ' . get_the_date( 'd/m/Y' ) ); ?></p>
		<?php if ( has_post_thumbnail() ) : ?>
			<?php echo hv_featured_photo(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		<?php endif; ?>
	</header>
	<div class="hv-entry"><?php the_content(); ?></div>
</article>
	<?php
endwhile;
get_footer();
