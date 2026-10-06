/* ==========================================================================
   VORTEX — کاتالوگ محصولات (دیتابیس دوم، مخصوص محصولات بات)
   --------------------------------------------------------------------------
   محصولاتی که صاحب فروشگاه با بات تلگرام اضافه/ویرایش می‌کند اینجا ذخیره
   می‌شوند و سایت همان لحظه آن‌ها را نشان می‌دهد — بدون دیپلوی مجدد.

   • متادیتای محصول → data/catalog.json  (همین ریپو)
   • عکس محصول      → media/products/<id>.<ext>  و از مسیر /media/<file>
                       با کش لبه (edge cache) سرو می‌شود.

   چرا عکس‌ها در ریپو و نه کنار فایل‌های استاتیک سایت؟ چون فایل‌های
   استاتیک فقط با دیپلوی عوض می‌شوند؛ ذخیره در ریپو + سرو از Worker یعنی
   عکس جدید بلافاصله بالای سایت است.
   ========================================================================== */

const GH_REPO = "sasoun1366/vortex-website";
const CATALOG_FILE = "data/catalog.json";
export const MEDIA_DIR = "media/products";

const EMPTY = { products: [], soon: [], cfg: {}, draft: null };
const TTL = 4000;                       // کش کوتاه در حافظهٔ isolate
let _cache = { at: 0, data: null, sha: null };

export const CATS = [
  { id: "apparel",   fa: "پوشاک",          en: "Apparel" },
  { id: "accessory", fa: "اکسسوری",        en: "Accessories" },
  { id: "gear",      fa: "تجهیزات تمرین",  en: "Training gear" },
];
export const catFa = (id) => (CATS.find((c) => c.id === id) || {}).fa || id;
export const catId = (s) => {
  const t = String(s || "").trim().toLowerCase();
  const hit = CATS.find((c) => c.id === t || c.fa === t || c.en.toLowerCase() === t)
    || CATS.find((c) => t.includes(c.fa) || t.includes(c.id) || t.includes(c.en.toLowerCase()));
  return hit ? hit.id : null;
};

const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s) => decodeURIComponent(escape(atob(String(s).replace(/\s+/g, ""))));

export function bytesToB64(buf) {
  const b = new Uint8Array(buf);
  let out = "";
  const CH = 0x8000;
  for (let i = 0; i < b.length; i += CH) out += String.fromCharCode.apply(null, b.subarray(i, i + CH));
  return btoa(out);
}

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

/* ---------- خواندن / نوشتن کاتالوگ -------------------------------------- */
export async function readCatalog(env) {
  if (_cache.data && Date.now() - _cache.at < TTL) return _cache.data;
  try {
    const r = await gh(`contents/${CATALOG_FILE}`, env);
    if (r.status === 404) {
      _cache = { at: Date.now(), data: structuredClone(EMPTY), sha: null };
      return _cache.data;
    }
    if (!r.ok) throw new Error("gh_read_" + r.status);
    const j = await r.json();
    const data = JSON.parse(b64d(j.content || "{}") || "{}");
    _cache = { at: Date.now(), data: { ...structuredClone(EMPTY), ...data }, sha: j.sha };
    return _cache.data;
  } catch (e) {
    console.error("catalog read failed:", e.message);
    return _cache.data || structuredClone(EMPTY);
  }
}

export function invalidate() { _cache = { at: 0, data: null, sha: null }; }

async function freshRead(env) { invalidate(); return readCatalog(env); }

export async function writeCatalog(env, mutate, _retry = 0) {
  const cur = await freshRead(env);
  const next = structuredClone(cur);
  mutate(next);
  try {
    let sha = _cache.sha;
    if (!sha) {
      const r = await gh(`contents/${CATALOG_FILE}`, env);
      if (r.ok) sha = (await r.json()).sha;
    }
    const body = {
      message: `catalog: ${new Date().toISOString()}`,
      content: b64e(JSON.stringify(next, null, 1)),
      committer: { name: "Vortex Bot", email: "hello@vortexgear.ir" },
    };
    if (sha) body.sha = sha;
    const put = await gh(`contents/${CATALOG_FILE}`, env, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!put.ok) {
      const txt = (await put.text()).slice(0, 140);
      if ((put.status === 409 || put.status === 422) && _retry < 2) {
        invalidate();
        return writeCatalog(env, mutate, _retry + 1);
      }
      throw new Error("gh_write_" + put.status + " " + txt);
    }
    const j = await put.json();
    _cache = { at: Date.now(), data: next, sha: j.content && j.content.sha };
    return next;
  } catch (e) {
    console.error("catalog write failed:", e.message);
    _cache = { at: Date.now(), data: next, sha: _cache.sha };
    return next;
  }
}

/* ---------- آپلود فایل (عکس محصول) در ریپو ----------------------------- */
export async function putRepoFile(env, path, base64, message) {
  let sha;
  const r = await gh(`contents/${path}`, env);
  if (r.ok) sha = (await r.json()).sha;
  const body = { message, content: base64, committer: { name: "Vortex Bot", email: "hello@vortexgear.ir" } };
  if (sha) body.sha = sha;
  const put = await gh(`contents/${path}`, env, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!put.ok) throw new Error("media_put_" + put.status + " " + (await put.text()).slice(0, 120));
  return true;
}

/* ---------- ابزارهای متن/عدد فارسی -------------------------------------- */
export function faDigits(s) {
  return String(s == null ? "" : s)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}
