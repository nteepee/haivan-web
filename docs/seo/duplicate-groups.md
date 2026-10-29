# Đề xuất gộp bài trùng chủ đề (chưa áp dụng, không có 301 nào)

Nguồn: gói C (nội dung), 29/10/2026, DB local. Tạo bằng heuristic: cùng cụm và chủ đề trong `wordpress/scripts/lib/relink-map.csv`, tiêu đề giống nhau sau khi bỏ từ phổ biến, cùng các số trong tiêu đề. Lượt xem = meta `hv_views` của CMS cũ. Bài chuẩn: bản viết lại 2025-26 nếu có, không thì nhiều lượt xem nhất.

Cập nhật 29/10/2026: đã gộp nhóm A (4) và 5 nhóm B đánh dấu GỘP; xem cột "Đã làm". Nhóm C, nhóm MKT QUYẾT và dương tính giả chưa làm.

Cách đọc: đọc nhóm A, rồi B, rồi C; một bài có thể là chuẩn của nhóm này và nằm trong nhóm khác (cùng chủ đề rộng hơn). Cột Ghi chú có ba mức: **GỘP** (trùng ý định, nên gộp), **MKT QUYẾT** (cùng chủ đề nhưng khác ý định hoặc khác thời điểm), **DƯƠNG TÍNH GIẢ, KHÔNG GỘP** (khác hãng, khác bệnh viện, khác thành phố).

Trước khi 301: chuyển phần nội dung còn giá trị sang bài chuẩn, đổi link nội bộ (`content-relink.php` sẽ cân bằng lại link nội bộ khi chạy lại), cập nhật sitemap.


## Nhóm A: chắc chắn trùng (cùng slug gốc, bản `-2`) (4 nhóm)

### A1. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/xe-tai-ha-noi-dien-bien`<br>11,809 lượt xem, 1,033 từ, 2020 | `/diem-den/dien-bien/xe-tai-ha-noi-dien-bien-2`<br>0 lượt xem, 1,101 từ, 2020 | **GỘP.** Bản `-2` 0 lượt xem, tiêu đề hơi khác ("chất lượng"); so nội dung trước khi 301. Bài chuẩn này cũng đứng đầu nhóm B xe tải Hà Nội - Điện Biên. | Đã làm 29/10: bản `-2` vào thùng rác, 301 về bản gốc (`wordpress/scripts/content-merge.php`, `inc/redirects.php`). |

### A2. ha-noi - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/so-dien-thoai-benh-vien-ung-buou-ha-noi`<br>2,855 lượt xem, 1,022 từ, 2020 | `/diem-den/ha-noi/so-dien-thoai-benh-vien-ung-buou-ha-noi-2`<br>0 lượt xem, 1,035 từ, 2020 | **GỘP.** Bản `-2` trùng slug gốc, 0 lượt xem. (Bài chuẩn này còn nằm trong nhóm B/C với bài cùng bệnh viện khác ý định.) | Đã làm 29/10: bản `-2` vào thùng rác, 301 về bản gốc (`wordpress/scripts/content-merge.php`, `inc/redirects.php`). |

### A3. ho-chi-minh - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ho-chi-minh | `/diem-den/ho-chi-minh/huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020`<br>2,336 lượt xem, 983 từ, 2020 | `/diem-den/ho-chi-minh/huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020-2`<br>0 lượt xem, 983 từ, 2020 | **GỘP.** Bản `-2` 0 lượt xem, trùng cả tiêu đề. | Đã làm 29/10: bản `-2` vào thùng rác, 301 về bản gốc (`wordpress/scripts/content-merge.php`, `inc/redirects.php`). |

### A4. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat`<br>1,830 lượt xem, 1,049 từ, 2020 | `/diem-den/vung-tau/tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat-2`<br>0 lượt xem, 920 từ, 2020 | **GỘP.** Bản `-2` trùng slug gốc, 0 lượt xem. | Đã làm 29/10: bản `-2` vào thùng rác, 301 về bản gốc (`wordpress/scripts/content-merge.php`, `inc/redirects.php`). |


## Nhóm B: tiêu đề giống >= 80% (11 nhóm)

