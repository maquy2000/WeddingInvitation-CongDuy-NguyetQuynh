// Chạy: node tests/setting-model.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const M = require("../assets/js/setting-model.js");

const root = path.join(__dirname, "..");

function loadScript(file, name) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return context.window[name];
}

// Qua JSON để object tạo trong vm có cùng prototype với object thường (deepStrictEqual so cả prototype).
const model0 = () => JSON.parse(JSON.stringify(M.normalizeModel(loadScript("assets/js/config-setting.js", "WEDDING_SETTING"))));
const model = model0();

// 2 file thiệp trên đĩa phải đúng là bản được tạo từ config-setting.js (và lưu lại setting không đổi gì).
const files = M.configFiles(model);
assert.deepStrictEqual(Object.keys(files).sort(), [
  "assets/js/config-bride.js",
  "assets/js/config-groom.js",
  "assets/js/config-setting.js"
]);
for (const [file, content] of Object.entries(files)) {
  const current = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
  assert.strictEqual(content, current, `${file} chưa đồng bộ với config-setting.js`);
}

// Các kiểm tra dưới đây cần cả 2 thiệp bật, dù dữ liệu thật trên đĩa có đang tắt thiệp nào.
model.families.groom.enabled = true;
model.families.bride.enabled = true;

// Thiệp nhà nào thì tên + thông tin nhà đó đứng trước.
const g = M.buildConfig(model, "groom");
const b = M.buildConfig(model, "bride");
assert.strictEqual(g.side, "groom");
assert.deepStrictEqual(g.events.map(e => e.key), ["groom", "bride"]);
assert.deepStrictEqual(b.events.map(e => e.key), ["bride", "groom"]);
assert.ok(g.siteTitle.endsWith(`${model.couple.groomName} & ${model.couple.brideName}`));
assert.ok(b.siteTitle.endsWith(`${model.couple.brideName} & ${model.couple.groomName}`));
assert.strictEqual(g.text.invitationTitle, model.families.groom.invitationTitle);
assert.strictEqual(b.dates.weddingDate, model.families.bride.dates.weddingDate);

// Sửa ở Setting một lần, cả hai thiệp đổi theo.
model.text.albumTitle = "Album mới";
model.families.bride.address = "Địa chỉ mới";
for (const side of M.SIDES) {
  const config = M.buildConfig(model, side);
  assert.strictEqual(config.text.albumTitle, "Album mới");
  assert.strictEqual(config.events.find(e => e.key === "bride").address, "Địa chỉ mới");
}

// Tắt thiệp nhà trai: thiệp nhà trai không mang dữ liệu, thiệp nhà gái ẩn thông tin nhà trai.
const off = M.normalizeModel(loadScript("assets/js/config-setting.js", "WEDDING_SETTING"));
off.families.groom.enabled = false;
off.families.bride.enabled = true;
assert.deepStrictEqual(M.buildConfig(off, "groom"), { side: "groom", enabled: false });
const brideOnly = M.buildConfig(off, "bride");
assert.deepStrictEqual(brideOnly.events.map(e => e.key), ["bride"]);
assert.ok(!JSON.stringify(brideOnly).includes(off.families.groom.ceremony.title), "thiệp nhà gái còn thông tin lễ nhà trai");
assert.ok(!JSON.stringify(brideOnly).includes(off.families.groom.image), "thiệp nhà gái còn bản đồ nhà trai");

// Hướng ảnh album: giữ giá trị hợp lệ, giá trị lạ/thiếu thành "" (thiệp tự đo).
const albumModel = M.normalizeModel({ album: [
  { src: "a.jpg", orientation: "landscape" },
  { src: "b.jpg", orientation: "nghieng" },
  { src: "c.jpg" }
] });
assert.deepStrictEqual(albumModel.album.map(i => i.orientation), ["landscape", "", ""]);
assert.strictEqual(M.buildConfig(albumModel, "bride").album[0].orientation, "landscape");
assert.strictEqual(M.orientationOf(1200, 1800), "portrait");
assert.strictEqual(M.orientationOf(1800, 1200), "landscape");
assert.strictEqual(M.orientationOf(1000, 1050), "square");
assert.strictEqual(M.orientationOf(0, 0), "");

// Nhập dữ liệu: đọc được cả file .json đã xuất lẫn file config-setting.js, file lạ thì báo lỗi.
const settingText = fs.readFileSync(path.join(root, "assets/js/config-setting.js"), "utf8");
assert.deepStrictEqual(M.parseSettingText(settingText), { model: model0(), files: {} });
assert.deepStrictEqual(M.parseSettingText(JSON.stringify(model0(), null, 2)), { model: model0(), files: {} });
const oldFormat = JSON.parse(JSON.stringify(model0()));
delete oldFormat.families.groom.enabled;
oldFormat.album.forEach(item => delete item.orientation);
const upgraded = M.parseSettingText(JSON.stringify(oldFormat)).model;
assert.strictEqual(upgraded.families.groom.enabled, true, "dữ liệu bản cũ phải được bổ sung trường mới");
assert.ok(upgraded.album.every(item => item.orientation === ""));
assert.throws(() => M.parseSettingText("không phải json"));
assert.throws(() => M.parseSettingText(JSON.stringify({ foo: 1 })));

// File sao lưu: liệt kê đủ ảnh/nhạc đang dùng, nhập lại được cả dữ liệu lẫn file, bỏ đường dẫn ra ngoài project.
const backupModel = model0();
backupModel.images.background = "assets/images/bg.png";
backupModel.images.wave = "https://example.com/wave.png";
const paths = M.assetPaths(backupModel);
for (const p of [backupModel.images.cover, backupModel.images.couple, "assets/images/bg.png", backupModel.music.src,
  backupModel.families.groom.image, backupModel.families.bride.image, ...backupModel.album.map(i => i.src)]) {
  assert.ok(paths.includes(p), `thiếu ${p} trong danh sách xuất`);
}
assert.ok(!paths.includes("https://example.com/wave.png"), "link ngoài không cần xuất");
assert.strictEqual(new Set(paths).size, paths.length);
const backupFiles = { "assets/images/bg.png": "data:image/png;base64,AAAA", "../evil.js": "data:text/plain;base64,AA", "assets/../x": "data:,x" };
const restored = M.parseSettingText(M.serializeBackup(backupModel, backupFiles));
assert.deepStrictEqual(restored.model, JSON.parse(JSON.stringify(M.normalizeModel(backupModel))));
assert.deepStrictEqual(restored.files, { "assets/images/bg.png": "data:image/png;base64,AAAA" });

// Đường dẫn trong config phải tính từ thư mục gốc, không có "../".
assert.ok(!Object.values(files).join("").includes("../"), "config còn đường dẫn ../");

// Setting rỗng/thiếu trường vẫn đủ trường.
const empty = M.normalizeModel(undefined);
assert.strictEqual(empty.ui.sections.home, true);
assert.strictEqual(empty.families.bride.label, "Nhà gái");
assert.strictEqual(empty.families.groom.enabled, true, "mặc định thiệp phải bật");
assert.deepStrictEqual(empty.album, []);

console.log("OK - setting-model");
