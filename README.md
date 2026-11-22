# Wedding Webapp Example

Thiệp cưới online dạng web tĩnh (HTML/CSS/JS thuần, không cần cài đặt hay build).

- Có 2 thiệp: **nhà trai** và **nhà gái**.
- Toàn bộ nội dung chỉnh sửa trong **một trang Setting**. Thông tin đám cưới dùng chung; từng phần hiển thị chọn dùng chung hoặc tách riêng cho mỗi thiệp.
- 2 mẫu thiệp: **Mặc định** (hồng vàng) và **Cổ điển** (nâu kem, bìa phong bì, lịch tháng).
- Hộp quà mừng cưới: khách bấm vào hộp quà để mở, thấy mã QR chuyển khoản của chú rể / cô dâu.
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
  js/config-groom.js          Thiệp nhà trai: tự lấy thông tin từ config-setting.js (không sửa)
  js/config-bride.js          Thiệp nhà gái: tự lấy thông tin từ config-setting.js (không sửa)
  js/app.js                   Logic hiển thị thiệp
  js/setting.js               Logic trang Setting
  js/setting-model.js         Tạo dữ liệu 2 thiệp từ dữ liệu gốc
  css/style.css               Giao diện thiệp (mẫu Mặc định, hộp quà)
  css/template-vintage.css    Mẫu Cổ điển (viết đè style.css khi chọn mẫu này)
  images/                     Ảnh (album thêm từ Setting nằm ở images/album/)
  audio/                      Nhạc nền
scripts/build-site.js         Tạo bản deploy (_site) từ Setting
tests/setting-model.test.js   Test
```

## Trang Setting

### Luồng dữ liệu

```text
Setting/index.html ──đọc / bấm Lưu ghi──> config-setting.js   (1 file Setting chung, duy nhất)
                                              │
              Groom/index.html <── config-groom.js ──┤  mỗi lần mở thiệp, tự tạo thông tin từ config-setting.js
              Bride/index.html <── config-bride.js ──┘
