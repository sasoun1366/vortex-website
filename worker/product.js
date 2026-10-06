/* ==========================================================================
   VORTEX — پنل مدیریت محصولات داخل بات تلگرام
   --------------------------------------------------------------------------
   صاحب فروشگاه عکس محصول را می‌فرستد و مرحله‌به‌مرحله اسم، قیمت، سایزها،
   تعداد، دسته، توضیح و متن انگلیسی را می‌دهد؛ بات خودش محصول را روی سایت
   می‌گذارد.

   مسیر میان‌بر: عکس + کپشن چندخطی با قالب زیر → مستقیم می‌رود به پیش‌نمایش
     اسم: تی‌شرت تمرین ورتکس
     قیمت: 1480000
     سایز: S:2 M:5 L:3
     تعداد: 12          (برای محصول بدون سایز)
     دسته: پوشاک
     توضیح: پارچه سنگین‌وزن…
     انگلیسی: Vortex Performance Tee | Heavyweight tee
     برچسب: جدید
   ========================================================================== */

import {
  readCatalog, writeCatalog, putRepoFile, invalidate, MEDIA_DIR,
  CATS, catFa, catId, makeId, parseSizes, toSite, productSummary, toNum, faDigits,
} from "./catalog.js";
import { writeStore } from "./store.js";

const API_BASE = (env) => env.TELEGRAM_API_BASE || "https://api.telegram.org";
const FA = new Intl.NumberFormat("fa-IR");
const money = (n) => `${FA.format(Math.round(Number(n) || 0))} تومان`;
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SHOP = (env) => (env.SHOP_URL || "https://vortexgear.ir") + "/shop.html";
const BADGES = [
  { fa: "جدید", en: "New" },
  { fa: "پرفروش", en: "Best seller" },
  { fa: "کالکشن محدود", en: "Limited drop" },
  { fa: "", en: "" },
];

const STEP_ORDER = ["photo", "name", "price", "sizes", "qty", "cat", "desc", "en", "badge", "confirm"];

/* ---------- متن پرسش هر مرحله ------------------------------------------- */
function ask(step, d = {}) {
  switch (step) {
    case "photo":
      return "➕ <b>محصول جدید</b>\n\n📸 عکس محصول را همین‌جا بفرست.\n\n<i>هر وقت خواستی منصرف شوی: /cancel</i>";
    case "name":
      return "۱️⃣ <b>اسم محصول</b> را بنویس (فارسی).\n\nمثال: مچ‌بند تمرین ورتکس";
    case "price":
      return "۲️⃣ <b>قیمت</b> را فقط با عدد بنویس (تومان).\n\nمثال: <code>1480000</code>";
    case "sizes":
      return "۳️⃣ <b>سایزها و تعداد هر سایز</b>\n\n"
        + "مثال با سایز: <code>S:2 M:5 L:3</code>\n"
        + "محصول سایز ندارد: <code>-</code>\n"
        + "همهٔ سایزها یک اندازه: <code>*:10</code>";
    case "qty":
      return "۴️⃣ <b>چند عدد موجود داری؟</b> فقط عدد.\n\nاگر نمی‌خواهی موجودی را بشماری: <code>-</code>";
    case "cat":
      return "۵️⃣ <b>دستهٔ محصول</b> را انتخاب کن 👇";
    case "desc":
      return "۶️⃣ <b>توضیح کوتاه محصول</b> (۱–۲ خط).\n\nاگر نمی‌خواهی: /skip";
    case "en":
      return "۷️⃣ <b>متن انگلیسی سایت</b> (اختیاری)\n\nبه این شکل: <code>اسم انگلیسی | توضیح انگلیسی</code>\n"
        + "مثال: <code>Vortex Lifting Straps | Heavy cotton straps</code>\n\nاگر نمی‌خواهی: /skip";
    case "badge":
      return "۸️⃣ برای این محصول <b>برچسب</b> بگذارم؟ 👇";
    case "editprice":
      return `💰 <b>قیمت جدید</b> را بنویس (فقط عدد).\nمحصول: <code>${d.editId}</code>`;
    case "editphoto":
      return `🖼 <b>عکس جدید</b> را بفرست.\nمحصول: <code>${d.editId}</code>`;
    default:
      return "ادامه بده 👇";
  }
}

