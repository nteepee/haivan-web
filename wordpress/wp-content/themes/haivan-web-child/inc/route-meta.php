<?php
/**
 * Meta box "Nội dung trang tuyến" của hv_route (hợp đồng docs/route-landing-contract.md).
 * Mỗi hướng đi = một bài hv_route (meta hv_route_path). Ô nhiều dòng dùng dấu "|" giữa các trường.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Trường văn bản đơn: meta => [nhãn, loại (text|textarea|html), gợi ý]. */
function hv_route_fields() {
	return array(
		'hv_route_seo_title'        => array( 'Tiêu đề SEO', 'text', 'Dùng nguyên văn làm &lt;title&gt;; nên ≤ 60 ký tự.' ),
		'hv_route_meta_description' => array( 'Mô tả SEO', 'textarea', 'Nên ≤ 155 ký tự.' ),
		'hv_route_h1'               => array( 'H1', 'text', 'Vd. "Đặt vé xe Hà Nội đi Điện Biên".' ),
		'hv_route_intro'            => array( 'Đoạn mở đầu', 'textarea', 'Văn bản thuần, 1-2 câu.' ),
		'hv_route_schedule_text'    => array( 'Đoạn dưới tiêu đề "Giờ chạy và giá vé"', 'html', 'HTML cho phép: h2 h3 p ul ol li strong em b i a br img blockquote.' ),
		'hv_route_content_html'     => array( 'Nội dung chính', 'html', 'HTML cho phép như trên (không bảng, iframe, nhúng). Ảnh: src là /assets/... hoặc https.' ),
		'hv_route_faq'              => array( 'Câu hỏi thường gặp', 'textarea', 'Mỗi dòng một câu: <code>câu hỏi | trả lời</code> (trả lời là văn bản thuần, sinh FAQPage JSON-LD).' ),
		'hv_route_pickup_points'    => array( 'Điểm đón', 'textarea', 'Mỗi dòng: <code>tên | địa chỉ | ghi chú (tuỳ chọn)</code>. Điểm đầu tiên vào mô tả SEO mẫu.' ),
		'hv_route_offices'          => array( 'Văn phòng / phòng chờ', 'textarea', 'Mỗi dòng: <code>tên | địa chỉ | giờ mở cửa | ghi chú | liên kết bản đồ (http/https)</code>.' ),
		'hv_route_vehicle_classes'  => array( 'Hạng xe', 'textarea', 'Mỗi dòng: <code>tên | số chỗ | giá từ (vd. 485.000đ) | mô tả | tiện ích 1; tiện ích 2</code>.' ),
		'hv_route_related'          => array( 'Tuyến liên quan', 'textarea', 'Mỗi dòng: <code>nhãn | đường dẫn a/b</code> (vd. <code>Mỹ Đình đi Sơn La | my-dinh/son-la</code>).' ),
		'hv_route_reverse'          => array( 'Chiều ngược lại', 'text', '<code>nhãn | đường dẫn a/b</code>.' ),
		'hv_route_round_trip_note'  => array( 'Ghi chú khứ hồi', 'textarea', 'Khối "Đặt vé khứ hồi", văn bản thuần.' ),
	);
}

/** HTML cho phép (bằng allowlist của Next: src/lib/sanitize-html.ts). */
function hv_route_kses_allowed() {
	return array(
		'h2' => array(), 'h3' => array(), 'p' => array(), 'ul' => array(), 'ol' => array(), 'li' => array(),
		'strong' => array(), 'em' => array(), 'b' => array(), 'i' => array(), 'br' => array(), 'blockquote' => array(),
		'a'   => array( 'href' => true ),
		'img' => array( 'src' => true, 'alt' => true ),
	);
}

/** Lọc HTML theo allowlist hợp đồng; bỏ href/src dạng "//host" hoặc "/\host". */
function hv_route_clean_html( $html ) {
	$html = wp_kses( (string) $html, hv_route_kses_allowed(), array( 'http', 'https', 'tel', 'mailto' ) );
	return (string) preg_replace( '#\b(href|src)=(["\'])\s*(?://|/\\\\)[^"\']*\2#i', '$1=$2#$2', $html );
}

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-route-landing', 'Nội dung trang tuyến /xe-khach/... (REST route landing)', 'hv_route_landing_metabox', 'hv_route', 'normal', 'default' );
	}
);

function hv_route_landing_metabox( $post ) {
	wp_nonce_field( 'hv_route_landing_save', 'hv_route_landing_nonce' );
	echo '<p class="description">Trống = Next dùng dữ liệu CMS và mẫu chuỗi. Có bài xuất bản và có <code>hv_route_path</code> thì trang <code>/xe-khach/&lt;đường dẫn&gt;</code> lấy nội dung ở đây (cache tối đa ~1 giờ).</p>';
	foreach ( hv_route_fields() as $key => $f ) {
		$val  = (string) get_post_meta( $post->ID, $key, true );
		$rows = 'html' === $f[1] ? 7 : 4;
		echo '<p><label><strong>' . esc_html( $f[0] ) . '</strong><br>';
		if ( 'text' === $f[1] ) {
			echo '<input type="text" class="widefat" name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '">';
		} else {
			echo '<textarea class="widefat" rows="' . (int) $rows . '" name="' . esc_attr( $key ) . '">' . esc_textarea( $val ) . '</textarea>';
		}
		echo '</label><span class="description">' . wp_kses_post( $f[2] ) . '</span></p>';
	}
}

add_action(
	'save_post_hv_route',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_route_landing_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_route_landing_nonce'] ) ), 'hv_route_landing_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		foreach ( hv_route_fields() as $key => $f ) {
			$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- làm sạch ngay bên dưới theo loại.
			if ( 'html' === $f[1] ) {
				$val = hv_route_clean_html( $raw );
			} elseif ( 'text' === $f[1] ) {
				$val = sanitize_text_field( $raw );
			} else {
				$val = sanitize_textarea_field( $raw );
			}
			update_post_meta( $post_id, $key, $val );
		}
	}
);
