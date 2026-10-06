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
  CATS, catFa, catId, makeId, parseSizes, toSite, productSummary, toNum, faDigits, applyOverride,
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
    case "editname":
      return `✏️ <b>اسم جدید</b> را بنویس.\nمحصول فعلی: <b>${esc(d.editLabel || d.editId)}</b>`;
    case "editdesc":
      return `📝 <b>توضیح جدید</b> را بنویس (یا /skip برای خالی‌کردن).\nمحصول: <b>${esc(d.editLabel || d.editId)}</b>`;
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
  /* اگر مالک وسط مرحلهٔ ساخت محصول، یک دستور مدیریتی بنویسد
     (مثل «قیمت گچ رو بکن ۵۵۰ هزار»)، جریان متوقف نمی‌شود ولی دستور هم اجرا می‌شود */
  if (t && !t.startsWith("/") && !msg.photo) {
    const cat0 = await readCatalog(env);
    if (isAdminIntent(t, adminPool(cat0))) return false;
  }
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

  /* --- ویرایش اسم / توضیح با متن ---------------------------------------- */
  if (mine && (draft.step === "editname" || draft.step === "editdesc")) {
    const id = draft.d.editId;
    const v = /^\/skip\b/.test(t) ? "" : t.slice(0, 220);
    await writeCatalog(env, (c) => {
      c.overrides = c.overrides || {};
      const cur = c.overrides[id] || {};
      const key = draft.step === "editname" ? "name" : "desc";
      c.overrides[id] = { ...cur, [key]: { ...((cur[key]) || {}), fa: v } };
      c.draft = null;
    });
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: draft.step === "editname"
        ? `✅ اسم محصول شد <b>${esc(v)}</b>`
        : `✅ توضیح عوض شد.` });
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
      c.overrides = c.overrides || {};
      c.overrides[id] = { ...(c.overrides[id] || {}), img: `media/${id}.${ext}?v=${Date.now().toString(36)}` };
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
  const botList = (cat.products || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const hiddenIds = new Set(cat.hidden || []);
  const ov = cat.overrides || {};

  const rows = [];
  const lines = ["🗂 <b>محصولات سایت</b>", ""];

  const push = (p, { id, name, price, sizes, kind }) => {
    const total = stockTotal(store, id, sizes, kind);
    const stockTxt = total === null ? "موجودی: بی‌نهایت" : total <= 0 ? "🔴 ناموجود" : `🟢 موجودی ${FA.format(total)}`;
    const isHidden = hiddenIds.has(id);
    lines.push(`${isHidden ? "⚫️" : "🟢"} <b>${esc(name)}</b> — ${money(price)} — ${stockTxt}`);
    rows.push([
      { text: isHidden ? "✅ نمایش" : "🚫 مخفی", callback_data: `pr:${isHidden ? "show" : "hide"}:${id}` },
      { text: "💰 قیمت", callback_data: `pr:price:${id}` },
      { text: "🖼 عکس", callback_data: `pr:photo:${id}` },
      kind === "static"
        ? { text: "🗑 از سایت", callback_data: `pr:del:${id}` }
        : { text: "🗑 حذف کامل", callback_data: `pr:del:${id}` },
    ]);
  };

  STATIC.forEach((sp) => push(null, {
    id: sp.id, kind: "static", sizes: sp.sizes,
    name: (ov[sp.id] && ov[sp.id].name && ov[sp.id].name.fa) || sp.fa,
    price: (ov[sp.id] && ov[sp.id].price != null) ? ov[sp.id].price : sp.price,
  }));
  botList.forEach((p) => push(p, {
    id: p.id, kind: "bot", sizes: p.sizes || [],
    name: (p.name && p.name.fa) || p.id,
    price: (ov[p.id] && ov[p.id].price != null) ? ov[p.id].price : p.price,
  }));

  lines.push("", "💰 با دکمه‌ها عوض کن، یا همین‌جا بنویس: «قیمت گچ رو ۵۵۰ هزار کن»");
  lines.push("➕ محصول جدید: /new");
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

  /* --- انتخاب بین چند محصول هم‌نام --- */
  if (action === "pick") {
    const draft = await getDraft(env);
    const d = (draft && draft.d) || {};
    const id = (d.pickIds || [])[Number(arg)];
    if (!id) { await ack("پیدا نشد"); return true; }
    const cat = await readCatalog(env);
    const prod = adminPool(cat).find((p) => p.id === id);
    await ack(prod ? prod.fa : "…");
    await dropButtons();
    if (!prod) return true;
    await setDraft(env, null);
    await applyAction(env, tg, chatId, prod, { act: d.act, val: d.val, size: d.size, cat, store, raw: "", draftOpen: false });
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
  if (["hide", "show", "price", "photo", "del", "hideokdo", "delok"].includes(action)) {
    const id = arg;
    const cat = await readCatalog(env);
    const prod = adminPool(cat).find((p) => p.id === id);
    if (!prod) { await ack("محصول پیدا نشد"); return true; }

    if (action === "hide" || action === "show") {
      await setHidden(env, id, action === "hide");
      await ack(action === "hide" ? "از سایت برداشته شد" : "روی سایت رفت");
      await dropButtons();
      const nm = esc(pname(prod));
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: action === "hide"
          ? `🚫 <b>${nm}</b> از سایت برداشته شد.\n<i>پاک نشده — با «${nm} رو برگردون» یا دکمهٔ ✅ نمایش برمی‌گردد.</i>`
          : `✅ <b>${nm}</b> دوباره روی سایت آمد.` });
      return true;
    }
    if (action === "price") {
      await setDraft(env, { chat: String(chatId), step: "editprice", d: { editId: id } });
      await ack("قیمت جدید را بنویس");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `💰 قیمت فعلی <b>${esc(pname(prod))}</b>: ${money(effPrice(prod, cat))}\n\nقیمت جدید را فقط با عدد بنویس.` });
      return true;
    }
    if (action === "photo") {
      await setDraft(env, { chat: String(chatId), step: "editphoto", d: { editId: id, photo: "" } });
      await ack("عکس جدید را بفرست");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🖼 عکس جدید <b>${esc(pname(prod))}</b> را بفرست.` });
      return true;
    }
    if (action === "del") {
      const isBot = (cat.products || []).some((p) => p.id === id);
      await ack("تأیید می‌خواهد");
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🗑 <b>${esc(pname(prod))}</b> از سایت برداشته شود؟`,
        reply_markup: { inline_keyboard: [[
          { text: "🗑 بله، از سایت بردار", callback_data: `pr:hideokdo:${id}` },
          isBot ? { text: "🧨 کامل پاک کن", callback_data: `pr:delok:${id}` } : { text: "❌ نه", callback_data: "pr:cancel" },
        ]] } });
      return true;
    }
    if (action === "hideokdo") {
      await setHidden(env, id, true);
      await ack("از سایت برداشته شد");
      await dropButtons();
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🚫 <b>${esc(pname(prod))}</b> از سایت برداشته شد.\nهر وقت خواستی برگردانی: «${esc(pname(prod))} رو برگردون»` });
      return true;
    }
    if (action === "delok") {
      await writeCatalog(env, (c) => {
        c.products = (c.products || []).filter((p) => p.id !== id);
        c.hidden = (c.hidden || []).filter((x) => x !== id);
        if (c.overrides) delete c.overrides[id];
        c.draft = null;
      });
      await ack("کامل پاک شد");
      await dropButtons();
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🧨 <b>${esc(pname(prod))}</b> کامل پاک شد (دیگر قابل برگشت نیست).` });
      return true;
    }
  }

  await ack("انجام شد");
  return true;
}