function kbCat() {
  return { inline_keyboard: [
    CATS.map((c) => ({ text: c.fa, callback_data: `pr:cat:${c.id}` })),
    [{ text: "❌ انصراف", callback_data: "pr:cancel" }],
  ] };
}
function kbBadge() {
  return { inline_keyboard: [
    BADGES.map((b, i) => ({ text: b.fa || "بدون برچسب", callback_data: `pr:badge:${i}` })),
    [{ text: "❌ انصراف", callback_data: "pr:cancel" }],
  ] };
}

/* ---------- پیش‌نمایش نهایی --------------------------------------------- */
function previewKeyboard(d) {
  return { inline_keyboard: [
    [{ text: "✅ انتشار روی سایت", callback_data: "pr:go" }],
    [
      { text: (d.featured === false ? "🔀 نمایش در صفحهٔ اصلی: خیر" : "🔀 نمایش در صفحهٔ اصلی: بله"), callback_data: "pr:feat" },
      { text: "❌ لغو", callback_data: "pr:cancel" },
    ],
  ] };
}
function previewText(d) {
  const sizes = d.sizes && d.sizes.length ? d.sizes.join(" · ") : "بدون سایز";
  const st = d.stock && Object.keys(d.stock).length
    ? Object.entries(d.stock).map(([k, v]) => (k === "*" ? `${v} عدد` : `${k}:${v}`)).join(" · ")
    : "بی‌نهایت";
  return [
    "👀 <b>پیش‌نمایش محصول</b>", "",
    `📦 <b>${esc(d.name || "—")}</b>${d.nameEn ? ` / ${esc(d.nameEn)}` : ""}`,
    `💰 ${money(d.price)}`,
    `📐 سایزها: ${esc(sizes)}`,
    `🔢 موجودی: ${esc(st)}`,
    `🗂 دسته: ${esc(catFa(d.cat))}`,
    d.badge && d.badge.fa ? `🏷 برچسب: ${esc(d.badge.fa)}` : "",
    d.desc ? `📝 ${esc(d.desc)}` : "",
    d.descEn ? `📝 EN: ${esc(d.descEn)}` : "",
    "",
    "منتشر کنم روی سایت؟ 👇",
  ].filter((l) => l !== "").join("\n");
}

/* ---------- تحلیل کپشن چندخطی («همه‌چیز در یک پیام») --------------------- */
function parseSpecBlock(text) {
  const out = {};
  const lines = String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let hits = 0;
  for (const line of lines) {
    const m = line.match(/^([^:：]{2,14})[:：]\s*(.+)$/);
    if (!m) continue;
    const key = faDigits(m[1]).toLowerCase().trim();
    const val = m[2].trim();
    const has = (...ws) => ws.some((w) => key.includes(w));
    if (has("اسم", "نام", "name", "title")) { out.name = val; hits++; }
    else if (has("قیمت", "price", "مبلغ")) { out.price = toNum(val); hits++; }
    else if (has("سایز", "size")) { const ps = parseSizes(val); out.sizes = ps.sizes; out.stock = { ...(out.stock || {}), ...ps.stock }; hits++; }
    else if (has("تعداد", "موجودی", "qty", "stock")) { const n = toNum(val); out.stock = { ...(out.stock || {}), ...(n ? { "*": n } : {}) }; hits++; }
    else if (has("دسته", "cat")) { out.cat = catId(val); hits++; }
    else if (has("توضیح", "desc", "معرفی")) { out.desc = val; hits++; }
    else if (has("انگلیسی", "english", "en")) {
      const [a, b] = val.split("|").map((s) => s.trim());
      out.nameEn = a || ""; out.descEn = b || ""; hits++;
    }
    else if (has("برچسب", "badge")) {
      const b = BADGES.find((x) => x.fa && (val.includes(x.fa))) || { fa: val, en: val };
      out.badge = b; hits++;
    }
  }
  return hits >= 2 && out.name && out.price ? out : null;
}

