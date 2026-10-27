# Spec nhanh: Thông tin công ty demo và ảnh chụp thật

## Mục tiêu

Site hiện chỉ có SVG minh hoạ và ẩn toàn bộ thông tin liên hệ vì `site.config.json` để trống, nên trông thiếu và chưa giống một công ty thật. Cần điền thông tin công ty demo ở Hà Nội và thêm ảnh chụp Unsplash (tải về, cắt, nén, ghi nguồn) cho các trang chính.

## 1. Tiêu chí chấp nhận

1. KHI build site, header mobile, footer và thẻ "Reach us directly" ở trang Contact PHẢI hiện email `hello@synthiqdigital.com`, hotline dạng `+84 24 xxxx xxxx`, địa chỉ demo ở Hà Nội, mã số thuế demo, giờ làm việc; footer PHẢI hiện link LinkedIn, GitHub, Facebook demo (https).
2. Link `mailto:` và `tel:` trên mọi trang PHẢI khớp `site.config.json`, và form Contact PHẢI mở `mailto:` tới email đã cấu hình khi dữ liệu hợp lệ.
3. Địa chỉ, số điện thoại, MST demo PHẢI không trùng dấu vết công ty cũ mà `findTraces` đang chặn (vì vậy địa chỉ đặt ở quận Nam Từ Liêm, không dùng quận cũ).
4. KHI mở Home, About, Services, Portfolio, Contact, mỗi trang PHẢI có ít nhất một ảnh chụp Unsplash thật (Home: hero; About: phần story; Services: 2 giải pháp; Portfolio: dự án nổi bật và 4 nhóm case study; Contact: ảnh văn phòng), dùng `<picture>` WebP kèm JPG dự phòng, có `alt` mô tả, `width`/`height`, `loading="lazy"` trừ ảnh hero.
5. Mỗi file ảnh PHẢI ≤400 KB và tổng `images/` PHẢI <6 MB; ảnh được tạo lại được bằng `npm run photos` từ danh sách nguồn trong `scripts/photos.json`.
6. README PHẢI ghi nguồn từng ảnh (tác giả, link Unsplash), nêu giấy phép Unsplash, và đánh dấu thông tin liên hệ là dữ liệu demo cần thay trước khi công bố (thay mục "Missing brand info").
7. Các hành vi hiện có PHẢI giữ nguyên: `npm run build`, `npm test`, `npm run check`, `npm run check -- --source ../Landing-DVTechnic` đều đạt; `Logo/Logo.png` không đổi; không có script ngoài; site vẫn đọc được khi tắt JavaScript.

## Thiết kế

- `site.config.json`: điền email, phone `+84 24 3999 2468`, address `Tầng 9, Tòa nhà Lotus, 2 Phạm Hùng, Nam Từ Liêm, Hà Nội` (demo), taxId `0109 876 543` (demo), hours `Mon–Fri, 8:30–17:30 (GMT+7)`, social https demo. `buildContext` đã sinh `phoneHref`, `hasContact`, `hasSocial` nên partial tự hiện.
- `scripts/photos.json`: danh sách `{ file, url, author, authorUrl, photoUrl, alt, width, height }` cho khoảng 9 ảnh Unsplash (đội ngũ làm việc, văn phòng, hạ tầng mạng/server, phân tích dữ liệu, thanh toán...). Link ảnh tìm bằng web search trong lúc làm.
- `scripts/photos.mjs` (lệnh `npm run photos`): tải từng ảnh qua `fetch` vào thư mục tạm, dùng `sharp` cắt theo `width`/`height` (`fit: cover`), xuất `images/photos/<file>.webp` (quality ~72) và `.jpg` (mozjpeg ~70), xoá file tạm. Ảnh đã sinh được commit để site chạy tĩnh không cần mạng.
- `src/partials/photo.html` không cần: chèn `<picture>` trực tiếp ở từng trang. Portfolio: thay SVG nhóm case bằng ảnh, giữ SVG không còn dùng thì xoá để `check` không báo file thừa.
- `css/site.css`: style `.photo` (bo góc, `object-fit: cover`, viền `--line`, lớp phủ gradient nhẹ ở hero), bố cục hero 2 cột với ảnh + logo mark, ảnh trong `.story`, `.solution`, `.featured`, `.case-card`, `.contact-card`.
- Test: sửa test Contact (thẻ liên hệ hiện, không còn fallback), thêm test mailto/tel khớp config, mỗi trang có `picture img[src^="images/photos/"]` với alt khác rỗng, kích thước, file tồn tại; test kích thước file ảnh; test địa chỉ demo không khớp `findTraces`.

## Phạm vi file

- `site.config.json`
- `package.json`
- `src/**`
- `css/**`
- `js/**`
- `images/**`
- `scripts/**`
- `tests/**`
- `README.md`
- `index.html`
- `about.html`
- `services.html`
- `portfolio.html`
- `contact.html`
- `404.html`
- `sitemap.xml`
- `robots.txt`
- `CNAME`

## Tasks

- [x] 1 Điền thông tin công ty demo vào `site.config.json`, cập nhật test Contact và thêm test link mailto/tel khớp config, địa chỉ không dính dấu vết cũ
  - Kiểm chứng: `npm run build` rồi `npm test` đạt
  - _Requirements: 1.1, 1.2, 1.3_
- [ ] 2 Tạo `scripts/photos.json` (nguồn Unsplash đã kiểm tra), `scripts/photos.mjs` và lệnh `npm run photos`; chạy để sinh ảnh vào `images/photos/`
  - Kiểm chứng: `npm run photos` chạy xong, mỗi file ≤400 KB, tổng `images/` <6 MB
  - _Requirements: 1.4, 1.5_
- [ ] 3 Chèn ảnh vào Home, About, Services, Portfolio, Contact và thêm CSS; bỏ SVG không còn dùng
  - Kiểm chứng: `npm run build` và `npm run check` đạt
  - _Requirements: 1.4, 1.7_
- [ ] 4 Thêm test ảnh (mỗi trang có ảnh, alt, kích thước, file tồn tại, giới hạn dung lượng)
  - Kiểm chứng: `npm test` đạt
  - _Requirements: 1.4, 1.5_
- [ ] 5 Cập nhật README (nguồn ảnh, giấy phép Unsplash, thông tin demo, lệnh `npm run photos`), chạy kiểm tra toàn bộ
  - Kiểm chứng: `npm run build`, `npm test`, `npm run check`, `npm run check -- --source ../Landing-DVTechnic` đều đạt
  - _Requirements: 1.6, 1.7_
