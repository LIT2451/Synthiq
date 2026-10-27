# Spec nhanh: Hiệu ứng chuyển động và sửa menu mobile

## Mục tiêu

Menu mobile đang lỗi. `.site-header` có `backdrop-filter`, và thuộc tính này biến header thành khung chứa của các phần tử `position: fixed` bên trong. Vì vậy `.mobile-panel` (`inset: 0`) bị giới hạn trong header cao 72px chứ không phủ toàn màn hình. Khi menu mở, trang phía sau vẫn cuộn được, còn nút toggle không đổi hình.

Người dùng muốn thêm hiệu ứng chuyển động để site sinh động hơn.

## 1. Tiêu chí chấp nhận

1. Màn hình dưới 992px và có JS: KHI bấm nút toggle, panel menu PHẢI phủ toàn bộ viewport, nằm trên mọi nội dung, có hiệu ứng trượt và mờ dần vào. KHI đóng menu (nút đóng, phím Esc, bấm link), panel PHẢI trượt ra rồi ẩn hẳn. Lúc ẩn, panel không nhận focus hay click.
2. KHI menu mở, trang phía sau PHẢI không cuộn được. KHI menu đóng, trang PHẢI cuộn lại bình thường.
3. Nút toggle PHẢI chuyển từ 3 gạch sang dấu X khi `aria-expanded="true"` và chuyển ngược lại khi đóng.
4. KHI tải trang, phần hero PHẢI có hiệu ứng xuất hiện lần lượt cho eyebrow, tiêu đề, đoạn dẫn, nút và ảnh. Các chip số liệu ở hero PHẢI có chuyển động nổi nhẹ. Các phần tử `.reveal` cùng hàng PHẢI xuất hiện so le. Thẻ card, ảnh case và nút PHẢI có hiệu ứng hover (nhấc lên hoặc phóng nhẹ).
5. NẾU người dùng bật `prefers-reduced-motion: reduce`, THÌ mọi animation và transition ở trên PHẢI tắt, nội dung hiện ngay.
6. Các hành vi hiện có PHẢI giữ nguyên:
   - Không có JS thì không nội dung nào bị ẩn, và nav vẫn hiện dưới logo.
   - Trạng thái ẩn để chạy hiệu ứng chỉ áp dụng dưới `.js`.
   - Esc và nút đóng trả focus về nút toggle.
   - `npm run build`, `npm test`, `npm run check` đều đạt.

## Thiết kế

- **`css/site.css`, header**
  - Bỏ `backdrop-filter` khỏi `.site-header`, chuyển nó sang `.site-header::before`, một lớp nền nằm sau nội dung (`z-index: -1`, `isolation: isolate`). Header vẫn mờ kính nhưng không còn tạo khung chứa cho panel.
- **`css/site.css`, panel**
  - Dưới `.js` và dưới 992px, panel luôn là `position: fixed; inset: 0`.
  - Panel ẩn bằng `visibility: hidden; opacity: 0; transform: translateY(-12px)`. Khi có `.is-open`, panel hiện bằng transition.
  - Các link trong panel có `transition-delay` so le.
- **`css/site.css`, nút toggle**
  - Hai gạch `::before`/`::after` xoay ±45° và gạch giữa trong suốt, theo `[aria-expanded="true"]`.
- **`js/main.js`**
  - `setOpen` bật hoặc tắt class `menu-open` trên `document.documentElement`. CSS dùng class này để đặt `overflow: hidden`.
- **Hiệu ứng trang**
  - Thêm `@keyframes rise` và `@keyframes float`.
  - Hero: `.js .hero-copy > *` và `.hero-visual` chạy `rise` với delay tăng dần. Ở trạng thái gốc phần tử vẫn hiện, animation dùng `animation-fill-mode: both` và chỉ áp dụng dưới `.js`.
  - Hiệu ứng `.reveal` so le: dùng `--reveal-delay`, do `initReveal` gán theo vị trí của phần tử trong cha.
  - Hover: `.card` nhấc lên, `.photo` trong card phóng nhẹ, `.btn` nhấc lên.
  - Khối `prefers-reduced-motion` hiện có đã tắt animation, nay thêm phần reset cho panel và hero.
- **Test**
  - DOM: mở menu thì `html` có `menu-open`, đóng thì mất.
  - CSS: `.site-header` không có `backdrop-filter`; có quy tắc biến toggle thành X theo `aria-expanded`; `.mobile-panel` có `position: fixed` dưới `.js`; các keyframes `rise` và `float` tồn tại; trạng thái ẩn chỉ nằm dưới `.js`.

## Phạm vi file

- `css/**`
- `js/**`
- `src/**`
- `tests/**`
- `index.html`
- `about.html`
- `services.html`
- `portfolio.html`
- `contact.html`
- `404.html`

## Tasks

- [x] 1 Sửa menu mobile: chuyển `backdrop-filter` sang `::before`, panel fixed toàn màn hình có transition, khoá cuộn bằng `menu-open`, toggle thành X; thêm test
  - Kiểm chứng: `npm run build && npm test && npm run check` đạt
  - _Requirements: 1.1, 1.2, 1.3, 1.6_
- [x] 2 Thêm hiệu ứng hero, chip nổi, reveal so le, hover cho card/ảnh/nút, tắt theo reduced motion; thêm test
  - Kiểm chứng: `npm run build && npm test && npm run check` đạt
  - _Requirements: 1.4, 1.5, 1.6_
