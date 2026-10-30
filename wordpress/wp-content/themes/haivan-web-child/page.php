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
	<?php
	// Trang con của một trang dịch vụ kể chuyện (vd. Xe hợp đồng → Lái xe): tab đầu là "Tổng quan" về trang cha.
	$hv_nav    = hv_page_subnav( get_post() );
	$hv_pid    = (int) wp_get_post_parent_id( get_the_ID() );
	$hv_parent = $hv_pid > 0 ? get_post( $hv_pid ) : null;
	if ( $hv_parent && 'publish' === $hv_parent->post_status && hv2_story_schema( $hv_parent ) ) {
		$hv_nav = $hv_nav ? $hv_nav : array( array( get_the_title(), get_permalink(), true ) ); // hub chỉ có một trang con
		array_unshift( $hv_nav, array( 'en' === hv_lang() ? 'Overview' : 'Tổng quan', get_permalink( $hv_parent ), false ) );
	}
	hv2_subnav_tabs( $hv_nav );
	?>
	<?php if ( has_post_thumbnail() ) : ?>
		<figure class="hv2-wide-photo"><?php the_post_thumbnail( 'full', array( 'fetchpriority' => 'high', 'alt' => hv_image_alt( get_post() ) ) ); ?></figure>
	<?php endif; ?>
	<div class="hv-entry hv2-reading"><?php the_content(); ?></div>
</article>
	<?php
endwhile;
get_footer();
