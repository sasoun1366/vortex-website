/* ==========================================================================
   VORTEX — App logic
   Header / footer injection · i18n switching · product rendering ·
   quick-view modal · cart · WhatsApp + Telegram checkout
   ========================================================================== */

window.VORTEX_LANG = localStorage.getItem("vx-lang") || "fa";

/* ---------- icons -------------------------------------------------------- */
const ICON = {
  v: `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M12 16h20l18 44 18-44h20L58 92H42L12 16z" fill="currentColor"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2zm5.76 13.9c-.24.68-1.4 1.3-1.94 1.36-.5.06-1.1.1-3.32-.84-2.7-1.14-4.36-4-4.5-4.18-.12-.18-1.06-1.42-1.06-2.7 0-1.28.66-1.9.9-2.16.24-.26.52-.32.7-.32h.5c.16 0 .38-.02.58.44.2.48.7 1.72.76 1.84.06.12.1.26.02.42-.1.18-.16.28-.3.44-.14.16-.3.36-.44.48-.14.14-.28.3-.12.58.16.28.72 1.2 1.54 1.94 1.06.94 1.96 1.24 2.24 1.38.28.14.44.12.6-.06.16-.2.7-.82.88-1.1.18-.28.36-.22.62-.12.26.1 1.62.76 1.9.9.28.14.46.2.52.32.06.12.06.7-.18 1.38z"/></svg>`,
  tg: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 4.3 19 19.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.24.24-.44.44-.9.44l.32-4.6 8.4-7.6c.36-.32-.08-.5-.56-.18L7.6 13.2l-4.4-1.4c-.95-.3-.97-.95.2-1.4l17-6.6c.8-.3 1.5.18 1.2 1.5z"/></svg>`,
  ig: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-3z"/><path d="m9 12 2 2 4-4"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z"/><path d="M8 10h8M8 13.5h5"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 22s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="11" r="2.6"/></svg>`
};

/* ---------- state -------------------------------------------------------- */
const state = {
  lang: window.VORTEX_LANG,
  filter: "all",
  cart: [],
  orderDone: null      // کد سفارش پس از ثبت موفق — تا پنل موفقیت نمایش داده شود
};

try { state.cart = JSON.parse(localStorage.getItem("vx-cart") || "[]") || []; } catch (e) { state.cart = []; }
const saveCart = () => localStorage.setItem("vx-cart", JSON.stringify(state.cart));

/* ---------- small helpers ------------------------------------------------ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const productById = id => VORTEX.products.find(p => p.id === id);
const cartCount = () => state.cart.reduce((n, i) => n + i.qty, 0);
const cartSubtotal = () => state.cart.reduce((n, i) => {
  const p = productById(i.id); return n + (p ? p.price * i.qty : 0);
}, 0);

function shippingFor(sub) {
  const c = VORTEX.config;
  if (!c.shippingCost) return 0;
  if (c.freeShipOver && sub >= c.freeShipOver) return 0;
  return sub > 0 ? c.shippingCost : 0;
}

/* ---------- header / footer --------------------------------------------- */
const NAV = [
  { page: "home",    href: "index.html",   key: "nav_home" },
  { page: "shop",    href: "shop.html",    key: "nav_shop" },
  { page: "about",   href: "about.html",   key: "nav_about" },
  { page: "contact", href: "contact.html", key: "nav_contact" }
];

function renderChrome() {
  const page = document.body.dataset.page || "home";
  const nav = NAV.map(n =>
    `<a href="${n.href}" data-i18n="${n.key}" class="${n.page === page ? "is-active" : ""}">${t(n.key)}</a>`).join("");

  const headerHost = $("#site-header");
  if (headerHost) headerHost.innerHTML = `
    <div class="announce" data-i18n-html="announce">${t("announce")}</div>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="index.html" aria-label="Vortex">
          <img src="assets/img/logo.svg" alt="Vortex" width="34" height="34" style="width:34px;height:34px">
          <span>
            <span class="brand-word">Vortex</span>
            <span class="brand-sub">${pick(VORTEX.config.brandTag, state.lang)}</span>
          </span>
        </a>
        <nav class="nav">${nav}</nav>
        <div class="header-actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" data-lang="fa" class="${state.lang === "fa" ? "is-active" : ""}">FA</button>
            <button type="button" data-lang="en" class="${state.lang === "en" ? "is-active" : ""}">EN</button>
          </div>
          <button class="icon-btn" type="button" id="cart-open" aria-label="${t("cart_open")}">
            ${ICON.cart}<span class="cart-count" id="cart-count">0</span>
          </button>
          <button class="icon-btn burger" type="button" id="burger" aria-label="${t("menu")}">${ICON.menu}</button>
        </div>
      </div>
    </header>

    <div class="mobile-nav" id="mobile-nav">
      <button class="icon-btn mobile-close" type="button" id="mobile-close" aria-label="${t("close")}">${ICON.close}</button>
      ${NAV.map(n => `<a href="${n.href}" data-i18n="${n.key}">${t(n.key)}</a>`).join("")}
    </div>`;

  const footerHost = $("#site-footer");
  if (footerHost) footerHost.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <a class="brand" href="index.html">
              <img src="assets/img/logo.svg" alt="Vortex" width="34" height="34" style="width:34px;height:34px">
              <span><span class="brand-word">Vortex</span>
              <span class="brand-sub">${pick(VORTEX.config.brandTag, state.lang)}</span></span>
            </a>
            <p data-i18n="f_about">${t("f_about")}</p>
            <div class="socials">
              <a href="https://instagram.com/${VORTEX.config.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.ig}</a>
              <a href="https://wa.me/${VORTEX.config.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a>
              <a href="https://t.me/${VORTEX.config.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.tg}</a>
              <a href="mailto:${VORTEX.config.email}" aria-label="Email">${ICON.mail}</a>
            </div>
          </div>
          <div>
            <h4 data-i18n="f_shop">${t("f_shop")}</h4>
            <ul>
              <li><a href="shop.html" data-i18n="shop_all_products">${t("shop_all_products")}</a></li>
              <li><a href="shop.html?cat=apparel" data-i18n="cat_apparel_t">${t("cat_apparel_t")}</a></li>
              <li><a href="shop.html?cat=accessory" data-i18n="cat_accessory_t">${t("cat_accessory_t")}</a></li>
              <li><a href="shop.html?cat=gear" data-i18n="cat_gear_t">${t("cat_gear_t")}</a></li>
            </ul>
          </div>
          <div>
            <h4 data-i18n="f_help">${t("f_help")}</h4>
            <ul>
              <li><a href="contact.html#faq" data-i18n="f_help1">${t("f_help1")}</a></li>
              <li><a href="contact.html#faq" data-i18n="f_help2">${t("f_help2")}</a></li>
              <li><a href="contact.html#faq" data-i18n="f_help3">${t("f_help3")}</a></li>
              <li><a href="contact.html#faq" data-i18n="f_help4">${t("f_help4")}</a></li>
            </ul>
          </div>
          <div>
            <h4 data-i18n="f_contact">${t("f_contact")}</h4>
            <ul>
              <li><a href="https://wa.me/${VORTEX.config.whatsapp}" target="_blank" rel="noopener">WhatsApp — ${VORTEX.config.phone}</a></li>
              <li><a href="https://t.me/${VORTEX.config.telegram}" target="_blank" rel="noopener">Telegram — @${VORTEX.config.telegram}</a></li>
              <li><a href="mailto:${VORTEX.config.email}">${VORTEX.config.email}</a></li>
              <li><span class="muted" data-i18n="c_hours">${t("c_hours")}</span>: ${pick(VORTEX.config.hours, state.lang)}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} VORTEX — <span data-i18n="f_rights">${t("f_rights")}</span></span>
          <span class="mono">Built for intensity</span>
        </div>
      </div>
    </footer>`;

  /* cart drawer + overlay + toast + modal hosts */
  if (!$("#vortex-ui")) {
    const ui = document.createElement("div");
    ui.id = "vortex-ui";
    ui.innerHTML = `
      <div class="overlay" id="overlay"></div>
      <aside class="drawer" id="drawer" aria-label="${t("cart_title")}">
        <div class="drawer-head">
          <h3 data-i18n="cart_title">${t("cart_title")}</h3>
          <span class="mono muted" id="drawer-count"></span>
          <button class="icon-btn" type="button" id="drawer-close" aria-label="${t("close")}" style="margin-inline-start:auto">${ICON.close}</button>
        </div>
        <div class="drawer-body" id="drawer-body"></div>
        <div class="drawer-foot" id="drawer-foot"></div>
      </aside>

      <div class="modal" id="modal" role="dialog" aria-modal="true">
        <button class="icon-btn modal-close" type="button" id="modal-close" aria-label="${t("close")}">${ICON.close}</button>
        <div class="modal-grid" id="modal-content"></div>
      </div>

      <div class="toast" id="toast">${ICON.check}<span id="toast-text"></span></div>`;
    document.body.appendChild(ui);
  }

  if (!$("#wa-float")) {
    const f = document.createElement("a");
    f.id = "wa-float";
    f.href = `https://wa.me/${VORTEX.config.whatsapp}`;
    f.target = "_blank"; f.rel = "noopener";
    f.setAttribute("aria-label", "WhatsApp");
    f.innerHTML = ICON.wa;
    document.body.appendChild(f);
  }

  wireChrome();
}

