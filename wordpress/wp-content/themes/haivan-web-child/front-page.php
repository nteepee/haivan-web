<?php
/**
 * Trang chủ v2 "Tử tế từ Tâm – Chu đáo từ Hành": 12 khối, mỗi khối một câu Tâm + bằng chứng Hành.
 * Lời hứa → Đặt vé → Dịch vụ → 5 chặng của một chuyến đi → Ưu đãi → Tuyến → Phòng chờ → Con số → Phụng sự
 * → Điểm đến → Ứng dụng → Tin. Chữ đã duyệt: docs/redesign-v2/01-trang-chu.md; render: inc/home-v2.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv2_p                     = hv_lang_prefix();
list( $hv2_hot, $hv2_tel ) = hv2_hotline();
$hv2_offers                = hv2_render_offers();
$hv2_routes                = hv2_render_routes();
$hv2_dests                 = hv2_render_destinations();
$hv2_news                  = hv2_render_news();
?>
<div class="hv2">

<section class="hv2-hero" aria-labelledby="hv2-h1">
	<?php echo hv2_img_tag( 'hero-tay-bac.webp', hv2_t( 'hero_alt' ), 'class="hv2-hero-img" fetchpriority="high" decoding="async"' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	<div class="hv2-hero-copy">
		<p class="hv2-eyebrow hv2-eyebrow--light"><span>01</span><?php echo esc_html( hv2_t( 'hero_kicker' ) ); ?></p>
		<h1 id="hv2-h1"><span class="hv2-h1-brand"><?php echo esc_html( hv2_t( 'hero_h1_a' ) ); ?></span> <em><?php echo esc_html( hv2_t( 'hero_h1_b' ) ); ?><br><?php echo esc_html( hv2_t( 'hero_h1_c' ) ); ?></em></h1>
		<p class="hv2-hero-lead"><?php echo esc_html( hv2_t( 'hero_lead' ) ); ?></p>
		<p class="hv2-hero-links">
			<a href="#hv2-book"><?php echo esc_html( hv2_t( 'hero_find' ) ); ?><span aria-hidden="true">↗</span></a>
			<a href="<?php echo esc_url( $hv2_p . '/chung-toi/gioi-thieu' ); ?>"><?php echo esc_html( hv2_t( 'hero_story' ) ); ?><span aria-hidden="true">↗</span></a>
		</p>
	</div>
	<p class="hv2-hero-foot" aria-hidden="true"><span><?php echo esc_html( hv2_t( 'hero_foot_a' ) ); ?></span><span><?php echo esc_html( hv2_t( 'hero_foot_b' ) ); ?></span></p>
</section>

<section class="hv2-book" id="hv2-book" aria-labelledby="hv2-book-h">
	<div class="hv2-wrap">
		<div class="hv2-book-card">
			<div class="hv2-book-top">
				<div><p class="hv2-eyebrow"><span>02</span><?php echo esc_html( hv2_t( 'book_eyebrow' ) ); ?></p><h2 id="hv2-book-h"><?php echo esc_html( hv2_t( 'book_h2' ) ); ?></h2></div>
				<?php /* Bật bằng home-v2.js: bấm "Khứ hồi" = bấm "Thêm ngày về" của form, "Một chiều" = bỏ ngày về. */ ?>
				<div class="hv2-trip" role="group" aria-label="<?php echo esc_attr( hv2_t( 'trip_label' ) ); ?>" data-hv2-trip hidden>
					<button type="button" data-trip="ow" aria-pressed="true"><?php echo esc_html( hv2_t( 'trip_ow' ) ); ?></button>
					<button type="button" data-trip="rt" aria-pressed="false"><?php echo esc_html( hv2_t( 'trip_rt' ) ); ?></button>
				</div>
			</div>
			<?php echo do_shortcode( '[haivan_search today="strip"]' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<p class="hv2-book-help"><?php echo wp_kses( sprintf( esc_html( hv2_t( 'book_help' ) ), '<a href="' . esc_url( $hv2_tel ) . '">' . esc_html( $hv2_hot ) . '</a>' ), array( 'a' => array( 'href' => true ) ) ); ?></p>
		</div>
	</div>
	<?php echo hv_search_today_strip(); // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape trong hv_search_shortcode(). ?>
</section>

<section class="hv2-sec" aria-labelledby="hv2-svc">
	<div class="hv2-wrap">
		<?php hv2_head( '03', 'hv2-svc', hv2_t( 'svc_eyebrow' ), hv2_t( 'svc_h2_a' ), hv2_t( 'svc_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_t( 'svc_intro' ) ) . '</p>' ); ?>
		<?php hv2_render_services(); ?>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-jr">
	<div class="hv2-wrap">
		<?php hv2_head( '04', 'hv2-jr', hv2_t( 'jr_eyebrow' ), hv2_t( 'jr_h2_a' ), hv2_t( 'jr_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_t( 'jr_intro' ) ) . '</p>' ); ?>
		<?php hv2_render_journey(); ?>
	</div>
</section>

<?php if ( '' !== $hv2_offers ) : ?>
<section class="hv2-sec hv2-sec--dark" aria-labelledby="hv2-off">
	<div class="hv2-wrap">
		<?php hv2_head( '05', 'hv2-off', hv2_t( 'off_eyebrow' ), hv2_t( 'off_h2_a' ), hv2_t( 'off_h2_b' ), hv2_link( $hv2_p . '/uu-dai', hv2_t( 'off_all' ) ) ); ?>
		<?php echo $hv2_offers; // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv2_render_offers(). ?>
	</div>
</section>
<?php endif; ?>

<?php if ( '' !== $hv2_routes ) : ?>
<section class="hv2-sec" aria-labelledby="hv2-rt">
	<div class="hv2-wrap">
		<?php hv2_head( '06', 'hv2-rt', hv2_t( 'rt_eyebrow' ), hv2_t( 'rt_h2_a' ), hv2_t( 'rt_h2_b' ), hv2_link( $hv2_p . '/xe-khach', hv2_t( 'rt_all' ) ) ); ?>
		<?php echo $hv2_routes; // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv2_render_routes(). ?>
	</div>
</section>
<?php endif; ?>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-lg">
	<div class="hv2-wrap">
		<?php hv2_head( '07', 'hv2-lg', hv2_t( 'lg_eyebrow' ), hv2_t( 'lg_h2_a' ), hv2_t( 'lg_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_t( 'lg_intro' ) ) . '</p>' ); ?>
		<?php hv2_render_lounges(); ?>
	</div>
</section>

<section class="hv2-sec hv2-sec--dark hv2-sec--stats" aria-labelledby="hv2-st">
	<div class="hv2-wrap hv2-stats-wrap">
		<?php hv2_head( '08', 'hv2-st', hv2_t( 'st_eyebrow' ), hv2_t( 'st_h2_a' ), hv2_t( 'st_h2_b' ) ); ?>
		<?php hv2_render_stats(); ?>
	</div>
</section>

<section class="hv2-sec" aria-labelledby="hv2-csr">
	<div class="hv2-wrap">
		<?php hv2_head( '09', 'hv2-csr', hv2_t( 'csr_eyebrow' ), hv2_t( 'csr_h2_a' ), hv2_t( 'csr_h2_b' ), '<div class="hv2-head-end"><p class="hv2-intro">' . esc_html( hv2_t( 'csr_intro' ) ) . '</p>' . hv2_link( $hv2_p . '/chung-toi/phat-trien-ben-vung', hv2_t( 'csr_more' ) ) . '</div>' ); ?>
		<?php hv2_render_csr(); ?>
	</div>
</section>

<?php if ( '' !== $hv2_dests ) : ?>
<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-ds">
	<div class="hv2-wrap">
		<?php hv2_head( '10', 'hv2-ds', hv2_t( 'ds_eyebrow' ), hv2_t( 'ds_h2_a' ), hv2_t( 'ds_h2_b' ), hv2_link( get_post_type_archive_link( 'diem_den' ) ?: home_url( '/diem-den' ), hv2_t( 'ds_all' ) ) ); ?>
		<?php echo $hv2_dests; // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv2_render_destinations(). ?>
	</div>
</section>
<?php endif; ?>

<?php hv2_render_app(); ?>

<?php if ( '' !== $hv2_news ) : ?>
<section class="hv2-sec" aria-labelledby="hv2-nw">
	<div class="hv2-wrap">
		<?php hv2_head( '12', 'hv2-nw', hv2_t( 'nw_eyebrow' ), hv2_t( 'nw_h2_a' ), hv2_t( 'nw_h2_b' ), hv2_link( get_post_type_archive_link( 'tin_tuc' ) ?: home_url( '/chung-toi/bao-chi-tin-tuc' ), hv2_t( 'nw_all' ) ) ); ?>
		<?php echo $hv2_news; // phpcs:ignore WordPress.Security.EscapeOutput -- escape trong hv2_render_news(). ?>
	</div>
</section>
<?php endif; ?>

<?php if ( '' !== trim( get_the_content() ) ) : ?>
<section class="hv2-sec hv2-sec--tint"><div class="hv2-wrap hv-entry"><?php the_content(); ?></div></section>
<?php endif; ?>
</div>
<?php echo hv_render_popup_template(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
<?php get_footer(); ?>