/* ==========================================================================
   مدیر سایت با زبان آدمیزاد
   --------------------------------------------------------------------------
   مثال‌هایی که کار می‌کنند:
     «قیمت گچ رو بکن ۵۵۰ هزار»        «قیمت تی‌شرت ۱٬۶۰۰٬۰۰۰ تومان»
     «موجودی مچ‌بند ۳۰ سانت رو ۵ کن»   «تی‌شرت ناموجود شد»  «گچ تموم شد»
     «جاکلیدی رو از سایت حذف کن»       «کراپ رو برگردون»
     «عکس گچ رو عوض کن»                «اسم کراپ رو عوض کن به کراپ زمستانی»
     «توضیح کروپ رو عوض کن به ...»     «محصولات»  «محصول جدید»
   ========================================================================== */

/* همین پنج محصول ثابت سایت (public/assets/js/products.js) — برای اینکه بات
   بتواند با اسم فارسی‌شان پیدایشان کند. اگر محصول ثابتی اضافه/کم شد، اینجا هم عوض کن. */
const STATIC = [
  { id: "vx-tee-001",   key: "tee",   fa: "تی‌شرت تمرین ورتکس",            en: "Vortex Performance Tee",      cat: "apparel",   sizes: ["S", "M", "L", "XL", "XXL"], price: 1480000 },
  { id: "vx-crop-001",  key: "crop",  fa: "تی‌شرت کراپ فصل ۰۱ شماره ۶",     en: "Crop Tee Season 01 Issue 6",  cat: "apparel",   sizes: ["S", "M", "L"],             price: 1250000 },
  { id: "vx-wrap-001",  key: "wrap",  fa: "مچ‌بند تمرین ورتکس",            en: "Vortex Wrist Wraps",          cat: "gear",      sizes: ["30cm", "45cm"],            price: 690000 },
  { id: "vx-chalk-001", key: "chalk", fa: "گچ مایع ورتکس ۱۵۰ میلی‌لیتر",     en: "Vortex Liquid Chalk 150 ml",  cat: "gear",      sizes: [],                          price: 480000 },
  { id: "vx-key-001",   key: "key",   fa: "جاکلیدی و بند ورتکس",           en: "Vortex Key Strap",            cat: "accessory", sizes: [],                          price: 320000 },
];

