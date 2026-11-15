<?php
/**
 * Nội dung v3 cho 4 trang tuyến Vũng Tàu (quan-1/vung-tau, vung-tau/quan-1-san-bay, tan-son-nhat/vung-tau, vung-tau/tan-son-nhat).
 * Nguồn: 4 brief SEO "Hải Vân LP 12.11.2026 · 01–04" (title/meta đề xuất + comment đã chốt), quyết định chủ sản phẩm
 * trong plans/261115-1844-route-seo-v3-and-micro-ui/plan.md, và nội dung đang có trên staging (địa chỉ, trạm, phòng chờ, đánh giá).
 * Không thêm dữ kiện ngoài các nguồn trên; chỗ chưa có dữ kiện viết trung tính ("xác nhận khi đặt vé").
 * Khoá = hv_route_path; mỗi hướng khai báo đủ mọi trường của meta box (theme inc/route-meta.php), trường không có = rỗng.
 * Ô nhiều dòng dùng dấu "|" giữa các ô, nên không dùng "|" trong câu chữ.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

$map = static fn( $q ) => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $q );
$ln  = static fn( array $l ) => implode( "\n", $l );
$ul  = static fn( array $li ) => '<ul>' . implode( '', array_map( static fn( $x ) => '<li>' . $x . '</li>', $li ) ) . '</ul>';

/* ---------- Chính sách chung (quyết định chủ sản phẩm 4, 5) ---------- */
$policy_text  = 'mục Chính sách hủy vé và Chính sách hoàn tiền trong Quy chế HAIVAN.COM (haivan.com/chinh-sach/quy-che)';
$loyalty_text = 'haivan.com/chung-toi/chuong-trinh-khach-hang-than-thiet';
$policy_html  = '<h2>Đổi, hủy vé và tích điểm</h2><p>Điều kiện đổi, hủy và hoàn tiền tùy từng loại vé và chương trình đang áp dụng; kiểm tra điều kiện của vé trước khi thanh toán và xem chi tiết tại <a href="/chinh-sach/quy-che">Quy chế HAIVAN.COM</a> (mục Chính sách hủy vé, Chính sách hoàn tiền). Trẻ từ 6 tuổi trở lên hoặc nặng trên 25 kg cần mua ghế riêng.</p>'
	. '<p>Thành viên chương trình "Tôi yêu Hải Vân" được tích điểm 10% giá trị vé khi đặt qua kênh của Hải Vân. <a href="/tai-khoan/khach-hang-than-thiet">Đăng ký tham gia</a> trước khi đặt vé, xem quyền lợi tại <a href="/chung-toi/chuong-trinh-khach-hang-than-thiet">trang chương trình khách hàng thân thiết</a>.</p>';
$schedule_tail = ' Cần đổi giờ hay hủy vé, chuẩn bị mã vé và gọi 1900 6763 trước giờ xe chạy; điều kiện đổi, hủy xem tại <a href="/chinh-sach/quy-che">Quy chế HAIVAN.COM</a>.</p>';

$faq_change = 'Tôi cần đổi giờ hoặc hủy vé thì làm thế nào? | Kiểm tra thời hạn, phí và điều kiện đổi hoặc hủy áp dụng cho vé của bạn, vì mỗi loại vé và chương trình có thể khác nhau. Nếu cần hỗ trợ, gọi 1900 6763 trước giờ xe chạy và cung cấp mã vé, giờ khởi hành để Hải Vân kiểm tra yêu cầu. Chi tiết xem ' . $policy_text . '.';
$faq_child  = 'Đi cùng trẻ nhỏ thì mua vé thế nào? | Trẻ từ 6 tuổi trở lên hoặc nặng trên 25 kg cần mua ghế riêng. Với bé nhỏ hơn, hãy báo tuổi của bé và nhu cầu ngồi riêng khi đặt vé để Hải Vân xác nhận cách bố trí chỗ cùng giá vé áp dụng.';
$faq_points = 'Đặt vé có được tích điểm không? | Có, nếu bạn đã đăng ký chương trình khách hàng thân thiết "Tôi yêu Hải Vân" và đặt vé qua kênh của Hải Vân: được tích điểm 10% giá trị vé theo thể lệ chương trình. Chưa đăng ký hoặc đặt qua kênh khác thì vé không được tích điểm. Đăng ký tại ' . $loyalty_text . ' (nút Tham gia ngay).';
$faq_seats  = 'Xe có bán ghế phụ hay cho nằm sàn không? | Không. Mỗi khách có một ghế được đánh số trên sơ đồ; xe không bán ghế phụ và không bố trí khách nằm sàn.';
$faq_diff   = 'Vì sao giá và hạng xe khác nhau giữa các chuyến? | Các chuyến có thể sử dụng hạng xe và cách bố trí ghế khác nhau. Hãy đối chiếu tiện nghi, vị trí ghế và giá vé của chuyến bạn chọn trước khi thanh toán.';
$faq_classes = static fn( $dir ) => 'Xe limousine ' . $dir . ' có những hạng nào? | Ba hạng limousine: Royal rộng rãi, riêng tư nhất với ghế không trọng lực và khoang rộng; Luxury 11 chỗ có ghế tích hợp massage; Economy là lựa chọn tiết kiệm mà vẫn có ghế massage. Xem ảnh, sơ đồ ghế và tiện nghi của chuyến trước khi chọn.';
$faq_price   = static fn( $dir ) => 'Vé xe Hải Vân ' . $dir . ' giá bao nhiêu? | Giá vé có thể khác nhau theo hạng xe, vị trí ghế và chuyến đi. Chọn ngày đi, chuyến và ghế để xem giá cụ thể, rồi kiểm tra tổng tiền trước khi thanh toán.';

/* ---------- Hạng xe limousine (không ghi số chỗ khi brief chưa xác nhận; Luxury 11 chỗ có trong brief) ---------- */
$vt_classes = static fn( $royal_transfer ) => $ln( array(
	'Royal | | | Hạng rộng rãi và riêng tư nhất: ghế không trọng lực, khoang rộng để nghỉ trọn chặng.' . ( $royal_transfer ? ' Có trung chuyển đi kèm, trừ cuối tuần, lễ và Tết.' : '' ) . ' | Cổng sạc USB; Điều hòa; Khăn lạnh',
	'Luxury | 11 | | Limousine 11 chỗ, ghế da tích hợp massage, sạc không dây, wifi, nước suối và khăn lạnh: êm ái mà giá vừa phải. | Ghế massage; Cổng sạc USB; Điều hòa; Wifi; Nước khoáng; Khăn lạnh',
	'Economy | | | Lựa chọn tiết kiệm mà vẫn có ghế massage, wifi, nước suối và khăn lạnh. | Ghế massage; Cổng sạc USB; Điều hòa; Wifi; Khăn lạnh',
) );

