<?php
/**
 * Trang chủ v2 · Lời khách: đánh giá thật của hành khách (trích nguyên văn, chỉ sửa lỗi gõ) đặt ngay dưới
 * "5 chặng của một chuyến đi". Sửa ở Cài đặt → Đánh giá trang chủ (option `hv2_home_reviews`); chưa lưu lần nào
 * thì dùng mặc định bên dưới. Chỉ in HTML, KHÔNG thêm schema Review/AggregateRating: Google bỏ qua đánh giá
 * tự đăng về chính doanh nghiệp (self-serving reviews) trên LocalBusiness/Organization.
 *
 * Nguồn mặc định: 5 đánh giá Google của phòng chờ 34 Nguyễn Thái Bình (Q.1) đang đăng ở
 * booking.haivan.com/mua-ve-xe-sai-gon-vung-tau/ (lấy ngày 15/11/2026), mỗi đánh giá kèm link Google Maps gốc.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Số đánh giá tối đa hiện trên trang chủ (cũng là số hàng trong trang cài đặt). */
const HV2_REVIEWS_MAX = 6;

/**
 * Giá trị mặc định.
 *
 * @return array{score:string,count:string,place:string,place_en:string,all_url:string,items:array<int,array<string,string>>}
 */
function hv2_reviews_defaults() {
	$g = 'Google';
	return array(
		'score'   => '4,6',
		'count'   => '87',
		'place'   => 'Phòng chờ 34 Nguyễn Thái Bình, Quận 1',
		'place_en' => 'Hai Van lounge, 34 Nguyen Thai Binh, District 1',
		'all_url' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( 'Phòng chờ xe Hải Vân Limousine Hồ Chí Minh - Vũng Tàu' ),
		'items'   => array(
			array(
				'text'   => 'Phòng chờ sạch sẽ mát mẻ, có trà nước và bánh, nhân viên thân thiện dễ mến. Dịch vụ xe chạy đúng giờ an toàn, lái xe thân thiện vui vẻ.',
				'name'   => '',
				'source' => $g,
				'url'    => 'https://maps.app.goo.gl/rELcvVK6H49d55du6',
				'lang'   => 'vi',
			),
			array(
				'text'   => 'Chất lượng xe tốt, tài xế rất chuyên nghiệp, nhân viên hỗ trợ nhiệt tình và thân thiện. Đặc biệt phòng chờ nhà xe rất tuyệt. Mình đã đi rất nhiều nhà xe và đây là trải nghiệm khiến mình rất hài lòng và ưng ý. Hy vọng nhà xe tiếp tục duy trì chất lượng dịch vụ.',
				'name'   => '',
				'source' => $g,
				'url'    => 'https://maps.app.goo.gl/PdzCF5yxVrmLNRyN6',
				'lang'   => 'vi',
			),
			array(
				'text'   => 'Nhà xe rất oke lun nha, rất đúng giờ, tài xế lịch sự, chạy xe cũng rất an toàn luôn, xe sạch không có mùi hôi, ghế ngồi êm ái có massage. Lần đầu đi xe ngoài mà quá oke lun. Siêu recommend cho mng nên đi nhà xe này nha!',
				'name'   => '',
				'source' => $g,
				'url'    => 'https://maps.app.goo.gl/DpdSnQLLVG5NYw7e7',
				'lang'   => 'vi',
			),
			array(
				'text'   => 'Nhà chờ xe Hải Vân tiện nghi, sạch sẽ, nhân viên lịch sự, có nước uống cho khách đợi, nằm ngay trung tâm quận 1, rất thuận tiện cho việc đi lại mà ko di chuyển ra bến xe.',
				'name'   => '',
				'source' => $g,
				'url'    => 'https://maps.app.goo.gl/XzBHV7DLbhYnE6wN6',
				'lang'   => 'vi',
			),
			array(
				'text'   => 'Glad that they opened a new office in the centre of Ho Chi Minh! Clean lobby, free snacks, friendly and supportive English-speaking staff.',
				'name'   => '',
				'source' => $g,
				'url'    => 'https://maps.app.goo.gl/aQBs6XEYv2bgpVVP9',
				'lang'   => 'en',
			),
		),
	);
}

/**
 * Cài đặt đã lưu (hoặc mặc định nếu chưa lưu lần nào). Danh sách rỗng sau khi lưu = ẩn khối.
 *
 * @return array{score:string,count:string,place:string,place_en:string,all_url:string,items:array<int,array<string,string>>}
 */
function hv2_reviews_settings() {
	$saved = get_option( 'hv2_home_reviews', null );
	return is_array( $saved ) && isset( $saved['items'] ) && is_array( $saved['items'] ) ? array_merge( hv2_reviews_defaults(), $saved ) : hv2_reviews_defaults();
}

