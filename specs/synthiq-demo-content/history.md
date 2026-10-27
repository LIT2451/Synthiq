# Nhật ký thực thi: synthiq-demo-content

## 1 Điền thông tin công ty demo vào `site.config.json`, cập nhật test Contact và thêm test link mailto/tel khớp config, địa chỉ không dính dấu vết cũ — HOÀN THÀNH

- Thời gian: 2026-10-27 12:39
- File đã đổi: `404.html`, `about.html`, `contact.html`, `index.html`, `portfolio.html`, `services.html`, `site.config.json`, `tests/pages.dom.test.mjs`
- Kiểm chứng: `npm run build && npm test` → exit 0 (Duration  868ms (import 62%, tests 34%, transform 3%, worker 1%)) [spec-done tự chạy lại]
- Requirements: 1.1, 1.2, 1.3
- Commit: `spec(synthiq-demo-content): 1 Điền thông tin công ty demo vào…`

## 2 Tạo `scripts/photos.json` (nguồn Unsplash đã kiểm tra), `scripts/photos.mjs` và lệnh `npm run photos`; chạy để sinh ảnh vào `images/photos/` — HOÀN THÀNH

- Thời gian: 2026-10-27 12:49
- File đã đổi: `images/photos/about-meeting.jpg`, `images/photos/about-meeting.webp`, `images/photos/case-ai.jpg`, `images/photos/case-ai.webp`, `images/photos/case-enterprise.jpg`, `images/photos/case-enterprise.webp`, `images/photos/case-fintech.jpg`, `images/photos/case-fintech.webp`, `images/photos/case-telecom.jpg`, `images/photos/case-telecom.webp`, `images/photos/contact-office.jpg`, `images/photos/contact-office.webp`, `images/photos/featured-datacenter.jpg`, `images/photos/featured-datacenter.webp`, `images/photos/hero-team.jpg`, `images/photos/hero-team.webp`, `images/photos/solution-pilot.jpg`, `images/photos/solution-pilot.webp`, `images/photos/solution-relay.jpg`, `images/photos/solution-relay.webp`, `package.json`, `scripts/photos.json`, `scripts/photos.mjs`
- Kiểm chứng: `npm run photos && test -z "$(find images -type f -size +400k)" && test "$(du -sk images | cut -f1)" -lt 6144` → exit 0 (images/photos/contact-office.jpg  48 KB) [spec-done tự chạy lại]
- Requirements: 1.4, 1.5
- Commit: `spec(synthiq-demo-content): 2 Tạo scripts/photos.json (nguồn Unsplash…`

## 3 Chèn ảnh vào Home, About, Services, Portfolio, Contact và thêm CSS; bỏ SVG không còn dùng — HOÀN THÀNH

- Thời gian: 2026-10-27 12:51
- File đã đổi: `about.html`, `contact.html`, `css/site.css`, `images/cases/ai.svg`, `images/cases/enterprise.svg`, `images/cases/fintech.svg`, `images/cases/telecom.svg`, `images/solutions/pilot.svg`, `images/solutions/relay.svg`, `index.html`, `portfolio.html`, `services.html`, `src/pages/about.html`, `src/pages/contact.html`, `src/pages/index.html`, `src/pages/portfolio.html`, `src/pages/services.html`
- Kiểm chứng: `npm run build && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.4, 1.7
- Commit: `spec(synthiq-demo-content): 3 Chèn ảnh vào Home, About, Services…`
- Ghi chú: Bo SVG cases/solutions khong con dung; chua xem duoc anh chup man hinh

## 4 Thêm test ảnh (mỗi trang có ảnh, alt, kích thước, file tồn tại, giới hạn dung lượng) — HOÀN THÀNH

- Thời gian: 2026-10-27 12:51
- File đã đổi: `tests/photos.test.mjs`
- Kiểm chứng: `npm test` → exit 0 (Duration  1.05s (import 62%, tests 35%, transform 2%, worker 1%)) [spec-done tự chạy lại]
- Requirements: 1.4, 1.5
- Commit: `spec(synthiq-demo-content): 4 Thêm test ảnh (mỗi trang có ảnh, alt…`
