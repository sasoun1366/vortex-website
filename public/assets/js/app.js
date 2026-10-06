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
  if (typeof FX !== "undefined" && FX.staggerGroups) FX.staggerGroups();
  FX.counters(false);
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
  const hasSizes = p.sizes && p.sizes.length;
  return `
  <article class="card reveal" data-id="${p.id}">
    <div class="card-media">
      ${badgeHtml(p)}
      <img src="${p.img}" alt="${pick(p.name, state.lang)}" loading="lazy">
      <div class="card-quick">
        <button class="btn btn--sm" type="button" data-open="${p.id}">${ICON.eye}<span data-i18n="m_add">${t("m_add")}</span></button>
      </div>
    </div>
    <div class="card-body">
      <span class="card-cat">${t("cat_" + p.cat + "_t")}</span>
      <h3 class="card-title"><a href="#" data-open="${p.id}">${pick(p.name, state.lang)}</a></h3>
      <p class="card-desc">${pick(p.desc, state.lang)}</p>
      <div class="card-foot">
        <span class="price">
          <b>${money(p.price, state.lang)}</b>
          ${p.oldPrice && p.oldPrice > p.price ? `<small>${money(p.oldPrice, state.lang)}</small>` : ""}
        </span>
        <button class="add-btn" type="button" data-add="${p.id}" title="${t("m_add")}" aria-label="${t("m_add")}">${ICON.plus}</button>
      </div>
    </div>
  </article>`;
}