/* ---------- chrome events ----------------------------------------------- */
function wireChrome() {
  $("#cart-open").addEventListener("click", openCart);
  $("#drawer-close").addEventListener("click", closeAll);
  $("#overlay").addEventListener("click", closeAll);
  $("#modal-close").addEventListener("click", closeAll);
  $("#burger").addEventListener("click", () => $("#mobile-nav").classList.add("open"));
  $("#mobile-close").addEventListener("click", () => $("#mobile-nav").classList.remove("open"));
  $$(".lang-switch button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
}

function closeAll() {
  $("#overlay").classList.remove("open");
  $("#drawer").classList.remove("open");
  $("#modal").classList.remove("open");
  $("#mobile-nav").classList.remove("open");
}
function openCart() {
  $("#overlay").classList.add("open");
  $("#drawer").classList.add("open");
  renderCart();
}

/* ---------- language ---------------------------------------------------- */
function setLang(lang) {
  if (!LANGS.includes(lang)) lang = "fa";
  state.lang = lang;
  window.VORTEX_LANG = lang;
  localStorage.setItem("vx-lang", lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.includes(lang) ? "rtl" : "ltr";

  $$(".lang-switch button").forEach(b => b.classList.toggle("is-active", b.dataset.lang === lang));
  if (document.body.dataset.page) {
    const tt = document.body.dataset["title" + (lang === "fa" ? "Fa" : "En")];
    if (tt) document.title = tt;
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });

  /* داخل تلگرام: تمام‌صفحه، پیش‌پر کردن نام کاربر */
  const tg = TG_APP();
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
    const u = tgUser();
    if (u) {
      const b = getBuyer();
      if (!b.name) setBuyer("name", [u.first_name, u.last_name].filter(Boolean).join(" "));
      if (!b.tg)   setBuyer("tg", u.username ? "@" + u.username : String(u.id));
    }
  }

  renderChrome();
  applyI18n();
  renderCart();
  if ($("#featured-grid")) renderFeatured("#featured-grid");
  if ($("#shop-grid")) { renderCatFilters(); renderShop(); }
  if (document.body.dataset.page === "home" && $("#soon-grid")) renderSoon();
}