/* ---------- مدیریت جریان گفتگو ------------------------------------------ */
async function setDraft(env, patch) {
  await writeCatalog(env, (c) => {
    if (patch === null) { c.draft = null; return; }
    c.draft = { ...(c.draft || {}), ts: Date.now(), ...patch };
    if (patch.d) c.draft.d = { ...((c.draft && c.draft.d) || {}), ...patch.d };
  });
}
async function getDraft(env) {
  const c = await readCatalog(env);
  return c.draft || null;
}

/* شروع جریان محصول جدید */
export async function admStart(env, tg, chatId, store, firstPhotoId) {
  const d = { featured: true };
  if (firstPhotoId) d.photo = firstPhotoId;
  await setDraft(env, { chat: String(chatId), step: firstPhotoId ? "name" : "photo", d });
  await tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    text: firstPhotoId ? "📸 عکس ثبت شد ✅\n\n" + ask("name") : ask("photo"),
  });
}

/* ---------- آپلود عکس و انتشار ----------------------------------------- */
async function publish(env, tg, chatId, store) {
  const draft = await getDraft(env);
  const d = draft && draft.d;
  if (!d) return false;

  if (!d.photo) {
    await tg(env, "sendMessage", { chat_id: chatId, text: "عکس محصول را نفرستادی. عکس را بفرست 📸" });
    await setDraft(env, { step: "photo" });
    return true;
  }

  await tg(env, "sendMessage", { chat_id: chatId, text: "⏳ دارم محصول را روی سایت می‌گذارم…" });
  try {
    const id = d.id || makeId(d.nameEn, d.name);

    /* ۱) دانلود عکس از تلگرام */
    const gf = await tg(env, "getFile", { file_id: d.photo });
    const fp = gf && gf.result && gf.result.file_path;
    if (!fp) throw new Error("telegram_file_not_found");
    const img = await fetch(`${API_BASE(env)}/file/bot${env.BOT_TOKEN}/${fp}`);
    if (!img.ok) throw new Error("telegram_file_download_" + img.status);
    const buf = await img.arrayBuffer();
    const ext = /\.png$/i.test(fp) ? "png" : "jpg";

    /* ۲) عکس در ریپو + متادیتا در کاتالوگ */
    await putRepoFile(env, `${MEDIA_DIR}/${id}.${ext}`, bytesToB64(buf), `media: ${id}`);

    const product = {
      id,
      cat: catId(d.cat) || "accessory",
      img: `media/${id}.${ext}`,
      price: Number(d.price) || 0,
      oldPrice: 0,
      featured: d.featured !== false,
      badge: d.badge || { fa: "", en: "" },
      name: { fa: d.name || id, en: d.nameEn || d.name || id },
      desc: { fa: d.desc || "", en: d.descEn || d.desc || "" },
      sizes: Array.isArray(d.sizes) ? d.sizes : [],
      stock: d.stock || {},
      ts: Date.now(),
      active: true,
    };
    await writeCatalog(env, (c) => {
      c.products = (c.products || []).filter((p) => p.id !== id);
      c.products.push(product);
      c.draft = null;
    });

    /* ۳) موجودی در انبارهٔ فروشگاه (تا دکمهٔ «ناموجود» کار کند) */
    if (product.stock && Object.keys(product.stock).length) {
      await writeStore(env, (st) => {
        st.stock = st.stock || {};
        st.stock[id] = { ...(st.stock[id] || {}), ...product.stock };
      });
    }

    /* ۴) پیام موفقیت */
    const sizes = product.sizes.length ? product.sizes.join(" · ") : "بدون سایز";
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: [
        "🎉 <b>محصول روی سایت رفت!</b>", "",
        `📦 <b>${esc(product.name.fa)}</b>`,
        `💰 ${money(product.price)}`,
        `📐 ${esc(sizes)}`,
        `🗂 ${esc(catFa(product.cat))}${product.featured ? " · روی صفحهٔ اصلی" : ""}`,
        "", `🔗 ${SHOP(env)}`, "",
        "هر وقت خواستی قیمت، عکس یا موجودی را عوض کنی: /products",
      ].join("\n"),
      reply_markup: { inline_keyboard: [
        [{ text: "🛍 دیدن در فروشگاه", url: SHOP(env) }],
        [{ text: "➕ محصول بعدی", callback_data: "pr:new" }],
      ] },
    });
    return true;
  } catch (e) {
    console.error("publish failed:", e.message);
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: "⚠️ وسط کار یک مشکل خورد و محصول منتشر نشد.\nدوباره دکمهٔ «✅ انتشار روی سایت» را بزن.\n\n"
        + `<i>${esc(String(e.message).slice(0, 90))}</i>`,
      reply_markup: previewKeyboard(d),
    });
    return true;
  }
}

