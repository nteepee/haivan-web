<?php
/**
 * Trang kể chuyện v2: chữ và ảnh của từng trang được khai báo một lần (khoá, nhãn, kiểu, mặc định vi/en), MKT sửa
 * trong hộp "Nội dung trang (v2)" ngay ở màn hình sửa trang; ô để trống thì dùng chữ mặc định đã duyệt.
 * Lưu ở post meta `hv2_story` (mảng) của từng bản ngôn ngữ (Polylang tách bài vi/en nên mỗi bản tự có chữ riêng).
 * Thêm trang mới: thêm một mục vào hv2_story_schemas() theo slug, rồi tạo template page-{slug}.php dùng hv2_s().
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Khai báo trường theo slug trang. Mỗi trường: [nhãn, kiểu (text|textarea|lines|image), mặc định vi, mặc định en, nhóm].
 * Kiểu "lines": mỗi dòng một mục, các phần cách nhau bằng " | ".
 *
 * @return array<string,array<string,array>>
 */
function hv2_story_schemas() {
	return array(
		'gioi-thieu' => array(
			'h1_a'        => array( 'H1 · vế 1', 'text', 'Về Hải Vân.', 'About Hai Van.', '01 · Đầu trang' ),
			'h1_b'        => array( 'H1 · vế 2 (tô vàng)', 'text', 'Đi bằng sự tử tế, lớn lên bằng niềm tin.', 'Travelling with kindness, growing with trust.', '01 · Đầu trang' ),
			'lead'        => array( 'Đoạn dẫn', 'textarea', 'Từ năm 1994, Hải Vân kiên trì làm tốt một việc: đưa bạn đến nơi cần đến, bằng một chuyến đi đủ an tâm để lần sau bạn muốn đi tiếp cùng chúng tôi.', 'Since 1994, Hai Van has kept doing one thing well: getting you where you need to be, on a trip calm enough that you want to travel with us again.', '01 · Đầu trang' ),
			'hero_img'    => array( 'Ảnh lớn', 'image', 'svc-hop-dong.webp', '', '01 · Đầu trang' ),
			'hero_alt'    => array( 'Mô tả ảnh lớn', 'text', 'Đội xe Limousine và tài xế Hải Vân', 'Hai Van limousine fleet and drivers', '01 · Đầu trang' ),

			'st_eyebrow'  => array( 'Nhãn khối', 'text', 'Câu chuyện', 'Our story', '02 · Câu chuyện' ),
			'st_h2_a'     => array( 'H2 · vế 1', 'text', 'Chúng tôi tin rằng đi thật xa', 'We believe a long journey', '02 · Câu chuyện' ),
			'st_h2_b'     => array( 'H2 · vế 2', 'text', 'vẫn có thể thật gần.', 'can still feel close.', '02 · Câu chuyện' ),
			'st_p1'       => array( 'Đoạn 1', 'textarea', 'Hơn 30 năm qua, Hải Vân đã đi cùng nhiều thế hệ hành khách trên những cung đường Hà Nội – Tây Bắc, Sài Gòn – Vũng Tàu và ra vào sân bay Tân Sơn Nhất. Điều chúng tôi trân trọng nhất không phải quãng đường đã đi, mà là niềm tin được trao lại sau mỗi chuyến.', 'For more than 30 years, Hai Van has carried generations of travellers between Hanoi and the northwest, Saigon and Vung Tau, and to and from Tan Son Nhat airport. What we value most is not the distance covered but the trust you give back after every trip.', '02 · Câu chuyện' ),
			'st_p2'       => array( 'Đoạn 2', 'textarea', 'Niềm tin ấy đến từ những việc rất nhỏ:', 'That trust comes from very small things:', '02 · Câu chuyện' ),
			'st_list'     => array( 'Danh sách (mỗi dòng một ý)', 'lines', "một cuộc gọi được nghe đến cuối;\nmột điểm đón được chỉ dẫn rõ ràng;\nmột chiếc xe được chuẩn bị chỉn chu, như thể người nhà của chúng tôi sắp lên đường.", "a phone call listened to until the end;\na pick-up point explained clearly;\na vehicle prepared with care, as if our own family were about to travel.", '02 · Câu chuyện' ),
			'st_quote'    => array( 'Trích dẫn', 'textarea', 'Tử tế không phải là khẩu hiệu treo trên tường. Đó là cách chúng tôi làm việc mỗi ngày.', 'Kindness is not a slogan on the wall. It is how we work every day.', '02 · Câu chuyện' ),
			'st_img'      => array( 'Ảnh', 'image', 'lounge-q1.webp', '', '02 · Câu chuyện' ),
			'st_alt'      => array( 'Mô tả ảnh', 'text', 'Phòng chờ Hải Vân Quận 1 với dòng chữ Tử tế từ Tâm – Chu đáo từ Hành', 'Hai Van District 1 lounge with our motto on the wall', '02 · Câu chuyện' ),

			'th_eyebrow'  => array( 'Nhãn khối', 'text', 'Điều chúng tôi giữ', 'What we hold to', '03 · Tâm và Hành' ),
			'th_h2_a'     => array( 'H2 · vế 1', 'text', 'Tử tế từ Tâm.', 'Kindness at heart.', '03 · Tâm và Hành' ),
			'th_h2_b'     => array( 'H2 · vế 2', 'text', 'Chu đáo từ Hành.', 'Care in every act.', '03 · Tâm và Hành' ),
			'th_col_a'    => array( 'Tiêu đề cột Tâm', 'text', 'Tử tế từ Tâm', 'Kindness at heart', '03 · Tâm và Hành' ),
			'th_col_b'    => array( 'Tiêu đề cột Hành', 'text', 'Chu đáo từ Hành', 'Care in every act', '03 · Tâm và Hành' ),
			'th_rows'     => array( 'Các cặp (Tâm | Hành)', 'lines', "Đối xử với hành khách như người nhà | Nhân viên lịch sự; trên xe có khăn lạnh và nước uống miễn phí cho từng người\nNói rõ trước khi bạn trả tiền | Giá cuối cùng hiện trước khi xác nhận, không có chi phí ẩn\nKhông nhồi khách, kể cả ngày lễ Tết | Chỉ bán đúng số ghế, số giường của xe\nAn toàn là điều không thương lượng | Tài xế được kiểm tra sức khoẻ trước mỗi ca; tốc độ và giờ lái được giám sát liên tục; hành khách có bảo hiểm\nCó người lo khi bạn cần | Tổng đài 1900 6763 có người thật nghe máy 24/7", "Treat every passenger like family | Courteous staff; a cold towel and free drinking water for everyone on board\nBe clear before you pay | The final price is shown before you confirm, no hidden costs\nNever overload a coach, even at Tet | We only sell the seats and berths the coach has\nSafety is not negotiable | Drivers are checked before every shift; speed and driving hours are monitored; passengers are insured\nSomeone is there when you need us | Our 1900 6763 hotline is answered by a real person 24/7", '03 · Tâm và Hành' ),

			'va_eyebrow'  => array( 'Nhãn khối', 'text', 'Giá trị cốt lõi', 'Core values', '04 · Ba giá trị' ),
			'va_h2_a'     => array( 'H2 · vế 1', 'text', 'Ba điều', 'Three things', '04 · Ba giá trị' ),
			'va_h2_b'     => array( 'H2 · vế 2', 'text', 'làm nên mỗi chuyến đi.', 'behind every trip.', '04 · Ba giá trị' ),
			'va_intro'    => array( 'Đoạn dẫn', 'textarea', 'Hải Vân đứng trên ba giá trị cốt lõi: con người, công nghệ và phương tiện.', 'Hai Van stands on three core values: people, technology and vehicles.', '04 · Ba giá trị' ),
			'va_1_t'      => array( 'Thẻ 1 · tiêu đề', 'text', 'Con người', 'People', '04 · Ba giá trị' ),
			'va_1_d'      => array( 'Thẻ 1 · nội dung', 'textarea', 'Hơn 1.000 nhân viên. Bộ tiêu chuẩn đào tạo riêng cho tài xế, đúc kết từ hơn 30 năm: lái an toàn và hiểu hành khách cần gì trên từng chặng.', 'More than 1,000 people. Our own driver training standard, built over 30 years: drive safely and understand what passengers need at every stage.', '04 · Ba giá trị' ),
			'va_1_img'    => array( 'Thẻ 1 · ảnh', 'image', 'staff-guests.webp', '', '04 · Ba giá trị' ),
			'va_2_t'      => array( 'Thẻ 2 · tiêu đề', 'text', 'Công nghệ', 'Technology', '04 · Ba giá trị' ),
			'va_2_d'      => array( 'Thẻ 2 · nội dung', 'textarea', 'Đặt vé và chọn chỗ trên ứng dụng, theo dõi xe đang ở đâu, tích điểm đổi vé. Phía sau là hệ thống giúp xe chạy đúng giờ và giám sát an toàn.', 'Book and choose your seat in the app, see where your coach is, earn points for free trips. Behind it, systems that keep trips on time and monitor safety.', '04 · Ba giá trị' ),
			'va_2_img'    => array( 'Thẻ 2 · ảnh', 'image', '/assets/design/app-phone.webp', '', '04 · Ba giá trị' ),
			'va_3_t'      => array( 'Thẻ 3 · tiêu đề', 'text', 'Phương tiện', 'Vehicles', '04 · Ba giá trị' ),
			'va_3_d'      => array( 'Thẻ 3 · nội dung', 'textarea', 'Cabin riêng, ghế da, màn hình giải trí. Hệ thống giám sát an toàn xe và giám sát sức khoẻ tài xế trên mỗi chuyến.', 'Private cabins, leather seats, entertainment screens. Vehicle safety monitoring and driver health monitoring on every trip.', '04 · Ba giá trị' ),
			'va_3_img'    => array( 'Thẻ 3 · ảnh', 'image', 'cabin-royal.webp', '', '04 · Ba giá trị' ),

			'ms_text'     => array( 'Dòng mốc dưới con số', 'textarea', '4/2019: Hải Vân là doanh nghiệp tư nhân đầu tiên được cấp phép thí điểm xe đưa đón sân bay, bắt đầu tại Tân Sơn Nhất.', 'April 2019: Hai Van became the first private company licensed to pilot airport transfers, starting at Tan Son Nhat.', '06 · Thành tựu' ),

			'rv_eyebrow'  => array( 'Nhãn khối', 'text', 'Khách hàng kể', 'In their words', '07 · Khách hàng kể' ),
			'rv_h2_a'     => array( 'H2 · vế 1', 'text', 'Điều khách nhớ', 'What people remember', '07 · Khách hàng kể' ),
			'rv_h2_b'     => array( 'H2 · vế 2', 'text', 'là những chuyện nhỏ.', 'are the small things.', '07 · Khách hàng kể' ),
			'rv_items'    => array( 'Lời khách (lời | tên · tuyến)', 'lines', "…các anh còn chủ động đưa nước, đưa khăn như kiểu người nhà ạ. | Trương Thị Hồng · tuyến Điện Biên\nCó đợt đánh rơi bóp tiền, số tiền lên tới cả ngàn đô mà liên hệ tìm lại được không thiếu 1 xu. | Quỳnh Thái\nĐang lễ tết nên cực kì bất ngờ khi nhà xe không nhét khách… con mình rơi gấu bông, gọi cho anh phụ xe tìm hộ gửi lại văn phòng. | Phương Hoàng", "…the crew even brought us water and towels, like family. | Truong Thi Hong · Dien Bien route\nI once dropped my wallet with about a thousand dollars in it, and got it back without a single coin missing. | Quynh Thai\nIt was the holidays and I was surprised they did not overload the coach… my child dropped a teddy bear and the crew found it and left it at the office. | Phuong Hoang", '07 · Khách hàng kể' ),
			'rv_more'     => array( 'Chữ link xem thêm', 'text', 'Đọc thêm đánh giá', 'More reviews', '07 · Khách hàng kể' ),

			'nx_eyebrow'  => array( 'Nhãn khối', 'text', 'Hành trình tiếp theo', 'What’s next', '09 · Hành trình tiếp theo' ),
			'nx_h2_a'     => array( 'H2 · vế 1', 'text', 'Hành trình tiếp theo', 'The next journey', '09 · Hành trình tiếp theo' ),
			'nx_h2_b'     => array( 'H2 · vế 2', 'text', 'của chúng ta.', 'is ours to share.', '09 · Hành trình tiếp theo' ),
			'nx_intro'    => array( 'Đoạn dẫn', 'textarea', 'Mỗi chuyến đi là một lần chúng tôi được làm tốt hơn. Bạn có thể bắt đầu theo cách của mình.', 'Every trip is a chance for us to do better. Start in whichever way suits you.', '09 · Hành trình tiếp theo' ),
			'nx_items'    => array( 'Lối vào (chữ | đường dẫn)', 'lines', "Đặt chuyến đi | /xe-khach\nCùng làm việc với Hải Vân | /chung-toi/tuyen-dung\nTrở thành đối tác | /chung-toi/doi-tac", "Book a trip | /xe-khach\nWork with Hai Van | /chung-toi/tuyen-dung\nBecome a partner | /chung-toi/doi-tac", '09 · Hành trình tiếp theo' ),
		),
		// Trang lưu trữ /uu-dai (không phải trang WP): chữ lưu ở option, sửa tại Ưu đãi → Trang Ưu đãi (v2).
		'uu-dai'     => array(
			'h1_a'        => array( 'H1 · vế 1', 'text', 'Đi cùng nhau.', 'Travel together.', '01 · Đầu trang' ),
			'h1_b'        => array( 'H1 · vế 2 (tô vàng)', 'text', 'Tiết kiệm nhiều hơn.', 'Save more.', '01 · Đầu trang' ),
			'lead'        => array( 'Đoạn dẫn', 'textarea', 'Các ưu đãi đang chạy trên tuyến xe Hải Vân. Mỗi ưu đãi ghi rõ điều kiện, và giá cuối cùng luôn hiện trước khi bạn thanh toán.', 'Deals running on Hai Van routes. Every offer states its conditions, and the final price always shows before you pay.', '01 · Đầu trang' ),
			'feat_label'  => array( 'Nhãn thẻ nổi bật', 'text', 'Ưu đãi nổi bật', 'Featured offer', '01 · Đầu trang' ),
			'list_eyebrow' => array( 'Nhãn khối', 'text', 'Ưu đãi theo tuyến', 'Offers by route', '02 · Danh sách ưu đãi' ),
			'list_h2_a'   => array( 'H2 · vế 1', 'text', 'Chọn tuyến,', 'Pick a route,', '02 · Danh sách ưu đãi' ),
			'list_h2_b'   => array( 'H2 · vế 2', 'text', 'chọn giá tốt.', 'pick a better fare.', '02 · Danh sách ưu đãi' ),
			'all_label'   => array( 'Chữ tab "Tất cả"', 'text', 'Tất cả', 'All', '02 · Danh sách ưu đãi' ),
			'other_label' => array( 'Chữ tab ưu đãi chung', 'text', 'Ưu đãi chung', 'General', '02 · Danh sách ưu đãi' ),
			'until'       => array( 'Chữ trước ngày kết thúc', 'text', 'Áp dụng đến', 'Valid until', '02 · Danh sách ưu đãi' ),
			'how_eyebrow' => array( 'Nhãn khối', 'text', 'Cách dùng ưu đãi', 'How it works', '03 · Cách dùng' ),
			'how_h2_a'    => array( 'H2 · vế 1', 'text', 'Ba bước,', 'Three steps,', '03 · Cách dùng' ),
			'how_h2_b'    => array( 'H2 · vế 2', 'text', 'không cần nhập mã.', 'no code to type.', '03 · Cách dùng' ),
			'how_steps'   => array( 'Các bước (tiêu đề | mô tả)', 'lines', "Chọn tuyến và ngày đi | Mở trang tuyến hoặc dùng ô tìm vé ở đầu trang.\nChọn chuyến có nhãn ưu đãi | Chuyến được áp dụng hiện nhãn ngay trong danh sách giờ chạy.\nXem giá trước khi trả tiền | Giá ưu đãi hiện trên màn hình xác nhận, trước khi bạn thanh toán.", "Pick your route and date | Open the route page or use the search box at the top.\nChoose a trip with an offer tag | Eligible trips show the tag right in the timetable.\nSee the price before you pay | The offer price shows on the confirmation screen, before payment.", '03 · Cách dùng' ),
			'how_help'    => array( 'Dòng hỗ trợ', 'text', 'Cần hỏi điều kiện ưu đãi? Gọi %s.', 'Questions about an offer? Call %s.', '03 · Cách dùng' ),
			'posts_eyebrow' => array( 'Nhãn khối', 'text', 'Chương trình khuyến mãi', 'Promotions', '04 · Chương trình' ),
			'posts_h2_a'  => array( 'H2 · vế 1', 'text', 'Chuyện ưu đãi', 'Offer stories', '04 · Chương trình' ),
			'posts_h2_b'  => array( 'H2 · vế 2', 'text', 'mới nhất.', 'latest first.', '04 · Chương trình' ),
		),
	);
}

