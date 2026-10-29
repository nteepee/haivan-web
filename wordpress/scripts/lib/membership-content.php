<?php
/**
 * Nội dung sạch của trang "Chương trình khách hàng thân thiết" (vi/en) cho scripts/seed-v4.php.
 * Thay bản nhập từ web cũ (câu lặp, mảnh tab, ảnh lặp, "hoặc hoặc", số "150,000"): tiêu đề h2, một ảnh, bảng có th/scope,
 * ảnh có/không có alt ("Có"/"Không"), nút "Tham gia ngay" thật tới /tai-khoan/khach-hang-than-thiet (Next lo đăng nhập + lời mời).
 * Ảnh dùng đường dẫn tương đối (không host).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

/** @return array<string,mixed> Chuỗi theo ngôn ngữ ('vi'|'en'). */
function hvs_membership_strings( $lang ) {
	if ( 'en' === $lang ) {
		return array(
			'prefix'   => '/en',
			'img_alt'  => 'Tôi yêu Hải Vân loyalty card',
			'join'     => 'Join now',
			'what_h'   => 'What is “Tôi yêu Hải Vân” (I Love Hai Van)?',
			'what_p'   => '“Tôi yêu Hải Vân” is the Hai Van loyalty program that thanks and honours loyal customers who have travelled with Hai Van for years.<br>By joining, you receive many benefits and help Hai Van build a better coach-travel culture in Vietnam.',
			'rank_h'   => 'How are “Tôi yêu Hải Vân” card tiers decided?',
			'rank_cap' => 'Card tiers, ranking criteria and ranking period',
			'tiers'    => array( 'Member', 'Silver', 'Gold', 'Diamond' ),
			'tier_row' => 'Card tier',
			'crit_row' => 'Ranking criteria',
			'crit'     => array(
				'Registered for the “Tôi yêu Hải Vân” program',
				'At least 1 successful trip in a ranking period',
				'At least 30 successful trips or 150,000 points or more in a ranking period.',
				'At least 50 successful trips or 250,000 points or more in a ranking period.',
			),
			'time_row' => 'Ranking period',
			'time'     => array( 'No expiry', '12 consecutive months', '12 consecutive months', '12 consecutive months' ),
			'perk_h'   => 'What privileges does “Tôi yêu Hải Vân” give you?',
			'perks'    => array(
				'Own a Hai Van loyalty card.',
				'Earn reward points and move up a tier with every trip.',
				'Redeem reward points for free tickets.',
				'Enjoy attractive offers and promotions from Hai Van and its partners.',
				'Be honoured and receive gifts on special occasions.',
			),
			'perk_cap' => 'Benefits by card tier',
			'benefit'  => 'Benefit',
			'rows'     => array(
				array( 'Free ticket redemption', 1, 1, 1, 1 ),
				array( 'Join promotions reserved for members.', 1, 1, 1, 1 ),
				array( 'Free lounge access.', 0, 1, 1, 1 ),
				array( 'Priority early booking for holidays and Tet.', 0, 0, 1, 1 ),
				array( 'Membership card delivered to your home. (Coming soon)', 0, 0, 1, 1 ),
				array( 'Bonus points on your birthday.', 0, 0, 1, 1 ),
				array( 'Discount on whole-trip vehicle hire.', 0, 0, 1, 1 ),
				array( 'Priority for the best seats on every booking channel.', 0, 0, 0, 1 ),
			),
			'yes'      => 'Yes',
			'no'       => 'No',
			'keep'     => 'To keep the tier you reached in the following year, you need enough points or successful trips for your tier within the 12 consecutive months of the ranking period. If you do not meet the requirements, your card moves down to a lower tier for the next ranking period.',
			'ready'    => 'Are you ready to become a loyal Hai Van customer?',
		);
	}
	return array(
		'prefix'   => '',
		'img_alt'  => 'Thẻ khách hàng thân thiết Tôi yêu Hải Vân',
		'join'     => 'Tham gia ngay',
		'what_h'   => '“Tôi yêu Hải Vân” là gì?',
		'what_p'   => '“Tôi yêu Hải Vân” là Chương trình khách hàng thân thiết nhằm tri ân và vinh danh những khách hàng trung thành đã gắn bó lâu dài với Hải Vân.<br>Tham gia chương trình “Tôi yêu Hải Vân”, khách hàng không chỉ nhận được nhiều lợi ích mà còn góp phần cùng Hải Vân xây dựng nét đẹp văn hóa xe khách tại Việt Nam.',
		'rank_h'   => 'Các tiêu chí xét hạng thẻ “Tôi yêu Hải Vân” là gì?',
		'rank_cap' => 'Hạng thẻ, tiêu chí và thời gian xét hạng',
		'tiers'    => array( 'Thành viên', 'Bạc', 'Vàng', 'Kim cương' ),
		'tier_row' => 'Hạng thẻ',
		'crit_row' => 'Tiêu chí xét hạng',
		'crit'     => array(
			'Đã đăng ký tham gia chương trình “Tôi yêu Hải Vân”',
			'Khách hàng có ít nhất 1 vé đi thành công trong một kỳ xét hạng',
			'Khách hàng có ít nhất 30 vé đi thành công hoặc tích lũy 150.000 điểm trở lên trong một kỳ xét hạng.',
			'Khách hàng có ít nhất 50 vé đi thành công hoặc tích lũy 250.000 điểm trở lên trong một kỳ xét hạng.',
		),
		'time_row' => 'Thời gian xét hạng',
		'time'     => array( 'Không thời hạn', '12 tháng liên tiếp', '12 tháng liên tiếp', '12 tháng liên tiếp' ),
		'perk_h'   => '“Tôi yêu Hải Vân” mang đến cho khách hàng những đặc quyền gì?',
		'perks'    => array(
			'Sở hữu thẻ khách hàng thân thiết của Hải Vân.',
			'Được tích điểm thưởng, nâng hạng qua mỗi chuyến đi.',
			'Được quy đổi điểm thưởng sang vé miễn phí.',
			'Được hưởng ưu đãi, khuyến mãi hấp dẫn từ Hải Vân và các đối tác.',
			'Được vinh danh và nhận quà vào những dịp đặc biệt.',
		),
		'perk_cap' => 'Quyền lợi theo hạng thẻ',
		'benefit'  => 'Quyền lợi',
		'rows'     => array(
			array( 'Đổi vé miễn phí', 1, 1, 1, 1 ),
			array( 'Tham gia vào các chương trình ưu đãi chỉ dành cho hội viên.', 1, 1, 1, 1 ),
			array( 'Sử dụng phòng chờ miễn phí.', 0, 1, 1, 1 ),
			array( 'Ưu tiên đặt vé sớm vào các dịp lễ tết.', 0, 0, 1, 1 ),
			array( 'Thẻ thành viên được gửi tới tận nhà. (Sắp ra mắt)', 0, 0, 1, 1 ),
			array( 'Tặng điểm nhân dịp sinh nhật.', 0, 0, 1, 1 ),
			array( 'Giảm giá dịch vụ cho thuê xe nguyên chuyến', 0, 0, 1, 1 ),
			array( 'Ưu tiên chọn chỗ ngồi tốt nhất trên tất cả các kênh đặt vé', 0, 0, 0, 1 ),
		),
		'yes'      => 'Có',
		'no'       => 'Không',
		'keep'     => 'Để duy trì danh hiệu Hội viên đạt được trong năm tiếp theo, hội viên cần tích lũy được đủ số điểm hoặc số vé thành công tương ứng với từng hạng thẻ trong 12 tháng liên tiếp của kỳ xét hạng. Nếu Hội viên không đáp ứng được các yêu cầu duy trì hạng thẻ, thẻ hội viên sẽ bị xuống hạng thấp hơn cho kỳ xét hạng tiếp theo.',
		'ready'    => 'Bạn đã sẵn sàng để trở thành khách hàng thân thiết của Hải Vân chưa?',
	);
}