/** Chuỗi chữ của khối theo ngôn ngữ đang xem. */
function hv2_reviews_t( $key ) {
	$s = array(
		'h'      => array( 'Hành khách nói gì về Hải Vân', 'What passengers say about Hai Van' ),
		'score'  => array( '%1$s/5 · %2$s đánh giá trên Google', '%1$s/5 · %2$s Google reviews' ),
		'all'    => array( 'Xem tất cả đánh giá trên Google', 'Read all reviews on Google' ),
		'anon'   => array( 'Khách đánh giá trên %s', 'Review on %s' ),
		'by'     => array( '%1$s · đánh giá trên %2$s', '%1$s · review on %2$s' ),
		'orig'   => array( 'Xem đánh giá gốc', 'See the original review' ),
	);
	return $s[ $key ][ 'en' === hv_lang() ? 1 : 0 ] ?? $key;
}

/** Khối "Lời khách" (trang chủ, dưới 5 chặng). Không có đánh giá nào = không in gì. */
function hv2_render_reviews() {
	$s     = hv2_reviews_settings();
	$items = array_slice( array_filter( $s['items'], static fn( $r ) => is_array( $r ) && '' !== trim( (string) ( $r['text'] ?? '' ) ) ), 0, HV2_REVIEWS_MAX );
	if ( ! $items ) {
		return;
	}
	echo '<div class="hv2-reviews" role="group" aria-labelledby="hv2-rv"><div class="hv2-reviews-head"><div><h3 id="hv2-rv">' . esc_html( hv2_reviews_t( 'h' ) ) . '</h3>';
	if ( '' !== $s['score'] && '' !== $s['count'] ) {
		$en    = 'en' === hv_lang();
		$score = $en ? str_replace( ',', '.', $s['score'] ) : $s['score'];
		$place = $en && '' !== $s['place_en'] ? $s['place_en'] : $s['place'];
		echo '<p class="hv2-reviews-score"><span class="hv2-reviews-stars" aria-hidden="true">★</span>' . esc_html( sprintf( hv2_reviews_t( 'score' ), $score, $s['count'] ) ) . ( '' !== $place ? '<span class="hv2-reviews-place">' . esc_html( $place ) . '</span>' : '' ) . '</p>';
	}
	echo '</div>';
	if ( '' !== $s['all_url'] ) {
		echo '<a class="hv2-textlink" href="' . esc_url( $s['all_url'] ) . '" target="_blank" rel="noopener">' . esc_html( hv2_reviews_t( 'all' ) ) . '<span aria-hidden="true">↗</span></a>';
	}
	echo '</div><ul class="hv2-quotes hv2-reviews-list">';
	foreach ( $items as $r ) {
		$src  = '' !== trim( (string) ( $r['source'] ?? '' ) ) ? (string) $r['source'] : 'Google';
		$name = trim( (string) ( $r['name'] ?? '' ) );
		$cap  = '' !== $name ? sprintf( hv2_reviews_t( 'by' ), $name, $src ) : sprintf( hv2_reviews_t( 'anon' ), $src );
		$lang = 'en' === ( $r['lang'] ?? 'vi' ) ? 'en' : 'vi';
		$url  = (string) ( $r['url'] ?? '' );
		echo '<li><figure><blockquote lang="' . esc_attr( $lang ) . '"><p>' . esc_html( (string) $r['text'] ) . '</p></blockquote><figcaption>';
		echo '' !== $url ? '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener nofollow" title="' . esc_attr( hv2_reviews_t( 'orig' ) ) . '">' . esc_html( $cap ) . '<span aria-hidden="true"> ↗</span></a>' : esc_html( $cap );
		echo '</figcaption></figure></li>';
	}
	echo '</ul></div>';
}

/* ---- Trang cài đặt ---- */

add_action(
	'admin_menu',
	static function () {
		add_options_page( 'Đánh giá trang chủ', 'Đánh giá trang chủ', 'manage_options', 'hv2-reviews', 'hv2_reviews_settings_page' );
	}
);

add_action(
	'admin_init',
	static function () {
		register_setting(
			'hv2_reviews',
			'hv2_home_reviews',
			array(
				'type'              => 'array',
				'sanitize_callback' => 'hv2_reviews_sanitize',
				'default'           => null,
			)
		);
	}
);

/** Link http(s) hợp lệ hoặc chuỗi rỗng. */
function hv2_reviews_url( $v ) {
	$v = esc_url_raw( trim( (string) $v ), array( 'http', 'https' ) );
	return '' !== $v && wp_http_validate_url( $v ) ? $v : '';
}

/**
 * Làm sạch dữ liệu form; hàng không có lời đánh giá bị bỏ.
 *
 * @param mixed $input Dữ liệu form.
 * @return array{score:string,count:string,place:string,place_en:string,all_url:string,items:array<int,array<string,string>>}
 */