/** Schema của trang (theo slug), rỗng nếu trang không phải trang kể chuyện. */
function hv2_story_schema( $post ) {
	$post = get_post( $post );
	$all  = hv2_story_schemas();
	return $post && 'page' === $post->post_type && isset( $all[ $post->post_name ] ) ? $all[ $post->post_name ] : array();
}

/** Option lưu chữ của trang lưu trữ kể chuyện (vd. /uu-dai) theo ngôn ngữ. */
function hv2_story_option( $slug, $lang ) {
	return 'hv2_story_' . $slug . '_' . ( 'en' === $lang ? 'en' : 'vi' );
}

/** Giá trị một trường của trang đang xem: chữ MKT nhập, hoặc mặc định theo ngôn ngữ. Trang /uu-dai đọc từ option. */
function hv2_s( $key, $post = null ) {
	if ( null === $post && is_post_type_archive( 'uu_dai' ) ) {
		$schema = hv2_story_schemas()['uu-dai'];
		$saved  = get_option( hv2_story_option( 'uu-dai', hv_lang() ), array() );
		$val    = is_array( $saved ) && isset( $saved[ $key ] ) ? trim( (string) $saved[ $key ] ) : '';
		if ( '' !== $val || ! isset( $schema[ $key ] ) ) {
			return $val;
		}
		return 'en' === hv_lang() && '' !== $schema[ $key ][3] ? $schema[ $key ][3] : $schema[ $key ][2];
	}
	$post   = get_post( $post );
	$schema = hv2_story_schema( $post );
	$saved  = $post ? get_post_meta( $post->ID, 'hv2_story', true ) : array();
	$val    = is_array( $saved ) && isset( $saved[ $key ] ) ? trim( (string) $saved[ $key ] ) : '';
	if ( '' !== $val || ! isset( $schema[ $key ] ) ) {
		return $val;
	}
	$f = $schema[ $key ];
	return 'en' === hv_lang() && '' !== $f[3] ? $f[3] : $f[2];
}

