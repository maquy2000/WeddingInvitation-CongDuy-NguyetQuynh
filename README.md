# Wedding Webapp Example

Thiệp cưới online dạng web tĩnh (HTML/CSS/JS thuần, không cần cài đặt hay build).

- Có 2 thiệp: **nhà trai** và **nhà gái**.
- Toàn bộ nội dung chỉnh sửa trong **một trang Setting**.
- Mở trực tiếp bằng trình duyệt, hoặc publish miễn phí bằng GitHub Pages.

## Bắt đầu nhanh

1. Mở `Setting/index.html` bằng **Chrome hoặc Edge**.
2. Sửa nội dung, rồi bấm **Lưu & cập nhật 2 thiệp**.
3. Lần đầu lưu: chọn **thư mục gốc của project** và cho phép Chrome sửa file.
4. Mở `index.html`, chọn thiệp để xem kết quả.

## Cấu trúc

```text
index.html                    Trang chọn thiệp (nhà trai / nhà gái)
Groom/index.html              Thiệp nhà trai
Bride/index.html              Thiệp nhà gái
Setting/index.html            Trang cài đặt
assets/
  js/config-setting.js        Dữ liệu gốc (trang Setting đọc/ghi)
  js/config-groom.js          Dữ liệu thiệp nhà trai  (tự tạo, không sửa tay)
  js/config-bride.js          Dữ liệu thiệp nhà gái   (tự tạo, không sửa tay)
  js/app.js                   Logic hiển thị thiệp
  js/setting.js               Logic trang Setting
  js/setting-model.js         Tạo dữ liệu 2 thiệp từ dữ liệu gốc
  css/style.css               Giao diện thiệp
  images/                     Ảnh (album thêm từ Setting nằm ở images/album/)
  audio/                      Nhạc nền
tests/setting-model.test.js   Test
```

## Trang Setting

### Luồng dữ liệu

```text
Setting/index.html ──đọc──> config-setting.js
        │
        └─ bấm Lưu ──ghi──> config-setting.js
                      ├───> config-groom.js  ──> Groom/index.html
                      └───> config-bride.js  ──> Bride/index.html
```

Trang Setting chỉ đọc `config-setting.js`. Mỗi lần lưu, 2 file thiệp được tạo lại từ đó. Vì vậy **mọi thay đổi sửa tay trong `config-groom.js` / `config-bride.js` sẽ bị ghi đè**.

### Lưu

- **Thư mục cần chọn** là thư mục gốc chứa `index.html`, `Groom`, `Bride`, `Setting`, `assets`, ví dụ `D:\QGithub\WebAppTest\wedding-webapp-example`. Không chọn `assets` hay `assets/js`; nếu chọn sai, trang sẽ báo.
- **Trước khi ghi**, trang hỏi *"Lưu trực tiếp vào thư mục project?"* và liệt kê 3 file sẽ ghi. Bấm OK để lưu.
- **Thư mục được nhớ lại**. Lần sau chỉ cần xác nhận; khi mở lại trình duyệt, Chrome có thể hỏi lại quyền một lần. Muốn đổi thư mục, bấm **Chọn thư mục project**.
- **Firefox / Safari** không ghi file trực tiếp được. Bấm Lưu sẽ tải 3 file về, bạn chép đè chúng vào `assets/js/`.

### Các phần trong Setting

| Phần | Nội dung |
|---|---|
| Thông tin chung | Tên chú rể, cô dâu; nhạc nền; tự cuộn trang |
| Nhà trai & nhà gái | Bật/tắt thiệp từng nhà, địa chỉ, link Google Maps, ảnh bản đồ, giờ tiệc (cỗ), giờ lễ, ngày đếm ngược, ngày hiển thị, tiêu đề lời mời |
| Bìa | Dòng chữ, nút mở thiệp, ảnh bìa |
| Ảnh nền | Ảnh nền nội dung thiệp, ảnh trang trí khung trang chủ (wave). Để trống = ảnh mặc định |
| Trang chủ & đếm ngược | Lời giới thiệu, mô tả, bật/tắt đồng hồ |
| Ảnh cặp đôi & lời mời | Ảnh cặp đôi, khung lời mời |
| Buổi lễ | Tiêu đề phần lễ của 2 nhà |
| Album | Thêm/xóa/sắp xếp ảnh, hướng ảnh Dọc/Ngang/Vuông, số ảnh hiển thị (0 = tất cả) |
| Mừng cưới | Mô tả, ảnh, thông tin ngân hàng |
| RSVP | Bật/tắt form xác nhận tham dự |
| Lời cảm ơn | Tiêu đề, nội dung |