function applyI18n() {
  $$("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}

/* ---------- product card ------------------------------------------------- */
function badgeHtml(p) {
  const b = pick(p.badge, state.lang);
  if (p.oldPrice && p.oldPrice > p.price) {
    const off = Math.round((1 - p.price / p.oldPrice) * 100);
    return `<span class="badge badge--sale">${b ? b + " · " : ""}${num(off, state.lang)}٪</span>`;
  }
  return b ? `<span class="badge">${b}</span>` : "";
}

function productCard(p) {
  return `
  <article class="card" data-id="${p.id}">
    <a class="card-media" href="#" data-open="${p.id}" aria-label="${pick(p.name, state.lang)}">
      ${badgeHtml(p)}
      <img src="${p.img}" alt="${pick(p.name, state.lang)}" loading="lazy">
    </a>
    <div class="card-body">
      <span class="card-cat">${t("cat_" + p.cat + "_t")}</span>
      <h3 class="card-title"><a href="#" data-open="${p.id}">${pick(p.name, state.lang)}</a></h3>
      <div class="card-foot">
        <span class="price">
          <b>${money(p.price, state.lang)}</b>
          ${p.oldPrice && p.oldPrice > p.price ? `<small>${money(p.oldPrice, state.lang)}</small>` : ""}
        </span>
      </div>
      <button class="btn btn--block add-btn" type="button" data-add="${p.id}">${ICON.plus}<span>${t("m_add")}</span></button>
    </div>
  </article>`;
}

function soonCard(item) {
  return `<article class="card card--soon">
    ${ICON.box}
    <h3>${pick(item, state.lang)}</h3>
    <p data-i18n="soon_label">${t("soon_label")}</p>
  </article>`;
}

/* ---------- rendering --------------------------------------------------- */
function renderFeatured(sel) {
  const host = $(sel); if (!host) return;
  const list = VORTEX.products.filter(p => p.featured).slice(0, 4);
  host.innerHTML = list.map(productCard).join("");
  bindGrid(host);
  observeReveal(host);
}
function renderSoon() {
  const host = $("#soon-grid"); if (!host) return;
  host.innerHTML = VORTEX.soon.slice(0, 3).map(soonCard).join("");
  observeReveal(host);
}

function renderCatFilters() {
  const host = $("#shop-filters"); if (!host) return;
  host.innerHTML = VORTEX.categories.map(c =>
    `<button class="filter ${state.filter === c.id ? "is-active" : ""}" type="button" data-filter="${c.id}">${pick(c, state.lang)}</button>`
  ).join("");
  $$("[data-filter]", host).forEach(b => b.addEventListener("click", () => {
    state.filter = b.dataset.filter;
    renderCatFilters(); renderShop();
  }));
}

/* موجودی انبار (از بات/انبارهٔ فروشگاه) — برای نشان‌دادن «ناموجود» */
let STOCK = null;
async function loadStock() {
  try {
    const r = await fetch("api/stock", { cache: "no-store" });
    const d = await r.json();
    STOCK = d && d.ok ? (d.stock || {}) : null;
  } catch (e) { STOCK = null; }
  if (STOCK) markSoldOut();
}

/* اگر همهٔ سایزهای یک محصول صفر بود → کارت ناموجود میشود */
function stockOf(p, size) {
  if (!STOCK) return null;
  const keys = Object.keys(STOCK);
  const key = keys.includes(p.id) ? p.id
    : keys.find(k => p.id.toLowerCase().startsWith("vx-" + k.toLowerCase()) || p.id.toLowerCase().includes(k.toLowerCase()));
  if (!key) return null;
  const s = STOCK[key];
  if (s["*"] !== undefined) return Number(s["*"]);
  if (size && s[size] !== undefined) return Number(s[size]);
  const vals = Object.values(s).map(Number).filter(n => !isNaN(n));
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}
function markSoldOut() {
  $$(".card[data-id]").forEach(card => {
    const p = productById(card.dataset.id);
    if (!p) return;
    const total = stockOf(p);
    const out = total !== null && total <= 0;
    card.classList.toggle("is-out", out);
    const btn = $(".add-btn", card);
    if (btn) {
      btn.disabled = out;
      const label = $("span", btn);
      if (label) label.textContent = out ? t("out_of_stock") : t("m_add");
    }
  });
}

function renderShop() {
  const host = $("#shop-grid"); if (!host) return;
  host.classList.remove("animating"); void host.offsetWidth; host.classList.add("animating");
  const list = state.filter === "all" ? VORTEX.products : VORTEX.products.filter(p => p.cat === state.filter);
  host.innerHTML = list.length
    ? list.map(productCard).join("")
    : `<p class="muted" style="grid-column:1/-1;padding:2.5rem 0;text-align:center">${t("empty_shop")}</p>`;
  const counter = $("#shop-count");
  if (counter) counter.innerHTML = `${num(list.length, state.lang)} ${state.lang === "fa" ? "محصول" : "products"}`;
  bindGrid(host);
  observeReveal(host);
}

function bindGrid(host) {
  if (STOCK) setTimeout(markSoldOut, 0);
  $$("[data-add]", host).forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    if (b.disabled) return;
    const p = productById(b.dataset.add);
    if (p.sizes && p.sizes.length) openProduct(p.id);   // needs a size first
    else addToCart(p.id, "", 1, b);
  }));
  $$("[data-open]", host).forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    openProduct(b.dataset.open);
  }));
}

