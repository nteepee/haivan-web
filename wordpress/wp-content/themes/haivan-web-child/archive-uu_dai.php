<?php
/**
 * Trang /uu-dai: mọi ưu đãi đang chạy (CPT hv_offer: đã xuất bản, trong lịch), cùng cấu trúc thẻ với trang chủ.
 * Bên dưới: các bài ưu đãi chi tiết (CPT uu_dai) nếu có. Bảng màu trang này chỉ vàng / xám / trắng (anh yêu cầu):
 * dải nền vàng, thẻ trắng, nhãn xám, nút vàng — màu MKT chọn cho thẻ chỉ áp ở trang chủ.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
$hv_offers = hv_active_offers( 100 );
$hv_prefix = hv_lang_prefix();
$hv_set    = hv_layout_settings();
$hv_tel    = preg_replace( '/[^0-9+]/', '', $hv_set['hotline'] );
?>
<section class="hv-offer-band">
<div class="hv-container">
	<?php
	hv_breadcrumb_trail(
		array(
			array( hv_t( 'home' ), home_url( $hv_prefix . '/' ) ),
			array( hv_t( 'offers_page_h1' ), '' ),
		)
	);
	?>
	<header class="hv-page-head">
		<h1><?php echo esc_html( hv_t( 'offers_page_h1' ) ); ?></h1>
		<p class="hv-offer-lead"><?php echo esc_html( hv_t( 'offers_page_lead' ) ); ?></p>
	</header>

	<?php if ( $hv_offers ) : ?>
		<h2 class="hv-sr"><?php echo esc_html( hv_t( 'offers_list_h2' ) ); ?></h2>
		<ul class="hv-offer-grid">
			<?php echo implode( '', array_map( 'hv_offer_card_html', $hv_offers ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- hv_offer_card_html đã escape. ?>
		</ul>
	<?php else : ?>
		<div class="hv-offer-empty">
			<p><?php echo esc_html( hv_t( 'offers_empty' ) ); ?></p>
			<div class="hv-offer-empty-actions">
				<a class="hv-btn hv-btn--primary hv-btn--lg" href="<?php echo esc_url( $hv_prefix . '/xe-khach' ); ?>"><?php echo esc_html( hv_t( 'offers_book' ) ); ?></a>
				<?php if ( '' !== $hv_tel ) : ?>
					<a class="hv-btn hv-btn--ghost hv-btn--lg" href="tel:<?php echo esc_attr( $hv_tel ); ?>"><?php echo hv_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số. ?><?php echo esc_html( sprintf( hv_t( 'cta_call' ), $hv_set['hotline'] ) ); ?></a>
				<?php endif; ?>
			</div>
		</div>
	<?php endif; ?>
</div>
</section>

<?php if ( have_posts() ) : ?>
<div class="hv-container hv-page">
		<section class="hv-offer-posts" aria-labelledby="hv-offer-posts-h">
			<h2 id="hv-offer-posts-h"><?php echo esc_html( hv_t( 'offer_posts' ) ); ?></h2>
			<ul class="hv-cards">
				<?php
				while ( have_posts() ) :
					the_post();
					$hv_excerpt = wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 28 );
					?>
					<li class="hv-card">
						<div class="hv-card-img"><?php echo hv_card_image( get_post(), 'medium_large', '' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
						<div class="hv-card-body">
							<h3><a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a></h3>
							<?php if ( '' !== $hv_excerpt ) : ?>
								<p><?php echo esc_html( $hv_excerpt ); ?></p>
							<?php endif; ?>
						</div>
					</li>
				<?php endwhile; ?>
			</ul>
			<?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?>
		</section>
</div>
<?php endif; ?>
<?php get_footer(); ?>