function bytesToB64(buf) {
  const b = new Uint8Array(buf);
  let out = "";
  const CH = 0x8000;
  for (let i = 0; i < b.length; i += CH) out += String.fromCharCode.apply(null, b.subarray(i, i + CH));
  return btoa(out);
}

/* ---------- پیام‌های ورودی مالک ----------------------------------------- */
export async function admMessage(env, tg, chatId, msg, text, store) {
  const t = String(text || "").trim();
  const draft = await getDraft(env);
  const mine = draft && String(draft.chat) === String(chatId);
  const photoId = msg.photo && msg.photo.length ? msg.photo[msg.photo.length - 1].file_id
    : (msg.document && /^image\//.test(msg.document.mime_type || "") ? msg.document.file_id : null);
  const caption = (msg.caption || "").trim();

  /* --- دستورها ---------------------------------------------------------- */
  if (/^\/(new|product|add)\b/.test(t)) {
    if (caption && photoId) { /* پایین‌تر در همین اجرا هندل می‌شود */ }
    else { await admStart(env, tg, chatId, store); return true; }
  }
  if (/^\/(cancel|off)\b/.test(t)) {
    if (mine) { await setDraft(env, null); await tg(env, "sendMessage", { chat_id: chatId, text: "لغو شد ✅" }); return true; }
    return false;
  }
  if (/^\/(products|list)\b/.test(t)) { await productList(env, tg, chatId, store); return true; }
  if (/^\/skip\b/.test(t) && (!mine || !["desc", "en"].includes(draft.step))) return false;

  /* --- عکس از مالک: همیشه = محصول (مگر وسط ویرایش قیمت باشیم) ---------- */
  if (photoId && (!mine || draft.step !== "editprice")) {
    if (mine && draft.step === "editprice") { /* بی‌خیال */ }
    /* عکس + کپشن کامل → مستقیم پیش‌نمایش */
    const spec = caption ? parseSpecBlock(caption) : null;
    if (spec) {
      const d = {
        photo: photoId, name: spec.name, nameEn: spec.nameEn || "", price: spec.price,
        sizes: spec.sizes || [], stock: spec.stock || {}, cat: spec.cat || "accessory",
        desc: spec.desc || "", descEn: spec.descEn || "", badge: spec.badge || { fa: "", en: "" },
        featured: true,
      };
      await setDraft(env, { chat: String(chatId), step: "confirm", d });
      await showPreview(env, tg, chatId, d);
      return true;
    }
    if (mine && draft.step === "editphoto") {
      await setDraft(env, { step: "editphoto", d: { photo: photoId, keepEdit: true } });
      await applyPhotoEdit(env, tg, chatId, store);
      return true;
    }
    if (mine && !["photo"].includes(draft.step)) {
      await setDraft(env, { d: { photo: photoId } });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "📸 عکس عوض شد ✅\n\n" + ask(draft.step, draft.d) });
      return true;
    }
    await admStart(env, tg, chatId, store, photoId);
    return true;
  }

  /* --- ویرایش قیمت ------------------------------------------------------ */
  if (mine && draft.step === "editprice") {
    const n = toNum(t);
    if (!n) { await tg(env, "sendMessage", { chat_id: chatId, text: "یک عدد بفرست، مثلاً 1480000" }); return true; }
    const id = draft.d.editId;
    await writeCatalog(env, (c) => {
      const p = (c.products || []).find((x) => x.id === id);
      if (p) p.price = n;
      c.draft = null;
    });
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ قیمت محصول <code>${esc(id)}</code> شد <b>${money(n)}</b> — همین حالا روی سایت عوض شد.` });
    return true;
  }

  /* --- ادامهٔ جریان ساخت محصول ----------------------------------------- */
  if (mine) {
    const d = { ...(draft.d || {}) };
    const step = draft.step;
    const needPhotoMsg = "عکس محصول را نفرستادی — اول عکس را بفرست 📸";
    switch (step) {
      case "name": {
        if (!t) return true;
        d.name = t.replace(/\s+/g, " ").slice(0, 80);
        await setDraft(env, { step: "price", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("price", d) });
        return true;
      }
      case "price": {
        const n = toNum(t);
        if (!n) { await tg(env, "sendMessage", { chat_id: chatId, text: "قیمت را فقط با عدد بنویس، مثلاً 1480000" }); return true; }
        d.price = n;
        await setDraft(env, { step: "sizes", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("sizes", d) });
        return true;
      }
      case "sizes": {
        const ps = parseSizes(t);
        d.sizes = ps.sizes; d.stock = ps.stock;
        if (ps.askQty) {
          await setDraft(env, { step: "qty", d });
          await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("qty", d) });
        } else {
          await setDraft(env, { step: "cat", d });
          await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("cat", d), reply_markup: kbCat() });
        }
        return true;
      }
      case "qty": {
        const n = t === "-" || t === "—" ? null : toNum(t);
        d.sizes = []; d.stock = n ? { "*": n } : {};
        await setDraft(env, { step: "cat", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("cat", d), reply_markup: kbCat() });
        return true;
      }
      case "cat": {
        const cid = catId(t);
        if (!cid) { await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "از دکمه‌های زیر انتخاب کن 👇", reply_markup: kbCat() }); return true; }
        d.cat = cid;
        await setDraft(env, { step: "desc", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("desc", d) });
        return true;
      }
      case "desc": {
        d.desc = /^\/skip\b/.test(t) ? "" : t.replace(/\s+/g, " ").slice(0, 220);
        await setDraft(env, { step: "en", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("en", d) });
        return true;
      }
      case "en": {
        if (!/^\/skip\b/.test(t) && t) {
          const [a, b] = t.split("|").map((s) => s.trim());
          d.nameEn = (a || "").slice(0, 90);
          d.descEn = (b || "").slice(0, 220);
        }
        await setDraft(env, { step: "badge", d });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("badge", d), reply_markup: kbBadge() });
        return true;
      }
      case "confirm": {
        if (!d.photo) { await setDraft(env, { step: "photo", d }); await tg(env, "sendMessage", { chat_id: chatId, text: needPhotoMsg }); return true; }
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "از دکمه‌های بالای همین پیام استفاده کن 👆\n(اگر دکمه‌ها را نمی‌بینی، /products را بزن)" });
        return true;
      }
      case "photo": {
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "منتظر عکس محصول هستم 📸\n\n" + ask("photo") });
        return true;
      }
      default:
        return false;
    }
  }
  return false;
}

/* ---------- پیش‌نمایش ---------------------------------------------------- */
async function showPreview(env, tg, chatId, d) {
  const cap = previewText(d).slice(0, 1000);
  const kb = previewKeyboard(d);
  try {
    if (d.photo) {
      const r = await tg(env, "sendPhoto", { chat_id: chatId, photo: d.photo, caption: cap, parse_mode: "HTML", reply_markup: kb });
      if (r && r.ok) return true;
    }
  } catch (e) {}
  await tg(env, "sendMessage", { chat_id: chatId, text: cap, parse_mode: "HTML", reply_markup: kb });
  return true;
}

/* ---------- جای‌گذاری عکس جدید روی محصول موجود -------------------------- */
async function applyPhotoEdit(env, tg, chatId, store) {
  const draft = await getDraft(env);
  const d = (draft && draft.d) || {};
  const id = d.editId;
  const photoId = d.photo;
  if (!id || !photoId) return false;
  try {
    const gf = await tg(env, "getFile", { file_id: photoId });
    const fp = gf && gf.result && gf.result.file_path;
    if (!fp) throw new Error("telegram_file_not_found");
    const img = await fetch(`${API_BASE(env)}/file/bot${env.BOT_TOKEN}/${fp}`);
    const buf = await img.arrayBuffer();
    const ext = /\.png$/i.test(fp) ? "png" : "jpg";
    await putRepoFile(env, `${MEDIA_DIR}/${id}.${ext}`, bytesToB64(buf), `media: ${id} (replace)`);
    await writeCatalog(env, (c) => {
      const p = (c.products || []).find((x) => x.id === id);
      if (p) p.img = `media/${id}.${ext}?v=${Date.now().toString(36)}`;
      c.draft = null;
    });
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ عکس محصول <code>${esc(id)}</code> عوض شد — سایت همین حالا عکس جدید را نشان می‌دهد.`,
      reply_markup: { inline_keyboard: [[{ text: "🛍 دیدن در فروشگاه", url: SHOP(env) }]] } });
    return true;
  } catch (e) {
    console.error("photo edit failed:", e.message);
    await tg(env, "sendMessage", { chat_id: chatId, text: "⚠️ عوض‌کردن عکس نشد. یک بار دیگر عکس را بفرست." });
    return true;
  }
}

