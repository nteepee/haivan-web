<?php
/**
 * Trang chủ v2 ("Tử tế từ Tâm – Chu đáo từ Hành"): mỗi khối một câu Tâm (điều Hải Vân quan tâm) + bằng chứng Hành
 * (số liệu, địa chỉ, ảnh thật). Khung chữ đã duyệt: docs/redesign-v2/01-trang-chu.md. Dữ liệu động (ưu đãi, tuyến,
 * phòng chờ, tin, app) lấy từ CPT/cài đặt có sẵn; khối không có dữ liệu bị ẩn.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Chuỗi chữ của trang chủ v2 theo ngôn ngữ đang xem. */
function hv2_t( $key ) {
	static $s = null;
	if ( null === $s ) {
		$s = array(
			'hero_kicker'   => array( 'Xe khách Hải Vân · Từ 1994', 'Hai Van coaches · Since 1994' ),
			'hero_h1_a'     => array( 'Xe khách Hải Vân.', 'Hai Van coaches.' ),
			'hero_h1_b'     => array( 'Tử tế từ Tâm,', 'Kindness at heart,' ),
			'hero_h1_c'     => array( 'chu đáo từ Hành.', 'care in every act.' ),
			'hero_lead'     => array( 'Hơn 30 năm trên những hành trình đến Vũng Tàu, sân bay Tân Sơn Nhất và các tỉnh Tây Bắc, Hải Vân vẫn giữ một cách làm: lo cho hành khách như người nhà.', 'For more than 30 years on the roads to Vung Tau, Tan Son Nhat airport and the northwest, Hai Van has kept one habit: looking after every passenger like family.' ),
			'hero_find'     => array( 'Tìm chuyến đi', 'Find a trip' ),
			'hero_story'    => array( 'Câu chuyện Hải Vân', 'The Hai Van story' ),
			'hero_alt'      => array( 'Xe giường nằm Hải Vân chạy trên đèo Tây Bắc lúc bình minh', 'A Hai Van sleeper coach on a northwest mountain pass at sunrise' ),
			'hero_foot_a'   => array( 'Hải Vân / Từ 1994', 'Hai Van / Since 1994' ),
			'hero_foot_b'   => array( 'Xe liên tỉnh · Xe sân bay · Xe hợp đồng', 'Intercity · Airport · Private hire' ),
			'trip_label'    => array( 'Loại hành trình', 'Trip type' ),
			'trip_ow'       => array( 'Một chiều', 'One way' ),
			'trip_rt'       => array( 'Khứ hồi', 'Return' ),
			'book_eyebrow'  => array( 'Đặt vé nhanh', 'Quick booking' ),
			'book_h2'       => array( 'Tìm chuyến đi của bạn', 'Find your trip' ),
			'book_help'     => array( 'Cần người tư vấn? Gọi %s – luôn có người nghe máy và hỗ trợ bạn.', 'Need a hand? Call %s – a real person always answers and helps you.' ),
			'svc_eyebrow'   => array( 'Đồng hành cùng bạn', 'With you all the way' ),
			'svc_h2_a'      => array( 'Một chuyến đi tốt', 'A good journey' ),
			'svc_h2_b'      => array( 'bắt đầu từ sự quan tâm.', 'starts with care.' ),
			'svc_intro'     => array( 'Đi tỉnh, ra sân bay hay cần cả một chiếc xe cho gia đình, công ty, Hải Vân đều chuẩn bị sẵn.', 'Intercity, airport or a whole vehicle for your family or company: Hai Van has it ready.' ),
			'svc_1_t'       => array( 'Xe liên tỉnh', 'Intercity coaches' ),
			'svc_1_d'       => array( 'Giường nằm, cabin riêng, chạy đêm êm như ngủ ở nhà.', 'Sleeper berths and private cabins, as calm at night as your own bed.' ),
			'svc_1_alt'     => array( 'Cabin giường nằm Royal của Hải Vân', 'A Hai Van Royal sleeper cabin' ),
			'svc_2_t'       => array( 'Xe sân bay', 'Airport transfers' ),
			'svc_2_d'       => array( 'Đón tại Tân Sơn Nhất (Làn B, cột B04), đưa thẳng về Vũng Tàu.', 'Pick-up at Tan Son Nhat (Lane B, pillar B04), straight to Vung Tau.' ),
			'svc_2_alt'     => array( 'Xe Limousine Hải Vân đón khách ở sân bay Tân Sơn Nhất', 'A Hai Van limousine van at Tan Son Nhat airport' ),
			'svc_3_t'       => array( 'Xe hợp đồng', 'Private hire' ),
			'svc_3_d'       => array( 'Xe kèm tài xế, cho chuyến đi riêng của gia đình hoặc doanh nghiệp.', 'A vehicle with a driver, for your family trip or company travel.' ),
			'svc_3_alt'     => array( 'Đội xe Limousine và tài xế Hải Vân', 'Hai Van limousine fleet and drivers' ),
			'svc_more'      => array( 'Khám phá', 'Explore' ),
			'svc_cargo'     => array( 'Gửi hàng cùng chuyến xe', 'Send parcels with our coaches' ),
			'jr_eyebrow'    => array( 'Trên một chuyến đi', 'On every trip' ),
			'jr_h2_a'       => array( 'Sự chu đáo bắt đầu', 'Care starts' ),
			'jr_h2_b'       => array( 'từ những điều nhỏ nhất.', 'with the smallest things.' ),
			'jr_intro'      => array( 'Từ lúc đặt vé đến khi xuống xe, Hải Vân đồng hành cùng bạn qua 5 bước.', 'From booking to arrival, Hai Van is with you through five steps.' ),
			'jr_1_k'        => array( 'Lúc đặt vé', 'When you book' ),
			'jr_1_t'        => array( 'Đúng giường, đúng ghế bạn chọn', 'The exact berth or seat you chose' ),
			'jr_1_d'        => array( 'Bạn tự chọn chỗ trên sơ đồ xe. Vé QR nằm gọn trong điện thoại, không sợ mất.', 'Pick your place on the seat map. Your QR ticket lives on your phone, never lost.' ),
			'jr_2_k'        => array( 'Trước giờ đi', 'Before you leave' ),
			'jr_2_t'        => array( 'Phòng chờ mát, có người đón', 'A cool lounge and someone to greet you' ),
			'jr_2_d'        => array( 'Điều hoà, trà nước và nhân viên hỗ trợ xếp hành lý. Bạn chỉ cần đến trước giờ xe chạy 20 phút.', 'Air conditioning, tea and staff to help with luggage. Just arrive 20 minutes before departure.' ),
			'jr_2_alt'      => array( 'Phòng chờ Hải Vân tại 34 Nguyễn Thái Bình, Quận 1', 'Hai Van lounge at 34 Nguyen Thai Binh, District 1' ),
			'jr_3_k'        => array( 'Lúc lên xe', 'On board' ),
			'jr_3_t'        => array( 'Cabin sạch, chăn gối mới', 'A clean cabin, fresh bedding' ),
			'jr_3_d'        => array( 'Có sạc USB, nước uống và màn hình riêng trên các xe cabin.', 'USB charging, drinking water and a personal screen on cabin coaches.' ),
			'jr_3_alt'      => array( 'Cabin Royal với chăn gối mới và màn hình riêng', 'A Royal cabin with fresh bedding and a personal screen' ),
			'jr_4_k'        => array( 'Trên đường', 'On the road' ),
			'jr_4_t'        => array( 'Tài xế khoẻ, hành trình được giám sát', 'Rested drivers, monitored journeys' ),
			'jr_4_d'        => array( 'Tài xế được kiểm tra sức khoẻ trước mỗi ca. Tốc độ và giờ lái được theo dõi liên tục.', 'Drivers are checked before every shift. Speed and driving hours are tracked throughout.' ),
			'jr_4_alt'      => array( 'Xe giường nằm Hải Vân chạy đêm tuyến Mỹ Đình – Sơn La', 'A Hai Van night coach on the My Dinh – Son La route' ),
			'jr_5_k'        => array( 'Khi cần thay đổi', 'When plans change' ),
			'jr_5_t'        => array( 'Một cuộc gọi là có người lo', 'One call and someone takes care of it' ),
			'jr_5_d'        => array( 'Tổng đài %s có người thật nghe máy 24/7, hỗ trợ đổi giờ trước giờ xe chạy.', 'Our %s hotline is answered by a real person 24/7 and can move your trip before departure.' ),
			'jr_5_alt'      => array( 'Nhân viên Hải Vân trò chuyện cùng hành khách trong phòng chờ', 'Hai Van staff with passengers in the lounge' ),
			'jr_ticket'     => array( 'Vé điện tử', 'E-ticket' ),
			'jr_ticket_g'   => array( 'Giường', 'Berth' ),
			'off_eyebrow'   => array( 'Ưu đãi hôm nay', 'Today’s offers' ),
			'off_h2_a'      => array( 'Đi cùng nhau.', 'Travel together.' ),
			'off_h2_b'      => array( 'Tiết kiệm nhiều hơn.', 'Save more.' ),
			'off_all'       => array( 'Xem tất cả ưu đãi', 'All offers' ),
			'rt_eyebrow'    => array( 'Tuyến phổ biến', 'Popular routes' ),
			'rt_h2_a'       => array( 'Chọn nơi bạn muốn', 'Choose where you' ),
			'rt_h2_b'       => array( 'bắt đầu.', 'want to begin.' ),
			'rt_all'        => array( 'Xem tất cả tuyến', 'All routes' ),
			'rt_from'       => array( 'Từ', 'From' ),
			'lg_eyebrow'    => array( 'Trước giờ khởi hành', 'Before departure' ),
			'lg_h2_a'       => array( 'Phòng chờ', 'Even the lounge' ),
			'lg_h2_b'       => array( 'cũng phải tử tế.', 'should be kind.' ),
			'lg_intro'      => array( 'Không ai muốn đứng chờ xe dưới nắng mưa. Phòng chờ của Hải Vân mát, sạch, có trà nước và có người hỗ trợ bạn.', 'Nobody should wait for a coach in the sun or rain. Our lounges are cool and clean, with tea and staff ready to help.' ),
			'lg_alt'        => array( 'Phòng chờ Hải Vân Quận 1 với dòng chữ Tử tế từ Tâm – Chu đáo từ Hành trên tường', 'Hai Van District 1 lounge with the motto on the wall' ),
			'lg_map'        => array( 'Chỉ đường', 'Directions' ),
			'st_eyebrow'    => array( 'Giá trị bền vững', 'Lasting value' ),
			'st_h2_a'       => array( 'Không chỉ là', 'More than' ),
			'st_h2_b'       => array( 'một chuyến xe.', 'a coach ride.' ),
			'st_1'          => array( 'Năm bắt đầu hành trình', 'The year we started' ),
			'st_2'          => array( 'Phương tiện', 'Vehicles' ),
			'st_3'          => array( 'Nhân viên', 'Staff' ),
			'st_4'          => array( 'Lượt khách đã đồng hành', 'Passengers carried' ),
			'st_4_v'        => array( '~200 triệu', '~200 million' ),
			'csr_eyebrow'   => array( 'Phụng sự cộng đồng', 'Serving the community' ),
			'csr_h2_a'      => array( 'Không bỏ lại', 'Leave no one' ),
			'csr_h2_b'      => array( 'ai phía sau.', 'behind.' ),
			'csr_intro'     => array( 'Có những chuyến xe Hải Vân chạy không phải để bán vé.', 'Some Hai Van trips are not about selling tickets.' ),
			'csr_1_t'       => array( 'Xe trung chuyển miễn phí qua các bệnh viện lớn tại Hà Nội', 'Free shuttles to Hanoi’s major hospitals' ),
			'csr_2_t'       => array( 'Đồng hành cùng bệnh nhân Điện Biên', 'Standing with patients from Dien Bien' ),
			'csr_3_t'       => array( 'Tặng vé cho học sinh, sinh viên mùa tựu trường', 'Free tickets for students going back to school' ),
			'csr_4_t'       => array( 'Trao thẻ đi xe miễn phí tại Mộc Châu', 'Free travel cards in Moc Chau' ),
			'csr_quote'     => array( 'Mỗi dịp Tết, Hải Vân tổ chức những chuyến xe miễn phí đưa người lao động về quê đoàn viên. Có người kịp chuyến cuối cùng trưa 30 Tết, vẫn được nhận lời chúc và phong bao lì xì đầu năm.', 'Every Lunar New Year, Hai Van runs free coaches to take workers home to their families. Some catch the very last trip at noon on New Year’s Eve, and still receive warm wishes and a lucky red envelope.' ),
			'csr_more'      => array( 'Phát triển bền vững', 'Sustainability' ),
			'ds_eyebrow'    => array( 'Điểm đến', 'Destinations' ),
			'ds_h2_a'       => array( 'Mỗi nơi đến,', 'Every place,' ),
			'ds_h2_b'       => array( 'một câu chuyện.', 'its own story.' ),
			'ds_all'        => array( 'Tất cả điểm đến', 'All destinations' ),
			'app_eyebrow'   => array( 'Ứng dụng Hải Vân', 'Hai Van app' ),
			'app_h2_a'      => array( 'Hải Vân', 'Hai Van' ),
			'app_h2_b'      => array( 'trong túi bạn.', 'in your pocket.' ),
			'app_lead'      => array( 'Theo dõi xe đang ở đâu, giữ vé không sợ mất, tích điểm đổi vé. Lần đặt đầu tiên qua ứng dụng được tặng 50k.', 'See where your coach is, keep your ticket safe and earn points for free trips. Get 50k off your first booking in the app.' ),
			'app_scan'      => array( 'Quét mã để tải', 'Scan to download' ),
			'nw_eyebrow'    => array( 'Tin Hải Vân', 'Hai Van news' ),
			'nw_h2_a'       => array( 'Chuyện trên', 'Stories from' ),
			'nw_h2_b'       => array( 'mỗi hành trình.', 'the road.' ),
			'nw_all'        => array( 'Tất cả tin', 'All news' ),
			'nw_more'       => array( 'Đọc tiếp', 'Read more' ),
		);
	}
	$i = 'en' === hv_lang() ? 1 : 0;
	return isset( $s[ $key ] ) ? $s[ $key ][ $i ] : $key;
}