### B1. dien-bien - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/giao-hang-tiet-kiem-dien-bien-va-nhung-dieu-ban-can-biet`<br>2,257 lượt xem, 867 từ, 2020 | `/diem-den/dien-bien/giao-hang-jt-dien-bien-nhung-dieu-can-biet`<br>2,000 lượt xem, 760 từ, 2020 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** Giao Hàng Tiết Kiệm và J&T là hai hãng khác nhau. Giữ cả hai bài. | Không làm (dương tính giả). |

### B2. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/tong-hop-nha-xe-ha-noi-di-dien-bien-chat-luong-nhat`<br>4,063 lượt xem, 1,076 từ, 2020 | `/diem-den/dien-bien/top-nha-xe-dien-bien-ha-noi-uy-tin-chat-luong-cao`<br>1,118 lượt xem, 851 từ, 2020 | **GỘP.** Hai bài cùng ý định "nhà xe Hà Nội - Điện Biên chất lượng". | Đã làm 29/10: giữ bài này (nhiều thông tin hơn, 1.333 so với 1.010), thêm 1 khối + 1 mục mới từ bài kia, bài kia vào thùng rác và 301 về đây. |

### B3. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/xe-tai-ha-noi-dien-bien`<br>11,809 lượt xem, 1,033 từ, 2020 | `/diem-den/dien-bien/gui-hang-xe-tai-ha-noi-dien-bien-danh-sach-cac-don-vi-uy-tin`<br>3,763 lượt xem, 1,033 từ, 2020 | **GỘP.** Cùng chủ đề gửi hàng xe tải Hà Nội - Điện Biên. Bài chuẩn trùng với nhóm A. | Đã làm 29/10: giữ bài này (nhiều thông tin nhất nhóm), bài `gui-hang-xe-tai-...` vào thùng rác và 301 về đây (kể cả bản `-2` ở A1). Không có khối nào đáng thêm. |

### B4. ha-giang - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-giang | `/diem-den/ha-giang/cap-nhat-thong-tin-ma-buu-dien-ha-giang-moi-nhat`<br>3,379 lượt xem, 725 từ, 2020 | `/diem-den/ha-giang/cap-nhat-chi-tiet-ma-buu-dien-ha-giang`<br>2,478 lượt xem, 1,911 từ, 2020 | **GỘP.** Cùng chủ đề mã bưu điện Hà Giang (bài đã ngưng). Bài `cap-nhat-chi-tiet` dài hơn (2.089 từ) nên cân nhắc lấy bài đó làm chuẩn. | Đã làm 29/10 nhưng ĐẢO chiều: giữ `cap-nhat-chi-tiet-ma-buu-dien-ha-giang` (1.680 so với 946 thông tin), thêm danh sách mã bưu điện theo huyện + mục gợi ý đơn vị gửi hàng; bài `...-moi-nhat` vào thùng rác, 301 về bài chi tiết. |

### B5. ha-giang - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-giang | `/diem-den/ha-giang/tong-hop-xe-ha-noi-ha-giang-chat-luong-nhat`<br>1,055 lượt xem, 1,168 từ, 2020 | `/diem-den/ha-giang/kinh-nghiem-chon-xe-ha-noi-di-ha-giang-chat-luong-nhat`<br>711 lượt xem, 1,111 từ, 2020 | **GỘP.** Cùng ý định; Hà Giang là điểm đã ngưng, ưu tiên gộp để giảm bài mỏng. | Đã làm 29/10: giữ bài này (1.630 so với 1.379), thêm mục "Lưu ý" + 3 khối ảnh/đoạn mới; bài kia vào thùng rác, 301 về đây. |

### B6. ha-noi - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/benh-vien-phu-san-ha-noi-co-so-1`<br>16,245 lượt xem, 1,017 từ, 2020 | `/diem-den/ha-noi/tat-tan-tat-thong-tin-ve-benh-vien-k-ha-noi-co-so-1`<br>9,555 lượt xem, 931 từ, 2020 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** Hai bệnh viện khác nhau (Phụ sản Hà Nội và Bệnh viện K). Giữ cả hai. | Không làm (dương tính giả). |

