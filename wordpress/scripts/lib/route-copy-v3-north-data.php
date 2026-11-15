<?php
/**
 * Nội dung trang tuyến phía Bắc bản v3 (15/11/2026) cho route-copy-v3-north.php: 9 hướng có sẵn + 2 chiều về mới
 * (Bản Phủ → Mỹ Đình, Mường Chà → Mỹ Đình). Nguồn: 13 brief SEO (title/meta đề xuất + comment đã chốt phase 1),
 * quyết định của chủ sản phẩm (plans/261115-1844-route-seo-v3-and-micro-ui/plan.md) và lịch chạy thật trên API el/trips
 * ngày 16/11/2026 (thời gian chạy, hạng xe theo chuyến). Không bịa số liệu: chỗ chưa có dữ kiện thì dặn khách xác nhận.
 *
 * Hạng xe thống nhất theo chủ sản phẩm: Royal (22–24 giường), Luxury (34–36 giường), Eco (44 giường).
 * Ô nhiều dòng dùng dấu "|" giữa các trường như meta box (theme inc/route-meta.php); văn bản không được chứa "|".
 *
 * @return array<string, array<string, mixed>> path => trường landing (khoá như seed-route-landing.php) + 'create' cho bài mới.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

$map = static fn( $q ) => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $q );
$ln  = static fn( array $l ) => implode( "\n", $l );

/* ---------- Chính sách chung (link thật trên site) ---------- */
$policy_url = '/chinh-sach/quy-che';
$loyal_url  = '/chung-toi/chuong-trinh-khach-hang-than-thiet';
$join_url   = '/tai-khoan/khach-hang-than-thiet';
$policy_txt = 'haivan.com/chinh-sach/quy-che';
$loyal_txt  = 'haivan.com/chung-toi/chuong-trinh-khach-hang-than-thiet';

$policy_html = '<h2>Đổi, hủy vé và tích điểm</h2><p>Đổi, hủy và hoàn vé theo <a href="' . $policy_url . '">chính sách hủy vé và hoàn tiền</a> đang áp dụng; thời hạn, mức phí và số tiền được hoàn tùy điều kiện của từng vé. Trẻ từ 6 tuổi trở lên hoặc nặng trên 25 kg cần mua vé có chỗ riêng. Hội viên chương trình <a href="' . $loyal_url . '">"Tôi yêu Hải Vân"</a> đặt vé trên website hoặc ứng dụng Hải Vân được tích điểm bằng 10% giá trị vé; chưa là hội viên thì <a href="' . $join_url . '">đăng ký tham gia</a> trước khi đặt vé.</p>';

$faq_change = static fn( $route ) => "Đổi hoặc hủy vé được trong thời hạn nào? | Nếu cần đổi hoặc hủy vé, hãy báo cho Hải Vân trước giờ khởi hành và chuẩn bị mã vé, ngày đi để nhà xe kiểm tra thời hạn áp dụng cho vé {$route} của bạn. Chính sách hủy vé xem tại {$policy_txt}.";
$faq_refund = "Có hoàn tiền khi hủy vé không? | Số tiền được hoàn phụ thuộc vào điều kiện của vé và thời điểm hủy, theo chính sách hoàn tiền tại {$policy_txt}. Khi yêu cầu hủy, gọi 1900 6763 và cung cấp mã vé để được kiểm tra mức hoàn trước khi xác nhận.";
$faq_promo  = 'Mã khuyến mại có được dùng lại khi đổi hoặc hủy vé không? | Việc dùng lại mã sau khi đổi hoặc hủy vé phụ thuộc vào điều kiện của chương trình khuyến mại. Kiểm tra điều kiện của mã trước khi hủy.';
$faq_points = static fn( $route ) => "Tuyến {$route} có được tích điểm không? | Có, nếu bạn là hội viên chương trình khách hàng thân thiết \"Tôi yêu Hải Vân\" và đặt vé trên website hoặc ứng dụng Hải Vân: điểm thưởng bằng 10% giá trị vé, dùng để quy đổi sang vé. Chưa là hội viên thì đăng ký tại {$loyal_txt} trước khi thanh toán.";
$faq_child  = 'Chính sách giá vé cho trẻ em như thế nào? | Trẻ từ 6 tuổi trở lên hoặc nặng trên 25 kg cần mua vé có chỗ riêng. Với bé nhỏ hơn, hãy cung cấp tuổi của bé và cho biết bé nằm chung hay cần chỗ riêng để nhà xe xác nhận giá vé trước khi thanh toán.';
$faq_late   = "Nếu đến muộn giờ xe chạy thì vé của tôi được xử lý thế nào? | Hãy có mặt tại điểm đón trước giờ xe chạy 30 phút. Nếu có thể đến muộn, báo ngay cho nhà xe qua 1900 6763 để kiểm tra cách xử lý vé. Không nên mặc định vé sẽ được đổi chuyến hoặc hoàn tiền: việc này tùy điều kiện của vé và chính sách tại {$policy_txt}.";
$faq_free_ride = static fn( $place, $operator ) => "Có chương trình đi xe miễn phí cho người bệnh ở {$place} không? | Có. Chương trình đi xe miễn phí cho người bệnh có hoàn cảnh khó khăn đang áp dụng tại Điện Biên và Mộc Châu – Sơn La, do {$operator} cùng các phường, xã đã đồng hành tổ chức. Đối tượng và danh sách do địa phương rà soát; hỏi phường, xã nơi bạn sống hoặc gọi 1900 6763 trước khi sắp xếp chuyến đi.";
$faq_kid_change = static fn( $hotline_note ) => "Đi cùng trẻ nhỏ hoặc cần đổi chuyến thì làm thế nào? | Trẻ từ 6 tuổi trở lên hoặc nặng trên 25 kg cần mua vé có chỗ riêng; với bé nhỏ hơn, cung cấp tuổi của bé và nhu cầu dùng chỗ khi đặt vé để xác nhận cách bố trí và giá vé. Nếu cần đổi chuyến, {$hotline_note} kèm mã vé và ngày muốn đổi; thời hạn, phí và khoản chênh lệch nếu có theo chính sách tại {$policy_txt}.";

/* ---------- Hà Nội ⇄ Điện Biên (Bản Phủ, Mường Chà, Yên Nghĩa) ---------- */
$db_classes_all = array(
	'royal'  => 'Royal | 22 | | Xe 22–24 giường, mỗi khách một cabin riêng rộng gần 1 m. Ít chỗ nên yên tĩnh, hợp khi bạn muốn ngủ trọn đêm hoặc cần riêng tư. | Cabin riêng; Chăn ga gối trắng; Màn hình và bảng điều khiển; Điều hòa | dien-bien-hero-royal-bed.webp',
	'luxury' => 'Luxury | 34 | | Xe 34–36 giường, cân bằng giữa giá và sự thoải mái: khoang mobihome, giường có rèm che riêng tư, màn hình và bàn nhỏ để đồ. | Rèm che riêng tư; Màn hình riêng; Chăn gối; Điều hòa | db-class-luxury.webp',
	'eco'    => 'Eco | 44 | | Xe 44 giường, giá tiết kiệm nhất cho chặng dài: giường da, chăn gối, nước uống ướp lạnh và cổng sạc USB tại giường. | Giường da, chăn gối; Cổng sạc USB; Nước uống ướp lạnh; Điều hòa | db-class-eco.webp',
);
$db_classes = static fn( array $keys ) => $ln( array_map( static fn( $k ) => $db_classes_all[ $k ], $keys ) );

$db_stats = "30 | năm thương hiệu Hải Vân\n3 | hạng giường nằm Royal, Luxury, Eco";

$o_lounge  = 'Phòng chờ 01 Nguyễn Hoàng | 01 Nguyễn Hoàng, phường Mỹ Đình, Hà Nội, ngay cạnh Bến xe Mỹ Đình | Mở theo giờ xe, hỏi 1900 6763 | Ngồi nghỉ có điều hòa, trà bánh, trái cây; đặt vé, gửi nhận hàng; điểm hẹn xe trung chuyển tới bệnh viện cho khách chiều về (báo khi đặt vé). | ' . $map( '01 Nguyễn Hoàng, Mỹ Đình, Hà Nội' ) . ' | Hà Nội · Phòng chờ VIP | hn-lounge-front.webp';
$o_md      = 'Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm, Hà Nội | | Nơi xe xuất bến và trả khách ở đầu Hà Nội. | ' . $map( 'Bến xe Mỹ Đình, 20 Phạm Hùng, Hà Nội' ) . ' | Hà Nội · Bến xe | ';
$o_db_off  = 'Văn phòng Hải Vân Điện Biên | 300 Nguyễn Hữu Thọ, phường Mường Thanh, Điện Biên Phủ | Gọi 1900 6763 trước khi tới | Hỗ trợ đặt vé và hỏi đáp về chuyến tại Điện Biên; không mặc định là nơi xe khởi hành, hãy xem điểm đón ghi trên vé. | ' . $map( '300 Nguyễn Hữu Thọ, Mường Thanh, Điện Biên Phủ' ) . ' | Điện Biên · Văn phòng | ';
$o_db_bx   = 'Bến xe khách thành phố Điện Biên Phủ | 79 Quốc lộ 12, phường Điện Biên Phủ, tỉnh Điện Biên | | Điểm đón và trả chính ở đầu Điện Biên. | ' . $map( 'Bến xe khách thành phố Điện Biên Phủ, 79 Quốc lộ 12' ) . ' | Điện Biên · Bến xe | ';
$o_bp_mc   = 'Bản Phủ và Mường Chà | Chỉ phục vụ trên một số chuyến | | Chưa có địa chỉ cố định trên hệ thống; chọn chuyến có điểm này và gọi 1900 6763 để xác nhận vị trí, giờ hẹn trước ngày đi. | | Dọc tuyến · Điểm đón trả | ';
$o_bp      = 'Bản Phủ | Chỉ phục vụ trên một số chuyến | | Chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí và giờ hẹn trước ngày đi. | | Điện Biên · Điểm đón trả | ';
$o_mc      = 'Mường Chà | Chỉ phục vụ trên một số chuyến | | Chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí và giờ hẹn trước ngày đi. | | Điện Biên · Điểm đón trả | ';
$o_yn      = 'Bến xe Yên Nghĩa | Quốc lộ 6, quận Hà Đông, Hà Nội | | Điểm lên xe ở đầu Hà Nội của hành trình Yên Nghĩa – Điện Biên; điểm đón và giờ có mặt ghi trên vé, gọi 1900 6763 nếu cần xác nhận. | ' . $map( 'Bến xe Yên Nghĩa, Hà Đông, Hà Nội' ) . ' | Hà Nội · Bến xe | ';

$s_md     = 'Hà Nội | Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm';
$s_lounge = 'Hà Nội | Phòng chờ 01 Nguyễn Hoàng | Phường Mỹ Đình, cạnh Bến xe Mỹ Đình';
$s_db_bx  = 'Điện Biên | Bến xe khách TP. Điện Biên Phủ | 79 Quốc lộ 12, phường Điện Biên Phủ';
$s_db_off = 'Điện Biên | Văn phòng Hải Vân Điện Biên | 300 Nguyễn Hữu Thọ, phường Mường Thanh';
$s_bp     = 'Điện Biên | Bản Phủ | Chỉ một số chuyến, gọi 1900 6763 xác nhận vị trí';
$s_mc     = 'Điện Biên | Mường Chà | Chỉ một số chuyến, gọi 1900 6763 xác nhận vị trí';

$p_md     = 'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Có mặt trước giờ xe chạy';
$p_lounge = 'Phòng chờ 01 Nguyễn Hoàng | Phường Mỹ Đình, Hà Nội | Ngay cạnh Bến xe Mỹ Đình';
$p_db_bx  = 'Bến xe khách thành phố Điện Biên Phủ | 79 Quốc lộ 12, phường Điện Biên Phủ | Điểm đón trả chính ở Điện Biên';
$p_bp     = 'Bản Phủ | Chưa có địa chỉ cố định | Chỉ một số chuyến, gọi 1900 6763 để xác nhận vị trí và giờ hẹn';
$p_mc     = 'Mường Chà | Chưa có địa chỉ cố định | Chỉ một số chuyến, gọi 1900 6763 để xác nhận vị trí và giờ hẹn';

$r_nocram  = 'Không nhồi nhét, không ghế phụ | Mỗi khách có một giường được đánh số trên sơ đồ; xe không bán ghế phụ, không bố trí khách nằm sàn và chạy đúng tuyến, đúng điểm đón trả đã đăng ký với cơ quan quản lý. | dien-bien-hero-cabin-duvet.webp';
$r_lounge_go   = 'Phòng chờ ngay cạnh bến Mỹ Đình | Tới sớm thì ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng: điều hòa, trà bánh, trái cây, chỗ để hành lý; tới giờ mới ra xe. | hn-lounge-inside.webp';
$r_lounge_back = 'Phòng chờ cạnh bến Mỹ Đình | Khi đến Mỹ Đình, bạn có thể nghỉ tại phòng chờ số 01 Nguyễn Hoàng, cạnh bến xe, trong lúc chờ đi tiếp. | hn-lounge-inside.webp';
$r_hospital    = 'Trung chuyển tới bệnh viện | Hải Vân có xe trung chuyển tới bệnh viện cho khách xuống Hà Nội khám bệnh. Khi đặt vé, cung cấp tên bệnh viện và địa chỉ cơ sở để Hải Vân xác nhận điểm hẹn, giờ xe cùng điều kiện áp dụng. | hn-csr-trungchuyen.webp';
$r_online      = 'Đặt online, thanh toán VNPay | Chọn chỗ trước trên website, thanh toán qua VNPay và nhận vé điện tử ngay trên điện thoại; cần hỗ trợ thì gọi 1900 6763. | db-bus-yellow.webp';

$f_hospital = 'Xuống Hà Nội khám bệnh có xe trung chuyển không? | Có. Hải Vân có xe trung chuyển tới bệnh viện cho khách xuống Hà Nội khám bệnh. Khi đặt vé, cung cấp tên bệnh viện và địa chỉ cơ sở để Hải Vân xác nhận điểm hẹn, giờ xe và điều kiện áp dụng; dành thêm thời gian từ điểm xuống xe tới nơi khám.';
$f_md_drop  = 'Xe về Hà Nội trả khách ở đâu? | Xe trả khách tại Bến xe Mỹ Đình (số 20 Phạm Hùng). Hãy phân biệt điểm xuống xe với phòng chờ 01 Nguyễn Hoàng cạnh bến, nơi bạn có thể ngồi nghỉ khi cần chờ thêm.';
$f_md_board = 'Lên xe ở đâu tại Hà Nội? | Xe xuất bến ở Bến xe Mỹ Đình (số 20 Phạm Hùng); tới sớm có thể ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng cạnh bến. Đối chiếu giờ có mặt ghi trên vé.';

