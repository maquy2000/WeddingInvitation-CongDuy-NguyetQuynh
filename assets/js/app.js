const config = window.WEDDING_CONFIG || {};
config.text = config.text || {};
config.couple = config.couple || {};
config.dates = config.dates || {};
config.images = config.images || {};
config.ui = config.ui || {};
config.ui.sections = config.ui.sections || {};
config.ui.blocks = config.ui.blocks || {};
config.events = Array.isArray(config.events) ? config.events : [];
config.album = Array.isArray(config.album) ? config.album : [];
config.gifts = Array.isArray(config.gifts) ? config.gifts : [];
config.music = config.music || {};

// Mẫu thiệp: style.css là mẫu mặc định, mẫu khác viết đè trong template-<tên>.css theo thuộc tính này.
const template = config.ui.template || "default";
document.documentElement.dataset.template = template;

// Đường dẫn trong config tính từ thư mục gốc project (nơi chứa index.html), app.js nằm ở assets/js/.
const ROOT_URL = new URL("../../", document.currentScript.src);

function asset(path) {
  if (!path) return "";
  if (/^([a-z]+:|\/\/|\/)/i.test(path)) return path;
  return new URL(path, ROOT_URL).href;
}

const cover = document.getElementById("cover");
const mainContent = document.getElementById("mainContent");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const autoScrollToggle = document.getElementById("autoScrollToggle");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const giftDialog = document.getElementById("giftDialog");

let autoScrollTimer = null;
let isAutoScrolling = false;
let weddingDate = new Date(config.dates.weddingDate);
const side = config.side || config.events[0]?.key || "groom";
const musicEnabled = config.music.enabled !== false && Boolean(config.music.src);

// Thiệp nhà nào thì nhà đó đứng trước.
config.events.sort((a, b) => (b.key === side) - (a.key === side));

// Tỉ lệ khung (rộng / cao) theo hướng ảnh chọn trong Setting.
const ALBUM_RATIOS = { portrait: 2 / 3, landscape: 3 / 2, square: 1 };

function $(id) {
  return document.getElementById(id);
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value || "";
}

function attr(id, name, value) {
  const el = $(id);
  if (!el) return;
  if (value) {
    el.setAttribute(name, value);
  } else {
    el.removeAttribute(name);
  }
}

function on(id, eventName, handler) {
  const el = $(id);
  if (el) el.addEventListener(eventName, handler);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Ảnh nền đổi qua biến CSS, để trống thì style.css dùng ảnh mặc định.
function cssImage(name, path) {
  if (path) document.documentElement.style.setProperty(name, `url("${asset(path)}")`);
}

function setHidden(id, hidden) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("hidden", Boolean(hidden));
}

function getSelectedEvent() {
  return config.events.find(event => event.key === side) || config.events[0] || {};
}

function orderedNames() {
  const { brideName, groomName } = config.couple;
  return side === "bride" ? [brideName, groomName] : [groomName, brideName];
}

function getCeremony(event) {
  if (!event) return {};
  return event.ceremony || {
    title: event.title || "",
    time: event.time || ""
  };
}

function getReception(event) {
  if (!event) return {};
  return event.reception || {};
}

function applyVisibilityConfig() {
  const sections = config.ui?.sections || {};
  const blocks = config.ui?.blocks || {};

  setHidden("home", sections.home === false);
  setHidden("story", sections.story === false);
  setHidden("invitation", sections.invitation === false);
  setHidden("event", sections.event === false);
  setHidden("album", sections.album === false);
  setHidden("gift", sections.gift === false);
  setHidden("rsvp", sections.rsvp === false);
  setHidden("thanks", sections.thanks === false);
  setHidden("countdown", blocks.countdown === false);
  setHidden("calendar", blocks.countdown === false);
  setHidden("giftBox", config.gifts.length === 0);
  // Ảnh minh họa cạnh hộp quà: tắt trong Setting hoặc chưa có ảnh thì ẩn, hộp quà nằm giữa.
  const showGiftImage = blocks.giftImage !== false && Boolean(config.images.gift);
  setHidden("giftPhoto", !showGiftImage);
  $("gift")?.classList.toggle("no-photo", !showGiftImage);
  setHidden("musicToggle", !musicEnabled);
}

