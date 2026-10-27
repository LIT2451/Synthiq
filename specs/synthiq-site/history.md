# Nhật ký thực thi: synthiq-site

## 1.1 Tạo `package.json`, `vitest.config.mjs`, `.gitignore`, `.nojekyll`, `site.config.json` — HOÀN THÀNH

- Thời gian: 2026-10-27 11:54
- File đã đổi: `.gitignore`, `.nojekyll`, `package-lock.json`, `package.json`, `site.config.json`, `tests/smoke.test.mjs`, `vitest.config.mjs`
- Kiểm chứng: `npm test` → exit 0 (Duration  73ms (import 54%, tests 21%, transform 16%, worker 8%)) [spec-done tự chạy lại]
- Requirements: 3.6
- Commit: `spec(synthiq-site): 1.1 Tạo package.json, vitest.config.mjs…`

## 2.1 Viết `scripts/lib/render.mjs`: `escapeHtml`, `parsePage` (front matter), `render` (`{{key}}`, đường dẫn chấm, `{{> partial}}` lồng tối đa 5 cấp, phát hiện vòng lặp, `{{#if}}…{{else}}…{{/if}}` lồng), ném `RenderError` khi thiếu key/partial — HOÀN THÀNH

- Thời gian: 2026-10-27 12:00
- File đã đổi: không có (ngoài specs/)
- Kiểm chứng: `npm test -- render` → exit 0 (Duration  73ms (import 40%, transform 24%, tests 19%, worker 16%, environment 1%)) [spec-done tự chạy lại]
- Requirements: 3.2, 3.3
- Commit: `spec(synthiq-site): 2.1 Viết scripts/lib/render.mjs: escapeHtml…` (chỉ cập nhật specs/)
- Ghi chú: escapeHtml escape thêm { } để giá trị chèn vào không tạo chuỗi {{ (cần cho P1)

## 2.2 Property P1: Render template đúng điều kiện và đầy đủ — HOÀN THÀNH

- Thời gian: 2026-10-27 12:01
- File đã đổi: `tests/render.property.test.mjs`
- Kiểm chứng: `npm test -- render` → exit 0 (Duration  100ms (tests 49%, import 31%, transform 13%, worker 6%)) [spec-done tự chạy lại]
- Requirements: 3.2, 3.3
- Property: P1 pass (200 lần)
- Commit: `spec(synthiq-site): 2.2 Property P1: Render template đúng điều kiện và…`

## 2.3 Unit test `render.mjs`: front matter thiếu title/description/path báo lỗi; partial thiếu và vòng lặp ném `RenderError`; escape đủ 5 ký tự — HOÀN THÀNH

- Thời gian: 2026-10-27 12:01
- File đã đổi: `Logo/Favicon.png`, `Logo/Logo.png`, `scripts/lib/render.mjs`, `tests/render.test.mjs`, `tests/smoke.test.mjs`
- Kiểm chứng: `npm test -- render` → exit 0 (Duration  92ms (tests 44%, import 35%, transform 13%, worker 7%)) [spec-done tự chạy lại]
- Requirements: 3.2, 6.1
- Commit: `spec(synthiq-site): 2.3 Unit test render.mjs: front matter thiếu…`
