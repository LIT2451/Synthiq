# Synthiq website

Site tĩnh cho Synthiq (`synthiqdigital.com`): 5 trang Home, About, Services, Portfolio, Contact cùng trang 404. Chạy trên GitHub Pages, không backend, không cookie, không analytics.

## Lệnh

```sh
npm install        # cài công cụ dev (vitest, fast-check, jsdom, sharp)
npm run build      # render src/ ra các file HTML ở gốc, sitemap.xml, robots.txt, CNAME
npm run check      # kiểm tra link hỏng, meta SEO, ảnh, CSS, độ tương phản, dấu vết thương hiệu cũ
npm test           # unit, property và DOM test
npm run assets     # tạo lại logo, favicon, og.png trong images/ từ Logo/Logo.png
npm run photos     # tải lại ảnh Unsplash trong scripts/photos.json vào images/photos/ (cần mạng)
```

`npm run check -- --source <thư mục site cũ>` còn so sánh chữ hiển thị với site cũ và báo mọi câu trùng từ 8 từ trở lên.

## Cấu trúc

```
src/pages/        nội dung từng trang (front matter + HTML)
src/partials/     layout, header, footer, cta, contact-items
site.config.json  tên, domain, thông tin liên hệ, mạng xã hội
css/site.css      toàn bộ style (token màu ở :root)
js/main.js        menu mobile, bộ lọc Portfolio, hiệu ứng xuất hiện
js/contact.js     validate form và mở mailto
images/           logo, favicon, og.png (do npm run assets tạo), icon SVG, photos/ (do npm run photos tạo)
fonts/            Sora, Manrope (OFL, xem fonts/OFL.txt)
scripts/          build, check, assets
tests/            vitest
```

Các file `*.html`, `sitemap.xml`, `robots.txt`, `CNAME` ở gốc là file build. Sửa trong `src/` hoặc `site.config.json`, rồi chạy `npm run build`. Sửa trực tiếp file ở gốc sẽ bị ghi đè ở lần build sau.

## Logo

Logo gốc nằm ở `Logo/Logo.png` và không bao giờ bị sửa. Khi đổi logo, thay file này (PNG nền trong suốt) rồi chạy `npm run assets`, sau đó `npm test` để kiểm tra kích thước và độ tương phản của ảnh mới.

## Thông tin liên hệ (DEMO)

Mọi giá trị dưới đây là dữ liệu demo, không phải thông tin thật. Phải thay bằng thông tin thật của công ty trong `site.config.json` rồi chạy `npm run build` trước khi công bố:

| Mục | Khoá trong `site.config.json` | Giá trị demo | Hiện ở |
|---|---|---|---|
| Email | `email` | hello@synthiqdigital.com | header mobile, footer, trang Contact; form Contact gửi `mailto:` tới địa chỉ này |
| Hotline | `phone` | +84 24 3999 2468 | header mobile, footer, trang Contact |
| Địa chỉ | `address` | 9th floor, Lotus Building, 2 Pham Hung, Nam Tu Liem, Hanoi | header mobile, footer, trang Contact |
| Mã số thuế | `taxId` | 0109876543 | header mobile, footer, trang Contact |
| Giờ làm việc | `hours` | Mon–Fri, 8:30–17:30 (GMT+7) | header mobile, footer, trang Contact |
| LinkedIn | `social.linkedin` | linkedin.com/company/synthiq-digital | footer |
| GitHub | `social.github` | github.com/synthiq-digital | footer |
| Facebook | `social.facebook` | facebook.com/synthiqdigital | footer |

Để trống một mục thì mục đó bị ẩn ở mọi nơi. Khi `email` trống, form Contact chỉ báo "kênh liên hệ đang được cập nhật" và giữ nguyên dữ liệu đã nhập.

## Ảnh chụp