/* ---------- Hải Vân Xuân Tráng: Hà Nội ⇄ Mộc Châu / Sơn La ---------- */
$xt_stats = "30 | năm thương hiệu Hải Vân\n≈ 2.000 | thẻ đồng hành cho học sinh 2K8\n5 triệu | giá trị mỗi thẻ đồng hành";
$xt_office_nt = 'Văn phòng 35 Nguyễn Tuân | Số 35 Nguyễn Tuân, quận Thanh Xuân, Hà Nội | Kiểm tra giờ làm việc qua 1900 6763 trước khi đến | Văn phòng Hải Vân Xuân Tráng ở Hà Nội, đồng thời là một điểm đón trả tùy chuyến. | ' . $map( '35 Nguyễn Tuân, Thanh Xuân, Hà Nội' ) . ' | Hà Nội · Văn phòng nhà xe | ';
$xt_tram      = 'Trạm dừng nghỉ Mộc Châu | Tổ dân phố 70, phường Vân Sơn, Mộc Châu, Sơn La | Gọi 1900 6763 để hỏi giờ | Phòng chờ và điểm giao nhận hàng hoá của Hải Vân Xuân Tráng; nếu định chờ xe ở đây, kiểm tra chuyến đã đặt có đón tại trạm hay không. | ' . $map( 'Tổ dân phố 70, Vân Sơn, Mộc Châu, Sơn La' ) . ' | Mộc Châu · Trạm dừng nghỉ | hvxt-tram-dung-nghi.webp';
$xt_off_thl   = 'Văn phòng 254 Trần Huy Liệu | Thị trấn Mộc Châu, Sơn La | | Một trong các điểm đón trả ở Mộc Châu. | ' . $map( '254 Trần Huy Liệu, Mộc Châu, Sơn La' ) . ' | Mộc Châu · Văn phòng | ';
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
$mc_drop_list = 'Nông trường Mộc Châu, khách sạn Mường Thanh, khách sạn Trường Giang, Bến xe Mộc Châu, văn phòng 254 Trần Huy Liệu, Bản Áng, ngã ba Pa Háng và cây xăng Mường Sang';
// Lịch chạy thật: "Royal" trên tuyến Mộc Châu là limousine 9–11 chỗ; giường nằm 22–24, 34–36, 44 chỗ chạy qua Mộc Châu.
$mc_classes = $ln( array(
	'Royal | | | Hạng ít chỗ, yên tĩnh nhất: limousine 9–11 chỗ ghế massage ngả và nâng hạ tuỳ chỉnh, hợp chuyến ban ngày; một số chuyến tối là giường nằm 22–24 chỗ. Loại xe ghi trên từng chuyến. | Ghế massage hoặc giường riêng; Điều hòa; Cổng sạc USB | hvxt-moc-chau-limo-interior-1.webp',
	'Luxury | 34 | | Xe giường nằm 34–36 chỗ, cân bằng giữa giá và sự thoải mái: chăn ga gối, rèm che riêng tư; hợp chuyến tối và đêm. | Chăn ga gối; Rèm che riêng tư; Cổng sạc USB | hvxt-sleeper-interior-blue.webp',
	'Eco | 44 | | Xe giường nằm 44 chỗ, giá tiết kiệm nhất; có trên một số chuyến đi qua Mộc Châu. | Chăn gối; Cổng sạc USB; Điều hòa | hvxt-son-la-bus-night.webp',
) );
$sl_classes = $ln( array(
	'Royal | 22 | | Xe 22–24 giường, ít chỗ nên yên tĩnh, hợp khi bạn muốn nghỉ trọn chặng: chăn ga gối, màn hình riêng, rèm che hoặc cabin riêng tùy xe. | Màn hình riêng; Chăn ga gối; Rèm che riêng tư | hvxt-sleeper-interior-starry.webp',
	'Luxury | 34 | | Xe 34–36 giường, cân bằng giữa giá và sự thoải mái: chăn ga gối, rèm che riêng tư. | Chăn ga gối; Rèm che riêng tư; Cổng sạc USB | hvxt-sleeper-interior-blue.webp',
	'Eco | 44 | | Xe 44 giường, giá tiết kiệm nhất cho chặng dài; có trên một số chuyến. | Chăn gối; Cổng sạc USB; Điều hòa | hvxt-son-la-bus-night.webp',
) );
$sl_stops = static fn( $go ) => $ln( array(
	'Hà Nội | Bến xe Mỹ Đình | Số 20 Phạm Hùng, phường Từ Liêm',
	'Hà Nội | 35 Nguyễn Tuân | Quận Thanh Xuân, văn phòng nhà xe',
	'Hà Nội | 10 Châu Văn Liêm | Quận Nam Từ Liêm',
	$go ? 'Sơn La | Trả tận nơi | Trung tâm thành phố Sơn La, ghi địa chỉ khi đặt vé' : 'Sơn La | Đón trong trung tâm | Thành phố Sơn La, ghi địa chỉ khi đặt vé để xác nhận điểm hẹn',
	'Sơn La | Bến xe Sơn La | Gọi 1900 6763 xác nhận vị trí chờ và giờ có mặt',
) );
$xt_hn_pick = 'Điểm đón tại Hà Nội | Các điểm đón gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến. Chọn chuyến có điểm đón phù hợp và kiểm tra giờ có mặt. | hvxt-son-la-bus-side.webp';
$xt_hn_drop = static fn( $from ) => "Điểm trả tại Hà Nội | Gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến. Khi đặt vé từ {$from}, hãy chọn chuyến có điểm trả bạn cần. | hvxt-son-la-bus-side.webp";
$xt_seat    = static fn( $what ) => "Tự chọn chỗ, lưu vé điện tử | Chọn ghế hoặc giường còn trống trên sơ đồ của chuyến, kiểm tra thông tin trước khi thanh toán và lưu vé điện tử để đối chiếu {$what} khi lên xe. | hvxt-sleeper-interior-starry.webp";
$xt_kid     = $faq_kid_change( 'liên hệ 1900 6763' );
$xt_group   = static fn( $what ) => "Có chọn nhiều chỗ cho cả nhóm được không? | Được, chọn một hoặc nhiều {$what} còn trống trên sơ đồ của chuyến. Muốn ngồi hoặc nằm gần nhau thì kiểm tra vị trí trước khi thanh toán; hệ thống không mặc định cả nhóm có chỗ liền nhau.";