/** Trường kiểu "lines" thành mảng các mục, mỗi mục là mảng các phần (cách nhau bằng " | "). */
function hv2_s_lines( $key, $post = null ) {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n/', hv2_s( $key, $post ) ) ?: array() as $line ) {
		if ( '' !== trim( $line ) ) {
			$out[] = array_map( 'trim', explode( '|', $line ) );
		}
	}
	return $out;
}

/** <img> cho trường ảnh: tên file trong assets/img/v2 (mặc định) hoặc URL/đường dẫn MKT chọn từ thư viện. */
function hv2_story_img( $val, $alt, $attrs = '' ) {
	$val = trim( (string) $val );
	if ( '' === $val ) {
		return '';
	}
	if ( false === strpos( $val, '/' ) ) {
		return hv2_img_tag( $val, $alt, $attrs );
	}
	return '<img src="' . esc_url( $val ) . '" alt="' . esc_attr( $alt ) . '" ' . ( '' !== $attrs ? $attrs : 'loading="lazy" decoding="async"' ) . '>';
}

/* ---- Hộp sửa trong màn hình sửa trang ---- */
add_action(
	'add_meta_boxes_page',
	static function ( $post ) {
		if ( hv2_story_schema( $post ) ) {
			add_meta_box( 'hv2-story', 'Nội dung trang (v2) — để trống ô nào thì dùng chữ mặc định', 'hv2_story_metabox', 'page', 'normal', 'high' );
		}
	}
);

