<?php
/**
 * Bài đọc hai cột (nội dung + cột liên quan) dùng cho bài điểm đến và tin công ty.
 * Tham số: trail (breadcrumb), related (WP_Post[]), tags (bool).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$hv_trail   = isset( $args['trail'] ) && is_array( $args['trail'] ) ? $args['trail'] : array();
$hv_related = isset( $args['related'] ) && is_array( $args['related'] ) ? $args['related'] : array();
$hv_tags    = ! empty( $args['tags'] ) ? get_the_terms( get_the_ID(), 'hv_tag' ) : array();
?>
<article <?php post_class( 'hv-container hv-page' ); ?>>
	<?php hv_breadcrumb_trail( $hv_trail ); ?>
	<div class="hv-cols">
		<div class="hv-cols__main">
			<h1><?php echo esc_html( get_the_title() ); ?></h1>
			<p class="hv-meta"><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( hv_post_datetime() ); ?></time></p>
			<div class="hv-entry hv-news"><?php the_content(); ?></div>
			<?php if ( is_array( $hv_tags ) && $hv_tags ) : ?>
				<p class="hv-tags"><span><?php echo esc_html( hv_t( 'tags' ) ); ?>:</span>
					<?php foreach ( $hv_tags as $hv_tag ) : ?>
						<span class="hv-tags__item"><?php echo esc_html( $hv_tag->name ); ?></span>
					<?php endforeach; ?>
				</p>
			<?php endif; ?>
		</div>
		<?php get_template_part( 'template-parts/side-posts', null, array( 'title' => hv_t( 'related_posts' ), 'posts' => $hv_related ) ); ?>
	</div>
</article>