const INTENT = [
  { act: "new",   re: /(محصول\s*جدید|محصول\s*بساز|محصول\s*اضافه|اضافه\s*کنم\s*محصول|محصول\s*تازه)/ },
  { act: "list",  re: /(لیست\s*محصول|همه\s*ی?\s*محصول|محصولات\s*(سایت|چی|چیا)?|چیا\s*داریم)/ },
  { act: "price", re: /(قیمت|نرخ|گرون|ارزون)/ },
  { act: "photo", re: /(عکس|تصویر|فوتو|pic)/ },
  { act: "desc",  re: /(توضیح|معرفی|دسکریپشن)/ },
  { act: "name",  re: /(^|\s)(اسم|نام)(\s|$)/ },
  { act: "show",  re: /(برگردان|برگردون|بازگردان|نمایش\s*بده|فعال\s*کن|روی\s*سایت\s*بذار|دوباره\s*بذار|موجودش\s*کن)/ },
  { act: "hide",  re: /(حذف|پاک\s*کن|بردار|مخفی|غیرفعال|از\s*سایت\s*درش?\s*بیار|بیرون|نمی‌?خوام\s*باشه)/ },
  { act: "stock", re: /(موجود|موجودی|تعداد|تموم|تمام|ناموجود|صفر|شارژ|چند\s*تا|بشه)/ },
];
const ZERO_RE = /(تموم|تمام|ناموجود|صفر|خالی|نباشه|نیست)/;

export function normT(s) {
  return String(s == null ? "" : s)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/(\d+)\s*(?:سانتی\s*متر|سانتیمتر|سانتی|سانت)(?=\s|$)/g, "$1cm")
    .replace(/[«»"'؛،,:!?()\-–—]+/g, " ")
    .replace(/\s+/g, " ").trim().toLowerCase();
}

function extractNums(t) {
  const out = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(هزار|میلیون|ملیون|میلیارد|تومن|تومان|عدد|تا|قطعه)?/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    let v = Number(String(m[1]).replace(/,/g, ""));
    const u = m[2] || "";
    if (u === "هزار") v *= 1000;
    else if (u === "میلیون" || u === "ملیون") v *= 1000000;
    else if (u === "میلیارد") v *= 1000000000;
    if (!Number.isNaN(v)) out.push({ v: Math.round(v), unit: u, at: m.index });
  }
  return out;
}

