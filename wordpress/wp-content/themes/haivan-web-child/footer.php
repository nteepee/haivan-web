<?php
/**
 * Footer "mast": dải tải app + QR (trừ trang chủ, nơi dải này nằm giữa trang), logo + hotline, cột liên kết,
 * Đối tác/Thành viên/Thanh toán, tầng pháp lý (công ty, Chứng nhận, Theo dõi, Ứng dụng, bản quyền). Dữ liệu: REST layout.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$hv_lang = hv_lang();
$hv_site = hv_layout_payload();
$hv_loc  = $hv_site[ $hv_lang ];
$hv_tel  = preg_replace( '/[^0-9+]/', '', $hv_site['hotline'] );
$hv_cert = $hv_site['certificate'] ?? null;
?>
</main>
<?php
if ( ! is_front_page() ) {
	hv_render_app_band( hv_app_band_ground() );
}
?>
<footer class="hv-footer">
	<div class="hv-container">
		<div class="hv-footer-tier hv-footer-mast">
			<?php if ( ! empty( $hv_site['logo_white'] ) ) : ?>
				<?php echo hv_logo_img( $hv_site['logo_white'], hv_t( 'footer_logo_alt' ), 130, 24, 'hv-footer-logo' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<?php else : ?>
				<span></span>
			<?php endif; ?>
			<span></span>
			<?php if ( '' !== $hv_tel ) : ?>
				<a class="hv-footer-call" href="tel:<?php echo esc_attr( $hv_tel ); ?>"><?php echo hv_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><?php echo esc_html( $hv_site['hotline'] ); ?></span></a>
			<?php endif; ?>
		</div>
		<div class="hv-footer-tier hv-footer-cols">
			<?php foreach ( $hv_loc['footer_columns'] as $hv_col ) : ?>
				<nav aria-label="<?php echo esc_attr( $hv_col['title'] ); ?>">
					<p class="hv-footer-head"><?php echo esc_html( $hv_col['title'] ); ?></p>
					<ul>
						<?php foreach ( $hv_col['items'] as $hv_item ) : ?>
							<li><a class="hv-footer-link" <?php echo hv_link_attrs( $hv_item['href'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>><?php echo esc_html( $hv_item['label'] ); ?></a></li>
						<?php endforeach; ?>
					</ul>
				</nav>
			<?php endforeach; ?>
		</div>
		<?php if ( ! empty( $hv_site['partners'] ) || ! empty( $hv_site['members'] ) || ! empty( $hv_site['payments'] ) || $hv_cert ) : ?>
			<?php /* Một hàng gọn: Đối tác, Thành viên, Thanh toán, Chứng nhận; logo cao cố định trên chip sáng nhỏ. */ ?>
			<div class="hv-footer-tier hv-footer-trust">
				<?php hv_render_logo_group( hv_t( 'partners' ), $hv_site['partners'] ?? array() ); ?>
				<?php hv_render_logo_group( hv_t( 'members' ), $hv_site['members'] ?? array() ); ?>
				<?php hv_render_logo_group( hv_t( 'payment_methods' ), $hv_site['payments'] ?? array() ); ?>
				<?php
				if ( $hv_cert ) {
					hv_render_logo_group( hv_t( 'certification' ), array( array( 'img' => $hv_cert['img'], 'href' => $hv_cert['href'], 'alt' => $hv_cert['alt'] ?? hv_t( 'certification' ) ) ) );
				}
				?>
			</div>
		<?php endif; ?>
		<div class="hv-footer-tier hv-footer-bottom">
			<div class="hv-footer-legal">
				<p><strong><?php echo esc_html( $hv_loc['company']['name'] ); ?></strong></p>
				<?php foreach ( $hv_loc['company']['lines'] as $hv_line ) : ?>
					<p><?php echo esc_html( $hv_line ); ?></p>
				<?php endforeach; ?>
				<?php if ( '' !== $hv_tel ) : ?>
					<p><?php echo esc_html( hv_t( 'hotline_label' ) ); ?> <a href="tel:<?php echo esc_attr( $hv_tel ); ?>"><?php echo esc_html( $hv_site['hotline'] ); ?></a></p>
				<?php endif; ?>
			</div>
			<div class="hv-footer-follow">
				<?php
				$hv_social = array();
				foreach ( array( 'facebook' => 'Facebook', 'youtube' => 'YouTube' ) as $hv_k => $hv_n ) {
					if ( ! empty( $hv_site['social'][ $hv_k ] ) ) {
						$hv_social[] = array( 'href' => $hv_site['social'][ $hv_k ], 'icon' => '/assets/icons/' . $hv_k . '.svg', 'alt' => $hv_n );
					}
				}
				hv_render_icon_row( hv_t( 'follow_us' ), $hv_social );
				$hv_stores = array();
				if ( ! empty( $hv_site['apps'] ) && ! empty( $hv_site['badges']['appstore_icon'] ) ) {
					$hv_stores[] = array( 'href' => $hv_site['apps']['ios'], 'icon' => $hv_site['badges']['appstore_icon'], 'alt' => hv_t( 'app_store' ) );
				}
				if ( ! empty( $hv_site['apps'] ) && ! empty( $hv_site['badges']['playstore_icon'] ) ) {
					$hv_stores[] = array( 'href' => $hv_site['apps']['android'], 'icon' => $hv_site['badges']['playstore_icon'], 'alt' => hv_t( 'play_store' ) );
				}
				hv_render_icon_row( hv_t( 'app_hv' ), $hv_stores );
				?>
			</div>
		</div>
		<?php
		$hv_copy = $hv_site['copyright'] ?? '';
		$hv_copy = is_array( $hv_copy ) ? (string) ( $hv_copy[ $hv_lang ] ?? '' ) : (string) $hv_copy;
		?>
		<?php if ( '' !== $hv_copy ) : ?>
			<p class="hv-footer-copy"><?php echo esc_html( $hv_copy ); ?></p>
		<?php endif; ?>
	</div>
</footer>
<?php if ( preg_replace( '/[^0-9+]/', '', $hv_site['hotline'] ) ) : ?>
<a class="hv-call-fab" href="tel:<?php echo esc_attr( $hv_tel ); ?>" aria-label="<?php echo esc_attr( sprintf( hv_t( 'call_hotline' ), $hv_site['hotline'] ) ); ?>"><?php echo hv_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
<?php endif; ?>
<?php wp_footer(); ?>
</body>
</html>
