# Nhật ký thực thi: synthiq-motion-menu

## 1 Sửa menu mobile: chuyển `backdrop-filter` sang `::before`, panel fixed toàn màn hình có transition, khoá cuộn bằng `menu-open`, toggle thành X; thêm test — HOÀN THÀNH

- Thời gian: 2026-10-27 13:11
- File đã đổi: `css/site.css`, `js/main.js`, `tests/css.test.mjs`, `tests/main.dom.test.mjs`
- Kiểm chứng: `npm run build && npm test && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.1, 1.2, 1.3, 1.6
- Commit: `spec(synthiq-motion-menu): 1 Sửa menu mobile: chuyển backdrop-filter…`
- Ghi chú: Blur chuyen sang .site-header::before; panel fixed toan man hinh co transition; html.menu-open khoa cuon; toggle thanh X

## 2 Thêm hiệu ứng hero, chip nổi, reveal so le, hover cho card/ảnh/nút, tắt theo reduced motion; thêm test — HOÀN THÀNH

- Thời gian: 2026-10-27 13:13
- File đã đổi: `css/site.css`, `js/main.js`, `tests/css.test.mjs`, `tests/main.dom.test.mjs`
- Kiểm chứng: `npm run build && npm test && npm run check` → exit 0 (check passed) [spec-done tự chạy lại]
- Requirements: 1.4, 1.5, 1.6
- Commit: `spec(synthiq-motion-menu): 2 Thêm hiệu ứng hero, chip nổi, reveal so…`
- Ghi chú: Keyframes rise/float; hero vao lan luot, chip noi; reveal so le qua --reveal-delay; hover card/anh/nut; tat het khi reduced motion
