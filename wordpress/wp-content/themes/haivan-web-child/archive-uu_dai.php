<?php
/**
 * Trang /uu-dai (template khuyến mãi v2): đầu trang nền than + ưu đãi nổi bật → ưu đãi theo tuyến (lọc) → cách dùng
 * → chương trình khuyến mãi (bài uu_dai). Thẻ ưu đãi = CPT hv_offer (đang hiệu lực, theo Thứ tự; thẻ đầu là nổi bật);
 * chữ của trang sửa ở Ưu đãi → Trang Ưu đãi (v2) (inc/v2-story.php). Thành phần thẻ dùng chung với trang chủ.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
$hv_offers = hv_active_offers( 100 );
$hv_prefix = hv_lang_prefix();
list( $hv2_hot, $hv2_tel ) = hv2_hotline();
$hv2_feat  = $hv_offers ? $hv_offers[0] : null;
$hv2_lang  = hv_lang();
// Tab lọc: các tuyến chính có ưu đãi, theo thứ tự tuyến; thêm "Ưu đãi chung" nếu có thẻ không thuộc tuyến nào.
$hv2_groups = array();
foreach ( $hv_offers as $hv2_o ) {
	$hv2_groups[ hv2_offer_group( $hv2_o ) ] = true;
}
$hv2_tabs = array();
foreach ( hv_corridors_enabled() as $hv2_c ) {
	if ( isset( $hv2_groups[ $hv2_c['id'] ] ) ) {
		$hv2_tabs[ $hv2_c['id'] ] = $hv2_c['label'][ $hv2_lang ] ?: $hv2_c['label']['vi'];
	}
}
if ( isset( $hv2_groups[''] ) ) {
	$hv2_tabs['_'] = hv2_s( 'other_label' );
}
?>
<section class="hv2-promo-hero" aria-labelledby="hv2-h1">
	<div class="hv2-wrap">
		<?php hv_breadcrumb_trail( array( array( hv_t( 'home' ), home_url( $hv_prefix . '/' ) ), array( hv_t( 'offers_page_h1' ), '' ) ) ); ?>
		<div class="hv2-promo-hero-grid">
			<div>
				<p class="hv2-eyebrow"><span>01</span><?php echo esc_html( hv_t( 'offers_title' ) ); ?></p>
				<h1 id="hv2-h1"><?php echo esc_html( hv2_s( 'h1_a' ) ); ?> <em><?php echo esc_html( hv2_s( 'h1_b' ) ); ?></em></h1>
				<p class="hv2-page-lead"><?php echo esc_html( hv2_s( 'lead' ) ); ?></p>
				<p class="hv2-hero-links">
					<?php if ( $hv_offers ) : ?>
						<a href="#hv2-offers"><?php echo esc_html( hv2_s( 'list_eyebrow' ) ); ?><span aria-hidden="true">↓</span></a>
					<?php endif; ?>
					<a href="<?php echo esc_url( $hv2_tel ); ?>"><?php echo esc_html( $hv2_hot ); ?><span aria-hidden="true">↗</span></a>
				</p>
			</div>
			<?php if ( $hv2_feat ) : ?>
				<?php $hv2_flink = '' !== $hv2_feat['link'] ? hv_link_for_lang( $hv2_feat['link'] ) : ''; ?>
				<article class="hv2-promo-feat">
					<p class="hv2-promo-feat-k"><?php echo esc_html( hv2_s( 'feat_label' ) ); ?><?php echo '' !== $hv2_feat['badge'] ? ' · ' . esc_html( $hv2_feat['badge'] ) : ''; ?></p>
					<h2><?php echo esc_html( $hv2_feat['title'] ); ?></h2>
					<p class="hv2-promo-feat-price"><strong><?php echo esc_html( $hv2_feat['price'] ); ?></strong><?php echo '' !== $hv2_feat['unit'] ? ' <small>' . esc_html( $hv2_feat['unit'] ) . '</small>' : ''; ?></p>
					<?php if ( '' !== $hv2_feat['cond'] ) : ?>
						<p class="hv2-promo-feat-cond"><?php echo esc_html( $hv2_feat['cond'] ); ?></p>
					<?php endif; ?>
					<?php if ( '' !== $hv2_flink ) : ?>
						<a class="hv2-btn" href="<?php echo esc_url( $hv2_flink ); ?>"><?php echo esc_html( '' !== $hv2_feat['cta'] ? $hv2_feat['cta'] : hv_t( 'booking_label' ) ); ?></a>
					<?php endif; ?>
				</article>
			<?php endif; ?>
		</div>
	</div>
</section>

<section class="hv2-sec" id="hv2-offers" aria-labelledby="hv2-offers-h">
	<div class="hv2-wrap">
		<?php if ( $hv_offers ) : ?>
			<?php hv2_head( '02', 'hv2-offers-h', hv2_s( 'list_eyebrow' ), hv2_s( 'list_h2_a' ), hv2_s( 'list_h2_b' ) ); ?>
			<?php if ( count( $hv2_tabs ) > 1 ) : ?>
				<div class="hv2-filter" role="group" aria-label="<?php echo esc_attr( hv2_s( 'list_eyebrow' ) ); ?>" data-hv2-filter="#hv2-offer-list" hidden>
					<button type="button" data-key="" aria-pressed="true"><?php echo esc_html( hv2_s( 'all_label' ) ); ?></button>
					<?php foreach ( $hv2_tabs as $hv2_k => $hv2_l ) : ?>
						<button type="button" data-key="<?php echo esc_attr( '_' === $hv2_k ? 'chung' : $hv2_k ); ?>" aria-pressed="false"><?php echo esc_html( $hv2_l ); ?></button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<div id="hv2-offer-list"><?php echo hv2_offer_cards( $hv_offers, 'light', hv2_s( 'until' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv2_offer_cards(). ?></div>
		<?php else : ?>
			<div class="hv2-empty">
				<p><?php echo esc_html( hv_t( 'offers_empty' ) ); ?></p>
				<p class="hv-actions"><a class="hv2-btn" href="<?php echo esc_url( $hv_prefix . '/xe-khach' ); ?>"><?php echo esc_html( hv_t( 'offers_book' ) ); ?></a></p>
			</div>
		<?php endif; ?>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-how">
	<div class="hv2-wrap">
		<?php hv2_head( '03', 'hv2-how', hv2_s( 'how_eyebrow' ), hv2_s( 'how_h2_a' ), hv2_s( 'how_h2_b' ), '<p class="hv2-intro">' . wp_kses( sprintf( esc_html( hv2_s( 'how_help' ) ), '<a href="' . esc_url( $hv2_tel ) . '"><strong>' . esc_html( $hv2_hot ) . '</strong></a>' ), array( 'a' => array( 'href' => true ), 'strong' => array() ) ) . '</p>' ); ?>
		<ol class="hv2-howto">
			<?php foreach ( hv2_s_lines( 'how_steps' ) as $hv2_i => $hv2_st ) : ?>
				<li><span class="hv2-howto-n"><?php echo esc_html( sprintf( '%02d', $hv2_i + 1 ) ); ?></span><h3><?php echo esc_html( $hv2_st[0] ); ?></h3><p><?php echo esc_html( $hv2_st[1] ?? '' ); ?></p></li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>

<?php if ( have_posts() ) : ?>
<section class="hv2-sec" aria-labelledby="hv2-posts">
	<div class="hv2-wrap">
		<?php hv2_head( '04', 'hv2-posts', hv2_s( 'posts_eyebrow' ), hv2_s( 'posts_h2_a' ), hv2_s( 'posts_h2_b' ) ); ?>
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
						<h3><a href="<?php the_permalink(); ?>"><?php echo esc_html( hv2_clean_title( get_the_title() ) ); ?></a></h3>
						<?php if ( '' !== $hv_excerpt ) : ?>
							<p><?php echo esc_html( $hv_excerpt ); ?></p>
						<?php endif; ?>
					</div>
				</li>
			<?php endwhile; ?>
		</ul>
		<?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?>
	</div>
</section>
<?php endif; ?>
<?php get_footer(); ?>
