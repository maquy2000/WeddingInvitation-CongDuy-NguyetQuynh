// Tạo thông tin thiệp nhà trai / nhà gái từ dữ liệu gốc config-setting.js của trang Setting.
// Không đụng tới DOM để có thể test bằng node (tests/setting-model.test.js).
(function (root) {
  const SIDES = ["groom", "bride"];
  const ORIENTATIONS = ["portrait", "landscape", "square"];
  // Mẫu thiệp: default = hồng vàng (style.css), vintage = nâu kem, bìa phong bì (template-vintage.css).
  const TEMPLATES = ["default", "vintage"];
  const BACKUP_FORMAT = "wedding-setting-backup";

  // Các phần hiển thị (key = id phần trong trang Setting) và các trường của phần đó.
  // Mỗi phần dùng chung cho 2 thiệp, hoặc tách riêng (split[phần] = true): khi đó mỗi thiệp lấy giá trị riêng
  // ở cards.<nhà>["đường dẫn trường"]. Thông tin đám cưới (tên, nhà trai/nhà gái, tài khoản) luôn dùng chung.
  const DISPLAY_SECTIONS = {
    template: ["ui.template"],
    cover: ["text.coverEyebrow", "text.openButton", "images.cover"],
    backgrounds: ["images.background", "images.wave"],
    home: ["ui.sections.home", "text.heroEyebrow", "ui.blocks.countdown", "text.heroDescription"],
    story: ["ui.sections.story", "images.couple", "ui.sections.invitation", "text.invitationEyebrow", "text.invitationDescription"],
    event: ["ui.sections.event", "text.eventEyebrow", "text.eventTitle"],
    album: ["ui.sections.album", "text.albumEyebrow", "text.albumTitle", "ui.albumLimit", "album"],
    gift: ["ui.sections.gift", "text.giftEyebrow", "text.giftTitle", "text.giftDescription", "ui.blocks.giftImage", "images.gift",
      "text.bankTitle", "ui.giftAccounts.groom", "ui.giftAccounts.bride"],
    rsvp: ["ui.sections.rsvp"],
    thanks: ["ui.sections.thanks", "text.thanksTitle", "text.thanksMessage"]
  };
  const DISPLAY_PATHS = Object.values(DISPLAY_SECTIONS).flat();

  function defaultFamily(key) {
    return {
      enabled: true,
      // false = thiệp nhà này chỉ hiện lễ của nhà mình, không mang thông tin/vị trí nhà kia.
      showOtherFamily: true,
      label: key === "groom" ? "Nhà trai" : "Nhà gái",
      invitationTitle: "",
      dates: { weddingDate: "", coverDate: "", displayDate: "" },
      reception: { title: "", time: "" },
      ceremony: { title: "", time: "" },
      address: "",
      mapUrl: "",
      image: "",
      imageAlt: "",
      // Tài khoản mừng cưới của chú rể (nhà trai) / cô dâu (nhà gái), hiện trong hộp quà.
      bank: { bankName: "", accountOwner: "", accountNumber: "", qr: "" }
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
        template: TEMPLATES[0],
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
        // giftImage: ảnh minh họa cạnh hộp quà (mẫu Mặc định).
        blocks: { countdown: true, giftImage: true },
        // Hộp quà hiện tài khoản của ai.
        giftAccounts: { groom: true, bride: true }
      },
      album: [],
      families: { groom: defaultFamily("groom"), bride: defaultFamily("bride") },
      split: Object.fromEntries(Object.keys(DISPLAY_SECTIONS).map(id => [id, false])),
      cards: { groom: {}, bride: {} }
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

  function getIn(obj, path) {
    return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), obj);
  }

  function setIn(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    keys.reduce((target, key) => target[key], obj)[last] = value;
  }

  // orientation: "portrait" | "landscape" | "square", "" = thiệp tự đo theo ảnh.
  function normalizeAlbum(list) {
    return (Array.isArray(list) ? list : []).map(item => ({
      src: (item && item.src) || "",
      alt: (item && item.alt) || "",
      orientation: ORIENTATIONS.includes(item && item.orientation) ? item.orientation : ""
    }));
  }

  // Chuẩn hóa giá trị của 1 trường hiển thị theo kiểu của giá trị mặc định.
  function normalizeValue(path, value) {
    if (path === "album") return normalizeAlbum(value);
    const result = fill(getIn(defaultModel(), path), value);
    if (path === "ui.template" && !TEMPLATES.includes(result)) return TEMPLATES[0];
    return result;
  }

  // Giá trị riêng của 1 thiệp: chỉ giữ các trường hiển thị đã biết.
  function normalizeCard(card) {
    const result = {};
    if (!card || typeof card !== "object") return result;
    DISPLAY_PATHS.forEach(path => {
      if (card[path] !== undefined) result[path] = normalizeValue(path, card[path]);
    });
    return result;
  }

  // Dữ liệu đọc từ config-setting.js, bổ sung trường còn thiếu bằng giá trị mặc định.
  function normalizeModel(data) {
    const model = fill(defaultModel(), data);
    model.ui.template = normalizeValue("ui.template", model.ui.template);
    model.album = normalizeAlbum(model.album);
    // Bản cũ chỉ có 1 tài khoản mừng cưới (bank): chuyển sang tài khoản chú rể.
    const oldBank = data && data.bank;
    const groomBank = model.families.groom.bank;
    if (oldBank && typeof oldBank === "object" && !groomBank.bankName && !groomBank.accountOwner && !groomBank.accountNumber) {
      Object.assign(groomBank, fill({ bankName: "", accountOwner: "", accountNumber: "" }, oldBank));
    }
    const cards = data && data.cards;
    model.cards = Object.fromEntries(SIDES.map(side => [side, normalizeCard(cards && cards[side])]));
    return model;
  }

  // Dữ liệu hiển thị của 1 thiệp: phần nào tách riêng thì lấy giá trị riêng của thiệp đó.
  function cardModel(model, side) {
    const view = JSON.parse(JSON.stringify(model));
    Object.entries(DISPLAY_SECTIONS).forEach(([id, paths]) => {
      if (!view.split[id]) return;
      paths.forEach(path => {
        if (view.cards[side][path] !== undefined) setIn(view, path, view.cards[side][path]);
      });
    });
    return view;
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

  function giftFromFamily(key, model) {
    return {
      key,
      role: key === "groom" ? "Chú rể" : "Cô dâu",
      name: key === "groom" ? model.couple.groomName : model.couple.brideName,
      ...model.families[key].bank
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
  // showOtherFamily=false: thiệp nhà đó chỉ có lễ của nhà mình.
  // Phần hiển thị tách riêng: thiệp chỉ mang giá trị riêng của mình, không mang giá trị của thiệp kia.
  // Hộp quà chỉ mang tài khoản được chọn hiện ở thiệp này (và có số tài khoản hoặc ảnh QR).
  function buildConfig(model, side) {
    const other = side === "groom" ? "bride" : "groom";
    const own = model.families[side];
    if (!own.enabled) return { side, enabled: false };

    const view = cardModel(model, side);
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
      text: { ...view.text, invitationTitle: own.invitationTitle },
      images: view.images,
      ui: view.ui,
      events: (own.showOtherFamily ? [side, other] : [side])
        .filter(key => model.families[key].enabled)
        .map(key => eventFromFamily(key, model.families[key])),
      album: view.album,
      gifts: [side, other]
        .filter(key => model.families[key].enabled && view.ui.giftAccounts[key])
        .filter(key => model.families[key].bank.accountNumber || model.families[key].bank.qr)
        .map(key => giftFromFamily(key, model))
    };
  }

  function serializeConfig(config) {
    return "// File này được tạo khi deploy (scripts/build-site.js) từ dữ liệu Setting. Sửa bằng trang Setting, không sửa tay.\n"
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

  // Ảnh/nhạc trong project mà dữ liệu đang dùng (kể cả ảnh riêng của từng thiệp), để xuất kèm file sao lưu.
  function assetPaths(model) {
    const paths = [
      ...Object.values(model.images),
      model.music.src,
      ...SIDES.flatMap(side => [model.families[side].image, model.families[side].bank.qr]),
      ...model.album.map(item => item.src),
      ...SIDES.flatMap(side => Object.entries(model.cards[side])
        .flatMap(([path, value]) => (path === "album" ? value.map(item => item.src) : [value])))
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

  // Mỗi lần lưu chỉ ghi 1 file dữ liệu gốc. 2 thiệp tự tạo thông tin từ file này khi mở (config-groom.js / config-bride.js),
  // nên không bao giờ lệch nhau. Khi deploy, scripts/build-site.js mới tạo sẵn dữ liệu riêng cho từng thiệp.
  function configFiles(model) {
    return { "assets/js/config-setting.js": serializeSetting(model) };
  }

  const api = { SIDES, ORIENTATIONS, TEMPLATES, DISPLAY_SECTIONS, getIn, setIn, orientationOf, defaultModel, normalizeModel, cardModel,
    buildConfig, serializeConfig, serializeSetting, isProjectAsset, assetPaths, serializeBackup, parseSettingText, configFiles };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SettingModel = api;
})(typeof window !== "undefined" ? window : globalThis);
