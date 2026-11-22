// Thiệp nhà gái: tạo thông tin từ dữ liệu Setting (config-setting.js) mỗi lần mở thiệp. Không cần sửa file này.
// Khi deploy, file này được thay bằng dữ liệu tạo sẵn chỉ của thiệp nhà gái (scripts/build-site.js).
window.WEDDING_CONFIG = SettingModel.buildConfig(SettingModel.normalizeModel(window.WEDDING_SETTING), "bride");
