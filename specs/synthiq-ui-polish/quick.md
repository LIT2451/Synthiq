# Spec nhanh: Ảnh không trùng, logo thoáng, timeline đúng vị trí

## Mục tiêu

Người dùng xem site và thấy ba lỗi:

- Portfolio có 8 case study nhưng chỉ dùng 4 ảnh, mỗi ảnh lặp 2 lần.
- Trong logo đầy đủ (`logo-full`, ở footer và `og.png`), mũi nhọn của biểu tượng chạm vào chữ "Synthiqdigital".
- Ở timeline "How we work" trang About, đường kẻ chạy xuyên qua tiêu đề các bước. Số thứ tự thì bị đẩy lên sát tiêu đề section.

Nguyên nhân timeline: `ol[class] { padding: 0 }` có độ ưu tiên cao hơn `.timeline`, nên mất phần `padding` dành cho số và đường kẻ.

## 1. Tiêu chí chấp nhận

1. KHI build site, mỗi ảnh chụp trong `images/photos/` PHẢI chỉ xuất hiện ở đúng một vị trí trên toàn site. Portfolio PHẢI có 8 ảnh case khác nhau, mỗi ảnh có `alt` riêng mô tả đúng nội dung.
2. KHI chạy `npm run assets`, `logo-full` và `og.png` PHẢI có khoảng trống trong suốt giữa biểu tượng và chữ, ít nhất 6% chiều cao logo. Biểu tượng và chữ PHẢI được căn giữa theo chiều ngang.
3. Ở màn hình từ 992px trở lên, đường kẻ timeline PHẢI đi qua tâm các vòng số, bắt đầu ở vòng số 1 và kết thúc ở vòng số 4. Tiêu đề và mô tả các bước PHẢI nằm dưới đường kẻ, không bị đè.
4. Ở màn hình dưới 992px, timeline PHẢI hiện dạng dọc: đường kẻ đi qua tâm các vòng số bên trái, chữ nằm bên phải và không bị đè.
5. Các hành vi hiện có PHẢI giữ nguyên:
   - `npm run build`, `npm test`, `npm run check` đều đạt.
   - `Logo/Logo.png` không đổi.
   - Mỗi file ảnh ≤400 KB, tổng `images/` <6 MB.

## Thiết kế

- **Ảnh**
  - Thêm 4 ảnh Unsplash mới vào `scripts/photos.json`. Đổi tên file ảnh case theo từng dự án, ví dụ `case-support-triage` hay `case-invoice-capture`, mỗi case một ảnh.
  - Chạy `npm run photos`, rồi sửa `src/pages/portfolio.html`.
  - Kiểm tra nội dung ảnh bằng mô tả trên trang Unsplash trước khi dùng.
  - Thêm test: không đường dẫn `images/photos/*` nào lặp lại trên các trang.
- **Logo** (`scripts/assets.mjs`)
  - Sau khi tách biểu tượng bằng `largestComponent`, ghép lại `full` theo thứ tự: biểu tượng, khoảng trống (8% chiều cao), chữ. Cả hai căn giữa ngang.
  - Sửa test tỉ lệ khung hình trong `tests/assets.test.mjs` và thêm test có hàng trong suốt giữa hai phần. Cập nhật `width`/`height` của logo footer.
- **Timeline** (`css/site.css`)
  - Đổi selector thành `ol.timeline` để thắng `ol[class]`.
  - Trên desktop, đặt đường kẻ ở `top: 1rem`, `left: 1rem`, `right: calc((100% - 6rem) / 4 - 1rem)` để dừng ở tâm vòng số 4.
  - Thêm test CSS cho selector này.

## Phạm vi file

- `scripts/**`
- `src/**`
- `css/**`
- `images/**`
- `tests/**`
- `index.html`
- `about.html`
- `services.html`
- `portfolio.html`
- `contact.html`
- `404.html`

## Tasks

- [x] 1 Sửa timeline: selector `ol.timeline`, đường kẻ qua tâm vòng số ở desktop và mobile, thêm test CSS
  - Kiểm chứng: `npm run build && npm test && npm run check` đạt
  - _Requirements: 1.3, 1.4, 1.5_
- [ ] 2 Tách khoảng trống giữa biểu tượng và chữ trong `logo-full`/`og.png`, cập nhật test và kích thước logo footer
  - Kiểm chứng: `npm run assets && npm run build && npm test && npm run check` đạt
  - _Requirements: 1.2, 1.5_
- [ ] 3 Thêm 4 ảnh Unsplash mới, mỗi case Portfolio một ảnh riêng, thêm test chống trùng ảnh
  - Kiểm chứng: `npm run photos && npm run build && npm test && npm run check` đạt
  - _Requirements: 1.1, 1.5_
