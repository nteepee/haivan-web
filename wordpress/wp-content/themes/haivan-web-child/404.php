<?php
/**
 * 404.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<div class="hv-container hv-404">
	<?php hv2_page_head( '404', hv_t( 'not_found_title' ), hv_t( 'not_found_text' ), '<p class="hv-actions"><a class="hv2-btn" href="' . esc_url( hv_lang_prefix() . '/' ) . '">' . esc_html( hv_t( 'back_home' ) ) . '</a></p>' ); ?>
</div>
<?php get_footer(); ?>