/* ---------- Phòng chờ, quầy vé (nguyên dữ kiện staging) ---------- */
$off_q1   = static fn( $hours, $note ) => '34 Nguyễn Thái Bình | Phường Bến Thành, Quận 1, TP. Hồ Chí Minh | ' . $hours . ' | ' . $note . ' | ' . $map( '34 Nguyễn Thái Bình, Bến Thành, Quận 1, Hồ Chí Minh' ) . ' | Quận 1 · Phòng chờ chính | lounge-q1.webp';
$off_nvt  = static fn( $hours ) => '307 Nguyễn Văn Trỗi | Quận Tân Bình, TP. Hồ Chí Minh | ' . $hours . ' | Gần sân bay Tân Sơn Nhất, tiện cho khách nối chuyến bay. | ' . $map( '307 Nguyễn Văn Trỗi, Tân Bình, Hồ Chí Minh' ) . ' | Tân Bình · Phòng chờ | lounge-nvt-front.webp';
$off_dbp  = static fn( $hours, $note ) => '607 Điện Biên Phủ | Quận Bình Thạnh, TP. Hồ Chí Minh | ' . $hours . ' | ' . $note . ' | ' . $map( '607 Điện Biên Phủ, Bình Thạnh, Hồ Chí Minh' ) . ' | Bình Thạnh · Phòng chờ | ';
$off_tsn  = static fn( $hours, $note ) => 'Quầy sân bay Tân Sơn Nhất | Ga T1 cột B5 · Ga T2 cột GF12 · Ga T3 giữa cột A17 – A18 | ' . $hours . ' | ' . $note . ' | ' . $map( 'Sân bay Tân Sơn Nhất' ) . ' | Tân Sơn Nhất · 3 quầy vé | airport-counters.webp';
$off_vt   = '156B Lê Hồng Phong | TP. Vũng Tàu | Phòng chờ 7:00 – 21:00, xe chạy 2:00 – 21:45 | Đón gần nơi lưu trú trong khu vực phục vụ; khách Bà Rịa lên xe tại 54 Lê Thành Duy. | ' . $map( '156B Lê Hồng Phong, Vũng Tàu' ) . ' | Vũng Tàu · Văn phòng chính | gh-office-vt.webp';

/* ---------- Danh bạ trạm (nguyên dữ kiện staging) ---------- */
$st_hcm = array(
	'Hồ Chí Minh | 34 Nguyễn Thái Bình | Phường Bến Thành, Quận 1',
	'Hồ Chí Minh | 159 Điện Biên Phủ | Phường Tân Định, Quận 1',
	'Hồ Chí Minh | Chùa Vĩnh Nghiêm | 339 Nam Kỳ Khởi Nghĩa, Quận 3',
	'Hồ Chí Minh | Cây xăng Huỳnh Văn Bánh | 32 Nguyễn Văn Trỗi, Phú Nhuận',
	'Hồ Chí Minh | 307 Nguyễn Văn Trỗi | Tân Bình',
	'Hồ Chí Minh | Sân bay Tân Sơn Nhất | Nhà ga T1, T2, T3',
	'Hồ Chí Minh | 607 Điện Biên Phủ | Bình Thạnh',
	'Hồ Chí Minh | Vincom Thảo Điền | 161 Võ Nguyên Giáp, Thủ Đức',
	'Hồ Chí Minh | 06 Lương Định Của | An Khánh, Thủ Đức',
	'Hồ Chí Minh | Chung cư Lexington Residence | 67 Mai Chí Thọ, Thủ Đức',
);
$st_tsn = array(
	'Sân bay Tân Sơn Nhất | Quầy Hải Vân nhà ga T1 | Cột B5',
	'Sân bay Tân Sơn Nhất | Quầy Hải Vân nhà ga T2 | Cột GF12',
	'Sân bay Tân Sơn Nhất | Quầy Hải Vân nhà ga T3 | Giữa cột A17 – A18',
);
$st_vt = array(
	'Vũng Tàu | 156B Lê Hồng Phong | Văn phòng, phòng chờ Vũng Tàu',
	'Vũng Tàu | Nhà hàng Gành Hào 2 | 09 Hạ Long, bãi Sau',
	'Vũng Tàu | Cây xăng Hoàng Hoa Thám | 2 Hoàng Hoa Thám',
	'Vũng Tàu | Ngã tư Giếng Nước | 33A đường 30 Tháng 4',
	'Vũng Tàu | Lotte Mart Vũng Tàu | Góc 3 Tháng 2 và Thi Sách',
	'Vũng Tàu | Bùng binh Paradise | Đường 3 Tháng 2 giao Nguyễn An Ninh',
	'Vũng Tàu | 54 Nguyễn Hữu Cảnh | Phường Rạch Dừa',
	'Vũng Tàu | 1A Lưu Chí Hiếu | Phường Rạch Dừa',
	'Vũng Tàu | Chung cư Seaview 1 | 46 Nguyễn Công Phương',
	'Vũng Tàu | Cổng Khang Linh | Khu nhà ở Khang Linh, Phước Thắng',
	'Vũng Tàu | KCN Đông Xuyên | Đường 30 Tháng 4, Rạch Dừa',
	'Vũng Tàu | Ẹo Ông Từ | Phước Thắng',
);
$st_br = array(
	'Bà Rịa & Long Thành | 54 Lê Thành Duy | Phường Phước Trung, Bà Rịa',
	'Bà Rịa & Long Thành | Ngã ba Bà Rịa | Co.opmart Bà Rịa, Nguyễn Hữu Thọ',
	'Bà Rịa & Long Thành | Ngã tư Long Sơn | Quốc lộ 51, Tân Thành',
	'Bà Rịa & Long Thành | Trạm dừng Long Thành | Chân cầu Thái Thiện, Phước Thái, Đồng Nai',
);

/* ---------- Đánh giá, số liệu (nguyên dữ kiện staging) ---------- */
$rating   = '4,6 | 87 | ' . $map( 'Phòng chờ xe Hải Vân Limousine Hồ Chí Minh - Vũng Tàu' );
$rv_lobby = 'Phòng chờ sạch sẽ mát mẻ, có trà nước và bánh, nhân viên thân thiện dễ mến. Dịch vụ xe chạy đúng giờ an toàn, lái xe thân thiện vui vẻ. | Khách đánh giá trên Google';
$rv_car   = 'Chất lượng xe tốt, tài xế rất chuyên nghiệp, nhân viên hỗ trợ nhiệt tình và thân thiện. Đặc biệt phòng chờ nhà xe rất tuyệt. | Khách đánh giá trên Google';
$rv_en    = 'Glad that they opened a new office in the centre of Ho Chi Minh! Clean lobby, free snacks, friendly and supportive English-speaking staff. | Khách đánh giá trên Google';
$rv_q1    = 'Nhà chờ xe Hải Vân tiện nghi sạch sẽ nhân viên lịch sử có nước uống cho khách đợi, nằm ngay trung tâm quận 1, rất thuận tiện cho việc đi lại mà ko di chuyển ra bến xe. | Khách đánh giá trên Google';
$rv_ride  = 'Nhà xe rất oke lun nha, rất đúng giờ, tài xế lịch sự, chạy xe cũng rất an toàn luôn, xe sạch không có mùi hôi, ghế ngồi êm ái có massage. | Khách đánh giá trên Google';
$stats    = "30+ | năm vận tải\n120+ | lượt xe mỗi ngày\n40+ | xe limousine\n26 | điểm đón trả";