function soonCard(item) {
  return `<article class="card card--soon reveal">
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
  $$("[data-add]", host).forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    const p = productById(b.dataset.add);
    if (p.sizes && p.sizes.length) openProduct(p.id);   // needs a size first
    else addToCart(p.id, "", 1, b);
  }));
  $$("[data-open]", host).forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    openProduct(b.dataset.open);
  }));
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
  state.orderDone = null;      // شروع سبد جدید → پنل موفقیت بسته می‌شود
  const found = state.cart.find(i => i.id === id && i.size === size);
  if (found) found.qty = Math.min(20, found.qty + qty);
  else state.cart.push({ id, size, qty });
  saveCart(); renderCart(); toast(t("toast_added"));
  if (srcEl) { try { FX.flyToCart(srcEl); FX.cartBump(); FX.cartBurst(srcEl); } catch (e) {} }
}

function setQty(idx, qty) {
  state.orderDone = null;
  if (qty <= 0) state.cart.splice(idx, 1);
  else state.cart[idx].qty = Math.min(20, qty);
  saveCart(); renderCart();
}

function renderCart() {
  const count = $("#cart-count");
  if (count) { count.textContent = new Intl.NumberFormat(state.lang === "fa" ? "fa-IR" : "en-US").format(cartCount()); count.classList.toggle("on", cartCount() > 0); }
  const dc = $("#drawer-count");
  if (dc) dc.textContent = cartCount() ? `${num(cartCount(), state.lang)} ${state.lang === "fa" ? "قطعه" : "items"}` : "";

  if (typeof FX !== "undefined" && FX.stickySync) { try { FX.stickySync(); } catch (e) {} }

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
    <button class="btn btn--block" type="button" id="checkout-wa">${ICON.wa} ${t("cart_wa")}</button>
    <button class="btn btn--block btn--dark" type="button" id="checkout-tg">${ICON.tg} ${t("cart_tg")}</button>
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
async function submitOrder() {
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
      initData: tgInit()
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || "order_failed");
  return data.code;
}

function orderSuccessHtml(code) {
  const botUrl = `https://t.me/${VORTEX.config.telegram}`;
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
        <a class="btn btn--block" href="${botUrl}" target="_blank" rel="noopener">${ICON.tg} ${t("order_ok_bot")}</a>
        <a class="btn btn--block btn--ghost btn--sm" href="shop.html">${t("order_ok_shop")}</a>
      </div>
    </div>`;
}

function showOrderSuccess(code) {
  state.orderDone = code;
  if (typeof FX !== "undefined" && FX.orderCelebrate) requestAnimationFrame(() => FX.orderCelebrate());
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

/* شمارش نرم مبلغ نهایی */
let lastTotal = null;
function animateTotal(total) {
  const el = $("#total-value");
  if (!el) return;
  if (lastTotal === null || lastTotal === total || typeof FX === "undefined") { el.textContent = money(total, state.lang); lastTotal = total; return; }
  const from = lastTotal, to = total, t0 = performance.now(), dur = 520;
  lastTotal = total;
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = money(from + (to - from) * eased, state.lang);
    if (k < 1) requestAnimationFrame(tick); else el.textContent = money(to, state.lang);
  })(t0);
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
let io;
function observeReveal(scope = document) {
  if (typeof FX !== "undefined" && FX.staggerGroups) FX.staggerGroups(scope);
  const els = $$(".reveal", scope);
  els.forEach((el, i) => { if (!el.style.getPropertyValue("--d") && !el.dataset.d && i < 12) el.style.setProperty("--d", (i % 6) * 70 + "ms"); });
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  io = io || new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
  els.forEach(e => io.observe(e));
}


/* ==========================================================================
   FX — لایهٔ جلوه‌های بصری: گرداب ذرات، تیلت سه‌بعدی، نورافکن، شمارنده،
        پرواز تصویر به سبد خرید، پارالاکس و نوار پیشرفت اسکرول
   ========================================================================== */
let vortexStop = null;   // توقف گرداب ۲بعدی وقتی لایهٔ ۳بعدی فعال می‌شود

const FX = (() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- گرداب ذرات در هیرو (canvas) ---------- */
  function vortex() {
    const c = $("#vortex-canvas");
    if (!c || reduce) return;
    if (document.documentElement.dataset.hero3d === "1") return;   // لایهٔ ۳بعدی صحنه را گرفته
    const ctx = c.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1, parts = [], raf = null, running = false, t = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const isSmall = () => window.innerWidth < 720;
    const count = () => (isSmall() ? 38 : 96);

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed(n) {
      parts = Array.from({ length: n }, () => {
        const rr = 60 + Math.random() * Math.max(w, h) * 0.62;
        return {
          a: Math.random() * Math.PI * 2,
          r: rr,
          r0: rr,
          s: 0.0016 + Math.random() * 0.0038,
          pull: 0.16 + Math.random() * 0.5,
          sz: 0.7 + Math.random() * 1.9,
          o: 0.12 + Math.random() * 0.5,
          hue: Math.random()
        };
      });
    }
    function frame() {
      if (!running) return;
      t += 0.006;
      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.62, cy = h * 0.44;
      ctx.globalCompositeOperation = "lighter";

      for (const p of parts) {
        p.a += p.s;
        p.r -= p.pull;
        if (p.r < 18) { p.r = p.r0; p.a = Math.random() * Math.PI * 2; }

        const wob = Math.sin(t * 1.6 + p.r * 0.01) * 12;
        const x = cx + Math.cos(p.a) * (p.r + wob) + pointer.x * 22 * (1 - p.r / (p.r0 + 1));
        const y = cy + Math.sin(p.a) * (p.r + wob) * 0.62 + pointer.y * 20 * (1 - p.r / (p.r0 + 1));

        const fade = clamp(p.r / (p.r0 * 0.9), 0.15, 1);
        const alpha = p.o * fade;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.sz * 9);
        g.addColorStop(0, `rgba(211,223,169,${alpha})`);
        g.addColorStop(0.35, `rgba(124,140,75,${alpha * 0.75})`);
        g.addColorStop(1, "rgba(124,140,75,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, p.sz * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce) return; running = true; frame(); }
    function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    vortexStop = stop;

    resize(); seed(count());
    window.addEventListener("resize", () => { resize(); seed(count()); }, { passive: true });
    if (canHover) {
      window.addEventListener("mousemove", e => {
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    const host = document.querySelector(".hero");
    if (host && "IntersectionObserver" in window) {
      new IntersectionObserver(en => en[0].isIntersecting ? start() : stop(), { threshold: 0.04 }).observe(host);
    } else { start(); }
  }

  /* ---------- تیلت سه‌بعدی + نورافکن ---------- */
  function pointerFx() {
    let active = null, mx = 0, my = 0, cx = 0, cy = 0, raf = null;
    const targets = ".card, .cat-card, .cta-band";

    function setVars(el, x, y) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((x - r.left) / r.width * 100) + "%");
      el.style.setProperty("--my", ((y - r.top) / r.height * 100) + "%");
    }
    function loop() {
      cx += (mx - cx) * 0.14; cy += (my - cy) * 0.14;
      if (active) {
        const r = active.getBoundingClientRect();
        const nx = (cx - r.left) / r.width, ny = (cy - r.top) / r.height;
        active.style.transform =
          `perspective(900px) rotateY(${(nx - .5) * 7}deg) rotateX(${(.5 - ny) * 7}deg) translateY(-5px)`;
      }
      raf = (active || Math.abs(mx - cx) > .6) ? requestAnimationFrame(loop) : null;
    }
    document.addEventListener("mousemove", e => {
      const el = e.target.closest ? e.target.closest(targets) : null;
      if (el) setVars(el, e.clientX, e.clientY);
      if (!canHover) return;
      mx = e.clientX; my = e.clientY;
      if (el !== active) {
        if (active) { active.style.transform = ""; active.classList.remove("is-tilting"); }
        active = el;
        if (active) active.classList.add("is-tilting");
        if (!raf) raf = requestAnimationFrame(loop);
      }
    }, { passive: true });
    document.addEventListener("mouseleave", () => {
      if (active) { active.style.transform = ""; active.classList.remove("is-tilting"); active = null; }
    });
    document.addEventListener("mouseover", e => {
      const el = e.target.closest ? e.target.closest(targets) : null;
      if (el && canHover) el.classList.add("is-tilting");
    }, { passive: true });
  }

  /* ---------- پارالاکس هیرو + header + پیشرفت اسکرول ---------- */
  function scrollFx() {
    const hero = $(".hero");
    const pxs = parallaxEls();
    const bar = $("#vx-progress i");
    const header = $(".site-header");
    let ticking = false;
    function update() {
      ticking = false;
      const y = window.scrollY || 0;
      if (hero && !reduce) {
        const p = clamp(y / Math.max(1, hero.offsetHeight), 0, 1);
        hero.style.setProperty("--parallax", (p * 90).toFixed(1) + "px");
        if (p > 0.02) hero.style.setProperty("--heroFade", String(1 - p * 0.4));
      }
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + "%";
      }
      if (header) header.classList.toggle("is-scrolled", y > 12);
      if (pxs.length) parallaxUpdate(pxs);
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---------- شمارندهٔ اعداد ---------- */
  function counters(animate = true) {
    $$("[data-count]").forEach(el => {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffixKey ? t(el.dataset.suffixKey) : (el.dataset.suffix || "");
      const fmt = n => new Intl.NumberFormat(state.lang === "fa" ? "fa-IR" : "en-US").format(Math.round(n)) + suffix;
      if (!animate || reduce || el.dataset.done) { el.textContent = fmt(target); return; }
      el.dataset.done = "1";
      const dur = 1200, t0 = performance.now();
      (function tick(now) {
        const k = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(target * eased);
        if (k < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
      })(t0);
    });
  }

  /* ---------- پرواز تصویر محصول به سبد ---------- */
  function flyToCart(srcEl) {
    const cartBtn = $("#cart-open");
    if (!srcEl || !cartBtn || reduce) return;
    const img = srcEl.tagName === "IMG"
      ? srcEl
      : (srcEl.querySelector("img") || (srcEl.closest(".card, .cat-card, .modal-grid") || document).querySelector("img"));
    if (!img) return;
    const from = img.getBoundingClientRect(), to = cartBtn.getBoundingClientRect();
    const node = img.cloneNode(true);
    node.className = "vx-fly";
    const size = Math.min(120, from.width * 0.5);
    Object.assign(node.style, {
      left: from.left + from.width / 2 - size / 2 + "px",
      top: from.top + from.height / 2 - size / 2 + "px",
      width: size + "px", height: size + "px"
    });
    document.body.appendChild(node);
    requestAnimationFrame(() => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      node.style.transform = `translate(${dx}px, ${dy}px) scale(.22) rotate(14deg)`;
      node.style.opacity = ".15";
    });
    setTimeout(() => node.remove(), 900);
  }
  function cartBump() {
    const badge = $("#cart-count"), btn = $("#cart-open");
    if (badge) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
    if (btn) { btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse"); setTimeout(() => btn.classList.remove("pulse"), 750); }
  }

  /* ---------- انیمیشن ورودِ انیمیشن‌دار آیکون‌ها ---------- */
  function drawIcons(scope = document) {
    $$(".check-list li", scope).forEach((li, i) => {
      li.style.transitionDelay = (i * 90) + "ms";
      li.classList.add("reveal");
      li.style.setProperty("--ry", "14px");
    });
  }


  /* ---------- لودر اولیه ---------- */
  function loader() {
    const el = $("#vx-loader");
    if (!el) return;
    const finish = () => {
      el.classList.add("done");
      document.documentElement.classList.add("vx-ready");
      setTimeout(() => el.remove(), 800);
    };
    if (reduce) return finish();
    const t0 = performance.now(), min = 620;   // کمتر از این، مثل فلاش دیده می‌شود
    const go = () => setTimeout(finish, Math.max(0, min - (performance.now() - t0)));
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    setTimeout(finish, 3200);                  // سقف ایمنی
  }

  /* ---------- بازگشت به بالا ---------- */
  function toTop() {
    if ($("#to-top")) return;
    const b = document.createElement("button");
    b.id = "to-top"; b.type = "button"; b.setAttribute("aria-label", t("to_top"));
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
    document.body.appendChild(b);
    const sync = () => b.classList.toggle("on", (window.scrollY || 0) > 700);
    addEventListener("scroll", sync, { passive: true }); sync();
    b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  }

  /* ---------- لایت‌باکس گالری ---------- */
  function lightbox() {
    /* دکمهٔ بزرگ‌نمایی روی تایل‌های گالری (لینک فروشگاه دست‌نخورده می‌ماند) */
    $$(".gal").forEach(tile => {
      const img = tile.querySelector("img");
      if (!img || tile.querySelector(".gal-zoom")) return;
      const b = document.createElement("button");
      b.className = "gal-zoom"; b.type = "button";
      b.setAttribute("aria-label", t("gal_zoom"));
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-3.6-3.6"/></svg>`;
      tile.appendChild(b);
    });

    /* فاز capture: باید قبل از pageTransitions اجرا شود تا کلیک روی دکمهٔ
       بزرگ‌نمایی باعث پرش به صفحهٔ فروشگاه نشود */
    document.addEventListener("click", e => {
      const zoomBtn = e.target.closest && e.target.closest(".gal-zoom");
      if (zoomBtn) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const img = zoomBtn.closest(".gal").querySelector("img");
        if (img) openLightbox(img);
        return;
      }
      const z = e.target.closest && e.target.closest("[data-zoom]");
      if (z) { e.stopImmediatePropagation(); openLightbox(z); }
    }, true);
  }

  let lbState = null;
  function openLightbox(srcImg) {
    if (!srcImg) return;
    const list = $$(".gal img").filter(i => i.closest(".gal") && !i.closest(".vx-lightbox"));
    const idx = list.indexOf(srcImg);
    lbState = { list: list.length && idx >= 0 ? list : [srcImg], idx: list.length && idx >= 0 ? idx : 0 };
    const box = document.createElement("div");
    box.className = "vx-lightbox";
    const many = lbState.list.length > 1;
    box.innerHTML =
      `<button class="vx-lb-close" type="button" aria-label="${t("lb_close")}">×</button>
       ${many ? `<button class="vx-lb-nav vx-lb-prev" type="button" aria-label="${t("lb_prev")}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg></button>
         <button class="vx-lb-nav vx-lb-next" type="button" aria-label="${t("lb_next")}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg></button>
         <span class="vx-lb-count">${num(lbState.idx + 1, state.lang)} / ${num(lbState.list.length, state.lang)}</span>` : ""}`;
    const big = lbState.list[lbState.idx].cloneNode(true);
    big.removeAttribute("loading"); big.removeAttribute("srcset");
    big.className = "vx-lb-img";
    box.insertBefore(big, box.firstChild);
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add("on"));

    if (many) {
      $(".vx-lb-prev", box).addEventListener("click", e => { e.stopPropagation(); lightboxStep(-1); });
      $(".vx-lb-next", box).addEventListener("click", e => { e.stopPropagation(); lightboxStep(1); });
    }
    const close = () => {
      box.classList.remove("on");
      lbState = null;
      setTimeout(() => box.remove(), 300);
      document.removeEventListener("keydown", onKey);
      box.removeEventListener("touchstart", onTouchStart);
      box.removeEventListener("touchend", onTouchEnd);
    };
    function onKey(ev) {
      if (ev.key === "Escape") return close();
      if (!many) return;
      const rtl = document.documentElement.dir === "rtl";
      if (ev.key === "ArrowRight") lightboxStep(rtl ? -1 : 1);
      if (ev.key === "ArrowLeft") lightboxStep(rtl ? 1 : -1);
    }
    let sx = 0;
    function onTouchStart(ev) { sx = ev.changedTouches[0].clientX; }
    function onTouchEnd(ev) {
      const dx = ev.changedTouches[0].clientX - sx;
      if (Math.abs(dx) < 42 || !many) return;
      const rtl = document.documentElement.dir === "rtl";
      lightboxStep((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
    }
    document.addEventListener("keydown", onKey);
    box.addEventListener("touchstart", onTouchStart, { passive: true });
    box.addEventListener("touchend", onTouchEnd, { passive: true });
    big.addEventListener("click", e => e.stopPropagation());
    box.addEventListener("click", close);
  }
  function lightboxStep(dir) {
    if (!lbState) return;
    const box = $(".vx-lightbox"), cur = box && $(".vx-lb-img", box);
    if (!box || !cur) return;
    const n = lbState.list.length;
    lbState.idx = (lbState.idx + dir + n) % n;
    const next = lbState.list[lbState.idx].cloneNode(true);
    next.removeAttribute("loading"); next.removeAttribute("srcset");
    next.className = "vx-lb-img vx-lb-swap";
    cur.replaceWith(next);
    const c = $(".vx-lb-count", box);
    if (c) c.textContent = `${num(lbState.idx + 1, state.lang)} / ${num(n, state.lang)}`;
  }

  /* ---------- پشتیبانی data-reveal و data-stagger ---------- */
  function staggerGroups(scope = document) {
    $$("[data-stagger]", scope).forEach(group => {
      const step = Number(group.dataset.stagger) || 90;
      $$("[data-reveal], .reveal", group).forEach((el, i) => el.style.setProperty("--d", `${i * step}ms`));
    });
    $$("[data-reveal]", scope).forEach(el => el.classList.add("reveal"));
  }

  /* ---------- نشان چرخان «Season 01» ---------- */
  function spinBadge() {
    $$(".rot-badge").forEach(el => { if (!reduce) el.style.animation = "vx-spin 26s linear infinite"; });
  }


  /* ==================== بستهٔ جلوه‌های تازه (FX2) ==================== */

  /* ---------- ریل پیمایش بخش‌ها + هایلایت ناوبری ---------- */
  function sectionRail() {
    const secs = $$("[data-rail]");
    if (!secs.length) return;
    const nav = document.createElement("nav");
    nav.className = "vx-rail";
    nav.setAttribute("aria-label", t("rail_label"));
    nav.innerHTML = `<span class="vx-rail-line"><i></i></span>` + secs.map((s, i) =>
      `<a class="vx-rail-dot" href="#${s.id}" data-i="${i}"><i></i><span data-i18n="${s.dataset.rail}">${t(s.dataset.rail)}</span></a>`
    ).join("");
    document.body.appendChild(nav);
    const dots = $$(".vx-rail-dot", nav), fill = $(".vx-rail-line i", nav);
    let active = -1, ticking = false;
    function update() {
      ticking = false;
      const mid = innerHeight * 0.42;
      let idx = 0;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) idx = i; });
      if (idx !== active) {
        active = idx;
        dots.forEach((d, k) => d.classList.toggle("on", k === idx));
        /* هایلایت لینک متناظر در منو */
        const id = secs[idx].id;
        $$(".nav a[href], #mobile-nav a[href]").forEach(a => {
          const h = a.getAttribute("href") || "";
          a.classList.toggle("is-current", h === "#" + id || (id === "shop" && /shop\.html$/.test(h)));
        });
      }
      const max = document.documentElement.scrollHeight - innerHeight;
      if (fill) fill.style.height = (max > 0 ? clamp(scrollY / max, 0, 1) * 100 : 0) + "%";
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update, { passive: true });
    dots.forEach(d => d.addEventListener("click", e => {
      e.preventDefault();
      const s = secs[+d.dataset.i];
      if (s) window.scrollTo({ top: s.offsetTop - 56, behavior: reduce ? "auto" : "smooth" });
    }));
    update();
    requestAnimationFrame(() => nav.classList.add("on"));
  }

  /* ---------- ورود ماسک‌دار عنوان هیرو بعد از لودر ---------- */
  function heroReveal() {
    const inner = $(".hero-inner");
    if (!inner || reduce) return;
    inner.classList.add("vx-hero-prep");
    let n = 0;
    const run = () => {
      if (document.documentElement.classList.contains("vx-ready") || ++n > 45) {
        inner.classList.add("vx-in");
        setTimeout(() => inner.classList.remove("vx-hero-prep"), 1600);
      } else setTimeout(run, 80);
    };
    setTimeout(run, 80);
  }

  /* ---------- چرخش پیام‌های نوار اعلان ---------- */
  function announceRotate() {
    const keys = ["announce", "announce2", "announce3"];
    if (reduce || !$(".announce")) return;
    const el = () => document.querySelector(".announce");
    let i = 0;
    const paint = n => {
      const e = el();
      if (!e) return;
      e.innerHTML = t(keys[n]);
      e.dataset.rot = String(n);
    };
    /* تا وقتی کاربر واقعاً نشانگر را حرکت نداده، هاور را نادیده بگیر
       (کروم وقتی چیدمان زیر نشانگرِ ثابت عوض شود رویداد هاور جعلی می‌فرستد) */
    let moved = false;
    window.addEventListener("mousemove", () => { moved = true; }, { once: true, passive: true });
    setInterval(() => {
      const e = el();
      if (!e || document.hidden || (moved && e.matches(":hover"))) return;
      i = (i + 1) % keys.length;
      e.classList.add("vx-ann-out");
      setTimeout(() => {
        paint(i);
        const e2 = el();
        if (!e2) return;
        e2.classList.remove("vx-ann-out");
        e2.classList.add("vx-ann-in");
        setTimeout(() => e2.classList.remove("vx-ann-in"), 480);
      }, 300);
    }, 5600);
    /* هدر ممکن است دوباره رندر شود (مثلاً با تغییر زبان) → پیام جاری را برگردان */
    setInterval(() => {
      const e = el();
      if (e && e.dataset.rot !== String(i)) paint(i);
    }, 900);
  }

  /* ---------- میتر موجودی + شمارش معکوس زندهٔ دراپ ---------- */
  function dropLive() {
    const meter = $("[data-drop-meter]");
    const clock = $("[data-drop-clock]");
    if (!meter && !clock) return;
    const pct = meter ? clamp(parseInt(meter.dataset.pct, 10) || 62, 0, 100) : 0;
    const stock = meter ? (parseInt(meter.dataset.stock, 10) || 150) : 0;

    /* شمارش معکوس: ددلاین در localStorage نگه داشته می‌شود تا همان دراپ ادامه پیدا کند */
    let end = 0;
    try {
      end = parseInt(localStorage.getItem("vx-drop-end") || "0", 10) || 0;
      if (!end || end < Date.now()) {
        end = Date.now() + 48 * 3600 * 1000;
        localStorage.setItem("vx-drop-end", String(end));
      }
    } catch (e) { end = Date.now() + 48 * 3600 * 1000; }

    const pctEl = $("[data-drop-pct]", meter || document);
    const leftEl = $("[data-drop-left]", meter || document);
    const bar = $(".dm-bar i", meter || document);

    function tickClock() {
      if (!clock) return;
      let d = Math.max(0, end - Date.now());
      const h = Math.floor(d / 3.6e6), mi = Math.floor(d % 3.6e6 / 6e4), se = Math.floor(d % 6e4 / 1e3);
      const pad = n => String(n).padStart(2, "0");
      clock.textContent = [h, mi, se].map(v => num(pad(v), state.lang)).join(":");
    }
    tickClock();
    setInterval(tickClock, 1000);

    if (!meter) return;
    const run = () => {
      meter.classList.add("on");
      if (reduce) {
        if (bar) bar.style.width = pct + "%";
        if (pctEl) pctEl.textContent = num(pct, state.lang) + "٪";
        if (leftEl) leftEl.textContent = num(Math.round(stock * (100 - pct) / 100), state.lang) + (state.lang === "fa" ? " قطعه" : " pcs");
        return;
      }
      const t0 = performance.now(), dur = 1400;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        if (bar) bar.style.width = (pct * e).toFixed(1) + "%";
        if (pctEl) pctEl.textContent = num(Math.round(pct * e), state.lang) + "٪";
        if (k < 1) requestAnimationFrame(step);
        else {
          if (leftEl) leftEl.textContent = num(Math.round(stock * (100 - pct) / 100), state.lang) + (state.lang === "fa" ? " قطعه" : " pcs");
          meter.classList.add("done");
        }
      })(t0);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: .35 });
      io.observe(meter);
    } else run();
  }

  /* ---------- انفجار ذرات (افزودن به سبد / موفقیت سفارش) ---------- */
  function burstAt(x, y, n = 14, big = false) {
    if (reduce) return;
    const host = document.createElement("div");
    host.className = "vx-burst";
    host.style.left = x + "px"; host.style.top = y + "px";
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      const a = Math.random() * Math.PI * 2, d = (big ? 60 : 26) + Math.random() * (big ? 130 : 58);
      s.style.setProperty("--bx", (Math.cos(a) * d).toFixed(1) + "px");
      s.style.setProperty("--by", (Math.sin(a) * d - (big ? 40 : 8)).toFixed(1) + "px");
      s.style.setProperty("--bd", (.55 + Math.random() * .65).toFixed(2) + "s");
      s.style.setProperty("--bs", (3 + Math.random() * (big ? 5 : 4)).toFixed(1) + "px");
      s.style.setProperty("--br", Math.random() * 180 + "deg");
      host.appendChild(s);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), big ? 1500 : 1100);
  }
  function cartBurst(srcEl) {
    if (!srcEl || !srcEl.getBoundingClientRect) return;
    const r = srcEl.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top + r.height / 2, 14);
  }
  function orderCelebrate() {
    const panel = $(".drawer .empty") || $(".drawer-body .empty");
    if (!panel) return;
    const svg = panel.querySelector("svg");
    if (svg) { svg.classList.add("vx-draw"); }
    const r = panel.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top + Math.min(120, r.height / 2), 26, true);
  }

  /* ---------- پارالاکس تصاویر نشان‌دار ---------- */
  function parallaxEls() {
    const els = $$("[data-parallax]");
    if (!els.length || reduce) return [];
    return els;
  }
  function parallaxUpdate(els) {
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const rate = parseFloat(el.dataset.parallax) || .05;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // -1 → 1
      el.style.setProperty("--py", (-p * rate * 1000).toFixed(1) + "px");
    });
  }

  /* ---------- نوار خرید چسبان موبایل ---------- */
  function stickyBuy() {
    if (!document.body.dataset.page || document.body.dataset.page !== "shop") return;
    const bar = document.createElement("div");
    bar.id = "vx-sticky";
    bar.innerHTML =
      `<span class="vs-count"><b id="vs-num">۰</b><span data-i18n="sticky_pieces">${t("sticky_pieces")}</span></span>
       <span class="vs-total" id="vs-total">—</span>
       <button class="btn btn--sm" type="button" id="vs-open" data-i18n="sticky_view">${t("sticky_view")}</button>`;
    document.body.appendChild(bar);
    $(".vs-count span", bar).setAttribute("data-i18n", "sticky_pieces");
    bar.querySelector("#vs-open").addEventListener("click", () => {
      const btn = document.getElementById("cart-open");
      if (btn) btn.click();
    });
    let ticking = false;
    function update() {
      ticking = false;
      const on = scrollY > innerHeight * 0.7;
      bar.classList.toggle("on", on);
      document.body.classList.toggle("vx-sticky-on", on);
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    stickySync();
  }
  function stickySync() {
    const n = document.getElementById("vs-num"), tot = document.getElementById("vs-total");
    if (!n || !tot) return;
    const count = typeof cartCount === "function" ? cartCount() : 0;
    n.textContent = num(count, state.lang);
    const sub = typeof cartSubtotal === "function" ? cartSubtotal() : 0;
    tot.textContent = sub ? money(sub, state.lang) : "";
  }

  /* ---------- روشن‌شدن نرم محتوا هنگام تغییر زبان ---------- */
  function langFade() {
    document.addEventListener("click", e => {
      const b = e.target.closest && e.target.closest("[data-lang]");
      if (!b || reduce) return;
      document.documentElement.classList.add("vx-lang-fade");
      setTimeout(() => document.documentElement.classList.remove("vx-lang-fade"), 420);
    }, true);
  }

  /* ---------- راه‌اندازی ---------- */
  function init() {
    const bar = document.createElement("div");
    bar.id = "vx-progress"; bar.innerHTML = "<i></i>";
    document.body.appendChild(bar);

    loader(); vortex(); pointerFx(); scrollFx(); counters(); toTop(); lightbox(); staggerGroups(); spinBadge();
    sectionRail(); heroReveal(); announceRotate(); dropLive(); stickyBuy(); langFade();
    drawIcons();

    /* شمارنده‌ها فقط وقتی در دید قرار گرفتند بشمارند */
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { counters(true); io.disconnect(); }
      }), { threshold: .3 });
      const host = $(".hero-stats") || $(".strip");
      if (host) io.observe(host);
    }
  }

  function stopVortex() { if (vortexStop) vortexStop(); }

  return { init, counters, flyToCart, cartBump, drawIcons, staggerGroups, stopVortex,
           cartBurst, orderCelebrate, stickySync, parallaxUpdate, parallaxEls, burstAt };
})();
try { window.FX = FX; } catch (e) {}

/* ---------- گذار نرم بین صفحات ------------------------------------------ */
function pageTransitions() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")
        || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!/\.html|^\/?$/.test(href)) return;
    e.preventDefault();
    const veil = document.createElement("div");
    Object.assign(veil.style, {
      position: "fixed", inset: "0", zIndex: 300, pointerEvents: "none",
      background: "radial-gradient(circle at 50% 50%,rgba(124,140,75,.22),rgba(10,11,8,.94) 70%)",
      opacity: "0", transition: "opacity .32s cubic-bezier(.22,.61,.36,1)"
    });
    document.body.appendChild(veil);
    requestAnimationFrame(() => { veil.style.opacity = "1"; });
    setTimeout(() => { location.href = href; }, 300);
  });
}

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
  FX.init();
  pageTransitions();

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