/* ---------- مرحلهٔ پرداخت کارت‌به‌کارت (داخل کشوی سبد) ---------------- */
let payCard = null;          // { card, cardName }

async function loadPayCard() {
  if (payCard) return payCard;
  try {
    const r = await fetch("api/pay", { cache: "no-store" });
    const d = await r.json();
    if (d && d.ok) payCard = { card: d.card, cardName: d.cardName || "" };
  } catch (e) { payCard = null; }
  return payCard;
}

function renderPayStep() {
  const body = $("#drawer-body"), foot = $("#drawer-foot");
  if (!body) return;
  const sub = cartSubtotal(), ship = shippingFor(sub), total = sub + ship;
  body.innerHTML = `
    <div class="pay-step">
      <button class="pay-back" type="button" id="pay-back">${ICON.back} ${t("pay_back")}</button>
      <h3 class="pay-title">${t("pay_title")}</h3>
      <p class="pay-lead">${t("pay_lead")}</p>
      <div class="pay-card" id="pay-card-box">
        <span class="pc-label">${t("pay_card_no")}</span>
        <b class="pc-num" id="pc-num">${t("pay_loading")}</b>
        <span class="pc-holder" id="pc-holder"></span>
        <button class="btn btn--ghost btn--sm" type="button" id="pc-copy">${ICON.eye} ${t("pay_copy")}</button>
      </div>
      <div class="pay-amount"><span>${t("pay_amount")}</span><b>${money(total, state.lang)}</b></div>
      <label class="pay-field">
        <span>${t("pay_ref_label")}</span>
        <input type="text" id="pay-ref" inputmode="numeric" autocomplete="off"
               placeholder="${t("pay_ref_ph")}" data-i18n-ph="pay_ref_ph">
      </label>
      <p class="pay-hint">${t("pay_ref_hint")}</p>
      <button class="btn btn--block" type="button" id="pay-submit">${t("pay_submit")}</button>
      <div class="pay-alt">
        <span>${t("pay_alt")}</span>
        <button class="btn btn--ghost btn--sm" type="button" id="pay-alt-tg">${ICON.tg} ${t("cart_tg")}</button>
      </div>
    </div>`;
  foot.innerHTML = "";
  $("#pay-back").addEventListener("click", () => { state.payStep = false; renderCart(); });

  loadPayCard().then(c => {
    const num = $("#pc-num"), holder = $("#pc-holder"), box = $("#pay-card-box");
    if (!c || !num) { if (box) box.classList.add("is-error"); if (num) num.textContent = t("pay_card_missing"); return; }
    num.textContent = c.card;
    if (holder) holder.textContent = c.cardName ? `${t("pay_holder")}: ${c.cardName}` : "";
  });

  $("#pc-copy").addEventListener("click", async () => {
    const c = await loadPayCard();
    if (!c) return;
    await copyText(c.card.replace(/[^0-9]/g, ""));
    toast(t("pay_copied"));
  });

  const refInput = $("#pay-ref");
  refInput.addEventListener("input", () => {
    refInput.value = refInput.value.replace(/[^0-9A-Za-z\-]/g, "").slice(0, 24);
  });
  refInput.addEventListener("keydown", e => { if (e.key === "Enter") $("#pay-submit").click(); });

  $("#pay-alt-tg").addEventListener("click", async () => {
    try { const code = await submitOrder(); showOrderSuccess(code); toast(t("order_ok_toast")); }
    catch (e) { showOrderFallback(); }
  });

  $("#pay-submit").addEventListener("click", async () => {
    const ref = refInput.value.trim();
    if (!ref) { toast(t("pay_ref_needed")); refInput.focus(); return; }
    const btn = $("#pay-submit"), html = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = t("order_sending");
    readBuyerFields();
    try {
      const code = await submitOrder(ref);
      state.orderDone = code;
      state.payRef = ref;
      renderCart();
      toast(t("pay_done_toast"));
    } catch (e) {
      btn.disabled = false; btn.innerHTML = html;
      showOrderFallback();
    }
  });
}

/* ---------- product modal ---------------------------------------------- */
let modalSel = { id: null, size: "", qty: 1 };

