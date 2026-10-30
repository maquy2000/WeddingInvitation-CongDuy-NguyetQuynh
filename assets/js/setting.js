// Trang Setting: đọc dữ liệu gốc assets/js/config-setting.js, khi lưu ghi lại file đó và tạo lại config-groom.js, config-bride.js.
// Ghi file trực tiếp cần File System Access API (Chrome/Edge). Trình duyệt khác sẽ tải 3 file về.
const ROOT_URL = new URL("../../", document.currentScript.src);
const IMAGE_DIR = "assets/images";
const AUDIO_DIR = "assets/audio";
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
const AUDIO_EXT = /\.(mp3|m4a|ogg|wav|aac)$/i;

let model = SettingModel.defaultModel();
let rootDir = null;
let dirty = false;

const familyFields = [
  { path: "enabled", label: "Bật thiệp của nhà này", type: "checkbox", wide: true },
  { path: "label", label: "Tên hiển thị (badge)" },
  { path: "invitationTitle", label: "Tiêu đề khung lời mời", hint: "Ví dụ: Tiệc cưới tại nhà trai" },
  { path: "dates.weddingDate", label: "Ngày giờ đếm ngược (giờ VN)", type: "datetime" },
  { path: "dates.coverDate", label: "Ngày hiển thị ở bìa" },
  { path: "dates.displayDate", label: "Ngày hiển thị ngắn (trang chủ)" },
  { path: "reception.title", label: "Tiêu đề tiệc cưới (cỗ)" },
  { path: "reception.time", label: "Thời gian tiệc cưới (cỗ)" },
  { path: "ceremony.title", label: "Tiêu đề lễ" },
  { path: "ceremony.time", label: "Thời gian lễ" },
  { path: "address", label: "Địa chỉ", type: "textarea", wide: true },
  { path: "mapUrl", label: "Link Google Maps", wide: true },
  { path: "image", label: "Ảnh bản đồ", type: "image", wide: true },
  { path: "imageAlt", label: "Mô tả ảnh bản đồ (alt)", wide: true }
];

