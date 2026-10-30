<?php
/**
 * Giới thiệu (/chung-toi/gioi-thieu) v2: Niềm tin → Câu chuyện → Tâm và Hành → Ba giá trị → Dịch vụ → Thành tựu
 * → Khách hàng kể → Phụng sự → Hành trình tiếp theo. Chữ đã duyệt: docs/redesign-v2/02-gioi-thieu.md; MKT sửa trong hộp
 * "Nội dung trang (v2)" (inc/v2-story.php). Dịch vụ, con số, phụng sự dùng lại đúng thành phần của trang chủ.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv2_p     = hv_lang_prefix();
$hv2_trail = hv_page_trail( get_post() );
$hv2_nav   = hv_page_subnav( get_post() );
?>
<div class="hv2-wrap hv-page hv2-story-page">
	<?php hv_breadcrumb_trail( $hv2_trail ); ?>
	<?php hv2_page_head( hv2_section_label( $hv2_trail ), hv2_s( 'h1_a' ), hv2_s( 'lead' ), '', hv2_s( 'h1_b' ) ); ?>
	<?php if ( $hv2_nav ) : ?>
		<nav class="hv2-tabs" aria-label="<?php echo esc_attr( hv_t( 'subnav' ) ); ?>">
			<ul class="hv-subnav">
				<?php foreach ( $hv2_nav as $hv2_i ) : ?>
					<li><a href="<?php echo esc_url( $hv2_i[1] ); ?>"<?php echo $hv2_i[2] ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $hv2_i[0] ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>
	<?php endif; ?>
	<figure class="hv2-wide-photo"><?php echo hv2_story_img( hv2_s( 'hero_img' ), hv2_s( 'hero_alt' ), 'fetchpriority="high" decoding="async"' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></figure>
</div>

<section class="hv2-sec" aria-labelledby="hv2-st">
	<div class="hv2-wrap hv2-split">
		<div>
			<?php hv2_head( '02', 'hv2-st', hv2_s( 'st_eyebrow' ), hv2_s( 'st_h2_a' ), hv2_s( 'st_h2_b' ) ); ?>
			<div class="hv2-prose">
				<p><?php echo esc_html( hv2_s( 'st_p1' ) ); ?></p>
				<p><?php echo esc_html( hv2_s( 'st_p2' ) ); ?></p>
				<?php $hv2_list = hv2_s_lines( 'st_list' ); ?>
				<?php if ( $hv2_list ) : ?>
					<ul class="hv2-ticklist">
						<?php foreach ( $hv2_list as $hv2_l ) : ?>
							<li><?php echo esc_html( $hv2_l[0] ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>
			<blockquote class="hv2-quote"><p><?php echo esc_html( hv2_s( 'st_quote' ) ); ?></p></blockquote>
		</div>
		<figure class="hv2-split-photo"><?php echo hv2_story_img( hv2_s( 'st_img' ), hv2_s( 'st_alt' ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?></figure>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-th">
	<div class="hv2-wrap">
		<?php hv2_head( '03', 'hv2-th', hv2_s( 'th_eyebrow' ), hv2_s( 'th_h2_a' ), hv2_s( 'th_h2_b' ) ); ?>
		<div class="hv2-pairs" role="table" aria-label="<?php echo esc_attr( hv2_s( 'th_col_a' ) . ' – ' . hv2_s( 'th_col_b' ) ); ?>">
			<div class="hv2-pairs-head" role="row"><span role="columnheader"><?php echo esc_html( hv2_s( 'th_col_a' ) ); ?></span><span role="columnheader"><?php echo esc_html( hv2_s( 'th_col_b' ) ); ?></span></div>
			<?php foreach ( hv2_s_lines( 'th_rows' ) as $hv2_i => $hv2_r ) : ?>
				<div class="hv2-pairs-row" role="row">
					<p role="cell"><span class="hv2-no"><?php echo esc_html( sprintf( '%02d', $hv2_i + 1 ) ); ?></span><?php echo esc_html( $hv2_r[0] ); ?></p>
					<p role="cell"><?php echo esc_html( $hv2_r[1] ?? '' ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="hv2-sec" aria-labelledby="hv2-va">
	<div class="hv2-wrap">
		<?php hv2_head( '04', 'hv2-va', hv2_s( 'va_eyebrow' ), hv2_s( 'va_h2_a' ), hv2_s( 'va_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_s( 'va_intro' ) ) . '</p>' ); ?>
		<ul class="hv2-cards3">
			<?php for ( $hv2_n = 1; $hv2_n <= 3; $hv2_n++ ) : ?>
				<li class="hv2-card">
					<span class="hv2-card-img"><?php echo hv2_story_img( hv2_s( "va_{$hv2_n}_img" ), hv2_s( "va_{$hv2_n}_t" ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					<div class="hv2-card-body"><span class="hv2-no">0<?php echo (int) $hv2_n; ?></span><h3><?php echo esc_html( hv2_s( "va_{$hv2_n}_t" ) ); ?></h3><p><?php echo esc_html( hv2_s( "va_{$hv2_n}_d" ) ); ?></p></div>
				</li>
			<?php endfor; ?>
		</ul>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-svc">
	<div class="hv2-wrap">
		<?php hv2_head( '05', 'hv2-svc', hv2_t( 'svc_eyebrow' ), hv2_t( 'svc_h2_a' ), hv2_t( 'svc_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_t( 'svc_intro' ) ) . '</p>' ); ?>
		<?php hv2_render_services(); ?>
	</div>
</section>

<section class="hv2-sec hv2-sec--dark hv2-sec--stats" aria-labelledby="hv2-stt">
	<div class="hv2-wrap hv2-stats-wrap">
		<?php hv2_head( '06', 'hv2-stt', hv2_t( 'st_eyebrow' ), hv2_t( 'st_h2_a' ), hv2_t( 'st_h2_b' ) ); ?>
		<?php hv2_render_stats(); ?>
		<?php if ( '' !== hv2_s( 'ms_text' ) ) : ?>
			<p class="hv2-milestone"><?php echo esc_html( hv2_s( 'ms_text' ) ); ?></p>
		<?php endif; ?>
	</div>
</section>

<section class="hv2-sec" aria-labelledby="hv2-rv">
	<div class="hv2-wrap">
		<?php hv2_head( '07', 'hv2-rv', hv2_s( 'rv_eyebrow' ), hv2_s( 'rv_h2_a' ), hv2_s( 'rv_h2_b' ), hv2_link( $hv2_p . '/chung-toi/danh-gia-cua-khach-hang', hv2_s( 'rv_more' ) ) ); ?>
		<ul class="hv2-quotes">
			<?php foreach ( hv2_s_lines( 'rv_items' ) as $hv2_q ) : ?>
				<li><figure><blockquote><p><?php echo esc_html( $hv2_q[0] ); ?></p></blockquote><figcaption><?php echo esc_html( $hv2_q[1] ?? '' ); ?></figcaption></figure></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-csr">
	<div class="hv2-wrap">
		<?php hv2_head( '08', 'hv2-csr', hv2_t( 'csr_eyebrow' ), hv2_t( 'csr_h2_a' ), hv2_t( 'csr_h2_b' ), '<div class="hv2-head-end"><p class="hv2-intro">' . esc_html( hv2_t( 'csr_intro' ) ) . '</p>' . hv2_link( $hv2_p . '/chung-toi/phat-trien-ben-vung', hv2_t( 'csr_more' ) ) . '</div>' ); ?>
		<?php hv2_render_csr(); ?>
	</div>
</section>

<section class="hv2-sec hv2-sec--dark" aria-labelledby="hv2-nx">
	<div class="hv2-wrap">
		<?php hv2_head( '09', 'hv2-nx', hv2_s( 'nx_eyebrow' ), hv2_s( 'nx_h2_a' ), hv2_s( 'nx_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_s( 'nx_intro' ) ) . '</p>' ); ?>
		<ul class="hv2-rows">
			<?php foreach ( hv2_s_lines( 'nx_items' ) as $hv2_i => $hv2_x ) : ?>
				<li><a href="<?php echo esc_url( 0 === strpos( $hv2_x[1] ?? '', '/' ) ? $hv2_p . $hv2_x[1] : ( $hv2_x[1] ?? '' ) ); ?>"><span class="hv2-no"><?php echo esc_html( sprintf( '%02d', $hv2_i + 1 ) ); ?></span><span class="hv2-rows-t"><?php echo esc_html( $hv2_x[0] ); ?></span><span class="hv2-rows-go" aria-hidden="true">↗</span></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
<?php
get_footer();