function openProduct(id) {
  const p = productById(id); if (!p) return;
  modalSel = { id, size: p.sizes && p.sizes.length ? "" : "-", qty: 1 };
  const host = $("#modal-content");
  host.innerHTML = `
    <img src="${p.img}" alt="${pick(p.name, state.lang)}">
    <div class="modal-body">
      <span class="card-cat">${t("cat_" + p.cat + "_t")}</span>
      <h2>${pick(p.name, state.lang)}</h2>
      <div class="modal-price">
        <b>${money(p.price, state.lang)}</b>
        ${p.oldPrice && p.oldPrice > p.price ? `<s>${money(p.oldPrice, state.lang)}</s>` : ""}
      </div>
      <p class="desc">${pick(p.desc, state.lang)}</p>
      ${p.sizes && p.sizes.length ? `
        <span class="field-label">${t("m_size")}</span>
        <div class="sizes" id="size-list">
          ${p.sizes.map(s => `<button class="size" type="button" data-size="${s}">${s}</button>`).join("")}
        </div>` : ""}
      <span class="field-label" style="margin-top:.6rem">${t("m_qty")}</span>
      <div class="qty">
        <button type="button" data-step="-1" aria-label="-">${ICON.minus}</button>
        <span id="modal-qty">${num(1, state.lang)}</span>
        <button type="button" data-step="1" aria-label="+">${ICON.plus}</button>
      </div>
      <button class="btn btn--block" type="button" id="modal-add" style="margin-top:1rem">${ICON.cart} ${t("m_add")}</button>
    </div>`;

  $$("#size-list .size", host).forEach(b => b.addEventListener("click", () => {
    modalSel.size = b.dataset.size;
    $$("#size-list .size", host).forEach(x => x.classList.toggle("is-active", x === b));
  }));
  $$("[data-step]", host).forEach(b => b.addEventListener("click", () => {
    modalSel.qty = Math.max(1, Math.min(20, modalSel.qty + Number(b.dataset.step)));
    $("#modal-qty").innerHTML = num(modalSel.qty, state.lang);
  }));
  $("#modal-add").addEventListener("click", () => {
    const p2 = productById(modalSel.id);
    if (p2.sizes && p2.sizes.length && !modalSel.size) { toast(t("m_size_required")); return; }
    addToCart(modalSel.id, modalSel.size === "-" ? "" : modalSel.size, modalSel.qty, $("#modal-content img"));
    closeAll();
  });

  $("#overlay").classList.add("open");
  $("#modal").classList.add("open");
}

/* ---------- cart --------------------------------------------------------- */
function addToCart(id, size, qty, srcEl) {
  state.orderDone = null; state.payRef = "";      // شروع سبد جدید → پنل موفقیت بسته می‌شود
  const found = state.cart.find(i => i.id === id && i.size === size);
  if (found) found.qty = Math.min(20, found.qty + qty);
  else state.cart.push({ id, size, qty });
  saveCart(); renderCart(); toast(t("toast_added"));
  /* بدون افکت پرواز — فقط پیام تأیید و به‌روزرسانی سبد */
}

function setQty(idx, qty) {
  state.orderDone = null;
  if (qty <= 0) state.cart.splice(idx, 1);
  else state.cart[idx].qty = Math.min(20, qty);
  saveCart(); renderCart();
}

function readBuyerFields() {
  const map = [["by-name", "name"], ["by-phone", "phone"], ["by-addr", "addr"]];
  map.forEach(([id, k]) => { const el = $("#" + id); if (el && el.value.trim()) setBuyer(k, el.value.trim()); });
}

