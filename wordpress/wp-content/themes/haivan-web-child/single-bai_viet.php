<?php
/**
 * Bài viết theo điểm đến (/diem-den/<điểm>/<slug>).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
while ( have_posts() ) :
	the_post();
	$hv_loc_slug = hv_post_location_slug( get_the_ID() );
	$hv_trail    = hv_post_trail();
	$hv_related = '' !== $hv_loc_slug ? get_posts(
		array(
			'post_type'        => 'bai_viet',
			'post_status'      => 'publish',
			'numberposts'      => 6,
			'post__not_in'     => array( get_the_ID() ),
			'orderby'          => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'suppress_filters' => true,
			'tax_query'        => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array(
					'taxonomy' => 'hv_location',
					'field'    => 'slug',
					'terms'    => $hv_loc_slug,
				),
			),
		)
	) : array();
	get_template_part( 'template-parts/article', null, array( 'trail' => $hv_trail, 'related' => $hv_related, 'tags' => true ) );
endwhile;
get_footer();