const sections = [
  {
    id: "general",
    title: "Thông tin chung",
    note: "Thiệp nhà trai: tên chú rể đứng trước. Thiệp nhà gái: tên cô dâu đứng trước. Tiêu đề trang tự tạo theo thứ tự này.",
    fields: [
      { path: "couple.groomName", label: "Tên chú rể" },
      { path: "couple.brideName", label: "Tên cô dâu" },
      { path: "music.enabled", label: "Bật nhạc nền", type: "checkbox" },
      { path: "ui.autoScroll", label: "Tự cuộn trang sau khi mở thiệp", type: "checkbox" },
      { path: "music.src", label: "File nhạc", type: "audio", wide: true }
    ]
  },
  {
    id: "families",
    title: "Thông tin nhà trai & nhà gái",
    note: "Tắt thiệp một nhà: link thiệp đó chỉ hiện \"Thiệp chưa sẵn sàng\", trang chọn thiệp ẩn thiệp đó, thiệp nhà còn lại ẩn mọi thông tin của nhà này (lễ, địa chỉ, bản đồ).",
    custom: renderFamilies
  },
  {
    id: "cover",
    title: "Màn hình bìa",
    fields: [
      { path: "text.coverEyebrow", label: "Dòng chữ trên tên" },
      { path: "text.openButton", label: "Chữ trên nút mở thiệp" },
      { path: "images.cover", label: "Ảnh bìa", type: "image", wide: true }
    ]
  },
  {
    id: "backgrounds",
    title: "Ảnh nền",
    note: "Để trống = dùng ảnh mặc định. Áp dụng cho cả 2 thiệp và trang chọn thiệp.",
    fields: [
      { path: "images.background", label: "Ảnh nền nội dung thiệp (sau khi mở thiệp)", type: "image", wide: true },
      { path: "images.wave", label: "Ảnh trang trí khung trang chủ (wave)", type: "image", wide: true }
    ]
  },
  {
    id: "home",
    title: "Trang chủ & đếm ngược",
    toggle: "ui.sections.home",
    fields: [
      { path: "text.heroEyebrow", label: "Dòng giới thiệu" },
      { path: "ui.blocks.countdown", label: "Hiện đồng hồ đếm ngược", type: "checkbox" },
      { path: "text.heroDescription", label: "Mô tả (hiện ở bìa và trang chủ)", type: "textarea", wide: true }
    ]
  },
  {
    id: "story",
    title: "Ảnh cặp đôi & lời mời",
    toggle: "ui.sections.story",
    fields: [
      { path: "images.couple", label: "Ảnh cặp đôi", type: "image", wide: true },
      { path: "ui.sections.invitation", label: "Hiện khung lời mời (tiệc cưới + địa điểm)", type: "checkbox", wide: true },
      { path: "text.invitationEyebrow", label: "Dòng chữ nhỏ" },
      { path: "text.invitationDescription", label: "Lời mời", type: "textarea", wide: true }
    ]
  },
  {
    id: "event",
    title: "Thông tin buổi lễ",
    toggle: "ui.sections.event",
    note: "Hiện lễ của cả 2 nhà (nhà nào tắt thiệp thì ẩn), nhà của thiệp đứng trước. Thời gian lễ sửa ở phần Thông tin nhà trai & nhà gái.",
    fields: [
      { path: "text.eventEyebrow", label: "Dòng chữ nhỏ" },
      { path: "text.eventTitle", label: "Tiêu đề" }
    ]
  },
  {
    id: "album",
    title: "Album ảnh",
    toggle: "ui.sections.album",
    note: "Mỗi ảnh chọn hướng Dọc / Ngang / Vuông để thiệp xếp khung đúng tỉ lệ. Khi chọn hoặc tải ảnh, hướng được tự nhận diện, bạn vẫn sửa lại được. \"Tự động\" = thiệp tự đo theo ảnh.",
    fields: [
      { path: "text.albumEyebrow", label: "Dòng chữ nhỏ" },
      { path: "text.albumTitle", label: "Tiêu đề" },
      { path: "ui.albumLimit", label: "Số ảnh hiển thị (0 = tất cả)", type: "number" }
    ],
    custom: renderAlbum
  },
  {
    id: "gift",
    title: "Mừng cưới",
    toggle: "ui.sections.gift",
    fields: [
      { path: "text.giftEyebrow", label: "Dòng chữ nhỏ" },
      { path: "text.giftTitle", label: "Tiêu đề" },
      { path: "text.giftDescription", label: "Mô tả", type: "textarea", wide: true },
      { path: "images.gift", label: "Ảnh minh họa", type: "image", wide: true },
      { path: "ui.blocks.bankInfo", label: "Hiện thông tin ngân hàng", type: "checkbox", wide: true },
      { path: "text.bankTitle", label: "Tiêu đề khung ngân hàng" },
      { path: "bank.bankName", label: "Ngân hàng" },
      { path: "bank.accountOwner", label: "Chủ tài khoản" },
      { path: "bank.accountNumber", label: "Số tài khoản" }
    ]
  },
  {
    id: "rsvp",
    title: "Xác nhận tham dự (RSVP)",
    toggle: "ui.sections.rsvp",
    note: "RSVP chỉ lưu trên trình duyệt của từng khách (localStorage), bạn không nhận được danh sách. Nên để tắt nếu chưa nối với Google Forms/Formspree."
  },
  {
    id: "thanks",
    title: "Lời cảm ơn",
    toggle: "ui.sections.thanks",
    fields: [
      { path: "text.thanksTitle", label: "Tiêu đề" },
      { path: "text.thanksMessage", label: "Nội dung", type: "textarea", wide: true }
    ]
  }
];

// ---------- Tiện ích ----------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  [].concat(children).forEach(child => {
    if (child) node.append(child);
  });
  return node;
}

function getPath(path) {
  return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), model);
}

function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  keys.reduce((obj, key) => obj[key], model)[last] = value;
  markDirty();
}

function assetUrl(path) {
  if (!path) return "";
  if (/^([a-z]+:|\/\/|\/)/i.test(path)) return path;
  return new URL(path, ROOT_URL).href;
}