function findSize(prod, t) {
  const sizes = (prod && prod.sizes) || [];
  for (const s of sizes) {
    const st = normT(s);
    if (st && t.includes(st)) return s;
    const m = st.match(/^(\d+)cm$/);
    if (m && new RegExp(`(^|[^0-9])${m[1]}\s*(cm|سانت|سانتی|سانتیمتر|سانتی\s*متر)(?![0-9])`).test(t)) return s;
  }
  for (const s of sizes) {
    const st = normT(s);
    if (/^[a-z]{1,3}$/.test(st) && new RegExp(`(^|\\s)${st}(\\s|$)`).test(t)) return s;
  }
  return null;
}

function adminPool(cat) {
  const ov = (cat && cat.overrides) || {};
  const hidden = (cat && cat.hidden) || [];
  const statics = STATIC.map((sp) => ({
    id: sp.id, key: sp.key, fa: (ov[sp.id] && ov[sp.id].name && ov[sp.id].name.fa) || sp.fa,
    en: sp.en, sizes: sp.sizes, basePrice: sp.price, kind: "static", hidden: hidden.includes(sp.id),
  }));
  const bots = ((cat && cat.products) || []).map((p) => ({
    id: p.id, key: p.id, fa: (p.name && p.name.fa) || p.id, en: (p.name && p.name.en) || "",
    sizes: p.sizes || [], basePrice: (ov[p.id] && ov[p.id].price != null) ? ov[p.id].price : (p.price || 0),
    kind: "bot", hidden: hidden.includes(p.id),
  }));
  return statics.concat(bots);
}

/* کدام محصول‌ها در متن صاحب فروشگاه آمده‌اند؟ */
function findProducts(t, pool) {
  const scored = [];
  for (const p of pool) {
    let score = 0;
    const words = new Set(
      normT([p.fa, p.en].join(" ")).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2)
    );
    for (const w of words) {
      if (w.length >= 3) {
        if (t.includes(w)) score += w.length >= 5 ? 2 : 1;
      } else if (new RegExp(`(^|\\s)${w}(\\s|$)`).test(t)) {
        score += 2;                    // کلمهٔ کوتاهی مثل «گچ» فقط وقتی جدا نوشته شود
      }
    }
    if (p.key && new RegExp(`(^|\\s)${p.key}(\\s|$)`).test(t)) score += 3;
    if (t.includes(normT(p.id))) score += 5;
    if (score > 0) scored.push({ p, score });
  }
  if (!scored.length) return [];
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((x) => x.score === scored[0].score).map((x) => x.p);
}

export function isAdminIntent(text, pool) {
  const t = normT(text);
  if (!t) return false;
  const hit = INTENT.find((i) => i.re.test(t));
  if (!hit) return false;
  if (hit.act === "new" || hit.act === "list") return true;
  if (!findProducts(t, pool).length) return false;
  return true;
}

function pname(p) {
  if (!p) return "";
  if (typeof p.name === "string") return p.name;
  if (p.name && p.name.fa) return p.name.fa;
  if (p.fa) return p.fa;
  const st = STATIC.find((x) => x.id === p.id);
  return st ? st.fa : p.id;
}
function effPrice(p, cat) {
  const o = ((cat && cat.overrides) || {})[p.id];
  if (o && o.price != null) return o.price;
  if (p.basePrice != null) return p.basePrice;
  if (p.price != null && p.price !== 0) return p.price;
  const st = STATIC.find((x) => x.id === p.id);
  return st ? st.price : (p.price || 0);
}
function stockKeyFor(store, id) {
  const st = (store && store.stock) || {};
  if (st[id] !== undefined) return id;
  const norm = String(id).toLowerCase();
  return Object.keys(st).find((k) => norm.startsWith("vx-" + k.toLowerCase()) || norm.includes(k.toLowerCase())) || null;
}
function stockTotal(store, id, sizes, kind) {
  const key = stockKeyFor(store, id);
  if (!key) return null;
  const s = store.stock[key] || {};
  if (s["*"] !== undefined) return Number(s["*"]);
  const vals = Object.values(s).map(Number).filter((n) => !Number.isNaN(n));
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}
async function setHidden(env, id, hide) {
  await writeCatalog(env, (c) => {
    c.hidden = (c.hidden || []).filter((x) => x !== id);
    if (hide) c.hidden.push(id);
    c.overrides = c.overrides || {};
  });
}

