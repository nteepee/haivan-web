<?php
/**
 * Cài đặt > Trang chủ Hải Vân: H1 + câu mô tả, ảnh phòng chờ, địa chỉ, dải app.
 * Banner = CPT hv_banner; ưu đãi = CPT hv_offer; tuyến = CPT hv_route; điểm đến = CPT diem_den; tin = CPT tin_tuc (xem docs/wordpress.md).
 * Ảnh mặc định là ảnh của Next (/assets/design/...), MKT đổi sang ảnh trong Media bất kỳ lúc nào.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Giá trị mặc định (nội dung đã duyệt ở comp trang chủ v3).
 *
 * @return array<string,string>
 */
function hv_home_defaults() {
	$d = array(
		'h1'          => 'Đặt vé xe khách Hải Vân',
		'lead'        => 'Tự chọn giường hoặc ghế, giữ vé điện tử trên điện thoại.',
		'offers_url'  => '/uu-dai',
		'show_service_tabs' => '', // '1' = hiện hàng tab Xe sân bay / Xe hợp đồng / Xe du lịch trong ô tìm vé (mặc định tắt).
		'addresses'   => "34 Nguyễn Thái Bình | Quận 1, Sài Gòn\n307 Nguyễn Văn Trỗi | Sài Gòn\n607 Điện Biên Phủ | Sài Gòn\n156B Lê Hồng Phong | Vũng Tàu\n01 Nguyễn Hoàng | Mỹ Đình, Hà Nội\nQuầy Tân Sơn Nhất | Nhà ga T1, T2, T3",
		'app_bullets' => "Theo dõi lộ trình và vị trí xe\nKhông sợ mất vé\nTích điểm đổi vé, khuyến mãi liên tục\nKhách hàng thân thiết | /chung-toi/chuong-trinh-khach-hang-than-thiet",
		'app_phone'   => '/assets/design/app-phone.webp',
		// Bản tiếng Anh của các khối chữ tự do ở trang chủ /en/ (trống = dùng mặc định tiếng Anh này, không lấy bản tiếng Việt).
		'addresses_en'   => "34 Nguyễn Thái Bình | District 1, Saigon\n307 Nguyễn Văn Trỗi | Saigon\n607 Điện Biên Phủ | Saigon\n156B Lê Hồng Phong | Vung Tau\n01 Nguyễn Hoàng | Mỹ Đình, Hanoi\nTan Son Nhat counter | Terminals T1, T2, T3",
		'app_bullets_en' => "Track the route and the bus position\nNever lose your ticket\nEarn points for tickets and enjoy ongoing deals\nLoyalty program | /chung-toi/chuong-trinh-khach-hang-than-thiet",
	);
	$mos = array(
		array( 'phong_cho_1.jpg', 'Phòng chờ Hải Vân: ghế sofa, quầy trà bánh, khách ngồi nghỉ', 'Hai Van waiting room: sofas, a tea and snack counter, guests resting' ),
		array( 'phong_cho_2.jpg', 'Quầy trà bánh và trái cây trong phòng chờ', 'Tea, snack and fruit counter in the waiting room' ),
		array( 'phong_cho_3.jpg', 'Khách chờ xe trong phòng chờ có điều hòa', 'Guests waiting for their bus in an air-conditioned waiting room' ),
		array( 'phong_ve.jpg', 'Nhân viên quầy vé Hải Vân hỗ trợ khách', 'Hai Van ticket counter staff helping a guest' ),
	);
	foreach ( $mos as $i => $m ) {
		$n                      = $i + 1;
		$d[ "mosaic_{$n}_img" ] = '/assets/design/' . $m[0];
		$d[ "mosaic_{$n}_alt" ]    = $m[1];
		$d[ "mosaic_{$n}_alt_en" ] = $m[2];
	}
	return $d;
}

/** Cài đặt trang chủ: mặc định + giá trị MKT đã lưu (ô để trống = dùng mặc định cho văn bản, ẩn cho ảnh phụ). */
function hv_home_settings() {
	$saved = get_option( 'hv_home_settings', array() );
	$saved = is_array( $saved ) ? array_filter( $saved, static fn( $v ) => is_string( $v ) && '' !== trim( $v ) ) : array();
	return array_merge( hv_home_defaults(), $saved );
}

/**
 * Chữ tự do của trang chủ theo ngôn ngữ hiện tại: /en/ dùng ô "<khoá>_en" (mặc định là tiếng Anh), vi dùng ô gốc.
 *
 * @param string $key Khoá trong hv_home_defaults() (không kèm hậu tố _en).
 */
function hv_home_text( $key ) {
	$s = hv_home_settings();
	if ( 'en' === hv_lang() && isset( $s[ $key . '_en' ] ) && '' !== trim( (string) $s[ $key . '_en' ] ) ) {
		return (string) $s[ $key . '_en' ];
	}
	return (string) ( $s[ $key ] ?? '' );
}

/** Ảnh từ cài đặt: /assets/... hoặc https (cùng quy tắc layout). */
function hv_home_img( $v ) {
	return hv_layout_img( $v );
}

add_action(
	'admin_menu',
	static function () {
		add_options_page( 'Trang chủ Hải Vân', 'Trang chủ Hải Vân', 'manage_options', 'hv-home', 'hv_home_settings_page' );
	}
);