### B7. ha-noi - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/tong-hop-thong-tin-ve-benh-vien-ung-buou-ha-noi`<br>3,827 lượt xem, 1,325 từ, 2020 | `/diem-den/ha-noi/dia-chi-benh-vien-ung-buou-ha-noi`<br>2,530 lượt xem, 1,125 từ, 2020 | **MKT QUYẾT.** Cùng bệnh viện, khác ý định (tổng hợp, địa chỉ, số điện thoại, bảng giá). MKT quyết gộp thành một bài trụ cột hay giữ riêng theo ý định. | Chưa làm: chờ MKT quyết. |

### B8. sa-pa - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| sa-pa | `/chung-toi/bao-chi-tin-tuc/ung-dung-cong-nghe-van-tai-hien-dai-nhat-viet-nam-tuyen-xe-khach-ha-noi-lao-cai`<br>3,143 lượt xem, 1,128 từ, 2020 | `/chung-toi/bao-chi-tin-tuc/ung-dung-cong-nghe-van-tai-hien-dai-nhat-viet-nam-tren-tuyen-xe-khach-ha-noi-lao-cai-sapa`<br>2,460 lượt xem, 1,027 từ, 2020 | **MKT QUYẾT.** Tin 2020 về tuyến Hà Nội - Lào Cai - Sa Pa (tuyến Hải Vân đã ngưng). Là tin lịch sử: có thể giữ nguyên làm tin hoặc 301 về bài chuẩn. | Chưa làm: chờ MKT quyết. |

### B9. son-la - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| son-la | `/diem-den/son-la/tong-hop-cac-dia-chi-buu-cuc-viettel-post-son-la`<br>2,727 lượt xem, 934 từ, 2020 | `/diem-den/son-la/viettel-post-son-la`<br>1,856 lượt xem, 935 từ, 2020 | **GỘP.** Cùng chủ đề bưu cục Viettel Post Sơn La. | Đã làm 29/10 nhưng ĐẢO chiều: giữ `viettel-post-son-la` (1.158 so với 1.145 thông tin), thêm 4 mục (thành phố Sơn La, giao hàng, bồi hoàn...) và bỏ mục quảng cáo; bài `tong-hop-cac-dia-chi-...` vào thùng rác, 301 về `viettel-post-son-la`. |

### B10. vung-tau - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/chuyen-phat-nhanh-ems-vung-tau`<br>3,362 lượt xem, 908 từ, 2020 | `/diem-den/vung-tau/tat-tan-tat-ve-chuyen-phat-nhanh-nhat-tin-vung-tau`<br>1,731 lượt xem, 739 từ, 2020 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** EMS và Nhất Tín là hai hãng khác nhau. Giữ cả hai bài. | Không làm (dương tính giả). |

### B11. vung-tau - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/du-lich-vung-tau-2-ngay-1-dem-lich-trinh-chi-tiet-va-kinh-nghiem-khoe-manh-tu-a-z`<br>215 lượt xem, 2,084 từ, 2025 | `/diem-den/vung-tau/review-du-lich-vung-tau-2-ngay-1-dem-moi-nhat-2020`<br>4,951 lượt xem, 911 từ, 2020<br>`/diem-den/vung-tau/du-lich-vung-tau-2-ngay-1-dem-kinh-nghiem-tu-a-z`<br>1,847 lượt xem, 1,593 từ, 2020 | **MKT QUYẾT.** Cùng chủ đề "du lịch Vũng Tàu 2 ngày 1 đêm". Chuẩn đề xuất là bản viết lại 2025 (2.241 từ, 215 lượt xem) nhưng bản 2020 có 4.951 lượt xem: nên chuyển phần còn giá trị sang bản mới rồi 301. Nhóm C có thêm 2 bài cùng chủ đề (xem C3). | Chưa làm: chờ MKT quyết. |


## Nhóm C: tiêu đề giống 67-80%, cần MKT duyệt (26 nhóm)