function renderConfig() {
  const [firstName, secondName] = orderedNames();

  document.title = config.siteTitle || "Thiệp Cưới";
  attr("pageDescription", "content", config.description || "");

  text("coverEyebrow", config.text.coverEyebrow);
  text("coverName1", firstName);
  text("coverName2", secondName);
  text("coverDate", config.dates.coverDate);
  text("coverDescription", config.text.heroDescription);
  text("openInvite", config.text.openButton);

  text("heroEyebrow", config.text.heroEyebrow);
  text("heroName1", firstName);
  text("heroName2", secondName);
  text("heroDate", config.dates.displayDate);
  text("heroDescription", config.text.heroDescription);

  text("invitationEyebrow", config.text.invitationEyebrow || "Together With Their Families");
  text("invitationTitle", config.text.invitationTitle || "Lễ thành hôn");
  text("invitationDescription", config.text.invitationDescription || "Chúng tôi trân trọng kính mời bạn đến tham dự lễ cưới và chung vui cùng gia đình.");

  text("eventEyebrow", config.text.eventEyebrow);
  text("eventTitle", config.text.eventTitle);
  text("albumEyebrow", config.text.albumEyebrow);
  text("albumTitle", config.text.albumTitle);
  text("giftEyebrow", config.text.giftEyebrow);
  text("giftTitle", config.text.giftTitle);
  text("giftDescription", config.text.giftDescription);
  text("bankTitle", config.text.bankTitle || "Phong bao mừng cưới");
  text("thanksTitle", config.text.thanksTitle);
  text("thanksMessage", config.text.thanksMessage);

  attr("coverImage", "src", asset(config.images.cover));
  attr("coupleImage", "src", asset(config.images.couple));
  attr("giftImage", "src", asset(config.images.gift));
  cssImage("--bg-image", config.images.background);
  cssImage("--wave-image", config.images.wave);
  if (musicEnabled) attr("bgMusic", "src", asset(config.music.src));

  applyVisibilityConfig();
  renderInviteSummary();
  renderEvents();
  renderAlbum();
  renderGifts();
}

// Mỗi tài khoản trong hộp quà: mã QR (nếu có), ngân hàng, số tài khoản, chủ tài khoản.
function renderGifts() {
  const list = $("giftAccounts");
  if (!list) return;

  list.innerHTML = config.gifts.map(gift => `
    <article class="gift-account">
      <p class="gift-role">${escapeHtml(gift.role)}${gift.name ? ` · ${escapeHtml(gift.name)}` : ""}</p>
      ${gift.qr ? `<img class="gift-qr" src="${escapeHtml(asset(gift.qr))}" alt="Mã QR chuyển khoản ${escapeHtml(gift.role)}" />` : ""}
      <p class="gift-bank">${escapeHtml(gift.bankName)}</p>
      <p class="gift-number">${escapeHtml(gift.accountNumber)}</p>
      <p class="gift-owner">${escapeHtml(gift.accountOwner)}</p>
      <div class="gift-actions">
        ${gift.accountNumber ? `<button class="gift-action gift-copy" type="button" data-copy="${escapeHtml(gift.accountNumber)}">Sao chép STK</button>` : ""}
        ${gift.qr ? `<a class="gift-action" href="${escapeHtml(asset(gift.qr))}" download>Lưu QR</a>` : ""}
      </div>
    </article>
  `).join("");
}

