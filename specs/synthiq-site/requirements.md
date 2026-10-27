# Tài liệu Requirements: Website Synthiq

## Giới thiệu

Synthiq cần một website giới thiệu công ty phần mềm (outsourcing, telecom, cloud). Site được dựng bằng cách clone site HTML tĩnh DVTechnic (`../Landing-DVTechnic`), nhưng giao diện phải đổi hẳn phong cách và nội dung phải viết lại hoàn toàn để không ai nhận ra hai site chung nguồn. Kết quả: 5 trang HTML tĩnh mang thương hiệu Synthiq, không còn dấu vết DVTechnic, deploy được lên GitHub Pages với tên miền riêng.

## Thuật ngữ

- **Site nguồn**: thư mục `../Landing-DVTechnic` (5 trang `index`, `about`, `services`, `portfolio`, `contact` + `css/`, `js/`, `images/`, `fonts/`, `CNAME`, `sitemap.xml`, `robots.txt`), dựng trên template "Solvet" (Bootstrap/jQuery/GSAP).
- **Site Synthiq**: site HTML tĩnh trong repo này, là kết quả của spec.
- **Dấu vết DVTechnic**: bất kỳ chuỗi nào sau: `DVTechnic`, `dvtechnic` (mọi kiểu hoa/thường), `dvtechnic.com`, `dongle@`, `0111058171`, `915 708 055`, `0915708055`, `Yen Hoa`, `Cau Giay`; tên sản phẩm riêng của Site nguồn (`OpenClaw`, `Hermes`, `Nous`); file ảnh/logo có tên chứa `dvtechnic`, `hermes`, `nous`.
- **Dấu vết template gốc**: chuỗi `Solvet`, `templatemonster`, `drtheme`.
- **Thông tin thương hiệu**: tên, domain, email, hotline, địa chỉ, mã số thuế, giờ làm việc, mạng xã hội của Synthiq.
- **Bộ kiểm tra**: script chạy cục bộ để rà Site Synthiq theo các tiêu chí trong tài liệu này.

## Phạm vi

- Trong phạm vi:
  - 5 trang cùng tên file với Site nguồn: `index.html`, `about.html`, `services.html`, `portfolio.html`, `contact.html`, cùng trang `404.html`.
  - Hệ thống giao diện mới: bảng màu, font, logo chữ, bố cục hero, header, footer, card, nút khác Site nguồn.
  - Viết lại toàn bộ copy tiếng Anh: tagline, dịch vụ, quy trình, giá trị, case study, số liệu mẫu, CTA.
  - SEO cơ bản: title, meta description, canonical, Open Graph, `sitemap.xml`, `robots.txt`, `CNAME`, favicon.
  - Dọn CSS/JS/ảnh không dùng tới, giảm dung lượng ảnh.
  - Bộ kiểm tra tự động (link, asset, dấu vết DVTechnic, metadata).
- Ngoài phạm vi:
  - Backend gửi form liên hệ (email, lưu dữ liệu).
  - Chuyển sang framework (Next.js, React…); đa ngôn ngữ; blog/CMS.
  - Thiết kế logo đồ hoạ chuyên nghiệp (chỉ làm logo chữ/SVG đơn giản).
  - CI/GitHub Actions deploy tự động; mua domain, cấu hình DNS.
  - Sửa đổi Site nguồn.

## Requirements

### Requirement 1: Đủ 5 trang với cấu trúc nội dung tương đương

**User Story:** Là khách hàng tiềm năng, tôi muốn xem đủ thông tin về công ty, dịch vụ, dự án và cách liên hệ, để quyết định có hợp tác với Synthiq không.

#### Tiêu chí chấp nhận