### C1. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/cac-ben-xe-khach-ha-noi-dien-bien-gia-ve-va-lich-trinh-cua-mot-so-nha-xe`<br>7,194 lượt xem, 950 từ, 2020 | `/diem-den/dien-bien/nha-xe-dien-bien-ha-noi-cap-nhat-ve-gia-ve-va-lich-chay`<br>606 lượt xem, 882 từ, 2020 | **GỘP.** Cùng ý định giá vé, lịch chạy nhà xe Hà Nội - Điện Biên. | Chưa làm (nhóm C, để sau). |

### C2. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/cap-nhat-danh-sach-xe-di-dien-bien-tu-ha-noi-moi-nhat-2020`<br>29,219 lượt xem, 789 từ, 2020 | `/diem-den/dien-bien/danh-sach-nhung-chanh-xe-dien-bien-tu-ha-noi-uy-tin-nhat-hien-nay`<br>3,033 lượt xem, 722 từ, 2020 | **GỘP.** Cùng ý định danh sách xe Hà Nội - Điện Biên; bài chuẩn 29.219 lượt xem. | Chưa làm (nhóm C, để sau). |

### C3. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/nhung-dia-chi-gui-hang-ha-noi-dien-bien-chat-luong-nhat-hien-nay`<br>32,245 lượt xem, 1,003 từ, 2020 | `/diem-den/dien-bien/top-nhung-dia-chi-gui-hang-xe-tai-ha-noi-di-dien-bien`<br>3,053 lượt xem, 793 từ, 2020 | **GỘP.** Cùng ý định địa chỉ gửi hàng xe tải Hà Nội - Điện Biên; chuẩn 32.245 lượt xem. | Chưa làm (nhóm C, để sau). |

### C4. dien-bien - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| dien-bien | `/diem-den/dien-bien/xe-hai-van-dien-bien-tat-tan-tat-thong-tin-ban-can-biet`<br>5,547 lượt xem, 843 từ, 2020 | `/diem-den/dien-bien/tat-tat-tat-ve-nha-xe-hai-van-dien-bien`<br>4,987 lượt xem, 670 từ, 2020 | **GỘP.** Cùng ý định thông tin nhà xe Hải Vân Điện Biên. | Chưa làm (nhóm C, để sau). |

### C5. ha-giang - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-giang | `/diem-den/ha-giang/nha-xe-ngoc-cuong-ha-giang-ha-noi-lich-trinh-gia-ve-va-diem-don-tra-khach`<br>17,353 lượt xem, 779 từ, 2020 | `/diem-den/ha-giang/review-ve-nha-xe-ngoc-cuong-ha-noi-di-ha-giang`<br>2,576 lượt xem, 714 từ, 2020 | **GỘP.** Cùng nhà xe (Ngọc Cường), cùng tuyến (đã ngưng). | Chưa làm (nhóm C, để sau). |

### C6. ha-noi - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/bang-gia-benh-vien-ung-buou-ha-noi`<br>4,854 lượt xem, 946 từ, 2020 | `/diem-den/ha-noi/bang-gia-benh-vien-ung-buou-ha-noi-day-du-nhat-vua-cap-nhat`<br>3,274 lượt xem, 1,648 từ, 2020 | **GỘP.** Hai bài bảng giá gần như trùng tiêu đề, cùng bệnh viện. | Chưa làm (nhóm C, để sau). |

### C7. ha-noi - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/benh-vien-dai-hoc-y-ha-noi-nam-khoa`<br>7,666 lượt xem, 965 từ, 2020 | `/diem-den/ha-noi/tat-tan-tat-thong-tin-ve-benh-vien-dai-hoc-y-ha-noi`<br>2,042 lượt xem, 745 từ, 2020 | **MKT QUYẾT.** Chuẩn là bài về Nam khoa (một khoa) còn bài kia là thông tin chung Đại học Y: khác ý định, nên chọn bài thông tin chung làm chuẩn nếu gộp. MKT quyết. | Chưa làm: chờ MKT quyết. |

### C8. ha-noi - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/benh-vien-mat-trung-uong-ha-noi-o-dau-kinh-nghiem-va-luu-y-khi-di-kham`<br>32,177 lượt xem, 859 từ, 2020 | `/diem-den/ha-noi/huong-dan-di-kham-chua-benh-tai-benh-vien-mat-trung-uong-ha-noi`<br>3,186 lượt xem, 937 từ, 2020 | **MKT QUYẾT.** Cùng bệnh viện, kinh nghiệm và hướng dẫn khám. MKT quyết. | Chưa làm: chờ MKT quyết. |

