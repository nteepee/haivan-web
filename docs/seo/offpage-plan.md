# Kế hoạch ngoài site: Google Business Profile, Google Posts, backlink, Search Console

> **Trạng thái:** bàn giao 29/10/2026. Điểm, tỷ lệ và anchor là đề xuất từ audit. Chưa có backlink nào được đặt. Tài liệu này không chứa kết quả.

## Điều kiện bắt đầu

Không đưa link ngoài site vào trang tuyến khi:
- Trang đích chưa có nội dung thật hoặc đang noindex. Trang tuyến trả noindex khi không tải được nội dung (`apps/booking/src/app/[lang]/xe-khach/[start]/[end]/page.tsx`). Theo audit (29/10/2026), trang Mộc Châu cả hai chiều chưa có nội dung (xem `route-keywords.md`).
- Site chưa mở cho Google. Điều kiện kỹ thuật nằm trong `docs/deployment-guide.md`, mục "Checklist go-live SEO". MKT không tự bật index.

## 1. Google Business Profile cho phòng chờ

Quy định Google áp dụng (trang trợ giúp Google Business Profile):
- Một địa điểm thật một hồ sơ. Không tạo hồ sơ trùng cho cùng địa chỉ. Phòng chờ và văn phòng cùng địa chỉ là một hồ sơ.
- Địa chỉ phải là nơi thật có người phục vụ khách trong giờ ghi trên hồ sơ. Văn phòng ảo, hộp thư hoặc địa chỉ không có người trực không đủ điều kiện.
- Website trên hồ sơ phải đại diện cho địa điểm đó và chỉ về trang của chính Hải Vân.

**UTM:** giữ đúng `utm_source=gmb` như audit. Next ghi giá trị này vào cookie 30 ngày và gửi kèm khi giữ chỗ (`apps/booking/src/lib/seats.ts`, hàm `buildHoldBody`). Không đổi tên nguồn và không dùng `utm_source` khác cho cùng kênh, vì sẽ tách nguồn trong dữ liệu đặt vé.

Danh sách dưới đây là các điểm trong audit (mục 5.2). Địa chỉ đối chiếu lấy từ bản chụp đặt vé và seed trong repo, chưa phải xác nhận cuối.

| # | Điểm (theo audit) | Địa chỉ đối chiếu trong repo | Website của hồ sơ | Link trong Google Posts | Cần xác nhận |
|---|---|---|---|---|---|
| 1 | Phòng chờ 34 Nguyễn Thái Bình (Quận 1) | 34 Nguyễn Thái Bình, P. Bến Thành, Quận 1 | `https://haivan.com/xe-khach/quan-1/vung-tau?utm_source=gmb` | Luân phiên với hồ sơ này | Giờ mở phòng chờ; người trực |
| 2 | Phòng chờ 156B Lê Hồng Phong (Vũng Tàu) | 156B Lê Hồng Phong, TP. Vũng Tàu | Audit ghi trang Quận 1. Đề xuất `https://haivan.com/xe-khach/vung-tau/quan-1-san-bay?utm_source=gmb`, vì đây là điểm đi của chiều về. [anh chốt] | Luân phiên | Giờ phòng chờ; người trực; chiều nào |
| 3 | Quầy Hải Vân sân bay Tân Sơn Nhất (nhà ga quốc nội) | Ga T1, cột B5 (bản chụp đặt vé). Audit ghi cột B6. | `https://haivan.com/xe-khach/tan-son-nhat/vung-tau?utm_source=gmb` | Luân phiên | Vị trí cột chính xác (B5 hay B6); quầy có người trực |
| 4 | Phòng chờ Bến xe Mỹ Đình (01 Nguyễn Hoàng) | 01 Nguyễn Hoàng, P. Mỹ Đình, Hà Nội | Đề xuất trang chủ `https://haivan.com/?utm_source=gmb`, vì audit không chỉ định và hồ sơ này phục vụ ba tuyến. [anh chốt] | Luân phiên ba trang: `/xe-khach/my-dinh/moc-chau`, `/xe-khach/my-dinh/son-la`, `/xe-khach/my-dinh/dien-bien`, mỗi link kèm `?utm_source=gmb` | Người trực; giờ mở |
| 5 | Điểm dừng nghỉ Mộc Châu (Tổ dân phố 70, Vân Sơn) | Seed tuyến Sơn La ghi Tổ dân phố 70, phường Vân Sơn. Bản chụp đặt vé ghi Văn phòng 254 Trần Huy Liệu, thị trấn Mộc Châu. | `https://haivan.com/xe-khach/my-dinh/moc-chau?utm_source=gmb` (theo audit), chỉ khi trang đã có nội dung | Luân phiên | Địa chỉ đúng (TDP 70 hay 254 Trần Huy Liệu); có người trực trong giờ ghi; điểm dừng có đủ điều kiện hồ sơ không |
| 6 | Bến xe Sơn La | Chưa có địa chỉ trong repo (bản chụp đặt vé chỉ ghi "Sơn La"). [MKT điền] | `https://haivan.com/xe-khach/my-dinh/son-la?utm_source=gmb` | Luân phiên | Địa chỉ; người trực; là bến xe hay phòng chờ |
| 7 | Bến xe Điện Biên Phủ | Bến xe khách TP. Điện Biên Phủ, 79 Quốc lộ 12. Văn phòng Hải Vân Điện Biên, 300 Nguyễn Hữu Thọ. Audit ghi "bến xe". | `https://haivan.com/xe-khach/my-dinh/dien-bien?utm_source=gmb` | Luân phiên | Chọn một địa chỉ; người trực |

