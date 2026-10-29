<?php
/**
 * Trợ giúp ô nhập cho các trang Cài đặt của theme (Layout Hải Vân, Trang chủ Hải Vân) + chọn ảnh từ Media.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Nạp JS chọn ảnh trên các trang cài đặt của theme. */
add_action(
	'admin_enqueue_scripts',
	static function ( $hook ) {
		$ok = in_array( $hook, array( 'settings_page_hv-layout', 'settings_page_hv-home' ), true ) || in_array( get_post_type(), array( 'hv_banner' ), true );
		if ( ! $ok ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_script( 'hv-admin-media', HV_WEB_URI . '/assets/js/admin-media.js', array( 'jquery' ), HV_WEB_VERSION, true );
	}
);

/**
 * In một hàng của bảng cài đặt.
 *
 * @param string               $name  Tên option (mảng).
 * @param array<string,string> $s     Giá trị hiện tại.
 * @param string               $key   Khoá.
 * @param string               $label Nhãn.
 * @param string               $type  text|url|textarea|image.
 * @param string               $help  Ghi chú.
 */
function hv_admin_field( $name, array $s, $key, $label, $type = 'text', $help = '' ) {
	$id  = 'f_' . $key;
	$val = (string) ( $s[ $key ] ?? '' );
	$nm  = $name . '[' . $key . ']';
	echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td>';
	if ( 'textarea' === $type ) {
		echo '<textarea class="large-text" rows="5" id="' . esc_attr( $id ) . '" name="' . esc_attr( $nm ) . '">' . esc_textarea( $val ) . '</textarea>';
	} else {
		echo '<input class="regular-text" style="width:min(36em,100%)" type="' . esc_attr( 'url' === $type ? 'url' : 'text' ) . '" id="' . esc_attr( $id ) . '" name="' . esc_attr( $nm ) . '" value="' . esc_attr( $val ) . '">';
		if ( 'image' === $type ) {
			echo ' <button type="button" class="button" data-hv-media="#' . esc_attr( $id ) . '">Chọn từ thư viện</button>';
			if ( '' !== $val ) {
				echo '<br><img src="' . esc_url( $val ) . '" alt="" style="max-height:48px;margin-top:6px;background:#eee">';
			}
		}
	}
	if ( '' !== $help ) {
		echo '<p class="description">' . wp_kses_post( $help ) . '</p>';
	}
	echo '</td></tr>';
}