return array(

	/* ===================== 05 · Hà Nội → Điện Biên ===================== */
	'my-dinh/dien-bien' => array(
		'seo_title'        => 'Xe khách Hà Nội đi Điện Biên, đón tại Mỹ Đình | Hải Vân',
		'meta_description' => 'Xe khách Hải Vân từ Mỹ Đình, Hà Nội đi Điện Biên vào ban đêm, dự kiến đến sáng hôm sau. Có 3 hạng giường nằm; chọn chỗ trước và nhận vé trên điện thoại.',
		'h1'               => 'Đặt vé xe Hà Nội đi Điện Biên',
		'intro'            => 'Xe giường nằm Hải Vân rời Bến xe Mỹ Đình buổi tối và dự kiến tới Điện Biên vào sáng hôm sau. Chọn hạng Royal, Luxury hoặc Eco, chọn giường trên sơ đồ và nhận vé điện tử trên điện thoại.',
		'schedule_text'    => '<p>Xe chạy qua đêm nên hãy xem kỹ ngày đến của chuyến. Mỗi hạng một mức giá, giá chính xác hiện trên từng giường khi bạn mở sơ đồ. Giờ xuất bến cụ thể nằm ở bảng bên dưới.</p>',
		'facts'            => "Hơn 10 giờ | Thời gian\nĐi đêm | Dự kiến sáng hôm sau\n3 hạng | Royal, Luxury, Eco",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Lên Tây Bắc | theo cách chu đáo hơn. | Chặng Hà Nội – Điện Biên kéo dài hơn mười tiếng. Xe giường nằm chạy buổi tối để bạn nghỉ ngơi trên đường; hãy xem giờ đến dự kiến khi sắp xếp lịch trình.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến đến sáng hôm sau | Xe rời Hà Nội buổi tối và di chuyển qua đêm. Kiểm tra cả ngày đến lẫn giờ đến dự kiến để sắp xếp việc nhận phòng hoặc đi tiếp tại Điện Biên. | dien-bien-hero-bus.webp',
			'Ba hạng giường nằm | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng; Eco giá tiết kiệm nhất, giường da, chăn gối, cổng sạc USB. | dien-bien-hero-berth-aisle.webp',
			$r_nocram,
			$r_lounge_go,
			'Trung chuyển bệnh viện ở chiều về | Hải Vân có xe trung chuyển tới bệnh viện cho khách xuống Hà Nội khám bệnh. Xem điểm trả và dịch vụ trung chuyển trên chiều về từ Điện Biên đến Hà Nội. | hn-csr-trungchuyen.webp',
			'Gửi hàng tuyến Hà Nội – Điện Biên | Nếu cần gửi hàng, hãy cung cấp loại hàng, kích thước và khối lượng để Hải Vân xác nhận khả năng nhận vận chuyển, cước phí, điểm giao nhận và thời gian dự kiến. | hn-ship-1.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Hà Nội đi Điện Biên chạy mất bao lâu? | Theo lịch chạy hiện tại khoảng 10 giờ 10 phút; xe rời bến buổi tối và dự kiến tới nơi vào sáng hôm sau. Giờ cụ thể của từng chuyến xem ở bảng chuyến, thời gian thực tế đổi theo giao thông và thời tiết.',
			'Đi Điện Biên nên chọn hạng xe nào? | Royal là cabin riêng, ít chỗ nên yên tĩnh, hợp khi bạn muốn ngủ trọn đêm; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng; Eco là hạng tiết kiệm nhất với giường da, chăn gối và sạc USB. Chọn theo ngân sách và mức riêng tư bạn cần.',
			'Chờ xe ở Hà Nội ở đâu cho thoải mái? | Phòng chờ Hải Vân ở 01 Nguyễn Hoàng, phường Mỹ Đình, cạnh Bến xe Mỹ Đình, có điều hòa, chỗ ngồi, trà bánh và trái cây.',
			'Xe có nhồi nhét hay bán ghế phụ không? | Không. Mỗi khách có một giường được đánh số trên sơ đồ; xe không bán ghế phụ và không bố trí khách nằm sàn.',
			'Xuống Hà Nội khám bệnh có xe trung chuyển không? | Có, trên chiều về. Nếu cần đến bệnh viện trên chiều Điện Biên về Hà Nội, hãy cung cấp tên cơ sở và địa chỉ khi đặt vé để Hải Vân xác nhận khả năng trung chuyển, điểm đón và điều kiện áp dụng.',
			'Có gửi hàng theo tuyến Hà Nội đến Điện Biên không? | Bạn có thể gửi yêu cầu vận chuyển hàng từ Hà Nội đến Điện Biên, kèm loại hàng, kích thước và khối lượng. Hải Vân sẽ xác nhận khả năng nhận hàng, cước phí, địa điểm giao nhận và thời gian dự kiến trước khi gửi.',
			'Làm sao biết đúng điểm đón và trả của tôi? | Kiểm tra cả điểm đón tại Hà Nội, giờ có mặt và điểm trả ở Điện Biên ghi trên vé. Nếu xuống Bản Phủ hoặc Mường Chà, hãy chọn chuyến có điểm trả tương ứng và xác nhận vị trí xuống xe trước ngày đi.',
			'Vé xe Hà Nội đi Điện Biên giá bao nhiêu? | Mở sơ đồ chuyến Mỹ Đình đi Điện Biên để xem giá từng giường còn trống. Kiểm tra tổng tiền trước khi thanh toán.',
			'Muốn đi Bản Phủ hoặc Mường Chà thì chọn hành trình nào? | Chọn hành trình Mỹ Đình – Bản Phủ hoặc Mỹ Đình – Mường Chà nếu có chuyến phù hợp trong ngày đi. Kiểm tra điểm trả của chuyến và xác nhận vị trí xuống xe trước khi đặt.',
			'Đi khứ hồi qua đêm thì chọn ngày về thế nào? | Chuyến qua đêm tới nơi vào hôm sau, nên đối chiếu ngày đến của chiều đi trước khi chọn ngày về, tính thêm thời gian ở Điện Biên và di chuyển ra điểm đón.',
			'Hai chiều có phải chọn cùng loại xe và cùng số giường không? | Không bắt buộc. Bạn chọn chuyến, hạng xe và giường riêng cho từng chiều theo chỗ còn trống, và kiểm tra cả hai chặng trước khi thanh toán.',
			'Có thể đặt nhiều giường cho cả nhóm không? | Có thể chọn một hoặc nhiều giường còn trống trên sơ đồ của chuyến. Muốn nằm gần nhau thì kiểm tra vị trí trước khi thanh toán.',
			$faq_kid_change( 'gọi 1900 6763' ),
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Lên Tây Bắc bằng xe giường nằm</h2><p>Với chặng đi kéo dài hơn mười tiếng, bạn nên chọn vị trí giường phù hợp để nghỉ ngơi trên xe. Chuyến xuất phát buổi tối dự kiến đến Điện Biên vào sáng hôm sau, nên hãy kiểm tra kỹ ngày đến khi sắp xếp lịch trình.</p><ul><li>Ba hạng: Royal (cabin riêng, ít chỗ, yên tĩnh), Luxury (giường có rèm che, màn hình riêng) và Eco (giường da, chăn gối, sạc USB, giá tiết kiệm nhất).</li><li>Mỗi khách một giường đánh số; Hải Vân không bán ghế phụ, không cho nằm sàn.</li><li>Tới sớm ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng, ngay cạnh Bến xe Mỹ Đình: điều hòa, trà bánh, chỗ để hành lý.</li><li>Nếu đặt thêm chiều Điện Biên về Hà Nội để đi khám bệnh, hãy xác nhận riêng dịch vụ trung chuyển đến đúng cơ sở và dành thêm thời gian từ điểm trả đến nơi khám.</li></ul><h2>Điểm đón và trả</h2><p>Chiều Hà Nội đi Điện Biên xuất phát từ Bến xe Mỹ Đình. Khi đặt vé, hãy kiểm tra điểm trả tại Bến xe khách thành phố Điện Biên Phủ, Bản Phủ hoặc Mường Chà theo chuyến bạn chọn; không mặc định mọi chuyến đều trả ở cả ba nơi.</p><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( $p_md, $p_lounge, $p_db_bx ) ),
		'offices'          => $ln( array( $o_lounge, $o_md, $o_db_off, $o_db_bx, $o_bp_mc ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; không mặc định mọi chuyến đều dừng ở Bản Phủ và Mường Chà.',
		'stops'            => $ln( array( $s_md, $s_lounge, $s_db_bx, $s_db_off, $s_bp, $s_mc ) ),
		'vehicle_classes'  => $db_classes( array( 'royal', 'luxury', 'eco' ) ),
		'related'          => $ln( array( 'Yên Nghĩa đi Điện Biên | yen-nghia/dien-bien', 'Mỹ Đình đi Bản Phủ | my-dinh/ban-phu', 'Mỹ Đình đi Mường Chà | my-dinh/muong-cha', 'Hà Nội đi Sơn La | my-dinh/son-la' ) ),
		'reverse'          => 'Điện Biên về Hà Nội | dien-bien/my-dinh',
		'round_trip_note'  => 'Đi khứ hồi: chọn chuyến, hạng xe và giường riêng cho từng chiều. Chuyến qua đêm có thể tới nơi vào hôm sau, hãy đối chiếu ngày đến của chiều đi trước khi chọn ngày về. Gọi 1900 6763 nếu cần hỗ trợ.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== 06 · Điện Biên → Hà Nội ===================== */
	'dien-bien/my-dinh' => array(
		'seo_title'        => 'Xe giường nằm Điện Biên về Hà Nội (Mỹ Đình) | Hải Vân',
		'meta_description' => 'Từ Điện Biên về Mỹ Đình, Hà Nội bằng xe giường nằm Hải Vân chạy đêm. Chọn hạng Royal, Luxury hoặc Eco, xem sơ đồ giường và đặt vé trực tuyến.',
		'h1'               => 'Đặt vé xe Điện Biên về Hà Nội',
		'intro'            => 'Xe giường nằm Hải Vân rời Điện Biên buổi tối, dự kiến về tới Hà Nội sáng hôm sau. Bản Phủ và Mường Chà chỉ có trên một số chuyến: chọn điểm đón khi đặt vé và gọi 1900 6763 nếu cần xác nhận vị trí chờ xe.',
		'schedule_text'    => '<p>Xe chạy qua đêm nên bạn lưu ý ngày đến Hà Nội của chuyến. Giá mỗi hạng xe khác nhau, giá chính xác hiện trên từng giường khi bạn mở sơ đồ. Bản Phủ và Mường Chà chỉ đón trả ở một số chuyến.</p>',
		'facts'            => "Hơn 10 giờ | Thời gian\nĐi đêm | Dự kiến sáng về Hà Nội\n3 hạng | Royal, Luxury, Eco",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Về Hà Nội | theo cách chu đáo hơn. | Xe xuất phát từ Điện Biên buổi tối, dự kiến đến Mỹ Đình vào sáng hôm sau. Nếu xuống Hà Nội khám bệnh, hãy xác nhận trước khả năng trung chuyển đến đúng cơ sở.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến về Hà Nội sáng hôm sau | Chuyến xe di chuyển qua đêm trên hành trình hơn mười tiếng. Hãy kiểm tra ngày đến và giờ đến dự kiến trước khi sắp xếp công việc tại Hà Nội. | dien-bien-hero-bus.webp',
			'Ba hạng giường nằm | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng; Eco giá tiết kiệm nhất, giường da, chăn gối, cổng sạc USB. | dien-bien-hero-berth-aisle.webp',
			$r_nocram,
			$r_lounge_back,
			$r_hospital,
			'Gửi hàng tuyến Điện Biên – Hà Nội | Nếu cần gửi hàng về Hà Nội, hãy cung cấp loại hàng, kích thước và khối lượng để xác nhận khả năng nhận vận chuyển, cước phí, điểm giao nhận và thời gian dự kiến. | hn-ship-1.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Điện Biên về Hà Nội tới Mỹ Đình lúc mấy giờ? | Xe rời bến buổi tối và dự kiến tới nơi vào sáng hôm sau; theo lịch chạy hiện tại hành trình khoảng 10 giờ đến 10 giờ 10 phút. Giờ và ngày đến cụ thể xem ở bảng chuyến; giờ đến có thể đổi theo giao thông và thời tiết.',
			'Tôi xuống Hà Nội khám bệnh, có kịp giờ và có xe đưa tới bệnh viện không? | Hãy đối chiếu giờ đến dự kiến tại Hà Nội với giờ hẹn khám, đồng thời dành thêm thời gian di chuyển và làm thủ tục. Hải Vân có xe trung chuyển tới bệnh viện: cung cấp tên bệnh viện, địa chỉ cơ sở khi đặt vé để được xác nhận khả năng phục vụ và điều kiện áp dụng.',
			'Lên xe ở đâu tại Điện Biên? | Điểm đón chính là Bến xe khách thành phố Điện Biên Phủ, 79 Quốc lộ 12, phường Điện Biên Phủ. Nếu lên xe tại Bản Phủ hoặc Mường Chà, hãy chọn chuyến có điểm đón tương ứng và xác nhận vị trí, giờ hẹn trước ngày đi.',
			'Đi khứ hồi Mỹ Đình – Điện Biên cần lưu ý gì? | Chọn chuyến, hạng xe và giường riêng cho từng chiều. Chuyến qua đêm có thể đến vào hôm sau, hãy đối chiếu ngày đến của chiều đi trước khi chọn ngày về.',
			'Chọn hạng Royal, Luxury hay Eco? | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng; Eco giá tiết kiệm nhất với giường da, chăn gối, sạc USB. Chọn theo ngân sách và mức riêng tư bạn cần.',
			'Văn phòng Hải Vân ở Điện Biên nằm đâu? | Văn phòng Hải Vân ở 300 Nguyễn Hữu Thọ, phường Mường Thanh, Điện Biên Phủ. Nếu tới để lên xe, hãy đối chiếu với điểm đón ghi trên vé, không mặc định văn phòng là nơi khởi hành.',
			'Xe có nhồi nhét hay bán ghế phụ không? | Không. Mỗi khách có một giường được đánh số trên sơ đồ; xe không bán ghế phụ và không bố trí khách nằm sàn.',
			'Có gửi hàng từ Điện Biên về Hà Nội không? | Bạn có thể gửi yêu cầu vận chuyển hàng từ Điện Biên về Hà Nội, kèm loại hàng, kích thước và khối lượng. Hãy xác nhận điểm gửi tại Điện Biên, điểm nhận ở Hà Nội, cước phí và thời gian dự kiến trước khi giao hàng.',
			'Vé xe Điện Biên về Hà Nội giá bao nhiêu? | Chọn ngày đi, chuyến và vị trí giường để xem giá vé cụ thể cho chiều Điện Biên về Hà Nội. Kiểm tra tổng tiền trước khi thanh toán.',
			'Từ Bản Phủ hoặc Mường Chà về Hà Nội thì đặt thế nào? | Chọn hành trình Bản Phủ – Mỹ Đình hoặc Mường Chà – Mỹ Đình nếu có chuyến phù hợp trong ngày đi. Xác nhận vị trí đón và giờ có mặt trước ngày khởi hành.',
			'Hai chiều có phải chọn cùng loại xe và cùng số giường không? | Không bắt buộc. Bạn chọn chuyến, hạng xe và giường riêng cho từng chiều theo chỗ còn trống.',
			'Có thể đặt nhiều giường cho cả gia đình không? | Có thể chọn nhiều giường còn trống trên cùng một sơ đồ; kiểm tra vị trí trước khi thanh toán nếu muốn nằm gần nhau.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Đối chiếu cả điểm đón, giờ có mặt và điểm trả ghi trên vé. Nếu xuống Bến xe Mỹ Đình, hãy phân biệt điểm xuống xe với phòng chờ 01 Nguyễn Hoàng cạnh bến.',
			$faq_kid_change( 'gọi 1900 6763' ),
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Ngủ một giấc, sáng về Hà Nội</h2><p>Chặng Điện Biên – Hà Nội kéo dài hơn mười tiếng, với các chuyến giường nằm xuất phát buổi tối và dự kiến đến vào sáng hôm sau. Hãy kiểm tra ngày đến, giờ đến dự kiến và chừa thêm thời gian nếu có lịch hẹn tại Hà Nội.</p><ul><li>Lên xe ở Bến xe khách thành phố Điện Biên Phủ (79 Quốc lộ 12), hoặc ở Bản Phủ, Mường Chà trên một số chuyến.</li><li>Ba hạng giường nằm: Royal, Luxury và Eco; mỗi khách một giường đánh số, không ghế phụ, không nằm sàn.</li><li>Xuống ở Bến xe Mỹ Đình; ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng cạnh bến nếu bạn cần chờ thêm.</li><li>Nếu xuống Hà Nội khám bệnh, hãy cung cấp tên bệnh viện và địa chỉ cơ sở khi đặt vé để xác nhận khả năng trung chuyển, điểm hẹn và điều kiện áp dụng. Dành thêm thời gian từ điểm xuống xe đến nơi khám, thay vì chỉ tính giờ xe tới Mỹ Đình.</li></ul><h2>Văn phòng và điểm hẹn</h2><p>Văn phòng Hải Vân ở Điện Biên nằm tại 300 Nguyễn Hữu Thọ, phường Mường Thanh, Điện Biên Phủ. Hãy kiểm tra điểm đón ghi trên vé; nếu lên xe ở Bản Phủ hoặc Mường Chà, cần xác nhận rõ vị trí và giờ hẹn trước ngày đi. Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array(
			$p_db_bx,
			$p_bp,
			$p_mc,
			'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Nơi xe trả khách ở đầu Hà Nội',
			'Phòng chờ 01 Nguyễn Hoàng | Phường Mỹ Đình, Hà Nội | Cạnh Bến xe Mỹ Đình, điểm hẹn xe trung chuyển bệnh viện (xác nhận khi đặt vé)',
		) ),
		'offices'          => $ln( array( $o_db_bx, $o_db_off, $o_bp_mc, $o_lounge, $o_md ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Bản Phủ và Mường Chà chỉ có trên một số chuyến.',
		'stops'            => $ln( array( $s_db_bx, $s_db_off, $s_bp, $s_mc, $s_md, $s_lounge ) ),
		'vehicle_classes'  => $db_classes( array( 'royal', 'luxury', 'eco' ) ),
		'related'          => $ln( array( 'Hà Nội đi Điện Biên | my-dinh/dien-bien', 'Bản Phủ về Hà Nội | ban-phu/my-dinh', 'Mường Chà về Hà Nội | muong-cha/my-dinh', 'Sơn La về Hà Nội | son-la/my-dinh', 'Mộc Châu về Hà Nội | moc-chau/my-dinh' ) ),
		'reverse'          => 'Hà Nội đi Điện Biên | my-dinh/dien-bien',
		'round_trip_note'  => 'Trang này bán vé một chiều Điện Biên về Hà Nội. Nếu đã có chiều đi, chọn ngày về sau giờ đến của chiều đi vì chuyến qua đêm có thể đến vào hôm sau.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== 07 · Yên Nghĩa → Điện Biên ===================== */
	'yen-nghia/dien-bien' => array(
		'seo_title'        => 'Đặt vé xe Yên Nghĩa đi Điện Biên | Hải Vân',
		'meta_description' => 'Đặt vé Hải Vân từ bến xe Yên Nghĩa, Hà Nội đi Điện Biên. Chọn chỗ trước trên website, thanh toán qua VNPay và nhận vé trên điện thoại; hỗ trợ 1900 6763.',
		'h1'               => 'Xe khách Yên Nghĩa đi Điện Biên',
		'intro'            => 'Xe giường nằm Hải Vân từ Yên Nghĩa, Hà Nội đi Điện Biên chạy qua đêm và dự kiến tới nơi sáng hôm sau. Chọn ngày đi để xem chuyến còn chỗ, điểm lên xe, giờ có mặt và giờ đến dự kiến.',
		'schedule_text'    => '<p>Xe đi qua đêm. Khi chọn chuyến, hãy xem giờ xuất bến tại Yên Nghĩa và giờ đến Điện Biên vào ngày hôm sau. Giá đổi theo hạng xe và vị trí giường, giá chính xác hiện khi bạn mở sơ đồ.</p>',
		'facts'            => "Đi đêm | Dự kiến sáng hôm sau\n3 hạng | Royal, Luxury, Eco",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Lên Điện Biên | theo cách chu đáo hơn. | Chặng Hà Nội – Điện Biên dài, xe giường nằm chạy buổi tối để bạn nghỉ ngơi trên đường; hãy xem giờ đến dự kiến khi sắp xếp lịch trình.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến đến sáng hôm sau | Xe đi qua đêm. Khi chọn chuyến, hãy xem giờ xuất bến tại Yên Nghĩa và giờ đến Điện Biên vào ngày hôm sau. | dien-bien-hero-bus.webp',
			'Ba hạng giường nằm | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng; Eco giá tiết kiệm nhất. Hạng xe ghi trên từng chuyến. | dien-bien-hero-berth-aisle.webp',
			'Trung chuyển với hạng Royal | Dịch vụ đón trả tại nhà và xe trung chuyển cần được xác nhận theo chuyến. Nếu chọn hạng Royal, hãy kiểm tra điểm trả và phạm vi trung chuyển trước khi đặt vé. | dien-bien-hero-royal-bed.webp',
			$r_nocram,
			$r_online,
			'Gửi hàng tuyến Hà Nội – Điện Biên | Nếu cần gửi hàng, hãy cung cấp loại hàng, kích thước và khối lượng để Hải Vân xác nhận khả năng nhận vận chuyển, cước phí, điểm giao nhận và thời gian dự kiến. | hn-ship-1.webp',
		) ),
		'faq'              => $ln( array(
			'Chuyến muộn nhất từ Yên Nghĩa đi Điện Biên là mấy giờ? | Bạn hãy xem lịch chạy tuyến Yên Nghĩa đi Điện Biên theo ngày đi để xác định giờ khởi hành của chuyến muộn nhất.',
			'Xe Yên Nghĩa đi Điện Biên chạy bao lâu? | Xe đi qua đêm. Khi chọn chuyến, hãy xem giờ xuất bến tại Yên Nghĩa và giờ đến Điện Biên vào ngày hôm sau.',
			'Xe Yên Nghĩa đi Điện Biên có đón trả tại nhà và có xe trung chuyển không? | Dịch vụ đón trả tại nhà và xe trung chuyển cần được xác nhận theo chuyến. Nếu chọn hạng Royal, bạn nên kiểm tra điểm trả và phạm vi trung chuyển trước khi đặt vé.',
			'Vé xe Yên Nghĩa đi Điện Biên giá bao nhiêu? | Chọn ngày đi và chuyến, mở sơ đồ để xem giá từng giường còn trống theo hạng Royal, Luxury hoặc Eco. Kiểm tra tổng tiền trước khi thanh toán.',
			$faq_change( 'Yên Nghĩa đi Điện Biên' ),
			$faq_refund,
			$faq_promo,
			$faq_points( 'Yên Nghĩa – Điện Biên' ),
			$faq_child,
			$faq_late,
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Đi Điện Biên từ Yên Nghĩa</h2><p>Chặng Hà Nội – Điện Biên dài, nên các chuyến giường nằm chạy buổi tối và dự kiến đến vào sáng hôm sau. Hãy xem cả giờ xuất bến tại Yên Nghĩa lẫn ngày, giờ đến Điện Biên khi chọn chuyến.</p><ul><li>Ba hạng giường nằm: Royal (cabin riêng, ít chỗ, yên tĩnh), Luxury (cân bằng giữa giá và sự thoải mái) và Eco (giá tiết kiệm nhất).</li><li>Có mặt tại điểm đón trước giờ xe chạy 30 phút; điểm lên xe và giờ có mặt ghi trên vé, gọi 1900 6763 nếu cần xác nhận.</li><li>Ở Điện Biên, kiểm tra điểm trả ghi trên vé trước ngày đi.</li><li>Chiều về hiện chưa có chuyến Điện Biên – Yên Nghĩa; về Hà Nội, chọn chuyến Điện Biên – Mỹ Đình.</li></ul><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( 'Bến xe Yên Nghĩa | Quốc lộ 6, quận Hà Đông, Hà Nội | Điểm đón và giờ có mặt ghi trên vé', $p_db_bx ) ),
		'offices'          => $ln( array( $o_yn, $o_db_bx, $o_db_off ) ),
		'stops_intro'      => 'Đối chiếu điểm lên xe, giờ có mặt và điểm trả ghi trên vé; gọi 1900 6763 nếu cần xác nhận trước ngày đi.',
		'stops'            => $ln( array( 'Hà Nội | Bến xe Yên Nghĩa | Quốc lộ 6, quận Hà Đông', $s_db_bx ) ),
		'vehicle_classes'  => $db_classes( array( 'royal', 'luxury', 'eco' ) ),
		'related'          => $ln( array( 'Hà Nội đi Điện Biên | my-dinh/dien-bien', 'Mỹ Đình đi Bản Phủ | my-dinh/ban-phu', 'Mỹ Đình đi Mường Chà | my-dinh/muong-cha', 'Điện Biên về Hà Nội | dien-bien/my-dinh' ) ),
		'reverse'          => 'Điện Biên về Hà Nội (Mỹ Đình) | dien-bien/my-dinh',
		'round_trip_note'  => 'Chiều về hiện chưa có chuyến Điện Biên – Yên Nghĩa; về Hà Nội, chọn chuyến Điện Biên – Mỹ Đình ở trang chiều về. Chuyến qua đêm có thể tới nơi vào hôm sau, hãy đối chiếu ngày đến của chiều đi trước khi chọn ngày về.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== 08 · Mỹ Đình → Bản Phủ ===================== */
	'my-dinh/ban-phu' => array(
		'seo_title'        => 'Xe giường nằm Mỹ Đình đi Bản Phủ, Điện Biên | Hải Vân',
		'meta_description' => 'Đi Bản Phủ, Điện Biên bằng xe giường nằm Hải Vân từ Mỹ Đình, Hà Nội. Chọn chỗ theo sơ đồ, thanh toán qua VNPay và nhận vé ngay trên điện thoại.',
		'h1'               => 'Đặt vé xe Mỹ Đình đi Bản Phủ',
		'intro'            => 'Xe giường nằm Hải Vân rời Bến xe Mỹ Đình buổi tối, đi qua đêm tới Bản Phủ, Điện Biên. Bản Phủ chỉ có trên một số chuyến: chọn ngày đi để xem chuyến còn chỗ, điểm trả và giờ đến dự kiến.',
		'schedule_text'    => '<p>Chỉ một số chuyến Hà Nội – Điện Biên có điểm trả Bản Phủ, hãy chọn đúng hành trình Mỹ Đình – Bản Phủ. Thời gian đi tùy chuyến; xem giờ và ngày đến ở bảng bên dưới hoặc gọi 1900 6763 để xác nhận giờ đến tại điểm xuống của bạn.</p>',
		'facts'            => "≈ 10 giờ 40 | Thời gian dự kiến\nĐi đêm | Dự kiến sáng hôm sau\nGiường nằm | Royal, Luxury",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Lên Bản Phủ | theo cách chu đáo hơn. | Xe giường nằm chạy buổi tối từ Mỹ Đình để bạn nghỉ ngơi trên đường, dự kiến tới Bản Phủ vào sáng hôm sau.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến sáng tới Bản Phủ | Thời gian đi tùy chuyến, theo lịch chạy hiện tại khoảng 10 giờ 40 phút. Kiểm tra cả ngày đến lẫn giờ đến dự kiến trước khi sắp xếp việc tại Bản Phủ. | dien-bien-hero-bus.webp',
			'Giường nằm Royal và Luxury | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái, giường có rèm che và màn hình riêng. Hạng xe ghi trên từng chuyến. | dien-bien-hero-cabin-bed.webp',
			'Trung chuyển tại Bản Phủ cho khách Royal | Khách đi hạng Royal có thể đăng ký trung chuyển tại Bản Phủ. Khi đặt vé, hãy cho Hải Vân biết địa chỉ để xác nhận điểm trả. | dien-bien-hero-royal-bed.webp',
			$r_nocram,
			$r_lounge_go,
			$r_online,
		) ),
		'faq'              => $ln( array(
			'Chuyến muộn nhất từ Mỹ Đình đi Bản Phủ là mấy giờ? | Bạn hãy xem lịch chạy tuyến Mỹ Đình đi Bản Phủ theo ngày đi để xác định giờ khởi hành của chuyến muộn nhất.',
			'Xe Mỹ Đình đi Bản Phủ chạy bao lâu? | Thời gian đi từ Mỹ Đình đến Bản Phủ tùy chuyến; theo lịch chạy hiện tại khoảng 10 giờ 40 phút, xe đi qua đêm. Gọi 1900 6763 để xác nhận giờ đến tại điểm xuống của bạn.',
			'Xe đi Bản Phủ có đón trả tại nhà và có xe trung chuyển không? | Khách đi hạng Royal có thể đăng ký trung chuyển tại Bản Phủ. Khi đặt vé, hãy cho Hải Vân biết địa chỉ để xác nhận điểm trả.',
			$f_md_board,
			'Vé xe Mỹ Đình đi Bản Phủ giá bao nhiêu? | Mở sơ đồ chuyến để xem giá từng giường còn trống; giá tùy hạng xe và vị trí giường. Kiểm tra tổng tiền trước khi thanh toán.',
			$faq_change( 'Mỹ Đình đi Bản Phủ' ),
			$faq_refund,
			$faq_promo,
			$faq_points( 'Mỹ Đình – Bản Phủ' ),
			$faq_child,
			$faq_late,
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Đi Bản Phủ bằng xe giường nằm</h2><p>Chỉ một số chuyến Hà Nội – Điện Biên có điểm trả Bản Phủ, vì vậy hãy chọn đúng hành trình Mỹ Đình – Bản Phủ thay vì hành trình Điện Biên. Xe rời Bến xe Mỹ Đình buổi tối và dự kiến tới nơi sáng hôm sau.</p><ul><li>Giường nằm Royal (cabin riêng, ít chỗ, yên tĩnh) và Luxury (cân bằng giữa giá và sự thoải mái); hạng xe ghi trên từng chuyến.</li><li>Khách hạng Royal có thể đăng ký trung chuyển tại Bản Phủ: báo địa chỉ khi đặt vé để xác nhận điểm trả.</li><li>Điểm trả ở Bản Phủ chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí xuống xe trước ngày đi.</li><li>Tới sớm ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng, cạnh Bến xe Mỹ Đình.</li></ul><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( $p_md, $p_lounge, $p_bp ) ),
		'offices'          => $ln( array( $o_lounge, $o_md, $o_bp, $o_db_off ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Bản Phủ chỉ có trên một số chuyến.',
		'stops'            => $ln( array( $s_md, $s_lounge, $s_bp ) ),
		'vehicle_classes'  => $db_classes( array( 'royal', 'luxury' ) ),
		'related'          => $ln( array( 'Hà Nội đi Điện Biên | my-dinh/dien-bien', 'Mỹ Đình đi Mường Chà | my-dinh/muong-cha', 'Yên Nghĩa đi Điện Biên | yen-nghia/dien-bien' ) ),
		'reverse'          => 'Bản Phủ về Hà Nội | ban-phu/my-dinh',
		'round_trip_note'  => 'Chiều về có trang riêng Bản Phủ – Mỹ Đình. Chuyến qua đêm có thể tới nơi vào hôm sau, hãy đối chiếu ngày đến của chiều đi trước khi chọn ngày về.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== 09 · Mỹ Đình → Mường Chà ===================== */
	'my-dinh/muong-cha' => array(
		'seo_title'        => 'Xe Mỹ Đình đi Mường Chà, Điện Biên | Hải Vân',
		'meta_description' => 'Đặt vé xe giường nằm Hải Vân từ Mỹ Đình, Hà Nội đi Mường Chà, Điện Biên. Chủ động chọn chỗ trước trên website; gọi 1900 6763 để được tư vấn điểm đón trả.',
		'h1'               => 'Đặt vé xe Mỹ Đình đi Mường Chà',
		'intro'            => 'Xe Mỹ Đình đi Mường Chà, Điện Biên. Chọn ngày đi để xem chuyến còn chỗ, điểm trả và giờ đến dự kiến.',
		'schedule_text'    => '<p>Chỉ một số chuyến có điểm trả Mường Chà. Xe rời Bến xe Mỹ Đình buổi tối và đi qua đêm; xem giờ, ngày đến ở bảng bên dưới. Giá chính xác hiện trên từng giường khi bạn mở sơ đồ.</p>',
		'facts'            => "≈ 11 giờ 10 | Thời gian dự kiến\nĐi đêm | Dự kiến sáng hôm sau\nGiường nằm | Hạng ghi trên từng chuyến",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Lên Mường Chà | theo cách chu đáo hơn. | Xe giường nằm chạy buổi tối từ Mỹ Đình để bạn nghỉ ngơi trên đường, dự kiến tới Mường Chà vào sáng hôm sau.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến sáng tới Mường Chà | Theo lịch chạy hiện tại, hành trình khoảng 11 giờ 10 phút. Kiểm tra ngày đến và giờ đến dự kiến trước khi sắp xếp việc tại Mường Chà. | dien-bien-hero-bus.webp',
			'Giường nằm Luxury | Theo lịch chạy hiện tại, chuyến Mường Chà dùng xe Luxury 34–36 giường: rèm che riêng tư, màn hình riêng, cân bằng giữa giá và sự thoải mái. Hạng xe ghi trên từng chuyến. | dien-bien-hero-cabin-bed.webp',
			'Xác nhận điểm trả ở Mường Chà | Điểm trả ở Mường Chà chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí xuống xe trước ngày đi. | db-bus-yellow.webp',
			$r_nocram,
			$r_lounge_go,
			'Đặt online, thanh toán VNPay | Chọn chỗ trước trên website, thanh toán qua VNPay và nhận vé điện tử ngay trên điện thoại; cần hỗ trợ thì gọi 1900 6763. | dien-bien-hero-berth-aisle.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Mỹ Đình đi Mường Chà chạy bao lâu? | Theo lịch chạy hiện tại khoảng 11 giờ 10 phút; xe đi qua đêm và dự kiến tới nơi sáng hôm sau. Giờ đến cụ thể xem ở bảng chuyến hoặc gọi 1900 6763.',
			$f_md_board,
			'Xuống xe ở đâu tại Mường Chà? | Chỉ một số chuyến có điểm trả Mường Chà và điểm này chưa có địa chỉ cố định trên hệ thống. Chọn chuyến có điểm trả Mường Chà, rồi gọi 1900 6763 để xác nhận vị trí xuống xe trước ngày đi.',
			'Vé xe Mỹ Đình đi Mường Chà giá bao nhiêu? | Mở sơ đồ chuyến để xem giá từng giường còn trống; giá tùy hạng xe và vị trí giường. Kiểm tra tổng tiền trước khi thanh toán.',
			"Thời gian được phép đổi hoặc hủy vé? | Thời hạn đổi hoặc hủy vé cần được kiểm tra theo điều kiện áp dụng cho vé Mỹ Đình đi Mường Chà mà bạn đặt. Chính sách hủy vé xem tại {$policy_txt}.",
			$faq_refund,
			$faq_promo,
			$faq_points( 'Mỹ Đình – Mường Chà' ),
			$faq_child,
			$faq_late,
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Đi Mường Chà bằng xe giường nằm</h2><p>Chỉ một số chuyến Hà Nội – Điện Biên có điểm trả Mường Chà, vì vậy hãy chọn đúng hành trình Mỹ Đình – Mường Chà. Xe rời Bến xe Mỹ Đình buổi tối và dự kiến tới nơi sáng hôm sau.</p><ul><li>Theo lịch chạy hiện tại, chuyến Mường Chà dùng xe Luxury 34–36 giường; hạng xe ghi trên từng chuyến.</li><li>Điểm trả ở Mường Chà chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí xuống xe trước ngày đi.</li><li>Tới sớm ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng, cạnh Bến xe Mỹ Đình.</li></ul><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( $p_md, $p_lounge, $p_mc ) ),
		'offices'          => $ln( array( $o_lounge, $o_md, $o_mc, $o_db_off ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Mường Chà chỉ có trên một số chuyến.',
		'stops'            => $ln( array( $s_md, $s_lounge, $s_mc ) ),
		'vehicle_classes'  => $db_classes( array( 'luxury' ) ),
		'related'          => $ln( array( 'Hà Nội đi Điện Biên | my-dinh/dien-bien', 'Mỹ Đình đi Bản Phủ | my-dinh/ban-phu', 'Yên Nghĩa đi Điện Biên | yen-nghia/dien-bien' ) ),
		'reverse'          => 'Mường Chà về Hà Nội | muong-cha/my-dinh',
		'round_trip_note'  => 'Chiều về có trang riêng Mường Chà – Mỹ Đình. Chuyến qua đêm có thể tới nơi vào hôm sau, hãy đối chiếu ngày đến của chiều đi trước khi chọn ngày về.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== Mới · Bản Phủ → Mỹ Đình ===================== */
	'ban-phu/my-dinh' => array(
		'create'           => array( 'title' => 'Bản Phủ - Mỹ Đình', 'time' => '10h40', 'thumb_from' => 'my-dinh/ban-phu' ),
		'seo_title'        => 'Xe giường nằm Bản Phủ về Hà Nội (Mỹ Đình) | Hải Vân',
		'meta_description' => 'Từ Bản Phủ, Điện Biên về Mỹ Đình, Hà Nội bằng xe giường nằm Hải Vân chạy đêm. Chọn hạng Royal hoặc Luxury, chọn chỗ theo sơ đồ và đặt vé online.',
		'h1'               => 'Đặt vé xe Bản Phủ về Hà Nội',
		'intro'            => 'Xe giường nằm Hải Vân đón khách ở Bản Phủ, Điện Biên buổi tối và dự kiến về tới Bến xe Mỹ Đình, Hà Nội sáng hôm sau. Bản Phủ chỉ có trên một số chuyến: chọn ngày đi để xem chuyến còn chỗ, giờ có mặt và giờ đến dự kiến.',
		'schedule_text'    => '<p>Chỉ một số chuyến Điện Biên – Hà Nội đón khách ở Bản Phủ, hãy chọn đúng hành trình Bản Phủ – Mỹ Đình. Xe chạy qua đêm nên bạn lưu ý ngày đến Hà Nội; giá chính xác hiện trên từng giường khi bạn mở sơ đồ.</p>',
		'facts'            => "≈ 10 giờ 40 | Thời gian dự kiến\nĐi đêm | Dự kiến sáng về Hà Nội\nGiường nằm | Royal, Luxury",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Về Hà Nội | theo cách chu đáo hơn. | Lên xe buổi tối ở Bản Phủ, nghỉ ngơi trên xe và dự kiến về Mỹ Đình vào sáng hôm sau; nếu xuống Hà Nội khám bệnh, hãy xác nhận trước khả năng trung chuyển đến đúng cơ sở.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến sáng về Hà Nội | Theo lịch chạy hiện tại, hành trình khoảng 10 giờ 40 phút. Kiểm tra ngày đến và giờ đến dự kiến trước khi sắp xếp công việc tại Hà Nội. | dien-bien-hero-bus.webp',
			'Giường nằm Royal và Luxury | Royal là cabin riêng, ít chỗ nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái, giường có rèm che và màn hình riêng. Hạng xe ghi trên từng chuyến. | dien-bien-hero-cabin-bed.webp',
			'Xác nhận điểm đón ở Bản Phủ | Điểm đón ở Bản Phủ chưa có địa chỉ cố định trên hệ thống; chọn chuyến có điểm đón Bản Phủ và gọi 1900 6763 để xác nhận vị trí, giờ hẹn trước ngày đi. | db-bus-yellow.webp',
			$r_hospital,
			$r_lounge_back,
			$r_nocram,
		) ),
		'faq'              => $ln( array(
			'Xe Bản Phủ về Hà Nội chạy bao lâu, tới Mỹ Đình lúc mấy giờ? | Theo lịch chạy hiện tại khoảng 10 giờ 40 phút; xe đi qua đêm và dự kiến tới Bến xe Mỹ Đình vào sáng hôm sau. Giờ và ngày đến của từng chuyến xem ở bảng chuyến.',
			'Lên xe ở đâu tại Bản Phủ? | Chỉ một số chuyến đón ở Bản Phủ và điểm này chưa có địa chỉ cố định trên hệ thống. Chọn chuyến có điểm đón Bản Phủ, rồi gọi 1900 6763 để xác nhận vị trí và giờ có mặt trước ngày đi.',
			$f_md_drop,
			$f_hospital,
			'Nên chọn hạng Royal hay Luxury? | Royal là cabin riêng, ít chỗ nên yên tĩnh, hợp khi bạn muốn ngủ trọn đêm; Luxury cân bằng giữa giá và sự thoải mái với rèm che, màn hình riêng. Hạng xe của từng chuyến ghi ngay trên lịch chạy.',
			'Vé xe Bản Phủ về Hà Nội giá bao nhiêu? | Chọn ngày đi, chuyến và vị trí giường để xem giá vé cụ thể cho chiều Bản Phủ về Hà Nội. Kiểm tra tổng tiền trước khi thanh toán.',
			$faq_change( 'Bản Phủ về Hà Nội' ),
			$faq_refund,
			$faq_promo,
			$faq_points( 'Bản Phủ – Mỹ Đình' ),
			$faq_child,
			$faq_late,
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Về Hà Nội từ Bản Phủ</h2><p>Chỉ một số chuyến Điện Biên – Hà Nội đón khách ở Bản Phủ, vì vậy hãy chọn đúng hành trình Bản Phủ – Mỹ Đình. Xe chạy buổi tối và dự kiến về tới Hà Nội sáng hôm sau; chừa thêm thời gian nếu bạn có lịch hẹn.</p><ul><li>Giường nằm Royal (cabin riêng, ít chỗ, yên tĩnh) và Luxury (cân bằng giữa giá và sự thoải mái); hạng xe ghi trên từng chuyến.</li><li>Điểm đón ở Bản Phủ chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí và giờ hẹn trước ngày đi.</li><li>Xuống ở Bến xe Mỹ Đình; ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng cạnh bến nếu bạn cần chờ thêm.</li><li>Nếu xuống Hà Nội khám bệnh, cung cấp tên bệnh viện và địa chỉ cơ sở khi đặt vé để xác nhận khả năng trung chuyển, điểm hẹn và điều kiện áp dụng.</li></ul><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( $p_bp, 'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Nơi xe trả khách ở đầu Hà Nội', $p_lounge ) ),
		'offices'          => $ln( array( $o_bp, $o_db_off, $o_lounge, $o_md ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Bản Phủ chỉ có trên một số chuyến.',
		'stops'            => $ln( array( $s_bp, $s_md, $s_lounge ) ),
		'vehicle_classes'  => $db_classes( array( 'royal', 'luxury' ) ),
		'related'          => $ln( array( 'Điện Biên về Hà Nội | dien-bien/my-dinh', 'Mường Chà về Hà Nội | muong-cha/my-dinh', 'Sơn La về Hà Nội | son-la/my-dinh' ) ),
		'reverse'          => 'Mỹ Đình đi Bản Phủ | my-dinh/ban-phu',
		'round_trip_note'  => 'Trang này bán vé một chiều Bản Phủ về Hà Nội; chiều đi có trang riêng Mỹ Đình – Bản Phủ. Nếu đã có chiều đi, chọn ngày về sau giờ đến của chiều đi vì chuyến qua đêm có thể đến vào hôm sau.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== Mới · Mường Chà → Mỹ Đình ===================== */
	'muong-cha/my-dinh' => array(
		'create'           => array( 'title' => 'Mường Chà - Mỹ Đình', 'time' => '11h10', 'thumb_from' => 'my-dinh/muong-cha' ),
		'seo_title'        => 'Xe giường nằm Mường Chà về Hà Nội (Mỹ Đình) | Hải Vân',
		'meta_description' => 'Từ Mường Chà, Điện Biên về Mỹ Đình, Hà Nội bằng xe giường nằm Hải Vân chạy đêm. Chọn chỗ theo sơ đồ, đặt vé online; gọi 1900 6763 để xác nhận điểm đón.',
		'h1'               => 'Đặt vé xe Mường Chà về Hà Nội',
		'intro'            => 'Xe giường nằm Hải Vân đón khách ở Mường Chà, Điện Biên buổi tối và dự kiến về tới Bến xe Mỹ Đình, Hà Nội sáng hôm sau. Chọn ngày đi để xem chuyến còn chỗ, giờ có mặt và giờ đến dự kiến.',
		'schedule_text'    => '<p>Chỉ một số chuyến đón khách ở Mường Chà, hãy chọn đúng hành trình Mường Chà – Mỹ Đình. Xe chạy qua đêm nên bạn lưu ý ngày đến Hà Nội; giá chính xác hiện trên từng giường khi bạn mở sơ đồ.</p>',
		'facts'            => "≈ 11 giờ 10 | Thời gian dự kiến\nĐi đêm | Dự kiến sáng về Hà Nội\nGiường nằm | Hạng ghi trên từng chuyến",
		'reasons_head'     => 'Vì sao chọn Hải Vân | Về Hà Nội | theo cách chu đáo hơn. | Lên xe buổi tối ở Mường Chà, nghỉ ngơi trên xe và dự kiến về Mỹ Đình vào sáng hôm sau; nếu xuống Hà Nội khám bệnh, hãy xác nhận trước khả năng trung chuyển đến đúng cơ sở.',
		'reasons'          => $ln( array(
			'Đi đêm, dự kiến sáng về Hà Nội | Theo lịch chạy hiện tại, hành trình khoảng 11 giờ 10 phút. Kiểm tra ngày đến và giờ đến dự kiến trước khi sắp xếp công việc tại Hà Nội. | dien-bien-hero-bus.webp',
			'Giường nằm Luxury | Theo lịch chạy hiện tại, chuyến từ Mường Chà dùng xe Luxury 34–36 giường: rèm che riêng tư, màn hình riêng, cân bằng giữa giá và sự thoải mái. Hạng xe ghi trên từng chuyến. | dien-bien-hero-cabin-bed.webp',
			'Xác nhận điểm đón ở Mường Chà | Điểm đón ở Mường Chà chưa có địa chỉ cố định trên hệ thống; chọn chuyến có điểm đón Mường Chà và gọi 1900 6763 để xác nhận vị trí, giờ hẹn trước ngày đi. | db-bus-yellow.webp',
			$r_hospital,
			$r_lounge_back,
			$r_nocram,
		) ),
		'faq'              => $ln( array(
			'Xe Mường Chà về Hà Nội chạy bao lâu, tới Mỹ Đình lúc mấy giờ? | Theo lịch chạy hiện tại khoảng 11 giờ 10 phút; xe đi qua đêm và dự kiến tới Bến xe Mỹ Đình vào sáng hôm sau. Giờ và ngày đến của từng chuyến xem ở bảng chuyến.',
			'Lên xe ở đâu tại Mường Chà? | Chỉ một số chuyến đón ở Mường Chà và điểm này chưa có địa chỉ cố định trên hệ thống. Chọn chuyến có điểm đón Mường Chà, rồi gọi 1900 6763 để xác nhận vị trí và giờ có mặt trước ngày đi.',
			$f_md_drop,
			$f_hospital,
			'Vé xe Mường Chà về Hà Nội giá bao nhiêu? | Chọn ngày đi, chuyến và vị trí giường để xem giá vé cụ thể cho chiều Mường Chà về Hà Nội. Kiểm tra tổng tiền trước khi thanh toán.',
			$faq_change( 'Mường Chà về Hà Nội' ),
			$faq_refund,
			$faq_promo,
			$faq_points( 'Mường Chà – Mỹ Đình' ),
			$faq_child,
			$faq_late,
			$faq_free_ride( 'Điện Biên', 'Hải Vân' ),
		) ),
		'content_html'     => '<h2>Về Hà Nội từ Mường Chà</h2><p>Chỉ một số chuyến Điện Biên – Hà Nội đón khách ở Mường Chà, vì vậy hãy chọn đúng hành trình Mường Chà – Mỹ Đình. Xe chạy buổi tối và dự kiến về tới Hà Nội sáng hôm sau; chừa thêm thời gian nếu bạn có lịch hẹn.</p><ul><li>Theo lịch chạy hiện tại, chuyến từ Mường Chà dùng xe Luxury 34–36 giường; hạng xe ghi trên từng chuyến.</li><li>Điểm đón ở Mường Chà chưa có địa chỉ cố định trên hệ thống; gọi 1900 6763 để xác nhận vị trí và giờ hẹn trước ngày đi.</li><li>Xuống ở Bến xe Mỹ Đình; ngồi nghỉ ở phòng chờ 01 Nguyễn Hoàng cạnh bến nếu bạn cần chờ thêm.</li><li>Nếu xuống Hà Nội khám bệnh, cung cấp tên bệnh viện và địa chỉ cơ sở khi đặt vé để xác nhận khả năng trung chuyển, điểm hẹn và điều kiện áp dụng.</li></ul><p>Xem thêm <a href="/diem-den/dien-bien">kinh nghiệm du lịch Điện Biên</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array( $p_mc, 'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Nơi xe trả khách ở đầu Hà Nội', $p_lounge ) ),
		'offices'          => $ln( array( $o_mc, $o_db_off, $o_lounge, $o_md ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; Mường Chà chỉ có trên một số chuyến.',
		'stops'            => $ln( array( $s_mc, $s_md, $s_lounge ) ),
		'vehicle_classes'  => $db_classes( array( 'luxury' ) ),
		'related'          => $ln( array( 'Điện Biên về Hà Nội | dien-bien/my-dinh', 'Bản Phủ về Hà Nội | ban-phu/my-dinh', 'Sơn La về Hà Nội | son-la/my-dinh' ) ),
		'reverse'          => 'Mỹ Đình đi Mường Chà | my-dinh/muong-cha',
		'round_trip_note'  => 'Trang này bán vé một chiều Mường Chà về Hà Nội; chiều đi có trang riêng Mỹ Đình – Mường Chà. Nếu đã có chiều đi, chọn ngày về sau giờ đến của chiều đi vì chuyến qua đêm có thể đến vào hôm sau.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $db_stats,
		'story'            => '',
	),

	/* ===================== 10 · Hà Nội → Mộc Châu ===================== */
	'my-dinh/moc-chau' => array(
		'seo_title'        => 'Xe limousine Hà Nội đi Mộc Châu | Hải Vân Xuân Tráng',
		'meta_description' => 'Hải Vân Xuân Tráng đi Mộc Châu từ Mỹ Đình, Nguyễn Tuân hoặc Châu Văn Liêm, Hà Nội. Có limousine ghế massage và xe giường nằm; chọn chỗ, đặt vé online.',
		'h1'               => 'Đặt vé xe Hà Nội đi Mộc Châu',
		'intro'            => 'Hải Vân Xuân Tráng chạy limousine và giường nằm Hà Nội – Mộc Châu, đón khách tại Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm tùy chuyến, nhiều giờ trong ngày. Theo lịch chạy hiện tại, hành trình khoảng 3 giờ 50 đến 4 giờ 35 phút tùy chuyến. Chọn chuyến, chọn chỗ và giữ vé điện tử trên điện thoại.',
		'schedule_text'    => '<p>Bảng dưới liệt kê các chuyến rời Hà Nội theo ngày bạn chọn, kèm giờ đến và ngày đến dự kiến. Chuyến tối hoặc đêm có thể tới Mộc Châu vào hôm sau. Giá đổi theo hạng xe và chỗ ngồi, giá chính xác hiện khi bạn mở sơ đồ.</p>',
		'facts'            => "3h50 – 4h35 | Thời gian\n2 dòng xe | Limousine, giường nằm\n11 | Điểm đón trả trên tuyến",
		'reasons_head'     => 'Vì sao chọn Hải Vân Xuân Tráng | Lên Mộc Châu | theo cách chu đáo hơn. | Bạn có thể chọn giờ đi phù hợp với lịch nhận phòng và kế hoạch tham quan Mộc Châu; nếu đi chuyến muộn, hãy kiểm tra cả ngày đến.',
		'reasons'          => $ln( array(
			'Chọn giờ đi phù hợp | Xem lịch Hà Nội đi Mộc Châu theo ngày bạn dự định đi. Theo lịch chạy hiện tại, hành trình khoảng 3 giờ 50 đến 4 giờ 35 phút tùy chuyến; nếu chọn chuyến tối hoặc đêm, hãy kiểm tra cả giờ và ngày đến. | hvxt-moc-chau-van-mountain.webp',
			'Limousine và xe giường nằm | Chọn loại xe theo nhu cầu ngồi hoặc nằm nghỉ, rồi kiểm tra hình ảnh, sơ đồ chỗ và tiện ích của đúng chuyến trước khi đặt. | hvxt-moc-chau-limo-interior-1.webp',
			'Trả khách tận nơi ở Mộc Châu | Xe hỗ trợ trả khách tận nơi lưu trú ở Mộc Châu: khi đặt vé, cung cấp địa chỉ homestay hoặc khách sạn để nhà xe xác nhận điểm xuống và giờ dự kiến. | hvxt-moc-chau-van-street.webp',
			$xt_hn_pick,
			$xt_seat( 'thông tin' ),
			'Phòng chờ và điểm giao nhận hàng | Cơ sở tại Tổ dân phố 70, phường Vân Sơn, Mộc Châu có phòng chờ và điểm giao nhận hàng. Nếu gửi hàng từ Hà Nội đi Mộc Châu, hãy xác nhận nơi gửi, nơi nhận và cước theo loại hàng, khối lượng. | hvxt-tram-dung-nghi.webp',
		) ),
		'faq'              => $ln( array(
			'Vé xe Hà Nội đi Mộc Châu giá bao nhiêu? | Giá phụ thuộc hạng xe, chuyến và chỗ. Chọn ngày đi rồi xem bảng chuyến, mỗi chuyến hiện giá thấp nhất; giá chính xác từng chỗ hiện khi mở sơ đồ. Giá chiều ngược lại có thể khác.',
			'Xe Hà Nội đi Mộc Châu mất bao lâu? | Theo lịch chạy hiện tại khoảng 3 giờ 50 đến 4 giờ 35 phút tùy chuyến: limousine khoảng 4 giờ 15 phút, xe giường nằm 3 giờ 50 đến 4 giờ 35 phút. Thời gian thực tế đổi theo giao thông và thời tiết; chuyến tối hoặc đêm có thể tới nơi vào hôm sau, hãy xem ngày đến trước khi đặt.',
			'Xe đi Mộc Châu đón khách ở đâu tại Hà Nội? | Các điểm đón gồm Bến xe Mỹ Đình (số 20 đường Phạm Hùng), 35 Nguyễn Tuân (quận Thanh Xuân) và 10 Châu Văn Liêm (quận Nam Từ Liêm) tùy chuyến. Chọn chuyến có điểm đón phù hợp và đối chiếu giờ có mặt ghi trên vé.',
			'Nên chọn limousine hay giường nằm đi Mộc Châu? | Nếu muốn ngồi và điều chỉnh tư thế, bạn có thể cân nhắc limousine; nếu muốn nằm nghỉ, hãy xem chuyến giường nằm. So sánh sơ đồ chỗ, tiện ích và giá của đúng chuyến trước khi chọn.',
			$xt_group( 'chỗ' ),
			'Hải Vân Xuân Tráng có nhận gửi hàng đi Mộc Châu không? | Nhà xe có điểm giao nhận hàng tại Tổ dân phố 70, phường Vân Sơn, Mộc Châu. Khi gửi hàng từ Hà Nội, bạn cần xác nhận điểm gửi, điểm nhận, thời gian giao nhận và cước theo loại hàng, khối lượng.',
			'Văn phòng nhà xe ở Hà Nội nằm ở đâu? | Văn phòng ở số 35 Nguyễn Tuân, quận Thanh Xuân, Hà Nội. Bạn nên kiểm tra giờ làm việc trước khi đến.',
			'Bao lâu có một chuyến và đặt bằng cách nào? | Bạn hãy xem lịch chạy theo ngày đi để biết khoảng cách giữa các chuyến. Có thể đặt vé qua ứng dụng Hải Vân, website haivan.com, tổng đài 1900 6763 hoặc các phòng vé của nhà xe.',
			"Xe Hà Nội đi Mộc Châu trả khách ở đâu tại Mộc Châu? | Các điểm trả gồm {$mc_drop_list}. Mỗi chuyến chỉ phục vụ một số điểm, hãy chọn điểm trả có trên chuyến bạn đặt. Xe cũng hỗ trợ trả tận nơi lưu trú: ghi địa chỉ khi đặt vé để nhà xe xác nhận.",
			'Xe Hà Nội đi Mộc Châu chạy từ mấy giờ? | Xe chạy nhiều giờ trong ngày, gồm cả chuyến tối và đêm; chuyến tối hoặc đêm có thể tới nơi vào hôm sau. Lịch chạy phía trên hiển thị giờ đi, giá và chỗ còn trống của đúng ngày bạn chọn.',
			'Đặt vé Hà Nội đi Mộc Châu một chiều như thế nào? | Chọn ngày đi, xem chuyến rồi chọn chỗ còn trống; không cần nhập ngày về. Kiểm tra điểm đón, điểm trả, giờ và ngày đến trước khi thanh toán.',
			'Hải Vân Xuân Tráng có những dòng xe nào trên tuyến này? | Tuyến có xe limousine và xe giường nằm. Bạn nên kiểm tra tiện ích của từng chuyến, như ghế massage, cổng sạc, wifi, màn hình hoặc rèm che, thay vì mặc định mọi xe đều có đủ.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Kiểm tra điểm đón tại Hà Nội, giờ có mặt và điểm trả tại Mộc Châu trong thông tin vé. Nếu địa chỉ hoặc vị trí chờ chưa rõ, bạn nên xác nhận với nhà xe trước ngày đi.',
			$xt_kid,
			$faq_free_ride( 'Mộc Châu', 'Hải Vân Xuân Tráng' ),
		) ),
		'content_html'     => '<h2>Đi Mộc Châu từ Hà Nội</h2><p>Khi lên kế hoạch đi Mộc Châu, bạn nên chọn chuyến theo giờ muốn đến và lịch nhận phòng. Với chuyến tối hoặc đêm, hãy kiểm tra ngày đến để tránh nhầm lịch lưu trú.</p><ul><li>Bạn có thể cân nhắc limousine nếu muốn ngồi hoặc xe giường nằm nếu muốn nằm nghỉ. Kiểm tra tiện ích và sơ đồ chỗ của đúng chuyến trước khi đặt.</li><li>Các điểm đón tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến; hãy kiểm tra điểm đón và giờ có mặt của chuyến đã chọn.</li><li>Trả ở Mộc Châu tại ' . $mc_drop_list . '; mỗi chuyến chỉ phục vụ một số điểm trong danh sách.</li><li>Xe hỗ trợ trả tận nơi lưu trú ở Mộc Châu: ghi địa chỉ homestay, khách sạn khi đặt vé để nhà xe xác nhận điểm xuống.</li></ul><h2>Trạm dừng nghỉ và gửi hàng</h2><p>Hải Vân Xuân Tráng có trạm dừng nghỉ ở Tổ dân phố 70, phường Vân Sơn, Mộc Châu: phòng chờ đồng thời là điểm giao nhận hàng. Xem thêm <a href="/diem-den/moc-chau">kinh nghiệm du lịch Mộc Châu</a> trước chuyến đi.</p>' . $policy_html,
		'pickup_points'    => $ln( array(
			'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Điểm đón ở Hà Nội, tùy chuyến',
			'35 Nguyễn Tuân | Quận Thanh Xuân, Hà Nội | Điểm đón tùy chuyến, cũng là văn phòng nhà xe',
			'10 Châu Văn Liêm | Quận Nam Từ Liêm, Hà Nội | Điểm đón ở Hà Nội, tùy chuyến',
			'Nông trường Mộc Châu | Thị trấn Nông trường Mộc Châu, huyện Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
			'Khách sạn Mường Thanh | Đường Hoàng Quốc Việt, Phiêng Luông, Mộc Châu | Điểm trả ở Mộc Châu',
			'Khách sạn Trường Giang | Đường Hoàng Quốc Việt, Phiêng Luông, Mộc Châu | Điểm trả ở Mộc Châu',
			'Bến xe Mộc Châu | Quốc lộ 6, thị trấn Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
			'Văn phòng 254 Trần Huy Liệu | 254 Trần Huy Liệu, thị trấn Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
			'Bản Áng | Xã Đông Sang, Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
			'Ngã ba Pa Háng | Thị trấn Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
			'Cây xăng Mường Sang | Xã Mường Sang, Mộc Châu, Sơn La | Điểm trả ở Mộc Châu',
		) ),
		'offices'          => $ln( array( $xt_office_nt, $o_md, $xt_tram, $xt_off_thl ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; không phải chuyến nào cũng phục vụ tất cả các điểm. Ở Mộc Châu, ghi địa chỉ nơi lưu trú khi đặt vé nếu cần trả tận nơi.',
		'stops'            => $mc_stops,
		'vehicle_classes'  => $mc_classes,
		'related'          => $ln( array( 'Mộc Châu về Hà Nội | moc-chau/my-dinh', 'Hà Nội đi Sơn La | my-dinh/son-la', 'Hà Nội đi Điện Biên | my-dinh/dien-bien' ) ),
		'reverse'          => 'Mộc Châu về Hà Nội | moc-chau/my-dinh',
		'round_trip_note'  => 'Trang này bán vé một chiều Hà Nội đi Mộc Châu. Muốn đi khứ hồi, đặt riêng chuyến Mộc Châu về Hà Nội ở trang chiều về, rồi kiểm tra ngày đến của chiều đi trước khi chọn ngày về.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $xt_stats,
		'story'            => '',
	),

	/* ===================== 11 · Mộc Châu → Hà Nội ===================== */
	'moc-chau/my-dinh' => array(
		'seo_title'        => 'Xe Mộc Châu về Hà Nội, trả Mỹ Đình | Hải Vân Xuân Tráng',
		'meta_description' => 'Đặt xe Hải Vân Xuân Tráng từ Mộc Châu về Hà Nội, trả tại Mỹ Đình, Nguyễn Tuân hoặc Châu Văn Liêm. Chọn limousine ghế massage hoặc giường nằm ngay trên web.',
		'h1'               => 'Đặt vé xe Mộc Châu về Hà Nội',
		'intro'            => 'Từ Mộc Châu, Hải Vân Xuân Tráng chạy limousine và xe giường nằm về Hà Nội, trả khách tại Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm tùy chuyến. Theo lịch chạy hiện tại, hành trình khoảng 3 giờ 50 đến 5 giờ 5 phút tùy chuyến; xem giờ đến của từng chuyến rồi chọn chỗ.',
		'schedule_text'    => '<p>Bảng dưới đây liệt kê các chuyến rời Mộc Châu theo ngày bạn chọn, kèm giờ đến Hà Nội. Giờ và giá của chiều về có thể khác chiều đi nên bạn xem kỹ từng chuyến. Chuyến tối hoặc đêm có thể về tới Hà Nội vào hôm sau.</p>',
		'facts'            => "3h50 – 5h05 | Thời gian\n2 dòng xe | Limousine, giường nằm\n11 | Điểm đón trả trên tuyến",
		'reasons_head'     => 'Vì sao chọn Hải Vân Xuân Tráng | Về Hà Nội | theo cách chu đáo hơn. | Chọn điểm đón tại Mộc Châu phù hợp với nơi lưu trú và chuyến có điểm trả tại Hà Nội thuận tiện cho hành trình tiếp theo.',
		'reasons'          => $ln( array(
			'Nhiều giờ chạy trong ngày | Có cả chuyến ngày, tối và đêm; thời gian di chuyển tùy chuyến và điểm trả tại Hà Nội, theo lịch chạy hiện tại khoảng 3 giờ 50 đến 5 giờ 5 phút. Chuyến đêm có thể tới nơi vào hôm sau, hãy xem ngày đến. | hvxt-moc-chau-van-mountain.webp',
			'Limousine và xe giường nằm | Chọn loại xe theo nhu cầu ngồi hoặc nằm nghỉ, rồi kiểm tra sơ đồ chỗ và tiện ích của đúng chuyến Mộc Châu về Hà Nội. | hvxt-moc-chau-limo-interior-1.webp',
			'Điểm đón tại Mộc Châu | Nếu ở homestay hoặc khách sạn, hãy xác nhận điểm hẹn và giờ có mặt trước ngày đi. Mỗi chuyến chỉ đón ở một số điểm trên tuyến. | hvxt-moc-chau-van-street.webp',
			$xt_hn_drop( 'Mộc Châu' ),
			$xt_seat( 'điểm đón, giờ đi và điểm trả' ),
			'Phòng chờ và điểm giao nhận hàng | Cơ sở tại Tổ dân phố 70, phường Vân Sơn, Mộc Châu có phòng chờ và điểm giao nhận hàng. Nếu gửi hàng về Hà Nội, hãy xác nhận nơi gửi, nơi nhận và cước theo loại hàng, khối lượng. | hvxt-tram-dung-nghi.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Mộc Châu về Hà Nội mất bao lâu, tới Mỹ Đình lúc nào? | Theo lịch chạy hiện tại khoảng 3 giờ 50 đến 5 giờ 5 phút tùy chuyến: limousine khoảng 4 giờ 20 phút, xe giường nằm 3 giờ 50 đến 5 giờ 5 phút. Bảng chuyến hiện giờ đến và ngày đến dự kiến của từng chuyến; chuyến tối hoặc đêm có thể tới Hà Nội vào hôm sau, thời gian thực tế đổi theo giao thông và thời tiết.',
			"Xe từ Mộc Châu đón khách ở đâu? | Các điểm đón gồm {$mc_drop_list}. Mỗi chuyến chỉ phục vụ một số điểm, hãy chọn đúng điểm trên chuyến bạn đặt; nếu ở homestay hoặc khách sạn, xác nhận điểm hẹn và giờ có mặt trước ngày đi.",
			'Xe về Hà Nội trả khách ở đâu? | Các điểm trả tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến. Kiểm tra điểm trả và giờ đến dự kiến của đúng chuyến trước khi đặt.',
			'Tôi cần về Hà Nội đúng giờ khám bệnh hoặc nối chuyến thì chọn chuyến nào? | Chọn chuyến có giờ đến dự kiến sớm hơn giờ hẹn, dành thêm thời gian cho giao thông phát sinh và quãng đường từ điểm trả đến bệnh viện hoặc nơi nối chuyến. Nếu đi chuyến đêm, hãy kiểm tra cả ngày đến.',
			'Có chương trình đi xe miễn phí cho người bệnh ở Mộc Châu không? | Có. Chương trình đi xe miễn phí cho người bệnh đang áp dụng tại Mộc Châu – Sơn La và Điện Biên, do Hải Vân Xuân Tráng cùng các phường, xã đã đồng hành tổ chức. Đối tượng, thời gian áp dụng và cách đăng ký theo thông báo chính thức của chương trình; không mặc định mọi người bệnh hoặc mọi chuyến đều được miễn phí. Gọi 1900 6763 để hỏi.',
			'Mua vé ở đâu khi đang ở Mộc Châu? | Đặt qua ứng dụng Hải Vân, website haivan.com, tổng đài 1900 6763 hoặc phòng vé Hải Vân Xuân Tráng ở Mộc Châu.',
			'Gửi hàng từ Mộc Châu về Hà Nội được không? | Nhà xe có điểm giao nhận hàng tại Tổ dân phố 70, phường Vân Sơn, Mộc Châu. Trước khi gửi về Hà Nội, hãy xác nhận nơi gửi, nơi nhận, thời gian giao nhận và cước theo loại hàng, khối lượng.',
			'Giá vé chiều về có giống chiều đi không? | Giá vé hai chiều có thể khác nhau. Bạn hãy kiểm tra giá của đúng chuyến Mộc Châu về Hà Nội theo ngày đi, loại xe và chỗ muốn đặt.',
			'Bao lâu có một chuyến Mộc Châu về Hà Nội? | Khoảng cách giữa các chuyến cần được kiểm tra theo lịch Mộc Châu về Hà Nội của ngày bạn chọn; không nên mặc định ngày nào cũng có cùng tần suất.',
			'Nên chọn limousine hay giường nằm về Hà Nội? | Bạn có thể cân nhắc limousine nếu muốn ngồi hoặc xe giường nằm nếu muốn nằm nghỉ. Nên so sánh sơ đồ chỗ, tiện ích, giờ đến và giá của đúng chuyến thay vì chỉ chọn theo chuyến ngày hay chuyến đêm.',
			$xt_group( 'chỗ' ),
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Kiểm tra điểm đón tại Mộc Châu, giờ có mặt và điểm trả tại Hà Nội trong thông tin vé. Nếu vị trí chờ hoặc điểm xuống chưa rõ, bạn nên xác nhận với nhà xe trước ngày đi.',
			$xt_kid,
		) ),
		'content_html'     => '<h2>Về Hà Nội từ Mộc Châu</h2><p>Chọn chuyến theo giờ bạn cần có mặt tại Hà Nội, đồng thời dành thêm thời gian cho giao thông và quãng đường từ điểm trả đến nơi làm việc, bệnh viện hoặc nơi nối chuyến. Kiểm tra lịch chạy của đúng ngày về.</p><ul><li>Chọn điểm lên xe có trong chuyến Mộc Châu về Hà Nội. Nếu ở khách sạn Mường Thanh hoặc gần Bản Áng, hãy xác nhận điểm hẹn và giờ xe qua trước khi rời nơi lưu trú.</li><li>Các điểm trả tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến; hãy chọn chuyến có điểm trả phù hợp với nơi bạn cần đến.</li><li>Hai dòng xe: limousine và giường nằm; hạng vé hiện ngay trên từng chuyến.</li><li>Chương trình đi xe miễn phí cho người bệnh có hoàn cảnh khó khăn đang áp dụng tại Mộc Châu – Sơn La và Điện Biên, cùng các phường, xã đã đồng hành tổ chức. Hãy kiểm tra thông báo chính thức về đối tượng, thời gian áp dụng và cách đăng ký trước khi sắp xếp chuyến đi.</li></ul><h2>Trước giờ xe chạy</h2><p>Trước ngày đi, hãy xác nhận điểm hẹn và giờ có mặt tại Mộc Châu. Nếu dự định chờ xe tại cơ sở ở Tổ dân phố 70, phường Vân Sơn, bạn cần kiểm tra chuyến đã đặt có đón tại đó hay không. Xem thêm <a href="/diem-den/moc-chau">kinh nghiệm du lịch Mộc Châu</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array(
			'Nông trường Mộc Châu | Thị trấn Nông trường Mộc Châu, huyện Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Khách sạn Mường Thanh | Đường Hoàng Quốc Việt, Phiêng Luông, Mộc Châu | Điểm đón ở Mộc Châu',
			'Khách sạn Trường Giang | Đường Hoàng Quốc Việt, Phiêng Luông, Mộc Châu | Điểm đón ở Mộc Châu',
			'Bến xe Mộc Châu | Quốc lộ 6, thị trấn Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Văn phòng 254 Trần Huy Liệu | 254 Trần Huy Liệu, thị trấn Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Bản Áng | Xã Đông Sang, Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Ngã ba Pa Háng | Thị trấn Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Cây xăng Mường Sang | Xã Mường Sang, Mộc Châu, Sơn La | Điểm đón ở Mộc Châu',
			'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Điểm trả ở Hà Nội, tùy chuyến',
			'35 Nguyễn Tuân | Quận Thanh Xuân, Hà Nội | Điểm trả tùy chuyến, cũng là văn phòng nhà xe',
			'10 Châu Văn Liêm | Quận Nam Từ Liêm, Hà Nội | Điểm trả ở Hà Nội, tùy chuyến',
		) ),
		'offices'          => $ln( array( $xt_tram, $xt_off_thl, $xt_office_nt, $o_md ) ),
		'stops_intro'      => 'Chỉ chọn điểm đón và trả có trong chuyến bạn đặt; không phải chuyến nào cũng phục vụ tất cả các điểm.',
		'stops'            => $mc_stops,
		'vehicle_classes'  => $mc_classes,
		'related'          => $ln( array( 'Hà Nội đi Mộc Châu | my-dinh/moc-chau', 'Sơn La về Hà Nội | son-la/my-dinh', 'Điện Biên về Hà Nội | dien-bien/my-dinh' ) ),
		'reverse'          => 'Hà Nội đi Mộc Châu | my-dinh/moc-chau',
		'round_trip_note'  => 'Trang này bán vé một chiều Mộc Châu về Hà Nội. Nếu đã có chiều đi, chọn ngày về sau giờ đến của chiều đi; chiều ngược lại có trang riêng.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $xt_stats,
		'story'            => '',
	),

	/* ===================== 12 · Hà Nội → Sơn La ===================== */
	'my-dinh/son-la' => array(
		'seo_title'        => 'Xe giường nằm Hà Nội đi Sơn La | Hải Vân Xuân Tráng',
		// Brief đề xuất có "và limousine"; lịch chạy thật ngày 16/11/2026 không có limousine Hà Nội – Sơn La nên bỏ.
		'meta_description' => 'Đi Sơn La cùng Hải Vân Xuân Tráng bằng xe giường nằm từ Mỹ Đình, Hà Nội. Hỗ trợ trả khách trong trung tâm TP. Sơn La; chọn chỗ, đặt vé online.',
		'h1'               => 'Đặt vé xe Hà Nội đi Sơn La',
		'intro'            => 'Hải Vân Xuân Tráng chạy Hà Nội – Sơn La bằng xe giường nằm, đón tại Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm tùy chuyến, nhiều khung giờ trong ngày. Theo lịch chạy hiện tại, hành trình khoảng 6 giờ 20 đến 7 giờ 5 phút. Chọn chuyến, chọn chỗ và giữ vé điện tử trên điện thoại.',
		'schedule_text'    => '<p>Hạng vé, số giường và giá thay đổi theo chuyến; mở một chuyến để xem ảnh xe và chọn chỗ. Chuyến rời bến muộn có thể tới Sơn La vào sáng hôm sau, hãy xem kỹ ngày đến.</p>',
		'facts'            => "6h20 – 7h05 | Thời gian\nTận nơi | Trả khách ở trung tâm TP. Sơn La\n3 hạng | Royal, Luxury, Eco",
		'reasons_head'     => 'Vì sao chọn Hải Vân Xuân Tráng | Lên Sơn La | theo cách chu đáo hơn. | Bạn có thể chọn hạng giường nằm theo nhu cầu nghỉ ngơi, rồi đối chiếu giờ khởi hành và giờ đến của chuyến Hà Nội đi Sơn La.',
		'reasons'          => $ln( array(
			'Chọn giờ đi phù hợp | Xem lịch Hà Nội đi Sơn La theo ngày bạn dự định đi. Theo lịch chạy hiện tại, hành trình khoảng 6 giờ 20 đến 7 giờ 5 phút tùy chuyến; với chuyến rời bến muộn, hãy kiểm tra cả giờ và ngày đến. | hvxt-son-la-bus-side.webp',
			'Ba hạng giường nằm | Royal ít giường nên yên tĩnh; Luxury cân bằng giữa giá và sự thoải mái; Eco giá tiết kiệm nhất. Mở chi tiết chuyến để xem hình ảnh và tiện ích của xe. | hvxt-sleeper-interior-starry.webp',
			'Trả khách tận nơi ở Sơn La | Trong khu vực trung tâm thành phố Sơn La, xe hỗ trợ trả khách tận nơi: cung cấp địa chỉ khi đặt vé để nhà xe xác nhận điểm trả phù hợp. | hvxt-son-la-bus-night.webp',
			$xt_hn_pick,
			$xt_seat( 'thông tin' ),
			'Đặt vé và gửi hàng | Bạn có thể đặt vé qua ứng dụng, website, tổng đài hoặc phòng vé của nhà xe. Nếu gửi hàng từ Hà Nội đi Sơn La, hãy xác nhận riêng điểm gửi, điểm nhận và thời gian giao nhận. | hvxt-tram-dung-nghi.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Hà Nội đi Sơn La đón và trả khách ở đâu? | Các điểm đón tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến. Ở Sơn La, xe hỗ trợ trả khách tận nơi trong khu vực trung tâm thành phố: cung cấp địa chỉ khi đặt vé để nhà xe xác nhận điểm trả.',
			'Xe Hà Nội đi Sơn La mất bao lâu? | Theo lịch chạy hiện tại khoảng 6 giờ 20 đến 7 giờ 5 phút, thay đổi theo chuyến, giao thông và thời tiết. Chuyến rời bến muộn có thể tới nơi vào sáng hôm sau.',
			'Bao lâu có một chuyến? | Bạn hãy xem lịch Hà Nội đi Sơn La theo ngày đi để biết giờ khởi hành và khoảng cách giữa các chuyến.',
			'Giá vé được tính thế nào? | Giá tùy chuyến và hạng vé (Royal, Luxury hoặc Eco). Giá chính xác hiện trên từng chỗ khi bạn mở sơ đồ.',
			'Có gửi hàng theo tuyến này không? | Nhà xe có dịch vụ gửi hàng trên tuyến Hà Nội – Mộc Châu – Sơn La. Với hàng gửi từ Hà Nội đến Sơn La, bạn cần xác nhận đúng điểm gửi, điểm nhận, thời gian giao nhận và cước theo loại hàng, khối lượng.',
			'Cần hỗ trợ đặt vé thì liên hệ ai? | Bạn có thể nhờ nhà xe hỗ trợ chọn chuyến, xác nhận điểm đón trả hoặc xử lý vấn đề về vé qua phòng vé hay tổng đài 1900 6763. Khi cần hỗ trợ vé đã đặt, hãy chuẩn bị mã vé và ngày đi.',
			'Văn phòng nhà xe ở Hà Nội nằm ở đâu? | Văn phòng Hải Vân Xuân Tráng ở số 35 Nguyễn Tuân, quận Thanh Xuân, Hà Nội. Bạn nên kiểm tra giờ làm việc trước khi đến.',
			'Có chuyến Hà Nội đi Sơn La qua đêm không? | Bạn hãy kiểm tra lịch chạy của ngày đi để tìm chuyến phù hợp. Chuyến rời Hà Nội muộn có thể tới Sơn La vào sáng hôm sau, nên cần xem cả giờ và ngày đến dự kiến.',
			'Hải Vân Xuân Tráng có những dòng xe nào trên tuyến này? | Tuyến chạy xe giường nằm các hạng Royal, Luxury và Eco. Các tiện ích như cổng sạc, màn hình hoặc rèm che cần được kiểm tra theo đúng chuyến bạn chọn.',
			'Đặt vé Hà Nội đi Sơn La online như thế nào? | Trên ứng dụng Hải Vân hoặc website, chọn ngày đi và chuyến, rồi chọn ghế hoặc giường còn trống trên sơ đồ. Kiểm tra điểm đón, điểm trả và tổng tiền trước khi thanh toán, sau đó lưu vé điện tử.',
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Kiểm tra điểm đón tại Hà Nội, giờ có mặt và điểm trả tại Sơn La trong thông tin vé. Nếu muốn xuống ở một địa chỉ cụ thể trong trung tâm Sơn La, hãy xác nhận điểm trả với nhà xe trước ngày đi.',
			$xt_kid,
			$faq_free_ride( 'Sơn La', 'Hải Vân Xuân Tráng' ),
		) ),
		'content_html'     => '<h2>Đi Sơn La từ Hà Nội</h2><p>Theo lịch chạy hiện tại, hành trình Hà Nội đi Sơn La khoảng 6 giờ 20 đến 7 giờ 5 phút, tùy chuyến, giao thông và thời tiết. Hãy xem lịch chạy của ngày đi và dành thêm thời gian nếu có lịch hẹn sau khi đến.</p><ul><li>Royal: xe 22–24 giường, ít chỗ nên yên tĩnh. Luxury: 34–36 giường, cân bằng giữa giá và sự thoải mái. Eco: 44 giường, giá tiết kiệm nhất.</li><li>Hãy xem vị trí giường và kiểm tra thông tin về chăn gối, màn hình, rèm che của chuyến trước khi đặt.</li><li>Đặt vé qua ứng dụng, website, tổng đài 1900 6763 hoặc phòng vé ở Mỹ Đình, Mộc Châu và Sơn La.</li></ul><h2>Điểm đón và trả</h2><p>Tại Hà Nội, bạn có thể chọn chuyến đón ở Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm. Tại Sơn La, xe hỗ trợ trả tận nơi trong khu vực trung tâm thành phố; cung cấp địa chỉ muốn xuống để nhà xe xác nhận điểm trả phù hợp. Xem thêm <a href="/diem-den/son-la">kinh nghiệm du lịch Sơn La</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array(
			'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Điểm đón ở Hà Nội, tùy chuyến',
			'35 Nguyễn Tuân | Quận Thanh Xuân, Hà Nội | Văn phòng nhà xe, kiểm tra giờ làm việc qua 1900 6763',
			'10 Châu Văn Liêm | Quận Nam Từ Liêm, Hà Nội | Điểm đón tùy chuyến, gọi để xác nhận',
			'Trung tâm thành phố Sơn La | Trả khách tận nơi | Ghi địa chỉ khi đặt vé để nhà xe xác nhận',
		) ),
		'offices'          => $ln( array( $xt_office_nt, $o_md, $xt_tram ) ),
		'stops_intro'      => 'Ở Sơn La xe hỗ trợ trả tận nơi trong khu vực trung tâm thành phố; ghi địa chỉ khi đặt vé để nhà xe xác nhận. Ở Hà Nội, chọn điểm đón có trong chuyến bạn đặt.',
		'stops'            => $sl_stops( true ),
		'vehicle_classes'  => $sl_classes,
		'related'          => $ln( array( 'Hà Nội đi Điện Biên | my-dinh/dien-bien', 'Hà Nội đi Mộc Châu | my-dinh/moc-chau', 'Yên Nghĩa đi Điện Biên | yen-nghia/dien-bien' ) ),
		'reverse'          => 'Sơn La về Hà Nội | son-la/my-dinh',
		'round_trip_note'  => 'Trang này bán vé một chiều Hà Nội đi Sơn La. Muốn đi khứ hồi, đặt riêng chuyến Sơn La về Hà Nội ở bước tìm vé và kiểm tra giờ đến của chiều đi.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $xt_stats,
		'story'            => '',
	),

	/* ===================== 13 · Sơn La → Hà Nội ===================== */
	'son-la/my-dinh' => array(
		'seo_title'        => 'Xe Sơn La về Hà Nội, đón tại trung tâm | Hải Vân Xuân Tráng',
		// Brief đề xuất "Chọn limousine hoặc giường nằm"; lịch chạy thật không có limousine Sơn La – Hà Nội nên thay bằng hạng giường nằm.
		'meta_description' => 'Hải Vân Xuân Tráng hỗ trợ đón tại trung tâm TP. Sơn La, trả tại Mỹ Đình, Nguyễn Tuân hoặc Châu Văn Liêm, Hà Nội. Chọn hạng giường nằm, đặt vé online.',
		'h1'               => 'Đặt vé xe Sơn La về Hà Nội',
		'intro'            => 'Hải Vân Xuân Tráng đón khách ở Sơn La và đưa về Hà Nội bằng xe giường nằm, nhiều khung giờ trong ngày; trả tại Bến xe Mỹ Đình, 35 Nguyễn Tuân hoặc 10 Châu Văn Liêm tùy chuyến. Theo lịch chạy hiện tại, hành trình khoảng 6 giờ đến 8 giờ 5 phút, hãy xem giờ đến của từng chuyến trước khi đặt.',
		'schedule_text'    => '<p>Bảng dưới liệt kê các chuyến rời Sơn La theo ngày bạn chọn, kèm giờ và ngày đến Hà Nội. Chuyến rời bến muộn buổi tối có thể về tới Hà Nội vào sáng hôm sau. Giá chiều về có thể khác chiều đi.</p>',
		'facts'            => "6h – 8h05 | Thời gian\nTrung tâm | Hỗ trợ đón ở TP. Sơn La\n3 hạng | Royal, Luxury, Eco",
		'reasons_head'     => 'Vì sao chọn Hải Vân Xuân Tráng | Về Hà Nội | theo cách chu đáo hơn. | Chọn điểm đón tại Sơn La và chuyến có điểm trả tại Hà Nội phù hợp với hành trình tiếp theo. Nếu muốn được đón gần một địa chỉ trong trung tâm Sơn La, hãy xác nhận trước với nhà xe.',
		'reasons'          => $ln( array(
			'Chọn giờ về phù hợp | Xem lịch Sơn La về Hà Nội theo ngày đi. Theo lịch chạy hiện tại, hành trình khoảng 6 giờ đến 8 giờ 5 phút tùy chuyến; nếu rời Sơn La muộn, hãy kiểm tra cả giờ và ngày đến Hà Nội. | hvxt-son-la-bus-side.webp',
			'Chọn hạng xe cho chặng dài | Tuyến chạy xe giường nằm Royal, Luxury và Eco. Hãy so sánh sơ đồ chỗ và tiện ích của đúng chuyến để chọn cách nằm nghỉ phù hợp. | hvxt-sleeper-interior-starry.webp',
			'Xác nhận điểm đón tại Sơn La | Nếu muốn được đón gần một địa chỉ trong khu vực trung tâm thành phố Sơn La, hãy cung cấp địa chỉ để nhà xe xác nhận điểm hẹn và giờ có mặt. | hvxt-son-la-bus-night.webp',
			$xt_hn_drop( 'Sơn La' ),
			$xt_seat( 'thông tin' ),
			'Đặt vé và gửi hàng | Bạn có thể đặt vé qua ứng dụng, website, tổng đài hoặc phòng vé của nhà xe. Nếu gửi hàng từ Sơn La về Hà Nội, hãy xác nhận riêng điểm gửi, điểm nhận và thời gian giao nhận. | hvxt-tram-dung-nghi.webp',
		) ),
		'faq'              => $ln( array(
			'Xe Sơn La về Hà Nội đón khách ở đâu? | Xe hỗ trợ đón trong khu vực trung tâm thành phố Sơn La: ghi địa chỉ khi đặt vé để nhà xe xác nhận điểm hẹn. Nếu lên xe tại Bến xe Sơn La, gọi 1900 6763 để xác nhận vị trí chờ và giờ có mặt.',
			'Xe về tới Hà Nội lúc mấy giờ? | Theo lịch chạy hiện tại hành trình khoảng 6 giờ đến 8 giờ 5 phút, thay đổi theo chuyến, giao thông và thời tiết. Bảng chuyến hiện giờ và ngày đến dự kiến; chuyến rời muộn buổi tối có thể tới nơi vào sáng hôm sau.',
			'Về Hà Nội khám bệnh có xe trung chuyển không? | Hải Vân có hỗ trợ trung chuyển tới bệnh viện ở Hà Nội. Khi đặt vé, báo tên bệnh viện, địa chỉ cơ sở và giờ hẹn để nhà xe xác nhận chuyến bạn chọn có hỗ trợ hay không, cùng điểm đón trung chuyển, thời gian, chi phí và cách đăng ký; không nên mặc định dịch vụ luôn có hoặc được miễn phí.',
			'Xe trả khách ở đâu tại Hà Nội? | Các điểm trả tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến. Kiểm tra điểm trả và giờ đến dự kiến của đúng chuyến trước khi đặt.',
			'Giá vé giường nằm Sơn La đi Hà Nội thế nào? | Giá vé tùy chuyến, hạng xe (Royal, Luxury hoặc Eco) và chỗ bạn chọn. Hãy xem giá của đúng chuyến Sơn La về Hà Nội theo ngày đi và kiểm tra tổng tiền trước khi thanh toán.',
			'Mua vé ở đâu khi đang ở Sơn La? | Đặt qua ứng dụng Hải Vân, website haivan.com, tổng đài 1900 6763 hoặc phòng vé Hải Vân Xuân Tráng ở Sơn La.',
			'Ở Hà Nội có văn phòng nhà xe không? | Văn phòng nhà xe ở số 35 Nguyễn Tuân, quận Thanh Xuân, Hà Nội. Bạn nên kiểm tra giờ làm việc trước khi đến.',
			'Có gửi hàng từ Sơn La về Hà Nội không? | Nhà xe có dịch vụ gửi hàng trên tuyến Sơn La – Mộc Châu – Hà Nội. Với hàng gửi từ Sơn La về Hà Nội, hãy xác nhận nơi gửi, nơi nhận, thời gian giao nhận và cước theo loại hàng, khối lượng.',
			'Xe Sơn La về Hà Nội mất bao lâu? | Theo lịch chạy hiện tại khoảng 6 giờ đến 8 giờ 5 phút, thay đổi theo chuyến, giao thông và thời tiết. Chuyến tối có thể tới Hà Nội vào sáng hôm sau, hãy xem ngày đến.',
			'Bao lâu có một chuyến Sơn La về Hà Nội? | Bạn hãy xem lịch Sơn La về Hà Nội theo ngày đi để biết giờ khởi hành và khoảng cách giữa các chuyến.',
			$xt_group( 'giường' ),
			'Làm sao biết đúng điểm đón và điểm trả của tôi? | Kiểm tra điểm đón tại Sơn La, giờ có mặt và điểm trả tại Hà Nội trong thông tin vé. Nếu muốn được đón gần một địa chỉ cụ thể, hãy xác nhận điểm hẹn với nhà xe trước ngày đi.',
			$xt_kid,
			$faq_free_ride( 'Sơn La', 'Hải Vân Xuân Tráng' ),
		) ),
		'content_html'     => '<h2>Về Hà Nội từ Sơn La</h2><p>Chọn chuyến theo giờ cần có mặt tại Hà Nội và kiểm tra vị trí giường trước khi đặt. Nếu có lịch khám bệnh hoặc nối chuyến, hãy dành thêm thời gian cho giao thông và quãng đường từ điểm trả đến nơi hẹn.</p><ul><li>Nếu muốn được đón gần một địa chỉ ở trung tâm thành phố Sơn La, hãy cung cấp địa chỉ để nhà xe xác nhận điểm hẹn. Nếu lên xe tại Bến xe Sơn La, cần kiểm tra vị trí chờ và giờ có mặt của chuyến đã đặt.</li><li>Các điểm trả tại Hà Nội gồm Bến xe Mỹ Đình, 35 Nguyễn Tuân và 10 Châu Văn Liêm tùy chuyến; hãy chọn chuyến có điểm trả thuận tiện cho nơi bạn cần đến.</li><li>Tuyến chạy xe giường nằm Royal, Luxury và Eco. Kiểm tra sơ đồ chỗ và tiện ích của đúng chuyến trước khi chọn, thay vì mặc định mọi xe đều có màn hình hoặc rèm che.</li><li>Nếu cần trung chuyển đến bệnh viện tại Hà Nội, hãy xác nhận khả năng phục vụ, điểm đón, thời gian, chi phí và cách đăng ký trước chuyến đi.</li></ul><h2>Nơi mua vé và gửi hàng</h2><p>Bạn có thể mua vé tại phòng vé ở Sơn La, Mộc Châu hoặc Mỹ Đình. Nếu gửi hàng từ Sơn La về Hà Nội, hãy xác nhận điểm giao hàng ở Sơn La và điểm nhận tại Hà Nội. Đọc thêm <a href="/diem-den/son-la">kinh nghiệm du lịch Sơn La</a>.</p>' . $policy_html,
		'pickup_points'    => $ln( array(
			'Trung tâm thành phố Sơn La | Hỗ trợ đón trong khu vực trung tâm | Ghi địa chỉ khi đặt vé để nhà xe xác nhận điểm hẹn',
			'Bến xe Sơn La | Thành phố Sơn La | Gọi 1900 6763 để xác nhận vị trí chờ và giờ có mặt',
			'Bến xe Mỹ Đình | Số 20 đường Phạm Hùng, phường Từ Liêm, Hà Nội | Điểm trả ở Hà Nội, tùy chuyến',
			'35 Nguyễn Tuân | Quận Thanh Xuân, Hà Nội | Văn phòng nhà xe ở Hà Nội, điểm trả tùy chuyến',
			'10 Châu Văn Liêm | Quận Nam Từ Liêm, Hà Nội | Điểm trả tùy chuyến, gọi để xác nhận',
		) ),
		'offices'          => $ln( array( $xt_tram, $xt_office_nt, $o_md ) ),
		'stops_intro'      => 'Ở Sơn La xe hỗ trợ đón trong khu vực trung tâm thành phố; ghi địa chỉ khi đặt vé để nhà xe xác nhận điểm hẹn. Ở Hà Nội, chọn chuyến có điểm trả bạn cần.',
		'stops'            => $sl_stops( false ),
		'vehicle_classes'  => $sl_classes,
		'related'          => $ln( array( 'Hà Nội đi Sơn La | my-dinh/son-la', 'Mộc Châu về Hà Nội | moc-chau/my-dinh', 'Điện Biên về Hà Nội | dien-bien/my-dinh' ) ),
		'reverse'          => 'Hà Nội đi Sơn La | my-dinh/son-la',
		'round_trip_note'  => 'Trang này bán vé một chiều Sơn La về Hà Nội. Nếu đã có chiều đi, chọn ngày về sau giờ đến của chiều đi; chiều ngược lại có trang riêng.',
		'rating'           => '',
		'reviews'          => '',
		'stats'            => $xt_stats,
		'story'            => '',
	),
);
