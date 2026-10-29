<?php
/**
 * Kết quả tìm kiếm của WordPress (/?s=): cùng khung và thẻ với archive. Không có ô tìm kiếm trong giao diện; trang này chỉ phục vụ
 * đường dẫn tìm kiếm có sẵn (công cụ tìm kiếm, liên kết cũ), để không rơi về giao diện thô của theme cha.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
$hv_title = sprintf( hv_t( 'search_results' ), get_search_query() );
?>
<div class="hv-container hv-page">
	<?php hv_breadcrumb_trail( array( array( hv_t( 'home' ), home_url( hv_lang_prefix() . '/' ) ), array( $hv_title, '' ) ) ); ?>
	<header class="hv-page-head"><h1><?php echo esc_html( $hv_title ); ?></h1></header>
	<?php if ( have_posts() ) : ?>
		<?php get_template_part( 'template-parts/post-cards' ); ?>
		<?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?>
	<?php else : ?>
		<p><?php echo esc_html( hv_t( 'search_none' ) ); ?></p>
		<p><a class="hv-btn" href="<?php echo esc_url( home_url( hv_lang_prefix() . '/' ) ); ?>"><?php echo esc_html( hv_t( 'back_home' ) ); ?></a></p>
	<?php endif; ?>
</div>
<?php get_footer(); ?>
