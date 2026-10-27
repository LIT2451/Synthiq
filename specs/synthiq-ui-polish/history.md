# Nhật ký thực thi: synthiq-ui-polish

## 1 Sửa timeline: selector `ol.timeline`, đường kẻ qua tâm vòng số ở desktop và mobile, thêm test CSS — HOÀN THÀNH

- Thời gian: 2026-10-27 13:00
- File đã đổi: `css/site.css`, `tests/css.test.mjs`
- Kiểm chứng: `npm run build && npm test && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.3, 1.4, 1.5
- Commit: `spec(synthiq-ui-polish): 1 Sửa timeline: selector ol.timeline, đường…`

## 2 Tách khoảng trống giữa biểu tượng và chữ trong `logo-full`/`og.png`, cập nhật test và kích thước logo footer — HOÀN THÀNH

- Thời gian: 2026-10-27 13:01
- File đã đổi: `404.html`, `about.html`, `contact.html`, `images/logo-full.png`, `images/logo-full.webp`, `images/og.png`, `index.html`, `portfolio.html`, `scripts/assets.mjs`, `services.html`, `src/partials/footer.html`, `tests/assets.test.mjs`
- Kiểm chứng: `npm run assets && npm run build && npm test && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.2, 1.5
- Commit: `spec(synthiq-ui-polish): 2 Tách khoảng trống giữa biểu tượng và chữ…`

## 3 Thêm 4 ảnh Unsplash mới, mỗi case Portfolio một ảnh riêng, thêm test chống trùng ảnh — HOÀN THÀNH

- Thời gian: 2026-10-27 13:05
- File đã đổi: `images/photos/case-ai.jpg`, `images/photos/case-ai.webp`, `images/photos/case-enterprise.jpg`, `images/photos/case-enterprise.webp`, `images/photos/case-erp-cloud.jpg`, `images/photos/case-erp-cloud.webp`, `images/photos/case-field-service.jpg`, `images/photos/case-field-service.webp`, `images/photos/case-fintech.jpg`, `images/photos/case-fintech.webp`, `images/photos/case-invoice-capture.jpg`, `images/photos/case-invoice-capture.webp`, `images/photos/case-lending-ledger.jpg`, `images/photos/case-lending-ledger.webp`, `images/photos/case-merchant-onboarding.jpg`, `images/photos/case-merchant-onboarding.webp`, `images/photos/case-mvno-usage.jpg`, `images/photos/case-mvno-usage.webp`, `images/photos/case-otp-bank.jpg`, `images/photos/case-otp-bank.webp`, `images/photos/case-support-triage.jpg`, `images/photos/case-support-triage.webp`, `images/photos/case-telecom.jpg`, `images/photos/case-telecom.webp`, `portfolio.html`, `scripts/photos.json`, `src/pages/portfolio.html`, `tests/photos.test.mjs`
- Kiểm chứng: `npm run photos && npm run build && npm test && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.1, 1.5
- Commit: `spec(synthiq-ui-polish): 3 Thêm 4 ảnh Unsplash mới, mỗi case Portfolio…`
