<?php
/**
 * CPT hv_banner: slide đầu trang chủ (carousel) và popup (1 lần/ngày).
 * Hai kiểu slide:
 *   image    ảnh poster: Ảnh đại diện = ảnh desktop (hoặc URL /assets/...), ảnh điện thoại tuỳ chọn, liên kết.
 *   designed slide dựng sẵn: dòng nhỏ, tiêu đề, dòng phụ, nút, màu nền (bảng màu khuyến mãi), ảnh xe tách nền.
 * Chung: loại web|popup, bắt đầu/kết thúc, "Thứ tự" (menu order). Truy vấn + dựng HTML: banners-render.php.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'init',
	static function () {
		register_post_type(
			'hv_banner',
			array(
				'label'               => 'Banner trang chủ',
				'labels'              => array(
					'name'                  => 'Banner trang chủ',
					'singular_name'         => 'Banner',
					'menu_name'             => 'Banner trang chủ',
					'all_items'             => 'Tất cả banner',
					'add_new'               => 'Thêm banner',
					'add_new_item'          => 'Thêm banner',
					'edit_item'             => 'Sửa banner',
					'new_item'              => 'Banner mới',
					'search_items'          => 'Tìm banner',
					'not_found'             => 'Chưa có banner. Bấm "Thêm banner" để tạo slide đầu tiên.',
					'featured_image'        => 'Ảnh desktop (ảnh poster)',
					'set_featured_image'    => 'Chọn ảnh desktop',
					'remove_featured_image' => 'Bỏ ảnh desktop',
					'use_featured_image'    => 'Dùng làm ảnh desktop',
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title', 'thumbnail', 'page-attributes' ),
				'menu_icon'           => 'dashicons-images-alt2',
				'menu_position'       => 22,
			)
		);
	},
	5
);

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-banner-fields', 'Nội dung banner', 'hv_banner_metabox', 'hv_banner', 'normal', 'high' );
		add_meta_box( 'hv-banner-help', 'Hướng dẫn', 'hv_banner_help_box', 'hv_banner', 'side', 'default' );
	}
);

/** @return array<string,string> Giá trị meta của banner (đã có mặc định). */
function hv_banner_meta( $post_id ) {
	$g = static fn( $k, $d = '' ) => (string) ( get_post_meta( $post_id, $k, true ) ?: $d );
	return array(
		'type'        => in_array( $g( 'hv_banner_type' ), array( 'web', 'popup' ), true ) ? $g( 'hv_banner_type' ) : 'web',
		'kind'        => 'designed' === $g( 'hv_banner_kind' ) ? 'designed' : 'image',
		'link'        => $g( 'hv_banner_link' ),
		'desktop_url' => $g( 'hv_banner_desktop_url' ),
		'mobile_id'   => $g( 'hv_banner_mobile_id' ),
		'mobile_url'  => $g( 'hv_banner_mobile_url' ),
		'start'       => $g( 'hv_banner_start' ),
		'end'         => $g( 'hv_banner_end' ),
		'mobile_show' => $g( 'hv_banner_mobile_show' ),
		'source_id'   => $g( 'hv_banner_cms_id' ),
		'eyebrow'     => $g( 'hv_banner_eyebrow' ),
		'headline'    => $g( 'hv_banner_headline' ),
		'sub'         => $g( 'hv_banner_sub' ),
		'btn'         => $g( 'hv_banner_btn' ),
		'tone'        => hv_promo_tone( $g( 'hv_banner_tone' ) ),
		'cutout_id'   => $g( 'hv_banner_cutout_id' ),
		'cutout_url'  => $g( 'hv_banner_cutout_url' ),
	);
}