1. Site Synthiq PHẢI có 5 trang `index.html`, `about.html`, `services.html`, `portfolio.html`, `contact.html` ở gốc repo và mở được trực tiếp bằng trình duyệt hoặc static server mà không lỗi console.
2. Trang Home PHẢI có: hero (tiêu đề, mô tả, 2 nút CTA), dải số liệu (4 chỉ số), tối thiểu 3 dịch vụ chính, mục lý do chọn Synthiq (tối thiểu 3 điểm), danh sách công nghệ (tối thiểu 6 mục), băng CTA.
3. Trang About PHẢI có: giới thiệu công ty, 4 chỉ số, sứ mệnh và 4 giá trị cốt lõi, quy trình làm việc 4 bước, băng CTA.
4. Trang Services PHẢI có: 6 dịch vụ (mỗi dịch vụ có tiêu đề, mô tả, tối thiểu 3 ý nổi bật), 2 giải pháp tiêu biểu do Synthiq tự đặt tên, 3 mô hình hợp tác (dedicated team, fixed-price, time & material), băng CTA.
5. Trang Portfolio PHẢI có: dải số liệu, 1 dự án nổi bật, bộ lọc theo tối thiểu 4 lĩnh vực cộng mục "All", tối thiểu 6 case study (mỗi cái có lĩnh vực, tiêu đề, mô tả, kết quả định lượng, công nghệ).
6. KHI người dùng chọn một lĩnh vực trong bộ lọc Portfolio, trang Portfolio PHẢI chỉ hiển thị case study thuộc lĩnh vực đó; KHI chọn "All", PHẢI hiển thị toàn bộ.
7. Trang Contact PHẢI có: khu vực thẻ thông tin liên hệ (chỉ hiện các mục đã cấu hình, theo 3.3), mục "điều gì xảy ra sau khi gửi" 3 bước, form liên hệ.
8. NẾU người dùng mở một URL không tồn tại trên domain, THÌ GitHub Pages PHẢI trả trang `404.html` mang giao diện Synthiq với link về Home.

### Requirement 2: Giao diện đổi hẳn phong cách

**User Story:** Là chủ Synthiq, tôi muốn site có nhận diện riêng, để không bị nhận ra là bản sao của DVTechnic.

#### Tiêu chí chấp nhận

1. Site Synthiq PHẢI dùng nền tối tông navy và màu nhấn teal lấy từ logo `Logo/Logo.png`; không dùng `#0284c7`, `#09001D`, `#38bdf8`, `#0369a1` làm màu nhấn hay màu nền chủ đạo.
2. Site Synthiq PHẢI dùng cặp font khác Site nguồn: không dùng Nunito và Space Grotesk.
3. Hero trang Home PHẢI có bố cục khác Site nguồn (Site nguồn: ảnh nền toàn màn hình, chữ căn trái 3 dòng); bố cục cụ thể được chốt ở design.
4. Header, footer, card dịch vụ, card case study và nút PHẢI có kiểu dáng mới (hình khối, bo góc, đường viền, hiệu ứng hover) khác Site nguồn, áp dụng nhất quán trên cả 5 trang.
5. Site Synthiq PHẢI dùng logo do chủ site cung cấp tại `Logo/Logo.png` (giữ nguyên hình, chỉ cắt viền trong suốt, đổi kích thước, nén, hoặc đổi màu phần chữ để đọc được trên nền tối), gồm bản đầy đủ (biểu tượng + chữ) và bản chỉ biểu tượng; favicon PHẢI tạo từ bản chỉ biểu tượng.
7. NẾU phần chữ của logo gốc có độ tương phản dưới 3:1 với nền đặt logo, THÌ Site Synthiq PHẢI dùng bản logo đã đổi màu chữ sang sáng để tương phản tối thiểu 3:1.
6. Site Synthiq PHẢI không dùng lại ảnh minh hoạ đặc trưng của Site nguồn (ảnh hero, ảnh about collage, mascot, mockup sản phẩm); ảnh thay thế lấy từ nguồn có giấy phép dùng thương mại hoặc minh hoạ SVG/CSS tự tạo.

### Requirement 3: Nội dung viết lại và thông tin thương hiệu Synthiq

**User Story:** Là chủ Synthiq, tôi muốn toàn bộ chữ trên site là của Synthiq, để site phản ánh đúng công ty và không trùng lặp với DVTechnic.

#### Tiêu chí chấp nhận

