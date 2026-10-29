<?php
/**
 * Dữ liệu seed 4 tuyến chính (wordpress/scripts/seed-corridors.php). SINH TỰ ĐỘNG từ trang booking.haivan.com đã lưu
 * (tên, ghi chú `data-note`, thứ tự điểm) + toạ độ điểm đầu tuyến từ apigw places; tiếng Anh do ta dịch.
 * Quy ước: điểm ở đầu Sài Gòn thuộc "Tuyến Tân Sơn Nhất" tìm chuyến theo toạ độ Sân bay Tân Sơn Nhất (apigw place #75),
 * còn lại theo Quận 1 (#983); Long Thành theo Quận 1 (chưa rõ tuyến, xem báo cáo). Điểm không có toạ độ riêng dùng điểm đầu tuyến.
 * Landing: chỉ slug đã kiểm tra trang /xe-khach/<slug> có tiêu đề riêng (không phải trang mặc định noindex); chưa có = null.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

return array(
	array(
		'id'         => 'sg-vt',
		'label_vi'   => 'Sài Gòn – Vũng Tàu',
		'label_en'   => 'Saigon – Vung Tau',
		'order'      => 0,
		'sleeper'    => false,
		'max_days'   => 29,
		'landing_ab' => 'quan-1/vung-tau',
		'landing_ba' => 'vung-tau/quan-1-san-bay',
		'a'          => array( 'vi' => 'Sài Gòn', 'en' => 'Saigon', 'point_name' => 'Quận 1', 'lat' => '10.7753882', 'lng' => '106.702825' ),
		'b'          => array( 'vi' => 'Vũng Tàu', 'en' => 'Vung Tau', 'point_name' => 'TP Vũng Tàu (Gành Hào)', 'lat' => '10.3391989', 'lng' => '107.0710401' ),
		'stops_a'    => 'q1 | Quận 1 – Phòng chờ 34 Nguyễn Thái Bình | District 1 – 34 Nguyen Thai Binh waiting room
luong-dinh-cua | Thủ Đức – 6 Lương Định Của | Thu Duc – 6 Luong Dinh Cua | Đón/trả tại 6 Lương Định Của, An Khánh, Thủ Đức.
tsn-t1 | Sân bay Tân Sơn Nhất – Ga quốc nội T1 | Tan Son Nhat Airport – Domestic terminal T1 | Đón/trả tại sân bay Tân Sơn Nhất, ga quốc nội T1. | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
tsn-t2 | Sân bay Tân Sơn Nhất – Ga quốc tế T2 | Tan Son Nhat Airport – International terminal T2 | Đón/trả tại sân bay Tân Sơn Nhất, ga quốc tế T2. | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
tsn-t3 | Sân bay Tân Sơn Nhất – Ga quốc nội T3 | Tan Son Nhat Airport – Domestic terminal T3 | Đón/trả tại sân bay Tân Sơn Nhất, ga quốc nội T3. | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
tan-binh | Tân Bình – Phòng chờ 307 Nguyễn Văn Trỗi | Tan Binh – 307 Nguyen Van Troi waiting room |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
binh-thanh | Bình Thạnh – Phòng chờ 607 Điện Biên Phủ | Binh Thanh – 607 Dien Bien Phu waiting room |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
dbp-159 | Quận 1 – 159 Điện Biên Phủ | District 1 – 159 Dien Bien Phu |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
vinh-nghiem | Quận 3 – Chùa Vĩnh Nghiêm | District 3 – Vinh Nghiem Pagoda |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
huynh-van-banh | Phú Nhuận – Cây xăng Huỳnh Văn Bánh | Phu Nhuan – Huynh Van Banh petrol station |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
thao-dien | Thủ Đức – Vincom Thảo Điền | Thu Duc – Vincom Thao Dien |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
lexington | Thủ Đức – Lexington Residence (Mai Chí Thọ) | Thu Duc – Lexington Residence (Mai Chi Tho) |  | Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245
long-thanh | Long Thành | Long Thanh
long-thanh-stop | Trạm dừng Long Thành | Long Thanh rest stop',
		'stops_b'    => 'vt | Vũng Tàu – Phòng chờ 156B Lê Hồng Phong | Vung Tau – 156B Le Hong Phong waiting room
vt-hotel | Vũng Tàu – Khách sạn / nhà riêng (ghi địa chỉ) | Vung Tau – Hotel / home (enter the address) | Đón/trả tại khách sạn / nhà riêng ở Vũng Tàu, địa chỉ:
ganh-hao | Vũng Tàu – Gành Hào (bãi sau) | Vung Tau – Ganh Hao (Back Beach)
hoang-hoa-tham | Vũng Tàu – Cây xăng Hoàng Hoa Thám | Vung Tau – Hoang Hoa Tham petrol station
lotte | Vũng Tàu – Lotte Mart | Vung Tau – Lotte Mart
paradise | Vũng Tàu – Bùng binh Paradise | Vung Tau – Paradise roundabout
gieng-nuoc | Vũng Tàu – Ngã tư Giếng Nước | Vung Tau – Gieng Nuoc intersection
dau-khi | Vũng Tàu – Bùng binh Dầu Khí | Vung Tau – Dau Khi roundabout
seaview | Vũng Tàu – Chung cư Seaview | Vung Tau – Seaview apartments
nguyen-huu-canh | Vũng Tàu – Ngã tư Nguyễn Hữu Cảnh | Vung Tau – Nguyen Huu Canh intersection
luu-chi-hieu | Vũng Tàu – Ngã tư Lưu Chí Hiếu | Vung Tau – Luu Chi Hieu intersection
khang-linh | Vũng Tàu – Cổng Khang Linh | Vung Tau – Khang Linh gate
dong-xuyen | Vũng Tàu – KCN Đông Xuyên | Vung Tau – Dong Xuyen industrial park
cua-lap | Vũng Tàu – Bùng binh Cửa Lấp | Vung Tau – Cua Lap roundabout
eo-ong-tu | Vũng Tàu – Ẹo Ông Từ | Vung Tau – Eo Ong Tu
ba-ria | Bà Rịa – Trung tâm | Ba Ria – City centre
nga-ba-ba-ria | Bà Rịa – Ngã ba Bà Rịa | Ba Ria – Ba Ria junction
tan-thanh | Tân Thành – Bà Rịa | Tan Thanh – Ba Ria',
		'default_a'  => 'q1',
		'default_b'  => 'vt',
	),
	array(
		'id'         => 'hn-db',
		'label_vi'   => 'Hà Nội – Điện Biên',
		'label_en'   => 'Hanoi – Dien Bien',
		'order'      => 1,
		'sleeper'    => true,
		'max_days'   => 29,
		'landing_ab' => 'my-dinh/dien-bien',
		'landing_ba' => null,
		'a'          => array( 'vi' => 'Hà Nội', 'en' => 'Hanoi', 'point_name' => 'Bến xe Mỹ Đình', 'lat' => '21.0284297', 'lng' => '105.7782687' ),
		'b'          => array( 'vi' => 'Điện Biên', 'en' => 'Dien Bien', 'point_name' => 'Bến xe Điện Biên', 'lat' => '21.392683719524', 'lng' => '103.010258674622' ),
		'stops_a'    => 'my-dinh | Bến xe Mỹ Đình | My Dinh Bus Station',
		'stops_b'    => 'dien-bien | Bến xe Điện Biên | Dien Bien Bus Station |  | Bến xe Điện Biên, 21.392683719524, 103.010258674622
ban-phu | Bản Phủ | Ban Phu |  | Bản Phủ, 21.3174085589382, 103.010549797354
muong-cha | Mường Chà | Muong Cha |  | Mường Chà, 21.7547891787249, 103.088819161293',
		'default_a'  => 'my-dinh',
		'default_b'  => 'dien-bien',
	),
	array(
		'id'         => 'hn-moc',
		'label_vi'   => 'Hà Nội – Mộc Châu',
		'label_en'   => 'Hanoi – Moc Chau',
		'order'      => 2,
		'sleeper'    => false,
		'max_days'   => 29,
		'landing_ab' => null,
		'landing_ba' => null,
		'a'          => array( 'vi' => 'Hà Nội', 'en' => 'Hanoi', 'point_name' => 'Bến xe Mỹ Đình', 'lat' => '21.0284297', 'lng' => '105.7782687' ),
		'b'          => array( 'vi' => 'Mộc Châu', 'en' => 'Moc Chau', 'point_name' => 'Mộc Châu', 'lat' => '20.8461723', 'lng' => '104.6415738' ),
		'stops_a'    => 'my-dinh | Bến xe Mỹ Đình | My Dinh Bus Station
nguyen-tuan | 35 Nguyễn Tuân | 35 Nguyen Tuan
chau-van-liem | 10 Châu Văn Liêm | 10 Chau Van Liem',
		'stops_b'    => 'nong-truong | Nông trường Mộc Châu | Moc Chau Farm
muong-thanh | Khách sạn Mường Thanh | Muong Thanh Hotel
truong-giang | Khách sạn Trường Giang | Truong Giang Hotel
ben-xe-mc | Bến xe Mộc Châu | Moc Chau Bus Station
tran-huy-lieu | Văn phòng 254 Trần Huy Liệu | Office, 254 Tran Huy Lieu
ban-ang | Bản Áng | Ban Ang
pa-hang | Ngã 3 Pa Háng | Pa Hang junction
muong-sang | Cây xăng Mường Sang | Muong Sang petrol station',
		'default_a'  => 'my-dinh',
		'default_b'  => 'nong-truong',
	),
	array(
		'id'         => 'hn-sl',
		'label_vi'   => 'Hà Nội – Sơn La',
		'label_en'   => 'Hanoi – Son La',
		'order'      => 3,
		'sleeper'    => false,
		'max_days'   => 29,
		'landing_ab' => 'my-dinh/son-la',
		'landing_ba' => null,
		'a'          => array( 'vi' => 'Hà Nội', 'en' => 'Hanoi', 'point_name' => 'Bến xe Mỹ Đình', 'lat' => '21.0284297', 'lng' => '105.7782687' ),
		'b'          => array( 'vi' => 'Sơn La', 'en' => 'Son La', 'point_name' => 'Bến xe Sơn La', 'lat' => '21.3014976', 'lng' => '103.9435128' ),
		'stops_a'    => 'my-dinh | Bến xe Mỹ Đình | My Dinh Bus Station
nguyen-tuan | 35 Nguyễn Tuân | 35 Nguyen Tuan
chau-van-liem | 10 Châu Văn Liêm | 10 Chau Van Liem',
		'stops_b'    => 'don-tan-noi | Đón trả tận nơi (trung tâm TP) | Door-to-door (Son La city centre) | Đón trả tận nơi trong trung tâm TP. Sơn La
ben-xe-sl | Bến xe Sơn La | Son La Bus Station',
		'default_a'  => 'my-dinh',
		'default_b'  => 'don-tan-noi',
	),
);
