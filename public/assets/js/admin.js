/* ==========================================================================
   VORTEX — پنل مدیریت (سمت مرورگر)
   --------------------------------------------------------------------------
   • ورود با رمز (توکن امضاشده در localStorage نگه داشته می‌شود)
   • سفارش‌ها / محصولات / متن‌ها / تصاویر / تنظیمات / ظاهر و چیدمان
   • هر تغییری که ذخیره شود، همان لحظه روی سایت زنده اعمال می‌شود.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const FA = new Intl.NumberFormat("fa-IR");
  const money = (n) => `${FA.format(Math.round(Number(n) || 0))} تومان`;
  const KEY = "vx-admin-token";

  const STATUS = {
    new:       { fa: "جدید — منتظر پرداخت",      cls: "pill--warn" },
    paycheck:  { fa: "پرداخت اعلام شد — بررسی کن", cls: "pill--warn" },
    paid:      { fa: "پرداخت تأییدشده",           cls: "pill--ok" },
    ready:     { fa: "آمادهٔ ارسال",              cls: "pill--ok" },
    shipped:   { fa: "ارسال شد",                 cls: "pill--ok" },
    cancelled: { fa: "لغو شده",                  cls: "pill--bad" },
    done:      { fa: "بسته‌شده",                  cls: "pill--off" },
  };
  const CATS = [
    { id: "apparel", fa: "پوشاک" },
    { id: "accessory", fa: "اکسسوری" },
    { id: "gear", fa: "تجهیزات تمرین" },
  ];
  const SECTIONS = [
    { k: "why",     fa: "چرا ورتکس (ویژگی‌ها)" },
    { k: "cats",    fa: "دسته‌بندی‌ها" },
    { k: "shop",    fa: "محصولات منتخب" },
    { k: "drop",    fa: "کالکشن محدود (دراپ)" },
    { k: "story",   fa: "داستان برند" },
    { k: "howto",   fa: "راهنمای خرید (۳ مرحله)" },
    { k: "soon",    fa: "به‌زودی" },
    { k: "gallery", fa: "گالری عکس" },
    { k: "words",   fa: "نظر مشتری‌ها" },
  ];
  const SLOTS = [
    { k: "logo",          fa: "لوگو (هدر و فوتر)" },
    { k: "hero",          fa: "عکس بزرگ صفحهٔ اول" },
    { k: "cat_apparel",   fa: "دستهٔ پوشاک" },
    { k: "cat_accessory", fa: "دستهٔ اکسسوری" },
    { k: "cat_gear",      fa: "دستهٔ تجهیزات" },
    { k: "drop",          fa: "بخش کالکشن محدود" },
    { k: "story",         fa: "بخش داستان برند" },
    { k: "gal1",          fa: "گالری ۱" }, { k: "gal2", fa: "گالری ۲" },
    { k: "gal3",          fa: "گالری ۳" }, { k: "gal4", fa: "گالری ۴" }, { k: "gal5", fa: "گالری ۵" },
    { k: "about1",        fa: "درباره ما ۱" }, { k: "about2", fa: "درباره ما ۲" },
    { k: "about3",        fa: "درباره ما ۳" }, { k: "about4", fa: "درباره ما ۴" },
  ];
  const ACCENTS = ["#7C8C4B", "#B3C37A", "#5F7A3A", "#8FA34E", "#C6D46A", "#D9B45A", "#C4573A", "#4E7FA3"];
  const BGS = ["#0A0B08", "#0F1109", "#070806", "#101208"];

  const GROUP_LABELS = {
    nav: "منوی بالا", hero: "بالای صفحهٔ اول", home: "صفحهٔ اصلی", why: "ویژگی‌ها", s3: "ویژگی‌ها",
    cat: "دسته‌بندی", drop: "کالکشن محدود", story: "داستان برند", how: "راهنمای خرید", soon: "به‌زودی",
    gal: "گالری", testi: "نظر مشتری‌ها", t: "نقل‌قول‌ها", about: "درباره ما", team: "تیم",
    shop: "فروشگاه", m: "صفحهٔ محصول", cart: "سبد خرید", pay: "پرداخت", order: "سفارش",
    ord: "پیگیری سفارش", track: "پیگیری سفارش", contact: "تماس", faq: "سوال‌های پرتکرار",
    f: "فوتر", btn: "دکمه‌ها", form: "فرم‌ها", toast: "پیام‌های کوچک", a: "درباره ما", b: "بنر",
    legal: "قوانین", err: "خطاها", ship: "ارسال", rail: "نوار کنار", band: "نوار برند",
  };

  let token = localStorage.getItem(KEY) || "";
  let DATA = null;                        // { site, products, orders, stock }
  let TAB = "orders";
  let textsDraft = { fa: {}, en: {} };    // تغییرهای ذخیره‌نشدهٔ متن‌ها
  let imgDirty = {};                      // تغییرهای ذخیره‌نشدهٔ تصاویر

  /* ---------- ارتباط با سرور --------------------------------------------- */
  async function api(path, body) {
    const r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...(token ? { "x-vx-admin": token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    let j = {};
    try { j = await r.json(); } catch (e) {}
    /* فقط اگر جلسه منقضی شده باشد خارج می‌شویم؛ ۴۰۱ صفحهٔ ورود پیام خودش را دارد */
    if (r.status === 401 && !path.endsWith("/login")) { logout(true); throw new Error("unauthorized"); }
    return j;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 2600);
  }

  /* ---------- ورود/خروج --------------------------------------------------- */
  function showLogin() { $("#login").classList.remove("hidden"); $("#panel").classList.add("hidden"); $("#logout").classList.add("hidden"); }
  function showPanel() { $("#login").classList.add("hidden"); $("#panel").classList.remove("hidden"); $("#logout").classList.remove("hidden"); }

  function logout(silent) {
    token = ""; localStorage.removeItem(KEY);
    if (!silent) toast("خارج شدی");
    showLogin();
  }

  $("#logout").addEventListener("click", () => logout());

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = $("#pw").value;
    const btn = $("#login-btn"), html = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    $("#login-err").textContent = "";
    try {
      const j = await api("/api/admin/login", { password: pw });
      if (j.ok && j.token) {
        token = j.token; localStorage.setItem(KEY, token);
        await boot();
      } else if (j.error === "wrong_password") {
        $("#login-err").textContent = "رمز اشتباه است";
      } else if (j.error === "no_password_set") {
        $("#login-err").textContent = "رمز پنل روی سرور تنظیم نشده — به پشتیبانی بگو.";
      } else {
        $("#login-err").textContent = "ورود نشد، یک بار دیگر تلاش کن";
      }
    } catch (err) {
      $("#login-err").textContent = "ارتباط با سرور برقرار نشد";
    }
    btn.disabled = false; btn.innerHTML = html;
  });

  /* ---------- بارگذاری داده ---------------------------------------------- */
  async function reload() {
    const j = await api("/api/admin/data");
    if (!j.ok) throw new Error("load");
    DATA = j;
    textsDraft = { fa: {}, en: {} };
    imgDirty = {};
  }

  async function boot() {
    try {
      await reload();
      showPanel();
      renderTabs();
      render();
    } catch (e) {
      if (token) { showPanel(); toast("داده‌ها بارگذاری نشد — دوباره تلاش کن"); }
    }
  }

  /* ---------- تب‌ها -------------------------------------------------------- */
  function renderTabs() {
    const T = [
      ["orders",   "🧾 سفارش‌ها", DATA.orders.length],
      ["products", "📦 محصولات", DATA.products.length],
      ["texts",    "✏️ متن‌های سایت"],
      ["images",   "🖼 تصاویر"],
      ["settings", "⚙️ تنظیمات"],
      ["layout",   "🎨 ظاهر و چیدمان"],
    ];
    $("#tabs").innerHTML = T.map(([k, fa, n]) =>
      `<button class="tab ${TAB === k ? "is-on" : ""}" data-tab="${k}">${fa}${n != null ? `<span class="n">${FA.format(n)}</span>` : ""}</button>`
    ).join("");
    $$("#tabs .tab").forEach((b) => b.addEventListener("click", () => { TAB = b.dataset.tab; renderTabs(); render(); }));
  }

  /* رندر مجدد + برگرداندن فوکوس به همان فیلد (تا تایپ کردن قطع نشود) */
  function rerender(focusSel) {
    render();
    if (focusSel) {
      const el = $(focusSel);
      if (el) {
        el.focus();
        const n = el.value.length;
        try { el.setSelectionRange(n, n); } catch (e) {}
      }
    }
  }

  function render() {
    const v = $("#view");
    if (TAB === "orders") v.innerHTML = viewOrders();
    else if (TAB === "products") v.innerHTML = viewProducts();
    else if (TAB === "texts") v.innerHTML = viewTexts();
    else if (TAB === "images") v.innerHTML = viewImages();
    else if (TAB === "settings") v.innerHTML = viewSettings();
    else if (TAB === "layout") v.innerHTML = viewLayout();
    bind();
  }

  /* ======================================================================
     سفارش‌ها
     ====================================================================== */
  let orderFilter = "all";

  function viewOrders() {
    const list = DATA.orders.filter((o) => orderFilter === "all" || o.status === orderFilter);
    const chips = [["all", "همه"], ...Object.keys(STATUS).map((k) => [k, STATUS[k].fa])];
    return `
      <div class="card">
        <h2>سفارش‌ها</h2>
        <p class="lead">هر سفارش را از همین‌جا جلو ببر: تأیید پرداخت → گرفتن آدرس → ارسال → کد رهگیری. پیام‌ها خودکار برای مشتری می‌رود.</p>
        <div class="row">${chips.map(([k, fa]) =>
          `<button class="btn btn--sm ${orderFilter === k ? "btn--primary" : "btn--ghost"}" data-ofilter="${k}">${fa}</button>`).join("")}
        </div>
      </div>
      ${list.length ? list.map(orderCard).join("") : `<div class="card"><p class="lead" style="margin:0">سفارشی با این وضعیت نیست.</p></div>`}
    `;
  }

  function orderCard(o) {
    const st = STATUS[o.status] || { fa: o.status, cls: "pill--off" };
    const items = (o.items || []).map((i) =>
      `• ${esc(i.name)}${i.size ? ` (${esc(i.size)})` : ""} × ${FA.format(i.qty || 1)}`).join("<br>");
    const d = new Date(o.ts || Date.now());
    const when = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" }).format(d);
    const canPay = ["new", "paycheck", "ready"].includes(o.status);
    const canShip = ["paid", "ready"].includes(o.status);
    return `
    <div class="order" data-order="${esc(o.code)}">
      <div class="oh">
        <span class="code mono">${esc(o.code)}</span>
        <span class="pill ${st.cls}">${st.fa}</span>
        <span class="meta">${when}</span>
        ${o.chatId ? `<span class="pill pill--ok">از تلگرام</span>` : `<span class="pill pill--off">از سایت</span>`}
        <span class="sp" style="flex:1"></span>
        <b>${money(o.totals && o.totals.total)}</b>
      </div>
      <div class="items">${items}</div>
      <div class="meta">
        👤 ${esc((o.buyer && o.buyer.name) || "—")} · 📞 ${esc((o.buyer && o.buyer.phone) || "—")}
        ${(o.buyer && o.buyer.addr) ? `<br>📍 ${esc(o.buyer.addr)}` : ""}
        ${o.tracking ? `<br>📮 کد رهگیری: <span class="mono">${esc(o.tracking)}</span>` : ""}
      </div>
      ${o.payRef ? `<div class="refbox">🧾 کد پیگیری اعلامی مشتری: <b class="mono">${esc(o.payRef)}</b> — با پیامک بانک تطبیق بده</div>` : ""}
      <div class="acts">
        ${canPay ? `<button class="btn btn--primary btn--sm" data-oact="pay">✅ پرداخت تأیید شد</button>` : ""}
        ${canShip ? `<button class="btn btn--sm" data-oact="ship">🚚 ارسال شد</button>` : ""}
        <button class="btn btn--sm" data-oact="track">📮 ثبت کد رهگیری</button>
        ${o.status !== "cancelled" ? `<button class="btn btn--sm btn--danger" data-oact="cancel">❌ لغو سفارش</button>` : ""}
        <span class="sp" style="flex:1"></span>
        <button class="btn btn--sm btn--ghost" data-oact="delete">🗑 پاک‌کردن از لیست</button>
      </div>
    </div>`;
  }

  async function orderAction(code, action) {
    let tracking = "";
    if (action === "track") {
      tracking = prompt("کد رهگیری پست را بنویس:") || "";
      if (!tracking) return;
    }
    if (action === "delete" && !confirm(`سفارش ${code} از لیست پاک شود؟`)) return;
    if (action === "cancel" && !confirm(`سفارش ${code} لغو شود؟`)) return;
    const j = await api("/api/admin/order", { code, action, tracking });
    if (!j.ok) { toast("انجام نشد: " + (j.error || "?")); return; }
    toast({
      pay: "پرداخت تأیید شد ✅", ship: "به‌عنوان ارسال‌شده ثبت شد 🚚",
      track: "کد رهگیری برای مشتری فرستاده شد 📮", cancel: "سفارش لغو شد",
      delete: "از لیست پاک شد 🗑",
    }[action] || "انجام شد");
    await reload(); renderTabs(); render();
  }

  /* ======================================================================
     محصولات
     ====================================================================== */
  let prodSearch = "";
  let editing = null;      // محصول در حال ویرایش/افزودن

  function viewProducts() {
    const q = prodSearch.trim().toLowerCase();
    const list = DATA.products.filter((p) =>
      !q || (p.nameFa + " " + p.nameEn + " " + p.id).toLowerCase().includes(q));
    return `
      <div class="card">
        <h2>محصولات سایت</h2>
        <p class="lead">پنج محصول اصلی سایت + هر محصولی که با بات ساخته شده. قیمت، عکس، توضیح، سایز و موجودی همه از اینجا قابل تغییر است.</p>
        <div class="row">
          <button class="btn btn--primary btn--sm" id="p-new">➕ محصول جدید</button>
          <input id="p-search" placeholder="جست‌وجو در محصولات…" value="${esc(prodSearch)}" style="max-width:260px">
        </div>
      </div>
      ${editing ? productEditor() : ""}
      <div class="card">
        <table>
          <thead><tr><th></th><th>نام</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            ${list.map((p) => `
              <tr class="${p.hidden ? "is-off" : ""}">
                <td><img class="thumb" src="${esc(p.img || "assets/img/logo.svg")}" alt=""></td>
                <td>
                  <b>${esc(p.nameFa || p.id)}</b>
                  <div class="mono" style="font-size:.75rem;color:var(--muted)">${esc(p.id)}${p.kind === "static" ? " · محصول اصلی" : ""}</div>
                </td>
                <td class="mono">${FA.format(p.price)}</td>
                <td class="mono">${stockText(p)}</td>
                <td>${p.hidden ? '<span class="pill pill--off">مخفی</span>' : '<span class="pill pill--ok">روی سایت</span>'}</td>
                <td class="row" style="justify-content:flex-end">
                  <button class="btn btn--sm" data-pedit="${esc(p.id)}">✏️ ویرایش</button>
                  <button class="btn btn--sm btn--ghost" data-phide="${esc(p.id)}">${p.hidden ? "👁 نمایش" : "🚫 مخفی"}</button>
                  ${p.kind === "bot" ? `<button class="btn btn--sm btn--danger" data-pdel="${esc(p.id)}">🗑</button>` : ""}
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  const stockText = (p) => {
    const s = p.stock || {};
    const ks = Object.keys(s);
    if (!ks.length) return "بی‌نهایت";
    return ks.map((k) => `${k === "*" ? "" : k + ": "}${FA.format(s[k])}`).join(" · ");
  };

  function productEditor() {
    const p = editing;
    const isNew = !p.id || p.isNew;
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    const stock = p.stock || {};
    return `
    <div class="card" id="pedit" style="border-color:var(--accent-2)">
      <h2>${isNew ? "محصول جدید" : "ویرایش: " + esc(p.nameFa || p.id)}</h2>
      <p class="lead">${isNew ? "عکس را انتخاب کن، بعد مشخصات را پر کن و ذخیره بزن." : "هر تغییری که ذخیره کنی، همان لحظه روی سایت می‌رود."}</p>

      <div class="row" style="align-items:flex-start;gap:16px">
        <div style="text-align:center">
          <img id="pe-img" src="${esc(p.img || "assets/img/logo.svg")}" alt="" style="width:150px;height:150px;object-fit:cover;border-radius:12px;border:1px solid var(--line-2)">
          <div style="margin-top:.5rem">
            <label class="btn btn--sm" style="cursor:pointer">📷 انتخاب عکس
              <input type="file" id="pe-file" accept="image/*" style="display:none">
            </label>
          </div>
          <p class="hint">حجم عکس زیر ۵ مگابایت</p>
        </div>

        <div style="flex:1;min-width:260px">
          <div class="grid2">
            <div class="field"><label>نام (فارسی)</label><input id="pe-name-fa" value="${esc(p.nameFa)}"></div>
            <div class="field"><label>نام (انگلیسی)</label><input id="pe-name-en" value="${esc(p.nameEn)}" dir="ltr"></div>
            <div class="field"><label>قیمت (تومان)</label><input id="pe-price" class="mono" value="${p.price || 0}"></div>
            <div class="field"><label>قیمت قبل از تخفیف (اختیاری)</label><input id="pe-old" class="mono" value="${p.oldPrice || 0}"></div>
            <div class="field"><label>دسته</label><select id="pe-cat">${CATS.map((c) =>
              `<option value="${c.id}" ${p.cat === c.id ? "selected" : ""}>${c.fa}</option>`).join("")}</select></div>
            <div class="field"><label>برچسب (فارسی)</label><input id="pe-badge-fa" value="${esc(p.badgeFa || "")}" placeholder="جدید / پرفروش / …"></div>
          </div>
          <div class="field"><label>توضیح (فارسی)</label><textarea id="pe-desc-fa">${esc(p.descFa || "")}</textarea></div>
          <div class="field"><label>توضیح (انگلیسی)</label><textarea id="pe-desc-en" dir="ltr">${esc(p.descEn || "")}</textarea></div>
          <div class="grid2">
            <div class="field">
              <label>سایزها (با کاما جدا کن — خالی = بدون سایز)</label>
              <input id="pe-sizes" value="${esc(sizes.join(", "))}" placeholder="S, M, L" dir="ltr">
            </div>
            <div class="field">
              <label>موجودی هر سایز <span class="hint">مثال: <code dir="ltr">S:2 M:5 L:3</code> یا برای بدون سایز فقط یک عدد</span></label>
              <input id="pe-stock" value="${esc(stockEntries(stock))}" dir="ltr">
            </div>
          </div>
          <div class="row">
            <label class="row" style="gap:.4rem"><input type="checkbox" id="pe-featured" ${p.featured !== false ? "checked" : ""} style="width:auto"> نمایش در صفحهٔ اصلی</label>
            <label class="row" style="gap:.4rem"><input type="checkbox" id="pe-hidden" ${p.hidden ? "checked" : ""} style="width:auto"> مخفی از سایت</label>
          </div>
        </div>
      </div>

      <div class="sep"></div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn btn--ghost" id="pe-cancel">انصراف</button>
        <button class="btn btn--primary" id="pe-save">💾 ذخیره و انتشار</button>
      </div>
    </div>`;
  }
  function stockEntries(stock) {
    const ks = Object.keys(stock || {});
    if (!ks.length) return "";
    if (ks.length === 1 && ks[0] === "*") return String(stock["*"]);
    return ks.map((k) => `${k}:${stock[k]}`).join(" ");
  }

  function readEditor() {
    const p = editing;
    const sizes = $("#pe-sizes").value.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    const stockRaw = $("#pe-stock").value.trim();
    let stock = {};
    if (stockRaw) {
      if (/^\d+$/.test(stockRaw) && !sizes.length) stock = { "*": Number(stockRaw) };
      else {
        stockRaw.split(/[\s,]+/).filter(Boolean).forEach((tok) => {
          const m = tok.match(/^([^:]+):(\d+)$/);
          if (m) stock[m[1].trim()] = Number(m[2]);
        });
        if (!Object.keys(stock).length && /^\d+$/.test(stockRaw)) sizes.forEach((s) => (stock[s] = Number(stockRaw)));
      }
    }
    return {
      id: p.id, kind: p.kind, mode: p.isNew ? "new" : "save",
      nameFa: $("#pe-name-fa").value.trim(), nameEn: $("#pe-name-en").value.trim(),
      price: Number($("#pe-price").value) || 0, oldPrice: Number($("#pe-old").value) || 0,
      cat: $("#pe-cat").value, badgeFa: $("#pe-badge-fa").value.trim(),
      descFa: $("#pe-desc-fa").value.trim(), descEn: $("#pe-desc-en").value.trim(),
      sizes, stock, img: p.img,
      featured: $("#pe-featured").checked, hidden: $("#pe-hidden").checked,
    };
  }

  /* ======================================================================
     متن‌های سایت
     ====================================================================== */
  let textSearch = "";

  function textKeys() {
    const keys = new Set();
    ["fa", "en"].forEach((l) => { if (window.I18N && I18N[l]) Object.keys(I18N[l]).forEach((k) => keys.add(k)); });
    ["fa", "en"].forEach((l) => Object.keys((DATA.site.texts || {})[l] || {}).forEach((k) => keys.add(k)));
    return [...keys].sort();
  }

  function textValue(lang, key) {
    const draft = textsDraft[lang][key];
    if (draft != null) return draft;
    const saved = ((DATA.site.texts || {})[lang] || {})[key];
    if (saved != null) return saved;
    return (window.I18N && I18N[lang] && I18N[lang][key]) || "";
  }

  function viewTexts() {
    const q = textSearch.trim().toLowerCase();
    const keys = textKeys().filter((k) => !q || k.includes(q) || String(textValue("fa", k)).toLowerCase().includes(q) || String(textValue("en", k)).toLowerCase().includes(q));
    const groups = {};
    keys.forEach((k) => {
      const pre = k.split("_")[0];
      (groups[pre] = groups[pre] || []).push(k);
    });
    const dirtyN = Object.keys(textsDraft.fa).length + Object.keys(textsDraft.en).length;
    return `
      <div class="card">
        <h2>متن‌های سایت</h2>
        <p class="lead">هر نوشته‌ای که در سایت می‌بینی اینجاست — فارسی و انگلیسی. تغییر بده و «ذخیره» را بزن؛ همان لحظه سایت عوض می‌شود.</p>
        <div class="row">
          <input id="t-search" placeholder="جست‌وجو در متن‌ها (فارسی یا انگلیسی)…" value="${esc(textSearch)}" style="max-width:340px">
          <span class="pill ${dirtyN ? "pill--warn" : "pill--off"}">${dirtyN ? FA.format(dirtyN) + " تغییر ذخیره‌نشده" : "بدون تغییر"}</span>
        </div>
      </div>
      ${Object.entries(groups).map(([pre, ks]) => `
        <div class="card">
          <div class="grouphead"><b>${esc(GROUP_LABELS[pre] || "سایر")}</b><span class="ln"></span><span class="mono" style="font-size:.72rem;color:var(--muted)">${esc(pre)}_*</span></div>
          ${ks.map((k) => `
            <div class="trow">
              <span class="k">${esc(k)}</span>
              <input data-tk="${esc(k)}" data-tl="fa" value="${esc(textValue("fa", k))}" placeholder="—">
              <input data-tk="${esc(k)}" data-tl="en" value="${esc(textValue("en", k))}" dir="ltr" placeholder="—">
            </div>`).join("")}
        </div>`).join("")}
      <div class="sticky-save">
        <button class="btn btn--ghost" id="t-reset">پاک‌کردن تغییرهای ذخیره‌نشده</button>
        <button class="btn btn--primary" id="t-save">💾 ذخیرهٔ متن‌ها</button>
      </div>`;
  }

  /* ======================================================================
     تصاویر
     ====================================================================== */
  function viewImages() {
    const imgs = { ...(DATA.site.images || {}), ...imgDirty };
    return `
      <div class="card">
        <h2>تصاویر سایت</h2>
        <p class="lead">عکس هر بخش را از اینجا عوض کن. عکس جدید بلافاصله در سایت می‌نشیند (کش مرورگر ممکن است چند دقیقه عکس قبلی را نشان دهد).</p>
      </div>
      <div class="card">
        <div class="slots">
          ${SLOTS.map((s) => {
            const cur = imgs[s.k] || "";
            const fallback = { logo: "assets/img/logo.svg", hero: "assets/img/hero.jpg" }[s.k] || "";
            return `
            <div class="slot">
              <img src="${esc(cur || fallback || "assets/img/logo.svg")}" alt="">
              <div class="nm">${esc(s.fa)}${cur ? ' <span class="pill pill--ok">عوض شده</span>' : ""}</div>
              <label class="btn btn--sm" style="cursor:pointer">📷 عوض کردن
                <input type="file" accept="image/*" data-slot-file="${s.k}" style="display:none">
              </label>
              ${cur ? `<button class="btn btn--sm btn--ghost" data-slot-clear="${s.k}" style="margin-top:.4rem">↩︎ برگرداندن عکس اصلی</button>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }

  /* ======================================================================
     تنظیمات
     ====================================================================== */
  function viewSettings() {
    const c = DATA.site.cfg || {};
    const F = (k, label, val, extra = "") =>
      `<div class="field"><label>${label}</label><input id="cfg-${k}" value="${esc(val == null ? "" : val)}" ${extra}></div>`;
    return `
      <div class="card">
        <h2>راه‌های تماس</h2>
        <div class="grid2">
          ${F("whatsapp", "شمارهٔ واتساپ (با کد کشور، بدون + و صفر)", c.whatsapp || "989031200140", 'dir="ltr"')}
          ${F("phone", "شمارهٔ نمایشی", c.phone || "+98 903 120 0140", 'dir="ltr"')}
          ${F("telegram", "یوزرنیم بات تلگرام (بدون @)", c.telegram || "VortexGearBot", 'dir="ltr"')}
          ${F("instagram", "پیج اینستاگرام (بدون @)", c.instagram || "vortex.gear", 'dir="ltr"')}
          ${F("email", "ایمیل", c.email || "order@vortex.gear", 'dir="ltr"')}
        </div>
      </div>
      <div class="card">
        <h2>فروش و ارسال</h2>
        <div class="grid2">
          ${F("shippingCost", "هزینهٔ ارسال (تومان)", c.shippingCost != null ? c.shippingCost : 180000, 'class="mono"')}
          ${F("freeShipOver", "ارسال رایگان از این مبلغ به بالا", c.freeShipOver != null ? c.freeShipOver : 3000000, 'class="mono"')}
        </div>
      </div>
      <div class="card">
        <h2>متن‌های تنظیمات</h2>
        <div class="grid2">
          ${F("brandTagFa", "شعار برند (فارسی)", (c.brandTag && c.brandTag.fa) || c.brandTagFa || "ساخته‌شده برای شدت")}
          ${F("brandTagEn", "شعار برند (انگلیسی)", (c.brandTag && c.brandTag.en) || c.brandTagEn || "Built for intensity", 'dir="ltr"')}
          ${F("hoursFa", "ساعات کاری (فارسی)", (c.hours && c.hours.fa) || c.hoursFa || "شنبه تا پنجشنبه • ۱۰:۰۰ تا ۲۰:۰۰")}
          ${F("hoursEn", "ساعات کاری (انگلیسی)", (c.hours && c.hours.en) || c.hoursEn || "Sat–Thu • 10:00 – 20:00", 'dir="ltr"')}
          ${F("addressFa", "آدرس / توضیح ارسال (فارسی)", (c.address && c.address.fa) || c.addressFa || "ایران — ارسال به سراسر کشور")}
          ${F("addressEn", "آدرس / توضیح ارسال (انگلیسی)", (c.address && c.address.en) || c.addressEn || "Iran — shipping nationwide", 'dir="ltr"')}
        </div>
      </div>
      <div class="card">
        <h2>رمز پنل</h2>
        <p class="lead">${DATA.hasPanelPass ? "رمز پنل را خودت عوض کرده‌ای." : "در حال حاضر رمز پیش‌فرض فعال است — بهتر است همین حالا عوضش کنی."}</p>
        <div class="grid3">
          <div class="field"><label>رمز فعلی</label><input id="pw-cur" type="password" autocomplete="current-password"></div>
          <div class="field"><label>رمز جدید (حداقل ۸ حرف)</label><input id="pw-new" type="password" autocomplete="new-password"></div>
          <div class="field"><label>تکرار رمز جدید</label><input id="pw-new2" type="password" autocomplete="new-password"></div>
        </div>
        <p class="hint">رمز به‌صورت هش‌شده (PBKDF2) ذخیره می‌شود، ولی چون فایل‌های سایت عمومی‌اند، رمزِ بلند (۱۲ حرف و بیشتر) انتخاب کن.</p>
        <div class="row"><button class="btn" id="pw-save">🔐 تغییر رمز</button></div>
      </div>
      <div class="sticky-save"><button class="btn btn--primary" id="s-save">💾 ذخیرهٔ تنظیمات</button></div>`;
  }

  /* ======================================================================
     ظاهر و چیدمان
     ====================================================================== */
  function viewLayout() {
    const L = DATA.site.layout || {};
    const order = (L.order && L.order.length ? L.order : SECTIONS.map((s) => s.k)).filter((k) => SECTIONS.some((s) => s.k === k));
    SECTIONS.forEach((s) => { if (!order.includes(s.k)) order.push(s.k); });
    const hidden = new Set(L.hidden || []);
    const th = DATA.site.theme || {};
    return `
      <div class="card">
        <h2>رنگ سایت</h2>
        <p class="lead">رنگ اصلی برند (همان سبز زیتونی). یک رنگ انتخاب کن یا کد رنگ بده.</p>
        <div class="swatches">
          ${ACCENTS.map((c) => `<button class="sw ${(th.accent || "#7C8C4B").toLowerCase() === c.toLowerCase() ? "is-on" : ""}" data-accent="${c}" style="background:${c}"></button>`).join("")}
          <label class="btn btn--sm" style="cursor:pointer">🎨 رنگ دلخواه
            <input type="color" id="l-accent" value="${esc(th.accent || "#7C8C4B")}" style="width:38px;height:30px;padding:0;border:0;background:none;cursor:pointer">
          </label>
        </div>
        <div class="sep"></div>
        <h2 style="font-size:.95rem">رنگ پس‌زمینه</h2>
        <div class="swatches">
          ${BGS.map((c) => `<button class="sw ${(th.bg || "#0A0B08").toLowerCase() === c.toLowerCase() ? "is-on" : ""}" data-bg="${c}" style="background:${c}"></button>`).join("")}
        </div>
        <p class="hint">پیشنهاد: پس‌زمینه تیره بماند تا متن‌ها خوانا باشد.</p>
      </div>

      <div class="card">
        <h2>بخش‌های صفحهٔ اول</h2>
        <p class="lead">با فلش‌ها ترتیب را عوض کن و با چشم، هر بخش را از سایت بردار یا برگردان.</p>
        ${order.map((k, i) => {
          const s = SECTIONS.find((x) => x.k === k);
          return `
          <div class="sec" data-sec="${k}">
            <button class="btn btn--sm btn--ghost" data-move="up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="btn btn--sm btn--ghost" data-move="down" ${i === order.length - 1 ? "disabled" : ""}>↓</button>
            <span class="h">${esc(s.fa)}</span>
            <span class="k">#${esc(k)}</span>
            <button class="btn btn--sm ${hidden.has(k) ? "btn--ghost" : ""}" data-vis="${k}">${hidden.has(k) ? "🚫 مخفی" : "👁 روی سایت"}</button>
          </div>`;
        }).join("")}
      </div>

      <div class="sticky-save"><button class="btn btn--primary" id="l-save">💾 ذخیرهٔ ظاهر</button></div>`;
  }

  /* ======================================================================
     رویدادها
     ====================================================================== */
  function bind() {
    /* سفارش‌ها */
    $$("#view [data-oact]").forEach((b) => b.addEventListener("click", () => {
      const card = b.closest("[data-order]");
      orderAction(card.dataset.order, b.dataset.oact);
    }));
    $$("#view [data-ofilter]").forEach((b) => b.addEventListener("click", () => {
      orderFilter = b.dataset.ofilter; render();
    }));

    /* محصولات */
    const ps = $("#p-search");
    if (ps) ps.addEventListener("input", () => { prodSearch = ps.value; rerender("#p-search"); });
    const pn = $("#p-new");
    if (pn) pn.addEventListener("click", () => {
      editing = { id: "", kind: "bot", isNew: true, nameFa: "", nameEn: "", price: 0, oldPrice: 0, cat: "apparel", descFa: "", descEn: "", sizes: [], stock: {}, badgeFa: "", badgeEn: "", featured: true, hidden: false, img: "" };
      render(); $("#pedit").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $$("#view [data-pedit]").forEach((b) => b.addEventListener("click", () => {
      editing = { ...DATA.products.find((p) => p.id === b.dataset.pedit) };
      render(); $("#pedit").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    $$("#view [data-phide]").forEach((b) => b.addEventListener("click", async () => {
      const p = DATA.products.find((x) => x.id === b.dataset.phide);
      const j = await api("/api/admin/product", { mode: p.hidden ? "show" : "hide", product: { id: p.id } });
      toast(j.ok ? (p.hidden ? "دوباره روی سایت رفت ✅" : "از سایت برداشته شد 🚫") : "انجام نشد");
      await reload(); render();
    }));
    $$("#view [data-pdel]").forEach((b) => b.addEventListener("click", async () => {
      const p = DATA.products.find((x) => x.id === b.dataset.pdel);
      if (!confirm(`«${p.nameFa}» کامل حذف شود؟`)) return;
      const j = await api("/api/admin/product", { mode: "remove", product: { id: p.id } });
      toast(j.ok ? "حذف شد 🗑" : "انجام نشد");
      await reload(); renderTabs(); render();
    }));
    const pf = $("#pe-file");
    if (pf) pf.addEventListener("change", async () => {
      const f = pf.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast("عکس بزرگ‌تر از ۵ مگابایت است"); return; }
      const data = await fileToB64(f);
      const pid = editing.id || ("tmp-" + Date.now().toString(36));
      const j = await api("/api/admin/upload", { slot: "product:" + pid, ext: extOf(f.name), data });
      if (!j.ok) { toast("آپلود نشد: " + (j.error || "?")); return; }
      editing.img = j.path;
      $("#pe-img").src = j.path;
      toast("عکس آپلود شد ✅ (با ذخیره نهایی می‌شود)");
    });
    const pc = $("#pe-cancel");
    if (pc) pc.addEventListener("click", () => { editing = null; render(); });
    const psv = $("#pe-save");
    if (psv) psv.addEventListener("click", async () => {
      const prod = readEditor();
      if (!prod.nameFa) { toast("نام فارسی را بنویس"); return; }
      if (!prod.img) { toast("اول عکس محصول را انتخاب کن"); return; }
      psv.disabled = true;
      const j = await api("/api/admin/product", { mode: prod.mode, product: prod });
      psv.disabled = false;
      if (!j.ok) { toast("ذخیره نشد: " + (j.error || "?")); return; }
      toast("محصول ذخیره و منتشر شد ✅");
      editing = null; await reload(); renderTabs(); render();
    });

    /* متن‌ها */
    const ts = $("#t-search");
    if (ts) ts.addEventListener("input", () => { textSearch = ts.value; rerender("#t-search"); });
    bindTexts();
    const tr = $("#t-reset");
    if (tr) tr.addEventListener("click", () => { textsDraft = { fa: {}, en: {} }; render(); });
    const tsv = $("#t-save");
    if (tsv) tsv.addEventListener("click", saveTexts);

    /* تصاویر */
    $$("#view [data-slot-file]").forEach((inp) => inp.addEventListener("change", async () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast("عکس بزرگ‌تر از ۵ مگابایت است"); return; }
      const slot = inp.dataset.slotFile;
      toast("دارم آپلود می‌کنم…");
      const data = await fileToB64(f);
      const j = await api("/api/admin/upload", { slot, ext: extOf(f.name), data });
      if (!j.ok) { toast("آپلود نشد: " + (j.error || "?")); return; }
      imgDirty[slot] = j.path;
      const j2 = await api("/api/admin/site", { patch: { images: { [slot]: j.path } } });
      if (!j2.ok) { toast("ذخیره نشد"); return; }
      DATA.site.images = j2.site.images;
      imgDirty = {};
      toast("عکس عوض شد ✅ سایت به‌روز شد");
      render();
    }));
    $$("#view [data-slot-clear]").forEach((b) => b.addEventListener("click", async () => {
      const slot = b.dataset.slotClear;
      const j = await api("/api/admin/site", { patch: { images: { [slot]: "" } } });
      if (j.ok) { DATA.site.images = j.site.images; toast("عکس اصلی برگشت"); render(); }
    }));

    /* تنظیمات */
    const ss = $("#s-save");
    if (ss) ss.addEventListener("click", async () => {
      const g = (k) => { const el = $("#cfg-" + k); return el ? el.value.trim() : ""; };
      const cfg = {
        whatsapp: g("whatsapp"), phone: g("phone"), telegram: g("telegram").replace(/^@/, ""),
        instagram: g("instagram").replace(/^@/, ""), email: g("email"),
        shippingCost: Number(g("shippingCost")) || 0, freeShipOver: Number(g("freeShipOver")) || 0,
        brandTagFa: g("brandTagFa"), brandTagEn: g("brandTagEn"),
        hoursFa: g("hoursFa"), hoursEn: g("hoursEn"),
        addressFa: g("addressFa"), addressEn: g("addressEn"),
      };
      ss.disabled = true;
      const j = await api("/api/admin/site", { patch: { cfg } });
      ss.disabled = false;
      if (!j.ok) { toast("ذخیره نشد"); return; }
      DATA.site.cfg = j.site.cfg;
      toast("تنظیمات ذخیره شد ✅");
    });

    const pwBtn = $("#pw-save");
    if (pwBtn) pwBtn.addEventListener("click", async () => {
      const cur = $("#pw-cur").value, n1 = $("#pw-new").value, n2 = $("#pw-new2").value;
      if (n1.length < 8) { toast("رمز جدید حداقل ۸ حرف باشد"); return; }
      if (n1 !== n2) { toast("تکرار رمز یکی نیست"); return; }
      pwBtn.disabled = true;
      const j = await api("/api/admin/password", { current: cur, next: n1 });
      pwBtn.disabled = false;
      if (!j.ok) { toast(j.error === "wrong_current" ? "رمز فعلی اشتباه است" : "عوض نشد"); return; }
      if (j.token) { token = j.token; localStorage.setItem(KEY, token); }
      DATA.hasPanelPass = true;
      toast("رمز عوض شد ✅ از این به بعد با رمز جدید وارد شو");
      render();
    });

    /* ظاهر و چیدمان */
    $$("#view [data-accent]").forEach((b) => b.addEventListener("click", () => {
      DATA.site.theme = { ...(DATA.site.theme || {}), accent: b.dataset.accent };
      render();
    }));
    const la = $("#l-accent");
    if (la) la.addEventListener("input", () => { DATA.site.theme = { ...(DATA.site.theme || {}), accent: la.value }; });
    $$("#view [data-bg]").forEach((b) => b.addEventListener("click", () => {
      DATA.site.theme = { ...(DATA.site.theme || {}), bg: b.dataset.bg };
      render();
    }));
    $$("#view [data-move]").forEach((b) => b.addEventListener("click", () => {
      const k = b.closest("[data-sec]").dataset.sec;
      const L = DATA.site.layout || {}; const order = layoutOrder(L);
      const i = order.indexOf(k), j2 = b.dataset.move === "up" ? i - 1 : i + 1;
      if (j2 < 0 || j2 >= order.length) return;
      [order[i], order[j2]] = [order[j2], order[i]];
      DATA.site.layout = { ...L, order };
      render();
    }));
    $$("#view [data-vis]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.vis;
      const L = DATA.site.layout || {}; const hidden = new Set(L.hidden || []);
      hidden.has(k) ? hidden.delete(k) : hidden.add(k);
      DATA.site.layout = { ...L, order: layoutOrder(L), hidden: [...hidden] };
      render();
    }));
    const lsv = $("#l-save");
    if (lsv) lsv.addEventListener("click", async () => {
      const L = DATA.site.layout || {};
      const patch = {
        theme: { accent: (DATA.site.theme || {}).accent || "#7C8C4B", bg: (DATA.site.theme || {}).bg || "#0A0B08" },
        layout: { order: layoutOrder(L), hidden: L.hidden || [] },
      };
      lsv.disabled = true;
      const j = await api("/api/admin/site", { patch });
      lsv.disabled = false;
      if (!j.ok) { toast("ذخیره نشد"); return; }
      DATA.site.theme = j.site.theme; DATA.site.layout = j.site.layout;
      toast("ظاهر سایت ذخیره شد ✅");
    });
  }

  function bindTexts() {
    $$("#view [data-tk]").forEach((inp) => inp.addEventListener("input", () => {
      const k = inp.dataset.tk, l = inp.dataset.tl;
      const def = (window.I18N && I18N[l] && I18N[l][k]) || "";
      const saved = ((DATA.site.texts || {})[l] || {})[k];
      const cur = inp.value;
      const base = saved != null ? saved : def;
      if (cur === base) delete textsDraft[l][k];
      else textsDraft[l][k] = cur;
      inp.classList.toggle("dirty", cur !== base);
    }));
  }

  async function saveTexts() {
    const n = Object.keys(textsDraft.fa).length + Object.keys(textsDraft.en).length;
    if (!n) { toast("تغییری برای ذخیره نیست"); return; }
    const btn = $("#t-save"), html = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    const j = await api("/api/admin/site", { patch: { texts: textsDraft } });
    btn.disabled = false; btn.innerHTML = html;
    if (!j.ok) { toast("ذخیره نشد"); return; }
    DATA.site.texts = j.site.texts;
    textsDraft = { fa: {}, en: {} };
    toast("متن‌ها ذخیره شد ✅ سایت به‌روز شد");
    render();
  }

  const layoutOrder = (L) => {
    const order = (L.order && L.order.length ? [...L.order] : SECTIONS.map((s) => s.k)).filter((k) => SECTIONS.some((s) => s.k === k));
    SECTIONS.forEach((s) => { if (!order.includes(s.k)) order.push(s.k); });
    return order;
  };

  /* ---------- کمکی -------------------------------------------------------- */
  function fileToB64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1] || "");
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  const extOf = (name) => (/\.png$/i.test(name) ? "png" : /\.webp$/i.test(name) ? "webp" : "jpg");

  /* ---------- شروع -------------------------------------------------------- */
  (async function init() {
    try { window.I18N = typeof I18N !== "undefined" ? I18N : window.I18N; } catch (e) {}
    if (token) {
      try {
        await reload();
        showPanel(); renderTabs(); render();
        return;
      } catch (e) { /* توکن منقضی شده */ }
    }
    showLogin();
  })();
})();
