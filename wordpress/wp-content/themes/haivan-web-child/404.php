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
	<h1><?php echo esc_html( hv_t( 'not_found_title' ) ); ?></h1>
	<p><?php echo esc_html( hv_t( 'not_found_text' ) ); ?></p>
	<a class="hv-btn" href="<?php echo esc_url( hv_lang_prefix() . '/' ); ?>"><?php echo esc_html( hv_t( 'back_home' ) ); ?></a>
</div>
<?php get_footer(); ?>
