<?php
/**
 * CPT hv_offer "Ưu đãi hôm nay": thẻ màu ở trang chủ do MKT tự thêm/sửa/hẹn giờ.
 * Tiêu đề bài = tên tuyến (vd. "Sài Gòn đi Vũng Tàu"). Ảnh = Ảnh đại diện (hoặc URL /assets/...).
 * Hết hạn (ngày kết thúc) hoặc Nháp = tự ẩn; không còn ưu đãi nào = ẩn cả khối. Truy vấn + dựng HTML: offers-render.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Biểu tượng chọn được khi ưu đãi không có ảnh (khớp icons.php). */
const HV_OFFER_ICONS = array(
	''           => 'Không có',
	'smartphone' => 'Điện thoại (ứng dụng)',
	'gift'       => 'Quà tặng',
	'ticket'     => 'Vé',
	'bus'        => 'Xe',
	'clock'      => 'Đồng hồ',
);

add_action(
	'init',
	static function () {
		register_post_type(
			'hv_offer',
			array(
				'label'               => 'Ưu đãi hôm nay',
				'labels'              => array(
					'name'                  => 'Ưu đãi hôm nay',
					'singular_name'         => 'Ưu đãi',
					'menu_name'             => 'Ưu đãi hôm nay',
					'all_items'             => 'Tất cả ưu đãi',
					'add_new'               => 'Thêm ưu đãi',
					'add_new_item'          => 'Thêm ưu đãi',
					'edit_item'             => 'Sửa ưu đãi',
					'new_item'              => 'Ưu đãi mới',
					'search_items'          => 'Tìm ưu đãi',
					'not_found'             => 'Chưa có ưu đãi. Bấm "Thêm ưu đãi" để tạo thẻ đầu tiên.',
					'featured_image'        => 'Ảnh minh hoạ (thẻ)',
					'set_featured_image'    => 'Chọn ảnh minh hoạ',
					'remove_featured_image' => 'Bỏ ảnh',
					'use_featured_image'    => 'Dùng làm ảnh thẻ',
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title', 'thumbnail', 'page-attributes' ),
				'menu_icon'           => 'dashicons-tag',
				'menu_position'       => 23,
			)
		);
	},
	5
);

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-offer-fields', 'Nội dung ưu đãi', 'hv_offer_metabox', 'hv_offer', 'normal', 'high' );
		add_meta_box( 'hv-offer-help', 'Hướng dẫn', 'hv_offer_help_box', 'hv_offer', 'side', 'default' );
	}
);

/** @return array<string,string> Meta của ưu đãi (có mặc định). */
function hv_offer_meta( $post_id ) {
	$g = static fn( $k, $d = '' ) => (string) ( get_post_meta( $post_id, 'hv_offer_' . $k, true ) ?: $d );
	return array(
		'badge'       => $g( 'badge' ),
		'badge_style' => 'sale' === $g( 'badge_style' ) ? 'sale' : 'on-fill',
		'price'       => $g( 'price' ),
		'unit'        => $g( 'unit' ),
		'cond'        => $g( 'cond' ),
		'tone'        => hv_promo_tone( $g( 'tone' ), 'teal' ),
		'image_url'   => $g( 'image_url' ),
		'icon'        => isset( HV_OFFER_ICONS[ $g( 'icon' ) ] ) ? $g( 'icon' ) : '',
		'link'        => $g( 'link' ),
		'cta'         => $g( 'cta' ),
		'start'       => $g( 'start' ),
		'end'         => $g( 'end' ),
	);
}

function hv_offer_help_box() {
	echo '<p><strong>Tên tuyến</strong> là tiêu đề bài. <strong>Giá</strong> viết gọn, vd. <em>419k</em> hoặc <em>900.000đ</em>. <strong>Điều kiện</strong> 1 đến 2 câu ngắn.</p>';
	echo '<p><strong>Ảnh</strong>: chọn Ảnh minh hoạ (khung bên phải, tỉ lệ 4:3, rộng từ 400 px). Không có ảnh thì có thể chọn biểu tượng.</p>';
	echo '<p><strong>Thứ tự</strong>: ô "Thứ tự" ở khung Thuộc tính trang, số nhỏ hiện trước.</p>';
	echo '<p><strong>Lịch</strong>: ngày kết thúc là ngày cuối cùng còn hiện; qua ngày đó thẻ tự ẩn. Bài ở trạng thái Nháp không hiện.</p>';
	echo '<p>Chỉ đăng ưu đãi có thật và còn hiệu lực.</p>';
}

