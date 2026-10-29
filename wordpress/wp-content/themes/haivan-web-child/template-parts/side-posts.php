<?php
/**
 * Cột phải: danh sách bài (ảnh, tiêu đề, ngày). Tham số: title (string), posts (WP_Post[]).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$hv_posts = isset( $args['posts'] ) && is_array( $args['posts'] ) ? $args['posts'] : array();
$hv_toc = hv_toc_items(); // mục lục của bài đang đọc (inc/toc.php); trống ở trang điểm đến.
if ( ! $hv_posts && ! $hv_toc ) {
	return;
}
?>
<aside class="hv-side<?php echo $hv_toc ? ' hv-side--toc' : ''; ?>" aria-label="<?php echo esc_attr( (string) ( $args['title'] ?? '' ) ); ?>">
	<?php echo $hv_toc ? hv_toc_html( $hv_toc, 'side' ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape trong hv_toc_html(). ?>
	<?php if ( $hv_posts ) : ?>
	<h2 class="hv-side__title"><?php echo esc_html( (string) ( $args['title'] ?? '' ) ); ?></h2>
	<ul class="hv-side__list">
		<?php foreach ( $hv_posts as $hv_p ) : ?>
			<li class="hv-side__item">
				<a href="<?php echo esc_url( get_permalink( $hv_p ) ); ?>">
					<?php if ( has_post_thumbnail( $hv_p ) ) : ?>
						<?php echo get_the_post_thumbnail( $hv_p, 'medium_large', array( 'class' => 'hv-side__img', 'loading' => 'lazy', 'alt' => hv_image_alt( $hv_p ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php endif; ?>
					<span class="hv-side__name"><?php echo esc_html( get_the_title( $hv_p ) ); ?></span>
				</a>
				<time class="hv-side__date" datetime="<?php echo esc_attr( get_the_date( 'c', $hv_p ) ); ?>"><?php echo esc_html( hv_post_datetime( $hv_p ) ); ?></time>
			</li>
		<?php endforeach; ?>
	</ul>
	<?php endif; ?>
</aside>