function setStatus(message, type = "") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = type;
}

function markDirty() {
  dirty = true;
  setStatus("Có thay đổi chưa lưu.");
}

// Config lưu dạng 2026-12-19T17:00:00+07:00, input datetime-local cần 2026-12-19T17:00.
function toLocalInput(iso) {
  return iso ? iso.slice(0, 16) : "";
}

function fromLocalInput(value) {
  return value ? `${value}:00+07:00` : "";
}

// ---------- Truy cập thư mục project ----------

async function getDir(path, create = false) {
  let dir = rootDir;
  for (const part of path.split("/").filter(Boolean)) {
    dir = await dir.getDirectoryHandle(part, { create });
  }
  return dir;
}

async function fileExists(dirPath, name) {
  try {
    await (await getDir(dirPath)).getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(path, data) {
  const parts = path.split("/");
  const name = parts.pop();
  const dir = await getDir(parts.join("/"), true);
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function listFiles(dirPath, pattern) {
  const result = [];
  async function walk(dir, prefix) {
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === "directory") await walk(handle, `${prefix}/${name}`);
      else if (pattern.test(name)) result.push(`${prefix}/${name}`);
    }
  }
  try {
    await walk(await getDir(dirPath), dirPath);
  } catch {
    // Thư mục chưa tồn tại.
  }
  return result.sort();
}

async function refreshFileLists() {
  if (!rootDir) return;
  const fillList = (id, files) => {
    document.getElementById(id).replaceChildren(...files.map(value => el("option", { value })));
  };
  fillList("imageFiles", await listFiles(IMAGE_DIR, IMAGE_EXT));
  fillList("audioFiles", await listFiles(AUDIO_DIR, AUDIO_EXT));
}

// Trình duyệt không cho web tự ghi vào một đường dẫn cố định, nên phải chọn thư mục gốc 1 lần.
// Thư mục đã chọn được nhớ trong IndexedDB, các lần sau chỉ cần trình duyệt xác nhận quyền.
let savedDir = null;

function handleStore(mode, action) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("wedding-setting", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("handles");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction("handles", mode);
      const request = action(tx.objectStore("handles"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function connectFolder(dir) {
  rootDir = dir;
  savedDir = dir;
  document.getElementById("pickFolder").textContent = `Thư mục: ${dir.name}`;
  handleStore("readwrite", store => store.put(dir, "root")).catch(() => {});
  await refreshFileLists();
  setStatus(`Đã kết nối thư mục "${dir.name}". Có thể thêm ảnh và lưu trực tiếp.`, "ok");
}

async function pickFolder() {
  if (!window.showDirectoryPicker) {
    alert("Trình duyệt này không hỗ trợ ghi file trực tiếp. Hãy dùng Chrome hoặc Edge, hoặc bấm Lưu để tải 3 file config về rồi chép vào assets/js/.");
    return false;
  }
  let dir;
  try {
    dir = await window.showDirectoryPicker({ id: "wedding-project", mode: "readwrite", startIn: savedDir || "desktop" });
  } catch {
    return false; // Người dùng bấm hủy.
  }
  try {
    await (await (await dir.getDirectoryHandle("assets")).getDirectoryHandle("js")).getFileHandle("app.js");
  } catch {
    alert("Thư mục chưa đúng. Hãy chọn thư mục gốc của project (thư mục chứa index.html, Groom, Bride, Setting, assets).");
    return false;
  }
  await connectFolder(dir);
  return true;
}

// Dùng thư mục đã nhớ nếu có (chỉ hỏi quyền), nếu không thì mở hộp chọn thư mục.
async function ensureFolder() {
  if (rootDir) return true;
  if (savedDir) {
    try {
      if (await savedDir.requestPermission({ mode: "readwrite" }) === "granted") {
        await connectFolder(savedDir);
        return true;
      }
    } catch {
      // Thư mục đã bị xóa/di chuyển: chọn lại.
    }
  }
  return pickFolder();
}

async function restoreFolder() {
  if (!window.showDirectoryPicker) return;
  try {
    savedDir = await handleStore("readonly", store => store.get("root"));
  } catch {
    savedDir = null;
  }
  if (!savedDir) return;
  try {
    if (await savedDir.queryPermission({ mode: "readwrite" }) === "granted") {
      await connectFolder(savedDir);
      return;
    }
  } catch {
    // Bỏ qua, sẽ hỏi lại khi lưu.
  }
  document.getElementById("pickFolder").textContent = `Thư mục: ${savedDir.name} (cần xác nhận)`;
}

// Chép file người dùng chọn vào project, trả về đường dẫn tính từ thư mục gốc.
async function uploadFile(file, dirPath) {
  if (!(await ensureFolder())) return null;

  const safeName = file.name.replace(/[\\/:*?"<>|]/g, "_");
  const dot = safeName.lastIndexOf(".");
  const base = dot > 0 ? safeName.slice(0, dot) : safeName;
  const ext = dot > 0 ? safeName.slice(dot) : "";
  let name = safeName;
  for (let i = 1; await fileExists(dirPath, name); i += 1) {
    name = `${base}-${i}${ext}`;
  }

  await writeFile(`${dirPath}/${name}`, file);
  await refreshFileLists();
  return `${dirPath}/${name}`;
}

function detectOrientation(path) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(SettingModel.orientationOf(img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve("");
    img.src = assetUrl(path);
  });
}

function chooseFiles(accept, multiple) {
  return new Promise(resolve => {
    const input = el("input", { type: "file", accept, multiple });
    input.addEventListener("change", () => resolve([...input.files]));
    input.click();
  });
}

// ---------- Render form ----------

function renderThumb(img, path) {
  img.classList.remove("missing");
  img.onerror = () => img.classList.add("missing");
  img.src = assetUrl(path);
  img.title = path ? "" : "Chưa chọn ảnh";
}

function filePicker(value, onChange, kind) {
  const isImage = kind === "image";
  const input = el("input", {
    type: "text",
    value: value || "",
    placeholder: isImage ? `${IMAGE_DIR}/ten-anh.jpg` : `${AUDIO_DIR}/ten-nhac.mp3`
  });
  input.setAttribute("list", isImage ? "imageFiles" : "audioFiles");
  const thumb = isImage ? el("img", { class: "thumb", alt: "" }) : null;
  if (thumb) renderThumb(thumb, value);

  input.addEventListener("input", () => {
    onChange(input.value.trim());
    if (thumb) renderThumb(thumb, input.value.trim());
  });

  const upload = el("button", { type: "button", textContent: isImage ? "Tải ảnh lên…" : "Tải nhạc lên…" });
  upload.addEventListener("click", async () => {
    const [file] = await chooseFiles(isImage ? "image/*" : "audio/*", false);
    if (!file) return;
    const path = await uploadFile(file, isImage ? IMAGE_DIR : AUDIO_DIR);
    if (!path) return;
    input.value = path;
    input.dispatchEvent(new Event("input"));
  });

  return el("div", { class: "picker" }, [thumb, input, upload]);
}

function fieldEl(field, prefix = "") {
  const path = prefix + field.path;
  const value = getPath(path);
  const type = field.type || "text";
  const wide = field.wide ? " wide" : "";

  if (type === "checkbox") {
    const input = el("input", { type: "checkbox", checked: Boolean(value) });
    input.addEventListener("change", () => setPath(path, input.checked));
    return el("label", { class: `field check${wide}` }, [input, field.label]);
  }

  let control;
  if (type === "image" || type === "audio") {
    control = filePicker(value, v => setPath(path, v), type);
  } else if (type === "textarea") {
    control = el("textarea", { value: value || "", rows: 2 });
    control.addEventListener("input", () => setPath(path, control.value));
  } else if (type === "number") {
    control = el("input", { type: "number", min: 0, value: value || 0 });
    control.addEventListener("input", () => {
      setPath(path, Math.max(0, parseInt(control.value, 10) || 0));
      if (path === "ui.albumLimit") renderAlbumList();
    });
  } else if (type === "datetime") {
    control = el("input", { type: "datetime-local", value: toLocalInput(value) });
    control.addEventListener("input", () => setPath(path, fromLocalInput(control.value)));
  } else {
    control = el("input", { type: "text", value: value || "", placeholder: field.hint || "" });
    control.addEventListener("input", () => setPath(path, control.value));
  }

  return el("label", { class: `field${wide}` }, [el("span", { textContent: field.label }), control]);
}

function renderFamilies(container) {
  const grid = el("div", { class: "families" });
  [["groom", "Nhà trai"], ["bride", "Nhà gái"]].forEach(([key, title]) => {
    const fields = el("div", { class: "fields" }, familyFields.map(f => fieldEl(f, `families.${key}.`)));
    grid.append(el("div", { class: "card" }, [el("h2", { textContent: title }), fields]));
  });
  container.append(grid);
}

let albumListEl = null;

function renderAlbum(container) {
  albumListEl = el("div", { class: "album-list" });

  const addFiles = el("button", { type: "button", textContent: "Thêm ảnh từ máy…" });
  addFiles.addEventListener("click", async () => {
    const files = await chooseFiles("image/*", true);
    for (const file of files) {
      const path = await uploadFile(file, `${IMAGE_DIR}/album`);
      if (!path) return;
      model.album.push({ src: path, alt: `Ảnh album ${model.album.length + 1}`, orientation: await detectOrientation(path) });
    }
    if (files.length) {
      markDirty();
      renderAlbumList();
    }
  });

  const addRow = el("button", { type: "button", textContent: "Thêm dòng (chọn ảnh có sẵn)" });
  addRow.addEventListener("click", () => {
    model.album.push({ src: "", alt: `Ảnh album ${model.album.length + 1}`, orientation: "" });
    markDirty();
    renderAlbumList();
  });

  container.append(albumListEl, el("div", { class: "row" }, [addFiles, addRow]));
  renderAlbumList();
}

function moveAlbum(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= model.album.length) return;
  [model.album[index], model.album[target]] = [model.album[target], model.album[index]];
  markDirty();
  renderAlbumList();
}

function renderAlbumList() {
  if (!albumListEl) return;
  const limit = model.ui.albumLimit;

  const rows = model.album.map((item, index) => {
    const alt = el("input", { type: "text", value: item.alt, placeholder: "Mô tả ảnh" });
    alt.addEventListener("input", () => {
      item.alt = alt.value;
      markDirty();
    });

    const orientation = el("select", { title: "Hướng ảnh" }, [
      ["", "Tự động"],
      ["portrait", "Dọc"],
      ["landscape", "Ngang"],
      ["square", "Vuông"]
    ].map(([value, textContent]) => el("option", { value, textContent })));
    orientation.value = item.orientation;
    orientation.addEventListener("change", () => {
      item.orientation = orientation.value;
      markDirty();
    });

    const button = (label, title, onClick, cls = "") => {
      const b = el("button", { type: "button", textContent: label, title, class: cls });
      b.addEventListener("click", onClick);
      return b;
    };

    const actions = el("div", { class: "actions" }, [
      button("↑", "Lên", () => moveAlbum(index, -1)),
      button("↓", "Xuống", () => moveAlbum(index, 1)),
      button("✕", "Xóa khỏi album (không xóa file)", () => {
        model.album.splice(index, 1);
        markDirty();
        renderAlbumList();
      }, "danger")
    ]);

    const hidden = limit > 0 && index >= limit;
    return el("div", { class: `album-row${hidden ? " hidden-by-limit" : ""}`, title: hidden ? "Vượt số ảnh hiển thị, sẽ không hiện" : "" }, [
      el("span", { class: "index", textContent: index + 1 }),
      filePicker(item.src, value => {
        item.src = value;
        markDirty();
        // Đổi ảnh thì nhận diện lại hướng (bỏ qua nếu ảnh đã đổi tiếp trong lúc chờ tải).
        detectOrientation(value).then(found => {
          if (!found || item.src !== value) return;
          item.orientation = found;
          orientation.value = found;
        });
      }, "image"),
      alt,
      orientation,
      actions
    ]);
  });

  if (!rows.length) rows.push(el("p", { class: "note", textContent: "Album chưa có ảnh." }));
  albumListEl.replaceChildren(...rows);
}

function renderForm() {
  const form = document.getElementById("form");
  const toc = document.getElementById("toc");
  form.replaceChildren();
  toc.replaceChildren();
  albumListEl = null;

  sections.forEach(section => {
    const card = el("section", { class: "card", id: `s-${section.id}` });
    const heading = el("h2", { textContent: section.title });

    if (section.toggle) {
      const toggle = el("input", { type: "checkbox", checked: Boolean(getPath(section.toggle)) });
      const sync = () => card.classList.toggle("off", !toggle.checked);
      toggle.addEventListener("change", () => {
        setPath(section.toggle, toggle.checked);
        sync();
      });
      heading.append(el("label", {}, [toggle, " Hiển thị phần này"]));
      sync();
    }

    card.append(heading);
    if (section.note) card.append(el("p", { class: "note", textContent: section.note }));
    if (section.fields) card.append(el("div", { class: "fields" }, section.fields.map(f => fieldEl(f))));
    if (section.custom) section.custom(card);

    form.append(card);
    toc.append(el("a", { href: `#s-${section.id}`, textContent: section.title }));
  });
}

// ---------- Tải / lưu ----------

// Trang Setting chỉ đọc dữ liệu gốc config-setting.js, không đọc 2 file thiệp.
const SETTING_FILE = "assets/js/config-setting.js";

function loadSettingScript() {
  return new Promise((resolve, reject) => {
    delete window.WEDDING_SETTING;
    const script = el("script", { src: new URL(`${SETTING_FILE}?t=${Date.now()}`, ROOT_URL).href });
    script.onload = () => {
      script.remove();
      resolve(window.WEDDING_SETTING);
    };
    script.onerror = () => reject(new Error(`Không tải được ${SETTING_FILE}`));
    document.head.append(script);
  });
}

async function loadModel() {
  try {
    model = SettingModel.normalizeModel(await loadSettingScript());
    renderForm();
    dirty = false;
    setStatus("Đã tải cấu hình hiện tại. Bấm \"Chọn thư mục project\" để lưu trực tiếp và thêm ảnh.");
  } catch (error) {
    renderForm();
    setStatus(error.message, "error");
  }
}

function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/javascript" }));
  const link = el("a", { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Đọc file trong project: qua thư mục đã chọn nếu có (mở bằng file:// không fetch được), không thì tải qua URL.
async function readProjectFile(path) {
  if (rootDir) {
    const parts = path.split("/");
    const name = parts.pop();
    return (await (await getDir(parts.join("/"))).getFileHandle(name)).getFile();
  }
  const response = await fetch(assetUrl(path));
  if (!response.ok) throw new Error(`${response.status}`);
  return response.blob();
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Xuất 1 file sao lưu gồm dữ liệu Setting và mọi ảnh/nhạc đang dùng, nhập lại ở project khác không mất gì.
async function exportData() {
  if (window.showDirectoryPicker && !(await ensureFolder())) {
    setStatus("Chưa xuất: cần chọn thư mục gốc của project để đọc ảnh/nhạc.", "error");
    return;
  }
  setStatus("Đang xuất dữ liệu và ảnh/nhạc...");
  const files = {};
  const missing = [];
  for (const path of SettingModel.assetPaths(model)) {
    try {
      files[path] = await toDataUrl(await readProjectFile(path));
    } catch {
      missing.push(path);
    }
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const blob = new Blob([SettingModel.serializeBackup(model, files)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  el("a", { href: url, download: `wedding-backup-${stamp}.json` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const size = (blob.size / 1024 / 1024).toFixed(1);
  const count = Object.keys(files).length;
  if (missing.length) {
    setStatus(`Đã xuất (${size} MB, ${count} file ảnh/nhạc). Không tìm thấy, không xuất được: ${missing.join(", ")}`, "error");
  } else {
    setStatus(`Đã xuất đầy đủ dữ liệu và ${count} file ảnh/nhạc (${size} MB).`, "ok");
  }
}

// Nhập file sao lưu: chép ảnh/nhạc vào đúng đường dẫn trong project rồi nạp dữ liệu (config chỉ ghi khi bấm Lưu).
async function importData() {
  const [file] = await chooseFiles(".json,.js", false);
  if (!file) return;
  if (dirty && !confirm("Bỏ các thay đổi chưa lưu và nhập dữ liệu từ file?")) return;

  let imported;
  try {
    imported = SettingModel.parseSettingText(await file.text());
  } catch (error) {
    setStatus(`Nhập thất bại: ${error.message}`, "error");
    return;
  }

  const paths = Object.keys(imported.files);
  let note = "";
  if (paths.length && !window.showDirectoryPicker) {
    note = ` Trình duyệt này không ghi được file nên ${paths.length} ảnh/nhạc chưa được chép vào project, hãy dùng Chrome/Edge.`;
  } else if (paths.length) {
    if (!(await ensureFolder())) {
      setStatus("Chưa nhập: cần chọn thư mục gốc của project để chép ảnh/nhạc.", "error");
      return;
    }
    const list = paths.slice(0, 15).map(path => `• ${path}`).join("\n")
      + (paths.length > 15 ? `\n… và ${paths.length - 15} file khác` : "");
    if (!confirm(`Chép ${paths.length} file ảnh/nhạc vào thư mục "${rootDir.name}"? File trùng tên sẽ bị ghi đè.\n\n${list}`)) {
      setStatus("Đã hủy nhập.");
      return;
    }
    try {
      for (const path of paths) await writeFile(path, await (await fetch(imported.files[path])).blob());
    } catch (error) {
      setStatus(`Nhập thất bại khi chép ảnh/nhạc: ${error.message}`, "error");
      return;
    }
    await refreshFileLists();
    note = ` Đã chép ${paths.length} file ảnh/nhạc vào project.`;
  }

  model = imported.model;
  renderForm();
  markDirty();
  setStatus(`Đã nhập dữ liệu từ "${file.name}".${note} Kiểm tra lại rồi bấm Lưu để cập nhật 2 thiệp.`, "ok");
}

async function save() {
  const files = SettingModel.configFiles(model);
  try {
    if (!window.showDirectoryPicker) {
      Object.entries(files).forEach(([path, content]) => download(path.split("/").pop(), content));
      setStatus("Đã tải 3 file config về. Hãy chép đè vào thư mục assets/js/ của project.", "ok");
      dirty = false;
      return;
    }

    // Lấy quyền thư mục trước (cần cú click của người dùng), rồi mới hỏi xác nhận.
    if (!(await ensureFolder())) {
      setStatus("Chưa lưu: cần chọn thư mục gốc của project.", "error");
      return;
    }

    const list = Object.keys(files).map(path => `• ${rootDir.name}/${path}`).join("\n");
    if (!confirm(`Lưu trực tiếp vào thư mục project?\n\n${list}\n\nThiệp nhà trai và nhà gái sẽ được tạo lại theo Setting (ghi đè nội dung cũ).`)) {
      setStatus("Đã hủy lưu.");
      return;
    }

    for (const [path, content] of Object.entries(files)) await writeFile(path, content);
    setStatus(`Đã lưu vào ${rootDir.name}/assets/js/ (${new Date().toLocaleTimeString()}).`, "ok");
    dirty = false;
  } catch (error) {
    setStatus(`Lưu thất bại: ${error.message}`, "error");
  }
}

document.getElementById("pickFolder").addEventListener("click", pickFolder);
document.getElementById("save").addEventListener("click", save);
document.getElementById("exportData").addEventListener("click", exportData);
document.getElementById("importData").addEventListener("click", importData);
document.getElementById("reload").addEventListener("click", () => {
  if (dirty && !confirm("Bỏ các thay đổi chưa lưu?")) return;
  loadModel();
});
window.addEventListener("beforeunload", event => {
  if (dirty) event.preventDefault();
});

loadModel().then(restoreFolder);