```

Bấm Lưu chỉ ghi **1 file** `config-setting.js`. Cả 2 thiệp đọc chung file này khi mở, nên luôn cập nhật cùng lúc và không bao giờ lệch nhau. `config-groom.js` / `config-bride.js` chỉ là 1 dòng code, không chứa dữ liệu.

Khi deploy, `scripts/build-site.js` tạo sẵn dữ liệu riêng cho từng thiệp vào 2 file này, và để rỗng `config-setting.js`, nên web không lộ thông tin cả 2 nhà trong một file.

### Lưu

- **Thư mục cần chọn** là thư mục gốc chứa `index.html`, `Groom`, `Bride`, `Setting`, `assets`, ví dụ `D:\QGithub\WebAppTest\wedding-webapp-example`. Không chọn `assets` hay `assets/js`; nếu chọn sai, trang sẽ báo.
- **Trước khi ghi**, trang hỏi *"Lưu trực tiếp vào thư mục project?"* và hiện file sẽ ghi. Bấm OK để lưu.
- **Thư mục được nhớ lại theo từng project**. Lần sau chỉ cần xác nhận; khi mở lại trình duyệt, Chrome có thể hỏi lại quyền một lần. Muốn đổi thư mục, bấm **Chọn thư mục project**.
- **Chỉ nhận đúng thư mục của project** chứa trang Setting đang mở (so theo tên thư mục), để Setting của project này không ghi nhầm sang project khác. Đổi tên thư mục project thì chọn lại thư mục.
- **Lưu lỗi**: trang hiện hộp thông báo lỗi; khi đó cả 2 thiệp giữ nguyên bản cũ (không có chuyện thiệp này đổi, thiệp kia không).
- **Firefox / Safari** không ghi file trực tiếp được. Bấm Lưu sẽ tải `config-setting.js` về, bạn chép đè vào `assets/js/`.

### Các phần trong Setting

| Phần | Nội dung |
|---|---|
| Thông tin chung | Tên chú rể, cô dâu; nhạc nền; tự cuộn trang |
| Nhà trai & nhà gái | Bật/tắt thiệp từng nhà, địa chỉ, link Google Maps, ảnh bản đồ, giờ tiệc (cỗ), giờ lễ, ngày đếm ngược, ngày hiển thị, tiêu đề lời mời, tài khoản mừng cưới + ảnh QR (nhà trai = chú rể, nhà gái = cô dâu) |
| Mẫu thiệp | Mặc định (hồng vàng) hoặc Cổ điển (nâu kem, bìa phong bì, hoa rơi, lịch tháng có ngày cưới) |
| Bìa | Dòng chữ, nút mở thiệp, ảnh bìa |
| Ảnh nền | Ảnh nền nội dung thiệp, ảnh trang trí khung trang chủ (wave). Để trống = ảnh mặc định |
| Trang chủ & đếm ngược | Lời giới thiệu, mô tả, bật/tắt đồng hồ |
| Ảnh cặp đôi & lời mời | Ảnh cặp đôi, khung lời mời |
| Buổi lễ | Tiêu đề phần lễ của 2 nhà |
| Album | Thêm/xóa/sắp xếp ảnh, hướng ảnh Dọc/Ngang/Vuông, số ảnh hiển thị (0 = tất cả) |
| Mừng cưới | Mô tả, ảnh minh họa (bật/tắt), hộp quà: tiêu đề khi mở, hiện tài khoản chú rể / cô dâu |
| RSVP | Bật/tắt form xác nhận tham dự |
| Lời cảm ơn | Tiêu đề, nội dung |

Mỗi phần hiển thị có checkbox **Hiển thị phần này**.

### Dùng chung hay tách riêng từng phần

Thông tin đám cưới (tên, nhà trai & nhà gái, tài khoản) luôn dùng chung. Các phần hiển thị (Mẫu thiệp, Bìa, Ảnh nền, Trang chủ, Ảnh cặp đôi, Buổi lễ, Album, Mừng cưới, RSVP, Lời cảm ơn) có checkbox **Dùng chung cho 2 thiệp** (mặc định bật):

- **Bật**: một bộ giá trị cho cả 2 thiệp.
- **Bỏ chọn**: phần đó tách thành 2 cột *Thiệp nhà trai* / *Thiệp nhà gái*, mỗi cột có giá trị và ô *Hiển thị phần này* riêng. Lần đầu tách, 2 cột bắt đầu bằng giá trị chung hiện tại. Bật lại thì dùng giá trị chung; giá trị riêng vẫn được giữ cho lần tách sau.
- Mỗi thiệp chỉ mang giá trị riêng của mình (thiệp nhà trai không chứa nội dung riêng của thiệp nhà gái và ngược lại).

Ví dụ: thiệp nhà trai mẫu Cổ điển, thiệp nhà gái mẫu Mặc định; hoặc mỗi thiệp một album riêng.

### Hộp quà mừng cưới (QR chuyển khoản)

1. Ở phần **Nhà trai & nhà gái**, nhập tài khoản mừng cưới của từng nhà: chủ tài khoản, ngân hàng, số tài khoản, ảnh mã QR (bấm *Tải ảnh lên…*).
2. Ở phần **Mừng cưới**, chọn *Hiện tài khoản chú rể* / *Hiện tài khoản cô dâu*.
   Muốn **thiệp nhà trai chỉ có QR chú rể, thiệp nhà gái chỉ có QR cô dâu**: bỏ chọn *Dùng chung cho 2 thiệp*, rồi ở cột nhà trai chỉ chọn tài khoản chú rể, cột nhà gái chỉ chọn tài khoản cô dâu.

Trên thiệp, khách bấm vào hộp quà, nắp bật lên và mở hộp thoại có mã QR, số tài khoản, nút *Sao chép STK* và *Lưu QR*. Tài khoản chưa có số tài khoản lẫn ảnh QR thì không hiện; thiệp không còn tài khoản nào thì ẩn hộp quà. Nhà đã tắt thiệp thì tài khoản của nhà đó cũng ẩn.

Quanh hộp quà có trang trí vẽ sẵn (hộp quà nhỏ nhiều màu, hoa lá, tim bay, sao lấp lánh, quầng sáng); di chuột / chạm vào thì các hộp nhỏ nhún lên. Màu hộp chính theo mẫu thiệp.

**Ảnh minh họa** cạnh hộp quà (mẫu Mặc định) là tùy chọn: bỏ chọn *Hiện ảnh minh họa bên cạnh hộp quà* (hoặc để trống ảnh) thì hộp quà nằm giữa khung. Mẫu Cổ điển không dùng ảnh minh họa.

Dữ liệu cũ (bản trước chỉ có 1 tài khoản ở phần Mừng cưới) được tự chuyển sang tài khoản chú rể khi mở Setting.

### Xuất / nhập dữ liệu (sao lưu đầy đủ)

- **Xuất dữ liệu**: tải 1 file `wedding-backup-YYYYMMDD.json` gồm toàn bộ nội dung Setting **và mọi ảnh/nhạc đang dùng** (ảnh bìa, ảnh nền, wave, ảnh cặp đôi, ảnh mừng cưới, ảnh QR, bản đồ, album, ảnh riêng của từng thiệp, nhạc nền). File có thể nặng vài chục MB vì chứa cả nhạc. Link `https://...` không được xuất kèm. File nào không tìm thấy sẽ được báo tên.
- **Nhập dữ liệu…**: chọn file sao lưu, trang chép lại ảnh/nhạc vào đúng đường dẫn cũ trong project (ghi đè file trùng tên, có hỏi xác nhận) rồi nạp dữ liệu. Bấm **Lưu** để cập nhật 2 thiệp.
- Nhập cũng nhận file `config-setting.js` của project khác (kể cả bản code cũ); khi đó chỉ có dữ liệu, ảnh/nhạc phải chép tay. Trường mới chưa có trong dữ liệu cũ sẽ lấy giá trị mặc định.
- Xuất/nhập kèm ảnh/nhạc cần Chrome/Edge và chọn thư mục gốc của project.

