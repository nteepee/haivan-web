<?php
/**
 * Lưới thẻ bài (ảnh, tiêu đề, ngày với tin tức, tóm tắt) cho vòng lặp hiện tại: archive điểm đến / tin tức và kết quả tìm kiếm.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<ul class="hv-cards">
	<?php
	while ( have_posts() ) :
		the_post();
		$hv_excerpt = wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 28 );
		?>
		<li class="hv-card<?php echo has_post_thumbnail() ? '' : ' hv-card--noimg'; ?>">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="hv-card-img"><?php echo hv_card_image( get_post(), 'medium_large', '' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
			<?php endif; ?>
			<div class="hv-card-body">
				<h2><a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a></h2>
				<?php if ( 'tin_tuc' === get_post_type() ) : ?>
					<p><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( hv_post_datetime() ); ?></time></p>
				<?php endif; ?>
				<?php if ( '' !== $hv_excerpt ) : ?>
					<p><?php echo esc_html( $hv_excerpt ); ?></p>
				<?php endif; ?>
			</div>
		</li>
	<?php endwhile; ?>
</ul>
