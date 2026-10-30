// Tạo 2 file config-groom.js / config-bride.js từ dữ liệu gốc config-setting.js của trang Setting.
// Không đụng tới DOM để có thể test bằng node (tests/setting-model.test.js).
(function (root) {
  const SIDES = ["groom", "bride"];
  const ORIENTATIONS = ["portrait", "landscape", "square"];
  const BACKUP_FORMAT = "wedding-setting-backup";

  function defaultFamily(key) {
    return {
      enabled: true,
      label: key === "groom" ? "Nhà trai" : "Nhà gái",
      invitationTitle: "",
      dates: { weddingDate: "", coverDate: "", displayDate: "" },
      reception: { title: "", time: "" },
      ceremony: { title: "", time: "" },
      address: "",
      mapUrl: "",
      image: "",
      imageAlt: ""
    };
  }

  function defaultModel() {
    return {
      couple: { groomName: "", brideName: "" },
      music: { enabled: true, src: "" },
      text: {
        coverEyebrow: "",
        openButton: "",
        heroEyebrow: "",
        heroDescription: "",
        invitationEyebrow: "",
        invitationDescription: "",
        eventEyebrow: "",
        eventTitle: "",
        albumEyebrow: "",
        albumTitle: "",
        giftEyebrow: "",
        giftTitle: "",
        giftDescription: "",
        bankTitle: "",
        thanksTitle: "",
        thanksMessage: ""
      },
      // background / wave để trống = dùng ảnh mặc định trong style.css.
      images: { cover: "", couple: "", gift: "", background: "", wave: "" },
      ui: {
        autoScroll: true,
        albumLimit: 0,
        sections: {
          home: true,
          story: true,
          invitation: true,
          event: true,
          album: true,
          gift: true,
          rsvp: false,
          thanks: true
        },
        blocks: { countdown: true, bankInfo: true }
      },
      album: [],
      bank: { bankName: "", accountOwner: "", accountNumber: "" },
      families: { groom: defaultFamily("groom"), bride: defaultFamily("bride") }
    };
  }

  // Chỉ lấy các key có trong khuôn mẫu, để model luôn đủ trường và không mang theo trường lạ.
  function fill(template, value) {
    if (Array.isArray(template)) return Array.isArray(value) ? value : template;
    if (template && typeof template === "object") {
      const result = {};
      const source = value && typeof value === "object" ? value : {};
      Object.keys(template).forEach(key => {
        result[key] = fill(template[key], source[key]);
      });
      return result;
    }
    if (value === undefined || value === null) return template;
    if (typeof template === "number") return Number(value) || 0;
    if (typeof template === "boolean") return Boolean(value);
    return String(value);
  }

  // Dữ liệu đọc từ config-setting.js, bổ sung trường còn thiếu bằng giá trị mặc định.
  function normalizeModel(data) {
    const model = fill(defaultModel(), data);
    // orientation: "portrait" | "landscape" | "square", "" = thiệp tự đo theo ảnh.
    model.album = model.album.map(item => ({
      src: (item && item.src) || "",
      alt: (item && item.alt) || "",
      orientation: ORIENTATIONS.includes(item && item.orientation) ? item.orientation : ""
    }));
    return model;
  }

  function eventFromFamily(key, family) {
    return {
      key,
      label: family.label,
      ceremony: { ...family.ceremony },
      reception: { ...family.reception },
      address: family.address,
      mapUrl: family.mapUrl,
      image: family.image,
      imageAlt: family.imageAlt
    };
  }

  // Nhận diện hướng ảnh theo kích thước thật. Gần vuông (lệch dưới 10%) tính là vuông.
  function orientationOf(width, height) {
    if (!width || !height) return "";
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return "square";
    return ratio > 1 ? "landscape" : "portrait";
  }

  // Thiệp nhà nào thì tên và thông tin nhà đó đứng trước.
  // Nhà nào tắt thiệp: thiệp đó chỉ còn cờ enabled=false (không mang dữ liệu), thiệp còn lại ẩn thông tin nhà đó.
  function buildConfig(model, side) {
    const other = side === "groom" ? "bride" : "groom";
    const own = model.families[side];
    if (!own.enabled) return { side, enabled: false };

    const names = side === "groom"
      ? [model.couple.groomName, model.couple.brideName]
      : [model.couple.brideName, model.couple.groomName];
    const coupleText = names.join(" & ");

    return {
      side,
      siteTitle: `Thiệp Cưới - ${coupleText}`,
      description: `Thiệp cưới online của ${coupleText}.`,
      couple: { ...model.couple },
      dates: { ...own.dates },
      music: { ...model.music },
      text: { ...model.text, invitationTitle: own.invitationTitle },
      images: { ...model.images },
      ui: {
        ...model.ui,
        sections: { ...model.ui.sections },
        blocks: { ...model.ui.blocks }
      },
      events: [side, other]
        .filter(key => model.families[key].enabled)
        .map(key => eventFromFamily(key, model.families[key])),
      album: model.album.map(item => ({ src: item.src, alt: item.alt, orientation: item.orientation })),
      bank: { ...model.bank }
    };
  }

  function serializeConfig(config) {
    return "// File này được tạo bởi Setting/index.html. Nên sửa bằng trang Setting thay vì sửa tay.\n"
      + "// Mọi đường dẫn ảnh/nhạc tính từ thư mục gốc của project, ví dụ: assets/images/abc.jpg\n"
      + "window.WEDDING_CONFIG = " + JSON.stringify(config, null, 2) + ";\n";
  }

  function serializeSetting(model) {
    return "// Dữ liệu gốc của trang Setting. Khi bấm Lưu, config-groom.js và config-bride.js được tạo lại từ file này.\n"
      + "window.WEDDING_SETTING = " + JSON.stringify(model, null, 2) + ";\n";
  }

  // File trong project (assets/...), không phải link ngoài, không thoát ra ngoài thư mục project.
  function isProjectAsset(path) {
    return typeof path === "string" && /^assets\//.test(path) && !path.split("/").includes("..");
  }

  // Ảnh/nhạc trong project mà dữ liệu đang dùng, để xuất kèm file sao lưu.
  function assetPaths(model) {
    const paths = [
      ...Object.values(model.images),
      model.music.src,
      ...SIDES.map(side => model.families[side].image),
      ...model.album.map(item => item.src)
    ];
    return [...new Set(paths.filter(isProjectAsset))];
  }

  // File sao lưu: dữ liệu Setting + ảnh/nhạc đang dùng (dạng data URL, key là đường dẫn trong project).
  function serializeBackup(model, files) {
    return JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), setting: model, files });
  }

  // Đọc file sao lưu (.json), file .json xuất từ bản trước (chỉ có dữ liệu) hoặc config-setting.js (kể cả của bản cũ).
  // Trả về { model, files }; file không đúng định dạng thì báo lỗi.
  function parseSettingText(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    let data;
    try {
      data = JSON.parse(text.slice(start, end + 1));
    } catch {
      data = null;
    }
    const isBackup = Boolean(data) && data.format === BACKUP_FORMAT;
    const setting = isBackup ? data.setting : data;
    if (start < 0 || !setting || typeof setting !== "object" || !setting.couple || !setting.families) {
      throw new Error("File không phải dữ liệu Setting (cần file .json đã xuất hoặc config-setting.js).");
    }
    const files = {};
    if (isBackup && data.files && typeof data.files === "object") {
      Object.entries(data.files).forEach(([path, content]) => {
        if (isProjectAsset(path) && typeof content === "string" && content.startsWith("data:")) files[path] = content;
      });
    }
    return { model: normalizeModel(setting), files };
  }

  // 3 file được ghi mỗi lần lưu: dữ liệu gốc + 2 thiệp.
  function configFiles(model) {
    const files = { "assets/js/config-setting.js": serializeSetting(model) };
    SIDES.forEach(side => {
      files[`assets/js/config-${side}.js`] = serializeConfig(buildConfig(model, side));
    });
    return files;
  }

  const api = { SIDES, ORIENTATIONS, orientationOf, defaultModel, normalizeModel, buildConfig, serializeConfig, serializeSetting, isProjectAsset, assetPaths, serializeBackup, parseSettingText, configFiles };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SettingModel = api;
})(typeof window !== "undefined" ? window : globalThis);
