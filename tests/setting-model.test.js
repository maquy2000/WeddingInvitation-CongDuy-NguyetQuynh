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

// Mỗi lần lưu chỉ ghi 1 file dữ liệu gốc.
const files = M.configFiles(model);
assert.deepStrictEqual(Object.keys(files), ["assets/js/config-setting.js"]);

// Trên máy, mỗi trang thiệp nạp config-setting.js + setting-model.js + config-<nhà>.js (đúng thứ tự trong HTML)
// và tự tạo thông tin thiệp từ Setting, nên 2 thiệp luôn theo cùng một Setting.
for (const side of M.SIDES) {
  const page = fs.readFileSync(path.join(root, side === "groom" ? "Groom/index.html" : "Bride/index.html"), "utf8");
  const scripts = [...page.matchAll(/<script src="\.\.\/([^"?]+)/g)].map(m => m[1]);
  assert.deepStrictEqual(scripts, ["assets/js/config-setting.js", "assets/js/setting-model.js", `assets/js/config-${side}.js`, "assets/js/app.js"]);
  const context = {};
  context.window = context;
  scripts.slice(0, 3).forEach(file => vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), context));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.WEDDING_CONFIG)), JSON.parse(JSON.stringify(M.buildConfig(model, side))),
    `thiệp ${side} không theo Setting`);
}

// Các kiểm tra dưới đây cần cả 2 thiệp bật và hiện cả 2 nhà, dù dữ liệu thật trên đĩa đang chọn thế nào.
model.families.groom.enabled = true;
model.families.bride.enabled = true;
model.families.groom.showOtherFamily = true;
model.families.bride.showOtherFamily = true;

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
off.families.groom.ceremony.title = "Lễ riêng nhà trai";
off.families.groom.image = "assets/images/rieng-nha-trai.png";
assert.deepStrictEqual(M.buildConfig(off, "groom"), { side: "groom", enabled: false });
const brideOnly = M.buildConfig(off, "bride");
assert.deepStrictEqual(brideOnly.events.map(e => e.key), ["bride"]);
assert.ok(!JSON.stringify(brideOnly).includes(off.families.groom.ceremony.title), "thiệp nhà gái còn thông tin lễ nhà trai");
assert.ok(!JSON.stringify(brideOnly).includes(off.families.groom.image), "thiệp nhà gái còn bản đồ nhà trai");