/** In hộp sửa: nhóm theo khối, ô trống hiện chữ mặc định làm gợi ý. */
function hv2_story_metabox( $post ) {
	$schema = hv2_story_schema( $post );
	$saved  = get_post_meta( $post->ID, 'hv2_story', true );
	$saved  = is_array( $saved ) ? $saved : array();
	$en     = function_exists( 'pll_get_post_language' ) && 'en' === pll_get_post_language( $post->ID );
	wp_nonce_field( 'hv2_story_save', 'hv2_story_nonce' );
	echo '<p>Chữ của trang này nằm ở các ô dưới đây (nội dung trong trình soạn thảo phía trên không hiện trên trang). Kiểu "nhiều dòng": mỗi dòng một mục, các phần cách nhau bằng dấu <code>|</code>. Ảnh: dán đường dẫn hoặc bấm "Chọn từ thư viện".</p>';
	$group = '';
	foreach ( $schema as $key => $f ) {
		if ( $f[4] !== $group ) {
			echo ( '' !== $group ? '</table>' : '' ) . '<h3 style="margin:24px 0 4px">' . esc_html( $f[4] ) . '</h3><table class="form-table" role="presentation">';
			$group = $f[4];
		}
		$def  = $en && '' !== $f[3] ? $f[3] : $f[2];
		$id   = 'hv2s_' . $key;
		$val  = (string) ( $saved[ $key ] ?? '' );
		$name = 'hv2_story[' . $key . ']';
		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $f[0] ) . '</label></th><td>';
		if ( in_array( $f[1], array( 'textarea', 'lines' ), true ) ) {
			echo '<textarea class="large-text" rows="' . ( 'lines' === $f[1] ? 5 : 3 ) . '" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $def ) . '">' . esc_textarea( $val ) . '</textarea>';
		} else {
			echo '<input class="large-text" type="text" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '" placeholder="' . esc_attr( $def ) . '">';
			if ( 'image' === $f[1] ) {
				echo ' <button type="button" class="button" data-hv-media="#' . esc_attr( $id ) . '">Chọn từ thư viện</button>';
			}
		}
		echo '</td></tr>';
	}
	echo '' !== $group ? '</table>' : '';
}