1. Mọi đoạn văn, tiêu đề, CTA, mô tả dịch vụ và case study PHẢI được viết mới; không câu nào dài từ 8 từ trở lên trùng nguyên văn với Site nguồn.
2. Thông tin thương hiệu (tên, domain, email, hotline, địa chỉ, mã số thuế, giờ làm việc) PHẢI hiển thị đồng nhất ở header mobile, footer 5 trang, trang Contact và metadata.
3. NẾU chủ site chưa cung cấp một mục thông tin thương hiệu (email, hotline, địa chỉ, mã số thuế, giờ làm việc, mạng xã hội), THÌ Site Synthiq PHẢI ẩn mục đó ở mọi nơi (không hiện nhãn trống, số giả hay link hỏng), và `README.md` PHẢI liệt kê các mục còn thiếu cùng vị trí cần điền.
6. Domain của Site Synthiq PHẢI là `synthiqdigital.com`.
4. Số liệu và case study mẫu PHẢI được ghi chú là nội dung mẫu trong `README.md`, để chủ site xác nhận hoặc thay trước khi công bố.
5. Năm bản quyền ở footer PHẢI là năm hiện tại (2026) và ghi "Synthiq".

### Requirement 4: Không còn dấu vết DVTechnic và template gốc

**User Story:** Là chủ Synthiq, tôi muốn repo không chứa thông tin của DVTechnic, để tránh nhầm lẫn và rủi ro pháp lý.

#### Tiêu chí chấp nhận

1. KHI chạy Bộ kiểm tra, Bộ kiểm tra PHẢI tìm (không phân biệt hoa/thường) mọi Dấu vết DVTechnic và Dấu vết template gốc trong tất cả file văn bản của repo (trừ thư mục `specs/`) và báo đạt khi không tìm thấy chuỗi nào.
2. NẾU Bộ kiểm tra tìm thấy một Dấu vết, THÌ Bộ kiểm tra PHẢI in ra file, số dòng, chuỗi tìm thấy và thoát với mã lỗi khác 0.
3. Repo PHẢI không chứa file nào có tên chứa `dvtechnic`, `hermes`, `nous`, `logo copy`.
4. Thuộc tính `alt`, `title`, comment HTML/CSS/JS và tên class tự đặt PHẢI không chứa Dấu vết DVTechnic.

### Requirement 5: Liên kết, asset và hành vi trang

**User Story:** Là khách truy cập, tôi muốn mọi link và hình ảnh hoạt động, để duyệt site không bị gián đoạn.

#### Tiêu chí chấp nhận

1. KHI chạy Bộ kiểm tra, Bộ kiểm tra PHẢI xác nhận mọi `href`/`src` nội bộ trong 6 trang HTML trỏ tới file tồn tại; link `mailto:`, `tel:` và link ngoài được bỏ qua phần tồn tại nhưng `mailto:`/`tel:` PHẢI khớp Thông tin thương hiệu.
2. Menu chính PHẢI có 5 mục Home, About, Services, Portfolio, Contact và nút CTA tới `contact.html`, giống nhau trên cả 5 trang; mục của trang hiện tại PHẢI được đánh dấu active.
3. TRONG KHI độ rộng màn hình dưới 992px, header PHẢI thu gọn menu thành nút mở menu mobile; KHI bấm nút, menu mobile PHẢI mở, và KHI bấm nút đóng hoặc phím Esc, menu PHẢI đóng.
4. TRONG KHI email Synthiq đã được cấu hình, KHI người dùng gửi form liên hệ với đủ trường bắt buộc (họ tên, email hợp lệ, nội dung), trang Contact PHẢI mở trình soạn email (`mailto:` tới email Synthiq) với tiêu đề và nội dung điền sẵn từ form, và hiện thông báo trên trang (không dùng `alert`).
5. NẾU người dùng gửi form thiếu trường bắt buộc hoặc email sai định dạng, THÌ trang Contact PHẢI không gửi, hiện lỗi ngay dưới trường sai và đưa focus tới trường sai đầu tiên.
6. NẾU JavaScript bị tắt, THÌ nội dung chữ của cả 5 trang PHẢI vẫn hiển thị đầy đủ (hiệu ứng xuất hiện không được để nội dung ở trạng thái ẩn).
7. TRONG KHI email Synthiq chưa được cấu hình, KHI người dùng gửi form hợp lệ, trang Contact PHẢI hiện thông báo trên trang rằng kênh liên hệ đang được cập nhật, giữ nguyên dữ liệu đã nhập và không mở `mailto:`.

