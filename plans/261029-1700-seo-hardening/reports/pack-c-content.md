# Gói C — Nội dung (#19, #20, #22, #26, #27, #28, #29)

Ngày 29/10/2026. Chỉ thêm file trong `wordpress/scripts/`. Không sửa theme, apps/booking, deploy/. Không commit. Không gọi production.

## Script (dry-run mặc định, `HV_APPLY=1` để ghi, chạy lại = 0 thay đổi)
Chạy đủ bộ: `cd wordpress && HV_APPLY=1 ./scripts/content-run-all.sh` (thứ tự: typos, facts, dedupe, relink, bridge). Hoặc từng file: `docker compose --profile tools run --rm -T [-e HV_APPLY=1] wpcli eval-file /scripts/<file>.php`.
Biến chung: `HV_APPLY`, `HV_REPORT=1` (in danh sách cần người quyết, kiểm link chết/mồ côi), `HV_SAMPLE=N`, `HV_IDS=1,2`, `HV_VERBOSE=1` (in ID bài đổi), `WORDPRESS_DB_NAME` (thử trên bản sao DB).

| File | Việc |
|---|---|
| `lib/content-tools.php` | khung chạy chung: dry-run, bảng tóm tắt luật/bài/ví dụ trước-sau, ghi thẳng DB (không đổi `post_modified`, không tạo revision) |
| `lib/content-links.php` + `lib/relink-map.csv` | bản đồ link (888 dòng trích từ CSV audit), tuyến sống (hv_route + landing hv_corridor + 4 landing cố định), phân nhóm bắc cầu |
| `content-typos.php` (#28) | NFC, zero-width, `&quot;`, 24/25 lỗi chính tả mục 9.1 (+2 lỗi đục chữ ở chính sách bảo mật), 2 trang hub |
| `content-facts.php` (#26, #27) | hotline, "Công ty Công ty", trụ sở cũ sang 125 Hoàng Ngân, "hơn 25 năm" sang "hơn 30 năm", bỏ "năm 2021" ở hub |
| `content-dedupe.php` (#29) | bỏ khối lặp nguyên văn trên 4 trang (và bản /en/) |
| `content-relink.php` (#19) | link nội bộ, bản đồ chết sang sống, anchor "tại đây", hai khối cuối bài, cân bằng link giữa bài |
| `content-bridge.php` (#20) | hộp `hv-seo-bridge` (north / south / hospital) |
| `content-run-all.sh` | chạy cả 5 theo thứ tự |

Sao lưu trước khi ghi (đều nằm `wordpress/data/backups/`, được `wordpress/.gitignore` loại `/data/`): `pre-pack-c-content-261029.sql` (trước mọi thay đổi của gói C), `pre-pack-c-relink-`, `pre-pack-c-bridge-`, `pre-pack-c-balance-261029.sql`.
Importer: bài bị script ghi khác `hv_imported_hash` nên `import-cms.php` coi là "MKT đã sửa" và không ghi đè lần nhập sau (chủ ý, không đóng dấu lại).
Sau khi chạy trên production phải xoá cache nginx (đang `s-maxage=300`): curl ngay sau khi ghi vẫn thấy bản cũ tới 5 phút (đã gặp trên local).

## Kết quả trên local (số đếm bản chạy thật)
- typos: 121 bài (NFC 77 chỗ/75 bài; zero-width 662 ký tự/19 bài; 24 luật chính tả, mỗi luật 1-2 bài vì trang vi + en; meta Rank Math cũng được chuẩn hoá).
- facts: 399 bài đổi lần đầu (hotline 433 chỗ/393 bài gồm sửa `19006773` ở `/dich-vu/xe-lien-tinh/chon-cho-truoc` cả chữ lẫn `tel:`; "Công ty Công ty" 2 trang; "hơn 25 năm" 4 trang `/chung-toi/gioi-thieu` + en, 1317, 1335; hub Vũng Tàu/Hà Nội bỏ "năm 2021"); thêm lần 2: 4 trang chính sách đổi trụ sở cũ sang `Tầng 5, Toà nhà 125 Hoàng Ngân, Phường Yên Hòa, Hà Nội` (theo quyết định chủ: chân trang là chuẩn).
- dedupe: 8 trang (24/25 haivanplus, 56/57 lien-he, 74/75 `/dat-ve-nhanh/khachhang`, 90/91 `/dat-ve-nhanhs/khachhang`), 56 khối lặp bỏ. `/dat-ve-nhanh/khachhang` không có trong audit nhưng lặp y hệt nên gồm vào. Hiện `/dat-ve-nhanhs/khachhang` trả 301 (gói B), nội dung đã sạch.
- relink: nhiều lần chạy cộng dồn; trạng thái cuối nhờ bảng dưới. bridge: 204 bài (north 95, south 31, hospital 78).
- Chạy lại cả 5 script: 0 bài đổi (kiểm xong sau lần ghi cuối). `node scripts/layout-audit.mjs`: **Lỗi: 0**.

### #19 kiểm DB so với audit và CSV
Audit nói đã relink 914 bài: **đúng một phần**. Đối chiếu bằng cách nhập bản sao DB trước relink (backup `pre-v4`) và diff.
| Chỉ số | Đầu gói C | Cuối (local) | Fresh import + script |
|---|---|---|---|
| bài (bai_viet+tin_tuc) có khối context-link / outro | 914 / 914 | 914 / 914 | 914 / 914 |
| dòng CSV tra ra bài (đường dẫn) | 888/888 (+26 bài có khối nhưng không có trong CSV) | idem | idem |
| bài còn link `https://haivan.com`/`cms` (href) | 11 (77 bài nếu tính cả chữ/anchor cũ) | 0 | 0 |
| bài còn link tuyến chết (`my-dinh/ha-giang`, `my-dinh/lao-cai`, `da-lat/lien-khuong`, `thanh-pho-hoi-an/...`, `noi-bai/time-city`) | 7 | 0 | 0 |
| bài còn anchor CTA "...: Tại Đây" | 7 (audit nói 0) | 0 | 0 |
| bài còn emoji/mũi tên trong khối context (design v4 cấm) | 914 | 0 | 0 |
| bài có đúng 0 / 1 / >=2 bài khác link tới | 0 / 347 / 567 (audit nói đủ 2) | 0 / 0 / 914 | 0 / 0 / 914 |
| dòng CSV mà `Primary_Target_2Way_URL` được link | 677/888 (Mộc Châu trỏ nhầm `/diem-den/moc-chau`) | 882/888 | 888/888 |
Sai khác thật với audit: còn 7 CTA "Tại Đây", ~90 link tuyệt đối, link tuyến chết còn sót, 347 bài chỉ có 1 link tới, 82% khối có emoji/mũi tên, Mộc Châu chưa trỏ landing mới.

Quy tắc đã đóng thành script (`content-relink.php`): host haivan/www/cms sang đường dẫn tương đối, chữ thường `/diem-den/*`, bỏ `fbclid`/`?en`; `/tin-tuc/<slug>`, `/tuyen-duong/*`, `/xe-lien-tinh`, `/xe-khach?from=&to=` sang trang sống (Điện Biên, Sơn La, Mộc Châu); `/xe-khach/ha-noi/dien-bien` sang `my-dinh/dien-bien`; tuyến không trong tập sống (hv_route + landing hv_corridor + 4 landing cố định) thì bỏ thẻ `<a>` (giữ chữ, bỏ cả đoạn nếu chỉ là câu quảng cáo); bài đã lệch đoạn điểm đến thì về đường dẫn chuẩn theo slug, slug không còn bài thì coi chết; anchor "tại đây" thành nhãn theo đích; bỏ `style/target/data-mce-href` ở link nội bộ; "haivan.com" trơn thành link về trang chủ; cân bằng: mỗi bài >=2 bài cùng cụm link tới (thêm "Xem thêm bài viết cùng chủ đề", tối đa ưu tiên bài đã có quan hệ CSV rồi độ giống tiêu đề).
**Chứng minh "dựng lại từ nhập mới"**: nhập `pre-v4` (chưa có khối nào) vào DB tạm, chạy 5 script `HV_APPLY=1`, chạy lại: 0 thay đổi cả 5 script; số liệu như cột cuối bảng. Khác local ở chữ anchor (script cũ đã mất chọn nhãn theo cụm, ví dụ "Hãng xe Hải Vân (xe giường nằm Hà Nội – Mộc Châu)" thay vì "Hãng xe Hải Vân (haivan.com)") và biến thể mẫu khối cuối (khối cũ theo chủ đề, mẫu mới theo cụm); chức năng tương đương. Trên local chạy lại relink: không đổi gì (no-op) sau lần ghi cuối.
Lưu ý: hai khối cuối bài đã đổi mẫu: bỏ emoji/mũi tên; bài cụm Hà Nội không còn link Vũng Tàu ở khối cuối (audit 4.3); "Mộc Châu" trỏ `/xe-khach/my-dinh/moc-chau` (gói B/A xác nhận render).
Còn lại (cần người): ~19 `/tuyen-duong/*` pages (#21) đã bị bỏ nút "ĐẶT VÉ NGAY" chết ở trang nháp cũ; `/tuyen-duong/da-lat-bao-loc-lien-khuong` (page 100) còn chữ "ĐẶT VÉ NGAY" trơn; 1 chữ `cms.haivan.com` trong bài 984; 6 dòng CSV có primary không nằm trong khối (hospital/bridge dùng hộp riêng).

### #20 hộp bắc cầu
HTML tĩnh, comment marker + `div.hv-seo-bridge[data-hv-bridge]`, không emoji, không inline style, chèn sau đoạn `</p>` thứ 2 (bài ngắn: cuối bài trước `[haivan_cta]`). Thay `p.hv-context-link` của chính các bài đó. Không dùng khẳng định "độc quyền" của mẫu audit.
`north` 95 (Hà Giang, Sa Pa, Lào Cai, Tuyên Quang, Hạ Long, Ninh Bình, kể cả vài tin), `south` 31, `hospital` 78 (70 theo CSV hospital_medical + 8 bài /diem-den/ha-noi không có trong CSV nhận bằng tiêu đề). Audit nói 89 bài Hà Nội; 19 bài còn lại trong cụm là bài xe/gửi hàng nên chỉ có khối tuyến Tây Bắc, không hộp bệnh viện.
Link trong hộp, B/A cần xác nhận render (H1 + nội dung, indexable): `/xe-khach/my-dinh/moc-chau`, `/xe-khach/moc-chau/my-dinh`, `/xe-khach/son-la/my-dinh`, `/xe-khach/dien-bien/my-dinh`; còn lại đã có: `/xe-khach/my-dinh/son-la`, `/xe-khach/my-dinh/dien-bien`, `/xe-khach/yen-nghia/dien-bien`, `/xe-khach/quan-1/vung-tau`, `/xe-khach/tan-son-nhat/vung-tau`, `/xe-khach/vung-tau/quan-1-san-bay`, `/`. Hiện 4 URL đầu trả 200 nhưng 0 `<h1>` trong HTML (lỗi SSR Next đã biết, gói A/B).
Nội dung cần MKT xác nhận (lấy từ audit/bài hiện có, không tự kiểm): "phòng chờ miễn phí và xe trung chuyển tới 9 bệnh viện lớn tại Hà Nội", "xe trung chuyển đưa đón miễn phí... tới cổng bệnh viện", dòng xe Cabin Hoàng Gia/Limousine VIP.
CSS `.hv-seo-bridge` (p/ul/li/a) và `p.hv-context-*` chưa có trong theme: việc gói B (đã báo seo-wp).

### #22 đề xuất gộp bài trùng (không 301 gì cả)
Heuristic: cùng cụm + chủ đề (CSV), tiêu đề giống >= 67% sau bỏ từ phổ biến, cùng số trong tiêu đề. Canonical: bài viết lại 2025-26 nếu có, không thì nhiều lượt xem (`hv_views` CMS) nhất, dài nhất. Audit nói 49 cặp; heuristic ra 4 + 11 + 26 nhóm. Bài hospital cùng một bệnh viện nhưng khác ý định (địa chỉ, số điện thoại, bảng giá) là nhóm giả, MKT quyết gộp hay giữ riêng. Bài khác bệnh viện (Mắt Việt Nhật vs Việt Nga, Phụ sản cơ sở 1/3) là dương tính giả, không gộp. Nhóm A trước, B, C sau (một bài có thể là chuẩn ở A và nằm trong B).

#### Nhóm A: chắc chắn trùng (cùng slug gốc, bản `-2` 0 lượt xem)
| Cụm | Giữ | Gộp/301 về |
|---|---|---|
| dien-bien | `xe-tai-ha-noi-dien-bien` | `xe-tai-ha-noi-dien-bien-2` |
| ha-noi | `so-dien-thoai-benh-vien-ung-buou-ha-noi` | `so-dien-thoai-benh-vien-ung-buou-ha-noi-2` |
| ho-chi-minh | `huong-dan-gui-hang-giao-hang-tiet-kiem-moi-nhat-2020` | `...-moi-nhat-2020-2` |
| vung-tau | `tong-hop-dia-diem-an-choi-vung-tau-chat-hon-nuoc-cat` | `...-nuoc-cat-2` |

#### Nhóm B: tiêu đề giống >= 80% (11 nhóm) và C: 67-80% (26 nhóm)
Danh sách đầy đủ (Cụm, bài giữ, bài gộp kèm lượt xem) xuất bằng script phân tích; đưa vào bảng dưới theo yêu cầu "docs-style":
| Cụm | Giữ | Gộp/301 về |
|---|---|---|
| dien-bien | `tong-hop-nha-xe-ha-noi-di-dien-bien-chat-luong-nhat` | `top-nha-xe-dien-bien-ha-noi-uy-tin-chat-luong-cao` |
| dien-bien | `giao-hang-tiet-kiem-dien-bien-va-nhung-dieu-ban-can-biet` | `giao-hang-jt-dien-bien-nhung-dieu-can-biet` |
| dien-bien | `xe-tai-ha-noi-dien-bien` | `gui-hang-xe-tai-ha-noi-dien-bien-danh-sach-cac-don-vi-uy-tin` |
| ha-giang | `cap-nhat-thong-tin-ma-buu-dien-ha-giang-moi-nhat` | `cap-nhat-chi-tiet-ma-buu-dien-ha-giang` |
| ha-giang | `tong-hop-xe-ha-noi-ha-giang-chat-luong-nhat` | `kinh-nghiem-chon-xe-ha-noi-di-ha-giang-chat-luong-nhat` |
| ha-noi | `tong-hop-thong-tin-ve-benh-vien-ung-buou-ha-noi` | `dia-chi-benh-vien-ung-buou-ha-noi` (khác ý định: MKT quyết) |
| ha-noi | `benh-vien-phu-san-ha-noi-co-so-1` | `tat-tan-tat-thong-tin-ve-benh-vien-k-ha-noi-co-so-1` (dương tính giả: khác bệnh viện, KHÔNG gộp) |
| tin_tuc | `ung-dung-cong-nghe-van-tai-hien-dai-nhat-viet-nam-tuyen-xe-khach-ha-noi-lao-cai` | `...-tren-tuyen-xe-khach-ha-noi-lao-cai-sapa` |
| son-la | `tong-hop-cac-dia-chi-buu-cuc-viettel-post-son-la` | `viettel-post-son-la` |
| vung-tau | `du-lich-vung-tau-2-ngay-1-dem-lich-trinh-chi-tiet-va-kinh-nghiem-khoe-manh-tu-a-z` (viết lại 2025) | `review-du-lich-vung-tau-2-ngay-1-dem-moi-nhat-2020` (4.951 lượt xem, 1.060 từ), `du-lich-vung-tau-2-ngay-1-dem-kinh-nghiem-tu-a-z` |
| vung-tau | `chuyen-phat-nhanh-ems-vung-tau` | `tat-tan-tat-ve-chuyen-phat-nhanh-nhat-tin-vung-tau` |
Nhóm lớn đáng làm trước (nhiều biến thể cùng chủ đề, cùng cụm): vung-tau "du lịch 2 ngày 1 đêm" (8 bài), ho-chi-minh "gửi hàng Giao Hàng Tiết Kiệm" (6 bài), dien-bien "gửi hàng xe tải Hà Nội - Điện Biên" (5 bài), 6 bài "xe-cho-hang Sài Gòn - Vũng Tàu". Nhóm C đầy đủ (26) chạy lại bằng script phân tích ở scratchpad nếu cần; chủ yếu bệnh viện và nhà xe Điện Biên (ví dụ giữ `cap-nhat-danh-sach-xe-di-dien-bien-tu-ha-noi-moi-nhat-2020` 29.219 lượt xem, gộp `danh-sach-nhung-chanh-xe-dien-bien-tu-ha-noi-uy-tin-nhat-hien-nay`).

### #26 danh sách cho chủ doanh nghiệp (không tự đổi)
Quyết định chủ đã áp: trụ sở = 125 Hoàng Ngân (đã thay ở `/chinh-sach/bao-mat-thong-tin`, `/chinh-sach/quy-che` + en: pages 38, 39, 44, 45); hotline 1900 6763 (433 chỗ chuẩn hoá); nội dung biên tập **không** có địa chỉ/GCN ĐKKD (chỉ ở chân trang, thuộc gói B). Số `1900 9398` giữ nguyên (tin 441, 447, 473, 551, 555, 561, 563, 659; bài 1720).
Chưa đổi, chờ chủ:
- Email: `info@haivan.com` (44/45), `cskh@haivan.com` (38/39/40/41/44/45), `hotro@haivan.com` (52/53 và bài 1652, 1689, 1690, 1692, 1693; tin 717, 719), `hoptac@haivan.com` (52/53), `tuyendung@haivantravel.com` (60/61), `kinhdoanh@haivantravel.com` (tin 527).
- Tài khoản nhận tiền `/ho-tro/huong-dan-thanh-toan` (page 96/97): STK 0011002453335, "Công ty LDVCQT Hải Vân" (đã bỏ chữ lặp), Vietcombank - Sở Giao dịch.
- `/ho-tro/thanh-toan-viettel` (page 98/99): người nhận cá nhân "Võ Thị Mỹ Hải", SĐT 098 888 2727.

### #27 số liệu tự mâu thuẫn
Đã sửa (an toàn): "hơn 25 năm" thành "hơn 30 năm" ở page 54/55 (trang đã ghi 1994) và bài 1317, 1335; hub 736, 744 bỏ "năm 2021". Chưa sửa, đề xuất cho MKT (chạy `HV_REPORT=1 content-facts.php` cho danh sách đầy đủ):
- "25 năm" còn lại (28 bài), vì trang không ghi 1994: page 52/53 `/chung-toi/doi-tac` ("25 năm qua" thành "hơn 30 năm qua"), 120/121 `/dich-vu/xe-hop-dong/phuong-tien` ("với 25 năm kinh nghiệm" thành "với hơn 30 năm kinh nghiệm"), bài 985, 1110, 1144, 1145, 1147, 1161, 1223, 1244, 1281, 1301, 1319, 1350, 1371, 1423, 1424, 1494, 1561, 1565, 1585; tin 479, 485, 501, 527, 675 (tin có ngày, có thể giữ). Đề xuất chung: "hơn 30 năm" hoặc bỏ số.
- `/chung-toi/gioi-thieu` (54/55): "với 70% thị phần tuyến Lào Cai – Sapa" (tuyến đã ngưng; không có số mới). Đề xuất: bỏ mệnh đề, giữ "số 1 về quy mô phương tiện và tần suất xe khu vực phía Bắc với hơn 100 xe vận hành trên 9 tỉnh..." sau khi MKT kiểm số xe. Tin 569 (2020) là tin lịch sử, giữ.
- Thì tương lai (54/55): "sẽ đến sân bay Nội Bài vào tháng 6 năm 2020 và các sân bay trên cả nước vào năm 2022" (và thiếu dấu chấm). Đề xuất: "Dịch vụ được giới thiệu lần đầu vào tháng 4 năm 2019 tại sân bay Tân Sơn Nhất, TP. Hồ Chí Minh. [MKT điền các sân bay đã mở rộng thực tế]." Bài 1161: "Mục tiêu đến năm 2022 sẽ phục vụ 6 triệu lượt khách tại 30 tỉnh thành" thành thì quá khứ/bỏ.
- "năm 2021" còn 36 bài (bai_viet 995, 1002, 1006, 1015, 1016, 1090, 1136, 1137, 1155, 1156, 1277, 1279, 1281, 1286, 1287, ...): bỏ năm khỏi câu mở đầu hoặc cập nhật theo nội dung; 1277 "nhà xe Phương Trang đi Vũng Tàu năm 2021 có thay đổi gì không?" thành "...hiện nay có thay đổi gì không?".

### #28
Đã sửa 24/25 lỗi mục 9.1 (mục 25 `popular-routes.json`: **đã đúng** "thuận tiện" và có dấu cách ở cả 3 tuyến trong file hiện tại, không cần Next sửa). Mục 24: "4. Thẻ thanh toán quốc tế" bỏ số "4." (danh sách còn lại không đánh số). Mục 19 đổi thành `https://haivan.com.` (xuống dòng giữ nguyên). Mục 4/5: dính chữ + tên riêng viết hoa ở hub 736/744. `/ho-tro` (page 27, chưa sửa, MKT): "Bạn chỉ cần xác nhận thay đổi đặt chỗ để hoàn thành là tốt" thành "Chỉ cần xác nhận thay đổi đặt chỗ là hoàn tất."; "Bạn bị mất hành lý hãy báo cáo cho chúng tôi, chúng tôi sẽ tìm lại cho bạn" thành "Nếu bị mất hành lý, hãy báo cho chúng tôi để được hỗ trợ tìm lại."; tiêu đề cụt "Bạn cần giúp đỡ tìm kiếm thông tin" thành "Bạn cần hỗ trợ tìm kiếm thông tin?". `&quot;` trong tiêu đề: không có (các `&quot;` trong nội dung là hợp lệ, đã để). Tiêu đề 1344, 1385, 1386 đã sạch ký tự ẩn.

### #29
Xong (xem dedupe). Ngoài audit: trang 74/75 cũng lặp.

## Phát hiện cần gói khác
- Gói B: theme `inc/content-fixes.php` từng lỗi cú pháp ~09:22 UTC (wp-cli sập ~1 phút). `<title>` hub vẫn "Vũng Tàu" (#14). Footer ĐKKD/trụ sở là của B.
- Gói D: cache nginx `s-maxage=300` làm lộ bản cũ sau khi chạy script; nên có lệnh purge sau content-run-all.
- 4 URL landing tuyến chính trả 200 nhưng 0 `<h1>` trong HTML.

## Câu hỏi mở
- Có muốn đổi hẳn mẫu khối cuối bài theo chủ đề như bản cũ (nhiều biến thể) hay giữ mẫu theo cụm (đơn giản)?
- 19 trang `/tuyen-duong/*`: gỡ hay 301 (#21)?

## Bổ sung sau quyết định chủ (Lào Cai - Sapa, danh sách trùng)
- `content-facts.php` luật `lao-cai-sapa-qua-khu`: "với 70% thị phần tuyến Lào Cai – Sapa" thành "từng chiếm khoảng 70% thị phần tuyến Lào Cai – Sapa" (page 54/55, đã ghi, chạy lại = 0). Bản /en/ của trang là bản sao tiếng Việt nên không có câu tiếng Anh.
- Nội dung còn trình bày Lào Cai/Sapa như đang chạy (chưa sửa, chờ MKT): pages 106/107 (`/tuyen-duong/ha-noi-lao-cai-sapa`, trang cả tuyến, thuộc #21), pages 134/135 `/…/phong-ve` ("Lào Cai (4)" trong địa điểm bán vé, chủ xác nhận còn phòng vé không), tin 2019-2020 ra mắt app trên xe Hà Nội - Lào Cai - Sa Pa (453, 569, 621, 683, 684; tin lịch sử, nên để nguyên), tin 619/623/681 chỉ có link bài liên quan. Hub 750 (lào cai) và 756 (sa-pa) là cẩm nang du lịch, không đụng.
- Đề xuất gộp đầy đủ: `docs/seo/duplicate-groups.md` (A 4, B 11, C 26; từng nhóm có đường dẫn, lượt xem, số từ, ghi chú GỘP / MKT QUYẾT / DƯƠNG TÍNH GIẢ; 6 nhóm dương tính giả (khác hãng, bệnh viện, thành phố, ý định); không 301).

## Quyết định chủ đợt 3 (thanh toán, email, gộp bài) — đã làm trên local
Sao lưu `data/backups/pre-pack-c-merge-261029.sql` trước khi ghi. Script mới: `content-policy.php`, `content-merge.php` (+ `lib/content-blocks.php`, tách từ dedupe); `content-relink.php` mở rộng; entries trong `wp-content/themes/haivan-web-child/inc/redirects.php` (chỉ thêm quy tắc, php -l sạch). Thứ tự `content-run-all.sh`: typos, facts, policy, dedupe, merge, relink, bridge. Chạy lại cả 7 = 0 bài đổi.
1. `/ho-tro/huong-dan-thanh-toan` (page 96) và bản /en/ (97): bỏ khối STK/tên tài khoản/ngân hàng/nội dung CK, thay bằng "Chuyển khoản: hệ thống tạo mã QR đúng số tiền cần thanh toán ở bước thanh toán." Bản /en/ là bản sao tiếng Việt nên dùng đúng câu tiếng Việt (câu tiếng Anh sẽ lạc giữa trang tiếng Việt); báo nếu cần tiếng Anh.
2. `/ho-tro/thanh-toan-viettel` (98) và /en/ (99): vào thùng rác; 301 `/ho-tro/thanh-toan-viettel` về `/ho-tro/huong-dan-thanh-toan` (en về `/en/...`), đã curl. Không có menu hay link nội bộ trỏ tới (script vẫn dọn mục menu nếu có; relink đổi link nếu có). Đã dọn khỏi `sitemap`.
3. Email: 41 chỗ trong 18 bài (pages 38-41, 44/45, 52/53, 60/61; tin 527, 717, 719; bài 1652, 1689, 1690, 1692, 1693) thành `info@haivan.com`, kể cả `mailto:`. Chưa gặp câu liệt kê hai email nên chưa cần gộp lặp (luật gộp đã có). Email chân trang nằm trong theme (gói B), không ở đây.
4. Nhóm A: 4 bản `-2` vào thùng rác, 301 về bản gốc.
5. Nhóm B (5 nhóm GỘP, bỏ 3 dương tính giả và 3 MKT quyết): chọn bài giàu thông tin nhất (số từ + ảnh + đề mục, hoà thì mới hơn), đưa vào chỉ phần chưa có (đoạn >= 30% từ khoá mới; ảnh Media còn file; bỏ mục quảng cáo/thương hiệu), rồi thùng rác + 301. Hai nhóm đảo chiều so với đề xuất ban đầu (bài chi tiết hơn làm chuẩn): mã bưu điện Hà Giang giữ `cap-nhat-chi-tiet-ma-buu-dien-ha-giang`; Viettel Post Sơn La giữ `viettel-post-son-la`. Nhóm xe tải Điện Biên: 301 từ `gui-hang-xe-tai-...` và từ bản `-2` đều về `xe-tai-ha-noi-dien-bien` (không chuỗi 301).
6. Toàn vẹn link: `content-relink.php` đọc meta `hv_merged_into` của bài trong thùng rác, đổi mọi link nội bộ tới bài cũ sang bài chuẩn, bỏ link tự trỏ về chính bài, dọn mục "Xem thêm" lặp/trỏ chính nó, rồi bù lại để mỗi bài vẫn có >=2 bài khác link tới (905/905 bài sống, 0 bài thiếu). Sitemap Rank Math không còn URL nào trong thùng rác (kiểm `bai_viet-sitemap*.xml` và `page-sitemap.xml`).
Kiểm: 11 URL cũ trả 301 đúng đích (curl `?nc=`), 7 bài chuẩn + trang thanh toán 200 có 1 `<h1>`; `layout-audit` trên 12 URL ảnh hưởng: 0 lỗi; bản mặc định 0 lỗi (một lần chạy báo 2 lỗi ở `/partner/booking` do Next biên dịch/timeout, chạy lại 0). `docs/seo/duplicate-groups.md` thêm cột "Đã làm".

Status: DONE_WITH_CONCERNS
Summary: 5 script content-* + lib chạy idempotent trên local, fresh-import test ra cùng chỉ số; layout-audit 0 lỗi; địa chỉ trụ sở đã đổi theo quyết định chủ.
Concerns: audit §6 không đúng hoàn toàn (7 CTA "Tại Đây", 347 bài 1 link tới, emoji trong khối); mẫu khối cuối đổi so với bản cũ; 4 landing tuyến chính chưa có H1; cache nginx; heuristic gộp bài có dương tính giả.