/** 03 · Dịch vụ: 3 thẻ ảnh thật. */
function hv2_render_services() {
	$p     = hv_lang_prefix();
	$cards = array(
		array( 'svc_1', 'svc-lien-tinh.webp', $p . '/xe-khach' ),
		array( 'svc_2', 'svc-san-bay.webp', $p . '/xe-san-bay' ),
		array( 'svc_3', 'svc-hop-dong.webp', $p . '/dich-vu/xe-hop-dong' ),
	);
	echo '<ul class="hv2-svc">';
	foreach ( $cards as $i => $c ) {
		echo '<li class="hv2-svc-card"><a href="' . esc_url( $c[2] ) . '"><span class="hv2-svc-img">' . hv2_img_tag( $c[1], hv2_t( $c[0] . '_alt' ) ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<span class="hv2-svc-body"><span class="hv2-no">0' . ( $i + 1 ) . '</span><h3>' . esc_html( hv2_t( $c[0] . '_t' ) ) . '</h3><p>' . esc_html( hv2_t( $c[0] . '_d' ) ) . '</p>';
		echo '<span class="hv2-more">' . esc_html( hv2_t( 'svc_more' ) ) . '<span aria-hidden="true">↗</span></span></span></a></li>';
	}
	echo '</ul>';
	echo '<p class="hv2-svc-extra"><a class="hv2-textlink" href="' . esc_url( $p . '/dich-vu/hang-hoa' ) . '">' . esc_html( hv2_t( 'svc_cargo' ) ) . '<span aria-hidden="true">→</span></a></p>';
}

/** 04 · 5 chặng của một chuyến đi + lời khách thật (inc/home-reviews.php). */
function hv2_render_journey() {
	list( $hot ) = hv2_hotline();
	$steps       = array(
		array( 'jr_1', '' ),
		array( 'jr_2', 'lounge-q1-b.webp' ),
		array( 'jr_3', 'cabin-royal.webp' ),
		array( 'jr_4', 'bus-night.webp' ),
		array( 'jr_5', 'staff-guests.webp' ),
	);
	echo '<ol class="hv2-steps">';
	foreach ( $steps as $i => $st ) {
		$k = $st[0];
		echo '<li class="hv2-step"><div class="hv2-step-media">';
		if ( '' === $st[1] ) {
			// Chặng 1 không có ảnh chụp: dựng tấm vé điện tử minh hoạ bằng CSS.
			echo '<div class="hv2-ticket" aria-hidden="true"><span class="hv2-ticket-k">' . esc_html( hv2_t( 'jr_ticket' ) ) . '</span><strong>' . ( 'en' === hv_lang() ? 'SAIGON' : 'SÀI GÒN' ) . '</strong><i>↓</i><strong>' . ( 'en' === hv_lang() ? 'VUNG TAU' : 'VŨNG TÀU' ) . '</strong><span class="hv2-ticket-seat">' . esc_html( hv2_t( 'jr_ticket_g' ) ) . ' A07</span><span class="hv2-ticket-qr"></span></div>';
		} else {
			echo hv2_img_tag( $st[1], hv2_t( $k . '_alt' ) ); // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div><p class="hv2-step-k"><span>0' . ( $i + 1 ) . '</span>' . esc_html( hv2_t( $k . '_k' ) ) . '</p><h3>' . esc_html( hv2_t( $k . '_t' ) ) . '</h3>';
		echo '<p>' . esc_html( 'jr_5' === $k ? sprintf( hv2_t( 'jr_5_d' ), $hot ) : hv2_t( $k . '_d' ) ) . '</p></li>';
	}
	echo '</ol>';
	hv2_render_reviews();
}

/** 05 · Ưu đãi đang hiệu lực (thẻ dùng chung: hv2_offer_cards). Rỗng = ẩn khối. */
function hv2_render_offers() {
	return hv2_offer_cards( array_slice( hv_active_offers(), 0, 6 ) );
}

/** 06 · Tuyến chính dạng hàng ngang: tên, thời gian chạy, giá "từ" hôm nay (giá thật từ chuyến; không có thì ẩn). */
function hv2_render_routes() {
	$lang      = hv_lang();
	$prefix    = hv_lang_prefix( $lang );
	$rows      = '';
	$corridors = hv_corridors_enabled();
	$prices    = hv_route_live_prices( array_filter( array_map( static fn( $c ) => (string) $c['landing']['ab'], $corridors ) ) );
	foreach ( $corridors as $c ) {
		$name  = (string) ( $c['label'][ $lang ] ?: $c['label']['vi'] );
		$parts = preg_split( '/\s+[–-]\s+/u', $name, 2 );
		$route = $c['landing']['ab'] ? hv_route_find( $c['landing']['ab'] ) : null;
		$time  = $route ? hv_route_time_label( get_post_meta( $route->ID, 'hv_route_time', true ) ) : '';
		$href  = $c['landing']['ab'] ? $prefix . '/xe-khach/' . $c['landing']['ab'] : hv_corridor_search_url( $c, 'ab' );
		$rows .= '<li><a class="hv2-route" href="' . esc_url( $href ) . '"><span class="hv2-route-name">' . esc_html( $parts[0] ) . ( isset( $parts[1] ) ? '<b aria-hidden="true">→</b><span class="hv-sr"> – </span>' . esc_html( $parts[1] ) : '' ) . '</span>';
		$price = $prices[ (string) $c['landing']['ab'] ] ?? 0;
		$rows .= '<span class="hv2-route-time">' . esc_html( $time ) . '</span>' . hv2_route_price( $price ) . '<span class="hv2-route-go" aria-hidden="true">↗</span></a></li>';
	}
	return '' !== $rows ? '<ul class="hv2-routes hv2-routes--compact">' . $rows . '</ul>' : '';
}

/** 07 · Phòng chờ: ảnh thật + danh sách địa chỉ (Cài đặt trang chủ → Địa chỉ), mỗi địa chỉ có link chỉ đường. */
function hv2_render_lounges() {
	$lines = array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', hv_home_text( 'addresses' ) ) ?: array() ) );
	echo '<div class="hv2-lounge"><figure class="hv2-lounge-photo">' . hv2_img_tag( 'lounge-q1.webp', hv2_t( 'lg_alt' ) ) . '</figure>'; // phpcs:ignore WordPress.Security.EscapeOutput
	if ( $lines ) {
		echo '<ol class="hv2-addrs">';
		foreach ( array_values( $lines ) as $i => $line ) {
			$p   = array_map( 'trim', explode( '|', $line, 2 ) );
			$map = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( 'Hải Vân ' . $p[0] . ( isset( $p[1] ) ? ', ' . $p[1] : '' ) );
			if ( 'en' === hv_lang() ) { // Bản en: địa chỉ không dấu như tên trạm bên Next ("34 Nguyen Thai Binh"); link bản đồ vẫn dùng bản có dấu.
				$p = array_map( 'remove_accents', $p );
			}
			echo '<li><span class="hv2-no">' . esc_html( sprintf( '%02d', $i + 1 ) ) . '</span><div><h3>' . esc_html( $p[0] ) . '</h3>' . ( isset( $p[1] ) && '' !== $p[1] ? '<p>' . esc_html( $p[1] ) . '</p>' : '' ) . '</div>';
			echo '<a class="hv2-textlink" href="' . esc_url( $map ) . '" target="_blank" rel="noopener" aria-label="' . esc_attr( hv2_t( 'lg_map' ) . ': ' . $p[0] ) . '">' . esc_html( hv2_t( 'lg_map' ) ) . '<span aria-hidden="true">↗</span></a></li>';
		}
		echo '</ol>';
	}
	echo '</div>';
}

/** 08 · Con số (lấy từ trang Phát triển bền vững và Giới thiệu). */
function hv2_render_stats() {
	$items = array( array( '1994', 'st_1' ), array( '250', 'st_2' ), array( 'en' === hv_lang() ? '1,000+' : '1.000+', 'st_3' ), array( hv2_t( 'st_4_v' ), 'st_4' ) );
	echo '<dl class="hv2-stats">';
	foreach ( $items as $it ) {
		echo '<div><dt>' . esc_html( hv2_t( $it[1] ) ) . '</dt><dd>' . esc_html( $it[0] ) . '</dd></div>';
	}
	echo '</dl>';
}

/** 09 · Phụng sự cộng đồng: chương trình thật, ảnh thật. */
function hv2_render_csr() {
	$cards = array(
		array( 'csr_1', 'csr-trung-chuyen.webp' ),
		array( 'csr_2', 'csr-benh-nhan.webp' ),
		array( 'csr_3', 'csr-hoc-sinh.webp' ),
		array( 'csr_4', 'csr-moc-chau.webp' ),
	);
	echo '<ul class="hv2-csr">';
	foreach ( $cards as $c ) {
		echo '<li><figure>' . hv2_img_tag( $c[1], hv2_t( $c[0] . '_t' ) ) . '<figcaption><h3>' . esc_html( hv2_t( $c[0] . '_t' ) ) . '</h3></figcaption></figure></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</ul><blockquote class="hv2-quote"><p>' . esc_html( hv2_t( 'csr_quote' ) ) . '</p></blockquote>';
}

/** 10 · 6 điểm đến có ảnh đúng địa danh; liên kết tới bài diem_den cùng slug (bỏ ô nếu chưa có ảnh). */
function hv2_render_destinations() {
	$list = array(
		'vung-tau'    => array( 'Vũng Tàu', 'Vung Tau' ),
		'dien-bien'   => array( 'Điện Biên', 'Dien Bien' ),
		'moc-chau'    => array( 'Mộc Châu', 'Moc Chau' ),
		'son-la'      => array( 'Sơn La', 'Son La' ),
		'ha-noi'      => array( 'Hà Nội', 'Hanoi' ),
		'ho-chi-minh' => array( 'Sài Gòn', 'Saigon' ),
	);
	$en  = 'en' === hv_lang();
	$out = '';
	foreach ( $list as $slug => $names ) {
		$file = 'dest-' . ( 'ho-chi-minh' === $slug ? 'sai-gon' : $slug ) . '.webp';
		if ( ! file_exists( HV_WEB_DIR . '/assets/img/v2/' . $file ) ) {
			continue;
		}
		$post = get_page_by_path( $slug, OBJECT, 'diem_den' );
		if ( $post && function_exists( 'pll_get_post' ) ) { // cùng slug ở hai ngôn ngữ: lấy bản của ngôn ngữ đang xem.
			$tr   = pll_get_post( $post->ID, hv_lang() );
			$post = $tr ? get_post( $tr ) : $post;
		}
		$href = $post ? get_permalink( $post ) : home_url( hv_lang_prefix() . '/diem-den/' . $slug );
		$name = $names[ $en ? 1 : 0 ];
		$out .= '<li><a class="hv2-dest" href="' . esc_url( $href ) . '">' . hv2_img_tag( $file, $name ) . '<span class="hv2-dest-name">' . esc_html( $name ) . '</span><span class="hv2-dest-go" aria-hidden="true">↗</span></a></li>';
	}
	return '' !== $out ? '<ul class="hv2-dests">' . $out . '</ul>' : '';
}

/** 11 · Ứng dụng: chữ + mã QR + 2 nút cửa hàng (dữ liệu Layout). Dùng chung: trang chủ (số 11) và chân mọi trang khác (footer.php). */
function hv2_render_app( $no = '11' ) {
	$p = hv_layout_payload();
	if ( empty( $p['apps'] ) || empty( $p['badges'] ) ) {
		return;
	}
	echo '<section class="hv2-sec hv2-sec--yellow" id="hv-app" aria-labelledby="hv2-app"><div class="hv2-wrap hv2-app"><div>';
	hv2_head( $no, 'hv2-app', hv2_t( 'app_eyebrow' ), hv2_t( 'app_h2_a' ), hv2_t( 'app_h2_b' ) );
	echo '<p class="hv2-lead">' . esc_html( hv2_t( 'app_lead' ) ) . '</p><ul class="hv2-badges">';
	echo '<li><a href="' . esc_url( $p['apps']['ios'] ) . '" target="_blank" rel="noopener">' . hv_logo_img( $p['badges']['appstore'], hv_t( 'app_store' ), 140, 44 ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<li><a href="' . esc_url( $p['apps']['android'] ) . '" target="_blank" rel="noopener">' . hv_logo_img( $p['badges']['playstore'], hv_t( 'play_store' ), 140, 44 ) . '</a></li></ul></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	if ( ! empty( $p['qr'] ) ) {
		echo '<figure class="hv2-qr">' . hv_logo_img( $p['qr'], hv_t( 'qr_alt' ), 160, 160 ) . '<figcaption>' . esc_html( hv2_t( 'app_scan' ) ) . '</figcaption></figure>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</div></section>';
}

/** 12 · 3 tin mới nhất. */
function hv2_render_news() {
	$q   = new WP_Query(
		array(
			'post_type'      => 'tin_tuc',
			'post_status'    => 'publish',
			'posts_per_page' => 3,
			'orderby'        => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'no_found_rows'  => true,
		)
	);
	$out = '';
	$n   = 0;
	while ( $q->have_posts() ) {
		$q->the_post();
		++$n;
		$out .= '<li><a class="hv2-news" href="' . esc_url( get_permalink() ) . '"><span class="hv2-news-k">' . esc_html( sprintf( '%02d', $n ) ) . ' · ' . esc_html( get_the_date( 'd/m/Y' ) ) . '</span><h3>' . esc_html( hv2_clean_title( get_the_title() ) ) . '</h3><span class="hv2-more">' . esc_html( hv2_t( 'nw_more' ) ) . '<span aria-hidden="true">↗</span></span></a></li>';
	}
	wp_reset_postdata();
	return '' !== $out ? '<ul class="hv2-newslist">' . $out . '</ul>' : '';
}
