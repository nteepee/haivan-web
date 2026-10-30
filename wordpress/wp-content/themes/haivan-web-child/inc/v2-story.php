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
		'xe-hop-dong' => array(
			'h1_a' => array( 'H1 · vế 1', 'text', 'Xe hợp đồng.', 'Private hire.', '01 · Đầu trang' ),
			'h1_b' => array( 'H1 · vế 2 (tô vàng)', 'text', 'Chuyến đi riêng, theo nhịp của bạn.', 'Your own trip, at your own pace.', '01 · Đầu trang' ),
			'lead' => array( 'Đoạn dẫn', 'textarea', 'Thuê nguyên xe có tài xế cho gia đình, nhóm bạn hay công ty. Hải Vân có gần 250 xe từ 7 đến 45 chỗ, đón tận nơi và đi theo lịch trình bạn chọn.', 'Hire a whole vehicle with a driver for your family, friends or company. Hai Van runs nearly 250 vehicles from 7 to 45 seats, picks you up at your door and follows your schedule.', '01 · Đầu trang' ),
			'cta' => array( 'Chữ nút chính', 'text', 'Nhắn Zalo nhận báo giá', 'Get a quote on Zalo', '01 · Đầu trang' ),
			'hero_img' => array( 'Ảnh lớn', 'image', 'hd-limo-cabin.webp', '', '01 · Đầu trang' ),
			'hero_alt' => array( 'Mô tả ảnh lớn', 'text', 'Khoang Limousine Hải Vân với ghế da và đèn trần', 'A Hai Van limousine cabin with leather seats', '01 · Đầu trang' ),
			'nd_eyebrow' => array( 'Nhãn khối', 'text', 'Khi nào nên thuê xe riêng', 'When to hire a vehicle', '02 · Nhu cầu' ),
			'nd_h2_a' => array( 'H2 · vế 1', 'text', 'Có những chuyến đi', 'Some journeys', '02 · Nhu cầu' ),
			'nd_h2_b' => array( 'H2 · vế 2', 'text', 'không nên đi chung.', 'are better on your own.', '02 · Nhu cầu' ),
			'nd_items' => array( 'Thẻ (tiêu đề | mô tả | ảnh)', 'lines', "Gia đình có người già, trẻ nhỏ | Không gian riêng, dừng nghỉ khi cần, đồ đạc để thoải mái trong khoang hành lý. | hd-limo-seats.webp\nCông ty đưa đón khách, đối tác | Xe sạch, tài xế đúng giờ, đón tại sân bay, khách sạn hay văn phòng. | hd-fleet-street.webp\nĐoàn du lịch, cưới hỏi, sự kiện | Từ xe 7 chỗ đến 45 chỗ, đi một chiều, khứ hồi hay nhiều ngày theo lịch của đoàn. | hd-van-mountain.webp", "Families with elderly people or small children | A private space, stops when you need them, room for all your luggage. | hd-limo-seats.webp\nCompanies moving guests and partners | Clean vehicles and punctual drivers, pick-up at the airport, hotel or office. | hd-fleet-street.webp\nTours, weddings and events | From 7 to 45 seats, one way, return or multi-day on your group's schedule. | hd-van-mountain.webp", '02 · Nhu cầu' ),
			'th_eyebrow' => array( 'Nhãn khối', 'text', 'Điều bạn nhận được', 'What you get', '03 · Tâm và Hành' ),
			'th_h2_a' => array( 'H2 · vế 1', 'text', 'Tử tế từ Tâm.', 'Kindness at heart.', '03 · Tâm và Hành' ),
			'th_h2_b' => array( 'H2 · vế 2', 'text', 'Chu đáo từ Hành.', 'Care in every act.', '03 · Tâm và Hành' ),
			'th_rows' => array( 'Các cặp (Tâm | Hành)', 'lines', "Đi theo lịch của bạn | Tài xế có mặt đúng giờ hẹn, đón tận nơi, dừng nghỉ theo yêu cầu của đoàn\nGiá trọn gói, nói trước | Báo giá đã gồm xăng dầu, phí cầu đường và tài xế; không phụ thu ẩn\nXe đúng hạng bạn chọn | Từ xe 7 chỗ đến 45 chỗ; Limousine 9–11 chỗ ghế da, có sạc USB\nTài xế được tuyển chọn | Gần 1.000 lái xe được đào tạo về an toàn và cách phục vụ hành khách\nCó người lo suốt chuyến | Tổng đài 1900 6763 hỗ trợ 24/7 trong suốt hành trình", "Your schedule, not ours | The driver arrives on time, picks you up at your door and stops when your group needs\nAll-in price, agreed upfront | Quotes include fuel, tolls and the driver; no hidden surcharges\nThe vehicle class you choose | From 7 to 45 seats; 9–11 seat limousines with leather seats and USB charging\nCarefully selected drivers | Nearly 1,000 drivers trained in safety and passenger care\nSomeone looks after you | Our 1900 6763 hotline supports you 24/7 throughout the trip", '03 · Tâm và Hành' ),
			'pr_eyebrow' => array( 'Nhãn khối', 'text', 'Giá tham khảo', 'Indicative prices', '04 · Giá tham khảo' ),
			'pr_h2_a' => array( 'H2 · vế 1', 'text', 'Giá trọn gói,', 'All-in prices,', '04 · Giá tham khảo' ),
			'pr_h2_b' => array( 'H2 · vế 2', 'text', 'biết trước khi đi.', 'known before you go.', '04 · Giá tham khảo' ),
			'pr_note' => array( 'Ghi chú dưới bảng giá', 'textarea', 'Giá tham khảo tuyến Sài Gòn – Vũng Tàu, xe Limousine 9 chỗ, đã gồm xăng dầu, phí cầu đường và tài xế. Tuyến khác hoặc xe lớn hơn: gửi lịch trình để nhận báo giá.', 'Indicative prices for Saigon – Vung Tau in a 9-seat limousine, including fuel, tolls and the driver. Other routes or larger vehicles: send your schedule for a quote.', '04 · Giá tham khảo' ),
			'pr_items' => array( 'Gói (nhãn | tên | giá | mô tả)', 'lines', "1 chiều | Sài Gòn ↔ Vũng Tàu | 2.200.000đ | Đón tận nhà, trả tận nơi.\nKhứ hồi trong ngày | Đi và về trong ngày | 3.800.000đ | Xe chờ đoàn trong ngày, đưa về lại Sài Gòn.\n2 ngày 1 đêm | Nghỉ dưỡng Vũng Tàu | 4.800.000đ | Tài xế phục vụ đoàn đi ăn, tham quan theo lịch riêng.", "One way | Saigon ↔ Vung Tau | 2,200,000đ | Door-to-door pick-up and drop-off.\nSame-day return | There and back in a day | 3,800,000đ | The vehicle waits for your group and brings you back to Saigon.\n2 days 1 night | A Vung Tau getaway | 4,800,000đ | The driver takes your group to meals and sights on your own schedule.", '04 · Giá tham khảo' ),
			'ld_eyebrow' => array( 'Nhãn khối', 'text', 'Nhận báo giá', 'Get a quote', '05 · Form báo giá' ),
			'ld_h2_a' => array( 'H2 · vế 1', 'text', 'Gửi lịch trình,', 'Send your plan,', '05 · Form báo giá' ),
			'ld_h2_b' => array( 'H2 · vế 2', 'text', 'nhận báo giá trọn gói.', 'get an all-in quote.', '05 · Form báo giá' ),
			'ld_intro' => array( 'Đoạn dẫn', 'textarea', 'Điền vài thông tin, bấm nút: Zalo Hải Vân sẽ mở với nội dung đã chép sẵn, bạn chỉ cần dán và gửi.', 'Fill in a few details and tap the button: Hai Van on Zalo opens with your message copied, just paste and send.', '05 · Form báo giá' ),
			'ld_note' => array( 'Dòng ghi chú dưới nút', 'text', 'Tin nhắn được chép sẵn để bạn dán vào Zalo. Hải Vân không lưu thông tin này trên web.', 'Your message is copied for you to paste into Zalo. Hai Van does not store it on the website.', '05 · Form báo giá' ),
			'ld_copied' => array( 'Báo đã chép', 'text', 'Đã chép tin nhắn. Zalo đang mở, bạn dán vào khung chat và gửi nhé.', 'Message copied. Zalo is opening, paste it into the chat and send.', '05 · Form báo giá' ),
			'how_eyebrow' => array( 'Nhãn khối', 'text', 'Cách đặt xe', 'How to book', '06 · Cách đặt' ),
			'how_h2_a' => array( 'H2 · vế 1', 'text', 'Ba bước,', 'Three steps,', '06 · Cách đặt' ),
			'how_h2_b' => array( 'H2 · vế 2', 'text', 'xe tới tận cửa.', 'to your door.', '06 · Cách đặt' ),
			'how_steps' => array( 'Các bước (tiêu đề | mô tả)', 'lines', "Gửi lịch trình qua Zalo | Điểm đón, điểm đến, ngày đi, số người: điền form ở trên hoặc nhắn thẳng.\nNhận báo giá trọn gói | Nhân viên báo giá đã gồm xăng, phí cầu đường, tài xế và loại xe phù hợp.\nXác nhận, tài xế đón đúng giờ | Bạn nhận tên, số điện thoại tài xế và biển số xe trước chuyến đi.", "Send your plan on Zalo | Pick-up, destination, date, number of people: use the form above or message us directly.\nGet an all-in quote | We quote fuel, tolls, the driver and the right vehicle in one price.\nConfirm, and the driver arrives on time | You get the driver's name, phone and plate number before the trip.", '06 · Cách đặt' ),
		),
		'hang-hoa' => array(
			'h1_a' => array( 'H1 · vế 1', 'text', 'Gửi hàng cùng chuyến xe.', 'Send parcels with our coaches.', '01 · Đầu trang' ),
			'h1_b' => array( 'H1 · vế 2 (tô vàng)', 'text', 'Đến nơi ngay trong ngày.', 'Delivered the same day.', '01 · Đầu trang' ),
			'lead' => array( 'Đoạn dẫn', 'textarea', 'Hải Vân nhận gửi hàng hai chiều trên 4 tuyến: Sài Gòn – Vũng Tàu và Hà Nội – Điện Biên, Mộc Châu, Sơn La. Hàng đi ngay chuyến xe gần nhất, người nhận lấy tại văn phòng đầu bên kia.', 'Hai Van carries parcels both ways on 4 routes: Saigon – Vung Tau and Hanoi – Dien Bien, Moc Chau, Son La. Your parcel goes on the next coach and is collected at our office at the other end.', '01 · Đầu trang' ),
			'cta' => array( 'Chữ nút chính', 'text', 'Nhắn Zalo báo cước', 'Ask for a rate on Zalo', '01 · Đầu trang' ),
			'track' => array( 'Chữ link tra cứu đơn', 'text', 'Tra cứu đơn hàng', 'Track a parcel', '01 · Đầu trang' ),
			'hero_img' => array( 'Ảnh lớn', 'image', 'gh-office-boxes.webp', '', '01 · Đầu trang' ),
			'hero_alt' => array( 'Mô tả ảnh lớn', 'text', 'Nhân viên Hải Vân nhận và xếp kiện hàng tại văn phòng', 'Hai Van staff receiving and stacking parcels at the office', '01 · Đầu trang' ),
			'rt_eyebrow' => array( 'Nhãn khối', 'text', 'Tuyến gửi hàng', 'Routes', '02 · Bốn tuyến' ),
			'rt_h2_a' => array( 'H2 · vế 1', 'text', 'Bốn tuyến,', 'Four routes,', '02 · Bốn tuyến' ),
			'rt_h2_b' => array( 'H2 · vế 2', 'text', 'một cách gửi dễ dàng.', 'one easy way to send.', '02 · Bốn tuyến' ),
			'rt_items' => array( 'Tuyến (tên | thời gian | điểm gửi | ảnh | vùng bac/nam)', 'lines', "Sài Gòn ↔ Vũng Tàu | Xe Limousine 15 phút một chuyến, hàng lên ngay chuyến gần nhất | 34 Nguyễn Thái Bình, 307 Nguyễn Văn Trỗi, 607 Điện Biên Phủ (Sài Gòn) · 156B Lê Hồng Phong (Vũng Tàu) | dest-vung-tau.webp | nam\nHà Nội ↔ Điện Biên | Theo chuyến xe trong ngày, thường tới nơi sau 4–12 tiếng | 01 Nguyễn Hoàng, cạnh bến xe Mỹ Đình | dest-dien-bien.webp | bac\nHà Nội ↔ Mộc Châu | Theo chuyến xe trong ngày, thường tới nơi sau 4–12 tiếng | 01 Nguyễn Hoàng (Mỹ Đình) · 254 Trần Huy Liệu (Mộc Châu) | dest-moc-chau.webp | bac\nHà Nội ↔ Sơn La | Theo chuyến xe trong ngày, thường tới nơi sau 4–12 tiếng | 01 Nguyễn Hoàng, cạnh bến xe Mỹ Đình | dest-son-la.webp | bac", "Saigon ↔ Vung Tau | Limousines every 15 minutes, your parcel goes on the next one | 34 Nguyen Thai Binh, 307 Nguyen Van Troi, 607 Dien Bien Phu (Saigon) · 156B Le Hong Phong (Vung Tau) | dest-vung-tau.webp | nam\nHanoi ↔ Dien Bien | On the day's coaches, usually delivered in 4–12 hours | 01 Nguyen Hoang, next to My Dinh bus station | dest-dien-bien.webp | bac\nHanoi ↔ Moc Chau | On the day's coaches, usually delivered in 4–12 hours | 01 Nguyen Hoang (My Dinh) · 254 Tran Huy Lieu (Moc Chau) | dest-moc-chau.webp | bac\nHanoi ↔ Son La | On the day's coaches, usually delivered in 4–12 hours | 01 Nguyen Hoang, next to My Dinh bus station | dest-son-la.webp | bac", '02 · Bốn tuyến' ),
			'rt_go' => array( 'Chữ nút mỗi tuyến', 'text', 'Nhắn Zalo tuyến này', 'Message us for this route', '02 · Bốn tuyến' ),
			'rt_send' => array( 'Chữ "Gửi tại"', 'text', 'Gửi và nhận tại', 'Drop off and collect at', '02 · Bốn tuyến' ),
			'th_eyebrow' => array( 'Nhãn khối', 'text', 'Hàng của bạn', 'Your parcel', '03 · Tâm và Hành' ),
			'th_h2_a' => array( 'H2 · vế 1', 'text', 'Giữ hàng của bạn', 'We look after your parcel', '03 · Tâm và Hành' ),
			'th_h2_b' => array( 'H2 · vế 2', 'text', 'như giữ hàng của mình.', 'like it were our own.', '03 · Tâm và Hành' ),
			'th_rows' => array( 'Các cặp (Tâm | Hành)', 'lines', "Giấy tờ gấp phải đến đúng tay | Nhận hồ sơ, tài liệu quan trọng: niêm phong, ký biên nhận ở cả hai đầu\nHàng tươi phải còn tươi | Hải sản, thực phẩm đóng thùng xốp dán kín, đi khoang hành lý riêng\nTừ phong bì đến hàng tấn | Nhận từ kiện nhỏ tới hàng cồng kềnh; doanh nghiệp có thể đặt xe tải tới 8 tấn\nCó trách nhiệm đến cùng | Mỗi kiện có biên nhận; hư hại hay thất lạc do nhà xe được bồi thường theo quy định\nNói rõ điều không nhận | Không nhận hóa chất độc hại, chất dễ cháy nổ, hàng cấm và động vật sống", "Urgent papers reach the right hands | Important documents are sealed and signed for at both ends\nFresh goods stay fresh | Seafood and food travel in sealed foam boxes in a separate luggage hold\nFrom an envelope to tonnes | Small parcels to bulky goods; businesses can book trucks of up to 8 tonnes\nResponsible to the end | Every parcel has a receipt; loss or damage caused by us is compensated as regulated\nClear about what we can't take | No toxic chemicals, flammables or explosives, prohibited goods or live animals", '03 · Tâm và Hành' ),
			'pr_eyebrow' => array( 'Nhãn khối', 'text', 'Cước Sài Gòn – Vũng Tàu', 'Saigon – Vung Tau rates', '04 · Cước' ),
			'pr_h2_a' => array( 'H2 · vế 1', 'text', 'Cước rõ ràng,', 'Clear rates,', '04 · Cước' ),
			'pr_h2_b' => array( 'H2 · vế 2', 'text', 'biết trước khi gửi.', 'known before you send.', '04 · Cước' ),
			'pr_note' => array( 'Ghi chú dưới bảng cước', 'textarea', 'Cước niêm yết tuyến Sài Gòn – Vũng Tàu, đã gồm VAT. Hàng đi Điện Biên, Mộc Châu, Sơn La: báo loại hàng và khối lượng qua Zalo hoặc tổng đài để được báo cước.', 'Listed rates for Saigon – Vung Tau, VAT included. For Dien Bien, Moc Chau and Son La: tell us the type and weight on Zalo or the hotline for a rate.', '04 · Cước' ),
			'pr_items' => array( 'Mức cước (nhãn | tên | giá | mô tả)', 'lines', "Tài liệu | Bì thư, hồ sơ | Từ 30.000đ | Mỗi bưu gửi.\nKiện vừa | Kiện 40×60 | Từ 40.000đ | Thùng xốp, thùng carton, vali.\nKiện lớn | Kiện 50×70 | Từ 50.000đ | Hàng cồng kềnh, ngoại cỡ: báo giá riêng.", "Documents | Envelopes, files | From 30,000đ | Per item.\nMedium parcel | 40×60 box | From 40,000đ | Foam box, carton or suitcase.\nLarge parcel | 50×70 box | From 50,000đ | Bulky or oversized goods: quoted separately.", '04 · Cước' ),
			'ld_eyebrow' => array( 'Nhãn khối', 'text', 'Báo cước nhanh', 'Quick rate', '05 · Form báo cước' ),
			'ld_h2_a' => array( 'H2 · vế 1', 'text', 'Cho Hải Vân biết', 'Tell us', '05 · Form báo cước' ),
			'ld_h2_b' => array( 'H2 · vế 2', 'text', 'bạn cần gửi gì.', 'what you need to send.', '05 · Form báo cước' ),
			'ld_intro' => array( 'Đoạn dẫn', 'textarea', 'Chọn tuyến và loại hàng, bấm nút: Zalo của tuyến đó sẽ mở với nội dung đã chép sẵn, bạn chỉ cần dán và gửi.', 'Pick the route and parcel type, then tap the button: that route\'s Zalo opens with your message copied, just paste and send.', '05 · Form báo cước' ),
			'ld_note' => array( 'Dòng ghi chú dưới nút', 'text', 'Tin nhắn được chép sẵn để bạn dán vào Zalo. Hải Vân không lưu thông tin này trên web.', 'Your message is copied for you to paste into Zalo. Hai Van does not store it on the website.', '05 · Form báo cước' ),
			'ld_copied' => array( 'Báo đã chép', 'text', 'Đã chép tin nhắn. Zalo đang mở, bạn dán vào khung chat và gửi nhé.', 'Message copied. Zalo is opening, paste it into the chat and send.', '05 · Form báo cước' ),
			'how_eyebrow' => array( 'Nhãn khối', 'text', 'Cách gửi', 'How it works', '06 · Cách gửi' ),
			'how_h2_a' => array( 'H2 · vế 1', 'text', 'Ba bước,', 'Three steps,', '06 · Cách gửi' ),
			'how_h2_b' => array( 'H2 · vế 2', 'text', 'hàng lên xe.', 'and it is on its way.', '06 · Cách gửi' ),
			'how_steps' => array( 'Các bước (tiêu đề | mô tả)', 'lines', "Mang hàng ra văn phòng | Gửi tại văn phòng Hải Vân gần nhất trên tuyến; hàng tươi đóng thùng xốp dán kín.\nNhận biên nhận | Nhân viên kiểm tra, niêm phong và lập biên nhận; bạn báo người nhận thông tin đơn.\nNgười nhận lấy hàng | Người nhận lấy tại văn phòng đầu bên kia khi xe tới. Theo dõi đơn ở trang Tra cứu đơn hàng.", "Bring it to our office | Drop it off at the nearest Hai Van office on the route; fresh goods in sealed foam boxes.\nGet a receipt | Staff check, seal and issue a receipt; pass the details to your recipient.\nThe recipient collects | They pick it up at the office at the other end when the coach arrives. Follow it on the Track a parcel page.", '06 · Cách gửi' ),
			'biz_text' => array( 'Dòng dành cho doanh nghiệp', 'textarea', 'Doanh nghiệp, hộ kinh doanh cần gửi định kỳ hoặc thuê xe tải riêng (tới 8 tấn): gọi 1900 6763 để được tư vấn.', 'Businesses sending regularly or needing a dedicated truck (up to 8 tonnes): call 1900 6763 for advice.', '06 · Cách gửi' ),
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

/* ---- Khối hiển thị dùng chung cho trang kể chuyện (Xe hợp đồng, Gửi hàng…) ---- */

/** Bảng cặp Tâm | Hành từ trường lines; $col_a/$col_b = tiêu đề hai cột. */
function hv2_story_pairs( $key, $col_a, $col_b ) {
	echo '<div class="hv2-pairs" role="table" aria-label="' . esc_attr( $col_a . ' – ' . $col_b ) . '"><div class="hv2-pairs-head" role="row"><span role="columnheader">' . esc_html( $col_a ) . '</span><span role="columnheader">' . esc_html( $col_b ) . '</span></div>';
	foreach ( hv2_s_lines( $key ) as $i => $r ) {
		echo '<div class="hv2-pairs-row" role="row"><p role="cell"><span class="hv2-no">' . esc_html( sprintf( '%02d', $i + 1 ) ) . '</span>' . esc_html( $r[0] ) . '</p><p role="cell">' . esc_html( $r[1] ?? '' ) . '</p></div>';
	}
	echo '</div>';
}

/** Thẻ giá trên nền than (nhãn | tên | giá | mô tả), thẻ đầu vàng — cùng kiểu thẻ ưu đãi. */
function hv2_story_prices( $key, $note_key ) {
	echo '<ul class="hv2-offers hv2-offers--dark">';
	foreach ( hv2_s_lines( $key ) as $i => $r ) {
		echo '<li class="hv2-offer' . ( 0 === $i ? ' hv2-offer--lead' : '' ) . '"><span class="hv2-offer-tag">' . esc_html( $r[0] ) . '</span><h3>' . esc_html( $r[1] ?? '' ) . '</h3><p class="hv2-offer-price"><strong>' . esc_html( $r[2] ?? '' ) . '</strong></p><p class="hv2-offer-cond">' . esc_html( $r[3] ?? '' ) . '</p></li>';
	}
	echo '</ul><p class="hv2-milestone">' . esc_html( hv2_s( $note_key ) ) . '</p>';
}

/** Ba bước (tiêu đề | mô tả). */
function hv2_story_howto( $key ) {
	echo '<ol class="hv2-howto">';
	foreach ( hv2_s_lines( $key ) as $i => $r ) {
		echo '<li><span class="hv2-howto-n">' . esc_html( sprintf( '%02d', $i + 1 ) ) . '</span><h3>' . esc_html( $r[0] ) . '</h3><p>' . esc_html( $r[1] ?? '' ) . '</p></li>';
	}
	echo '</ol>';
}

/** Đầu trang dịch vụ: đường dẫn, nhãn, H1 hai vế, đoạn dẫn, nút (HTML đã escape), tab cùng mục, ảnh rộng. */
function hv2_story_top( $actions_html ) {
	$trail = hv_page_trail( get_post() );
	echo '<div class="hv2-wrap hv-page hv2-story-page">';
	hv_breadcrumb_trail( $trail );
	hv2_page_head( hv2_section_label( $trail ), hv2_s( 'h1_a' ), hv2_s( 'lead' ), $actions_html, hv2_s( 'h1_b' ) );
	hv2_subnav_tabs( hv2_hub_nav( get_post() ) );
	echo '<figure class="hv2-wide-photo">' . hv2_story_img( hv2_s( 'hero_img' ), hv2_s( 'hero_alt' ), 'fetchpriority="high" decoding="async"' ) . '</figure></div>'; // phpcs:ignore WordPress.Security.EscapeOutput -- img dựng và escape trong hv2_story_img().
}

/**
 * Tab của trang dịch vụ có trang con (Xe hợp đồng, Gửi hàng): chính trang đó ("Tổng quan") + các trang con; không có
 * trang con thì dùng các trang cùng mục như mọi trang khác.
 */
function hv2_hub_nav( $post ) {
	$kids = get_pages( array( 'parent' => $post->ID, 'sort_column' => 'menu_order,ID', 'post_status' => 'publish' ) );
	if ( ! $kids ) {
		return hv_page_subnav( $post );
	}
	$nav = array( array( 'en' === hv_lang() ? 'Overview' : 'Tổng quan', get_permalink( $post ), true ) );
	foreach ( $kids as $k ) {
		$nav[] = array( get_the_title( $k ), get_permalink( $k ), false );
	}
	return $nav;
}
