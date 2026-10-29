<?php
/**
 * Cài đặt > Layout Hải Vân: hotline, app, công ty, logo đối tác/thành viên/thanh toán, mạng xã hội,
 * chứng nhận, QR, huy hiệu app, bản quyền, logo trắng. Giá trị đi thẳng vào REST haivan-web/v1/layout.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'admin_menu',
	static function () {
		add_options_page( 'Layout Hải Vân', 'Layout Hải Vân', 'manage_options', 'hv-layout', 'hv_layout_settings_page' );
	}
);

add_action(
	'admin_init',
	static function () {
		register_setting(
			'hv_layout',
			'hv_layout_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => 'hv_layout_sanitize_settings',
				'default'           => array(),
			)
		);
	}
);

/**
 * @param mixed $input Dữ liệu form.
 * @return array<string,string>
 */
function hv_layout_sanitize_settings( $input ) {
	$input = is_array( $input ) ? $input : array();
	$out   = array();
	foreach ( array( 'hotline', 'company_name_vi', 'company_name_en', 'cert_alt', 'copyright', 'copyright_en' ) as $k ) {
		$out[ $k ] = sanitize_text_field( $input[ $k ] ?? '' );
	}
	foreach ( array( 'messenger', 'ios', 'android', 'social_facebook', 'social_youtube', 'cert_href' ) as $k ) {
		$out[ $k ] = hv_layout_http( $input[ $k ] ?? '' );
	}
	foreach ( array( 'cert_img', 'qr', 'badge_appstore', 'badge_playstore', 'badge_appstore_icon', 'badge_playstore_icon', 'logo_white' ) as $k ) {
		$out[ $k ] = hv_layout_img( $input[ $k ] ?? '' );
	}
	foreach ( array( 'company_lines_vi', 'company_lines_en' ) as $k ) {
		$out[ $k ] = sanitize_textarea_field( $input[ $k ] ?? '' );
	}
	// Danh sách logo: chuẩn hoá qua bộ phân tích để dòng sai bị loại ngay khi lưu.
	foreach ( array( 'partners', 'members', 'payments' ) as $k ) {
		$out[ $k ] = hv_layout_logos_to_text( hv_layout_text_to_logos( (string) ( $input[ $k ] ?? '' ) ) );
	}
	return $out;
}

function hv_layout_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = hv_layout_settings();
	$f = static function ( $key, $label, $type = 'text', $help = '' ) use ( $s ) {
		hv_admin_field( 'hv_layout_settings', $s, $key, $label, $type, $help );
	};
	$logo_help = 'Mỗi dòng một logo: <code>/assets/images/partner1.png | https://liên-kết (tuỳ chọn) | mô tả</code>. Ảnh là đường dẫn <code>/assets/...</code> (ảnh của Next) hoặc https. Để trống = ẩn cả hàng.';
	echo '<div class="wrap"><h1>Layout Hải Vân</h1>';
	echo '<p>Menu header/footer sửa tại <a href="' . esc_url( admin_url( 'nav-menus.php' ) ) . '">Giao diện &gt; Menu</a> (mỗi ngôn ngữ một menu). Trang này giữ phần còn lại của <code>/wp-json/haivan-web/v1/layout</code> (header, footer và dải tải app của cả WP lẫn Next). App Next.js cache tối đa 1 giờ.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'hv_layout' );
	echo '<h2>Liên hệ và ứng dụng</h2><table class="form-table" role="presentation">';
	$f( 'hotline', 'Hotline' );
	$f( 'messenger', 'Liên kết Messenger', 'url' );
	$f( 'ios', 'Liên kết App Store', 'url' );
	$f( 'android', 'Liên kết Google Play', 'url' );
	$f( 'qr', 'Ảnh mã QR tải ứng dụng', 'image', 'Đường dẫn <code>/assets/...</code> hoặc https.' );
	$f( 'badge_appstore', 'Huy hiệu App Store (dải tải app)', 'image' );
	$f( 'badge_playstore', 'Huy hiệu Google Play (dải tải app)', 'image' );
	$f( 'badge_appstore_icon', 'Biểu tượng App Store (chân trang)', 'image' );
	$f( 'badge_playstore_icon', 'Biểu tượng Google Play (chân trang)', 'image' );
	echo '</table><h2>Công ty</h2><table class="form-table" role="presentation">';
	$f( 'logo_white', 'Logo trắng (chân trang)', 'image' );
	$f( 'company_name_vi', 'Tên công ty (vi)' );
	$f( 'company_lines_vi', 'Dòng thông tin công ty (vi), mỗi dòng một mục', 'textarea' );
	$f( 'company_name_en', 'Tên công ty (en)' );
	$f( 'company_lines_en', 'Dòng thông tin công ty (en), mỗi dòng một mục', 'textarea' );
	$f( 'copyright', 'Dòng bản quyền (tiếng Việt)', 'text', 'Gõ <code>{year}</code> để luôn là năm hiện tại, vd. <code>Bản quyền © {year} Hải Vân</code>. Năm gõ tay đứng một mình sau dấu © cũng được thay bằng năm hiện tại.' );
	$f( 'copyright_en', 'Dòng bản quyền (tiếng Anh, trang /en/)', 'text', 'Vd. <code>Copyright © {year} Hai Van</code>.' );
	echo '</table><h2>Logo ở chân trang</h2><table class="form-table" role="presentation">';
	$f( 'partners', 'Đối tác', 'textarea', $logo_help );
	$f( 'members', 'Thành viên', 'textarea', $logo_help );
	$f( 'payments', 'Phương thức thanh toán', 'textarea', $logo_help );
	$f( 'cert_href', 'Chứng nhận: liên kết', 'url' );
	$f( 'cert_img', 'Chứng nhận: ảnh', 'image' );
	$f( 'cert_alt', 'Chứng nhận: mô tả ảnh' );
	$f( 'social_facebook', 'Facebook', 'url' );
	$f( 'social_youtube', 'YouTube', 'url' );
	echo '</table>';
	submit_button();
	echo '</form></div>';
}
