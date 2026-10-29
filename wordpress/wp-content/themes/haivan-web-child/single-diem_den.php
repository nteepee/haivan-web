<?php
/**
 * Trang điểm đến: danh sách bài của điểm (10/trang, ?page=N) + cột "Bài viết mới nhất".
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
while ( have_posts() ) :
	the_post();
	$hv_slug  = (string) get_post_field( 'post_name' );
	$hv_name  = get_the_title();
	$hv_page  = hv_dest_page();
	$hv_query = hv_destination_query( $hv_slug, $hv_page );
	$hv_total = max( 1, (int) $hv_query->max_num_pages );
	$hv_side  = get_posts(
		array(
			'post_type'        => 'bai_viet',
			'post_status'      => 'publish',
			'numberposts'      => 6,
			'orderby'          => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'suppress_filters' => true,
		)
	);
	?>
<div <?php post_class( 'hv-container hv-page' ); ?>>
	<?php
	hv_breadcrumb_trail( hv_post_trail() );
	?>
	<header class="hv-page-head">
		<h1><?php echo esc_html( sprintf( hv_t( 'destination_title' ), $hv_name ) ); ?></h1>
		<?php if ( 1 === $hv_page && has_post_thumbnail() ) : ?>
			<?php echo hv_featured_photo(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		<?php endif; ?>
	</header>
	<?php if ( 1 === $hv_page && '' !== trim( wp_strip_all_tags( get_the_content() ) ) ) : ?>
		<div class="hv-entry"><?php the_content(); ?></div>
	<?php endif; ?>
	<?php hv_render_dest_routes( $hv_name, $hv_slug, get_the_ID() ); ?>
	<div class="hv-cols">
		<div class="hv-cols__main">
			<?php if ( $hv_query->have_posts() ) : ?>
				<ul class="hv-postlist">
					<?php
					while ( $hv_query->have_posts() ) {
						$hv_query->the_post();
						get_template_part( 'template-parts/post-row' );
					}
					wp_reset_postdata();
					?>
				</ul>
				<?php hv_query_pagination( $hv_page, $hv_total, get_permalink() ); ?>
			<?php else : ?>
				<p><?php echo esc_html( hv_t( 'no_posts' ) ); ?></p>
			<?php endif; ?>
		</div>
		<?php get_template_part( 'template-parts/side-posts', null, array( 'title' => hv_t( 'latest_posts' ), 'posts' => $hv_side ) ); ?>
	</div>
</div>
	<?php
endwhile;
get_footer();
