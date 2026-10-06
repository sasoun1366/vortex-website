/* ==========================================================================
   VORTEX — پنل مدیریت (سمت سرور)
   --------------------------------------------------------------------------
   همهٔ کارهایی که صاحب فروشگاه می‌تواند بکند، از یک پنل وب:
     • سفارش‌ها: تأیید پرداخت، ارسال، کد رهگیری، لغو، حذف
     • محصولات: افزودن/ویرایش/حذف/مخفی + عکس + قیمت + سایز و موجودی
     • متن‌های سایت: همهٔ نوشته‌ها، فارسی و انگلیسی
     • تصاویر: هدر، دسته‌ها، گالری، درباره، لوگو
     • تنظیمات: راه‌های تماس، هزینهٔ ارسال، ارسال رایگان، برند‌تگ
     • ظاهر و چیدمان: رنگ اصلی، ترتیب و نمایش/مخفی بخش‌های صفحهٔ اصلی

   امنیت: رمز در Secret کلودفلر (ADMIN_PASSWORD) و توکن امضاشده با
   WEBHOOK_SECRET. فایل‌های عمومی (data/*.json) هیچ رمزی ندارند.
   ========================================================================== */

import { readCatalog, writeCatalog, toSite, applyOverride, putRepoFile, parseSizes, catId, makeId, MEDIA_DIR } from "./catalog.js";
import { readStore, writeStore, decStock, stockFor, stockKey } from "./store.js";
import { addressRequestMessage, customerStatusMessage } from "./flow.js";

const GH_REPO = "sasoun1366/vortex-website";
const SITE_FILE = "data/site.json";
const SITE_DIR = "media/site";

/* همان پنج محصول ثابت سایت — برای اینکه پنل بتواند قیمت/اسم/عکس‌شان را عوض کند */
export const STATIC_PRODUCTS = [
  { id: "vx-tee-001",   fa: "تی‌شرت تمرین ورتکس",        en: "Vortex Performance Tee",     cat: "apparel",   sizes: ["S", "M", "L", "XL", "XXL"], price: 1480000 },
  { id: "vx-crop-001",  fa: "تی‌شرت کراپ «فصل ۰۱ / شماره ۶»", en: "Crop Tee — Season 01 · Issue No.6", cat: "apparel", sizes: ["S", "M", "L"], price: 1250000 },
  { id: "vx-wrap-001",  fa: "مچ‌بند تمرین ورتکس",        en: "Vortex Wrist Wraps",         cat: "gear",      sizes: ["30cm", "45cm"],            price: 690000 },
  { id: "vx-chalk-001", fa: "گچ مایع ورتکس — ۱۵۰ میلی‌لیتر", en: "Vortex Liquid Chalk — 150 ml", cat: "gear",   sizes: [],                          price: 480000 },
  { id: "vx-key-001",   fa: "جاکلیدی و بند ورتکس",       en: "Vortex Key Strap",           cat: "accessory", sizes: [],                          price: 320000 },
];

export const SLOT_KEYS = [
  "logo", "hero", "cat_apparel", "cat_accessory", "cat_gear", "drop", "story",
  "gal1", "gal2", "gal3", "gal4", "gal5", "about1", "about2", "about3", "about4",
];

const EMPTY_SITE = { cfg: {}, texts: { fa: {}, en: {} }, images: {}, theme: {}, layout: {}, updated: 0 };
const TTL = 4000;
let _cache = { at: 0, data: null, sha: null };

const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s) => decodeURIComponent(escape(atob(String(s).replace(/\s+/g, ""))));