### Requirement 6: SEO và deploy tĩnh

**User Story:** Là chủ Synthiq, tôi muốn site được tìm thấy trên Google và chạy trên GitHub Pages với domain riêng, để khách hàng truy cập được.

#### Tiêu chí chấp nhận

1. Mỗi trang PHẢI có `<title>` riêng (tối đa 60 ký tự), meta description riêng (70–160 ký tự), canonical URL trên domain Synthiq, thẻ Open Graph (`og:title`, `og:description`, `og:url`, `og:image`) và `<html lang="en">`.
2. `og:image` PHẢI trỏ tới ảnh chia sẻ 1200×630 mang thương hiệu Synthiq.
3. `sitemap.xml` PHẢI liệt kê đúng 5 URL trên domain Synthiq; `robots.txt` PHẢI cho phép crawl và trỏ tới sitemap; `CNAME` PHẢI chứa domain Synthiq.
4. KHI chạy Bộ kiểm tra, Bộ kiểm tra PHẢI xác nhận các tiêu chí 6.1–6.3 và báo lỗi cụ thể cho trang vi phạm.

## Yêu cầu phi chức năng

1. Tổng dung lượng thư mục ảnh PHẢI dưới 6 MB và không ảnh đơn lẻ nào vượt 400 KB (Site nguồn: 33 MB, nhiều ảnh trên 1 MB).
2. Mỗi trang PHẢI chỉ nạp file CSS/JS thực sự dùng; repo PHẢI không chứa thư viện JS/CSS không trang nào nạp.
3. Mỗi trang PHẢI đạt Lighthouse (mobile) tối thiểu 85 Performance, 90 Accessibility, 90 SEO, đo bằng Lighthouse trong Chrome trên bản chạy local.
4. Chữ thân bài PHẢI có độ tương phản tối thiểu 4.5:1 với nền; mọi ảnh nội dung PHẢI có `alt` mô tả, ảnh trang trí có `alt=""`; mọi thành phần tương tác PHẢI dùng được bằng bàn phím và có focus nhìn thấy được.
5. TRONG KHI người dùng bật `prefers-reduced-motion`, Site Synthiq PHẢI tắt hiệu ứng chuyển động và animation chữ.
6. Layout PHẢI không có thanh cuộn ngang ở các độ rộng 360px, 768px, 1280px, 1920px.
7. Site PHẢI không nạp script theo dõi/analytics bên thứ ba.

## Câu hỏi mở và giả định

- [Đã chốt] Domain: `synthiqdigital.com`. Email, hotline, địa chỉ, mã số thuế, giờ làm việc, mạng xã hội: để trống, bổ sung sau (ẩn trên site theo 3.3).
- [Giả định] Thông tin thương hiệu được khai báo tại một chỗ duy nhất để khi bổ sung chỉ cần sửa một nơi; cách làm chốt ở design.
- [Giả định] Nội dung site bằng tiếng Anh như Site nguồn.
- [Giả định] Giữ nền tảng HTML/CSS/JS tĩnh; được phép bỏ jQuery/Bootstrap nếu design chọn viết CSS/JS gọn hơn, miễn đáp ứng các requirement.
- [Giả định] Lĩnh vực bộ lọc Portfolio: AI & Automation, Telecom, Enterprise, Fintech (giữ ngành như Site nguồn, nội dung case study viết mới).
- [Đã chốt] Hướng màu: theo logo, nền tối navy, màu nhấn teal (mã màu cụ thể chốt ở design, phải đạt độ tương phản theo yêu cầu phi chức năng 4). Thay cho hướng nền sáng + cam/san hô đã chọn trước đó.
- [Đã chốt] Logo: dùng `Logo/Logo.png` do chủ site cung cấp (PNG 1536×1024 nền trong suốt, biểu tượng teal/navy phía trên, chữ tối phía dưới), cắt và nén thành PNG/WebP, không vẽ lại.