/* ---------- لیست محصولات ------------------------------------------------- */
export async function productList(env, tg, chatId, store) {
  const cat = await readCatalog(env);
  const list = (cat.products || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (!list.length) {
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "هنوز محصولی با بات اضافه نشده.\n\nبرای شروع یک <b>عکس محصول</b> بفرست یا /new را بزن." });
    return true;
  }
  const rows = [];
  const lines = ["🗂 <b>محصولات ساختهٔ بات</b>", ""];
  list.forEach((p, i) => {
    const active = p.active !== false;
    const onboard = Boolean((store.stock || {})[p.id] && Object.keys(store.stock[p.id]).length);
    lines.push(`${FA.format(i + 1)}. ${active ? "🟢" : "⚫️"} <b>${esc(p.name && p.name.fa ? p.name.fa : p.id)}</b> — ${money(p.price)}${onboard ? "" : " — <i>موجودی ثبت نشده</i>"}`);
    rows.push([
      { text: active ? "🚫 مخفی" : "✅ نمایش", callback_data: `pr:${active ? "hide" : "show"}:${p.id}` },
      { text: "💰 قیمت", callback_data: `pr:price:${p.id}` },
      { text: "🖼 عکس", callback_data: `pr:photo:${p.id}` },
      { text: "🗑 حذف", callback_data: `pr:del:${p.id}` },
    ]);
  });
  lines.push("", "➕ محصول جدید: /new");
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: lines.join("\n"), reply_markup: { inline_keyboard: rows } });
  return true;
}