/* ---------- ابزار گیت‌هاب ------------------------------------------------- */
async function gh(path, env, init = {}) {
  return fetch(`https://api.github.com/repos/${GH_REPO}/${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "vortex-worker",
      ...(init.headers || {}),
    },
    cf: { cacheTtl: 0 },
  });
}

/* ---------- خواندن/نوشتن دادهٔ سایت (متن‌ها، تنظیمات، ظاهر) --------------- */
export async function readSite(env) {
  if (_cache.data && Date.now() - _cache.at < TTL) return _cache.data;
  try {
    const r = await gh(`contents/${SITE_FILE}`, env);
    if (r.status === 404) {
      _cache = { at: Date.now(), data: structuredClone(EMPTY_SITE), sha: null };
      return _cache.data;
    }
    if (!r.ok) throw new Error("gh_read_" + r.status);
    const j = await r.json();
    const data = JSON.parse(b64d(j.content || "{}") || "{}");
    _cache = { at: Date.now(), data: { ...structuredClone(EMPTY_SITE), ...data }, sha: j.sha };
    return _cache.data;
  } catch (e) {
    console.error("site read failed:", e.message);
    return _cache.data || structuredClone(EMPTY_SITE);
  }
}

export async function writeSite(env, mutate, _retry = 0) {
  _cache = { at: 0, data: null, sha: null };
  const cur = await readSite(env);
  const next = structuredClone(cur);
  next.texts = next.texts || { fa: {}, en: {} };
  mutate(next);
  next.updated = Date.now();
  try {
    let sha = _cache.sha;
    if (!sha) {
      const r = await gh(`contents/${SITE_FILE}`, env);
      if (r.ok) sha = (await r.json()).sha;
    }
    const body = {
      message: `site: ${new Date().toISOString()}`,
      content: b64e(JSON.stringify(next, null, 1)),
      committer: { name: "Vortex Bot", email: "hello@vortexgear.ir" },
    };
    if (sha) body.sha = sha;
    const put = await gh(`contents/${SITE_FILE}`, env, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!put.ok) {
      const txt = (await put.text()).slice(0, 140);
      if ((put.status === 409 || put.status === 422) && _retry < 2) {
        return writeSite(env, mutate, _retry + 1);
      }
      throw new Error("gh_write_" + put.status + " " + txt);
    }
    const j = await put.json();
    _cache = { at: Date.now(), data: next, sha: j.content && j.content.sha };
    return next;
  } catch (e) {
    console.error("site write failed:", e.message);
    _cache = { at: Date.now(), data: next, sha: _cache.sha };
    return next;
  }
}

export function invalidateSite() { _cache = { at: 0, data: null, sha: null }; }

/* ---------- ورود / توکن --------------------------------------------------- */
const enc = new TextEncoder();
async function hmacKey(secret, usage = ["sign", "verify"]) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function makeToken(env) {
  const payload = b64u(enc.encode(JSON.stringify({ exp: Date.now() + 30 * 864e5, n: Math.random().toString(36).slice(2, 8) })));
  const key = await hmacKey(env.WEBHOOK_SECRET);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return payload + "." + b64u(sig);
}

export async function checkToken(env, token) {
  if (!token || !env.WEBHOOK_SECRET) return false;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return false;
  try {
    const key = await hmacKey(env.WEBHOOK_SECRET, ["verify"]);
    const ok = await crypto.subtle.verify("HMAC", key, unb64u(sig), enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    return typeof exp === "number" && exp > Date.now();
  } catch { return false; }
}

const auth = async (request, env) => checkToken(env, request.headers.get("x-vx-admin"));

/* ---------- رمز پنل -------------------------------------------------------
   دو حالت دارد:
     ۱) رمز Secret کلودفلر (ADMIN_PASSWORD) — پیش‌فرض
     ۲) رمز دلخواه صاحب فروشگاه که از داخل پنل عوض می‌شود؛ هشِ آن در
        data/site.json ذخیره می‌شود و با یک «فلفل» خصوصی (WEBHOOK_SECRET)
        مخلوط می‌شود تا حتی با عمومی‌بودن فایل، قابل شکستن نباشد.

   چرا SHA-256 و نه PBKDF2؟ چون Workers سقف CPU دارد و PBKDF2 کند در
   درخواست شکست می‌خورد. امنیت اینجا از فلفلِ خصوصی می‌آید، نه از کندی.

   نکته: اگر روزی WEBHOOK_SECRET عوض شود، رمز پنل به رمز Secret برمی‌گردد.
   ------------------------------------------------------------------------ */
const hexOf = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randHex = (n = 16) => hexOf(crypto.getRandomValues(new Uint8Array(n)));

async function pwHash(env, password, salt) {
  const pepper = env.WEBHOOK_SECRET || env.ADMIN_PASSWORD || "vortex";
  const msg = `vx1|${salt}|${pepper}|${String(password || "")}`;
  return hexOf(await crypto.subtle.digest("SHA-256", enc.encode(msg)));
}
const safeEq = (a, b) => {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export async function verifyPassword(env, pw) {
  try {
    const site = await readSite(env);
    const ph = site.cfg && site.cfg.passHash;
    if (ph && ph.hash && ph.salt) {
      const h = await pwHash(env, pw, ph.salt);
      return safeEq(h, ph.hash);
    }
  } catch (e) {
    console.error("verifyPassword failed:", e.message);
  }
  return Boolean(env.ADMIN_PASSWORD) && safeEq(pw, env.ADMIN_PASSWORD);
}

export async function setPassword(env, next) {
  if (String(next || "").length < 8) return { ok: false, error: "short" };
  const salt = randHex(16);
  let hash;
  try { hash = await pwHash(env, next, salt); }
  catch (e) { console.error("hash failed:", e.message); return { ok: false, error: "hash_failed" }; }
  await writeSite(env, (s) => { s.cfg = { ...(s.cfg || {}), passHash: { salt, hash } }; });
  return { ok: true };
}

/* ---------- helper پاسخ --------------------------------------------------- */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, x-vx-admin",
      "access-control-allow-methods": "POST, GET, OPTIONS",
    },
  });
}

const tgBase = (env) => `${env.TELEGRAM_API_BASE || "https://api.telegram.org"}/bot${env.BOT_TOKEN}`;
async function tg(env, method, payload) {
  try {
    const r = await fetch(`${tgBase(env)}/${method}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    return await r.json().catch(() => ({}));
  } catch (e) { console.error("tg error", method, e.message); return { ok: false }; }
}

