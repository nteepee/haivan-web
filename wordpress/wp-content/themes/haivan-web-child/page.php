<?php
/**
 * Trang nội dung (docs/design/comps/content-page.html): đường dẫn, H1, ảnh đại diện, thanh điều hướng cùng mục
 * (cột trái trên desktop, hàng cuộn ngang trên điện thoại), cột đọc 68ch cỡ 18/28.
 * Trang dựng bằng UX Builder của Flatsome vẫn chạy (hardening.php nạp CSS Flatsome khi có shortcode [section]/[row]).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
while ( have_posts() ) :
	the_post();
	$hv_nav = hv_page_subnav( get_post() );
	?>
<article <?php post_class( 'hv-container hv-page' ); ?>>
	<?php hv_breadcrumb_trail( hv_page_trail( get_post() ) ); ?>
	<header class="hv-page-head">
		<h1><?php echo esc_html( get_the_title() ); ?></h1>
		<?php if ( has_post_thumbnail() ) : ?>
			<?php echo hv_featured_photo(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		<?php endif; ?>
	</header>
	<div class="hv-doc-grid<?php echo $hv_nav ? ' hv-doc-grid--nav' : ''; ?>">
		<?php if ( $hv_nav ) : ?>
			<nav aria-label="<?php echo esc_attr( hv_t( 'subnav' ) ); ?>">
				<ul class="hv-subnav">
					<?php foreach ( $hv_nav as $hv_i ) : ?>
						<li><a href="<?php echo esc_url( $hv_i[1] ); ?>"<?php echo $hv_i[2] ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $hv_i[0] ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			</nav>
		<?php endif; ?>
		<div class="hv-entry"><?php the_content(); ?></div>
	</div>
</article>
	<?php
endwhile;
get_footer();
