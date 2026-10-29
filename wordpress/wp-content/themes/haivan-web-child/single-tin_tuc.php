<?php
/**
 * Tin công ty (/chung-toi/bao-chi-tin-tuc/<slug>).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
while ( have_posts() ) :
	the_post();
	$hv_trail   = hv_post_trail();
	$hv_related = get_posts(
		array(
			'post_type'    => 'tin_tuc',
			'post_status'  => 'publish',
			'numberposts'  => 6,
			'post__not_in' => array( get_the_ID() ),
			'orderby'      => array( 'date' => 'DESC', 'ID' => 'DESC' ),
		)
	);
	get_template_part( 'template-parts/article', null, array( 'trail' => $hv_trail, 'related' => $hv_related, 'tags' => false ) );
endwhile;
get_footer();
