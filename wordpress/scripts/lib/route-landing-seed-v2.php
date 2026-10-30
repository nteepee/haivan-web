<?php
/**
 * Khối v2 của trang tuyến (gộp đè lên lib/route-landing-seed.php): số liệu đầu trang, "Vì sao chọn" có ảnh, phòng chờ có nhãn + ảnh,
 * danh bạ trạm, số liệu, câu chuyện, ảnh hạng xe. Dữ kiện lấy từ docs/reference/route-landing/*.json (trang của chính Hải Vân),
 * viết lại bằng lời của Hải Vân. Ảnh là tệp thật trong apps/booking/public/assets/design/v2.
 * Ô nhiều dòng dùng dấu "|" như meta box (theme inc/route-meta.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

$map = static fn( $q ) => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $q );
$ln  = static fn( array $l ) => implode( "\n", $l );

/* ---------- Sài Gòn ⇄ Vũng Tàu: chiều về ---------- */
$vt_stops_vt = array(
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
	'Bà Rịa & Long Thành | 54 Lê Thành Duy | Phường Phước Trung, Bà Rịa',
	'Bà Rịa & Long Thành | Ngã ba Bà Rịa | Co.opmart Bà Rịa, Nguyễn Hữu Thọ',
	'Bà Rịa & Long Thành | Ngã tư Long Sơn | Quốc lộ 51, Tân Thành',
	'Bà Rịa & Long Thành | Trạm dừng Long Thành | Chân cầu Thái Thiện, Phước Thái, Đồng Nai',
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

/* ---------- Tây Bắc: phần chung ---------- */
$hv_db_stats   = "30 | năm thương hiệu Hải Vân\n10 | bệnh viện Hà Nội có xe trung chuyển miễn phí\n8 tấn | xe tải gửi hàng\n4–12 giờ | hàng tới Tây Bắc";
$hv_db_story   = 'Chương trình "Không bỏ lại ai phía sau" (2025): Hải Vân cùng Sở Y tế tỉnh Điện Biên và các bệnh viện tỉnh tặng vé miễn phí 100% cho bệnh nhân mắc bệnh hiểm nghèo theo Thông tư 50/2024/TT-BYT, và thẻ ưu đãi 300.000đ cho bệnh nhân khó khăn thường xuyên xuống Hà Nội khám bệnh.';
$hv_db_offices = $ln( array(
	'Phòng chờ 01 Nguyễn Hoàng | 01 Nguyễn Hoàng, phường Mỹ Đình, Hà Nội, ngay cạnh Bến xe Mỹ Đình | Mở theo giờ xe, hỏi 1900 6763 | Ngồi nghỉ có điều hòa, trà bánh, trái cây; đặt vé, gửi nhận hàng và lên xe trung chuyển miễn phí tới bệnh viện. | ' . $map( '01 Nguyễn Hoàng, Mỹ Đình, Hà Nội' ) . ' | Hà Nội · Phòng chờ VIP | hn-lounge-front.webp',
	'Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm, Hà Nội | | Nơi xe xuất bến và trả khách ở đầu Hà Nội. | ' . $map( 'Bến xe Mỹ Đình, 20 Phạm Hùng, Hà Nội' ) . ' | Hà Nội · Bến xe | ',
	'Văn phòng Hải Vân Điện Biên | 300 Nguyễn Hữu Thọ, phường Mường Thanh, Điện Biên Phủ | Gọi 1900 6763 trước khi tới | Hỗ trợ đặt vé và hỏi đáp về chuyến tại Điện Biên. | ' . $map( '300 Nguyễn Hữu Thọ, Mường Thanh, Điện Biên Phủ' ) . ' | Điện Biên · Văn phòng | ',
	'Bến xe khách thành phố Điện Biên Phủ | 79 Quốc lộ 12, phường Điện Biên Phủ, tỉnh Điện Biên | | Điểm đón và trả chính ở đầu Điện Biên. | ' . $map( 'Bến xe khách thành phố Điện Biên Phủ, 79 Quốc lộ 12' ) . ' | Điện Biên · Bến xe | ',
	'Bản Phủ và Mường Chà | Chỉ phục vụ trên một số chuyến | | Chưa có địa chỉ cố định; gọi 1900 6763 để xác nhận chỗ đứng đợi trước ngày đi. | | Dọc tuyến · Điểm đón trả | ',
) );
$hv_db_stops = $ln( array(
	'Hà Nội | Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm',
	'Hà Nội | Phòng chờ 01 Nguyễn Hoàng | Phường Mỹ Đình, cạnh Bến xe Mỹ Đình',
	'Điện Biên | Bến xe khách TP. Điện Biên Phủ | 79 Quốc lộ 12, phường Điện Biên Phủ',
	'Điện Biên | Văn phòng Hải Vân Điện Biên | 300 Nguyễn Hữu Thọ, phường Mường Thanh',
	'Dọc tuyến | Bản Phủ | Chỉ một số chuyến, gọi 1900 6763 xác nhận',
	'Dọc tuyến | Mường Chà | Chỉ một số chuyến, gọi 1900 6763 xác nhận',
) );
$hv_db_classes = $ln( array(
	'Cao cấp | 22 | | Hạng Royal Cabin: cabin riêng rộng gần 1 m, chăn ga trắng, màn hình và bảng điều khiển tại giường. Xe 22–24 cabin. | Điều hòa; Cabin riêng; Chăn ga gối trắng; Màn hình và bảng điều khiển | dien-bien-hero-royal-bed.webp',
	'Tiết kiệm | 34 | | Hạng Luxury giường nằm 34–36 chỗ: khoang mobihome, giường có rèm che riêng tư, màn hình và bàn nhỏ để đồ. | Điều hòa; Chăn gối; Rèm che riêng tư; Màn hình riêng | dien-bien-hero-cabin-bed.webp',
	'Siêu rẻ | 44 | | Hạng Eco 44 giường: giường da, chăn gối, tủ lạnh nước uống và cổng sạc USB tại giường. | Điều hòa; Giường da, chăn gối; Cổng sạc USB; Nước uống ướp lạnh | dien-bien-hero-berth-aisle.webp',
) );
$hv_db_reasons = static fn( $go ) => $ln( array(
	( $go ? 'Đi đêm, sáng tới Điện Biên' : 'Đi đêm, sáng về tới Hà Nội' ) . ' | Xe rời bến buổi tối và tới nơi vào sáng hôm sau, ngủ một giấc là hết chặng đèo hơn mười tiếng. Xe chạy qua đêm nên hãy xem kỹ ngày đến của chuyến. | dien-bien-hero-bus.webp',
	'Ba hạng xe giường nằm | Eco, Luxury và Royal Cabin: giường da, chăn gối, cổng sạc USB; Luxury có rèm che và màn hình riêng, Royal Cabin là cabin riêng rộng gần 1 m. | dien-bien-hero-berth-aisle.webp',
	'Không nhồi nhét, không ghế phụ | Mỗi khách một giường đã đánh số trên sơ đồ. Hải Vân không bán ghế phụ, không cho nằm sàn, xe chạy đúng tuyến và nốt đã đăng ký với cơ quan quản lý. | dien-bien-hero-cabin-duvet.webp',
	'Phòng chờ ngay cạnh bến Mỹ Đình | Tới sớm thì ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng: điều hòa, trà bánh, trái cây, chỗ để hành lý; tới giờ mới ra xe. | hn-lounge-inside.webp',
	'Trung chuyển miễn phí tới bệnh viện | Khách Điện Biên, Sơn La xuống Hà Nội khám bệnh được đưa miễn phí từ 01 Nguyễn Hoàng tới 10 bệnh viện lớn như Bạch Mai, Việt Đức, Nhi Trung ương, K Tân Triều. Đăng ký khi đặt vé. | hn-csr-trungchuyen.webp',
	'Gửi hàng cùng chuyến xe | Nhận từ phong bì tới hàng cồng kềnh, có xe tải tới 8 tấn; hàng đi Tây Bắc thường tới sau 4–12 tiếng. Giao nhận tại 01 Nguyễn Hoàng. | hn-ship-1.webp',
) );

$xt_stats = "30–60 phút | một chuyến xuất bến\n3 | điểm đón cố định ở Hà Nội\n≈ 2.000 | thẻ đồng hành cho học sinh 2K8\n5 triệu | giá trị mỗi thẻ đồng hành";
$xt_story = 'Chương trình "Không bỏ lại ai phía sau": Hải Vân Xuân Tráng cùng UBND phường Mộc Châu trao thẻ đi xe miễn phí tuyến Mộc Châu – Hà Nội cho người bệnh có hoàn cảnh khó khăn, để bớt gánh nặng tiền xe mỗi lần đi khám. Danh sách do phường rà soát tại từng bản, cấp đúng người cần.';
$xt_offices_hn = array(
	'Văn phòng 35 Nguyễn Tuân | Số 35 Nguyễn Tuân, quận Thanh Xuân, Hà Nội | Hỏi giờ làm việc qua 1900 6763 / 1900 9398 | Văn phòng nhà xe ở Hà Nội, đồng thời là điểm đón cố định. | ' . $map( '35 Nguyễn Tuân, Thanh Xuân, Hà Nội' ) . ' | Hà Nội · Văn phòng nhà xe | ',
	'Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm, Hà Nội | | Nơi xe xuất bến và trả khách ở đầu Hà Nội. | ' . $map( 'Bến xe Mỹ Đình, 20 Phạm Hùng, Hà Nội' ) . ' | Hà Nội · Bến xe | ',
);
$xt_tram = 'Trạm dừng nghỉ Mộc Châu | Tổ dân phố 70, phường Vân Sơn, Mộc Châu, Sơn La | Gọi 1900 6763 / 1900 9398 để hỏi giờ | Phòng chờ và điểm giao nhận hàng hoá của Hải Vân Xuân Tráng. | ' . $map( 'Tổ dân phố 70, Vân Sơn, Mộc Châu, Sơn La' ) . ' | Mộc Châu · Trạm dừng nghỉ | hvxt-tram-dung-nghi.webp';
$mc_stops = $ln( array(
	'Hà Nội | Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm',
	'Hà Nội | 35 Nguyễn Tuân | Quận Thanh Xuân',
	'Hà Nội | 10 Châu Văn Liêm | Quận Nam Từ Liêm',
	'Mộc Châu | Nông trường Mộc Châu | Thị trấn Nông trường Mộc Châu',
	'Mộc Châu | Khách sạn Mường Thanh | Đường Hoàng Quốc Việt, Phiêng Luông',
	'Mộc Châu | Khách sạn Trường Giang | Đường Hoàng Quốc Việt, Phiêng Luông',
	'Mộc Châu | Bến xe Mộc Châu | Quốc lộ 6, thị trấn Mộc Châu',
	'Mộc Châu | Văn phòng 254 Trần Huy Liệu | Thị trấn Mộc Châu',
	'Mộc Châu | Bản Áng | Xã Đông Sang',
	'Mộc Châu | Ngã ba Pa Háng | Thị trấn Mộc Châu',
	'Mộc Châu | Cây xăng Mường Sang | Xã Mường Sang',
) );
$mc_classes = $ln( array(
	'Royal | 9 | | Limousine 9 chỗ: ghế massage, ngả và nâng hạ tuỳ chỉnh, điều hòa, wifi. | Cổng sạc USB; Khăn ướt; Nước đóng chai | hvxt-moc-chau-limo-interior-1.webp',
	'Cao cấp | 22 | | Xe giường nằm 22–24 chỗ: chăn ga gối, màn hình LCD riêng, rèm che riêng tư. | Màn hình LCD riêng; Cổng sạc USB; Khăn ướt | hvxt-sleeper-interior-starry.webp',
	'Phổ thông | 34 | | Xe giường nằm 34 chỗ: chăn ga gối, rèm che riêng tư. | Cổng sạc USB; Khăn ướt; Nước đóng chai | hvxt-sleeper-interior-blue.webp',
	'Tiết kiệm | 34 | | Xe giường nằm 34–36 chỗ, giá mềm hơn cho chặng dài. | Cổng sạc USB; Khăn ướt; Nước đóng chai | hvxt-son-la-bus-side.webp',
	'Siêu rẻ | 44 | | Xe giường nằm 44 chỗ, hạng giá thấp nhất trên tuyến. | Cổng sạc USB; Chăn gối | hvxt-son-la-bus-night.webp',
) );
$mc_reasons = static fn( $go ) => $ln( array(
	'Tuyến dày, nhiều giờ chạy | Theo nhà xe, khoảng 30 phút đến 1 giờ có một chuyến, có cả chuyến tối và đêm; hành trình dự kiến 4 giờ 15 đến 4 giờ 35. Chuyến đêm có thể tới nơi vào hôm sau, hãy xem ngày đến. | hvxt-moc-chau-van-mountain.webp',
	'Limousine và xe giường nằm | Limousine có ghế massage, ngả tuỳ chỉnh, wifi; xe giường nằm có chăn ga gối, màn hình, rèm che riêng tư. Hạng vé ghi ngay trên từng chuyến. | hvxt-moc-chau-limo-interior-1.webp',
	( $go ? 'Trả khách tận homestay, khách sạn' : 'Đón khách tận homestay, khách sạn' ) . ' | Ở Mộc Châu xe đón trả tại 8 điểm: Nông trường, khách sạn Mường Thanh, Trường Giang, bến xe, văn phòng 254 Trần Huy Liệu, Bản Áng, ngã ba Pa Háng, cây xăng Mường Sang. | hvxt-moc-chau-van-street.webp',
	'Ba điểm đón cố định ở Hà Nội | Lên xuống ở Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm; chọn điểm khi đặt vé. | hvxt-son-la-bus-side.webp',
	'Không nhồi nhét, chạy đúng giờ | Mỗi khách một chỗ có số trên sơ đồ, xe không đón thêm khách dọc đường. Vé điện tử về thẳng điện thoại. | hvxt-sleeper-interior-starry.webp',
	'Trạm dừng nghỉ ở Mộc Châu | Phòng chờ và điểm giao nhận hàng ở Tổ dân phố 70, phường Vân Sơn. Gửi hàng Hà Nội – Mộc Châu – Sơn La, báo loại hàng để được tư vấn cước. | hvxt-tram-dung-nghi.webp',
) );
$sl_stops = $ln( array(
	'Hà Nội | Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm',
	'Hà Nội | 35 Nguyễn Tuân | Quận Thanh Xuân, văn phòng nhà xe',
	'Hà Nội | 10 Châu Văn Liêm | Quận Nam Từ Liêm',
	'Sơn La | Đón trả tận nơi | Trung tâm thành phố Sơn La, ghi địa chỉ khi đặt vé',
	'Sơn La | Bến xe Sơn La | Điểm đón trả bổ sung, gọi 1900 6763 xác nhận',
) );
$sl_classes = $ln( array(
	'Cao cấp | 22 | | Xe giường nằm 22–24 chỗ: chăn ga gối, màn hình LCD riêng, rèm che riêng tư. | Màn hình LCD riêng; Cổng sạc USB; Khăn ướt | hvxt-sleeper-interior-starry.webp',
	'Phổ thông | 34 | | Xe giường nằm 34 chỗ: chăn ga gối, rèm che riêng tư. | Cổng sạc USB; Khăn ướt; Nước đóng chai | hvxt-sleeper-interior-blue.webp',
	'Tiết kiệm | 34 | | Xe giường nằm 34–36 chỗ, giá mềm hơn cho chặng dài. | Cổng sạc USB; Khăn ướt; Nước đóng chai | hvxt-son-la-bus-side.webp',
	'Siêu rẻ | 44 | | Xe giường nằm 44 chỗ, hạng giá thấp nhất trên tuyến. | Cổng sạc USB; Chăn gối | hvxt-son-la-bus-night.webp',
) );
$sl_reasons = static fn( $go ) => $ln( array(
	'Nhiều giờ chạy mỗi ngày | Theo nhà xe, khoảng 30 phút đến 1 giờ có một chuyến; hành trình khoảng 6 đến 8 tiếng. Chuyến rời bến muộn có thể tới nơi vào sáng hôm sau. | hvxt-son-la-bus-side.webp',
	'Giường nằm êm cho chặng dài | Chăn ga gối, màn hình, rèm che riêng tư; tuyến có cả limousine ghế massage, wifi. Hạng vé ghi trên từng chuyến. | hvxt-sleeper-interior-starry.webp',
	( $go ? 'Trả khách tận nơi ở Sơn La' : 'Đón khách tận nơi ở Sơn La' ) . ' | Trong khu vực trung tâm thành phố Sơn La, ghi địa chỉ khi đặt vé hoặc gọi 1900 6763 để xác nhận điểm hẹn. | hvxt-son-la-bus-night.webp',
	'Ba điểm đón cố định ở Hà Nội | Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm; chọn điểm phù hợp khi đặt vé. | hvxt-moc-chau-van-street.webp',
	'Tự chọn giường, vé điện tử | Mở sơ đồ chuyến, chọn một hoặc nhiều giường còn trống rồi thanh toán; vé điện tử về thẳng điện thoại. | hvxt-sleeper-interior-blue.webp',
	'Phòng vé ở Mỹ Đình, Mộc Châu, Sơn La | Đặt qua ứng dụng, website hoặc tổng đài 1900 6763 / 1900 9398; gửi hàng trên tuyến tại trạm dừng nghỉ Mộc Châu. | hvxt-tram-dung-nghi.webp',
) );

return array(
	'vung-tau/quan-1-san-bay' => array(
		'faq_extra' => $ln( array(
			'Vé xe Hải Vân Vũng Tàu đi Sài Gòn giá bao nhiêu? | Giá đổi theo hạng xe, vị trí ghế và từng chuyến. Con số "Giá từ" ở đầu trang là giá thấp nhất của các chuyến còn chỗ hôm nay, đã gồm VAT; giá của chiều về có thể khác chiều đi.',
			'Có đón gần khách sạn hoặc resort ở Vũng Tàu không? | Có, trong khu vực phục vụ. Ghi địa chỉ khách sạn hoặc resort khi đặt vé để Hải Vân xác nhận điểm hẹn, giờ đón và điều kiện trung chuyển.',
			'Xe Vũng Tàu đi bệnh viện ở TP.HCM như Chợ Rẫy, Từ Dũ, Nhi Đồng 2, Ung Bướu thế nào? | Xe về các điểm trung tâm Quận 1, sau đó Hải Vân trung chuyển tiếp ra bệnh viện. Với chuyến sớm lúc 2h sáng, khách đi khám có thể tới trước giờ lấy số. Gọi 1900 6763 để báo bệnh viện cần đến.',
			'Đi sân bay Tân Sơn Nhất nên chọn chuyến mấy giờ? | Chặng Vũng Tàu – Tân Sơn Nhất mất khoảng 2 giờ 55 phút; cộng thêm thời gian làm thủ tục bay khi chọn chuyến. Bến Vũng Tàu mở từ 2h sáng nên khách bay sớm vẫn kịp.',
			'Chọn Royal, Luxury hay Economy cho chuyến về Sài Gòn? | So sánh ghế còn trống, tiện nghi và giá của đúng chuyến về bạn muốn đi; hạng xe chiều về không nhất thiết giống chiều đi.',
			'Đặt vé Vũng Tàu đi Sài Gòn online như thế nào? | Chọn ngày đi và chuyến, chọn ghế trên sơ đồ, nhập thông tin liên hệ rồi thanh toán; vé điện tử gửi về điện thoại. Chọn ghế chưa có nghĩa vé đã được xác nhận.',
			'Khách nước ngoài đặt vé và thanh toán thế nào? | Chọn chuyến và ghế, điền thông tin liên hệ, xác thực số điện thoại khi được yêu cầu rồi thanh toán bằng phương thức đang hiển thị. Liên hệ 1900 6763 nếu không nhận được mã xác thực.',
			'Đi cùng trẻ nhỏ thì hỏi ở đâu? | Gọi 1900 6763 để xác nhận chỗ cho trẻ và điều kiện áp dụng cho vé của bạn; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'seo_title'        => 'Xe Vũng Tàu đi Sài Gòn: giờ chạy, giá vé hôm nay | Hải Vân',
		'h1'               => 'Đặt vé xe Vũng Tàu đi Sài Gòn',
		'facts'            => "≈ 2 giờ 40 | Thời gian\n15–30 phút | Một chuyến\n2h – 21h45 | Giờ chạy",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Về Sài Gòn | theo cách chu đáo hơn. | Hơn 30 năm đưa đón, mỗi chuyến đều do tài xế quen tuyến cầm lái, trên những chiếc xe được giữ chuẩn chất lượng.',
		'reasons'          => $ln( array(
			'Chuyến sớm từ 2 giờ sáng | Bến Vũng Tàu chạy từ 2h đến 21h45, trung bình 15–30 phút một chuyến. Cần về sớm để đi làm, bắt chuyến bay hay đi khám bệnh đều có chuyến hợp lịch. | fleet-convoy-street.webp',
			'Đón gần nơi lưu trú | Đón tại văn phòng, trạm trên tuyến hoặc gần khách sạn, resort trong khu vực phục vụ; khách Bà Rịa lên xe ở 54 Lê Thành Duy. | hd-van-seaside.webp',
			'Ra thẳng sân bay Tân Sơn Nhất | Xe trả khách ngay quầy Hải Vân ở nhà ga T1, T2, T3, nhân viên hỗ trợ hành lý. Chặng này mất khoảng 2 giờ 55, hãy cộng thêm thời gian làm thủ tục. | airport-van.webp',
			'Trung chuyển tới bệnh viện | Về tới Quận 1, Hải Vân trung chuyển tiếp ra Chợ Rẫy, Từ Dũ, Nhi Đồng 2, Ung Bướu. Gọi 1900 6763 để báo bệnh viện cần đến. | staff-guests.webp',
			'Ba hạng xe, toàn bộ là limousine | Hơn 40 xe Royal, Luxury và Economy; điều hoà, wifi, cổng sạc USB, nước suối, khăn lạnh, hạng cao có ghế massage. | hd-limo-cabin.webp',
			'Không nhồi nhét, không ghế phụ | Mỗi khách một ghế đã đánh số trên sơ đồ, xe không đón thêm khách dọc đường. Giá vé đã gồm VAT. | hd-limo-seats.webp',
		) ),
		'offices'          => $ln( array(
			'156B Lê Hồng Phong | TP. Vũng Tàu | Phòng chờ 7:00 – 21:00, xe chạy 2:00 – 21:45 | Đón gần nơi lưu trú trong khu vực phục vụ; khách Bà Rịa lên xe tại 54 Lê Thành Duy. | ' . $map( '156B Lê Hồng Phong, Vũng Tàu' ) . ' | Vũng Tàu · Văn phòng chính | gh-office-vt.webp',
			'34 Nguyễn Thái Bình | Phường Bến Thành, Quận 1, TP. Hồ Chí Minh | Phòng chờ 7:00 – 21:00 | Điểm trả chính ở Quận 1, gần chợ Bến Thành. | ' . $map( '34 Nguyễn Thái Bình, Bến Thành, Quận 1, Hồ Chí Minh' ) . ' | Quận 1 · Phòng chờ chính | lounge-q1.webp',
			'307 Nguyễn Văn Trỗi | Quận Tân Bình, TP. Hồ Chí Minh | Phòng chờ 7:00 – 21:00 | Gần sân bay Tân Sơn Nhất, tiện cho khách nối chuyến bay. | ' . $map( '307 Nguyễn Văn Trỗi, Tân Bình, Hồ Chí Minh' ) . ' | Tân Bình · Phòng chờ | lounge-nvt-front.webp',
			'Quầy sân bay Tân Sơn Nhất | Ga T1 cột B5 · Ga T2 cột GF12 · Ga T3 giữa cột A17 – A18 | | Xe trả khách tận quầy; bay trễ thì gọi 1900 6763 để đổi chuyến. | ' . $map( 'Sân bay Tân Sơn Nhất' ) . ' | Tân Sơn Nhất · 3 quầy vé | airport-counters.webp',
			'607 Điện Biên Phủ | Quận Bình Thạnh, TP. Hồ Chí Minh | Phòng chờ 7:00 – 21:00 | Trên trục Điện Biên Phủ, tiện cho khách phía Đông thành phố. | ' . $map( '607 Điện Biên Phủ, Bình Thạnh, Hồ Chí Minh' ) . ' | Bình Thạnh · Phòng chờ | ',
		) ),
		'stops_intro'      => 'Ở Vũng Tàu, xác nhận điểm đón gần nơi lưu trú và giờ có mặt trước khi về Quận 1. Danh bạ giúp tra địa chỉ; chỉ đến điểm hẹn ghi trên vé, không phải chuyến nào cũng qua tất cả các trạm.',
		'stops'            => $ln( $vt_stops_vt ),
		'rating'           => '4,6 | 87 | ' . $map( 'Phòng chờ xe Hải Vân Limousine Hồ Chí Minh - Vũng Tàu' ),
		'reviews'          => $ln( array(
			'Nhà chờ xe Hải Vân tiện nghi sạch sẽ nhân viên lịch sử có nước uống cho khách đợi, nằm ngay trung tâm quận 1, rất thuận tiện cho việc đi lại mà ko di chuyển ra bến xe. | Khách đánh giá trên Google',
			'Phòng chờ sạch sẽ mát mẻ, có trà nước và bánh, nhân viên thân thiện dễ mến. Dịch vụ xe chạy đúng giờ an toàn, lái xe thân thiện vui vẻ. | Khách đánh giá trên Google',
			'Nhà xe rất oke lun nha, rất đúng giờ, tài xế lịch sự, chạy xe cũng rất an toàn luôn, xe sạch không có mùi hôi, ghế ngồi êm ái có massage. | Khách đánh giá trên Google',
		) ),
		'stats'            => "30+ | năm vận tải\n120+ | lượt xe mỗi ngày\n40+ | xe limousine\n26 | điểm đón trả",
		'story'            => 'Một đoàn 6 khách đi từ Vũng Tàu lên Tân Sơn Nhất để bay Phú Quốc. Xe xuất phát đúng giờ nhưng cả tuyến bị tắc vì sự cố, đoàn lỡ chuyến bay. Hải Vân bồi hoàn toàn bộ chi phí đổi vé máy bay cho cả 6 người và miễn phí chiều về từ sân bay.',
	),

	'my-dinh/dien-bien' => array(
		'faq_extra' => $ln( array(
			'Vé xe Hà Nội đi Điện Biên giá bao nhiêu? | Mỗi hạng xe một mức giá, giá chính xác hiện trên từng giường khi bạn mở sơ đồ. Con số "Giá từ" ở đầu trang là giá thấp nhất của các chuyến còn chỗ hôm nay; không phụ thu khi đặt trực tuyến.',
			'Muốn đi Bản Phủ hoặc Mường Chà thì chọn hành trình nào? | Chọn đúng cặp Mỹ Đình – Bản Phủ hoặc Mỹ Đình – Mường Chà, không chọn hành trình Điện Biên thay thế. Hai điểm này chỉ có trên một số chuyến; gọi 1900 6763 để xác nhận chỗ đứng đợi.',
			'Đi khứ hồi qua đêm thì chọn ngày về thế nào? | Chuyến qua đêm tới nơi vào hôm sau, nên đối chiếu ngày đến của chiều đi trước khi chọn ngày về, tính thêm thời gian ở Điện Biên và di chuyển ra điểm đón.',
			'Hai chiều có phải chọn cùng loại xe và cùng số giường không? | Không bắt buộc. Bạn chọn chuyến, hạng xe và giường riêng cho từng chiều theo chỗ còn trống, và kiểm tra cả hai chặng trước khi thanh toán.',
			'Có thể đặt nhiều giường cho cả nhóm không? | Có thể chọn một hoặc nhiều giường còn trống trên sơ đồ của chuyến. Muốn nằm gần nhau thì kiểm tra vị trí trước khi thanh toán.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì hỏi ở đâu? | Gọi 1900 6763 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến áp dụng cho vé của bạn; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "Hơn 10 giờ | Thời gian\nĐi đêm | Sáng tới nơi\n3 hạng | Giường nằm",
		'reasons_head' => 'Vì sao chọn Hải Vân | Lên Tây Bắc | theo cách chu đáo hơn. | Chặng Hà Nội – Điện Biên dài hơn mười tiếng đường đèo, nên Hải Vân chạy giường nằm buổi tối để bạn ngủ một giấc là tới nơi.',
		'reasons'      => $hv_db_reasons( true ),
		'offices'      => $hv_db_offices,
		'stops_intro'  => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Bản Phủ và Mường Chà chỉ có trên một số chuyến.',
		'stops'        => $hv_db_stops,
		'vehicle_classes' => $hv_db_classes,
		'stats'        => $hv_db_stats,
		'story'        => $hv_db_story,
	),
	'dien-bien/my-dinh' => array(
		'faq_extra' => $ln( array(
			'Vé xe Điện Biên về Hà Nội giá bao nhiêu? | Mỗi hạng xe một mức giá, giá chính xác hiện trên từng giường khi bạn mở sơ đồ. Con số "Giá từ" ở đầu trang là giá thấp nhất của các chuyến còn chỗ hôm nay.',
			'Từ Bản Phủ hoặc Mường Chà về Hà Nội thì đặt thế nào? | Chọn đúng hành trình Bản Phủ – Mỹ Đình hoặc Mường Chà – Mỹ Đình; hai điểm này chỉ có trên một số chuyến, gọi 1900 6763 để xác nhận chỗ đứng đợi.',
			'Hai chiều có phải chọn cùng loại xe và cùng số giường không? | Không bắt buộc. Bạn chọn chuyến, hạng xe và giường riêng cho từng chiều theo chỗ còn trống.',
			'Có thể đặt nhiều giường cho cả gia đình không? | Có thể chọn nhiều giường còn trống trên cùng một sơ đồ; kiểm tra vị trí trước khi thanh toán nếu muốn nằm gần nhau.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu tên điểm đón và giờ có mặt ghi trên vé. Ở Hà Nội xe trả tại Bến xe Mỹ Đình, cạnh phòng chờ 01 Nguyễn Hoàng.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì hỏi ở đâu? | Gọi 1900 6763 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "Hơn 10 giờ | Thời gian\nĐi đêm | Sáng về Hà Nội\n3 hạng | Giường nằm",
		'reasons_head' => 'Vì sao chọn Hải Vân | Về Hà Nội | theo cách chu đáo hơn. | Lên xe buổi tối ở Điện Biên, ngủ một giấc là sáng ra đã tới Mỹ Đình; ai xuống khám bệnh có xe trung chuyển miễn phí tới bệnh viện.',
		'reasons'      => $hv_db_reasons( false ),
		'offices'      => $hv_db_offices,
		'stops_intro'  => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Bản Phủ và Mường Chà chỉ có trên một số chuyến.',
		'stops'        => $hv_db_stops,
		'vehicle_classes' => $hv_db_classes,
		'stats'        => $hv_db_stats,
		'story'        => $hv_db_story,
	),
	'my-dinh/moc-chau' => array(
		'faq_extra' => $ln( array(
			'Xe Hà Nội đi Mộc Châu trả khách ở đâu tại Mộc Châu? | Tại 8 điểm: Nông trường Mộc Châu, khách sạn Mường Thanh, khách sạn Trường Giang, Bến xe Mộc Châu, văn phòng 254 Trần Huy Liệu, Bản Áng, ngã ba Pa Háng và cây xăng Mường Sang. Ghi rõ điểm hẹn khi đặt vé.',
			'Xe Hà Nội đi Mộc Châu chạy từ mấy giờ? | Xe chạy nhiều giờ trong ngày, gồm cả chuyến tối và đêm; chuyến tối hoặc đêm có thể tới nơi vào hôm sau. Lịch chạy phía trên hiển thị giờ đi, giá và chỗ còn trống của đúng ngày bạn chọn.',
			'Đặt vé Hà Nội đi Mộc Châu một chiều như thế nào? | Chọn ngày đi, xem chuyến rồi chọn chỗ còn trống; không cần nhập ngày về. Kiểm tra điểm đón, điểm trả, giờ và ngày đến trước khi thanh toán.',
			'Hải Vân Xuân Tráng có những dòng xe nào trên tuyến này? | Limousine (ghế massage, ngả và nâng hạ tuỳ chỉnh, điều hòa, cổng sạc USB, wifi) và xe giường nằm (chăn ga gối, màn hình, rèm che riêng tư). Loại xe của từng chuyến hiện trong lịch chạy.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu tên điểm đón và giờ có mặt ghi trên vé; gọi 1900 6763 hoặc 1900 9398 nếu cần xác nhận chỗ đứng đợi.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì liên hệ ở đâu? | Gọi tổng đài 1900 6763 hoặc 1900 9398 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "4h15 – 4h35 | Thời gian\n30–60 phút | Một chuyến\n11 | Điểm đón trả",
		'reasons_head' => 'Vì sao chọn Hải Vân Xuân Tráng | Lên Mộc Châu | theo cách chu đáo hơn. | Cao nguyên đồi chè đẹp nhất mùa hoa mận, hoa đào. Tuyến có nhiều giờ chạy trong ngày, cả chuyến tối và đêm.',
		'reasons'      => $mc_reasons( true ),
		'offices'      => $ln( array_merge( $xt_offices_hn, array( $xt_tram, 'Văn phòng 254 Trần Huy Liệu | Thị trấn Mộc Châu, Sơn La | | Điểm đón trả ở Mộc Châu. | ' . $map( '254 Trần Huy Liệu, Mộc Châu, Sơn La' ) . ' | Mộc Châu · Văn phòng | ' ) ) ),
		'stops_intro'  => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; không phải chuyến nào cũng phục vụ tất cả các điểm.',
		'stops'        => $mc_stops,
		'vehicle_classes' => $mc_classes,
		'stats'        => $xt_stats,
		'story'        => $xt_story,
	),
	'moc-chau/my-dinh' => array(
		'faq_extra' => $ln( array(
			'Bao lâu có một chuyến Mộc Châu về Hà Nội? | Theo nhà xe, khoảng 30 phút đến 1 giờ có một chuyến, gồm cả chuyến tối và đêm. Lịch chạy phía trên hiển thị giờ đi và chỗ còn trống của ngày bạn chọn.',
			'Nên chọn limousine hay giường nằm về Hà Nội? | Limousine có ghế massage, ngả tuỳ chỉnh và wifi, hợp chuyến ban ngày; xe giường nằm có chăn ga gối, rèm che, hợp chuyến tối. So sánh hạng xe và giá của đúng chuyến bạn định đi.',
			'Có chọn nhiều chỗ cho cả nhóm được không? | Có thể chọn một hoặc nhiều chỗ còn trống trên sơ đồ của chuyến; kiểm tra vị trí trước khi thanh toán nếu muốn ngồi gần nhau.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu tên điểm đón và giờ có mặt ghi trên vé; gọi 1900 6763 hoặc 1900 9398 nếu cần xác nhận chỗ đứng đợi.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì liên hệ ở đâu? | Gọi tổng đài 1900 6763 hoặc 1900 9398 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "4h15 – 4h35 | Thời gian\n30–60 phút | Một chuyến\n11 | Điểm đón trả",
		'reasons_head' => 'Vì sao chọn Hải Vân Xuân Tráng | Về Hà Nội | theo cách chu đáo hơn. | Lên xe ngay gần homestay, khách sạn ở Mộc Châu, về Mỹ Đình, Nguyễn Tuân hoặc Châu Văn Liêm; nhiều giờ chạy trong ngày.',
		'reasons'      => $mc_reasons( false ),
		'offices'      => $ln( array_merge( array( $xt_tram, 'Văn phòng 254 Trần Huy Liệu | Thị trấn Mộc Châu, Sơn La | | Điểm đón trả ở Mộc Châu. | ' . $map( '254 Trần Huy Liệu, Mộc Châu, Sơn La' ) . ' | Mộc Châu · Văn phòng | ' ), $xt_offices_hn ) ),
		'stops_intro'  => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; không phải chuyến nào cũng phục vụ tất cả các điểm.',
		'stops'        => $mc_stops,
		'vehicle_classes' => $mc_classes,
		'stats'        => $xt_stats,
		'story'        => $xt_story,
	),
	'my-dinh/son-la' => array(
		'faq_extra' => $ln( array(
			'Văn phòng nhà xe ở Hà Nội nằm ở đâu? | Văn phòng Hải Vân Xuân Tráng ở số 35 Nguyễn Tuân, quận Thanh Xuân. Gọi 1900 6763 hoặc 1900 9398 để hỏi giờ làm việc và đường tới văn phòng.',
			'Có chuyến Hà Nội đi Sơn La qua đêm không? | Có. Mỗi ngày có nhiều chuyến, chuyến rời bến muộn buổi tối có thể tới Sơn La vào sáng hôm sau; xem cả giờ và ngày đến trong lịch chạy.',
			'Hải Vân Xuân Tráng có những dòng xe nào trên tuyến này? | Limousine (ghế massage, ngả tuỳ chỉnh, điều hòa, cổng sạc USB, wifi) và xe giường nằm (chăn ga gối, màn hình, rèm che riêng tư). Loại xe của từng chuyến hiện trong lịch chạy.',
			'Đặt vé Hà Nội đi Sơn La online như thế nào? | Chọn ngày đi và chuyến, chọn giường trên sơ đồ rồi thanh toán; vé điện tử về thẳng điện thoại. Có thể đặt qua ứng dụng Hải Vân, website hoặc tổng đài.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu tên điểm đón và giờ có mặt ghi trên vé; ở Sơn La, ghi rõ địa chỉ để được trả tận nơi trong khu vực trung tâm.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì liên hệ ở đâu? | Gọi 1900 6763 hoặc 1900 9398 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "6 – 8 giờ | Thời gian\n30–60 phút | Một chuyến\nTận nơi | Đón trả ở Sơn La",
		'reasons_head' => 'Vì sao chọn Hải Vân Xuân Tráng | Lên Sơn La | theo cách chu đáo hơn. | Limousine và giường nằm chạy nhiều khung giờ mỗi ngày, mỗi chuyến do tài xế quen tuyến cầm lái.',
		'reasons'      => $sl_reasons( true ),
		'offices'      => $ln( array_merge( $xt_offices_hn, array( $xt_tram ) ) ),
		'stops_intro'  => 'Ở Sơn La xe đón trả tận nơi trong khu vực trung tâm thành phố; ghi địa chỉ khi đặt vé.',
		'stops'        => $sl_stops,
		'vehicle_classes' => $sl_classes,
		'stats'        => $xt_stats,
		'story'        => $xt_story,
	),
	'son-la/my-dinh' => array(
		'faq_extra' => $ln( array(
			'Xe Sơn La về Hà Nội mất bao lâu? | Khoảng 6 đến 8 tiếng, thay đổi theo chuyến, giao thông và thời tiết. Chuyến tối có thể tới Hà Nội vào sáng hôm sau, hãy xem ngày đến.',
			'Bao lâu có một chuyến Sơn La về Hà Nội? | Theo nhà xe, khoảng 30 phút đến 1 giờ có một chuyến. Lịch chạy phía trên hiển thị giờ đi và chỗ còn trống của ngày bạn chọn.',
			'Có chọn nhiều giường cho cả nhóm được không? | Có thể chọn nhiều giường còn trống trên sơ đồ của cùng một chuyến; kiểm tra vị trí trước khi thanh toán nếu muốn nằm gần nhau.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu tên điểm đón và giờ có mặt ghi trên vé; ở Sơn La, ghi rõ địa chỉ để được đón tận nơi.',
			'Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì liên hệ ở đâu? | Gọi 1900 6763 hoặc 1900 9398 để xác nhận chỗ cho trẻ và điều kiện đổi chuyến; cung cấp ngày đi, hành trình và mã vé nếu đã đặt.',
		) ),
		'facts'        => "6 – 8 giờ | Thời gian\n30–60 phút | Một chuyến\nTận nơi | Đón ở Sơn La",
		'reasons_head' => 'Vì sao chọn Hải Vân Xuân Tráng | Về Hà Nội | theo cách chu đáo hơn. | Đón tận nơi ở trung tâm Sơn La, về Mỹ Đình, Nguyễn Tuân hoặc Châu Văn Liêm; nhiều giờ chạy mỗi ngày.',
		'reasons'      => $sl_reasons( false ),
		'offices'      => $ln( array_merge( array( $xt_tram ), $xt_offices_hn ) ),
		'stops_intro'  => 'Ở Sơn La xe đón tận nơi trong khu vực trung tâm thành phố; ghi địa chỉ khi đặt vé.',
		'stops'        => $sl_stops,
		'vehicle_classes' => $sl_classes,
		'stats'        => $xt_stats,
		'story'        => $xt_story,
	),
);
