<?php
/**
 * Trang nội dung v2, cùng bố cục với trang Giới thiệu: đường dẫn → đầu trang (nhãn mục, H1, đoạn dẫn từ excerpt)
 * → hàng tab cùng mục → ảnh đại diện rộng → cột đọc. Thành phần dùng chung: hv2_page_head(), hv2_subnav_tabs().
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
	$hv_trail = hv_page_trail( get_post() );
	?>
<article <?php post_class( 'hv2-wrap hv-page hv2-content-page' ); ?>>
	<?php hv_breadcrumb_trail( $hv_trail ); ?>
	<?php hv2_page_head( hv2_section_label( $hv_trail ), get_the_title(), has_excerpt() ? get_the_excerpt() : '' ); ?>
	<?php hv2_subnav_tabs( hv_page_subnav( get_post() ) ); ?>
	<?php if ( has_post_thumbnail() ) : ?>
		<figure class="hv2-wide-photo"><?php the_post_thumbnail( 'full', array( 'fetchpriority' => 'high', 'alt' => hv_image_alt( get_post() ) ) ); ?></figure>
	<?php endif; ?>
	<div class="hv-entry hv2-reading"><?php the_content(); ?></div>
</article>
	<?php
endwhile;
get_footer();
