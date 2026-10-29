# Việc cần làm để đảm bảo SEO (từ `SEO works/HAIVAN-MASTER-AUDIT-FULL.md`, đối chiếu localhost:8180 ngày 29/10/2026)

Ký hiệu: ✅ đã kiểm lại thấy đúng · ⚠️ chưa kiểm lại · Chủ: Dev / MKT / Anh (cần xác nhận thông tin).

## P0 — Chặn index / mất nội dung (phải xong trước go-live)
| # | Việc | Bằng chứng | Chủ |
|---|---|---|---|
| 1 | **Next không render nội dung chính phía server** (Suspense `B:0` rỗng) → mọi trang `/xe-khach/*`, `/tracking`, `/tai-khoan/*` có 0 `<h1>` trong HTML, Google chỉ thấy header/footer | ✅ curl :3010 `/xe-khach/quan-1/vung-tau` 0 `<h1>`; đang debug | Dev |
| 2 | Bật index WP khi go-live: `blog_public=1`, kiểm Rank Math robots + canonical (local đang `noindex, nofollow`, không canonical — đúng cho local, sai nếu quên) | ✅ `blog_public=0` | Dev (checklist deploy) |
| 3 | Next: `PUBLIC_ORIGIN`/site URL = `https://haivan.com` ở production để bỏ `noindex` môi trường | ⚠️ | Dev |
| 4 | Link "Đăng nhập" `?next=` sinh ~1.045 URL rác: thêm `rel="nofollow"`, `robots.txt` `Disallow: /tai-khoan/`, `noindex` trang đăng nhập | ✅ không nofollow, robots không chặn | Dev |
| 5 | Trang tuyến chưa có nội dung → `noindex` rỗng: `my-dinh/moc-chau`, `moc-chau/my-dinh`, `son-la/my-dinh`, `dien-bien/my-dinh` (CMS không biết tuyến) → cho landing tuyến chính dựng từ WP `hv_route` + chuyến apigw theo toạ độ, không phụ thuộc CMS `route-listing`; seed nội dung có sẵn trong `route-landing-seed.php` | ✅ 4 URL `noindex`, 0 H1 | Dev |
| 6 | Header bảo mật + `Cache-Control` cho HTML WP ở nginx (HSTS, nosniff đã có, X-Frame-Options, Referrer-Policy), fastcgi_cache | ✅ chỉ có nosniff | Dev |

## P1 — Trang tiền (4 tuyến, 2 chiều)
| # | Việc | Chủ |
|---|---|---|
| 7 | Phân vai từ khoá 2 chiều (title/H1/anchor) theo bảng §2.2 audit; chiều đi giữ head keyword, chiều về chỉ keyword chiều về; nút "Xem chiều ngược lại" dưới H1 | Dev + MKT |
| 8 | Nội dung 2 chiều khác nhau ≥60% (thứ tự điểm đón, FAQ riêng cho chiều về) | MKT |
| 9 | Làm dày `tan-son-nhat/vung-tau` (363 từ), `yen-nghia/dien-bien` (653 từ), `vung-tau/tan-son-nhat`; tách Mộc Châu khỏi trang Sơn La | MKT |
| 10 | Bảng HTML `<table>` hạng xe / giờ / giá trên mỗi trang tuyến (featured snippet) | Dev (khung) + MKT (số liệu) |
| 11 | **Bỏ `AggregateRating` 4.8/1.250 giống hệt mọi tuyến** — đánh giá tự dựng vi phạm chính sách Google; chỉ dùng khi có dữ liệu thật | Dev + Anh |
| 12 | 10 tiêu đề cột footer + app band đang là `<h2>` → đổi sang `<p>`/`<div>` (cả WP và Next) | ✅ Dev |
| 13 | Menu/footer: thêm Mỹ Đình – Mộc Châu, sửa tên "Vũng Tàu – Quận 1/Sân bay", tên tuyến tiếng Anh ở `/en/` | Dev/MKT |
| 14 | Title Hub điểm đến 1 chữ ("Mộc Châu") → title đầy đủ; "Điểm đến Archive", "Tin tức Archive" → tiếng Việt; 6 trang chính sách trùng title trang chủ | ⚠️ Dev |

