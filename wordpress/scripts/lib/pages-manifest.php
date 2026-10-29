<?php
/**
 * Danh sách trang nội dung giữ URL cũ (từ build manifest web cũ).
 * Thuộc WordPress: mọi thứ KHÔNG nằm trong /xe-khach, /tai-khoan, /partner, /tracking (Next).
 *
 * Khoá = đường dẫn (không "/" đầu/cuối). Giá trị: [tiêu đề vi, tiêu đề en|null, template|null].
 * Trang cha (không có URL riêng trong web cũ) tạo ở trạng thái nháp, chỉ để giữ cấu trúc /a/b.
 *
 * Dùng bởi seed-site.php và import-old-site.php.
 */

$landing = 'templates/landing-search.php';

return array(
	'parents' => array(
		'chung-toi'            => array( 'Chúng tôi', 'About us' ),
		'dich-vu'              => array( 'Dịch vụ', 'Services' ),
		'dich-vu/xe-lien-tinh' => array( 'Xe liên tỉnh', 'Inter-city bus' ),
		'dich-vu/xe-hop-dong'  => array( 'Xe hợp đồng', 'Rental cars' ),
		'dich-vu/hang-hoa'     => array( 'Hàng hoá', 'Cargo' ),
		'chinh-sach'           => array( 'Chính sách', 'Policies' ),
		'tuyen-duong'          => array( 'Tuyến đường', 'Routes' ),
	),
	'pages'   => array(
		// Chúng tôi
		'chung-toi/gioi-thieu'                         => array( 'Về HAIVAN', 'About Haivan', null ),
		'chung-toi/an-toan-chat-luong'                 => array( 'An toàn & chất lượng', 'Safety and Quality', null ),
		'chung-toi/phat-trien-ben-vung'                => array( 'Phát triển bền vững', 'Sustainable Development', null ),
		'chung-toi/danh-gia-cua-khach-hang'            => array( 'Đánh giá của khách hàng', 'Customer Review', null ),
		'chung-toi/doi-tac'                            => array( 'Đối tác', 'Partners', null ),
		'chung-toi/chuong-trinh-khach-hang-than-thiet' => array( 'Chương trình khách hàng thân thiết', 'Loyalty program', null ),
		'chung-toi/lien-he'                            => array( 'Liên hệ', 'Contact', null ),
		'chung-toi/tuyen-dung'                         => array( 'Tuyển dụng', 'Recruitment', null ),
		// Dịch vụ
		'dich-vu/xe-lien-tinh/chon-cho-truoc'          => array( 'Chọn chỗ trước', 'Choose your seat', null ),
		'dich-vu/xe-lien-tinh/giai-tri'                => array( 'Giải trí', 'Entertainment', null ),
		'dich-vu/xe-lien-tinh/hanh-ly'                 => array( 'Hành lý', 'Luggage', null ),
		'dich-vu/xe-lien-tinh/hanh-ly-that-lac'        => array( 'Hành lý thất lạc', 'Lost luggage', null ),
		'dich-vu/xe-lien-tinh/phong-cho'               => array( 'Phòng chờ', 'Waiting lounge', null ),
		'dich-vu/xe-lien-tinh/phong-ve'                => array( 'Phòng vé', 'Ticket office', null ),
		'dich-vu/xe-lien-tinh/tien-ich-tren-xe'        => array( 'Tiện ích trên xe', 'On-board amenities', null ),
		'dich-vu/xe-lien-tinh/ung-dung'                => array( 'Ứng dụng', 'Mobile app', null ),
		'dich-vu/xe-hop-dong/an-toan-chat-luong'       => array( 'An toàn & chất lượng', 'Safety and Quality', null ),
		'dich-vu/xe-hop-dong/giai-tri'                 => array( 'Giải trí', 'Entertainment', null ),
		'dich-vu/xe-hop-dong/lai-xe'                   => array( 'Lái xe', 'Drivers', null ),
		'dich-vu/xe-hop-dong/phuong-tien'              => array( 'Phương tiện', 'Vehicles', null ),
		'dich-vu/xe-hop-dong/ung-dung'                 => array( 'Ứng dụng', 'Mobile app', null ),
		'dich-vu/hang-hoa/tra-cuu-don'                 => array( 'Tra cứu hàng hoá', 'Parcel tracking', null ),
		// Chính sách
		'chinh-sach/bao-mat-thanh-toan'                => array( 'Chính sách bảo mật thanh toán', 'Payment security policy', null ),
		'chinh-sach/bao-mat-thong-tin'                 => array( 'Chính sách bảo mật thông tin', 'Information security policy', null ),
		'chinh-sach/giai-quyet-khieu-nai'              => array( 'Chính sách và quy trình giải quyết khiếu nại', 'Policies and procedures to resolve complaints', null ),
		'chinh-sach/huong-dan-thanh-toan-vnpay'        => array( 'Hướng dẫn thanh toán VNPAY-QR', 'VNPAY-QR payment guide', null ),
		'chinh-sach/quy-che'                           => array( 'Quy chế HAIVAN.COM', 'Regulations of HAIVAN.COM', null ),
		// Hỗ trợ
		'ho-tro'                                       => array( 'Hỗ trợ', 'Support', null ),
		'ho-tro/huong-dan-thanh-toan'                  => array( 'Hướng dẫn thanh toán', 'Payment guide', null ),
		'ho-tro/thanh-toan-viettel'                    => array( 'Hướng dẫn thanh toán Viettel Money', 'Viettel Money payment guide', null ),
		// Khác
		'haivanplus'                                   => array( 'HAIVAN Plus', 'HAIVAN Plus', null ),
		'mobile'                                       => array( 'Ứng dụng HAIVAN', 'HAIVAN app', null ),
		'xe-san-bay'                                   => array( 'Xe sân bay', 'Airport transfer', null ),
		// Tuyến đường (trang giới thiệu tuyến)
		'tuyen-duong/da-lat-bao-loc-lien-khuong'       => array( 'Đà Lạt - Bảo Lộc - Liên Khương', 'Da Lat - Bao Loc - Lien Khuong', null ),
		'tuyen-duong/ha-noi-dien-bien-ban-phu-muong-lay' => array( 'Hà Nội - Điện Biên - Bản Phủ - Mường Lay', 'Ha Noi - Dien Bien - Ban Phu - Muong Lay', null ),
		'tuyen-duong/ha-noi-ha-giang'                  => array( 'Hà Nội - Hà Giang', 'Ha Noi - Ha Giang', null ),
		'tuyen-duong/ha-noi-lao-cai-sapa'              => array( 'Hà Nội - Lào Cai - Sapa', 'Ha Noi - Lao Cai - Sapa', null ),
		'tuyen-duong/ha-noi-son-la'                    => array( 'Hà Nội - Sơn La', 'Ha Noi - Son La', null ),
		'tuyen-duong/tan-son-nhat-vung-tau'            => array( 'Tân Sơn Nhất - Vũng Tàu', 'Tan Son Nhat - Vung Tau', null ),
		// Landing đặt vé nhanh (widget tìm vé)
		'dat-ve-nhanh'                                 => array( 'Đặt vé nhanh', 'Quick booking', $landing ),
		'dat-ve-nhanh/baiviet'                         => array( 'Bài viết', 'Articles', $landing ),
		'dat-ve-nhanh/footer'                          => array( 'Đặt vé nhanh - Footer', 'Quick booking - Footer', $landing ),
		'dat-ve-nhanh/giave'                           => array( 'Giá vé', 'Fares', $landing ),
		'dat-ve-nhanh/gioithieu'                       => array( 'Giới thiệu', 'About', $landing ),
		'dat-ve-nhanh/header'                          => array( 'Đặt vé nhanh - Header', 'Quick booking - Header', $landing ),
		'dat-ve-nhanh/khach-hang-noi'                  => array( 'Khách hàng nói về Hải Vân', 'Customers say', $landing ),
		'dat-ve-nhanh/khachhang'                       => array( 'Khách hàng', 'Customers', $landing ),
		'dat-ve-nhanh/lienhe'                          => array( 'Liên hệ', 'Contact', $landing ),
		'dat-ve-nhanh/slide'                           => array( 'Slide', 'Slide', $landing ),
		'dat-ve-nhanh/slide_banner'                    => array( 'Slide banner', 'Slide banner', $landing ),
		'dat-ve-nhanh/taiapp'                          => array( 'Tải ứng dụng', 'Get the app', $landing ),
		'dat-ve-nhanh/taisao'                          => array( 'Tại sao chọn Hải Vân', 'Why Hai Van', $landing ),
		'dat-ve-nhanhs'                                => array( 'Đặt vé nhanh', 'Quick booking', $landing ),
		'dat-ve-nhanhs/baiviet'                        => array( 'Bài viết', 'Articles', $landing ),
		'dat-ve-nhanhs/gioithieu'                      => array( 'Giới thiệu', 'About', $landing ),
		'dat-ve-nhanhs/khachhang'                      => array( 'Khách hàng', 'Customers', $landing ),
		'dat-ve-nhanhs/slide'                          => array( 'Slide', 'Slide', $landing ),
		'dat-ve-nhanhs/taisao'                         => array( 'Tại sao chọn Hải Vân', 'Why Hai Van', $landing ),
	),
);