export function toNum(s) {
  const t = faDigits(s).replace(/[^\d]/g, "");
  return t ? Number(t) : 0;
}

/* ---------- ساخت شناسهٔ محصول ------------------------------------------- */
const SLUG_STOP = ["vortex", "ورتکس", "the", "a", "of", "and", "با", "و"];
export function makeId(seedEn, seedFa) {
  const src = String(seedEn || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim();
  let slug = src.split(/[\s-]+/).filter((w) => w && !SLUG_STOP.includes(w)).slice(0, 3).join("-");
  if (!slug) slug = "p" + Date.now().toString(36).slice(-4);
  slug = slug.slice(0, 18).replace(/-+$/, "");
  const rand = Math.random().toString(36).slice(2, 4);
  return `vx-${slug}-${rand}`;
}

/* ---------- تحلیل «سایزها و تعداد» --------------------------------------
   ورودی‌های پذیرفته‌شده:
     S:2 M:5 L:3      → سایز با موجودی
     S,M,L            → سایز بدون عدد (موجودی بی‌نهایت)
     *:10             → محصول بدون سایز با موجودی ۱۰
     -                → بدون سایز (بعداً تعداد پرسیده می‌شود)
   ----------------------------------------------------------------------- */
export function parseSizes(input) {
  const raw = faDigits(String(input || "")).trim();
  if (!raw || /^[-—–]+$/.test(raw) || /ندارم|ندارد|نداره|بدون/.test(raw)) {
    return { sizes: [], stock: {}, askQty: true };
  }
  const tokens = raw.split(/[,،\n]+|\s+/).map((s) => s.trim()).filter(Boolean);
  const sizes = [];
  const stock = {};
  let starQty = null;
  for (const t of tokens) {
    const m = t.match(/^([^:：]+)[:：](\d+)$/);
    if (m) {
      const name = m[1].trim();
      const qty = Number(m[2]);
      if (name === "*" || /^همه$/.test(name)) { starQty = qty; continue; }
      if (!sizes.includes(name)) sizes.push(name);
      stock[name] = qty;
    } else if (/^\*\s*[:：]?\s*\d*$/.test(t)) {
      const n = t.match(/(\d+)/);
      if (n) starQty = Number(n[1]);
    } else {
      const name = t.replace(/[:：]\s*$/, "").trim();
      if (name && !sizes.includes(name)) sizes.push(name);
    }
  }
  if (!sizes.length && starQty === null) return { sizes: [], stock: {}, askQty: true };
  if (!sizes.length) return { sizes: [], stock: { "*": starQty }, askQty: false };
  return { sizes, stock, askQty: false };
}

/* ---------- قالب محصول برای سایت ---------------------------------------- */
const asBi = (v) => {
  if (v && typeof v === "object") return { fa: String(v.fa || v.en || ""), en: String(v.en || v.fa || "") };
  const s = String(v == null ? "" : v);
  return { fa: s, en: s };
};

export function toSite(p) {
  const out = {
    id: p.id,
    cat: catId(p.cat) || "accessory",
    img: p.img || "",
    price: Number(p.price) || 0,
    oldPrice: Number(p.oldPrice) || 0,
    featured: Boolean(p.featured),
    badge: asBi(p.badge),
    name: asBi(p.name),
    desc: asBi(p.desc),
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    ts: p.ts || 0,
  };
  if (out.badge.fa === "" && out.badge.en === "") out.badge = { fa: "", en: "" };
  if (out.badge.fa && !out.badge.en) out.badge.en = out.badge.fa;
  return out;
}

/* ---------- بازنویسی محصول موجود (قیمت/اسم/عکس/…) ----------------------
   صاحب فروشگاه می‌تواند محصولات ثابت سایت را هم با بات عوض کند؛ این
   بازنویسی‌ها در catalog.overrides ذخیره و همین‌جا روی محصول اعمال می‌شوند.
   ---------------------------------------------------------------------- */
export function applyOverride(p, ov) {
  if (!ov) return p;
  const out = { ...p };
  if (ov.price != null) out.price = Number(ov.price) || 0;
  if (ov.oldPrice != null) out.oldPrice = Number(ov.oldPrice) || 0;
  if (ov.img) out.img = ov.img;
  if (ov.cat) out.cat = catId(ov.cat) || out.cat;
  if (ov.featured != null) out.featured = Boolean(ov.featured);
  if (ov.name) out.name = { ...(p.name || {}), ...ov.name };
  if (ov.desc) out.desc = { ...(p.desc || {}), ...ov.desc };
  if (ov.badge) out.badge = { ...(p.badge || {}), ...ov.badge };
  if (Array.isArray(ov.sizes)) out.sizes = ov.sizes;
  return out;
}

/* ---------- متن خلاصهٔ محصول (برای پیش‌نمایش و لیست) -------------------- */
export function productSummary(p, money) {
  const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes.join(" · ") : "بدون سایز";
  const st = p.stock && Object.keys(p.stock).length
    ? Object.entries(p.stock).map(([k, v]) => (k === "*" ? `${v} عدد` : `${k}:${v}`)).join(" · ")
    : "بی‌نهایت";
  return [
    `📦 <b>${p.name}</b>`,
    `💰 ${money(Number(p.price) || 0, "fa")}`,
    `📐 سایزها: ${sizes}`,
    `🔢 موجودی: ${st}`,
    `🗂 دسته: ${catFa(p.cat)}`,
    p.desc ? `📝 ${p.desc}` : "",
  ].filter(Boolean).join("\n");
}