/* ---------- خواندن همهٔ داده‌ها برای پنل ---------------------------------- */
export async function adminData(env) {
  const [site, catalog, store] = await Promise.all([readSite(env), readCatalog(env), readStore(env)]);
  const ov = catalog.overrides || {};
  const hidden = catalog.hidden || [];

  const staticList = STATIC_PRODUCTS.map((sp) => {
    const o = ov[sp.id] || {};
    const key = stockKey(store, sp.id);
    return {
      id: sp.id, kind: "static", active: true,
      nameFa: (o.name && o.name.fa) || sp.fa, nameEn: (o.name && o.name.en) || sp.en,
      descFa: (o.desc && o.desc.fa) || "", descEn: (o.desc && o.desc.en) || "",
      price: o.price != null ? o.price : sp.price, oldPrice: o.oldPrice || 0,
      img: o.img || `assets/img/${({ "vx-tee-001": "tee", "vx-crop-001": "crop-tee", "vx-wrap-001": "wrist-wraps", "vx-chalk-001": "liquid-chalk", "vx-key-001": "keychain" })[sp.id]}.jpg`,
      cat: (o.cat && catId(o.cat)) || sp.cat, sizes: sp.sizes,
      badgeFa: (o.badge && o.badge.fa) || "", badgeEn: (o.badge && o.badge.en) || "",
      featured: o.featured != null ? !!o.featured : true,
      hidden: hidden.includes(sp.id),
      stock: key ? store.stock[key] : null,
    };
  });

  const botList = (catalog.products || []).map((p) => {
    const o = ov[p.id] || {};
    const key = stockKey(store, p.id);
    return {
      id: p.id, kind: "bot", active: p.active !== false,
      nameFa: (o.name && o.name.fa) || (p.name && p.name.fa) || p.id,
      nameEn: (o.name && o.name.en) || (p.name && p.name.en) || "",
      descFa: (o.desc && o.desc.fa) || "", descEn: (o.desc && o.desc.en) || "",
      price: o.price != null ? o.price : (p.price || 0), oldPrice: o.oldPrice || 0,
      img: o.img || p.img || "",
      cat: catId(p.cat) || "accessory", sizes: p.sizes || [],
      badgeFa: (o.badge && o.badge.fa) || (p.badge && p.badge.fa) || "",
      badgeEn: (o.badge && o.badge.en) || (p.badge && p.badge.en) || "",
      featured: o.featured != null ? !!o.featured : p.featured !== false,
      hidden: hidden.includes(p.id),
      stock: key ? store.stock[key] : (p.stock || null),
    };
  });

  const orders = Object.values(store.orders || {}).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 120);

  const cfgSafe = { ...(site.cfg || {}) };
  const hasPanelPass = Boolean(cfgSafe.passHash);
  delete cfgSafe.passHash;
  return {
    site: {
      cfg: cfgSafe, hasPanelPass, texts: site.texts || { fa: {}, en: {} },
      images: site.images || {}, theme: site.theme || {}, layout: site.layout || {},
    },
    products: staticList.concat(botList),
    orders,
    stock: store.stock || {},
    card: { masked: (site.cfg && site.cfg.cardMasked) || "" },
  };
}