function renderCart() {
  const count = $("#cart-count");
  if (count) { count.textContent = new Intl.NumberFormat(state.lang === "fa" ? "fa-IR" : "en-US").format(cartCount()); count.classList.toggle("on", cartCount() > 0); }
  const dc = $("#drawer-count");
  if (dc) dc.textContent = cartCount() ? `${num(cartCount(), state.lang)} ${state.lang === "fa" ? "قطعه" : "items"}` : "";

  if (window.UI && UI.stickySync) { try { UI.stickySync(); } catch (e) {} }

  const body = $("#drawer-body"), foot = $("#drawer-foot");
  if (!body) return;

  /* سفارش تازه ثبت شده → پنل موفقیت */
  if (state.orderDone) {
    body.innerHTML = orderSuccessHtml(state.orderDone);
    foot.innerHTML = "";
    return;
  }

  if (!state.cart.length) {
    body.innerHTML = `<div class="empty">
        ${ICON.box}
        <h3 style="font-size:1.05rem;color:var(--text)">${t("cart_empty")}</h3>
        <p style="margin-top:.4rem;font-size:.86rem">${t("cart_empty_hint")}</p>
        <a class="btn btn--ghost btn--sm" href="shop.html" style="margin-top:1.3rem" data-i18n="view_all">${t("view_all")}</a>
      </div>`;
    foot.innerHTML = "";
    return;
  }

  body.innerHTML = state.cart.map((i, idx) => {
    const p = productById(i.id); if (!p) return "";
    return `<div class="cart-row">
      <img src="${p.img}" alt="${pick(p.name, state.lang)}">
      <div>
        <h4>${pick(p.name, state.lang)}</h4>
        ${i.size ? `<div class="meta">${t("m_size")}: ${i.size}</div>` : ""}
        <div class="qty--sm">
          <button type="button" data-cart-step="${idx}|-1" aria-label="-">${ICON.minus}</button>
          <span>${num(i.qty, state.lang)}</span>
          <button type="button" data-cart-step="${idx}|1" aria-label="+">${ICON.plus}</button>
        </div>
      </div>
      <div style="text-align:end">
        <button class="remove" type="button" data-remove="${idx}" aria-label="${t("cart_del")}">${ICON.trash}</button>
        <div class="row-price">${money(p.price * i.qty, state.lang)}</div>
      </div>
    </div>`;
  }).join("");

  const sub = cartSubtotal(), ship = shippingFor(sub), total = sub + ship;
  const c = VORTEX.config;
  animateTotal(total);
  const remain = c.freeShipOver - sub;
  const hint = ship === 0
    ? `<div class="order-note" style="color:var(--olive-300)">${ICON.check ? "✓ " : ""}${t("ship_free_hint")}</div>`
    : (c.freeShipOver ? `<div class="order-note">${money(remain, state.lang)} ${t("ship_remain")}</div>` : "");

  foot.innerHTML = `
    <div class="totals">
      <div class="r"><span>${t("cart_sub")}</span><span>${money(sub, state.lang)}</span></div>
      <div class="r"><span>${t("cart_ship")}</span><span>${ship === 0 ? t("cart_free") : money(ship, state.lang)}</span></div>
      <div class="r total"><span>${t("cart_total")}</span><b id="total-value">${money(total, state.lang)}</b></div>
    </div>
    ${hint}
    <details class="buyer-box">
      <summary>${t("cart_info")}</summary>
      <div class="buyer-fields">
        <input type="text" id="by-name"  data-i18n-ph="form_name"  placeholder="${t("form_name")}"  value="${(getBuyer().name || "")}">
        <input type="tel"  id="by-phone" data-i18n-ph="form_phone" placeholder="${t("form_phone")}" value="${(getBuyer().phone || "")}">
        <input type="text" id="by-addr"  data-i18n-ph="form_addr"  placeholder="${t("form_addr")}"  value="${(getBuyer().addr || "")}">
      </div>
    </details>
    <button class="btn btn--block" type="button" id="checkout-pay">${ICON.card} ${t("pay_btn")}</button>
    <button class="btn btn--block btn--dark" type="button" id="checkout-tg">${ICON.tg} ${t("cart_tg")}</button>
    <button class="btn btn--block btn--ghost btn--sm" type="button" id="checkout-wa">${ICON.wa} ${t("cart_wa")}</button>
    <button class="btn btn--block btn--ghost btn--sm" type="button" id="copy-order">${ICON.eye} ${t("cart_copy")}</button>
    <p class="order-note">${t("cart_note")}</p>
    <button class="btn btn--ghost btn--sm" type="button" id="cart-clear" style="justify-self:start">${t("cart_clear")}</button>`;

  $$("[data-cart-step]", body).forEach(b => b.addEventListener("click", () => {
    const [i, d] = b.dataset.cartStep.split("|").map(Number);
    setQty(i, state.cart[i].qty + d);
  }));
  $$("[data-remove]", body).forEach(b => b.addEventListener("click", () => {
    setQty(Number(b.dataset.remove), 0); toast(t("toast_removed"));
  }));
  $("#checkout-pay").addEventListener("click", () => renderPayStep());

  $("#checkout-wa").addEventListener("click", () => {
    window.open(`https://wa.me/${VORTEX.config.whatsapp}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener");
  });
  $("#checkout-tg").addEventListener("click", async () => {
    const btn = $("#checkout-tg");
    const html = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = `${ICON.tg} ${t("order_sending")}`;
    try {
      const code = await submitOrder();
      showOrderSuccess(code);
      toast(t("order_ok_toast"));
    } catch (e) {
      btn.disabled = false; btn.innerHTML = html;
      showOrderFallback();     // اگر سرور در دسترس نبود: متن کپی + باز شدن بات
    }
  });
  $("#copy-order").addEventListener("click", async () => { await copyText(orderText()); toast(t("toast_copied")); });
  $("#cart-clear").addEventListener("click", () => { state.cart = []; state.orderDone = null; saveCart(); renderCart(); toast(t("toast_cleared")); });
  [["by-name","name"],["by-phone","phone"],["by-addr","addr"]].forEach(([id,k]) => {
    const el = $("#" + id); if (el) el.addEventListener("input", () => setBuyer(k, el.value));
  });
}

/* ---------- Telegram Mini App helpers ------------------------------------ */
const TG_APP  = () => (window.Telegram && window.Telegram.WebApp) || null;
const tgInit  = () => { const a = TG_APP(); return a && a.initData ? a.initData : ""; };
const tgUser  = () => { const a = TG_APP(); return a && a.initDataUnsafe ? a.initDataUnsafe.user : null; };

/* ---------- ثبت سفارش در بات تلگرام (از طریق Cloudflare Worker) ---------- */
async function submitOrder(payRef) {
  const items = state.cart.map(i => {
    const p = productById(i.id);
    return { id: i.id, name: pick(p.name, state.lang), size: i.size || "", qty: i.qty, price: p.price };
  });
  const sub = cartSubtotal(), ship = shippingFor(sub);
  const res = await fetch("api/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lang: state.lang, items,
      totals: { sub, ship, total: sub + ship },
      buyer: getBuyer(),
      payRef: payRef || "",
      initData: tgInit()
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || "order_failed");
  return data.code;
}

function orderSuccessHtml(code) {
  const botUrl = `https://t.me/${VORTEX.config.telegram}`;
  if (state.payRef) {
    return `
    <div class="empty pay-ok" style="padding:2rem 1rem">
      <div class="pay-ok-mark">${ICON.check}</div>
      <h3 style="color:var(--text);font-size:1.12rem">${t("pay_ok_title")}</h3>
      <p style="margin-top:.7rem;font-size:.88rem;line-height:1.95">${t("pay_ok_body")}</p>
      <div class="pay-ok-code">
        <span class="field-label">${t("order_ok_code")}</span>
        <div style="font-family:var(--font-display);font-size:1.2rem;letter-spacing:.06em;color:var(--olive-200)">${code}</div>
        <span class="field-label" style="margin-top:.5rem">${t("pay_ref_label")}</span>
        <div style="font-family:var(--font-display);font-size:1.05rem;color:var(--text)">${state.payRef}</div>
      </div>
      <div style="display:grid;gap:.6rem;margin-top:1.3rem">
        <a class="btn btn--block" href="${botUrl}?start=${encodeURIComponent(code)}" target="_blank" rel="noopener">${ICON.tg} ${t("order_track")}</a>
        <a class="btn btn--block btn--ghost btn--sm" href="shop.html">${t("order_ok_shop")}</a>
      </div>
      <p style="margin-top:.9rem;font-size:.76rem;color:var(--muted)">${t("pay_ok_note")}</p>
    </div>`;
  }
  return `
    <div class="empty" style="padding:2.2rem 1rem">
      <div style="width:64px;height:64px;margin:0 auto 1.1rem;display:grid;place-items:center;border:1px solid var(--olive);color:var(--olive)">${ICON.check}</div>
      <h3 style="color:var(--text);font-size:1.15rem">${t("order_ok_title")}</h3>
      <p style="margin-top:.6rem;font-size:.86rem">${t("order_ok_body")}</p>
      <div style="margin:1.2rem auto 0;padding:.7rem 1rem;border:1px dashed var(--line-strong);width:fit-content">
        <span class="field-label">${t("order_ok_code")}</span>
        <div style="font-family:var(--font-display);font-size:1.25rem;letter-spacing:.08em;color:var(--olive-200)">${code}</div>
      </div>
      <div style="display:grid;gap:.6rem;margin-top:1.4rem">
        <a class="btn btn--block" href="${botUrl}?start=${encodeURIComponent(code)}" target="_blank" rel="noopener">${ICON.tg} ${t("order_track")}</a>
        <a class="btn btn--block btn--ghost btn--sm" href="shop.html">${t("order_ok_shop")}</a>
      </div>
      <p style="margin-top:.8rem;font-size:.78rem;line-height:1.9;color:var(--muted)">${t("order_track_hint")}</p>
    </div>`;
}

function showOrderSuccess(code) {
  state.orderDone = code;
  state.cart = []; saveCart();
  renderCart();          // حالا renderCart خودش پنل موفقیت را می‌سازد
}

function showOrderFallback() {
  copyText(orderText()).then(() => toast(t("order_fail")));
  window.open(`https://t.me/${VORTEX.config.telegram}`, "_blank", "noopener");
}

/* ---------- buyer details (optional, remembered) ------------------------- */
function getBuyer() {
  try { return JSON.parse(localStorage.getItem("vx-buyer") || "{}"); } catch (e) { return {}; }
}
function setBuyer(k, v) {
  const b = getBuyer(); b[k] = v;
  localStorage.setItem("vx-buyer", JSON.stringify(b));
}

/* نمایش مبلغ نهایی — بدون شمارش نرم، تا کاربر گیج نشود */
function animateTotal(total) {
  const el = $("#total-value");
  if (el) el.textContent = money(total, state.lang);
}

/* ---------- order text --------------------------------------------------- */
function orderText() {
  const sub = cartSubtotal(), ship = shippingFor(sub), total = sub + ship;
  const L = state.lang;
  const lines = state.cart.map(i => {
    const p = productById(i.id);
    const sz = i.size ? ` — ${t("m_size")}: ${i.size}` : "";
    return `• ${num(i.qty, L)} × ${pick(p.name, L)}${sz} — ${money(p.price * i.qty, L)}`;
  });
  const buyer = getBuyer();
  const head = L === "fa" ? "🟢 سفارش جدید — VORTEX" : "🟢 New order — VORTEX";
  const f = {
    sub: L === "fa" ? "جمع کالاها" : "Subtotal",
    ship: L === "fa" ? "ارسال" : "Shipping",
    total: L === "fa" ? "مبلغ نهایی" : "Total",
    name: L === "fa" ? "نام و نام خانوادگی" : "Full name",
    phone: L === "fa" ? "شماره تماس" : "Phone",
    addr: L === "fa" ? "شهر و آدرس" : "City & address",
    note: L === "fa" ? "لطفاً موجودی و روش پرداخت را تأیید کنید." : "Please confirm stock and payment method."
  };
  return [
    head, "———————————",
    ...lines, "———————————",
    `${f.sub}: ${money(sub, L)}`,
    `${f.ship}: ${ship === 0 ? t("cart_free") : money(ship, L)}`,
    `${f.total}: ${money(total, L)}`,
    "———————————",
    `${f.name}: ${buyer.name || ""}`,
    `${f.phone}: ${buyer.phone || ""}`,
    `${f.addr}: ${buyer.addr || ""}`,
    "", f.note
  ].join("\n");
}

async function copyText(txt) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); return true; }
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    return true;
  } catch (e) { return false; }
}

