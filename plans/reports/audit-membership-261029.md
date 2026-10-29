# Audit "Khách hàng thân thiết" — 2026-10-29 (chỉ đọc)

Phạm vi: Next `/tai-khoan/khach-hang-than-thiet`, WP `/chung-toi/chuong-trinh-khach-hang-than-thiet` (+ `/en`), lối vào (menu tài khoản, footer, dải app). Tái hiện bằng mock apigw (thành viên / hạng cao nhất / chưa tham gia / API lỗi), đối chiếu web cũ (GET chỉ đọc). Ảnh: scratchpad `membership/`.

## Next — trang hạng & điểm
| # | Mức | Vấn đề | Sửa |
|---|---|---|---|
| A1 | High | API `customer/customers` hoặc `customer/definition` lỗi → skeleton mãi, không thông báo, không "Thử lại" (`loyalty-page.tsx:27`); `definition` chặn cả hạng/điểm | Tách 2 query; hiện hạng/điểm khi có customer; lỗi → `hv-notice-error` + Thử lại; bảng quyền lợi có trạng thái riêng |
| A2 | High | Chưa tham gia (`subscribe_loyalty`=0) vào thẳng URL thấy "Thành viên, 0 điểm" như đã tham gia; không có nút đăng ký (chỉ có ở Thông tin cá nhân) | Thẻ "Bạn chưa tham gia" + nút "Đăng ký khách hàng thân thiết" (ProfileDialog / link) |
| A3 | High | Không cho biết còn bao nhiêu để lên hạng; schema bỏ `next_rank`, `rank_icon`, `given` | Dùng `next_rank` nếu có, không thì ngưỡng tĩnh (Bạc 1 vé; Vàng 30 vé/150.000 điểm; Kim cương 50 vé/250.000 điểm, 12 tháng); hạng cao nhất có câu riêng; xác nhận `balance` vs `given` |
| A4 | High | Menu tài khoản (Next + WP) không có mục "Khách hàng thân thiết"; sidebar 360px cắt chữ, không cuộn mục đang chọn | Thêm mục vào 2 menu; `scrollIntoView` mục `aria-current` |
| A5 | Med | Tên hạng + title cố định tiếng Việt ở `/en`; số luôn định dạng vi | i18n `account.rank_0..3`, `generateMetadata` theo locale |
| A6 | Med | Không dùng icon hạng (file còn trong `public/assets/icons/icon_*_.png`) | Icon 32–40px trên thanh hạng + ô "Hạng của bạn" |
| A7 | Med | 360px: nhãn thanh hạng đè nhau, "Kim cương" chạm mép, `pb-12` cứng | Lưới 4 cột, nhãn trong dòng |
| A8 | Med | Hạng chưa đạt vẫn tích xanh; ổ khoá chỉ là icon | Muted + "Cần đạt hạng X"; text sr-only |
| A9 | Med | `rank_evaluators` rỗng → chỉ còn "Quyền lợi:" | Dòng dự phòng |
| A10 | Med | Ngày giờ bỏ múi giờ; nếu backend trả `…Z` sẽ lệch 7 giờ so với web cũ | Parse có offset → giờ VN; test 2 dạng |
| A11 | Med | Nút lịch sử ẩn khi rỗng; số điểm không đơn vị | Luôn hiện, trạng thái rỗng, thêm "điểm" |
| A12 | Med | Tab 4 hạng bị cắt ở 360px | Tab chia đều / tự cuộn tab đang chọn |
| A13 | Med | "Vé hoàn thành" không nói kỳ xét (12 tháng) | Dòng phụ |
| — | Low | `key={name}`/`key={index}`, thiếu `aria-current` cho hạng, `max-h-[80dvh]`, **không có test** cho loyalty-page | Test: 2 call, lỗi, chưa tham gia, hạng cao nhất, escape lịch sử, 2 dạng ngày |

Đã ổn: chỉ 2 call như web cũ; chưa đăng nhập → `dang-nhap?next=`; escape chuỗi lịch sử; không PII trong URL; tương phản đạt; không tràn ngang.

## WordPress — trang chương trình
| # | Mức | Vấn đề | Sửa |
|---|---|---|---|
| B1 | High | "Tham gia ngay" chỉ là `<p>`, không bấm được (web cũ mở modal đăng ký/đăng nhập) — lối duy nhất cho khách mới | Nút thật → `/tai-khoan/khach-hang-than-thiet` (Next tự đưa qua đăng nhập), đặt cả đầu và cuối trang |
| B2 | High | Nội dung import rác: câu lặp, chuỗi `<p>` mảnh tab cũ, tiêu đề là `<p>`, ảnh quà lặp 3 lần, "hoặc hoặc", số "150,000" | Dọn nội dung, tiêu đề `h2`, 1 ảnh, chuẩn hoá số |
| B3 | High | 42/43 ảnh không `alt` (icon có/không trong bảng quyền lợi); bảng không `th`/`caption` | `alt="Có"/"Không"`, `th scope` |
| B4 | High | Ảnh nhúng `http://localhost:8180/...` tuyệt đối; `og:image` thiếu cổng | URL tương đối/media chuẩn; search-replace khi deploy (đã có trong docs) |
| B5 | Med | Bảng cuộn ngang 360px không gợi ý, cột đầu bị bóp | Fade mép + cột đầu sticky hoặc thẻ theo hạng trên mobile |
| B6 | Med | Title/description mặc định cả site; `/en` title tiếng Việt | Rank Math title/desc riêng (vi, en) |
| B7 | Med | Footer không có link chương trình; bullet "Khách hàng thân thiết" ở dải app là text | Link ở cả hai |
| — | Low | Breadcrumb 2 `aria-current`, mục mẹ không phải link | Chỉ trang hiện tại có `aria-current` |

## Top 5
1. A1 (lỗi → Thử lại). 2. A2 + B1 (lối đăng ký thật). 3. A3 (còn bao nhiêu để lên hạng). 4. A4 (lối vào từ menu). 5. B2–B5 (dọn trang WP, alt, URL ảnh, bảng mobile).

## Câu hỏi mở
- Hình dạng thật của `rank.next_rank`, `account.given`; `balance` là điểm còn lại hay tích luỹ xét hạng?
- `transactions[].updated_at` trả `Y-m-d H:i:s` hay ISO `Z`?
- Chưa tham gia vào URL: hiện trang mời đăng ký (đề xuất) hay chuyển thẳng sang đăng ký?