$reason_seats = static fn( $extra ) => 'Ghế đánh số, ngồi cạnh người thân | Mỗi khách có một ghế đánh số. Khi đặt cho gia đình, bạn có thể chọn các ghế liền nhau còn trống trên cùng chuyến.' . $extra . ' | hd-limo-seats.webp';
$reason_ticket = 'Vé điện tử trên điện thoại | Vé điện tử ghi rõ chuyến và ghế đã chọn. Nếu cần đổi giờ, hãy chuẩn bị mã vé và liên hệ Hải Vân trước khi xe khởi hành để kiểm tra điều kiện đổi. | staff-guests.webp';
$reason_classes = 'Ba hạng limousine | Royal có ghế không trọng lực và khoang rộng. Luxury 11 chỗ có ghế tích hợp massage. Economy là lựa chọn tiết kiệm và cũng có ghế massage. | hd-limo-cabin.webp';

return array(
	/* ---------- 01 · Sài Gòn đi Vũng Tàu ---------- */
	'quan-1/vung-tau' => array(
		'seo_title'        => 'Xe limousine Sài Gòn đi Vũng Tàu, đón Quận 1 | Hải Vân',
		'meta_description' => 'Đi Vũng Tàu bằng limousine Hải Vân, đón tại 34 Nguyễn Thái Bình, Quận 1. Hỗ trợ trả gần khách sạn trong khu vực phục vụ; chọn ghế và đặt vé online.',
		'h1'               => 'Đặt vé xe Sài Gòn đi Vũng Tàu',
		'intro'            => 'Limousine Hải Vân chạy Sài Gòn – Vũng Tàu từ 5 giờ sáng đến nửa đêm, trung bình 15 đến 30 phút một chuyến. Lên xe ở Quận 1, xuống gần khách sạn ở Vũng Tàu trong khu vực phục vụ.',
		'facts'            => "≈ 2 giờ 40 | Thời gian\n15–30 phút | Một chuyến\n5h – 0h | Giờ chạy",
		'schedule_text'    => '<p>Danh sách dưới là các chuyến còn chỗ theo ngày bạn chọn, cập nhật trực tiếp từ hệ thống đặt vé. Giá đã gồm VAT và đổi theo hạng xe, vị trí ghế.' . $schedule_tail,
		'reasons_head'     => 'Vì sao chọn Hải Vân | Đi Vũng Tàu | theo cách chu đáo hơn. | Hơn 30 năm đưa đón, mỗi chuyến đều do tài xế quen tuyến cầm lái, trên những chiếc xe được giữ chuẩn chất lượng.',
		'reasons'          => $ln( array(
			'Nhiều giờ khởi hành từ Sài Gòn | Xe chạy từ 5h sáng đến 0h đêm. Bạn có thể chọn chuyến sáng để đến Vũng Tàu trong ngày hoặc chuyến tối sau giờ làm. Xem giờ xe qua đúng điểm đón khi đặt vé. | fleet-convoy-street.webp',
			'Đón trả theo địa chỉ của bạn | Lên xe ở phòng chờ hoặc trạm trên tuyến. Khi đặt vé, hãy cho Hải Vân biết địa chỉ để xác nhận điểm đón hoặc trả. Hạng Royal có dịch vụ trung chuyển, trừ cuối tuần, lễ và Tết. | hd-van-seaside.webp',
			'Đi từ sân bay Tân Sơn Nhất | Nếu vừa hạ cánh, hãy chọn tuyến Tân Sơn Nhất đi Vũng Tàu và đến quầy Hải Vân tại nhà ga của bạn (T1, T2 hoặc T3). | airport-van.webp',
			$reason_classes,
			$reason_seats( '' ),
			$reason_ticket,
		) ),
		'content_html'     => '<p>Thời gian đi dự kiến khoảng 2 giờ 30 đến 3 giờ, tùy giao thông và điểm đón. Nếu đi vào cuối tuần, lễ hoặc Tết, nên kiểm tra và đặt chuyến sớm để có thêm lựa chọn giờ đi, vị trí ghế.</p>' . $ul( array(
			'Có mặt tại điểm đón ghi trên vé trước giờ khởi hành; Quy chế HAIVAN.COM khuyến nghị ra trước 30 phút, dịp lễ, Tết trước 60 phút. Phòng chờ có nước uống và chỗ để hành lý.',
			'Xuống Bà Rịa: chọn điểm trả 54 Lê Thành Duy, phường Phước Trung khi đặt vé thay vì đi tiếp vào trung tâm Vũng Tàu.',
			'Nếu đến bằng máy bay, hãy tính thêm thời gian nhận hành lý và đi từ sảnh đến ra điểm hẹn. Khi chuyến bay trễ, liên hệ tổng đài 1900 6763 trước giờ đón để được hỗ trợ đổi chuyến.',
			'Đi nhóm hoặc gia đình: chọn nhiều ghế trên cùng một sơ đồ, kiểm tra vị trí trước khi thanh toán nếu muốn ngồi gần nhau.',
		) ) . $policy_html . '<p>Đọc thêm <a href="/diem-den/vung-tau">kinh nghiệm du lịch Vũng Tàu</a> trước chuyến đi.</p>',
		'faq'              => $ln( array(
			$faq_price( 'Sài Gòn đi Vũng Tàu' ),
			'Đi xe Sài Gòn đi Vũng Tàu mất bao lâu? | Dự trù khoảng 2 giờ 30 đến 3 giờ, tùy giao thông, điểm đón và trung chuyển. Xem giờ đến dự kiến của từng chuyến để sắp xếp lịch nhận phòng.',
			'Xe Sài Gòn đi Vũng Tàu chuyến sớm nhất và chuyến cuối mấy giờ? | Xe từ Sài Gòn đi Vũng Tàu chạy từ 5h sáng đến 0h đêm, trung bình 15–30 phút một chuyến. Kiểm tra lịch của ngày đi để chọn giờ khởi hành phù hợp.',
			'Xe Quận 1 đi Vũng Tàu đón khách ở đâu? | Phòng chờ chính ở 34 Nguyễn Thái Bình, phường Bến Thành, gần chợ Bến Thành; điểm đón phụ 159 Điện Biên Phủ. Đối chiếu địa chỉ và giờ có mặt ghi trên vé.',
			'Xe sân bay Tân Sơn Nhất đi Vũng Tàu đón ở đâu? | Chọn tuyến Tân Sơn Nhất đi Vũng Tàu khi đặt vé. Quầy Hải Vân nằm ở cột B5 nhà ga T1, cột GF12 nhà ga T2 và giữa cột A17, A18 nhà ga T3; xe vào đón tận quầy.',
			'Có trả khách gần khách sạn hoặc resort ở Vũng Tàu không? | Có, trong khu vực phục vụ. Ghi địa chỉ lưu trú khi đặt vé để Hải Vân xác nhận điểm trả và điều kiện trung chuyển.',
			'Ở các quận khác có xe trung chuyển đón không? | Khi đặt vé, hãy cung cấp địa chỉ đón để Hải Vân xác nhận có phục vụ khu vực đó vào ngày đi hay không. Hạng Royal có trung chuyển, trừ cuối tuần, lễ và Tết.',
			'Có xe Sài Gòn đi Bà Rịa không? | Có. Tuyến đi Vũng Tàu dừng ở Bà Rịa: 54 Lê Thành Duy, phường Phước Trung và ngã ba Bà Rịa. Chọn đúng điểm trả này khi đặt vé.',
			$faq_classes( 'Sài Gòn đi Vũng Tàu' ),
			'Có thể đặt nhiều ghế cho nhóm đi Vũng Tàu không? | Có thể chọn nhiều ghế còn trống trên sơ đồ của cùng một chuyến. Muốn ngồi gần nhau thì kiểm tra vị trí ghế trước khi thanh toán.',
			'Đặt vé Sài Gòn đi Vũng Tàu online như thế nào? | Chọn ngày đi và chuyến, chọn ghế trên sơ đồ, nhập thông tin liên hệ rồi thanh toán; vé điện tử gửi về điện thoại. Chọn ghế chưa có nghĩa vé đã được xác nhận.',
			'Khách nước ngoài đặt vé và thanh toán thế nào? | Chọn chuyến và ghế, điền thông tin liên hệ, xác thực số điện thoại khi được yêu cầu rồi thanh toán bằng phương thức đang hiển thị. Nhân viên phòng chờ Quận 1 hỗ trợ tiếng Anh.',
			$faq_change,
			$faq_seats,
			$faq_diff,
			$faq_child,
			$faq_points,
		) ),
		'pickup_points'    => $ln( array(
			'Phòng chờ 34 Nguyễn Thái Bình | Phường Bến Thành, Quận 1, TP. Hồ Chí Minh | Gần chợ Bến Thành, điểm đón phụ 159 Điện Biên Phủ',
			'Quầy sân bay Tân Sơn Nhất | Nhà ga T1 (cột B5), T2 (cột GF12), T3 (cột A17 – A18) | Xe vào đón tận quầy',
			'307 Nguyễn Văn Trỗi | Quận Tân Bình, TP. Hồ Chí Minh | Gần sân bay, tiện nối chuyến',
			'607 Điện Biên Phủ | Quận Bình Thạnh, TP. Hồ Chí Minh | Hướng ra cao tốc',
		) ),
		'offices'          => $ln( array(
			$off_q1( 'Phòng chờ 7:00 – 21:00, xe chạy 5:00 – 0:00', 'Ngay trung tâm Quận 1, gần chợ Bến Thành; điểm đón phụ 159 Điện Biên Phủ.' ),
			$off_nvt( 'Phòng chờ 7:00 – 21:00, xe chạy 5:00 – 0:00' ),
			$off_dbp( 'Phòng chờ 7:00 – 21:00, xe chạy 5:00 – 0:00', 'Trên trục Điện Biên Phủ hướng ra cao tốc, tiện cho khách phía Đông thành phố.' ),
			$off_tsn( 'Xe chạy 5:00 – 0:00', 'Ra khỏi sảnh đến là thấy quầy Hải Vân; xe vào đón tận quầy.' ),
			$off_vt,
		) ),
		'vehicle_classes'  => $vt_classes( true ),
		'stops_intro'      => 'Ở Quận 1 có điểm hỗ trợ 34 Nguyễn Thái Bình; hãy đối chiếu điểm đón ghi trên vé. Ở Vũng Tàu, ghi địa chỉ lưu trú để được xác nhận điểm trả phù hợp. Không phải chuyến nào cũng qua tất cả các trạm.',
		'stops'            => $ln( array_merge( $st_hcm, $st_vt, $st_br ) ),
		'rating'           => $rating,
		'reviews'          => $ln( array( $rv_lobby, $rv_car, $rv_en ) ),
		'stats'            => $stats,
		'story'            => '',
		'related'          => "Vũng Tàu đi Sài Gòn | vung-tau/quan-1-san-bay\nTân Sơn Nhất đi Vũng Tàu | tan-son-nhat/vung-tau\nVũng Tàu đi Tân Sơn Nhất | vung-tau/tan-son-nhat",
		'reverse'          => 'Vũng Tàu đi Sài Gòn | vung-tau/quan-1-san-bay',
		'round_trip_note'  => 'Đi cả hai chiều: đặt chiều đi trước, rồi tìm chuyến Vũng Tàu về Sài Gòn theo ngày về bạn muốn. Vé khứ hồi được giảm 20.000đ mỗi vé chiều về; hai chiều có thể khác giờ và giá, hãy kiểm tra từng chiều trước khi thanh toán.',
	),

	/* ---------- 02 · Vũng Tàu đi Sài Gòn ---------- */
	'vung-tau/quan-1-san-bay' => array(
		'seo_title'        => 'Xe limousine Vũng Tàu đi Sài Gòn, trả Quận 1 | Hải Vân',
		'meta_description' => 'Limousine Hải Vân từ Vũng Tàu về Quận 1, Sài Gòn, hỗ trợ đón gần khách sạn trong khu vực phục vụ. Chọn hạng Royal, Luxury hoặc Economy và đặt ghế online.',
		'h1'               => 'Đặt vé xe Vũng Tàu đi Sài Gòn',
		'intro'            => 'Từ Vũng Tàu, limousine Hải Vân chạy từ 2 giờ sáng đến 21 giờ 45, trung bình 15 đến 30 phút một chuyến, về Quận 1, Sài Gòn. Chọn ghế và giữ vé điện tử trên điện thoại.',
		'facts'            => "≈ 2 giờ 40 | Thời gian\n15–30 phút | Một chuyến\n2h – 21h45 | Giờ chạy",
		'schedule_text'    => '<p>Bảng dưới liệt kê các chuyến rời Vũng Tàu theo ngày bạn chọn. Giá của chiều về có thể khác chiều đi, hãy xem giá từng chuyến.' . $schedule_tail,
		'reasons_head'     => 'Vì sao chọn Hải Vân | Về Sài Gòn | theo cách chu đáo hơn. | Hơn 30 năm đưa đón, mỗi chuyến đều do tài xế quen tuyến cầm lái, trên những chiếc xe được giữ chuẩn chất lượng.',
		'reasons'          => $ln( array(
			'Chuyến sớm từ 2 giờ sáng | Vũng Tàu có xe từ 2h đến 21h45, trung bình 15–30 phút một chuyến. Nếu cần về Sài Gòn để đi làm, khám bệnh hoặc ra sân bay, hãy chọn chuyến theo giờ đến dự kiến và tính thêm thời gian từ điểm trả đến nơi hẹn. | fleet-convoy-street.webp',
			'Điểm đón phù hợp với nơi lưu trú | Bạn có thể chọn điểm đón tại văn phòng hoặc trạm trên tuyến. Nếu muốn được đón gần khách sạn, resort, hãy cung cấp địa chỉ để xác nhận; khách ở Bà Rịa chọn điểm đón 54 Lê Thành Duy khi đặt vé. | hd-van-seaside.webp',
			'Đi tiếp ra sân bay | Nếu ra sân bay, hãy đặt chuyến Vũng Tàu đi Tân Sơn Nhất và xác nhận nhà ga cần xuống. Kiểm tra giờ xe đến nhà ga và dành thêm thời gian làm thủ tục. | airport-van.webp',
			'Có trung chuyển tới bệnh viện | Nếu cần trung chuyển đến bệnh viện, hãy gọi 1900 6763 và cho biết tên cơ sở, địa chỉ và giờ hẹn để Hải Vân xác nhận điểm trả. | staff-guests.webp',
			'Chọn ghế cho chuyến về Sài Gòn | Royal có ghế không trọng lực, Luxury 11 chỗ có ghế tích hợp massage, còn Economy là lựa chọn tiết kiệm và cũng có ghế massage. | hd-limo-cabin.webp',
			$reason_seats( ' Giá vé đã gồm VAT.' ),
		) ),
		'content_html'     => '<h2>Về Sài Gòn thuận tiện hơn thế nào?</h2>' . $ul( array(
			'Nếu cần về Sài Gòn sớm, hãy đối chiếu giờ đến dự kiến của chuyến với giờ làm, giờ hẹn khám hoặc giờ bay, đồng thời tính thêm thời gian di chuyển từ điểm trả.',
			'Nếu muốn được đón gần nơi lưu trú, hãy xác nhận địa chỉ và giờ hẹn khi đặt vé. Khách ở Bà Rịa chọn điểm đón 54 Lê Thành Duy, phường Phước Trung và kiểm tra giờ đón ghi trên vé.',
			'Nếu cần đến bệnh viện sau khi xuống xe ở Sài Gòn, hãy xác nhận trước khả năng trung chuyển tới đúng cơ sở và dành thêm thời gian cho chặng đi tiếp.',
			'Nếu ra sân bay, hãy đặt chuyến Vũng Tàu đi Tân Sơn Nhất và xác nhận nhà ga cần xuống. Dành thêm thời gian đi từ điểm trả đến quầy làm thủ tục.',
		) ) . '<h2>Trước giờ xe chạy</h2><p>Kiểm tra điểm hẹn và giờ có mặt ghi trên vé, nhất là khi lên xe gần khách sạn hoặc resort. Nếu đi tiếp bằng máy bay, hãy xem giờ đến dự kiến tại đúng nhà ga và dành thêm thời gian dự phòng, làm thủ tục bay.</p>' . $policy_html,
		'faq'              => $ln( array(
			'Xe Vũng Tàu về Sài Gòn chạy từ mấy giờ đến mấy giờ? | Vũng Tàu có xe từ 2h sáng, chuyến cuối xuất bến lúc 21h45, trung bình 15 đến 30 phút một chuyến. Kiểm tra lịch của ngày đi để chọn giờ phù hợp.',
			'Lên xe ở đâu tại Vũng Tàu? | Phòng chờ Hải Vân ở 156B Lê Hồng Phong, Vũng Tàu. Nếu muốn lên xe gần nơi lưu trú, hãy cung cấp địa chỉ khi đặt vé để xác nhận điểm hẹn và giờ đón.',
			'Đi xe Vũng Tàu về Sài Gòn mất bao lâu? | Khoảng 3 giờ, tùy điểm đón, trung chuyển và giao thông. Xem giờ đến dự kiến của chuyến để sắp xếp lịch tiếp theo.',
			'Khách ở Bà Rịa lên xe ở đâu? | Điểm đón ở Bà Rịa là 54 Lê Thành Duy, phường Phước Trung. Chọn đúng điểm này khi đặt vé và kiểm tra giờ đón trên vé.',
			'Xe có đưa khách ra sân bay Tân Sơn Nhất không? | Có chuyến từ Vũng Tàu đi sân bay Tân Sơn Nhất. Khi đặt vé, hãy chọn đúng hành trình sân bay và xác nhận nhà ga cần xuống.',
			'Về Sài Gòn có xe trung chuyển trả khách ở các quận khác không? | Nếu cần trung chuyển từ điểm trả ở Sài Gòn đến địa chỉ khác, hãy cung cấp địa chỉ khi đặt vé để Hải Vân xác nhận khả năng phục vụ và điều kiện áp dụng.',
			$faq_change,
			$faq_seats,
			$faq_price( 'Vũng Tàu đi Sài Gòn' ),
			'Có đón gần khách sạn hoặc resort ở Vũng Tàu không? | Có, trong khu vực phục vụ. Ghi địa chỉ khách sạn hoặc resort khi đặt vé để Hải Vân xác nhận điểm hẹn, giờ đón và điều kiện trung chuyển.',
			'Xe Vũng Tàu đi bệnh viện ở Sài Gòn như Chợ Rẫy, Từ Dũ, Nhi Đồng 2, Ung Bướu thế nào? | Khi đặt vé, hãy cung cấp tên bệnh viện, địa chỉ cơ sở và giờ hẹn khám để Hải Vân xác nhận điểm trả cùng khả năng trung chuyển. Chọn chuyến theo giờ đến dự kiến và dành thêm thời gian di chuyển đến bệnh viện, làm thủ tục khám.',
			'Đi sân bay Tân Sơn Nhất nên chọn chuyến mấy giờ? | Đặt tuyến Vũng Tàu đi Tân Sơn Nhất và chọn chuyến theo giờ xe đến dự kiến tại nhà ga bạn cần xuống, rồi tính thêm thời gian làm thủ tục theo yêu cầu của hãng bay. Nên chừa thời gian dự phòng cho giao thông và không mặc định chuyến xe sớm nhất sẽ phù hợp với mọi chuyến bay.',
			'Chọn Royal, Luxury hay Economy cho chuyến về Sài Gòn? | Royal rộng rãi, riêng tư nhất; Luxury 11 chỗ có ghế massage; Economy là lựa chọn tiết kiệm. So sánh ghế còn trống, tiện nghi và giá của đúng chuyến về bạn muốn đi; hạng xe chiều về không nhất thiết giống chiều đi.',
			'Đặt vé Vũng Tàu đi Sài Gòn online như thế nào? | Chọn ngày đi và chuyến, chọn ghế trên sơ đồ, nhập thông tin liên hệ rồi thanh toán; vé điện tử gửi về điện thoại. Chọn ghế chưa có nghĩa vé đã được xác nhận.',
			'Khách nước ngoài đặt vé và thanh toán thế nào? | Chọn chuyến và ghế, nhập thông tin liên hệ, xác thực số điện thoại nếu được yêu cầu rồi thanh toán bằng phương thức đang hiển thị. Nếu không nhận được mã xác thực, hãy kiểm tra lại số điện thoại đã nhập và đề nghị Hải Vân hỗ trợ nếu vẫn chưa thể tiếp tục.',
			$faq_child,
			$faq_points,
		) ),
		'pickup_points'    => $ln( array(
			'Phòng chờ 156B Lê Hồng Phong | TP. Vũng Tàu | Có thể đón gần nơi lưu trú trong khu vực phục vụ',
			'54 Lê Thành Duy | Phường Phước Trung, Bà Rịa | Điểm đón của khách Bà Rịa',
		) ),
		'offices'          => $ln( array(
			$off_vt,
			$off_q1( 'Phòng chờ 7:00 – 21:00', 'Điểm trả chính ở Quận 1, gần chợ Bến Thành.' ),
			$off_nvt( 'Phòng chờ 7:00 – 21:00' ),
			$off_dbp( 'Phòng chờ 7:00 – 21:00', 'Trên trục Điện Biên Phủ, tiện cho khách phía Đông thành phố.' ),
		) ),
		'vehicle_classes'  => $vt_classes( false ),
		'stops_intro'      => 'Ở Vũng Tàu, xác nhận điểm đón gần nơi lưu trú và giờ có mặt trước khi về Sài Gòn. Danh bạ giúp tra địa chỉ; chỉ đến điểm hẹn ghi trên vé, không phải chuyến nào cũng qua tất cả các trạm.',
		'stops'            => $ln( array_merge( $st_vt, $st_br, $st_hcm ) ),
		'rating'           => $rating,
		'reviews'          => $ln( array( $rv_q1, $rv_lobby, $rv_ride ) ),
		'stats'            => $stats,
		'story'            => '',
		'related'          => "Sài Gòn đi Vũng Tàu | quan-1/vung-tau\nVũng Tàu đi Tân Sơn Nhất | vung-tau/tan-son-nhat\nTân Sơn Nhất đi Vũng Tàu | tan-son-nhat/vung-tau",
		'reverse'          => 'Sài Gòn đi Vũng Tàu | quan-1/vung-tau',
		'round_trip_note'  => 'Đi cả hai chiều: sau khi giữ vé chiều về, tìm thêm chuyến Sài Gòn đi Vũng Tàu cho ngày đi. Mỗi chiều chọn giờ, hạng xe và ghế riêng.',
	),

	/* ---------- 03 · Tân Sơn Nhất đi Vũng Tàu (trang mỏng, dựng đủ bố cục) ---------- */
	'tan-son-nhat/vung-tau' => array(
		'seo_title'        => 'Xe sân bay Tân Sơn Nhất đi Vũng Tàu | Hải Vân',
		'meta_description' => 'Từ sân bay Tân Sơn Nhất đi Vũng Tàu bằng limousine Hải Vân, có quầy vé tại T1, T2, T3. Chọn ghế trước trên website hoặc gọi 1900 6763 để được hỗ trợ.',
		'h1'               => 'Xe sân bay Tân Sơn Nhất đi Vũng Tàu',
		'intro'            => 'Hải Vân có quầy tại các nhà ga T1, T2 và T3 của sân bay Tân Sơn Nhất. Sau khi nhận hành lý, bạn đến quầy ở ga mình vừa hạ cánh để xác nhận điểm lên xe limousine đi Vũng Tàu.',
		'facts'            => "T1 · T2 · T3 | Quầy vé tại sân bay\n5h – 0h | Giờ chạy\n110 km | Quãng đường",
		'schedule_text'    => '<p>Danh sách dưới là các chuyến từ Tân Sơn Nhất đi Vũng Tàu còn chỗ theo ngày bạn chọn, cập nhật trực tiếp từ hệ thống đặt vé. Khi chọn giờ, hãy tính cả thời gian làm thủ tục, nhận hành lý và đi bộ ra quầy. Chưa nhận được xác nhận đặt vé, gọi 1900 6763 để kiểm tra.' . $schedule_tail,
		'reasons_head'     => 'Vì sao chọn Hải Vân | Đi Vũng Tàu | ngay từ sân bay Tân Sơn Nhất. | Hải Vân có quầy tại các nhà ga T1, T2 và T3. Sau khi nhận hành lý, bạn có thể đến quầy ở ga mình vừa hạ cánh để xác nhận điểm lên xe.',
		'reasons'          => $ln( array(
			'Quầy vé ở cả ba nhà ga | Quầy Hải Vân ở cột B5 nhà ga T1, cột GF12 nhà ga T2 và giữa cột A17, A18 nhà ga T3. Nhân viên hỗ trợ hành lý, bán vé và chỗ chờ; xe vào đón tận quầy. | airport-counters.webp',
			'Chuyến bay trễ, có tổng đài hỗ trợ | Nếu chuyến bay hạ cánh muộn hơn dự kiến, liên hệ tổng đài 1900 6763 trước giờ đón để được hỗ trợ đổi sang chuyến còn chỗ. | airport-van.webp',
			'Xuống gần nơi lưu trú | Gửi địa chỉ khách sạn hoặc resort ở Vũng Tàu khi đặt vé để nhà xe xác nhận điểm trả trong khu vực phục vụ; khách xuống Bà Rịa chọn điểm trả 54 Lê Thành Duy. | hd-van-seaside.webp',
			$reason_classes,
			$reason_seats( '' ),
			$reason_ticket,
		) ),
		'content_html'     => '<h2>Đón tại quầy T1, T2, T3 như thế nào?</h2>' . $ul( array(
			'Khi đặt vé, chọn Tân Sơn Nhất làm điểm đi và ghi rõ nhà ga đến.',
			'Hạ cánh, làm thủ tục và nhận hành lý xong, đến quầy Hải Vân ở nhà ga của bạn: T1 cột B5, T2 cột GF12, T3 giữa cột A17 và A18.',
			'Nhân viên quầy kiểm tra vé, hướng dẫn chỗ chờ; xe vào đón tận quầy. Cần tìm quầy, gọi 1900 6763 và cho biết nhà ga cùng giờ hạ cánh.',
		) ) . '<h2>Hành lý</h2><p>Nhân viên quầy hỗ trợ hành lý khi lên xe. Nếu mang nhiều kiện, vali cỡ lớn hoặc đồ cồng kềnh, hãy báo khi đặt vé để Hải Vân xác nhận chỗ để trên chuyến bạn chọn.</p>'
			. '<h2>Khi chuyến bay bị trễ</h2><p>Hãy tính cả thời gian làm thủ tục, nhận hành lý và đi bộ ra điểm hẹn khi chọn giờ xe. Nếu chuyến bay trễ, liên hệ tổng đài 1900 6763 trước giờ đón, cung cấp mã vé và giờ hạ cánh mới để được hỗ trợ đổi chuyến còn chỗ. Điều kiện đổi vé tùy từng loại vé.</p>'
			. '<h2>Điểm trả ở Vũng Tàu và Bà Rịa</h2><p>Nếu muốn xuống gần khách sạn hoặc resort ở Vũng Tàu, gửi địa chỉ lưu trú khi đặt vé để nhà xe xác nhận điểm trả trong khu vực phục vụ. Khách xuống Bà Rịa chọn điểm trả 54 Lê Thành Duy, phường Phước Trung. Văn phòng Hải Vân ở Vũng Tàu: 156B Lê Hồng Phong.</p>'
			. $policy_html . '<p>Đọc thêm <a href="/diem-den/vung-tau">kinh nghiệm du lịch Vũng Tàu</a> trước chuyến đi.</p>',
		'faq'              => $ln( array(
			'Xe sân bay Tân Sơn Nhất đi Vũng Tàu đón ở đâu? | Tại quầy Hải Vân trong sân bay: cột B5 nhà ga T1, cột GF12 nhà ga T2 và giữa cột A17, A18 nhà ga T3. Xe vào đón tận quầy; cần tìm quầy, gọi 1900 6763 và cho biết nhà ga cùng giờ hạ cánh.',
			'Tôi nên chọn giờ xe nào nếu chưa biết lúc nào lấy xong hành lý? | Hãy tính cả thời gian làm thủ tục, nhận hành lý và đi bộ ra điểm hẹn. Nếu chuyến bay trễ, liên hệ tổng đài 1900 6763 trước giờ đón để được hỗ trợ đổi sang chuyến còn chỗ.',
			'Chuyến bay bị trễ thì vé xe của tôi được xử lý thế nào? | Liên hệ tổng đài 1900 6763 càng sớm càng tốt, cung cấp mã vé và giờ hạ cánh mới để được hỗ trợ đổi chuyến. Việc đổi phụ thuộc chỗ còn trống và điều kiện của vé.',
			'Đi xe từ Tân Sơn Nhất đến Vũng Tàu mất bao lâu? | Tùy nhà ga đón, điểm trả và tình hình giao thông. Xem giờ đến dự kiến của từng chuyến để sắp xếp giờ nhận phòng.',
			'Có trả khách gần khách sạn hoặc resort ở Vũng Tàu không? | Có, trong khu vực phục vụ. Gửi địa chỉ lưu trú khi đặt vé để nhà xe xác nhận điểm trả.',
			'Mang nhiều hành lý thì có lên xe được không? | Nhân viên quầy hỗ trợ hành lý khi lên xe. Nếu mang nhiều kiện, vali cỡ lớn hoặc đồ cồng kềnh, hãy báo khi đặt vé để Hải Vân xác nhận chỗ để trên chuyến bạn chọn.',
			'Có xe từ sân bay đi Bà Rịa không? | Khách xuống Bà Rịa chọn điểm trả 54 Lê Thành Duy, phường Phước Trung khi đặt vé và kiểm tra lại điểm trả ghi trên vé.',
			$faq_price( 'Tân Sơn Nhất đi Vũng Tàu' ),
			$faq_classes( 'Tân Sơn Nhất đi Vũng Tàu' ),
			'Đặt vé xe sân bay Tân Sơn Nhất đi Vũng Tàu online như thế nào? | Chọn chuyến, chọn ghế, giữ chỗ và thanh toán qua VNPay; vé điện tử gửi về điện thoại. Nếu chưa nhận được xác nhận đặt vé, gọi 1900 6763 để kiểm tra.',
			$faq_change,
			$faq_seats,
			$faq_child,
			$faq_points,
		) ),
		'pickup_points'    => $ln( array(
			'Quầy sân bay Tân Sơn Nhất | Nhà ga T1 (cột B5), T2 (cột GF12), T3 (cột A17 – A18) | Xe vào đón tận quầy',
		) ),
		'offices'          => $ln( array(
			$off_tsn( 'Xe chạy 5:00 – 0:00', 'Ra khỏi sảnh đến là thấy quầy Hải Vân; xe vào đón tận quầy.' ),
			$off_vt,
		) ),
		'vehicle_classes'  => $vt_classes( false ),
		'stops_intro'      => 'Lên xe tại quầy Hải Vân ở nhà ga bạn hạ cánh. Ở Vũng Tàu, gửi địa chỉ lưu trú để được xác nhận điểm trả phù hợp. Không phải chuyến nào cũng qua tất cả các trạm.',
		'stops'            => $ln( array_merge( $st_tsn, $st_br, $st_vt ) ),
		'rating'           => $rating,
		'reviews'          => $ln( array( $rv_car, $rv_ride ) ),
		'stats'            => $stats,
		'story'            => '',
		'related'          => "Sài Gòn đi Vũng Tàu | quan-1/vung-tau\nVũng Tàu đi Sài Gòn | vung-tau/quan-1-san-bay",
		'reverse'          => 'Vũng Tàu đi Tân Sơn Nhất | vung-tau/tan-son-nhat',
		'round_trip_note'  => 'Đi cả hai chiều: sau khi giữ vé từ sân bay, tìm thêm chuyến Vũng Tàu đi Tân Sơn Nhất cho ngày bay về. Mỗi chiều chọn giờ, hạng xe và ghế riêng; kiểm tra giá từng chiều trước khi thanh toán.',
	),

	/* ---------- 04 · Vũng Tàu đi Tân Sơn Nhất (trang mỏng, dựng đủ bố cục, FAQ đúng chiều) ---------- */
	'vung-tau/tan-son-nhat' => array(
		'seo_title'        => 'Xe Vũng Tàu đi sân bay Tân Sơn Nhất | Hải Vân',
		'meta_description' => 'Đặt xe limousine Hải Vân từ Vũng Tàu đi sân bay Tân Sơn Nhất, có ghế massage và wifi. Chọn giờ khởi hành phù hợp chuyến bay, đặt ghế trước trên website.',
		'h1'               => 'Xe Vũng Tàu đi sân bay Tân Sơn Nhất',
		'intro'            => 'Limousine Hải Vân đón bạn ở Vũng Tàu và trả tại quầy Hải Vân ở sân bay Tân Sơn Nhất. Xe chạy từ 2 giờ sáng, chuyến cuối rời Vũng Tàu lúc 21 giờ 45; chọn giờ theo chuyến bay và đặt ghế trước trên website.',
		'facts'            => "2h – 21h45 | Giờ chạy\nT1 · T2 · T3 | Trả tại nhà ga\n110 km | Quãng đường",
		'schedule_text'    => '<p>Danh sách dưới là các chuyến từ Vũng Tàu đi Tân Sơn Nhất còn chỗ theo ngày bạn chọn. Chọn chuyến theo giờ xe đến dự kiến tại nhà ga, cộng thêm thời gian làm thủ tục bay và thời gian dự phòng cho giao thông.' . $schedule_tail,
		'reasons_head'     => 'Vì sao chọn Hải Vân | Ra sân bay Tân Sơn Nhất | theo cách chu đáo hơn. | Đón ở Vũng Tàu, trả tại quầy Hải Vân trong nhà ga; mỗi chuyến do tài xế quen tuyến cầm lái.',
		'reasons'          => $ln( array(
			'Xe từ 2 giờ sáng đến 21 giờ 45 | Chuyến cuối rời Vũng Tàu lúc 21h45. Chọn chuyến theo giờ xe đến dự kiến tại nhà ga của bạn, rồi cộng thêm thời gian làm thủ tục bay. | fleet-convoy-street.webp',
			'Trả tại quầy trong nhà ga | Xe trả khách tại quầy Hải Vân ở nhà ga T1, T2 hoặc T3, nhân viên hỗ trợ hành lý. Khi đặt vé, xác nhận nhà ga cần xuống. | airport-counters.webp',
			'Đón gần nơi lưu trú | Bạn có thể chọn điểm đón tại văn phòng 156B Lê Hồng Phong hoặc trạm trên tuyến. Muốn được đón gần khách sạn, resort, hãy cung cấp địa chỉ để xác nhận; khách ở Bà Rịa chọn điểm đón 54 Lê Thành Duy. | hd-van-seaside.webp',
			'Ghế massage, wifi trên xe | Royal có ghế không trọng lực và khoang rộng; Luxury 11 chỗ có ghế tích hợp massage; Economy là lựa chọn tiết kiệm và cũng có ghế massage. Xe có wifi, điều hòa, cổng sạc. | hd-limo-cabin.webp',
			$reason_seats( '' ),
			$reason_ticket,
		) ),
		'content_html'     => '<h2>Đi sân bay từ Vũng Tàu: chọn chuyến thế nào?</h2>' . $ul( array(
			'Chọn chuyến theo giờ xe đến dự kiến tại nhà ga bạn cần xuống, rồi tính thêm thời gian làm thủ tục theo yêu cầu của hãng bay.',
			'Thời gian di chuyển phụ thuộc vào điểm đón, nhà ga trả khách và tình hình giao thông; nên chừa thời gian dự phòng và không mặc định chuyến xe sớm nhất sẽ phù hợp với mọi chuyến bay.',
			'Chuyến cuối rời Vũng Tàu lúc 21h45. Gọi 1900 6763 nếu cần xác nhận giờ xe đến nhà ga trước khi đặt.',
		) ) . '<h2>Hành lý</h2><p>Nhân viên Hải Vân hỗ trợ hành lý khi xuống xe tại quầy ở nhà ga. Nếu mang nhiều kiện, vali cỡ lớn hoặc đồ cồng kềnh, hãy báo khi đặt vé để Hải Vân xác nhận chỗ để trên chuyến bạn chọn.</p>'
			. '<h2>Nếu chuyến bay đổi giờ</h2><p>Khi hãng bay đổi giờ hoặc bạn cần đi chuyến xe khác, liên hệ tổng đài 1900 6763 trước giờ xe chạy, cung cấp mã vé và giờ bay mới để được hỗ trợ đổi chuyến còn chỗ. Điều kiện đổi vé tùy từng loại vé.</p>'
			. $policy_html . '<p>Đọc thêm <a href="/diem-den/vung-tau">kinh nghiệm du lịch Vũng Tàu</a>.</p>',
		'faq'              => $ln( array(
			'Chuyến cuối từ Vũng Tàu đi Tân Sơn Nhất lúc mấy giờ? | Chuyến cuối rời Vũng Tàu lúc 21h45; xe chạy từ 2h sáng. Chọn ngày đi để xem chuyến còn chỗ, gọi 1900 6763 nếu cần xác nhận giờ xe đến nhà ga trước khi đặt.',
			'Đi xe Vũng Tàu đến sân bay Tân Sơn Nhất mất bao lâu? | Thời gian di chuyển phụ thuộc vào điểm đón, nhà ga trả khách và tình hình giao thông. Hãy xem giờ đến dự kiến của chuyến, đồng thời dành thêm thời gian dự phòng và làm thủ tục bay.',
			'Xe đón ở đâu tại Vũng Tàu và trả ở đâu tại sân bay? | Xe đón khách tại Vũng Tàu và trả khách ở sân bay Tân Sơn Nhất. Phòng chờ Hải Vân ở 156B Lê Hồng Phong; muốn lên xe gần nơi lưu trú hoặc ở Bà Rịa (54 Lê Thành Duy), hãy báo khi đặt vé. Khi đặt vé, hãy xác nhận điểm lên xe và nhà ga cần xuống.',
			'Nên chọn chuyến mấy giờ để kịp chuyến bay? | Chọn chuyến theo giờ xe đến dự kiến tại nhà ga bạn cần xuống, rồi tính thêm thời gian làm thủ tục theo yêu cầu của hãng bay. Nên chừa thời gian dự phòng cho giao thông và không mặc định chuyến xe sớm nhất sẽ phù hợp với mọi chuyến bay.',
			'Chuyến bay đổi giờ thì vé xe xử lý thế nào? | Liên hệ tổng đài 1900 6763 trước giờ xe chạy, cung cấp mã vé và giờ bay mới để được hỗ trợ đổi chuyến. Việc đổi phụ thuộc chỗ còn trống và điều kiện của vé.',
			'Thời gian được phép đổi hoặc hủy vé là bao lâu? | Nếu cần đổi hoặc hủy vé, hãy báo cho Hải Vân trước giờ khởi hành. Chuẩn bị mã vé và ngày đi để nhà xe kiểm tra thời hạn áp dụng cho vé của bạn. Chi tiết xem ' . $policy_text . '.',
			'Có được hoàn tiền khi hủy vé không? | Tùy điều kiện của vé. Trước khi thanh toán, hãy xem thời hạn đổi hoặc hủy vé, mức phí và điều kiện hoàn tiền của vé bạn chọn; chi tiết xem ' . $policy_text . '.',
			'Mã khuyến mại có được dùng lại khi đổi hoặc hủy vé không? | Việc dùng lại mã sau khi đổi hoặc hủy vé phụ thuộc vào điều kiện của chương trình khuyến mại. Kiểm tra điều kiện của mã trước khi hủy.',
			'Nếu đến muộn giờ xe chạy thì vé của tôi được xử lý thế nào? | Hãy có mặt ở điểm đón trước giờ ghi trên vé. Nếu có thể đến muộn, gọi ngay 1900 6763 để được hỗ trợ đổi chuyến nếu còn chỗ; cách xử lý vé tùy điều kiện của vé, xem ' . $policy_text . '.',
			$faq_price( 'Vũng Tàu đi Tân Sơn Nhất' ),
			$faq_classes( 'Vũng Tàu đi Tân Sơn Nhất' ),
			$faq_seats,
			$faq_child,
			$faq_points,
		) ),
		'pickup_points'    => $ln( array(
			'Phòng chờ 156B Lê Hồng Phong | TP. Vũng Tàu | Có thể đón gần nơi lưu trú trong khu vực phục vụ',
			'54 Lê Thành Duy | Phường Phước Trung, Bà Rịa | Điểm đón của khách Bà Rịa',
		) ),
		'offices'          => $ln( array(
			$off_vt,
			$off_tsn( 'Trả khách tại quầy', 'Xe trả khách tại quầy Hải Vân ở nhà ga; nhân viên hỗ trợ hành lý.' ),
		) ),
		'vehicle_classes'  => $vt_classes( false ),
		'stops_intro'      => 'Ở Vũng Tàu, xác nhận điểm đón gần nơi lưu trú và giờ có mặt; ở sân bay, xác nhận nhà ga cần xuống. Chỉ đến điểm hẹn ghi trên vé, không phải chuyến nào cũng qua tất cả các trạm.',
		'stops'            => $ln( array_merge( $st_vt, $st_br, $st_tsn ) ),
		'rating'           => $rating,
		'reviews'          => $ln( array( $rv_ride, $rv_car ) ),
		'stats'            => $stats,
		'story'            => '',
		'related'          => "Vũng Tàu đi Sài Gòn | vung-tau/quan-1-san-bay\nSài Gòn đi Vũng Tàu | quan-1/vung-tau",
		'reverse'          => 'Tân Sơn Nhất đi Vũng Tàu | tan-son-nhat/vung-tau',
		'round_trip_note'  => 'Đi cả hai chiều: sau khi giữ vé ra sân bay, tìm thêm chuyến Tân Sơn Nhất đi Vũng Tàu cho ngày bay về. Mỗi chiều chọn giờ, hạng xe và ghế riêng; kiểm tra giá từng chiều trước khi thanh toán.',
	),
);