/* ---------- toast -------------------------------------------------------- */
let toastTimer;
function toast(msg) {
  const box = $("#toast"), txt = $("#toast-text");
  if (!box) return;
  txt.textContent = msg;
  box.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove("on"), 2600);
}

/* ---------- reveal on scroll -------------------------------------------- */
function observeReveal(scope = document) {
  /* حالت ساده: هیچ محتوایی پنهان نمی‌ماند و به اسکرول وابسته نیست */
  Array.from(scope.querySelectorAll(".reveal")).forEach(el => el.classList.add("in"));
}


/* ==========================================================================
   FX — لایهٔ جلوه‌های بصری: گرداب ذرات، تیلت سه‌بعدی، نورافکن، شمارنده،
        پرواز تصویر به سبد خرید، پارالاکس و نوار پیشرفت اسکرول
   ========================================================================== */
/* ==========================================================================
   UI — فقط چیزهایی که به «راحت‌تر خرید کردن» کمک می‌کنند.
   هیچ افکت تزئینی‌ای اینجا نیست: نوار سبد موبایل، دکمهٔ بازگشت به بالا،
   و همگام‌سازی شمارش سبد.
   ========================================================================== */
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- بازگشت به بالا ---------- */
  function toTop() {
    const b = $("#to-top");
    if (!b) return;
    b.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    let ticking = false;
    const update = () => { ticking = false; b.classList.toggle("on", (window.scrollY || 0) > innerHeight * 0.9); };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- نوار خرید چسبان (موبایل، صفحهٔ فروشگاه) ---------- */
  function stickyBuy() {
    if (document.body.dataset.page !== "shop") return;
    const bar = document.createElement("div");
    bar.id = "vx-sticky";
    bar.innerHTML =
      `<span class="vs-count"><b id="vs-num">۰</b><span data-i18n="sticky_pieces">${t("sticky_pieces")}</span></span>
       <span class="vs-total" id="vs-total">—</span>
       <button class="btn btn--sm" type="button" id="vs-open" data-i18n="sticky_view">${t("sticky_view")}</button>`;
    document.body.appendChild(bar);
    bar.querySelector("#vs-open").addEventListener("click", () => {
      const btn = document.getElementById("cart-open");
      if (btn) btn.click();
    });
    let ticking = false;
    const update = () => {
      ticking = false;
      const on = (window.scrollY || 0) > innerHeight * 0.7;
      bar.classList.toggle("on", on);
      document.body.classList.toggle("vx-sticky-on", on);
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    stickySync();
  }

  /* ---------- همگام‌سازی نوار سبد با محتوای سبد ---------- */
  function stickySync() {
    const n = document.getElementById("vs-num"), tot = document.getElementById("vs-total");
    if (!n || !tot) return;
    const count = typeof cartCount === "function" ? cartCount() : 0;
    n.textContent = num(count, state.lang);
    const sub = typeof cartSubtotal === "function" ? cartSubtotal() : 0;
    tot.textContent = sub ? money(sub, state.lang) : "";
  }

  function init() { toTop(); stickyBuy(); stickySync(); }

  return { init, toTop, stickyBuy, stickySync };
})();
try { window.UI = UI; window.FX = UI; } catch (e) {}