Ảnh trong `images/photos/` lấy từ Unsplash theo [Unsplash License](https://unsplash.com/license): dùng miễn phí cho cả mục đích thương mại, không bắt buộc ghi công (nhưng nên ghi), không được bán lại ảnh nguyên bản hay gom ảnh để làm dịch vụ cạnh tranh. Ảnh có người hoặc thương hiệu dễ nhận ra có thể cần thêm quyền riêng; nên xem lại trước khi công bố.

Danh sách nguồn nằm ở `scripts/photos.json`. `npm run photos` tải lại từng ảnh, cắt theo kích thước khai báo và xuất WebP + JPG (mỗi file ≤400 KB). Đổi ảnh: sửa `id`, `alt`, kích thước trong `photos.json`, chạy `npm run photos`, rồi sửa chỗ dùng trong `src/pages/`.

Tên tác giả chưa được ghi vì Unsplash chặn truy cập tự động. Mở link từng ảnh dưới đây để xem tác giả và bổ sung vào bảng trước khi công bố.

| File | Dùng ở | Nguồn |
|---|---|---|
| `hero-team` | Home, hero | [photo-1522071820081-009f0129c71c](https://images.unsplash.com/photo-1522071820081-009f0129c71c) |
| `about-meeting` | About, Our story | [photo-1600880292203-757bb62b4baf](https://images.unsplash.com/photo-1600880292203-757bb62b4baf) |
| `solution-relay` | Services, Synthiq Relay | [photo-1544197150-b99a580bb7a8](https://images.unsplash.com/photo-1544197150-b99a580bb7a8) |
| `solution-pilot` | Services, Synthiq Pilot | [photo-1551288049-bebda4e38f71](https://images.unsplash.com/photo-1551288049-bebda4e38f71) |
| `featured-datacenter` | Portfolio, dự án nổi bật | [photo-1558494949-ef010cbdcc31](https://images.unsplash.com/photo-1558494949-ef010cbdcc31) |
| `case-support-triage` | Portfolio, Support inbox triage | [photo-1517694712202-14dd9538aa97](https://images.unsplash.com/photo-1517694712202-14dd9538aa97) |
| `case-invoice-capture` | Portfolio, Invoice capture | [photo-1554224155-6726b3ff858f](https://images.unsplash.com/photo-1554224155-6726b3ff858f) |
| `case-otp-bank` | Portfolio, OTP delivery | [photo-1573164713988-8665fc963095](https://images.unsplash.com/photo-1573164713988-8665fc963095) |
| `case-mvno-usage` | Portfolio, Usage reconciliation | [photo-1451187580459-43490279c0fa](https://images.unsplash.com/photo-1451187580459-43490279c0fa) |
| `case-field-service` | Portfolio, Field service app | [photo-1581091226825-a6a2a5aee158](https://images.unsplash.com/photo-1581091226825-a6a2a5aee158) |
| `case-erp-cloud` | Portfolio, Cloud move for ERP | [photo-1586528116311-ad8dd3c8310d](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d) |
| `case-merchant-onboarding` | Portfolio, Merchant onboarding | [photo-1556742049-0cfed4f6a45d](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d) |
| `case-lending-ledger` | Portfolio, Real-time ledger | [photo-1611974789855-9c2a0a7236a3](https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3) |
| `contact-office` | Contact | [photo-1497366216548-37526070297c](https://images.unsplash.com/photo-1497366216548-37526070297c) |

## Sample content

Mọi số liệu và case study hiện tại là nội dung mẫu. Cần xác nhận hoặc thay trước khi công bố:

- Home (`src/pages/index.html`): chip hero 99.95% uptime, 2 wk, 24/7; dải chỉ số 60+ sản phẩm, 45 kỹ sư, 120M tin nhắn/tháng, 92% khách ở lại sau năm đầu.
- About (`src/pages/about.html`): 150+ năm kinh nghiệm cộng dồn, 11 quốc gia, 3.4 năm hợp tác trung bình, 70% kỹ sư 8+ năm; đoạn "Our story".
- Services (`src/pages/services.html`): mô tả 2 giải pháp Synthiq Relay và Synthiq Pilot.
- Portfolio (`src/pages/portfolio.html`): dải chỉ số 60+ dự án, 9 ngành, 6 tuần, 38 hệ thống; dự án nổi bật (SMS hub, 4,000 msg/s, +6.5 pts, −18%); 8 case study:
  1. AI: Support inbox triage cho tập đoàn e-commerce (41%)
  2. AI: Invoice capture cho công ty logistics (3,200 hoá đơn/tuần)
  3. Telecom: OTP delivery cho ngân hàng số (99.2%)
  4. Telecom: Usage reconciliation cho MVNO (2.1%)
  5. Enterprise: Field service app cho nhà thầu tiện ích (27%)
  6. Enterprise: Cloud move cho ERP sản xuất (34%)
  7. Fintech: Merchant onboarding cho start-up thanh toán (5 ngày xuống 4 giờ)
  8. Fintech: Real-time ledger cho nền tảng cho vay (0 lỗi đối soát)
- Contact (`src/pages/contact.html`): cam kết phản hồi trong 1 ngày làm việc và đề xuất trong khoảng 1 tuần.

## Kiểm tra thủ công trước khi công bố

Lighthouse (Performance, Accessibility, SEO), hiển thị ở 360, 768, 1024, 1440px, điều hướng bằng bàn phím, và mở site khi tắt JavaScript.