**Cập nhật code mới cho một bản copy cũ** (giữ nguyên nội dung thiệp của bản copy):

1. Chép code mới đè lên bản copy, **trừ** file `assets/js/config-setting.js` và các ảnh/nhạc của bản copy.
2. Mở `Setting/index.html` của bản copy, kiểm tra rồi bấm **Lưu** (để bổ sung trường mới vào dữ liệu nếu có).

Nếu lỡ ghi đè `config-setting.js`, dùng **Nhập dữ liệu…** với file `config-setting.js` cũ (lấy từ git hoặc bản sao lưu) rồi bấm Lưu.

### Tắt thiệp một nhà

Bỏ chọn **Bật thiệp của nhà này** trong phần Nhà trai & nhà gái (ví dụ chỉ dùng thiệp nhà gái):

- Link thiệp nhà đó (`Groom/` hoặc `Bride/`) chỉ hiện *"Thiệp chưa sẵn sàng"*; file `config-<nhà>.js` không còn dữ liệu.
- Trang chọn thiệp ẩn thiệp đó. Chỉ còn 1 thiệp thì tự chuyển thẳng tới thiệp còn lại.
- Thiệp nhà còn lại ẩn mọi thông tin của nhà đã tắt (lễ, địa chỉ, bản đồ, tài khoản mừng cưới).
- Thông tin nhà đã tắt vẫn nằm trong `config-setting.js` trên máy/trong git, nhưng **không được publish**: bản deploy để rỗng `config-setting.js`, không có trang Setting, ảnh bản đồ và ảnh QR của nhà đã tắt. Lưu ý repo GitHub công khai thì ai cũng đọc được file trong repo.

### Chỉ hiện lễ của nhà mình

Bỏ chọn **Hiện cả thông tin lễ của nhà kia** ở nhà nào thì thiệp nhà đó chỉ có lễ, địa chỉ, bản đồ của nhà mình; file thiệp không chứa thông tin nhà kia. Thiệp nhà kia vẫn được publish ở link riêng (`Groom/` hoặc `Bride/`), ai biết link vẫn mở được.

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

- Bản deploy tạo 2 thiệp đúng theo `config-setting.js` và không chứa dữ liệu gốc / trang Setting.
- Thứ tự tên và thứ tự nhà đúng theo từng thiệp.
- Sửa Setting thì cả 2 thiệp đổi theo.
- Phần dùng chung / tách riêng: mỗi thiệp lấy đúng giá trị của mình, không mang giá trị riêng của thiệp kia.
- Hộp quà chỉ mang tài khoản được chọn cho thiệp đó; ảnh QR không hiện ở thiệp nào thì không publish.
- Mẫu thiệp lạ thành mẫu Mặc định; dữ liệu 1 tài khoản của bản cũ chuyển sang tài khoản chú rể.
- Không còn đường dẫn `../`.

## Publish bằng GitHub Pages

Project deploy tự động bằng GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

1. **Một lần duy nhất**: trên GitHub, vào `Settings` → `Pages` → `Build and deployment` → `Source`, chọn **GitHub Actions**.
2. Mỗi lần cập nhật: lưu trong Setting, rồi commit và push lên `main`. Workflow sẽ:
   - chạy test code;
   - chạy `node scripts/build-site.js` tạo thư mục `_site`: 2 thiệp được tạo lại theo `config-setting.js`, nên mọi lựa chọn trong Setting (tắt thiệp, chỉ hiện lễ nhà mình...) tự áp dụng, không cần sửa tay file nào;
   - deploy `_site` lên GitHub Pages. `_site` có `config-setting.js` rỗng (không chứa dữ liệu) và **không có** trang `Setting/`, `tests/`, `scripts/`, ảnh bản đồ của nhà đã tắt thiệp và ảnh QR không hiện ở thiệp nào.

   Muốn xem trước đúng bản sẽ deploy: `node scripts/build-site.js` rồi mở `_site/index.html`.

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
| Workflow Actions báo lỗi ở bước Test | Lỗi code, không phải do nội dung Setting. Chạy `node tests/setting-model.test.js` để xem chi tiết |
| Ảnh không hiện | Kiểm tra ô ảnh trong Setting có viền đỏ không. Tên file có phân biệt hoa/thường trên GitHub Pages |
| Nhạc không phát | Trình duyệt chặn tự phát; khách bấm nút ♫. iPhone để chế độ im lặng cũng không phát |

## Ghi chú

- **Trang `Setting/`** chỉ dùng trên máy, không được publish.
- **RSVP** chỉ lưu trên trình duyệt của từng khách (localStorage), nên bạn không nhận được danh sách. Nếu cần tập trung, hãy dùng Google Forms, Formspree, Supabase hoặc Firebase.
- **Số tài khoản và ảnh QR** nhập cho hộp quà sẽ công khai trên thiệp và nằm trong lịch sử git.