/* نوشتن موجودی: با سایز، برای همهٔ سایزها، یا «*» برای محصول بدون سایز */
function stockSet(store, prod, size, qty) {
  store.stock = store.stock || {};
  const key = stockKeyFor(store, prod.id) || prod.key || prod.id;
  const s = (store.stock[key] = store.stock[key] || {});
  const sizes = prod.sizes || [];
  if (s["*"] !== undefined && (size || sizes.length)) {
    const val = s["*"];
    delete s["*"];
    for (const sz of sizes) s[sz] = val;
  }
  if (size) s[size] = qty;
  else if (sizes.length) for (const sz of sizes) s[sz] = qty;
  else s["*"] = qty;
  return { key, size: size || null, qty };
}

function valueAfter(raw) {
  const m = String(raw).match(/(?:به|بشه|کن|:)\s+(.{2,})$/) || String(raw).match(/[:：]\s*(.{2,})$/);
  if (!m) return "";
  return m[1].trim()
    .replace(/^(?:به|بشه)\s+/, "")
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .trim();
}

/* اجرای دستور روی یک محصول */
async function applyAction(env, tg, chatId, prod, ctx) {
  const { act, val, size, cat, store, raw, draftOpen } = ctx;
  const nm = esc(prod.fa);
  const tail = draftOpen ? "\n\n<i>ℹ️ مرحلهٔ محصول جدیدت هم باز است — جواب سؤال قبلی را بده یا /cancel</i>" : "";
  const link = `<a href="${SHOP(env)}">فروشگاه</a>`;

  if (act === "price") {
    if (val == null) {
      await setDraft(env, { chat: String(chatId), step: "editprice", d: { editId: prod.id, editLabel: prod.fa } });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `💰 قیمت جدید <b>${nm}</b> چند باشد؟ فقط عدد بنویس.` + tail });
      return true;
    }
    const old = prod.basePrice;
    await writeCatalog(env, (c) => {
      c.overrides = c.overrides || {};
      c.overrides[prod.id] = { ...(c.overrides[prod.id] || {}), price: val };
    });
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ قیمت <b>${nm}</b> شد <b>${money(val)}</b> (قبلاً ${money(old)}) — همین حالا روی سایت عوض شد.\n${link}`, disable_web_page_preview: true });
    return true;
  }

  if (act === "stock") {
    if (val == null) {
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `🔢 موجودی <b>${nm}</b> را چند کنم؟ فقط عدد بنویس (برای ناموجود‌کردن: «${nm} تموم شد»).` });
      return true;
    }
    let res = null;
    await writeStore(env, (st) => { res = stockSet(st, prod, size, val); });
    const where = size ? `سایز ${esc(size)}` : (prod.sizes && prod.sizes.length) ? "همهٔ سایزها" : "";
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: val <= 0
        ? `🔴 <b>${nm}</b>${where ? " · " + where : ""} ناموجود شد — سایت خودش کارت را «ناموجود» کرد و خریدش بسته شد.\nبرای شارژ دوباره: «${nm} رو ۱۰ کن»`
        : `✅ موجودی <b>${nm}</b>${where ? " · " + where : ""} شد <b>${FA.format(val)}</b> عدد.` });
    return true;
  }

  if (act === "hide") {
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `🗑 <b>${nm}</b> از سایت برداشته شود؟`,
      reply_markup: { inline_keyboard: [[
        { text: "🗑 بله، از سایت بردار", callback_data: `pr:hideokdo:${prod.id}` },
        { text: "❌ نه", callback_data: "pr:cancel" },
      ]] } });
    return true;
  }

  if (act === "show") {
    await setHidden(env, prod.id, false);
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ <b>${nm}</b> دوباره روی سایت آمد.\n${link}`, disable_web_page_preview: true });
    return true;
  }

  if (act === "photo") {
    await setDraft(env, { chat: String(chatId), step: "editphoto", d: { editId: prod.id, editLabel: prod.fa, photo: "" } });
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `🖼 عکس جدید <b>${nm}</b> را بفرست.` + tail });
    return true;
  }

  if (act === "name") {
    const v = valueAfter(raw);
    if (!v) {
      await setDraft(env, { chat: String(chatId), step: "editname", d: { editId: prod.id, editLabel: prod.fa } });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `✏️ اسم جدید <b>${nm}</b> را بنویس.` + tail });
      return true;
    }
    await writeCatalog(env, (c) => {
      c.overrides = c.overrides || {};
      const cur = c.overrides[prod.id] || {};
      c.overrides[prod.id] = { ...cur, name: { ...((cur.name) || {}), fa: v } };
    });
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ اسم محصول شد <b>${esc(v)}</b>.` });
    return true;
  }

  if (act === "desc") {
    const v = valueAfter(raw);
    if (!v) {
      await setDraft(env, { chat: String(chatId), step: "editdesc", d: { editId: prod.id, editLabel: prod.fa } });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `📝 توضیح جدید <b>${nm}</b> را بنویس.` + tail });
      return true;
    }
    await writeCatalog(env, (c) => {
      c.overrides = c.overrides || {};
      const cur = c.overrides[prod.id] || {};
      c.overrides[prod.id] = { ...cur, desc: { ...((cur.desc) || {}), fa: v } };
    });
    await setDraft(env, null);
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: `✅ توضیح <b>${nm}</b> عوض شد.` });
    return true;
  }

  return false;
}

/* ---------- ورودی آزاد مالک → دستور مدیریتی ---------------------------- */
export async function adminText(env, tg, chatId, text, store) {
  const raw = String(text || "").trim();
  const t = normT(raw);
  if (!t) return false;
  const cat = await readCatalog(env);
  const pool = adminPool(cat);
  const hit = INTENT.find((i) => i.re.test(t));
  if (!hit) return false;

  if (hit.act === "new") { await admStart(env, tg, chatId, store); return true; }
  if (hit.act === "list") { await productList(env, tg, chatId, store); return true; }

  let tMatch = t;
  if (hit.act === "name" || hit.act === "desc") {
    const cut = t.indexOf(" به ");
    if (cut > 0) tMatch = t.slice(0, cut);
  }
  const cands = findProducts(tMatch, pool);
  if (!cands.length) {
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "محصولی با این اسم پیدا نکردم 🤔\nاسمش را دقیق‌تر بنویس یا /products را بزن." });
    return true;
  }

  const draft = await getDraft(env);
  const draftOpen = Boolean(draft && draft.d && draft.step && !["pick"].includes(draft.step));

  /* عددها را از متن بیرون بکش (عدد سایز را نادیده بگیر) */
  const sizeHit = cands.length === 1 ? findSize(cands[0], t) : null;
  let nums = extractNums(t);
  if (sizeHit) {
    const sn = (normT(sizeHit).match(/(\d+)/) || [])[1];
    if (sn && nums.length > 1) nums = nums.filter((n) => String(n.v) !== sn);
  }
  let val = null;
  if (hit.act === "price") {
    val = nums.length ? Math.max(...nums.map((n) => n.v)) : null;
  } else if (hit.act === "stock") {
    val = ZERO_RE.test(t) && !nums.length ? 0 : (nums.length ? nums[nums.length - 1].v : (ZERO_RE.test(t) ? 0 : null));
  }

  const ctx = { act: hit.act, val, size: sizeHit, cat, store, raw, draftOpen };

  if (cands.length > 1) {
    const ids = cands.slice(0, 6).map((p) => p.id);
    await setDraft(env, { chat: String(chatId), step: "pick", d: { pickIds: ids, act: hit.act, val, size: sizeHit } });
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "کدام یکی را می‌گویی؟ 👇",
      reply_markup: { inline_keyboard: ids.map((id, i) => [
        { text: cands[i].fa, callback_data: `pr:pick:${i}` },
      ]).concat([[{ text: "❌ هیچ‌کدام", callback_data: "pr:cancel" }]]) } });
    return true;
  }

  return applyAction(env, tg, chatId, cands[0], ctx);
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
  "",
  "🗣 <b>یا با زبان خودت بنویس</b> (بدون دستور):",
  "«قیمت گچ رو بکن ۵۵۰ هزار» · «موجودی مچ‌بند ۳۰ سانت رو ۵ کن»",
  "«تی‌شرت ناموجود شد» · «جاکلیدی رو از سایت حذف کن» · «کراپ رو برگردون»",
  "«عکس گچ رو عوض کن» · «اسم کراپ رو عوض کن به …» · «توضیحش رو عوض کن به …»",
].join("\n");