function hv_banner_help_box() {
	echo '<p><strong>Ảnh poster</strong>: ảnh có sẵn chữ. Kích thước poster cũ <strong>3334 × 1156 px</strong> (tỉ lệ 2,9:1) vẫn dùng được (bị cắt hai bên theo khung); ảnh mới nên theo vùng an toàn bên dưới. Ảnh điện thoại (nếu có) 1000 × 750 px.</p>';
	echo '<p><strong>Slide thiết kế sẵn</strong>: nhập chữ, chọn màu, thêm ảnh xe tách nền (PNG/WebP nền trong suốt, rộng khoảng 900 px). Chữ số đầu tiên của tiêu đề (vd. <em>900.000đ</em>) tự phóng to.</p>';
	echo '<p><strong>Thứ tự</strong>: ô "Thứ tự" ở khung Thuộc tính trang, số nhỏ hiện trước. <strong>Lịch</strong>: để trống = hiện ngay và không hết hạn. Bài ở trạng thái Nháp không hiện.</p>';
	echo '<p><strong>Ảnh thật</strong> (không có chữ, tỉ lệ gần vuông hơn 2,2:1, vd. 1400 × 933 px) tự phủ kín khung thay vì lọt thỏm như poster; nên đặt ảnh thật ở slide đầu để kính của thẻ tìm vé có ảnh để làm mờ.</p>';
	echo '<p><strong>Vùng an toàn (banner trang chủ)</strong>: banner phủ kín bề ngang trang, thẻ tìm vé kính nằm ở phần dưới. <em>Máy tính</em>: ảnh <strong>tối thiểu 1920 × 680 px</strong>; đặt tiêu đề, chữ và chủ thể chính trong <strong>35% phía trên</strong> của ảnh, để ~50% phía dưới là nền/cảnh (sẽ bị thẻ che), hai bên chừa lề ~8% vì ảnh được cắt theo khung. <em>Điện thoại</em>: ảnh điện thoại cắt <strong>4:3</strong> (vd. 1000 × 750 px, hiển thị khung 16:9 nên giữ chủ thể ở giữa); không đặt chữ sát mép. Banner thiết kế sẵn tự đặt chữ ở dải trên.</p>';
	echo '<p>Popup chỉ dùng kiểu ảnh poster.</p>';
}

function hv_banner_metabox( $post ) {
	wp_nonce_field( 'hv_banner_save', 'hv_banner_nonce' );
	$m = hv_banner_meta( $post->ID );
	$i = static function ( $name, $label, $val, $type = 'text', $help = '', $extra = '' ) {
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input class="widefat" type="' . esc_attr( $type ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '"' . $extra . '></label>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $extra là hằng số.
		if ( '' !== $help ) {
			echo '<br><span class="description">' . wp_kses_post( $help ) . '</span>';
		}
		echo '</p>';
	};
	$media = static function ( $id_name, $url_name, $label, $id, $url, $help ) {
		if ( '' === $url && (int) $id ) {
			$url = hv_local_media_url( (string) wp_get_attachment_url( (int) $id ) ); // ảnh chọn từ thư viện: hiện đường dẫn thay vì ô trống.
		}
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input type="hidden" id="' . esc_attr( $id_name ) . '" name="' . esc_attr( $id_name ) . '" value="' . esc_attr( $id ) . '">';
		echo '<input class="widefat" type="text" id="' . esc_attr( $url_name ) . '" name="' . esc_attr( $url_name ) . '" value="' . esc_attr( $url ) . '"></label> <button type="button" class="button" data-hv-media="#' . esc_attr( $url_name ) . '" data-hv-media-id="#' . esc_attr( $id_name ) . '">Chọn từ thư viện</button><br><span class="description">' . wp_kses_post( $help ) . '</span></p>';
	};
	echo '<p><label><strong>Loại</strong><br><select name="hv_banner_type"><option value="web"' . selected( $m['type'], 'web', false ) . '>Banner trang chủ (carousel)</option><option value="popup"' . selected( $m['type'], 'popup', false ) . '>Popup (1 lần/ngày, chỉ kiểu ảnh poster)</option></select></label></p>';
	echo '<fieldset class="hv-kind"><legend><strong>Kiểu slide</strong></legend>';
	echo '<label><input type="radio" name="hv_banner_kind" value="image"' . checked( $m['kind'], 'image', false ) . '> Ảnh poster</label> &nbsp; ';
	echo '<label><input type="radio" name="hv_banner_kind" value="designed"' . checked( $m['kind'], 'designed', false ) . '> Thiết kế sẵn (chữ + màu + ảnh xe)</label></fieldset>';
	echo '<div class="hv-kind-box" data-hv-kind="image"><h4>Kiểu ảnh poster</h4>';
	echo '<p class="description">Ảnh desktop: đặt <strong>Ảnh desktop</strong> (khung bên phải) hoặc điền URL bên dưới. Banner chỉ có ảnh điện thoại sẽ chỉ hiện trên điện thoại.</p>';
	$i( 'hv_banner_desktop_url', 'Ảnh desktop (URL, khi chưa chọn ảnh bên phải)', $m['desktop_url'], 'text', 'Dạng <code>/assets/page/page1.jpg</code> hoặc https.' );
	$media( 'hv_banner_mobile_id', 'hv_banner_mobile_url', 'Ảnh điện thoại (tuỳ chọn)', $m['mobile_id'], $m['mobile_url'], 'Hiện thay ảnh desktop trên màn hình dưới 640 px.' );
	echo '</div><div class="hv-kind-box" data-hv-kind="designed"><h4>Kiểu thiết kế sẵn</h4>';
	$i( 'hv_banner_eyebrow', 'Dòng nhỏ phía trên (vd. Hà Nội đi Điện Biên)', $m['eyebrow'], 'text', '', ' maxlength="60"' );
	$i( 'hv_banner_headline', 'Tiêu đề (vd. 900.000đ cho 2 vé Luxury)', $m['headline'], 'text', 'Bắt buộc. Số đầu tiên (vd. <em>900.000đ</em>) tự phóng to.', ' maxlength="90"' );
	$i( 'hv_banner_sub', 'Dòng phụ (vd. Đặt trước 3 ngày, tiết kiệm đến 130.000đ)', $m['sub'], 'text', '', ' maxlength="120"' );
	$i( 'hv_banner_btn', 'Chữ trên nút (vd. Xem ưu đãi)', $m['btn'], 'text', 'Nút dẫn tới liên kết bên dưới; để trống = không có nút.', ' maxlength="30"' );
	echo '<p><label><strong>Màu nền</strong><br>';
	hv_promo_tone_field( 'hv_banner_tone', $m['tone'] );
	echo '</label><br><span class="description">Bảng màu khuyến mãi của hệ thiết kế; chữ tự đổi cho đủ tương phản.</span></p>';
	$media( 'hv_banner_cutout_id', 'hv_banner_cutout_url', 'Ảnh xe tách nền', $m['cutout_id'], $m['cutout_url'], 'PNG/WebP nền trong suốt. Có thể dán đường dẫn <code>/assets/...</code>.' );
	echo '</div><h4>Chung</h4>';
	$i( 'hv_banner_link', 'Liên kết khi bấm (tuỳ chọn)', $m['link'], 'text', 'Đường dẫn nội bộ <code>/xe-san-bay</code>, tuyến <code>my-dinh/dien-bien</code> hoặc https.' );
	$i( 'hv_banner_start', 'Bắt đầu hiệu lực', $m['start'], 'datetime-local', 'Để trống = có hiệu lực ngay (giờ Việt Nam).' );
	$i( 'hv_banner_end', 'Kết thúc hiệu lực', $m['end'], 'datetime-local', 'Để trống = không hết hạn. Hết giờ này banner tự ẩn.' );
	echo '<p><label><input type="checkbox" name="hv_banner_mobile_show" value="1"' . checked( '1', $m['mobile_show'], false ) . '> Hiện popup trên điện thoại (mặc định tắt)</label></p>';
}

