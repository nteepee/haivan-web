# Bảng mâu thuẫn pháp lý và thương hiệu

> **Trạng thái:** bàn giao 29/10/2026.
> - Cột "Nội dung hiện tại" lấy từ bản chụp site cũ (`archive/old-site/`) và dữ liệu footer trong theme (`layout-seed.json`). MKT kiểm lại trên WordPress trước khi sửa.
> - Số tài khoản ngân hàng và số cá nhân không được chép đầy đủ. Các ô đó được che; xem trang gốc khi cần.
> - Cột "Thông tin đúng" để trống. Chỉ chủ dự án điền. Không sửa trang khi chưa có xác nhận.

**Tên file viết tắt trong bảng:** `layout-seed.json` = `wordpress/wp-content/themes/haivan-web-child/data/layout-seed.json`; `layout-fallback.json` = `apps/booking/src/content/layout-fallback.json`.

**Nơi sửa:**
- Footer và số hotline: Cài đặt → Layout Hải Vân (WordPress). Footer đọc từ cùng dữ liệu này (xem `docs/wordpress.md`, mục "MKT sửa gì ở đâu").
- Trang chính sách, hỗ trợ, giới thiệu: sửa trang WordPress tương ứng.
- Danh sách địa chỉ phòng chờ trên trang chủ: Cài đặt → Trang chủ Hải Vân.