Mỗi phần có checkbox **Hiển thị phần này**, áp dụng cho cả 2 thiệp.

### Xuất / nhập dữ liệu (sao lưu đầy đủ)

- **Xuất dữ liệu**: tải 1 file `wedding-backup-YYYYMMDD.json` gồm toàn bộ nội dung Setting **và mọi ảnh/nhạc đang dùng** (ảnh bìa, ảnh nền, wave, ảnh cặp đôi, ảnh mừng cưới, bản đồ, album, nhạc nền). File có thể nặng vài chục MB vì chứa cả nhạc. Link `https://...` không được xuất kèm. File nào không tìm thấy sẽ được báo tên.
- **Nhập dữ liệu…**: chọn file sao lưu, trang chép lại ảnh/nhạc vào đúng đường dẫn cũ trong project (ghi đè file trùng tên, có hỏi xác nhận) rồi nạp dữ liệu. Bấm **Lưu** để cập nhật 2 thiệp.
- Nhập cũng nhận file `config-setting.js` của project khác (kể cả bản code cũ); khi đó chỉ có dữ liệu, ảnh/nhạc phải chép tay. Trường mới chưa có trong dữ liệu cũ sẽ lấy giá trị mặc định.
- Xuất/nhập kèm ảnh/nhạc cần Chrome/Edge và chọn thư mục gốc của project.

**Cập nhật code mới cho một bản copy cũ** (giữ nguyên nội dung thiệp của bản copy):

1. Chép code mới đè lên bản copy, **trừ** 3 file `assets/js/config-*.js` và các ảnh/nhạc của bản copy.
2. Mở `Setting/index.html` của bản copy, bấm **Lưu** để tạo lại 2 file thiệp theo code mới.

Nếu lỡ ghi đè `config-setting.js`, dùng **Nhập dữ liệu…** với file `config-setting.js` cũ (lấy từ git hoặc bản sao lưu) rồi bấm Lưu.

### Tắt thiệp một nhà

Bỏ chọn **Bật thiệp của nhà này** trong phần Nhà trai & nhà gái (ví dụ chỉ dùng thiệp nhà gái):

- Link thiệp nhà đó (`Groom/` hoặc `Bride/`) chỉ hiện *"Thiệp chưa sẵn sàng"*; file `config-<nhà>.js` không còn dữ liệu.
- Trang chọn thiệp ẩn thiệp đó. Chỉ còn 1 thiệp thì tự chuyển thẳng tới thiệp còn lại.
- Thiệp nhà còn lại ẩn mọi thông tin của nhà đã tắt (lễ, địa chỉ, bản đồ).
- Thông tin nhà đã tắt vẫn nằm trong `config-setting.js` (cũng được publish). Nếu là thông tin nhạy cảm, hãy xóa trắng trước khi push.

### Album: ảnh dọc / ngang / vuông

- Mỗi ảnh có ô chọn **Dọc** (2:3), **Ngang** (3:2), **Vuông** (1:1) hoặc **Tự động** (thiệp tự đo theo ảnh thật).
- Khi tải ảnh lên hoặc đổi đường dẫn, hướng được tự nhận diện; có thể sửa lại bằng tay.
- Thiệp đặt ảnh trong một khung, xếp thành từng hàng cao bằng nhau. Cách chia hàng được chọn sao cho ít khoảng trống thừa nhất; album ít ảnh thì khung co lại và nằm giữa. Bấm vào ảnh để xem ảnh đầy đủ, không bị cắt.
- Ảnh bản đồ của mỗi nhà hiển thị trong khung vuông, hiện đủ cả ảnh (dùng được cho ảnh QR).

### Thứ tự theo thiệp