### C9. ha-noi - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/nhung-dieu-can-biet-ve-benh-vien-mat-viet-nhat-ha-noi`<br>4,220 lượt xem, 917 từ, 2020 | `/diem-den/ha-noi/benh-vien-mat-viet-nga-ha-noi-va-nhung-dieu-can-biet-khi-di-kham`<br>3,897 lượt xem, 784 từ, 2020 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** Hai bệnh viện khác nhau (Mắt Việt Nhật và Mắt Việt Nga). Giữ cả hai. | Không làm (dương tính giả). |

### C10. ha-noi - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ha-noi | `/diem-den/ha-noi/tong-hop-thong-tin-ve-benh-vien-ung-buou-ha-noi`<br>3,827 lượt xem, 1,325 từ, 2020 | `/diem-den/ha-noi/so-dien-thoai-benh-vien-ung-buou-ha-noi`<br>2,855 lượt xem, 1,022 từ, 2020 | **MKT QUYẾT.** Cùng bệnh viện, khác ý định (tổng hợp, địa chỉ, số điện thoại, bảng giá). MKT quyết gộp thành một bài trụ cột hay giữ riêng theo ý định. | Chưa làm: chờ MKT quyết. |

### C11. ho-chi-minh - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ho-chi-minh | `/diem-den/ho-chi-minh/nhung-dieu-can-biet-khi-kham-benh-tai-benh-vien-da-khoa-sai-gon`<br>2,414 lượt xem, 1,074 từ, 2020 | `/diem-den/ho-chi-minh/kinh-nghiem-thuc-te-khi-kham-benh-tai-benh-vien-da-khoa-sai-gon`<br>512 lượt xem, 1,050 từ, 2020 | **MKT QUYẾT.** Cùng bệnh viện (Đa khoa Sài Gòn), kinh nghiệm thực tế và điều cần biết. MKT quyết. | Chưa làm: chờ MKT quyết. |

### C12. ho-chi-minh - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| ho-chi-minh | `/diem-den/ho-chi-minh/tra-cuoc-van-chuyen-viettel-post-don-gian-nhat-ma-ai-cung-nen-biet`<br>2,916 lượt xem, 956 từ, 2020 | `/diem-den/ho-chi-minh/cach-tra-cuoc-van-chuyen-viettel-post-don-gian-ai-cung-co-the-thuc-hien`<br>1,939 lượt xem, 985 từ, 2020 | **GỘP.** Cùng hãng, cùng ý định tra cước. | Chưa làm (nhóm C, để sau). |

### C13. sa-pa - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| sa-pa | `/chung-toi/bao-chi-tin-tuc/ung-dung-cong-nghe-van-tai-hien-dai-nhat-viet-nam-tuyen-xe-khach-ha-noi-lao-cai`<br>3,143 lượt xem, 1,128 từ, 2020 | `/chung-toi/bao-chi-tin-tuc/ra-mat-ung-dung-cong-nghe-van-tai-hien-dai-nhat-viet-nam-tren-xe-khach-ha-noi-lao-cai-sa-pa`<br>2,049 lượt xem, 663 từ, 2020 | **MKT QUYẾT.** Tin 2020 về tuyến Hà Nội - Lào Cai - Sa Pa (đã ngưng); xem ghi chú nhóm B tương ứng. | Chưa làm: chờ MKT quyết. |

### C14. tin_tuc - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| tin_tuc | `/chung-toi/bao-chi-tin-tuc/xe-buyt-limousine-cao-cap-tai-ha-noi-don-tra-tan-noi-hanh-trinh-5-sao-gia-chi-90k`<br>1,084 lượt xem, 1,580 từ, 2025 | `/chung-toi/bao-chi-tin-tuc/xe-buyt-limousine-cao-cap-tai-da-nang-don-tra-tan-noi-hanh-trinh-5-sao-gia-chi-120k`<br>689 lượt xem, 1,118 từ, 2025 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** Hai thành phố khác nhau (Hà Nội 90k và Đà Nẵng 120k). Giữ cả hai. | Không làm (dương tính giả). |