## P2 — Kỹ thuật nội dung & link nội bộ
| # | Việc | Chủ |
|---|---|---|
| 15 | Schema `Article/BlogPosting` + `BreadcrumbList` cho `bai_viet`, `tin_tuc`, `diem_den` (hiện chỉ `Organization`) | ✅ Dev |
| 16 | Hiển thị bài nhập (một lần ở tầng render, không sửa từng bài): `<h1>` trong bài → `<h2>` (15 bài), ảnh `height:auto` (ảnh bị bóp méo trên mobile), ngắt từ chống tràn ngang (25 trang), ẩn/thay ảnh ngoài đã chết (googleusercontent, fbcdn), bỏ `<p>` rỗng | ✅ layout-audit `--all` | Dev |
| 17 | `alt=""` gán cứng ở `hv_card_image`, `home.php`, `hv_featured_photo` → alt = tiêu đề bài | ⚠️ Dev |
| 18 | Ảnh 404: banner `hv_banner` cũ, ảnh hạng xe/phòng chờ trong `popular-routes.json`, ~34 thumbnail điểm đến | ⚠️ Dev + MKT |
| 19 | Relink 914 bài (audit báo đã làm trong DB local) → **kiểm lại và đóng thành script chạy lại được** trên production, không chỉ sửa tay DB local | ⚠️ Dev |
| 20 | Khối "bắc cầu" cho 121 bài điểm đến đã ngưng (Hà Giang, Sapa, Huế…) trỏ về 4 tuyến — làm thành block/shortcode theo design (không emoji) | Dev + MKT |
| 21 | Trang rác: `/dat-ve-nhanh/*` mảnh vụn, `/dat-ve-nhanhs/*`, `/mobile`, `/dich-vu/hang-hoa/tra-cuu-don` rỗng, 6 `/tuyen-duong/*` cũ → 301 về trang đúng hoặc gỡ + bỏ khỏi sitemap | Dev + Anh |
| 22 | Gộp 49 cặp bài trùng chủ đề (301 về bài tốt nhất); ghim bài pillar lên trang 1 các hub | MKT |
| 23 | Link chuyển ngôn ngữ Next không nối `?en` rỗng (canonical lệch) | ⚠️ Dev |

## P3 — Nội dung, pháp lý, thương hiệu (cần anh xác nhận số liệu đúng)
| # | Việc | Chủ |
|---|---|---|
| 24 | Copyright 2020 → năm hiện tại, tách vi/en | Dev |
| 25 | Địa chỉ ĐKKD (Hải Phòng vs Hải Dương), trụ sở (125 Hoàng Ngân vs Lô C8 Nguyễn Chánh), email liên hệ thống nhất | **Anh** → MKT |
| 26 | Hotline sai `19006773`, thống nhất cách viết `1900 6763`; "Công ty Công ty LDVCQT"; tài khoản cá nhân ở trang Viettel | **Anh** → MKT |
| 27 | Số liệu tự mâu thuẫn (3 thập kỷ vs 25 năm, 70% thị phần Lào Cai–Sapa, "năm 2021", tương lai 2020/2022) | MKT |
| 28 | 25 lỗi chính tả §9.1, câu dịch máy `/ho-tro`, chuẩn hoá Unicode NFC + xoá ký tự ẩn zero-width trong tiêu đề | Dev (script NFC/zero-width) + MKT |
| 29 | Nội dung lặp 2 lần: `/chung-toi/lien-he`, `/haivanplus`, `/dat-ve-nhanhs/khachhang` | MKT |
| 30 | `/en/` còn tiếng Việt (menu tuyến, khối phòng chờ, dải app) | Dev |
| 31 | Đồng bộ header/footer WP ↔ Next (menu `<a>` vs `<button>`, skip link, `?next=`, logo GPN) | Dev |

## P4 — Ngoài site (MKT)
| # | Việc |
|---|---|
| 32 | Google Business Profile 7 phòng chờ trỏ đúng URL tuyến (kèm UTM) + Google Posts hàng tuần |
| 33 | Backlink tầng 1 (báo địa phương, toplist) theo tỉ lệ từng tuyến; anchor 40/30/20/10 |
| 34 | Search Console: khai báo 2 sitemap, theo dõi index trang tuyến sau go-live |

## Câu hỏi mở
- Thông tin pháp lý đúng (địa chỉ ĐKKD, trụ sở, email, tài khoản nhận tiền) — anh xác nhận.
- Có số đánh giá thật theo tuyến không? Không có thì bỏ `AggregateRating`.
- Trang rác: 301 hay gỡ hẳn?
