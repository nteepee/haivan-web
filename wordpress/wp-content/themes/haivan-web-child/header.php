<?php
/**
 * Header: thanh vàng #FFC20E một dòng (logo, 5 nhóm menu có dropdown, hotline, Đăng nhập/Tài khoản, EN) + bảng menu điện thoại.
 * Cùng dữ liệu REST layout và cùng cấu trúc với Next.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$hv_lang   = hv_lang();
$hv_layout = hv_layout_for_lang( $hv_lang );
$hv_set    = hv_layout_settings();
$hv_switch = hv_language_switch();
$hv_home   = hv_lang_prefix( $hv_lang ) . '/';
$hv_tel    = preg_replace( '/[^0-9+]/', '', $hv_set['hotline'] );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'hv-body' ); ?>>
<?php wp_body_open(); ?>
<a class="hv-skip" href="#main"><?php echo esc_html( hv_t( 'skip' ) ); ?></a>
<header class="hv-header" data-scrolled="false">
	<div class="hv-container hv-header-row">
		<a class="hv-brand" href="<?php echo esc_url( $hv_home ); ?>" aria-label="<?php echo esc_attr( hv_t( 'home_aria' ) ); ?>">
			<img src="<?php echo esc_url( HV_WEB_URI . '/assets/img/logo.svg' ); ?>" width="121" height="24" alt="HAIVAN">
		</a>
		<?php hv_render_primary_nav( $hv_layout['primary'] ); ?>
		<?php if ( '' !== $hv_tel ) : ?>
			<a class="hv-header-call" href="tel:<?php echo esc_attr( $hv_tel ); ?>" aria-label="<?php echo esc_attr( sprintf( hv_t( 'call_hotline' ), $hv_set['hotline'] ) ); ?>">
				<?php echo hv_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span class="hv-header-call-num"><?php echo esc_html( $hv_set['hotline'] ); ?></span>
			</a>
		<?php endif; ?>
		<span class="hv-header-account" data-hv-account>
			<a class="hv-btn hv-btn--ghost hv-btn--sm" data-hv-login rel="nofollow" href="<?php echo esc_url( hv_login_url() ); ?>"><?php echo esc_html( hv_t( 'login' ) ); ?></a>
		</span>
		<a class="hv-lang" data-hv-lang="<?php echo esc_attr( $hv_switch['lang'] ); ?>" href="<?php echo esc_url( $hv_switch['url'] ); ?>" hreflang="<?php echo esc_attr( $hv_switch['lang'] ); ?>" lang="<?php echo esc_attr( $hv_switch['lang'] ); ?>" aria-label="<?php echo esc_attr( hv_t( 'language' ) ); ?>"><?php echo esc_html( $hv_switch['label'] ); ?></a>
		<?php hv_render_mobile_menu( $hv_layout['primary'], $hv_switch ); ?>
	</div>
</header>
<main id="main" class="hv-main">