| # | Mục | Trang / đường dẫn | Nội dung hiện tại | Nguồn kiểm trong repo | Thông tin đúng (anh xác nhận) |
|---|---|---|---|---|---|
| **A. Pháp lý doanh nghiệp** | | | | | |
| 1 | Địa chỉ ĐKKD (tiếng Việt) | Footer mọi trang tiếng Việt; phần pháp lý của `/chinh-sach/quy-che` và `/chinh-sach/bao-mat-thong-tin` | "Số 10.15 Lương Thế Vinh, khu ĐTM phía Đông, P. Tân Hưng, TP. Hải Phòng, Việt Nam" | `wordpress/wp-content/themes/haivan-web-child/data/layout-seed.json` (dòng 314); `apps/booking/src/content/layout-fallback.json` (dòng 314) | |
| 2 | Địa chỉ ĐKKD (tiếng Anh) | Footer mọi trang `/en/` | "Registered business address: 10.15 Luong The Vinh street, Hai Duong city." | `layout-seed.json` (dòng 564) | |
| 3 | Cơ quan cấp giấy ĐKKD | Footer tiếng Việt và tiếng Anh | Việt: "Giấy chứng nhận ĐKKD số 0800290724 do sở KH&ĐT tỉnh Hải Dương cấp lần đầu ngày 18/04/2008" (chữ "sở" viết thường). Anh: "…issued by the Department of Planning and Investment of Hai Duong province…" | `layout-seed.json` (dòng 316, 566) | |
| 4 | Địa chỉ liên hệ, trụ sở (footer) | Footer tiếng Việt và tiếng Anh | Việt: "Tầng 5, Toà nhà 125 Hoàng Ngân, Phường Yên Hòa, Hà Nội". Anh: "Floor 5, building 125 Hoang Ngan, Cau Giay district, Ha Noi city." | `layout-seed.json` (dòng 315, 565) | |
| 5 | Địa chỉ trụ sở trên trang chính sách | `/chinh-sach/quy-che` (vi, en); `/chinh-sach/bao-mat-thong-tin` (vi, en) | Quy chế: "Lô C8 Nguyễn Chánh, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội". Bảo mật: "HAIVAN – Lô C8 Nguyễn Chánh, Phường Trung Hòa, Quận Cầu Giấy, TP. Hà Nội, Việt Nam" | `archive/old-site/pages/chinh-sach/quy-che.html`; `archive/old-site/pages/chinh-sach/bao-mat-thong-tin.html` | |
| 6 | Tên pháp nhân | Footer; bài tin mùa thi 2025 (Mộc Châu); trang tuyến Sơn La (seed WordPress) | Footer: "Công ty liên doanh vận chuyển quốc tế Hải Vân". Bài tin: "Công ty Hải Vân Xuân Tráng". Seed Sơn La: "Hải Vân Xuân Tráng chạy Hà Nội – Sơn La" | `layout-seed.json` (dòng 312); `archive/old-site/pages/chung-toi/bao-chi-tin-tuc/tiep-suc-mua-thi-2025-…html`; `wordpress/scripts/lib/route-landing-seed.php` | Pháp nhân nào là bên cung cấp dịch vụ trên site |
| **B. Địa điểm và phòng chờ** | | | | | |
| 7 | Danh sách phòng chờ trên trang chủ | Cài đặt → Trang chủ Hải Vân (mặc định trong code) | 6 dòng: 34 Nguyễn Thái Bình (Quận 1); 307 Nguyễn Văn Trỗi (Sài Gòn); 607 Điện Biên Phủ (Sài Gòn); 156B Lê Hồng Phong (Vũng Tàu); 01 Nguyễn Hoàng (Mỹ Đình, Hà Nội); Quầy Tân Sơn Nhất (nhà ga T1, T2, T3) | `wordpress/wp-content/themes/haivan-web-child/inc/home-settings.php` | Danh sách nào đúng. Khác với danh sách điểm trong `offpage-plan.md` |
| 8 | Vị trí quầy ga T1 Tân Sơn Nhất | Trang tuyến sân bay (`/xe-khach/tan-son-nhat/vung-tau`) và trang liên quan | Audit ghi "Cột B6 Ga Quốc Nội". Bản chụp đặt vé và seed ghi "cột B5 nhà ga T1" | `wordpress/scripts/lib/route-landing-seed.php`; `docs/reference/route-landing/en-ho-chi-minh-city-to-vung-tau-bus.json` | Cột nào |
| 9 | Điểm dừng nghỉ Mộc Châu | Trang tuyến Sơn La (seed WordPress); trang tuyến Mộc Châu | Seed: "Tổ dân phố 70, phường Vân Sơn, Mộc Châu, Sơn La". Bản chụp đặt vé Mộc Châu: "Văn phòng 254 Trần Huy Liệu, thị trấn Mộc Châu, Sơn La" | `wordpress/scripts/lib/route-landing-seed.php`; `docs/reference/route-landing/mua-ve-xe-ha-noi-moc-chau.json` | Địa chỉ đúng; điểm này thuộc tuyến nào |
| 10 | Bến xe Điện Biên | Trang tuyến Điện Biên | Bản chụp đặt vé: "Bến xe khách thành phố Điện Biên Phủ, 79 Quốc lộ 12"; "Văn phòng Hải Vân Điện Biên, 300 Nguyễn Hữu Thọ". Audit gọi là "Bến xe Điện Biên Phủ" | `docs/reference/route-landing/mua-ve-xe-ha-noi-dien-bien.json` | Điểm đón nào là phòng chờ chính thức |
| **C. Email** | | | | | |
| 11 | Email thông tin chung | `/chinh-sach/quy-che` (vi, en) | "info@haivan.com" ở mục liên hệ; cùng trang, mục hoàn tiền dùng "cskh@haivan.com" | `archive/old-site/pages/chinh-sach/quy-che.html` | Email nào dùng cho việc gì |
| 12 | Email CSKH và khiếu nại | `/chinh-sach/bao-mat-thong-tin`; `/chinh-sach/giai-quyet-khieu-nai` | "cskh@haivan.com" | `archive/old-site/pages/chinh-sach/bao-mat-thong-tin.html`; `…/giai-quyet-khieu-nai.html` | |
| 13 | Email đối tác và đại lý | `/chung-toi/doi-tac` (vi, en) | "hoptac@haivan.com" cho đối tác xe tuyến; "hotro@haivan.com" cho đại lý bán vé | `archive/old-site/pages/chung-toi/doi-tac.html` | |
| 14 | Email tuyển dụng | `/chung-toi/tuyen-dung` (vi, en) | "tuyendung@haivantravel.com" (tên miền haivantravel.com, khác haivan.com) | `archive/old-site/pages/chung-toi/tuyen-dung.html` | |
| 15 | Email kinh doanh | Bài tin "Hải Vân trợ giá … chuyến xe Xuân đưa bà con về quê đón Tết" (vi, en) | "kinhdoanh@haivantravel.com" | `archive/old-site/pages/chung-toi/bao-chi-tin-tuc/hai-van-tro-gia-…html` | |
| 16 | Email trên trang HAIVAN Plus | `/haivanplus` (vi, en) | Hai địa chỉ cá nhân trên tên miền havaz.vn (đã ẩn) | `archive/old-site/pages/haivanplus.html` | Có phải kênh chính thức không. Nếu không, gỡ cùng việc gộp nội dung trùng |
| 17 | Email trên trang landing cũ | `/dat-ve-nhanh/gioithieu`, `/dat-ve-nhanhs` | "haivan.info@haivan.com" | `archive/old-site/pages/dat-ve-nhanh/gioithieu.html` | Trang này thuộc nhóm trang rác cần gỡ hoặc chuyển hướng |
| **D. Hotline** | | | | | |
| 18 | Hotline dùng trong footer và header | Header, footer (dữ liệu chung) | "1900 6763" | `layout-seed.json` (dòng 3); `apps/booking/src/content/layout-fallback.json` (dòng 3) | Số chính thức và cách viết |
| 19 | Cách viết khác của cùng số | `/chinh-sach/quy-che` | "1900-6763" | `archive/old-site/pages/chinh-sach/quy-che.html` | Thống nhất theo mục 18 |
| 20 | Cách viết khác của cùng số | `/chinh-sach/bao-mat-thong-tin`; `/chinh-sach/giai-quyet-khieu-nai` | "19006763" | `archive/old-site/pages/chinh-sach/bao-mat-thong-tin.html` | Thống nhất theo mục 18 |
| 21 | Số sai | `/dich-vu/xe-lien-tinh/chon-cho-truoc` (vi, en) | "Ghế có thể được đặt trước bằng cách gọi tới tổng đài 19006773" | `archive/old-site/pages/dich-vu/xe-lien-tinh/chon-cho-truoc.html` | Số đúng |
| 22 | Tổng đài thứ hai | Nhiều trang và bài tin; trang tuyến Sơn La (seed WordPress) | "1900 9398" | Quét `archive/old-site/pages/`; `wordpress/scripts/lib/route-landing-seed.php` | Còn dùng không; dùng cho việc gì |
| 23 | Số khác trong bài tin Mộc Châu và Sơn La | Các bài tin hỗ trợ đặt vé khu vực Mộc Châu, Sơn La | "0981 559 551" và "0981558551" (cùng một số, hai cách viết); "0919 006 763" trong bài thông báo tạm dừng ưu đãi | Quét `archive/old-site/pages/chung-toi/bao-chi-tin-tuc/` | Số nào còn hiệu lực; số nào là của đơn vị khác |
| 24 | Số hotline tuyển dụng | `/chung-toi/tuyen-dung` | "Hotline: 0988772727" | `archive/old-site/pages/chung-toi/tuyen-dung.html` | Đây là số tuyển dụng hay tổng đài |
| 25 | Số di động không rõ chủ | `/haivanplus` (vi, en); vài bài tin (đã ẩn) | Số di động cá nhân (đã ẩn) | Quét `archive/old-site/pages/` | Số công khai hay số cá nhân. Nếu cá nhân, gỡ khỏi trang |
| **E. Tài khoản nhận tiền** | | | | | |
| 26 | Tên tài khoản nhận tiền | `/ho-tro/huong-dan-thanh-toan` | "Tên tài khoản: Công ty Công ty LDVCQT Hải Vân" (lặp chữ "Công ty"). Ngân hàng Vietcombank – Sở Giao dịch. Số tài khoản không chép vào tài liệu này | `archive/old-site/pages/ho-tro/huong-dan-thanh-toan.html` | Tên tài khoản đúng theo ngân hàng |
| 27 | Người nhận chuyển khoản cá nhân | `/ho-tro/thanh-toan-viettel` | "Người nhận: [tên cá nhân] (Bắt buộc) – Số điện thoại: [SĐT cá nhân] (Bắt buộc)". Tên và số đã ẩn | `archive/old-site/pages/ho-tro/thanh-toan-viettel.html` | Tài khoản của công ty hay cá nhân. Nếu cá nhân, quyết định đổi hay gỡ trang |
| **F. Bản quyền và số liệu thương hiệu** | | | | | |
| 28 | Năm bản quyền | Footer mọi ngôn ngữ | "Bản quyền © 2020". Đây là một trường chung, nên bản `/en/` cũng hiện dòng tiếng Việt | `layout-seed.json` (dòng 68); `layout-fallback.json` (dòng 68) | Năm và câu chữ, theo từng ngôn ngữ |
| 29 | Số năm hoạt động | `/chung-toi/gioi-thieu`; `/chung-toi/doi-tac`; `/dich-vu/xe-hop-dong/phuong-tien` | Giới thiệu: "Thành lập năm 1994, sau hơn 3 thập kỷ", và cùng trang "hơn 25 năm qua". Đối tác: "25 năm qua". Phương tiện: "25 năm kinh nghiệm" | `archive/old-site/pages/chung-toi/gioi-thieu.html`; `…/doi-tac.html`; `archive/old-site/pages/dich-vu/xe-hop-dong/phuong-tien.html` | Số năm chính thức |
| 30 | Mốc thời gian lỗi thời | `/chung-toi/gioi-thieu` | "…sẽ đến sân bay Nội Bài, Hà Nội vào tháng 6 năm 2020 và các sân bay trên cả nước vào năm 2022". Mục xe sân bay ghi "giới thiệu vào tháng 4 năm 2019" | `archive/old-site/pages/chung-toi/gioi-thieu.html` | Mốc đúng, viết ở thì hiện tại hoặc quá khứ |
| 31 | Thị phần tuyến | `/chung-toi/gioi-thieu` | "70% thị phần tuyến Lào Cai – Sapa". Audit ghi tuyến này đã ngưng. Repo không có bằng chứng về việc ngưng | `archive/old-site/pages/chung-toi/gioi-thieu.html` | Tuyến còn hoạt động không; số liệu có còn đúng không |
| 32 | Số bệnh viện được trung chuyển | Bài tin tuyến Điện Biên, Sơn La; bài tin tuyến Yên Nghĩa – Tuần Giáo. Audit dùng "9 bệnh viện" cho cả cụm Tây Bắc | Bài tin: "9 Bệnh viện lớn tại Hà Nội" (Điện Biên, Sơn La). Bài tin khác: "qua 5 bệnh viện lớn tại Hà Nội" (Yên Nghĩa – Tuần Giáo) | `archive/old-site/pages/chung-toi/bao-chi-tin-tuc/` (các bài tin khuyến mãi và trung chuyển) | Số bệnh viện theo từng tuyến. Không dùng một con số chung |
| 33 | Năm trong hai trang điểm đến | `/diem-den/vung-tau` và `/diem-den/ha-noi` (WordPress) | Theo audit: "Du lịch Vũng Tàu năm 2021 có gì mới"; "Du lịch Hà Nội năm 2021 có gì mới". Không tìm thấy trong bản chụp archive | Kiểm trực tiếp trên WordPress | Cập nhật năm hay bỏ năm |
| 34 | Cách viết tên thương hiệu | Toàn site | "Hải Vân", "HAIVAN", "Haivan", "hải vân", "Hải Vân – Xuân Tráng" | `layout-seed.json`; `archive/old-site/pages/` | Cách viết chuẩn: ____ |
| 35 | Cách viết tên miền trong câu chữ | `/chinh-sach/quy-che` | "http://Haivan.com" ngay trước "Nội dung văn bản này". Bản chụp có dấu xuống dòng sau tên miền; audit ghi là dính chữ trên WordPress, cần kiểm lại | `archive/old-site/pages/chinh-sach/quy-che.html` | Dạng chuẩn của tên miền (đề xuất: https://haivan.com) |

## Ghi chú cho người điền

- Một số mục có nhiều trang. Sửa một mục phải sửa đủ mọi trang liệt kê, cả tiếng Việt và tiếng Anh.
- Sửa dữ liệu footer thì sửa trong Cài đặt → Layout Hải Vân. Không sửa tay từng trang.
- Các số ở mục 23, 24 và 25 có thể là số đơn vị khác. Chỉ giữ số được xác nhận là của Hải Vân.