/* ---------- دکمه‌ها ------------------------------------------------------ */
export async function admCallback(env, tg, cb, store) {
  const data = String(cb.data || "");
  if (!data.startsWith("pr:")) return false;
  const [, action, arg] = data.split(":");
  const chatId = cb.message && cb.message.chat ? cb.message.chat.id : null;
  const msgId = cb.message ? cb.message.message_id : null;
  const ack = (text) => tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text });

  const dropButtons = () => msgId
    ? tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: msgId, reply_markup: { inline_keyboard: [] } }).catch(() => {})
    : Promise.resolve();

  if (action === "new") {
    await ack("بریم برای محصول بعدی");
    await admStart(env, tg, chatId, store);
    return true;
  }

  if (action === "cancel") {
    await setDraft(env, null);
    await ack("لغو شد");
    await dropButtons();
    await tg(env, "sendMessage", { chat_id: chatId, text: "لغو شد ✅" });
    return true;
  }

  /* --- دکمه‌های جریان ساخت محصول --- */
  const draft = await getDraft(env);
  if (draft && draft.d && ["cat", "badge", "confirm"].includes(draft.step)) {
    const d = { ...draft.d };
    if (action === "cat") {
      d.cat = arg;
      await setDraft(env, { step: "desc", d });
      await ack(catFa(arg));
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ask("desc", d) });
      return true;
    }
    if (action === "badge") {
      d.badge = BADGES[Number(arg)] || { fa: "", en: "" };
      await setDraft(env, { step: "confirm", d });
      await ack(d.badge.fa || "بدون برچسب");
      await showPreview(env, tg, chatId, d);
      return true;
    }
    if (action === "feat") {
      d.featured = d.featured === false;
      await setDraft(env, { step: "confirm", d });
      await ack(d.featured === false ? "از صفحهٔ اصلی برداشته شد" : "در صفحهٔ اصلی نشان داده می‌شود");
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: msgId, reply_markup: previewKeyboard(d) }).catch(() => {});
      return true;
    }
    if (action === "go") {
      await ack("دارم منتشر می‌کنم…");
      await dropButtons();
      await publish(env, tg, chatId, store);
      return true;
    }
  }

  /* --- دکمه‌های لیست محصولات --- */
  if (["hide", "show", "price", "photo", "del", "delok"].includes(action)) {
    const id = arg;
    const cat = await readCatalog(env);
    const prod = (cat.products || []).find((p) => p.id === id);
    if (!prod) { await ack("محصول پیدا نشد"); return true; }

    if (action === "hide" || action === "show") {
      const active = action === "show";
      await writeCatalog(env, (c) => { const p = (c.products || []).find((x) => x.id === id); if (p) p.active = active; });
      await ack(active ? "روی سایت رفت" : "از سایت برداشته شد");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: active ? `✅ <b>${esc(prod.name.fa)}</b> دوباره روی سایت رفت.` : `🚫 <b>${esc(prod.name.fa)}</b> از سایت برداشته شد (حذف نشد، هر وقت خواستی برگردانش).` });
      return true;
    }
    if (action === "price") {
      await setDraft(env, { chat: String(chatId), step: "editprice", d: { editId: id } });
      await ack("قیمت جدید را بنویس");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `💰 قیمت فعلی <b>${esc(prod.name.fa)}</b>: ${money(prod.price)}\n\nقیمت جدید را فقط با عدد بنویس.` });
      return true;
    }
    if (action === "photo") {
      await setDraft(env, { chat: String(chatId), step: "editphoto", d: { editId: id, photo: "" } });
      await ack("عکس جدید را بفرست");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🖼 عکس جدید <b>${esc(prod.name.fa)}</b> را بفرست.` });
      return true;
    }
    if (action === "del") {
      await ack("تأیید می‌خواهد");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🗑 <b>${esc(prod.name.fa)}</b> حذف شود؟ (از سایت و از لیست)`,
        reply_markup: { inline_keyboard: [[
          { text: "🗑 بله، حذف کن", callback_data: `pr:delok:${id}` },
          { text: "❌ نه", callback_data: "pr:cancel" },
        ]] } });
      return true;
    }
    if (action === "delok") {
      await writeCatalog(env, (c) => { c.products = (c.products || []).filter((p) => p.id !== id); c.draft = null; });
      await ack("حذف شد");
      await dropButtons();
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🗑 <b>${esc(prod.name.fa)}</b> از سایت حذف شد.` });
      return true;
    }
  }

  await ack("انجام شد");
  return true;
}

/* ---------- راهنمای بخش محصولات ----------------------------------------- */
export const PRODUCT_HELP = [
  "📦 <b>مدیریت محصولات با بات</b>", "",
  "یک <b>عکس محصول</b> بفرست → بات خودش مراحل را می‌پرسد:",
  "اسم ← قیمت ← سایزها و تعداد ← دسته ← توضیح ← متن انگلیسی ← برچسب",
  "بعد پیش‌نمایش می‌بینی و با یک دکمه منتشر می‌شود.",
  "",
  "⚡️ <b>میان‌بر:</b> عکس + این کپشن (هر خطی که نخواستی را ننویس):",
  "<code>اسم: تی‌شرت تمرین ورتکس\nقیمت: 1480000\nسایز: S:2 M:5 L:3\nدسته: پوشاک\nتوضیح: پارچه سنگین‌وزن\nانگلیسی: Vortex Tee | Heavyweight</code>",
  "",
  "<code>/new</code> — محصول جدید",
  "<code>/products</code> — لیست محصولات + دکمهٔ قیمت/عکس/مخفی/حذف",
  "<code>/cancel</code> — لغو مرحلهٔ جاری",
].join("\n");