| | Thiệp nhà trai | Thiệp nhà gái |
|---|---|---|
| Tên đứng trước | Chú rể | Cô dâu |
| Khung "Tiệc cưới" | Thông tin nhà trai | Thông tin nhà gái |
| Phần buổi lễ | Nhà trai trước, nhà gái sau | Nhà gái trước, nhà trai sau |

## Ảnh & nhạc

- Mỗi ô ảnh trong Setting có ảnh xem trước. Ô viền đỏ nghĩa là file không tồn tại.
- Có 2 cách chọn ảnh:
  - Gõ đường dẫn; trang có gợi ý danh sách ảnh trong `assets/images/`.
  - Bấm **Tải ảnh lên…** để chép ảnh từ máy vào project. Trùng tên thì tự thêm hậu tố `-1`, `-2`.
- **Đường dẫn luôn tính từ thư mục gốc**, ví dụ `assets/images/cover.jpg`. Không dùng `../`. Link `https://...` vẫn dùng được.
- Nên nén ảnh (rộng khoảng 1600px, JPG/WebP) và nhạc (128 kbps) để khách mở bằng 4G không phải chờ lâu. File nhạc hiện tại khoảng 9,5 MB.

## Chạy local

Mở `index.html` bằng trình duyệt là đủ. Nếu muốn môi trường giống GitHub Pages hơn:

```powershell
python -m http.server 8000
# mở http://localhost:8000
```

## Test

```powershell
node tests/setting-model.test.js
```

Test kiểm tra:

- 2 file thiệp đang đồng bộ với `config-setting.js`.
- Thứ tự tên và thứ tự nhà đúng theo từng thiệp.
- Sửa Setting thì cả 2 thiệp đổi theo.
- Không còn đường dẫn `../`.

## Publish bằng GitHub Pages

Project deploy tự động bằng GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

1. **Một lần duy nhất**: trên GitHub, vào `Settings` → `Pages` → `Build and deployment` → `Source`, chọn **GitHub Actions**.
2. Mỗi lần cập nhật: lưu trong Setting, rồi commit và push lên `main`. Workflow sẽ:
   - chạy test; nếu 2 file thiệp lệch với `config-setting.js` thì dừng, không deploy;
   - nếu test pass, deploy cả project lên GitHub Pages.

   Có thể chạy tay ở tab `Actions` → `Deploy Website` → `Run workflow`.
3. Thiệp sẽ có địa chỉ:
   - `https://<username>.github.io/<repository-name>/` (trang chọn thiệp)
   - `.../Groom/` (thiệp nhà trai)
   - `.../Bride/` (thiệp nhà gái)

GitHub Pages cache file khoảng 10 phút. Muốn khách thấy thay đổi ngay, hãy tăng số `?v=...` ở các thẻ `<script>`/`<link>` trong `Groom/index.html` và `Bride/index.html`.

## Khắc phục sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Bấm Lưu nhưng không thấy hộp chọn thư mục | Dùng Chrome/Edge bản mới |
| Báo "Thư mục chưa đúng" | Chọn thư mục gốc (chứa `index.html`), không chọn thư mục con |
| Lưu xong nhưng thiệp không đổi | Reload bằng `Ctrl + F5`. Trên GitHub Pages thì đợi vài phút hoặc tăng số `?v=` |
| Workflow Actions báo lỗi ở bước Test config | Có người sửa tay `config-groom.js` / `config-bride.js`. Mở Setting và bấm Lưu lại rồi push |
| Ảnh không hiện | Kiểm tra ô ảnh trong Setting có viền đỏ không. Tên file có phân biệt hoa/thường trên GitHub Pages |
| Nhạc không phát | Trình duyệt chặn tự phát; khách bấm nút ♫. iPhone để chế độ im lặng cũng không phát |

## Ghi chú

- **Trang `Setting/`** cũng được publish cùng thiệp. Nó không ghi được gì lên server; khách chỉ đọc được những thông tin vốn đã có trong thiệp.
- **RSVP** chỉ lưu trên trình duyệt của từng khách (localStorage), nên bạn không nhận được danh sách. Nếu cần tập trung, hãy dùng Google Forms, Formspree, Supabase hoặc Firebase.
- **Số tài khoản** nhập trong phần Mừng cưới sẽ công khai trên thiệp và nằm trong lịch sử git.