Điểm ngoài danh sách audit: danh sách mặc định của trang chủ (trong code) có thêm hai phòng chờ TP.HCM, 307 Nguyễn Văn Trỗi (Tân Bình) và 607 Điện Biên Phủ (Bình Thạnh). Admin có thể đã sửa danh sách này, nên kiểm trên WordPress trước. Nếu tạo hồ sơ cho hai điểm này, đề xuất trỏ về `https://haivan.com/xe-khach/quan-1/vung-tau?utm_source=gmb`, vì đây là chiều đi từ TP.HCM. [anh chốt]

## 2. Google Posts

- **Tần suất:** mỗi hồ sơ một bài mỗi tuần, theo audit. Hồ sơ Mỹ Đình luân phiên ba tuyến.
- **Nội dung:** giới thiệu tuyến đi từ điểm đó, giờ chạy và giá đã được MKT xác nhận, một link tới trang tuyến có UTM đúng. Không đăng giá, giờ hoặc khuyến mãi chưa có trong hệ thống. Không dùng ảnh hoặc tên người chưa có quyền sử dụng.
- **Lưu lịch đăng và link đã dùng** ở nơi MKT quản lý (ngoài repo).

## 3. Backlink

**Phân tầng (theo audit):**
- **Tầng 1, đổ thẳng vào trang tuyến:** báo địa phương và báo du lịch (Bà Rịa – Vũng Tàu, TP.HCM, Sơn La, Điện Biên); bài toplist hoặc so sánh nhà xe. Chỉ nhận link dofollow khi bài là biên tập tự nhiên, không trả tiền.
- **Tầng 2, đổ vào bài pillar và hub `/diem-den/*`:** blog vệ tinh, mạng xã hội, cộng đồng du lịch (nhóm Mộc Châu, review Vũng Tàu, Tây Bắc). Không trỏ thẳng vào trang tuyến.

**Tỷ lệ theo cụm (theo audit):**

| Cụm | Trang nhận link | Tỷ lệ |
|---|---|---|
| Miền Nam (Vũng Tàu) | `quan-1/vung-tau` | 60% |
| Miền Nam (Vũng Tàu) | `tan-son-nhat/vung-tau` và `vung-tau/tan-son-nhat` | 25% |
| Miền Nam (Vũng Tàu) | Bài pillar trên site | 15% |
| Tây Bắc | `my-dinh/moc-chau` | 40% |
| Tây Bắc | `my-dinh/dien-bien` | 35% |
| Tây Bắc | `my-dinh/son-la` | 25% |

**Anchor (theo audit):** 40% thương hiệu và từ khoá; 30% partial match; 20% exact match; 10% URL trần hoặc thương hiệu. Anchor phải khớp chiều đích (xem `route-keywords.md`).

**Ràng buộc chính sách** (Google Search Central, mục link spam):
- Bài trả tiền, quảng cáo dạng bài viết (advertorial), guest post có trả phí và link mua để tăng thứ hạng phải gắn `rel="sponsored"` hoặc `rel="nofollow"`. Link trả tiền không gắn thuộc tính này là vi phạm.
- Không trao đổi link hàng loạt và không tạo trang chỉ để chèn link.
- Anchor khớp từ khoá lặp lại quá mức là dấu hiệu spam.
- Danh sách backlink đã đặt do MKT lưu ngoài repo.

## 4. Search Console sau go-live

Điều kiện kỹ thuật (Dev xác nhận trước): làm theo `docs/deployment-guide.md`, mục "Checklist go-live SEO". Bước này cần `robots.txt` có hai dòng Sitemap và các trang đích trả 200, không noindex.

1. **Thêm property** cho `https://haivan.com`. Xác minh bằng DNS TXT hoặc theo hướng dẫn của Search Console. Origin công khai mặc định là `https://haivan.com` (`apps/booking/src/lib/public-origin.ts`).
2. **Gửi sitemap:**
   - `https://haivan.com/sitemap_index.xml` (Rank Math, WordPress).
   - `https://haivan.com/xe-khach/sitemap.xml` (Next).
   - Sitemap Next chỉ liệt kê tuyến có trong `apps/booking/src/content/popular-routes.json` và chỉ bản tiếng Việt. Tuyến mới phải được Dev thêm trước.
3. **URL Inspection** cho từng trang tuyến. Chỉ yêu cầu lập chỉ mục sau khi trang đã có nội dung thật.
4. **Theo dõi báo cáo Page indexing** (Lập chỉ mục), lọc theo `/xe-khach/`. Xử lý các trạng thái sau:
   - `Excluded by 'noindex' tag`: kiểm meta robots và điều kiện nội dung của trang.
   - `Crawled – currently not indexed` hoặc `Discovered – currently not indexed`: thường là nội dung mỏng hoặc chưa đủ ưu tiên. Xem brief trong `route-keywords.md`.
   - Trang 404 hoặc chuyển hướng ngoài ý muốn: báo Dev.
5. **Đối chiếu số trang tuyến** với danh sách trong `apps/booking/src/content/popular-routes.json`. Đây là nguồn sự thật; không chép số vào tài liệu.
6. **Tần suất kiểm tra:** anh chốt.

## Cần chốt

1. Website của hồ sơ Mỹ Đình: trang chủ hay một tuyến.
2. Phòng chờ 156B Lê Hồng Phong: trỏ về trang đi Quận 1 (audit) hay trang về.
3. Vị trí quầy ga T1 Tân Sơn Nhất: cột B5 hay B6.
4. Điểm dừng Mộc Châu: Tổ dân phố 70 hay 254 Trần Huy Liệu, và có người trực hay không.
5. Bến xe Sơn La: địa chỉ. Bến xe Điện Biên: bến xe hay văn phòng.
6. Có tạo hồ sơ cho hai phòng chờ TP.HCM ngoài danh sách audit không.
7. Ngân sách và nhà cung cấp backlink tầng 1.
8. Tần suất kiểm Search Console.
