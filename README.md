# Synthiq website

Site tĩnh cho Synthiq (`synthiqdigital.com`): 5 trang Home, About, Services, Portfolio, Contact cùng trang 404. Chạy trên GitHub Pages, không backend, không cookie, không analytics.

## Lệnh

```sh
npm install        # cài công cụ dev (vitest, fast-check, jsdom, sharp)
npm run build      # render src/ ra các file HTML ở gốc, sitemap.xml, robots.txt, CNAME
npm run check      # kiểm tra link hỏng, meta SEO, ảnh, CSS, độ tương phản, dấu vết thương hiệu cũ
npm test           # unit, property và DOM test
npm run assets     # tạo lại logo, favicon, og.png trong images/ từ Logo/Logo.png
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
images/           logo, favicon, og.png (do npm run assets tạo), SVG minh hoạ
fonts/            Sora, Manrope (OFL, xem fonts/OFL.txt)
scripts/          build, check, assets
tests/            vitest
```

Các file `*.html`, `sitemap.xml`, `robots.txt`, `CNAME` ở gốc là file build. Sửa trong `src/` hoặc `site.config.json`, rồi chạy `npm run build`. Sửa trực tiếp file ở gốc sẽ bị ghi đè ở lần build sau.

## Logo

Logo gốc nằm ở `Logo/Logo.png` và không bao giờ bị sửa. Khi đổi logo, thay file này (PNG nền trong suốt) rồi chạy `npm run assets`, sau đó `npm test` để kiểm tra kích thước và độ tương phản của ảnh mới.

## Missing brand info

Các mục dưới đây đang để trống nên được ẩn ở mọi nơi trên site. Điền vào `site.config.json` rồi chạy `npm run build`:

| Mục | Khoá trong `site.config.json` | Hiện ở |
|---|---|---|
| Email | `email` | header mobile, footer, trang Contact; form Contact gửi `mailto:` tới địa chỉ này |
| Hotline | `phone` | header mobile, footer, trang Contact |
| Địa chỉ | `address` | header mobile, footer, trang Contact |
| Mã số thuế | `taxId` | header mobile, footer, trang Contact |
| Giờ làm việc | `hours` | header mobile, footer, trang Contact |
| LinkedIn | `social.linkedin` | footer |
| GitHub | `social.github` | footer |
| Facebook | `social.facebook` | footer |

Khi `email` còn trống, form Contact chỉ báo "kênh liên hệ đang được cập nhật" và giữ nguyên dữ liệu người dùng đã nhập.

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