add_action(
	'save_post_page',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv2_story_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv2_story_nonce'] ) ), 'hv2_story_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_page', $post_id ) ) {
			return;
		}
		$schema = hv2_story_schema( $post_id );
		$in     = isset( $_POST['hv2_story'] ) && is_array( $_POST['hv2_story'] ) ? wp_unslash( $_POST['hv2_story'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- làm sạch từng trường bên dưới.
		$out    = array();
		foreach ( $schema as $key => $f ) {
			$v = isset( $in[ $key ] ) ? (string) $in[ $key ] : '';
			if ( 'image' === $f[1] ) {
				$v = false === strpos( $v, '/' ) ? sanitize_file_name( $v ) : hv_clean_image_url( $v );
			} elseif ( 'text' === $f[1] ) {
				$v = sanitize_text_field( $v );
			} else {
				$v = sanitize_textarea_field( $v );
			}
			if ( '' !== trim( $v ) ) {
				$out[ $key ] = $v;
			}
		}
		update_post_meta( $post_id, 'hv2_story', $out );
	}
);

/* Nút "Chọn từ thư viện" dùng lại admin-media.js của theme. */
add_action(
	'admin_enqueue_scripts',
	static function ( $hook ) {
		if ( in_array( $hook, array( 'post.php', 'post-new.php' ), true ) && hv2_story_schema( get_post() ) ) {
			wp_enqueue_media();
			wp_enqueue_script( 'hv-admin-media', HV_WEB_URI . '/assets/js/admin-media.js', array( 'jquery' ), HV_WEB_VERSION, true );
		}
	}
);

