<?php
/**
 * Trang chủ v3 (kiểu ứng dụng): dải vàng (H1 display + banner carousel) → thẻ tìm vé nổi → dải 4 cam kết →
 * Ưu đãi hôm nay → Tuyến phổ biến → Điểm đến → Tin tức → dải app vàng → phòng chờ. Mọi khối lấy từ CPT/cài đặt
 * của MKT (docs/wordpress.md); khối không có dữ liệu bị ẩn hẳn, nền các khối xen kẽ tự điều chỉnh.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv_set      = hv_home_settings();
$hv_vi       = 'vi' === hv_lang();
$hv_h1       = $hv_vi ? $hv_set['h1'] : hv_t( 'hero_title' );
$hv_lead     = $hv_vi ? $hv_set['lead'] : hv_t( 'hero_lead' );
$hv_carousel = hv_render_banner_carousel();
$hv_prefix   = hv_lang_prefix();

// Các khối cuộn ngang: [id, tiêu đề, liên kết "tất cả", nhãn liên kết, HTML thẻ, lớp rail, rail thành lưới khi đủ chỗ].
$hv_blocks = array_filter(
	array(
		array( 'offers', hv_t( 'offers_title' ), '' !== $hv_set['offers_url'] ? $hv_prefix . $hv_set['offers_url'] : '', hv_t( 'all_offers' ), hv_render_offer_cards(), 'hv-hrail--offers', false ),
		array( 'routes', hv_t( 'popular_routes' ), $hv_prefix . '/xe-khach', hv_t( 'all_routes' ), hv_render_route_cards(), 'hv-hrail--routes', false ),
		array( 'dest', hv_t( 'destinations' ), get_post_type_archive_link( 'diem_den' ) ?: home_url( '/diem-den' ), hv_t( 'all_destinations' ), hv_render_dest_rail(), 'hv-hrail--dest', false ),
		array( 'news', hv_t( 'news' ), get_post_type_archive_link( 'tin_tuc' ) ?: home_url( '/chung-toi/bao-chi-tin-tuc' ), hv_t( 'all_news' ), hv_render_news_cards(), 'hv-hrail--grid3', true ),
	),
	static fn( $b ) => '' !== $b[4]
);
// Nền xen kẽ trắng → xám → ấm, không bao giờ hai nền giống nhau liền nhau (trước đó là dải cam kết nền ấm, trước nữa là dải "Chuyến hôm nay" nền trắng).
$hv_grounds = array( 'white', 'grey', 'warm' );
?>
<section class="hv-hero<?php echo '' === $hv_carousel ? ' hv-hero--plain' : ''; ?>" aria-label="<?php echo esc_attr( hv_t( 'booking_label' ) ); ?>">
	<div class="hv-brand-band">
		<div class="hv-container">
			<div class="hv-lede"><h1><?php echo esc_html( $hv_h1 ); ?></h1><?php echo '' !== $hv_lead ? '<p class="hv-lead">' . esc_html( $hv_lead ) . '</p>' : ''; ?></div>
		</div>
	</div>
	<?php /* Banner tràn mép; thẻ tìm vé (kính từ 40rem) nằm đáy banner, phần trên để trống cho tiêu đề của slide. */ ?>
	<div class="hv-hero-stage<?php echo '' !== $hv_carousel ? ' hv-hero-stage--banner' : ''; ?>">
		<?php echo $hv_carousel; // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape trong hv_render_banner_carousel(). ?>
		<div class="hv-container hv-hero-card-wrap">
			<div class="hv-hero-card"><?php echo do_shortcode( '[haivan_search today="strip"]' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		</div>
	</div>
</section>

<?php echo hv_search_today_strip(); // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape trong hv_search_shortcode(). ?>

<section class="hv-section hv-section--warm hv-after-hero" aria-labelledby="hv-trust">
	<div class="hv-container">
		<h2 class="hv-sr" id="hv-trust"><?php echo esc_html( hv_t( 'trust_heading' ) ); ?></h2>
		<?php hv_render_trust(); ?>
	</div>
</section>

<?php foreach ( array_values( $hv_blocks ) as $hv_i => $hv_b ) : ?>
<section class="hv-section hv-section--<?php echo esc_attr( $hv_grounds[ $hv_i % 3 ] ); ?>" aria-labelledby="hv-<?php echo esc_attr( $hv_b[0] ); ?>">
	<div class="hv-container">
		<?php hv_block_head( 'hv-' . $hv_b[0], $hv_b[1], $hv_b[2], $hv_b[3], 'hv-rail-' . $hv_b[0], $hv_b[6] ); ?>
		<?php hv_rail( 'hv-rail-' . $hv_b[0], $hv_b[1], $hv_b[4], $hv_b[5] ); ?>
	</div>
</section>
<?php endforeach; ?>

<?php hv_render_app_band(); ?>

<section class="hv-section hv-section--white" aria-labelledby="hv-rooms">
	<div class="hv-container">
		<div class="hv-section-head"><h2 id="hv-rooms"><?php echo esc_html( hv_t( 'rooms_title' ) ); ?></h2></div>
		<?php hv_render_rooms(); ?>
	</div>
</section>

<?php if ( '' !== trim( get_the_content() ) ) : ?>
<section class="hv-section hv-section--warm"><div class="hv-container hv-entry"><?php the_content(); ?></div></section>
<?php endif; ?>
<?php echo hv_render_popup_template(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
<?php get_footer(); ?>
