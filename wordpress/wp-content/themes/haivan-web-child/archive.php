<?php
/**
 * Danh sách điểm đến / tin tức: thẻ ảnh (ảnh đại diện, tiêu đề, ngày với tin, tóm tắt).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
$hv_type = get_post_type() ?: (string) get_query_var( 'post_type' ); // archive rỗng thì get_post_type() trả false.
$hv_name = 'tin_tuc' === $hv_type ? hv_t( 'news' ) : hv_t( 'destinations' );
$hv_trail = array( array( hv_t( 'home' ), home_url( hv_lang_prefix() . '/' ) ) );
if ( 'tin_tuc' === $hv_type ) {
	$hv_trail[] = array( hv_t( 'about_us' ), home_url( hv_lang_prefix() . '/chung-toi/gioi-thieu' ) );
}
$hv_trail[] = array( $hv_name, '' );
?>
<div class="hv-container hv-page">
	<?php hv_breadcrumb_trail( $hv_trail ); ?>
	<?php hv2_page_head( count( $hv_trail ) > 2 ? $hv_trail[1][0] : ( 'diem_den' === $hv_type ? ( 'en' === hv_lang() ? 'Explore' : 'Khám phá' ) : ( 'en' === hv_lang() ? 'Hai Van' : 'Hải Vân' ) ), 'diem_den' === $hv_type || 'tin_tuc' === $hv_type ? $hv_name : wp_strip_all_tags( get_the_archive_title() ) ); ?>
	<?php if ( have_posts() ) : ?>
		<?php get_template_part( 'template-parts/post-cards' ); ?>
		<?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?>
	<?php else : ?>
		<p><?php echo esc_html( hv_t( 'not_found_text' ) ); ?></p>
	<?php endif; ?>
</div>
<?php get_footer(); ?>