/* ---- Trang cài đặt chữ cho /uu-dai: Ưu đãi → Trang Ưu đãi (v2) ---- */
add_action(
	'admin_menu',
	static function () {
		add_submenu_page( 'edit.php?post_type=hv_offer', 'Trang Ưu đãi (v2)', 'Trang Ưu đãi (v2)', 'edit_posts', 'hv2-uu-dai', 'hv2_uu_dai_settings_page' );
	}
);

/** In và lưu form chữ trang /uu-dai (hai bản vi/en). Thẻ ưu đãi vẫn quản lý ở danh sách Ưu đãi. */
function hv2_uu_dai_settings_page() {
	$schema = hv2_story_schemas()['uu-dai'];
	if ( isset( $_POST['hv2_story_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv2_story_nonce'] ) ), 'hv2_story_uu_dai' ) && current_user_can( 'edit_posts' ) ) {
		$in = isset( $_POST['hv2_story'] ) && is_array( $_POST['hv2_story'] ) ? wp_unslash( $_POST['hv2_story'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- làm sạch từng trường.
		foreach ( array( 'vi', 'en' ) as $lang ) {
			$out = array();
			foreach ( $schema as $key => $f ) {
				$v = isset( $in[ $lang ][ $key ] ) ? (string) $in[ $lang ][ $key ] : '';
				$v = 'text' === $f[1] ? sanitize_text_field( $v ) : sanitize_textarea_field( $v );
				if ( '' !== trim( $v ) ) {
					$out[ $key ] = $v;
				}
			}
			update_option( hv2_story_option( 'uu-dai', $lang ), $out, false );
		}
		echo '<div class="notice notice-success"><p>Đã lưu.</p></div>';
	}
	echo '<div class="wrap"><h1>Trang Ưu đãi (v2)</h1><p>Chữ của trang <a href="' . esc_url( home_url( '/uu-dai' ) ) . '" target="_blank">/uu-dai</a>. Ô để trống = dùng chữ mặc định (hiện mờ trong ô). Các thẻ ưu đãi lấy từ danh sách <a href="' . esc_url( admin_url( 'edit.php?post_type=hv_offer' ) ) . '">Ưu đãi</a> (đang hiệu lực, theo Thứ tự); thẻ đầu tiên là ưu đãi nổi bật.</p><form method="post">';
	wp_nonce_field( 'hv2_story_uu_dai', 'hv2_story_nonce' );
	foreach ( array( 'vi' => 'Tiếng Việt', 'en' => 'English' ) as $lang => $lname ) {
		$saved = get_option( hv2_story_option( 'uu-dai', $lang ), array() );
		echo '<h2 style="margin-top:28px">' . esc_html( $lname ) . '</h2>';
		$group = '';
		foreach ( $schema as $key => $f ) {
			if ( $f[4] !== $group ) {
				echo ( '' !== $group ? '</table>' : '' ) . '<h3>' . esc_html( $f[4] ) . '</h3><table class="form-table" role="presentation">';
				$group = $f[4];
			}
			$def = 'en' === $lang && '' !== $f[3] ? $f[3] : $f[2];
			$val = is_array( $saved ) ? (string) ( $saved[ $key ] ?? '' ) : '';
			$nm  = 'hv2_story[' . $lang . '][' . $key . ']';
			echo '<tr><th scope="row">' . esc_html( $f[0] ) . '</th><td>';
			if ( 'text' === $f[1] ) {
				echo '<input class="large-text" type="text" name="' . esc_attr( $nm ) . '" value="' . esc_attr( $val ) . '" placeholder="' . esc_attr( $def ) . '">';
			} else {
				echo '<textarea class="large-text" rows="4" name="' . esc_attr( $nm ) . '" placeholder="' . esc_attr( $def ) . '">' . esc_textarea( $val ) . '</textarea>';
			}
			echo '</td></tr>';
		}
		echo '</table>';
	}
	submit_button( 'Lưu' );
	echo '</form></div>';
}