function hv_offer_metabox( $post ) {
	wp_nonce_field( 'hv_offer_save', 'hv_offer_nonce' );
	$m = hv_offer_meta( $post->ID );
	$i = static function ( $key, $label, $val, $help = '', $max = 0, $type = 'text' ) {
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input class="widefat" type="' . esc_attr( $type ) . '" name="hv_offer_' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '"' . ( $max ? ' maxlength="' . (int) $max . '"' : '' ) . '></label>';
		echo '' !== $help ? '<br><span class="description">' . wp_kses_post( $help ) . '</span>' : '';
		echo '</p>';
	};
	$i( 'badge', 'Huy hiệu (vd. Tiết kiệm 101k, Đi nhóm, Đặt trước 3 ngày, Mới)', $m['badge'], 'Để trống = không có huy hiệu.', 40 );
	echo '<p><label><strong>Kiểu huy hiệu</strong><br><select name="hv_offer_badge_style"><option value="on-fill"' . selected( $m['badge_style'], 'on-fill', false ) . '>Nền trắng (mặc định)</option><option value="sale"' . selected( $m['badge_style'], 'sale', false ) . '>Giảm giá (nền đỏ, có biểu tượng nhãn; thẻ màu San hô tự dùng nền trắng)</option></select></label></p>';
	$i( 'price', 'Giá nổi bật (vd. 419k, 900.000đ)', $m['price'], '', 20 );
	$i( 'unit', 'Ghi chú giá (vd. / 2 vé Luxury, 210k mỗi người)', $m['unit'], '', 70 );
	$i( 'cond', 'Điều kiện (ngắn)', $m['cond'], 'Vd. Đặt trước ít nhất 1 tiếng. Chỉ chuyến có nhãn Combo.', 140 );
	echo '<p><label><strong>Màu thẻ</strong><br>';
	hv_promo_tone_field( 'hv_offer_tone', $m['tone'] );
	echo '</label><br><span class="description">Bảng màu khuyến mãi của hệ thiết kế; chữ tự đổi cho đủ tương phản.</span></p>';
	$i( 'image_url', 'Ảnh (URL, khi chưa chọn Ảnh minh hoạ bên phải)', $m['image_url'], 'Dạng <code>/assets/design/don-khach.jpg</code> hoặc https.' );
	echo '<p><label><strong>Biểu tượng (khi không có ảnh)</strong><br><select name="hv_offer_icon">';
	foreach ( HV_OFFER_ICONS as $slug => $label ) {
		echo '<option value="' . esc_attr( $slug ) . '"' . selected( $m['icon'], $slug, false ) . '>' . esc_html( $label ) . '</option>';
	}
	echo '</select></label></p>';
	$i( 'link', 'Liên kết: đường dẫn tuyến hoặc URL', $m['link'], 'Tuyến: <code>my-dinh/dien-bien</code> (thành /xe-khach/my-dinh/dien-bien); trang khác: <code>/dat-ve-nhanh</code> hoặc https. Để trống = thẻ không bấm được.' );
	$i( 'cta', 'Chữ trên nút (mặc định Đặt vé)', $m['cta'], 'Vd. Tải ứng dụng.', 24 );
	$i( 'start', 'Hiện từ ngày', $m['start'], 'Để trống = hiện ngay.', 0, 'date' );
	$i( 'end', 'Hiện đến hết ngày', $m['end'], 'Để trống = không hết hạn. Qua ngày này thẻ tự ẩn.', 0, 'date' );
}

add_action(
	'save_post_hv_offer',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_offer_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_offer_nonce'] ) ), 'hv_offer_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$p = static fn( $k ) => isset( $_POST[ 'hv_offer_' . $k ] ) ? trim( sanitize_text_field( wp_unslash( $_POST[ 'hv_offer_' . $k ] ) ) ) : '';
		foreach ( array( 'badge' => 40, 'price' => 20, 'unit' => 70, 'cond' => 140, 'cta' => 24 ) as $k => $max ) {
			update_post_meta( $post_id, 'hv_offer_' . $k, mb_substr( $p( $k ), 0, $max ) );
		}
		update_post_meta( $post_id, 'hv_offer_badge_style', 'sale' === $p( 'badge_style' ) ? 'sale' : 'on-fill' );
		update_post_meta( $post_id, 'hv_offer_tone', hv_promo_tone( $p( 'tone' ), 'teal' ) );
		update_post_meta( $post_id, 'hv_offer_image_url', hv_clean_image_url( $p( 'image_url' ) ) );
		update_post_meta( $post_id, 'hv_offer_icon', isset( HV_OFFER_ICONS[ $p( 'icon' ) ] ) ? $p( 'icon' ) : '' );
		update_post_meta( $post_id, 'hv_offer_link', hv_clean_link( $p( 'link' ) ) );
		foreach ( array( 'start', 'end' ) as $k ) {
			update_post_meta( $post_id, 'hv_offer_' . $k, hv_clean_when( $p( $k ), false ) );
		}
	}
);