### C15. vung-tau - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/cap-nhat-gia-ve-ho-may-vung-tau-2020-va-gia-phong-tai-ho-may-resort`<br>7,788 lượt xem, 1,092 từ, 2020 | `/diem-den/vung-tau/thong-tin-day-du-ve-gia-ve-ho-may-vung-tau-2020-tour-resort-tai-khu-du-lich`<br>2,426 lượt xem, 1,294 từ, 2020<br>`/diem-den/vung-tau/cap-nhat-gia-ve-cap-treo-ho-may-vung-tau-2020`<br>1,675 lượt xem, 891 từ, 2020 | **MKT QUYẾT.** Ba bài giá vé Hồ Mây 2020; bài chuẩn có thêm giá phòng resort. Bản 2026 `ho-may-park-vung-tau-gia-ve-cap-treo-lich-trinh-2026` có thể là chuẩn mới. | Chưa làm: chờ MKT quyết. |

### C16. vung-tau - DƯƠNG TÍNH GIẢ, KHÔNG GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/chanh-xe-la-gi-dia-chi-chanh-xe-uy-tin`<br>1,781 lượt xem, 926 từ, 2020 | `/diem-den/vung-tau/dia-chi-cho-thue-xe-di-vung-tau-tu-sai-gon`<br>1,483 lượt xem, 921 từ, 2020 | **DƯƠNG TÍNH GIẢ, KHÔNG GỘP.** "Chành xe" (gửi hàng) và "cho thuê xe" (chở người) là hai ý định khác. Giữ cả hai. | Không làm (dương tính giả). |

### C17. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/co-nen-dat-xe-limousine-di-vung-tau-tu-sai-gon`<br>987 lượt xem, 842 từ, 2020 | `/diem-den/vung-tau/nhung-uu-diem-khi-dat-xe-limousine-di-vung-tau-tu-sai-gon`<br>589 lượt xem, 773 từ, 2020 | **GỘP.** Cùng ý định "ưu điểm đặt limousine Sài Gòn - Vũng Tàu". | Chưa làm (nhóm C, để sau). |

### C18. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/danh-sach-cac-xe-cho-hang-tu-sai-gon-ve-vung-tau-nhanh-va-uy-tin-nhat`<br>4,081 lượt xem, 1,111 từ, 2020 | `/diem-den/vung-tau/xe-cho-hang-tu-sai-gon-ve-vung-tau-uy-tin-ban-khong-the-bo-qua`<br>2,769 lượt xem, 1,084 từ, 2020<br>`/diem-den/vung-tau/review-nhung-xe-cho-hang-tu-sai-gon-ve-vung-tau-uy-tin-nhat`<br>983 lượt xem, 812 từ, 2020 | **GỘP.** Ba bài danh sách xe chở hàng Sài Gòn - Vũng Tàu cùng ý định. | Chưa làm (nhóm C, để sau). |

### C19. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/danh-sach-xe-limousine-di-vung-tau-tu-sai-gon`<br>1,700 lượt xem, 957 từ, 2020 | `/diem-den/vung-tau/xe-di-tu-sai-gon-den-vung-tau-danh-sach-cac-nha-xe-uy-tin`<br>848 lượt xem, 829 từ, 2020 | **GỘP.** Cùng ý định danh sách nhà xe/xe limousine Sài Gòn - Vũng Tàu. | Chưa làm (nhóm C, để sau). |

### C20. vung-tau - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/du-lich-vung-tau-2-ngay-1-dem-tu-tuc-lich-trinh-chi-phi-va-checklist`<br>962 lượt xem, 2,472 từ, 2026 | `/diem-den/vung-tau/lich-trinh-du-lich-vung-tau-2-ngay-1-dem-van-nguoi-me`<br>1,373 lượt xem, 851 từ, 2020<br>`/diem-den/vung-tau/du-lich-vung-tau-2-ngay-1-dem-lich-trinh-chi-tiet-va-kinh-nghiem-khoe-manh-tu-a-z`<br>215 lượt xem, 2,084 từ, 2025 | **MKT QUYẾT.** Cùng chủ đề với nhóm B (du lịch Vũng Tàu 2 ngày 1 đêm). Chọn một bài chuẩn cho cả B và C3. | Chưa làm: chờ MKT quyết. |

