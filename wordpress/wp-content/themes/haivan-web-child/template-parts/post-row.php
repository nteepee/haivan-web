<?php
/**
 * Một dòng bài trong danh sách của trang điểm đến (ảnh trái, tiêu đề + ngày + mô tả phải).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$hv_title = get_the_title();
?>
<li class="hv-postrow<?php echo has_post_thumbnail() ? '' : ' hv-postrow--noimg'; ?>">
	<?php if ( has_post_thumbnail() ) : ?>
		<a class="hv-postrow__thumb" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy', 'alt' => hv_image_alt( get_the_ID() ) ) ); ?></a>
	<?php endif; ?>
	<div class="hv-postrow__body">
		<h2 class="hv-postrow__title"><a href="<?php the_permalink(); ?>"><?php echo esc_html( $hv_title ); ?></a></h2>
		<time class="hv-postrow__date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( hv_post_datetime() ); ?></time>
		<p class="hv-postrow__excerpt"><?php echo esc_html( wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 40 ) ); ?></p>
	</div>
</li>