/* ---------- ذخیرهٔ بخشی از تنظیمات سایت ---------------------------------- */
export async function saveSite(env, patch) {
  return writeSite(env, (s) => {
    if (patch.cfg && typeof patch.cfg === "object") {
      s.cfg = { ...(s.cfg || {}) };
      for (const [k, v] of Object.entries(patch.cfg)) {
        if (v === null) delete s.cfg[k]; else s.cfg[k] = typeof v === "string" ? v.slice(0, 400) : v;
      }
    }
    if (patch.theme && typeof patch.theme === "object") {
      s.theme = { ...(s.theme || {}) };
      for (const [k, v] of Object.entries(patch.theme)) {
        if (/^#[0-9A-Fa-f]{6}$/.test(String(v))) s.theme[k] = v;
        else if (v === null) delete s.theme[k];
      }
    }
    if (patch.images && typeof patch.images === "object") {
      s.images = { ...(s.images || {}) };
      for (const [k, v] of Object.entries(patch.images)) {
        if (!SLOT_KEYS.includes(k)) continue;
        if (v) s.images[k] = String(v).slice(0, 200); else delete s.images[k];
      }
    }
    if (patch.layout && typeof patch.layout === "object") {
      const { order, hidden } = patch.layout;
      s.layout = s.layout || {};
      if (Array.isArray(order)) s.layout.order = order.filter((x) => typeof x === "string").slice(0, 40);
      if (Array.isArray(hidden)) s.layout.hidden = hidden.filter((x) => typeof x === "string").slice(0, 40);
    }
    if (patch.texts && typeof patch.texts === "object") {
      s.texts = s.texts || { fa: {}, en: {} };
      for (const lang of ["fa", "en"]) {
        const src = patch.texts[lang];
        if (!src || typeof src !== "object") continue;
        s.texts[lang] = s.texts[lang] || {};
        for (const [k, v] of Object.entries(src)) {
          if (!/^[a-z0-9_]{1,40}$/.test(k)) continue;
          const val = String(v == null ? "" : v).slice(0, 600);
          if (val === "") delete s.texts[lang][k]; else s.texts[lang][k] = val;
        }
      }
    }
  });
}

/* ---------- ذخیرهٔ محصول -------------------------------------------------- */
export async function saveProduct(env, body) {
  const mode = body.mode || "save";
  const p = body.product || {};
  const id = String(p.id || "").trim();
  const isStatic = STATIC_PRODUCTS.some((x) => x.id === id);

  /* حذف کامل (فقط محصولات ساخته‌شده) */
  if (mode === "remove") {
    await writeCatalog(env, (c) => {
      c.products = (c.products || []).filter((x) => x.id !== id);
      c.hidden = (c.hidden || []).filter((x) => x !== id);
      if (c.overrides) delete c.overrides[id];
    });
    return { ok: true, removed: id };
  }

  /* مخفی / نمایش */
  if (mode === "hide" || mode === "show") {
    await writeCatalog(env, (c) => {
      c.hidden = (c.hidden || []).filter((x) => x !== id);
      if (mode === "hide") c.hidden.push(id);
    });
    return { ok: true, hidden: mode === "hide" };
  }

  /* افزودن محصول جدید از پنل */
  let newId = id;
  if (mode === "new") {
    newId = id || makeId(p.nameEn || "", p.nameFa || "");
  }

  /* سایز/موجودی */
  let sizes = Array.isArray(p.sizes) ? p.sizes.map((s) => String(s).trim()).filter(Boolean) : [];
  let stock = null;
  if (typeof p.sizesText === "string" && p.sizesText.trim()) {
    const parsed = parseSizes(p.sizesText);
    sizes = parsed.sizes.length ? parsed.sizes : sizes;
    stock = parsed.stock;
  }
  if (p.stock && typeof p.stock === "object") {
    stock = {};
    for (const [k, v] of Object.entries(p.stock)) {
      const n = Number(v);
      if (!Number.isNaN(n) && n >= 0) stock[k] = Math.round(n);
    }
  }

  const common = {
    price: Math.max(0, Math.round(Number(p.price) || 0)),
    oldPrice: Math.max(0, Math.round(Number(p.oldPrice) || 0)),
    cat: catId(p.cat) || "accessory",
    featured: p.featured !== false,
    badge: { fa: String(p.badgeFa || "").slice(0, 40), en: String(p.badgeEn || "").slice(0, 40) },
    name: { fa: String(p.nameFa || "").slice(0, 120), en: String(p.nameEn || "").slice(0, 120) },
    desc: { fa: String(p.descFa || "").slice(0, 400), en: String(p.descEn || "").slice(0, 400) },
    img: String(p.img || "").slice(0, 200),
  };

  if (isStatic) {
    /* محصول ثابت → بازنویسی در overrides */
    await writeCatalog(env, (c) => {
      c.overrides = c.overrides || {};
      const cur = c.overrides[id] || {};
      c.overrides[id] = {
        ...cur,
        price: common.price, oldPrice: common.oldPrice, cat: common.cat, featured: common.featured,
        name: common.name, desc: common.desc, badge: common.badge,
        ...(common.img ? { img: common.img } : {}),
        ...(sizes.length ? { sizes } : {}),
      };
      c.hidden = (c.hidden || []).filter((x) => x !== id);
      if (p.hidden) c.hidden.push(id);
    });
  } else {
    await writeCatalog(env, (c) => {
      c.products = c.products || [];
      const idx = c.products.findIndex((x) => x.id === newId);
      const base = idx >= 0 ? c.products[idx] : {
        id: newId, ts: Date.now(), active: true, stock: {},
      };
      const item = {
        ...base,
        cat: common.cat,
        price: common.price,
        oldPrice: common.oldPrice,
        featured: common.featured,
        badge: common.badge,
        name: common.name,
        desc: common.desc,
        img: common.img || base.img || "",
        sizes,
        ts: base.ts || Date.now(),
        active: true,
      };
      if (idx >= 0) c.products[idx] = item; else c.products.push(item);
      c.hidden = (c.hidden || []).filter((x) => x !== newId);
      if (p.hidden) c.hidden.push(newId);
      if (c.overrides) delete c.overrides[newId];
    });
  }

  /* موجودی */
  if (stock && Object.keys(stock).length) {
    await writeStore(env, (st) => {
      st.stock = st.stock || {};
      st.stock[newId] = { ...(st.stock[newId] || {}), ...stock };
    });
  }

  return { ok: true, id: newId };
}

/* ---------- آپلود عکس ----------------------------------------------------- */
export async function uploadImage(env, body) {
  const slot = String(body.slot || "");
  const data = String(body.data || "");
  if (!data) return { ok: false, error: "no_data" };
  const bytes = Math.floor(data.length * 3 / 4);
  if (bytes > 6 * 1024 * 1024) return { ok: false, error: "too_big" };

  const ext = /^png$/i.test(body.ext || "") ? "png" : /^webp$/i.test(body.ext || "") ? "webp" : "jpg";
  let repoPath, publicPath;
  if (slot.startsWith("product:")) {
    const pid = slot.slice(8).replace(/[^A-Za-z0-9._-]/g, "");
    if (!pid) return { ok: false, error: "bad_slot" };
    repoPath = `${MEDIA_DIR}/${pid}.${ext}`;        // فایل در ریپو
    publicPath = `media/${pid}.${ext}`;             // آدرس در سایت (مثل محصولات بات)
  } else {
    if (!SLOT_KEYS.includes(slot)) return { ok: false, error: "bad_slot" };
    repoPath = `${SITE_DIR}/${slot}.${ext}`;
    publicPath = `media/site/${slot}.${ext}?v=${Date.now().toString(36)}`;
  }
  try {
    await putRepoFile(env, repoPath, data, `media: ${repoPath}`);
  } catch (e) {
    return { ok: false, error: String(e.message).slice(0, 120) };
  }
  return { ok: true, path: publicPath };
}

/* ---------- کارهای سفارش -------------------------------------------------- */
export async function orderAction(env, body) {
  const code = String(body.code || "");
  const action = String(body.action || "");
  const store = await readStore(env);
  const o = (store.orders || {})[code];
  if (!o) return { ok: false, error: "not_found" };
  const L = o.lang !== "en";
  const shop = env.SHOP_URL || "https://vortexgear.ir";

  if (action === "delete") {
    await writeStore(env, (st) => { delete st.orders[code]; });
    return { ok: true, removed: true };
  }

  if (action === "pay") {
    await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].status = "paid"; });
    if (o.chatId) await tg(env, "sendMessage", { chat_id: o.chatId, text: addressRequestMessage(o), parse_mode: "HTML" });
    return { ok: true, status: "paid" };
  }

  if (action === "cancel") {
    await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].status = "cancelled"; });
    if (o.chatId) await tg(env, "sendMessage", {
      chat_id: o.chatId, parse_mode: "HTML",
      text: L ? `❌ سفارش <code>${code}</code> لغو شد.\nاگر پرداخت کرده بودی، همین امروز برگشت می‌خورد.\nبرای انتخاب جایگزین: ${shop}`
              : `❌ Order <code>${code}</code> was cancelled.`,
    });
    return { ok: true, status: "cancelled" };
  }

  if (action === "ship") {
    await writeStore(env, (st) => {
      const ord = st.orders[code];
      if (ord) { ord.status = "shipped"; decStock(st, ord.items); }
    });
    if (o.chatId) await tg(env, "sendMessage", {
      chat_id: o.chatId, parse_mode: "HTML",
      text: L ? `🚚 <b>سفارش <code>${code}</code> ارسال شد!</b>\nاگر کد رهگیری پست ثبت شود، همین‌جا برایت می‌فرستیم.\nممنون که ورتکس را انتخاب کردی 💪`
              : `🚚 <b>Order <code>${code}</code> is on the way!</b>`,
    });
    /* خبر موجودی صفر */
    const after = await readStore(env);
    const zeros = (o.items || []).filter((it) => { const h = stockFor(after, it.id, it.size); return h !== null && h <= 0; });
    if (zeros.length && env.OWNER_CHAT_ID) {
      await tg(env, "sendMessage", {
        chat_id: env.OWNER_CHAT_ID, parse_mode: "HTML",
        text: "⚠️ <b>موجودی این‌ها صفر شد</b> (سایت خودش «ناموجود» کرد):\n"
          + zeros.map((it) => `• ${it.name}${it.size ? " (" + it.size + ")" : ""}`).join("\n"),
      });
    }
    return { ok: true, status: "shipped" };
  }

  if (action === "track") {
    const num = String(body.tracking || "").replace(/[^\dA-Za-z-]/g, "").slice(0, 30);
    if (!num) return { ok: false, error: "no_tracking" };
    await writeStore(env, (st) => { const ord = st.orders[code]; if (ord) { ord.tracking = num; ord.status = "shipped"; } });
    if (o.chatId) await tg(env, "sendMessage", {
      chat_id: o.chatId, parse_mode: "HTML",
      text: `🚚 <b>کد رهگیری سفارش <code>${code}</code></b>\n<code>${num}</code>\n\nاز پست رهگیری کن: https://tracking.post.ir`,
    });
    return { ok: true, tracking: num, status: "shipped" };
  }

  return { ok: false, error: "bad_action" };
}