// Mẫu "vintage": hoa rơi trên bìa phong bì.
function renderPetals() {
  const overlay = cover?.querySelector(".cover-overlay");
  if (!overlay) return;

  const layer = document.createElement("div");
  layer.className = "petals";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 14; i++) {
    const petal = document.createElement("span");
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${16 + Math.random() * 10}s`;
    petal.style.animationDelay = `${-Math.random() * 20}s`;
    petal.style.setProperty("--sway", `${Math.round(Math.random() * 60 - 30)}px`);
    petal.style.setProperty("--size", `${10 + Math.round(Math.random() * 10)}px`);
    layer.append(petal);
  }
  overlay.after(layer);
}

// Mẫu "vintage": lịch tháng cưới, ngày cưới đánh dấu trái tim. Lấy ngày theo chuỗi (giờ VN) để không lệch múi giờ.
function renderCalendar() {
  const box = $("calendar");
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(config.dates.weddingDate || "");
  if (!box || !match) return;

  const [year, month, day] = match.slice(1).map(Number);
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Tuần bắt đầu từ thứ 2.
  const total = new Date(year, month, 0).getDate();
  const cells = [...Array(offset).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)];

  box.innerHTML = `
    <p class="calendar-title">Tháng ${month} / ${year}</p>
    <div class="calendar-grid">
      ${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(name => `<b>${name}</b>`).join("")}
      ${cells.map(date => `<span${date === day ? ' class="is-wedding"' : ""}>${date || ""}</span>`).join("")}
    </div>
  `;
}

function renderInviteSummary() {
  const inviteGrid = $("inviteGrid");
  if (!inviteGrid) return;

  const selectedEvent = getSelectedEvent();
  const reception = getReception(selectedEvent);

  inviteGrid.innerHTML = `
    <div>
      <span>Tiệc cưới</span>
      <strong>${escapeHtml(reception.time || "Đang cập nhật")}</strong>
    </div>
    <div class="invite-address">
      <span>Địa điểm</span>
      <strong>${escapeHtml(selectedEvent.address || "")}</strong>
    </div>
  `;
}

// Lễ thành hôn / lễ vu quy hiển thị cả hai nhà. Tiệc cưới chỉ lấy một nhà theo config.side.
function renderEvents() {
  const eventGrid = $("eventGrid");
  if (!eventGrid) return;

  eventGrid.classList.toggle("single", config.events.length === 1);
  eventGrid.innerHTML = config.events.map(event => {
    const ceremony = getCeremony(event);

    return `
      <article class="event-card">
        <img src="${escapeHtml(asset(event.image))}" alt="${escapeHtml(event.imageAlt || event.label || "")}" />
        <div>
          <span class="badge">${escapeHtml(event.label || "")}</span>

          <div class="event-time-block">
            <h4>${escapeHtml(ceremony.title || "Lễ thành hôn")}</h4>
            <p><b>Thời gian:</b> ${escapeHtml(ceremony.time || "")}</p>
          </div>

          <p><b>Địa điểm:</b> ${escapeHtml(event.address || "")}</p>
          <a class="outline-btn" href="${escapeHtml(event.mapUrl || "#")}" target="_blank" rel="noreferrer">Xem bản đồ</a>
        </div>
      </article>
    `;
  }).join("");
}

function renderAlbum() {
  const albumGrid = $("albumGrid");
  if (!albumGrid) return;

  const limit = Number(config.ui.albumLimit) || 0;
  const items = limit > 0 ? config.album.slice(0, limit) : config.album;

  albumGrid.innerHTML = items.map(item => `
    <button class="album-item ${ALBUM_RATIOS[item.orientation] ? item.orientation : "auto"}" type="button"
      data-ratio="${ALBUM_RATIOS[item.orientation] || 1}" data-img="${escapeHtml(asset(item.src))}">
      <img src="${escapeHtml(asset(item.src))}" alt="${escapeHtml(item.alt || "Ảnh album")}" />
    </button>
  `).join("");

  // Ảnh chưa chọn hướng trong Setting: đo theo kích thước thật khi ảnh tải xong.
  albumGrid.querySelectorAll(".album-item.auto img").forEach(img => {
    img.addEventListener("load", () => {
      img.parentElement.dataset.ratio = img.naturalWidth / img.naturalHeight;
      layoutAlbum();
    });
  });

  bindAlbumLightbox();
  layoutAlbum();
}

// Xếp album thành các hàng cao bằng nhau, mỗi ô đúng tỉ lệ dọc/ngang/vuông.
// Chọn cách chia hàng cho chiều cao các hàng gần chuẩn nhất, tức ít khoảng trống thừa nhất.
// Hàng ít ảnh không bị phóng quá cỡ mà căn giữa; khung album co theo hàng rộng nhất.
function layoutAlbum() {
  const albumGrid = $("albumGrid");
  if (!albumGrid?.parentElement.clientWidth) return; // Thiệp chưa mở (đang ẩn): xếp lại khi mở.

  const frame = getComputedStyle(albumGrid);
  const gap = parseFloat(frame.rowGap) || 0;
  const width = albumGrid.parentElement.clientWidth
    - 2 * (parseFloat(frame.paddingLeft) + parseFloat(frame.borderLeftWidth));
  const target = width < 640 ? 240 : 300;
  const maxHeight = target * 1.2;
  const items = [...albumGrid.querySelectorAll(".album-item")];
  const ratios = items.map(item => Number(item.dataset.ratio) || 1);
  const fitHeight = (from, to) => {
    const ratioSum = ratios.slice(from, to).reduce((a, b) => a + b, 0);
    return (width - gap * (to - from - 1)) / ratioSum;
  };

  // cost[j]: tổng độ lệch nhỏ nhất khi xếp j ảnh đầu; start[j]: ảnh mở đầu hàng cuối trong cách xếp đó.
  const cost = [0];
  const start = [0];
  for (let j = 1; j <= items.length; j++) {
    cost[j] = Infinity;
    for (let i = j - 1; i >= 0; i--) {
      const height = fitHeight(i, j);
      if (height < target / 2 && i < j - 1) break; // Hàng đã quá chật, thêm ảnh chỉ chật hơn.
      const total = cost[i] + Math.log(height / target) ** 2;
      if (total < cost[j]) {
        cost[j] = total;
        start[j] = i;
      }
    }
  }

  const rows = [];
  for (let j = items.length; j > 0; j = start[j]) rows.unshift([start[j], j]);

  albumGrid.replaceChildren(...rows.map(([from, to]) => {
    const height = Math.min(maxHeight, fitHeight(from, to));
    const line = document.createElement("div");
    line.className = "album-line";
    items.slice(from, to).forEach((item, index) => {
      item.style.width = `${Math.floor(ratios[from + index] * height)}px`;
      item.style.height = `${Math.floor(height)}px`;
    });
    line.append(...items.slice(from, to));
    return line;
  }));
}

// Thiệp đã tắt trong Setting: chỉ hiện thông báo, không render nội dung nào.
function renderUnavailable() {
  document.title = "Thiệp chưa sẵn sàng";
  document.body.innerHTML = `
    <main class="section unavailable">
      <div class="panel-card section-heading">
        <p class="eyebrow">Wedding Invitation</p>
        <h3>Thiệp chưa sẵn sàng</h3>
        <p>Thiệp mời này đang được cập nhật. Bạn vui lòng quay lại sau.</p>
      </div>
    </main>
  `;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(0, weddingDate - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const seconds = Math.floor(diff / 1000) % 60;

  text("days", days);
  text("hours", pad2(hours));
  text("minutes", pad2(minutes));
  text("seconds", pad2(seconds));
}

function setMusicButtonState() {
  if (!musicToggle || !bgMusic) return;

  if (bgMusic.paused) {
    musicToggle.classList.remove("active");
  } else {
    musicToggle.classList.add("active");
  }
}

async function playMusic() {
  if (!bgMusic || !musicEnabled) return;

  bgMusic.volume = 0.45;
  try {
    await bgMusic.play();
  } catch (error) {
    // Browser may block autoplay. User can press the music button.
  }
  setMusicButtonState();
}

function startAutoScroll() {
  if (autoScrollTimer || !autoScrollToggle) return;

  isAutoScrolling = true;
  autoScrollToggle.classList.add("active");
  autoScrollToggle.textContent = "❚❚";

  autoScrollTimer = setInterval(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (window.scrollY >= maxScroll - 4) {
      stopAutoScroll();
      return;
    }

    window.scrollBy({ top: 5, behavior: "auto" });
  }, 16);
}

function stopAutoScroll() {
  if (!autoScrollToggle) return;

  isAutoScrolling = false;
  autoScrollToggle.classList.remove("active");
  autoScrollToggle.textContent = "⇣";
  clearInterval(autoScrollTimer);
  autoScrollTimer = null;
}

function bindAlbumLightbox() {
  if (!lightbox || !lightboxImage) return;

  document.querySelectorAll(".album-item").forEach(button => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.img;
      lightbox.showModal();
    });
  });
}

const rsvpKey = "wedding-rsvp-list";
const rsvpForm = $("rsvpForm");
const guestList = $("guestList");

function getRsvps() {
  return JSON.parse(localStorage.getItem(rsvpKey) || "[]");
}

function saveRsvps(items) {
  localStorage.setItem(rsvpKey, JSON.stringify(items));
}

function renderRsvps() {
  if (!guestList) return;

  const items = getRsvps();
  if (items.length === 0) {
    guestList.innerHTML = "<li>Chưa có xác nhận nào.</li>";
    return;
  }

  guestList.innerHTML = items.map(item => `
    <li>
      <b>${escapeHtml(item.name)}</b> - ${escapeHtml(item.status)} - ${Number(item.guests)} khách
      ${item.message ? `<br><em>${escapeHtml(item.message)}</em>` : ""}
    </li>
  `).join("");
}

// Mẫu có hiệu ứng mở bìa (animation CSS trên #cover) thì chờ chạy xong mới gỡ bìa.
function closeCover() {
  if (!cover) return;
  cover.classList.add("is-opening");
  if (getComputedStyle(cover).animationName === "none") {
    cover.remove();
    return;
  }
  cover.addEventListener("animationend", event => {
    if (event.target === cover) cover.remove();
  });
}

on("openInvite", "click", () => {
  if (mainContent) mainContent.classList.remove("hidden");
  closeCover();
  window.scrollTo({ top: 0, behavior: "smooth" });
  layoutAlbum();
  playMusic();

  if (config.ui.autoScroll !== false) {
    setTimeout(() => {
      startAutoScroll();
    }, 2000);
  }
});

on("musicToggle", "click", async () => {
  if (!bgMusic) return;

  if (bgMusic.paused) {
    await playMusic();
  } else {
    bgMusic.pause();
    setMusicButtonState();
  }
});

on("autoScrollToggle", "click", () => {
  if (isAutoScrolling) stopAutoScroll();
  else startAutoScroll();
});

window.addEventListener("wheel", () => {
  if (isAutoScrolling) stopAutoScroll();
}, { passive: true });

window.addEventListener("touchmove", () => {
  if (isAutoScrolling) stopAutoScroll();
}, { passive: true });

window.addEventListener("resize", () => requestAnimationFrame(layoutAlbum));

on("closeLightbox", "click", () => {
  if (lightbox) lightbox.close();
});

// Bấm hộp quà: nắp bật lên (CSS .is-open) rồi mở hộp thoại QR.
on("giftBox", "click", () => {
  const box = $("giftBox");
  if (!giftDialog || box.classList.contains("is-open")) return;

  stopAutoScroll();
  box.classList.add("is-open");
  setTimeout(() => {
    giftDialog.showModal();
    box.classList.remove("is-open");
  }, 700);
});

on("closeGift", "click", () => giftDialog?.close());

// Bấm ra ngoài hộp thoại (vùng nền tối) cũng đóng.
on("giftDialog", "click", event => {
  if (event.target === giftDialog) giftDialog.close();
});

on("giftAccounts", "click", async event => {
  const button = event.target.closest(".gift-copy");
  if (!button) return;

  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = "Đã sao chép";
  } catch {
    button.textContent = "Không sao chép được, bạn chép tay giúp nhé";
  }
  setTimeout(() => {
    button.textContent = "Sao chép STK";
  }, 2500);
});

if (rsvpForm) {
  rsvpForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(rsvpForm);
    const item = {
      name: formData.get("name"),
      guests: formData.get("guests"),
      status: formData.get("status"),
      message: formData.get("message"),
      createdAt: new Date().toISOString()
    };

    const items = getRsvps();
    items.unshift(item);
    saveRsvps(items);

    rsvpForm.reset();
    renderRsvps();
    alert("Đã lưu xác nhận trên trình duyệt local.");
  });
}

on("clearRsvp", "click", () => {
  if (!confirm("Xóa toàn bộ RSVP local?")) return;
  localStorage.removeItem(rsvpKey);
  renderRsvps();
});

on("exportRsvp", "click", () => {
  const data = JSON.stringify(getRsvps(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rsvp-list.json";
  link.click();

  URL.revokeObjectURL(url);
});

if (config.enabled === false) {
  renderUnavailable();
} else {
  renderConfig();
  if (template === "vintage") {
    renderPetals();
    renderCalendar();
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
  renderRsvps();
}