// Thiệp nhà trai chọn chỉ hiện lễ nhà mình: không mang thông tin/vị trí nhà gái; thiệp nhà gái vẫn hiện cả 2 nhà.
const own = M.normalizeModel(loadScript("assets/js/config-setting.js", "WEDDING_SETTING"));
own.families.groom.enabled = true;
own.families.bride.enabled = true;
own.families.groom.showOtherFamily = false;
own.families.bride.showOtherFamily = true;
own.families.bride.address = "Địa chỉ bí mật nhà gái";
const groomOwn = M.buildConfig(own, "groom");
assert.deepStrictEqual(groomOwn.events.map(e => e.key), ["groom"]);
assert.ok(!JSON.stringify(groomOwn).includes("Địa chỉ bí mật nhà gái"), "thiệp nhà trai còn địa chỉ nhà gái");
assert.ok(!JSON.stringify(groomOwn).includes(own.families.bride.mapUrl + '"'), "thiệp nhà trai còn link bản đồ nhà gái");
assert.deepStrictEqual(M.buildConfig(own, "bride").events.map(e => e.key), ["bride", "groom"]);

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
backupModel.families.groom.bank.qr = "assets/images/qr-chu-re.jpg";
backupModel.cards.bride["images.cover"] = "assets/images/bia-nha-gai.jpg";
backupModel.cards.groom.album = [{ src: "assets/images/album-nha-trai.jpg", alt: "", orientation: "" }];
const paths = M.assetPaths(backupModel);
for (const p of [backupModel.images.cover, backupModel.images.couple, "assets/images/bg.png", backupModel.music.src,
  backupModel.families.groom.image, backupModel.families.bride.image, ...backupModel.album.map(i => i.src),
  "assets/images/qr-chu-re.jpg", "assets/images/bia-nha-gai.jpg", "assets/images/album-nha-trai.jpg"]) {
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
assert.strictEqual(empty.families.groom.showOtherFamily, true, "mặc định thiệp hiện lễ cả 2 nhà");
assert.deepStrictEqual(empty.album, []);
assert.strictEqual(empty.ui.template, "default");
assert.strictEqual(empty.ui.blocks.giftImage, true, "mặc định hiện ảnh minh họa cạnh hộp quà");
assert.ok(Object.values(empty.split).every(split => split === false), "mặc định mọi phần dùng chung cho 2 thiệp");

// Mẫu thiệp: giá trị lạ thành mẫu mặc định.
assert.strictEqual(M.normalizeModel({ ui: { template: "khong-co" } }).ui.template, "default");
assert.strictEqual(M.normalizeModel({ ui: { template: "vintage" } }).ui.template, "vintage");

// Giá trị riêng của thiệp: chỉ giữ trường hiển thị đã biết, chuẩn hóa theo kiểu của trường.
const cardData = M.normalizeModel({ cards: { groom: {
  "text.coverEyebrow": 5, "khong.biet": "x", "ui.template": "la", "ui.sections.gift": 0,
  album: [{ src: "a.jpg", orientation: "nghieng" }]
} } });
assert.deepStrictEqual(cardData.cards.groom, {
  "text.coverEyebrow": "5", "ui.template": "default", "ui.sections.gift": false,
  album: [{ src: "a.jpg", alt: "", orientation: "" }]
});
assert.deepStrictEqual(cardData.cards.bride, {});

// Dùng chung / tách riêng từng phần hiển thị (bắt đầu từ mọi phần dùng chung, dù dữ liệu thật trên đĩa chọn thế nào).
const splitModel = model0();
splitModel.families.groom.enabled = true;
splitModel.families.bride.enabled = true;
splitModel.split = M.defaultModel().split;
splitModel.cards = { groom: {}, bride: {} };
splitModel.text.coverEyebrow = "Chung";
splitModel.cards.groom["text.coverEyebrow"] = "Riêng nhà trai";
splitModel.cards.bride["text.coverEyebrow"] = "Riêng nhà gái";
splitModel.cards.bride["ui.template"] = "vintage";
for (const side of M.SIDES) {
  assert.strictEqual(M.buildConfig(splitModel, side).text.coverEyebrow, "Chung", "phần dùng chung phải lấy giá trị chung");
}
splitModel.split.cover = true;
splitModel.split.template = true;
const groomSplit = M.buildConfig(splitModel, "groom");
const brideSplit = M.buildConfig(splitModel, "bride");
assert.strictEqual(groomSplit.text.coverEyebrow, "Riêng nhà trai");
assert.strictEqual(brideSplit.text.coverEyebrow, "Riêng nhà gái");
assert.ok(!JSON.stringify(groomSplit).includes("Riêng nhà gái"), "thiệp nhà trai mang giá trị riêng của thiệp nhà gái");
assert.strictEqual(groomSplit.ui.template, splitModel.ui.template, "thiệp chưa có giá trị riêng thì lấy giá trị chung");
assert.strictEqual(brideSplit.ui.template, "vintage");
assert.strictEqual(groomSplit.text.albumTitle, brideSplit.text.albumTitle, "phần không tách vẫn dùng chung");
assert.ok(!("cards" in groomSplit) && !("split" in groomSplit));
splitModel.split.album = true;
splitModel.cards.bride.album = [{ src: "assets/images/album-nha-gai.jpg", alt: "", orientation: "" }];
assert.deepStrictEqual(M.buildConfig(splitModel, "bride").album.map(item => item.src), ["assets/images/album-nha-gai.jpg"]);
assert.deepStrictEqual(M.buildConfig(splitModel, "groom").album, splitModel.album);

// Hộp quà: tài khoản nhà của thiệp đứng trước; tách riêng thì mỗi thiệp chỉ mang tài khoản được chọn.
const giftModel = model0();
giftModel.families.groom.enabled = true;
giftModel.families.bride.enabled = true;
giftModel.split.gift = false;
giftModel.ui.giftAccounts = { groom: true, bride: true };
giftModel.cards = { groom: {}, bride: {} };
giftModel.families.groom.bank = { bankName: "MB", accountOwner: "CHU RE", accountNumber: "111", qr: "assets/images/qr-chu-re.jpg" };
giftModel.families.bride.bank = { bankName: "VCB", accountOwner: "CO DAU", accountNumber: "222", qr: "assets/images/qr-co-dau.jpg" };
assert.deepStrictEqual(M.buildConfig(giftModel, "groom").gifts.map(gift => gift.key), ["groom", "bride"]);
assert.deepStrictEqual(M.buildConfig(giftModel, "bride").gifts.map(gift => gift.key), ["bride", "groom"]);
giftModel.split.gift = true;
giftModel.cards.groom["ui.giftAccounts.bride"] = false;
giftModel.cards.bride["ui.giftAccounts.groom"] = false;
giftModel.ui.blocks.giftImage = true;
giftModel.cards.groom["ui.blocks.giftImage"] = false;
const groomGift = M.buildConfig(giftModel, "groom");
assert.strictEqual(groomGift.ui.blocks.giftImage, false, "tắt ảnh minh họa riêng cho thiệp nhà trai");
assert.strictEqual(M.buildConfig(giftModel, "bride").ui.blocks.giftImage, true);
assert.deepStrictEqual(groomGift.gifts.map(gift => [gift.role, gift.accountNumber, gift.qr]), [["Chú rể", "111", "assets/images/qr-chu-re.jpg"]]);
assert.ok(!JSON.stringify(groomGift).includes("qr-co-dau"), "thiệp nhà trai còn QR cô dâu");
assert.deepStrictEqual(M.buildConfig(giftModel, "bride").gifts.map(gift => gift.key), ["bride"]);
giftModel.split.gift = false;
giftModel.families.bride.enabled = false;
assert.deepStrictEqual(M.buildConfig(giftModel, "groom").gifts.map(gift => gift.key), ["groom"], "nhà tắt thiệp không hiện tài khoản");
giftModel.families.bride.enabled = true;
giftModel.families.bride.bank = { bankName: "VCB", accountOwner: "CO DAU", accountNumber: "", qr: "" };
assert.deepStrictEqual(M.buildConfig(giftModel, "groom").gifts.map(gift => gift.key), ["groom"], "tài khoản chưa có STK/QR không hiện");

// Dữ liệu bản cũ chỉ có 1 tài khoản (bank): chuyển thành tài khoản chú rể.
const oldBank = M.normalizeModel({ bank: { bankName: "ACB", accountOwner: "A", accountNumber: "123" } });
assert.deepStrictEqual(oldBank.families.groom.bank, { bankName: "ACB", accountOwner: "A", accountNumber: "123", qr: "" });
assert.strictEqual(oldBank.families.bride.bank.accountNumber, "");

// Bản deploy: 2 thiệp tạo lại đúng theo Setting dù file trên đĩa có lệch; không có dữ liệu gốc, trang Setting,
// bản đồ của nhà đã tắt thiệp, ảnh QR không hiện ở thiệp nào.
const os = require("os");
const { build } = require("../scripts/build-site.js");
const site = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-site-"));
build(site);
const real = model0();
for (const side of M.SIDES) {
  const built = fs.readFileSync(path.join(site, `assets/js/config-${side}.js`), "utf8");
  assert.strictEqual(built, M.serializeConfig(M.buildConfig(real, side)), `bản deploy config-${side}.js không theo Setting`);
}
for (const p of ["index.html", "Groom/index.html", "Bride/index.html", "assets/js/app.js", "assets/css/style.css"]) {
  assert.ok(fs.existsSync(path.join(site, p)), `bản deploy thiếu ${p}`);
}
const builtSetting = fs.readFileSync(path.join(site, "assets/js/config-setting.js"), "utf8");
assert.ok(!builtSetting.includes("WEDDING_SETTING ="), "bản deploy không được chứa dữ liệu Setting");
for (const p of ["Setting", "tests", "scripts", ".git", ".github"]) {
  assert.ok(!fs.existsSync(path.join(site, p)), `bản deploy không được có ${p}`);
}
for (const side of M.SIDES) {
  const image = real.families[side].image;
  if (M.isProjectAsset(image) && fs.existsSync(path.join(root, image))) {
    assert.strictEqual(fs.existsSync(path.join(site, image)), real.families[side].enabled, `ảnh bản đồ ${side} publish sai theo bật/tắt thiệp`);
  }
  const qr = real.families[side].bank.qr;
  if (M.isProjectAsset(qr) && fs.existsSync(path.join(root, qr))) {
    const shown = M.SIDES.some(card => M.buildConfig(real, card).gifts?.some(gift => gift.qr === qr));
    assert.strictEqual(fs.existsSync(path.join(site, qr)), shown, `ảnh QR ${side} publish sai theo hộp quà`);
  }
}
fs.rmSync(site, { recursive: true, force: true });

console.log("OK - setting-model");