### C21. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/huong-dan-gui-hang-di-vung-tau-bang-xe-phuong-trang-don-gian-nhat`<br>9,893 lượt xem, 1,281 từ, 2020 | `/diem-den/vung-tau/nhung-dieu-can-biet-khi-gui-hang-di-vung-tau-bang-xe-phuong-trang`<br>1,272 lượt xem, 1,103 từ, 2020 | **GỘP.** Cùng hãng (Phương Trang), cùng ý định gửi hàng đi Vũng Tàu. | Chưa làm (nhóm C, để sau). |

### C22. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/kinh-nghiem-chon-xe-di-vung-tau-tu-sai-gon-tien-nghi-va-an-toan`<br>2,857 lượt xem, 937 từ, 2020 | `/diem-den/vung-tau/tphcm-di-vung-tau-chon-xe-nao-cho-an-toan-va-tien-nghi-nhat`<br>763 lượt xem, 929 từ, 2020 | **GỘP.** Cùng ý định chọn xe đi Vũng Tàu. | Chưa làm (nhóm C, để sau). |

### C23. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/nhung-luu-y-khi-di-xe-toan-thang-sai-gon-vung-tau`<br>2,845 lượt xem, 911 từ, 2020 | `/diem-den/vung-tau/xe-toan-thang-di-vung-tau-co-tot-khong`<br>1,066 lượt xem, 570 từ, 2020 | **GỘP.** Cùng nhà xe (Toàn Thắng), cùng tuyến. | Chưa làm (nhóm C, để sau). |

### C24. vung-tau - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/thong-tin-cac-nha-xe-vung-tau-sai-gon-gia-re`<br>2,621 lượt xem, 856 từ, 2020 | `/diem-den/vung-tau/gia-ve-xe-cua-sai-gon-vung-tau-uy-tin`<br>1,236 lượt xem, 636 từ, 2020<br>`/diem-den/vung-tau/cac-nha-xe-vung-tau-ve-sai-gon-uy-tin`<br>599 lượt xem, 666 từ, 2020 | **MKT QUYẾT.** Ba bài nhà xe Sài Gòn - Vũng Tàu (giá rẻ, uy tín, giá vé). Gộp được nhưng "giá vé" hơi khác ý định. | Chưa làm: chờ MKT quyết. |

### C25. vung-tau - GỘP

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/tong-hop-thong-tin-tu-a-den-z-ve-giao-hang-tiet-kiem-vung-tau`<br>973 lượt xem, 1,041 từ, 2020 | `/diem-den/vung-tau/tat-tan-tat-thong-tin-ve-giao-hang-tiet-kiem-vung-tau`<br>775 lượt xem, 1,096 từ, 2020 | **GỘP.** Cùng hãng (Giao Hàng Tiết Kiệm), cùng ý định tại Vũng Tàu. | Chưa làm (nhóm C, để sau). |

### C26. vung-tau - MKT QUYẾT

| Cụm | Giữ (đường dẫn, lượt xem, số từ) | Gộp/301 về (đường dẫn, lượt xem, số từ) | Ghi chú | Đã làm |
|---|---|---|---|---|
| vung-tau | `/diem-den/vung-tau/xe-limousine-di-vung-tau-tu-tp-hcm-dua-don-tan-noi-gia-chi-tu-150k`<br>3,426 lượt xem, 522 từ, 2025 | `/diem-den/vung-tau/xe-limousine-sai-gon-di-vung-tau-don-tan-noi-dua-tan-bien-cung-hai-van`<br>5,731 lượt xem, 400 từ, 2025 | **MKT QUYẾT.** Hai bài khuyến mại/giá khác nhau (150k và Hải Vân đưa đón tận nơi), 2025. MKT xem còn hiệu lực giá không. | Chưa làm: chờ MKT quyết. |