add_action(
	'admin_init',
	static function () {
		register_setting(
			'hv_home',
			'hv_home_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => 'hv_home_sanitize_settings',
				'default'           => array(),
			)
		);
	}
);

/**
 * @param mixed $input Dữ liệu form.
 * @return array<string,string>
 */
function hv_home_sanitize_settings( $input ) {
	$input = is_array( $input ) ? $input : array();
	$out   = array();
	foreach ( array_keys( hv_home_defaults() ) as $k ) {
		$v = $input[ $k ] ?? '';
		if ( 1 === preg_match( '/^(?:addresses|app_bullets)(?:_en)?$/', $k ) ) {
			$out[ $k ] = sanitize_textarea_field( $v );
		} elseif ( preg_match( '/_img$|^app_phone$/', $k ) ) {
			$out[ $k ] = hv_layout_img( $v );
		} elseif ( 'show_service_tabs' === $k ) {
			$out[ $k ] = '1' === (string) $v ? '1' : '';
		} elseif ( 'offers_url' === $k ) {
			$out[ $k ] = hv_search_local_path( $v, '' );
		} else {
			$out[ $k ] = sanitize_text_field( $v );
		}
	}
	return $out;
}

function hv_home_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s = hv_home_settings();
	$f = static function ( $key, $label, $type = 'text', $help = '' ) use ( $s ) {
		hv_admin_field( 'hv_home_settings', $s, $key, $label, $type, $help );
	};
	echo '<div class="wrap"><h1>Trang chủ Hải Vân</h1><p>Các khối còn lại của trang chủ: <a href="' . esc_url( admin_url( 'edit.php?post_type=hv_banner' ) ) . '">Banner</a>, <a href="' . esc_url( admin_url( 'edit.php?post_type=hv_offer' ) ) . '">Ưu đãi hôm nay</a>, <a href="' . esc_url( admin_url( 'edit.php?post_type=hv_route' ) ) . '">Tuyến phổ biến</a>, <a href="' . esc_url( admin_url( 'edit.php?post_type=diem_den' ) ) . '">Điểm đến</a> (ảnh đại diện), <a href="' . esc_url( admin_url( 'edit.php?post_type=tin_tuc' ) ) . '">Tin tức</a> (3 tin mới nhất). Ô để trống thì dùng giá trị mặc định.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'hv_home' );
	echo '<h2>Tiêu đề</h2><table class="form-table" role="presentation">';
	$f( 'h1', 'H1 trang chủ (tiêu đề lớn trên dải vàng)' );
	$f( 'lead', 'Câu mô tả dưới H1 (một câu)' );
	echo '</table><h2>Ô tìm vé</h2><table class="form-table" role="presentation"><tr><th scope="row">Tab dịch vụ</th><td><label><input type="checkbox" name="hv_home_settings[show_service_tabs]" value="1"' . checked( '1', (string) $s['show_service_tabs'], false ) . '> <strong>Hiện tab dịch vụ khác</strong> (Xe sân bay, Xe hợp đồng, Xe du lịch)</label><p class="description">Mặc định tắt: ô tìm vé chỉ còn xe liên tỉnh (4 tuyến chính và tìm theo điểm đi/đến), không có hàng tab. Bật lại khi các dịch vụ kia sẵn sàng.</p></td></tr>';
	echo '</table><h2>Ưu đãi hôm nay</h2><table class="form-table" role="presentation">';
	$f( 'offers_url', 'Liên kết "Tất cả ưu đãi"', 'text', 'Đường dẫn nội bộ của trang tổng hợp ưu đãi, để trống = dùng <code>/uu-dai</code> (trang liệt kê mọi ưu đãi đang chạy). Các thẻ ưu đãi thêm ở menu <a href="' . esc_url( admin_url( 'edit.php?post_type=hv_offer' ) ) . '">Ưu đãi hôm nay</a>.' );
	echo '</table><h2>Phòng chờ và quầy vé</h2><table class="form-table" role="presentation">';
	for ( $n = 1; $n <= 4; $n++ ) {
		$f( "mosaic_{$n}_img", "Ảnh $n", 'image' );
		$f( "mosaic_{$n}_alt", "Ảnh $n: mô tả" );
		$f( "mosaic_{$n}_alt_en", "Ảnh $n: mô tả (tiếng Anh, trang /en/)" );
	}
	$f( 'addresses', 'Địa chỉ (mỗi dòng: <tên/số nhà> | <khu vực>)', 'textarea' );
	$f( 'addresses_en', 'Địa chỉ, bản tiếng Anh (trang /en/)', 'textarea' );
	echo '</table><h2>Dải tải ứng dụng</h2><table class="form-table" role="presentation">';
	$f( 'app_bullets', 'Các ý (mỗi dòng một ý; muốn thành liên kết: <ý> | <đường dẫn nội bộ>)', 'textarea', 'Ví dụ: <code>Khách hàng thân thiết | /chung-toi/chuong-trinh-khach-hang-than-thiet</code>. Link App Store/Google Play, mã QR: Cài đặt → Layout Hải Vân.' );
	$f( 'app_bullets_en', 'Các ý, bản tiếng Anh (trang /en/)', 'textarea' );
	$f( 'app_phone', 'Ảnh điện thoại', 'image' );
	echo '</table>';
	submit_button();
	echo '</form></div>';
}