/**
 * @param string $lang 'vi'|'en'.
 * @return string HTML (đã escape).
 */
function hvs_membership_html( $lang ) {
	$s    = hvs_membership_strings( $lang );
	$up   = '/wp-content/uploads/2026/10/';
	$icon = array( 'icon_member-1.png', 'icon_silver-1.png', 'icon_gold-1.png', 'icon_diamond-1.png' );
	$join = '<div class="hv-actions"><a class="hv-btn hv-btn--lg" href="' . esc_url( $s['prefix'] . '/tai-khoan/khach-hang-than-thiet' ) . '">' . esc_html( $s['join'] ) . '</a></div>';
	$ok   = static fn( $v ) => '<td><img src="' . esc_url( $up . ( $v ? 'icon_check-1.png' : 'icon_cancel-1.png' ) ) . '" alt="' . esc_attr( $v ? $s['yes'] : $s['no'] ) . '" width="32" height="32"></td>';

	$h  = '<div class="hv-photo-strip hv-photo-strip--1"><figure class="hv-photo"><img src="/assets/images/member_card.png" width="563" height="353" alt="' . esc_attr( $s['img_alt'] ) . '" loading="lazy" decoding="async"></figure></div>';
	$h .= $join;
	$h .= '<h2>' . esc_html( $s['what_h'] ) . '</h2><p>' . wp_kses( $s['what_p'], array( 'br' => array() ) ) . '</p>';

	$h .= '<h2>' . esc_html( $s['rank_h'] ) . '</h2><table><caption class="hv-sr">' . esc_html( $s['rank_cap'] ) . '</caption><thead><tr><th scope="col">' . esc_html( $s['tier_row'] ) . '</th>';
	foreach ( $s['tiers'] as $i => $t ) {
		$h .= '<th scope="col">' . esc_html( $t ) . '<img src="' . esc_url( $up . $icon[ $i ] ) . '" alt="" width="32" height="32"></th>';
	}
	$h .= '</tr></thead><tbody><tr><th scope="row">' . esc_html( $s['crit_row'] ) . '</th>';
	foreach ( $s['crit'] as $c ) {
		$h .= '<td>' . esc_html( $c ) . '</td>';
	}
	$h .= '</tr><tr><th scope="row">' . esc_html( $s['time_row'] ) . '</th>';
	foreach ( $s['time'] as $c ) {
		$h .= '<td>' . esc_html( $c ) . '</td>';
	}
	$h .= '</tr></tbody></table>';

	$h .= '<h2>' . esc_html( $s['perk_h'] ) . '</h2><ul>';
	foreach ( $s['perks'] as $p ) {
		$h .= '<li>' . esc_html( $p ) . '</li>';
	}
	$h .= '</ul><table><caption class="hv-sr">' . esc_html( $s['perk_cap'] ) . '</caption><thead><tr><th scope="col">' . esc_html( $s['benefit'] ) . '</th>';
	foreach ( $s['tiers'] as $i => $t ) {
		$h .= '<th scope="col">' . esc_html( $t ) . '<img src="' . esc_url( $up . $icon[ $i ] ) . '" alt="" width="32" height="32"></th>';
	}
	$h .= '</tr></thead><tbody>';
	foreach ( $s['rows'] as $r ) {
		$h .= '<tr><th scope="row">' . esc_html( $r[0] ) . '</th>' . $ok( $r[1] ) . $ok( $r[2] ) . $ok( $r[3] ) . $ok( $r[4] ) . '</tr>';
	}
	$h .= '</tbody></table>';

	$h .= '<p>' . esc_html( $s['keep'] ) . '</p>';
	$h .= '<h2>' . esc_html( $s['ready'] ) . '</h2>' . $join;
	return $h;
}
