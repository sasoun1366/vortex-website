/* ==========================================================================
   VORTEX — اعمال تنظیمات پنل مدیریت روی سایت
   --------------------------------------------------------------------------
   این فایل از /api/site می‌خواند و قبل از رندر، متن‌ها/تنظیمات/رنگ را اعمال
   می‌کند و بعد از رندر، تصاویر و چیدمان بخش‌ها را.
   اگر پنل چیزی را عوض نکرده باشد، سایت با همان مقادیر پیش‌فرض فایل‌ها کار
   می‌کند (هیچ‌چیز خراب نمی‌شود).
   ========================================================================== */
window.VXSite = (function () {
  "use strict";
  let d = null;
  let loaded = false;

  const hex = (h) => {
    h = String(h || "#7C8C4B").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6) || "7C8C4B", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (c1, c2, amt) => {
    const a = hex(c1), b = hex(c2);
    return toHex(a.map((v, i) => v + (b[i] - v) * amt));
  };
  const pick = (v, fb) => (v == null || v === "" ? fb : v);

  async function load(force) {
    if (loaded && !force) return d;
    try {
      const r = await fetch("api/site", { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok) { d = j; loaded = true; }
    } catch (e) { /* آفلاین یا خطای شبکه → همان مقادیر پیش‌فرض فایل‌ها */ }
    return d;
  }

  function applyTexts() {
    if (!d || !d.texts || typeof I18N === "undefined") return;
    ["fa", "en"].forEach((l) => {
      const src = d.texts[l] || {};
      if (!I18N[l]) return;
      Object.keys(src).forEach((k) => {
        const v = src[k];
        if (v != null && v !== "") I18N[l][k] = v;
      });
    });
  }

  function applyCfg() {
    if (!d || !d.cfg || typeof VORTEX === "undefined" || !VORTEX.config) return;
    const c = d.cfg, V = VORTEX.config;
    ["whatsapp", "telegram", "instagram", "email", "phone"].forEach((k) => {
      if (c[k]) V[k] = String(c[k]);
    });
    ["shippingCost", "freeShipOver"].forEach((k) => {
      if (c[k] != null && c[k] !== "") V[k] = Number(c[k]) || 0;
    });
    if (c.currencyFa || c.currencyEn) V.currency = { fa: pick(c.currencyFa, V.currency.fa), en: pick(c.currencyEn, V.currency.en) };
    if (c.brandTagFa || c.brandTagEn) V.brandTag = { fa: pick(c.brandTagFa, V.brandTag.fa), en: pick(c.brandTagEn, V.brandTag.en) };
    if (c.hoursFa || c.hoursEn) V.hours = { fa: pick(c.hoursFa, V.hours.fa), en: pick(c.hoursEn, V.hours.en) };
    if (c.addressFa || c.addressEn) V.address = { fa: pick(c.addressFa, V.address.fa), en: pick(c.addressEn, V.address.en) };
  }

  function applyTheme() {
    if (!d || !d.theme) return;
    const R = document.documentElement.style;
    const a = d.theme.accent, bg = d.theme.bg;
    if (a && /^#[0-9A-Fa-f]{6}$/.test(a)) {
      R.setProperty("--olive", a);
      R.setProperty("--olive-400", mix(a, "#FFFFFF", 0.14));
      R.setProperty("--olive-300", mix(a, "#FFFFFF", 0.28));
      R.setProperty("--olive-200", mix(a, "#FFFFFF", 0.5));
      R.setProperty("--olive-700", mix(a, "#000000", 0.22));
      R.setProperty("--olive-800", mix(a, "#000000", 0.36));
      R.setProperty("--olive-900", mix(a, "#000000", 0.46));
      const [r, g, b] = hex(a);
      R.setProperty("--line", `rgba(${r},${g},${b},.22)`);
      R.setProperty("--line-soft", `rgba(${r},${g},${b},.13)`);
      R.setProperty("--line-strong", `rgba(${r},${g},${b},.45)`);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", a);
    }
    if (bg && /^#[0-9A-Fa-f]{6}$/.test(bg)) {
      R.setProperty("--bg", bg);
      R.setProperty("--bg-2", mix(bg, "#FFFFFF", 0.035));
      R.setProperty("--surface", mix(bg, "#FFFFFF", 0.07));
      R.setProperty("--surface-2", mix(bg, "#FFFFFF", 0.11));
      R.setProperty("--surface-3", mix(bg, "#FFFFFF", 0.16));
    }
  }

  function applyImages() {
    if (!d || !d.images) return;
    Object.keys(d.images).forEach((k) => {
      const v = d.images[k];
      if (!v) return;
      document.querySelectorAll(`[data-slot="${k}"]`).forEach((el) => {
        if (el.tagName === "IMG") el.src = v;
        else el.style.backgroundImage = `url("${v}")`;
      });
      if (k === "logo") {
        const f = document.querySelector('link[rel="icon"]');
        if (f) f.href = v;
      }
      if (k === "hero") {
        const og = document.querySelector('meta[property="og:image"]');
        if (og) og.setAttribute("content", v);
      }
    });
  }

  function applyLayout() {
    if (!d || !d.layout) return;
    const host = document.querySelector("[data-sections]");
    if (!host) return;
    const secs = [...host.querySelectorAll("[data-section]")];
    const order = Array.isArray(d.layout.order) ? d.layout.order : [];
    if (order.length) {
      secs.sort((x, y) => {
        const ix = order.indexOf(x.dataset.section), iy = order.indexOf(y.dataset.section);
        return (ix < 0 ? 999 : ix) - (iy < 0 ? 999 : iy);
      }).forEach((s) => host.appendChild(s));
    }
    const hid = new Set(d.layout.hidden || []);
    secs.forEach((s) => { s.style.display = hid.has(s.dataset.section) ? "none" : ""; });
  }

  return {
    load,
    apply() { applyTexts(); applyCfg(); applyTheme(); },
    after() { applyImages(); applyLayout(); },
    data: () => d,
  };
})();