/** Giữ lại tên cũ cho script seed/import: đường dẫn nội bộ, tuyến hoặc https. */
function hv_banner_clean_url( $v ) {
	return hv_clean_link( $v );
}

add_action(
	'save_post_hv_banner',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_banner_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_banner_nonce'] ) ), 'hv_banner_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$p    = static fn( $k ) => isset( $_POST[ $k ] ) ? trim( sanitize_text_field( wp_unslash( $_POST[ $k ] ) ) ) : '';
		$type = 'popup' === $p( 'hv_banner_type' ) ? 'popup' : 'web';
		$kind = 'designed' === $p( 'hv_banner_kind' ) && 'web' === $type ? 'designed' : 'image'; // popup chỉ kiểu ảnh.
		update_post_meta( $post_id, 'hv_banner_type', $type );
		update_post_meta( $post_id, 'hv_banner_kind', $kind );
		update_post_meta( $post_id, 'hv_banner_link', hv_clean_link( $p( 'hv_banner_link' ) ) );
		update_post_meta( $post_id, 'hv_banner_desktop_url', hv_clean_link( $p( 'hv_banner_desktop_url' ) ) );
		update_post_meta( $post_id, 'hv_banner_mobile_url', hv_clean_link( hv_layout_img( $p( 'hv_banner_mobile_url' ) ) ) );
		update_post_meta( $post_id, 'hv_banner_mobile_id', (string) absint( $p( 'hv_banner_mobile_id' ) ) );
		update_post_meta( $post_id, 'hv_banner_cutout_url', hv_layout_img( $p( 'hv_banner_cutout_url' ) ) );
		update_post_meta( $post_id, 'hv_banner_cutout_id', (string) absint( $p( 'hv_banner_cutout_id' ) ) );
		foreach ( array( 'eyebrow' => 60, 'headline' => 90, 'sub' => 120, 'btn' => 30 ) as $k => $max ) {
			update_post_meta( $post_id, 'hv_banner_' . $k, mb_substr( $p( 'hv_banner_' . $k ), 0, $max ) );
		}
		update_post_meta( $post_id, 'hv_banner_tone', hv_promo_tone( $p( 'hv_banner_tone' ) ) );
		foreach ( array( 'hv_banner_start', 'hv_banner_end' ) as $k ) {
			update_post_meta( $post_id, $k, hv_clean_when( $p( $k ), true ) );
		}
		update_post_meta( $post_id, 'hv_banner_mobile_show', ! empty( $_POST['hv_banner_mobile_show'] ) ? '1' : '' );
	}
);