function hv2_reviews_sanitize( $input ) {
	$input = is_array( $input ) ? $input : array();
	$score = preg_match( '/^[0-5](?:[.,]\d)?$/', trim( (string) ( $input['score'] ?? '' ) ) ) ? trim( (string) $input['score'] ) : '';
	$count = preg_replace( '/\D/', '', (string) ( $input['count'] ?? '' ) );
	$items = array();
	$rows  = isset( $input['items'] ) && is_array( $input['items'] ) ? array_slice( $input['items'], 0, HV2_REVIEWS_MAX ) : array();
	foreach ( $rows as $r ) {
		$text = is_array( $r ) ? trim( sanitize_textarea_field( (string) ( $r['text'] ?? '' ) ) ) : '';
		if ( '' === $text ) {
			continue;
		}
		$items[] = array(
			'text'   => $text,
			'name'   => sanitize_text_field( (string) ( $r['name'] ?? '' ) ),
			'source' => sanitize_text_field( (string) ( $r['source'] ?? '' ) ),
			'url'    => hv2_reviews_url( $r['url'] ?? '' ),
			'lang'   => 'en' === ( $r['lang'] ?? '' ) ? 'en' : 'vi',
		);
	}
	return array(
		'score'   => $score,
		'count'   => (string) $count,
		'place'   => sanitize_text_field( (string) ( $input['place'] ?? '' ) ),
		'place_en' => sanitize_text_field( (string) ( $input['place_en'] ?? '' ) ),
		'all_url' => hv2_reviews_url( $input['all_url'] ?? '' ),
		'items'   => $items,
	);
}

function hv2_reviews_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s  = hv2_reviews_settings();
	$nm = 'hv2_home_reviews';
	$in = static function ( $name, $val, $type = 'text', $attrs = '' ) {
		return '<input class="regular-text" style="width:min(36em,100%)" type="' . esc_attr( $type ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '"' . $attrs . '>';
	};
	echo '<div class="wrap"><h1>Đánh giá trang chủ</h1>';
	echo '<p>Khối "Hành khách nói gì về Hải Vân" dưới phần 5 chặng của trang chủ (cả /en/). Chỉ dùng đánh giá thật, trích nguyên văn (được sửa lỗi gõ), kèm link tới đánh giá gốc. Tối đa ' . (int) HV2_REVIEWS_MAX . ' đánh giá; để trống lời đánh giá = bỏ hàng đó; xoá hết = ẩn khối.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'hv2_reviews' );
	echo '<h2>Điểm tổng</h2><table class="form-table" role="presentation">';
	echo '<tr><th scope="row">Điểm (vd. 4,6)</th><td>' . $in( $nm . '[score]', $s['score'], 'text', ' style="width:6em" pattern="[0-5]([.,][0-9])?"' ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $in escape từng thuộc tính.
	echo '<tr><th scope="row">Số đánh giá</th><td>' . $in( $nm . '[count]', $s['count'], 'number', ' style="width:8em" min="0"' ) . '<p class="description">Để trống điểm hoặc số đánh giá = ẩn dòng điểm. Cập nhật theo Google Maps khi số liệu đổi.</p></td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<tr><th scope="row">Địa điểm được đánh giá</th><td>' . $in( $nm . '[place]', $s['place'] ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<tr><th scope="row">Địa điểm, bản tiếng Anh (trang /en/)</th><td>' . $in( $nm . '[place_en]', $s['place_en'] ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<tr><th scope="row">Link "Xem tất cả đánh giá"</th><td>' . $in( $nm . '[all_url]', $s['all_url'], 'url' ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</table><h2>Các đánh giá</h2><table class="form-table" role="presentation">';
	for ( $i = 0; $i < HV2_REVIEWS_MAX; $i++ ) {
		$r = $s['items'][ $i ] ?? array();
		$p = $nm . '[items][' . $i . ']';
		echo '<tr><th scope="row">Đánh giá ' . ( $i + 1 ) . '</th><td>';
		echo '<textarea class="large-text" rows="3" name="' . esc_attr( $p . '[text]' ) . '" aria-label="Lời đánh giá ' . ( $i + 1 ) . '">' . esc_textarea( (string) ( $r['text'] ?? '' ) ) . '</textarea>';
		echo '<p><label>Tên khách (tên hoặc chữ cái đầu, có thể trống) ' . $in( $p . '[name]', (string) ( $r['name'] ?? '' ) ) . '</label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<p><label>Nguồn ' . $in( $p . '[source]', (string) ( $r['source'] ?? 'Google' ) ) . '</label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<p><label>Link đánh giá gốc ' . $in( $p . '[url]', (string) ( $r['url'] ?? '' ), 'url' ) . '</label></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
		$lang = (string) ( $r['lang'] ?? 'vi' );
		echo '<p><label>Ngôn ngữ của lời đánh giá <select name="' . esc_attr( $p . '[lang]' ) . '"><option value="vi"' . selected( 'vi', $lang, false ) . '>Tiếng Việt</option><option value="en"' . selected( 'en', $lang, false ) . '>English</option></select></label></p>';
		echo '</td></tr>';
	}
	echo '</table>';
	submit_button();
	echo '</form></div>';
}