/* ---------- boot -------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = RTL.includes(state.lang) ? "rtl" : "ltr";
  if (document.body.dataset.page) {
    const tt = document.body.dataset["title" + (state.lang === "fa" ? "Fa" : "En")];
    if (tt) document.title = tt;
  }

  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });

  /* داخل تلگرام: تمام‌صفحه، پیش‌پر کردن نام کاربر */
  const tg = TG_APP();
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
    const u = tgUser();
    if (u) {
      const b = getBuyer();
      if (!b.name) setBuyer("name", [u.first_name, u.last_name].filter(Boolean).join(" "));
      if (!b.tg)   setBuyer("tg", u.username ? "@" + u.username : String(u.id));
    }
  }

  renderChrome();
  applyI18n();

  if ($("#featured-grid")) renderFeatured("#featured-grid");
  if ($("#soon-grid")) renderSoon();
  if ($("#shop-grid")) {
    const urlCat = new URLSearchParams(location.search).get("cat");
    if (urlCat && VORTEX.categories.some(c => c.id === urlCat)) state.filter = urlCat;
    renderCatFilters(); renderShop();
  }
  renderCart();
  observeReveal();
  UI.init();
  loadStock();

  /* contact page form → WhatsApp */
  const cf = $("#contact-form");
  if (cf) cf.addEventListener("submit", e => {
    e.preventDefault();
    const name = cf.name.value.trim(), phone = cf.phone.value.trim(), msg = cf.message.value.trim();
    if (!name || !msg) { toast(t("form_fill")); return; }
    const L = state.lang;
    const body = (L === "fa"
      ? `سلام ورتکس 👋\nنام: ${name}\nشماره: ${phone}\nپیام: ${msg}`
      : `Hi Vortex 👋\nName: ${name}\nPhone: ${phone}\nMessage: ${msg}`);
    window.open(`https://wa.me/${VORTEX.config.whatsapp}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  });
});
