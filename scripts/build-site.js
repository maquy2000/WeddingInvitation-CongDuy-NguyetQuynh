// Tạo thư mục web để deploy từ dữ liệu Setting (config-setting.js). Chạy: node scripts/build-site.js [thư mục ra, mặc định _site]
// - 2 thiệp luôn được tạo lại theo Setting, nên lựa chọn trong Setting (tắt thiệp, ẩn nhà kia...) tự áp dụng khi deploy.
// - Không publish dữ liệu gốc (chứa thông tin cả 2 nhà), trang Setting, và ảnh bản đồ của nhà đã tắt thiệp.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const M = require("../assets/js/setting-model.js");

const root = path.join(__dirname, "..");
const SKIP = new Set([".git", ".github", ".claude", "_site", "docs", "scripts", "tests", "Setting", "README.md", ".gitignore",
  "assets/js/config-setting.js", "assets/js/setting.js", "assets/js/setting-model.js"]);

function build(outDir) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/config-setting.js"), "utf8"), context);
  const model = M.normalizeModel(JSON.parse(JSON.stringify(context.window.WEDDING_SETTING)));
  const configs = M.SIDES.map(side => M.buildConfig(model, side));

  // Ảnh bản đồ không còn thiệp nào dùng (nhà đã tắt thiệp) thì không publish.
  const used = JSON.stringify(configs);
  M.SIDES.map(side => model.families[side].image)
    .filter(image => image && !used.includes(JSON.stringify(image)))
    .forEach(image => SKIP.add(image));

  fs.rmSync(outDir, { recursive: true, force: true });
  const keep = src => !SKIP.has(path.relative(root, src).split(path.sep).join("/"));
  // Chép từng mục ở thư mục gốc (cpSync không cho chép cả thư mục gốc vào _site nằm bên trong nó).
  fs.readdirSync(root).map(name => path.join(root, name)).filter(keep).forEach(src => {
    fs.cpSync(src, path.join(outDir, path.basename(src)), { recursive: true, filter: keep });
  });
  configs.forEach(config => {
    fs.writeFileSync(path.join(outDir, `assets/js/config-${config.side}.js`), M.serializeConfig(config));
  });
}

if (require.main === module) {
  const outDir = path.resolve(process.argv[2] || path.join(root, "_site"));
  build(outDir);
  console.log(`OK - build-site -> ${outDir}`);
}

module.exports = { build };