/* ---------- روتر پنل ------------------------------------------------------ */
export async function handleAdmin(request, env, url) {
  const path = url.pathname;

  /* دادهٔ عمومی سایت (برای خود سایت؛ بدون رمز) */
  if (path === "/api/site") {
    const site = await readSite(env);
    const cfg = { ...(site.cfg || {}) };
    delete cfg.passHash;                     /* هش رمز هرگز عمومی نمی‌شود */
    return json({ ok: true, cfg, texts: site.texts || { fa: {}, en: {} },
                  images: site.images || {}, theme: site.theme || {}, layout: site.layout || {} }, 200);
  }

  if (!path.startsWith("/api/admin/")) return null;

  if (request.method === "OPTIONS") return json({ ok: true });

  /* ورود */
  if (path === "/api/admin/login") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    if (!env.ADMIN_PASSWORD) return json({ ok: false, error: "no_password_set" }, 503);
    if (!(await verifyPassword(env, body.password))) return json({ ok: false, error: "wrong_password" }, 401);
    return json({ ok: true, token: await makeToken(env) });
  }

  /* بقیهٔ مسیرها → توکن لازم */
  if (!(await auth(request, env))) return json({ ok: false, error: "unauthorized" }, 401);

  if (path === "/api/admin/check") return json({ ok: true });

  if (path === "/api/admin/data") return json({ ok: true, ...(await adminData(env)) });

  if (path === "/api/admin/site") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const merged = await saveSite(env, body.patch || {});
    return json({ ok: true, site: { cfg: merged.cfg, texts: merged.texts, images: merged.images, theme: merged.theme, layout: merged.layout } });
  }

  if (path === "/api/admin/product") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    return json(await saveProduct(env, body));
  }

  if (path === "/api/admin/upload") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    return json(await uploadImage(env, body));
  }

  if (path === "/api/admin/password") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    if (!(await verifyPassword(env, body.current))) return json({ ok: false, error: "wrong_current" });
    const r = await setPassword(env, body.next);
    if (!r.ok) return json({ ok: false, error: r.error });
    return json({ ok: true, token: await makeToken(env) });
  }

  if (path === "/api/admin/order") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    return json(await orderAction(env, body));
  }

  return json({ ok: false, error: "unknown" }, 404);
}
