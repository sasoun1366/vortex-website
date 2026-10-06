/**
 * ==========================================================================
 * VORTEX — Cloudflare Worker
 *   • فایل‌های استاتیک سایت را سرو می‌کند (پوشهٔ public)
 *   • اندپوینت /api/order را می‌گیرد و سفارش را در تلگرام به شما می‌فرستد
 *   • وب‌هوک بات تلگرام (/api/tg/webhook): /start ، /shop ، /help ، /id
 * ==========================================================================
 */

import { readStore, writeStore, stockFor, stockReport, decStock } from "./store.js";
import { paymentMessage, addressRequestMessage, parseAddressBlock, addressSummary, customerStatusMessage,
         ownerStockReport, statusFa, statusEn } from "./flow.js";

const TG = (env) => `${env.TELEGRAM_API_BASE || "https://api.telegram.org"}/bot${env.BOT_TOKEN}`;
const FA = new Intl.NumberFormat("fa-IR");
const EN = new Intl.NumberFormat("en-US");

/* ---------- ابزارها ------------------------------------------------------ */
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (n, lang) => `${(lang === "en" ? EN : FA).format(Math.round(n || 0))} ${lang === "en" ? "Toman" : "تومان"}`;

function orderCode() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `VX-${stamp}-${rand}`;
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...extra,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

async function tg(env, method, payload) {
  const r = await fetch(`${TG(env)}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.log("telegram error", method, JSON.stringify(data).slice(0, 400));
  return data;
}

/* ---------- اعتبارسنجی initData تلگرام (Mini App) ------------------------ */
/* صحت داده‌های کاربر داخل تلگرام را با توکن بات بررسی می‌کند تا کسی نتواند
   خودش را جای دیگری جا بزند. اگر initData نبود، از داده ورودی صرف‌نظر می‌کنیم. */
async function verifyInitData(env, initData) {
  if (!initData || !env.BOT_TOKEN) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");

    const enc = new TextEncoder();
    const secretKey = await crypto.subtle.importKey("raw", enc.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const secret = await crypto.subtle.sign("HMAC", secretKey, enc.encode(env.BOT_TOKEN));
    const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(dataCheckString));
    const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (hex !== hash) return null;

    const authDate = Number(params.get("auth_date") || 0);
    if (authDate && Date.now() / 1000 - authDate > 86400) return null;   // قدیمی‌تر از ۲۴ ساعت

    const user = JSON.parse(params.get("user") || "null");
    return user;
  } catch {
    return null;
  }
}

/* ---------- ساخت متن سفارش برای تلگرام ---------------------------------- */
function buildOrderMessage(order, code, stockWarn = []) {
  const lang = order.lang === "en" ? "en" : "fa";
  const { items = [], totals = {}, buyer = {}, tgUser = null } = order;
  const L = lang === "fa";

  const lines = items.map((i) => {
    const unit = Number(i.price) || 0;
    const qty = Number(i.qty) || 1;
    const sz = i.size ? (L ? ` — سایز ${esc(i.size)}` : ` — size ${esc(i.size)}`) : "";
    return `• ${L ? FA.format(qty) : qty} × ${esc(i.name)}${sz} — ${money(unit * qty, lang)}`;
  });

  const rows = [
    L ? `🟢 <b>سفارش جدید — VORTEX</b>` : `🟢 <b>New order — VORTEX</b>`,
    L ? `<b>کد سفارش:</b> <code>${code}</code>` : `<b>Order code:</b> <code>${code}</code>`,
    "———",
    ...lines,
    "———",
    `${L ? "جمع کالاها" : "Subtotal"}: ${money(totals.sub || 0, lang)}`,
    `${L ? "ارسال" : "Shipping"}: ${totals.ship ? money(totals.ship, lang) : (L ? "رایگان" : "Free")}`,
    `<b>${L ? "مبلغ نهایی" : "Total"}: ${money(totals.total || 0, lang)}</b>`,
    "———",
    `👤 ${esc(buyer.name || (L ? "—" : "—"))}`,
    `📞 ${esc(buyer.phone || "—")}`,
    `📍 ${esc(buyer.addr || "—")}`,
  ];

  if (tgUser) {
    const uname = tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim();
    rows.push(`📎 ${L ? "از تلگرام" : "Via Telegram"}: ${esc(uname)} · <code>${esc(String(tgUser.id || ""))}</code>`);
  } else {
    rows.push(L ? `🌐 از سایت (بدون لاگین تلگرام)` : `🌐 From website (not via Telegram)`);
  }

  rows.push(`🕐 ${new Intl.DateTimeFormat(L ? "fa-IR" : "en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date())}`);
  rows.push("");
  if (stockWarn.length) {
    rows.push("⚠️ <b>" + (L ? "هشدار موجودی" : "Stock warning") + ":</b>");
    stockWarn.forEach((w) => rows.push(L
      ? `• ${esc(w.name)}${w.size ? " (" + esc(w.size) + ")" : ""} → موجودی ${FA.format(w.have)} (سفارش ${FA.format(w.qty)})`
      : `• ${esc(w.name)}${w.size ? " (" + esc(w.size) + ")" : ""} → have ${w.have}, ordered ${w.qty}`));
    rows.push("");
  }
  rows.push("");
  rows.push(L ? "با دکمه‌های زیر سفارش را جلو ببر 👇" : "Move the order forward 👇");
  return rows.join("\n");
}

function buildCustomerMessage(order, code) {
  const L = order.lang !== "en";
  const { items = [], totals = {} } = order;
  const list = items.map((i) => `• ${L ? FA.format(i.qty || 1) : i.qty} × ${esc(i.name)}${i.size ? ` (${esc(i.size)})` : ""}`).join("\n");
  return [
    L ? "✅ <b>سفارش شما ثبت شد</b>" : "✅ <b>Your order has been received</b>",
    `<b>${L ? "کد سفارش" : "Order code"}:</b> <code>${code}</code>`,
    "",
    list,
    "",
    `${L ? "مبلغ نهایی" : "Total"}: <b>${money(totals.total || 0, order.lang)}</b>`,
    "",
    L ? "همکاران ما به‌زودی موجودی و روش پرداخت را تأیید می‌کنند." : "Our team will confirm stock and payment shortly.",
    L ? "ورتکس — ساخته‌شده برای شدت" : "VORTEX — built for intensity",
  ].join("\n");
}

/* ---------- اندپوینت ثبت سفارش ------------------------------------------ */
async function handleOrder(request, env) {
  if (!env.BOT_TOKEN) return json({ ok: false, error: "bot_not_configured" }, 503);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "bad_json" }, 400); }

  const order = {
    items: Array.isArray(body.items) ? body.items : [],
    totals: body.totals || {},
    buyer: body.buyer || {},
    lang: body.lang === "en" ? "en" : "fa",
    note: typeof body.note === "string" ? body.note.slice(0, 400) : "",
  };
  if (!order.items.length) return json({ ok: false, error: "empty_cart" }, 400);

  /* اگر مینی‌اپ تلگرام باز شده باشد، کاربر تأییدشده است → چت مشتری را می‌شناسیم */
  const tgUser = verifyInitData(env, body.initData);
  const code = orderCode();

  const store = await readStore(env);
  const warn = stockReport(store, order.items);

  const ownerChat = env.OWNER_CHAT_ID;
  if (!ownerChat) return json({ ok: false, error: "owner_not_configured" }, 503);

  /* ثبت سفارش در انبارهٔ فروشگاه */
  await writeStore(env, (st) => {
    st.orders[code] = {
      code, ts: Date.now(), lang: order.lang, items: order.items, totals: order.totals,
      buyer: { ...(order.buyer || {}) }, note: order.note,
      chatId: tgUser ? tgUser.id : null,
      tgUser: tgUser ? { id: tgUser.id, username: tgUser.username || "", first_name: tgUser.first_name || "" } : null,
      status: "new", tracking: "", photoFileId: "",
    };
  });

  /* پیام مالک با دکمه‌های اتوماسیون */
  const kb = {
    inline_keyboard: [
      [
        { text: "✅ پرداخت تأیید شد", callback_data: `pay:${code}` },
        { text: "❌ ناموجود / لغو", callback_data: `rej:${code}` },
      ],
      [{ text: "📦 گرفتن آدرس از مشتری", callback_data: `addr:${code}` }],
    ],
  };
  const sent = await tg(env, "sendMessage", {
    chat_id: ownerChat, text: buildOrderMessage(order, code, warn), parse_mode: "HTML", reply_markup: kb,
  });
  const msgId = sent && sent.result && sent.result.message_id;
  if (msgId) await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].ownerMsgId = msgId; });

  /* پیام خودکار به مشتری (فقط اگر از تلگرام آمده باشد) */
  let notified = false;
  if (tgUser && tgUser.id) {
    const cfg = store.cfg || {};
    const m = paymentMessage(order, code, cfg);
    const r = await tg(env, "sendMessage", {
      chat_id: tgUser.id, text: m, parse_mode: "HTML",
      reply_markup: cfg.card ? undefined : { inline_keyboard: [[{ text: "💬 پیام به پشتیبانی", url: "https://t.me/vortexgear" }]] },
    }).catch(() => null);
    notified = Boolean(r && r.ok);
  }

  return json({ ok: true, code, notified, stockWarn: warn.length });
}

/* ---------- وب‌هوک بات تلگرام ------------------------------------------- */
async function handleWebhook(request, env) {
  if (!env.BOT_TOKEN || !env.WEBHOOK_SECRET) return json({ ok: false }, 503);
  if (request.headers.get("x-telegram-bot-api-secret-token") !== env.WEBHOOK_SECRET) return json({ ok: false }, 403);

  const update = await request.json().catch(() => ({}));
  const shopUrl = env.SHOP_URL || "https://vortexgear.ir";
  const msg = update.message || update.edited_message;
  const cb = update.callback_query;
  const owner = String(env.OWNER_CHAT_ID || "");
  const store = await readStore(env);
  const cfg = store.cfg || {};

  /* ---------- دکمه‌های مالک روی سفارشها ---------- */
  if (cb) {
    const [action, code] = String(cb.data || "").split(":");
    const o = store.orders[code];
    if (!o) {
      await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: "سفارش پیدا نشد" });
      return json({ ok: true });
    }
    const L = o.lang !== "en";
    let toast = "";

    if (action === "pay") {
      toast = "پرداخت تأیید شد";
      await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].status = "paid"; });
      if (o.chatId) await tg(env, "sendMessage", { chat_id: o.chatId, text: addressRequestMessage(o), parse_mode: "HTML" }).catch(() => {});
      if (o.ownerMsgId) await tg(env, "editMessageReplyMarkup", {
        chat_id: cb.message.chat.id, message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: `✅ پرداخت تأیید شد · ${code}`, callback_data: "done" }]] },
      });
    } else if (action === "addr") {
      toast = "درخواست آدرس ارسال شد";
      if (o.chatId) await tg(env, "sendMessage", { chat_id: o.chatId, text: addressRequestMessage(o), parse_mode: "HTML" }).catch(() => {});
    } else if (action === "rej") {
      toast = "سفارش لغو شد";
      await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].status = "cancelled"; });
      if (o.chatId) await tg(env, "sendMessage", {
        chat_id: o.chatId, parse_mode: "HTML",
        text: L ? `❌ متأسفانه سفارش <code>${code}</code> موجودی کافی نداشت و لغو شد.\nاگر پرداخت کرده بودی، همین امروز برگشت میخورد.\nبرای انتخاب جایگزین: ${shopUrl}`
                : `❌ Sorry, order <code>${code}</code> could not be fulfilled.\nAny payment will be refunded today.`,
      }).catch(() => {});
      if (o.ownerMsgId) await tg(env, "editMessageReplyMarkup", {
        chat_id: cb.message.chat.id, message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: `❌ لغو شد · ${code}`, callback_data: "done" }]] },
      });
    } else if (action === "ship") {
      toast = "ثبت شد که ارسال شد";
      await writeStore(env, (st) => {
        const ord = st.orders[code];
        if (ord) { ord.status = "shipped"; decStock(st, ord.items); }
      });
      if (o.chatId) await tg(env, "sendMessage", {
        chat_id: o.chatId, parse_mode: "HTML",
        text: L ? `🚚 <b>سفارش <code>${code}</code> ارسال شد!</b>\nاگر کد رهگیری پست ثبت شود، همینجا برایت میفرستیم.\nممنون که ورتکس را انتخاب کردی 💪`
                : `🚚 <b>Order <code>${code}</code> is on the way!</b>`,
      }).catch(() => {});
      if (o.ownerMsgId) await tg(env, "editMessageReplyMarkup", {
        chat_id: cb.message.chat.id, message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: `🚚 ارسال شد · ${code}`, callback_data: "done" }]] },
      });
    } else {
      toast = "انجام شد";
    }

    await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: toast });
    return json({ ok: true });
  }

  if (!msg) return json({ ok: true });
  const text = (msg.text || "").trim();
  const chatId = msg.chat.id;
  const isOwner = owner && String(chatId) === owner;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🛒 ورود به فروشگاه", web_app: { url: shopUrl } }],
      [
        { text: "📞 تماس با ما", url: "https://t.me/vortexgear" },
        { text: "📷 اینستاگرام", url: "https://instagram.com/vortex.gear" },
      ],
    ],
  };

  /* ---------- تنظیمات اولیه ---------- */
  if (!env.OWNER_CHAT_ID) {
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: `⚙️ <b>این بات هنوز به فروشگاه وصل نشده است.</b>\n\nشناسهٔ چت شما:\n<code>${chatId}</code>\n\nاین شناسه را برای مدیر فنی بفرست.`,
    });
    return json({ ok: true, unconfigured: true });
  }

  /* ---------- دستورهای مالک ---------- */
  if (isOwner) {
    /* /setcard 6037-xxxx-xxxx-1234 [نام صاحب کارت] */
    if (text.startsWith("/setcard")) {
      const m = text.match(/\/setcard\s+([\d\-\s]{8,30})\s*(.*)$/s);
      if (!m) {
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
          text: "قالب درست:\n<code>/setcard 6037-9911-1234-5678 ساسون ع.</code>\n\nبرای پاک‌کردن: <code>/setcard -</code>" });
        return json({ ok: true });
      }
      const cardVal = m[1].trim() === "-" ? "" : m[1].trim();
      const nameVal = (m[2] || "").trim();
      await writeStore(env, (st) => { st.cfg.card = cardVal; if (nameVal) st.cfg.cardName = nameVal; });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: cardVal ? `✅ شمارهٔ کارت ثبت شد:\n<code>${cardVal}</code>${nameVal ? `\nبه نام: ${nameVal}` : ""}\n\nاز این به بعد هر سفارش، این پیام پرداخت را خودکار برای مشتری میفرستد.` : "✅ شمارهٔ کارت پاک شد." });
      return json({ ok: true });
    }

    /* /stock  |  /stock tee M 12  |  /stock tee M -1 */
    if (text.startsWith("/stock")) {
      const m = text.match(/\/stock\s+(\S+)\s+(\S+)\s+(-?\d+)/);
      if (!m) {
        await tg(env, "sendMessage", { chat_id: chatId, text: ownerStockReport(env, store), parse_mode: "HTML" });
        return json({ ok: true });
      }
      const [, pid, size, num] = m;
      const n = Number(num);
      let after = 0;
      await writeStore(env, (st) => {
        st.stock[pid] = st.stock[pid] || {};
        st.stock[pid][size] = n < 0 ? Math.max(0, (Number(st.stock[pid][size]) || 0) + n) : n;
        after = st.stock[pid][size];
      });
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: `✅ <b>${pid}</b> · سایز ${size} → موجودی <b>${after}</b>` });
      return json({ ok: true });
    }

    /* /track VX-... 12345678901234567890 */
    if (text.startsWith("/track")) {
      const m = text.match(/\/track\s+(\S+)\s+(\S+)/);
      if (!m) {
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "قالب: <code>/track VX-261006-1234 12345678901234567890</code>" });
        return json({ ok: true });
      }
      const [, code, num] = m;
      const o = store.orders[code];
      if (!o) { await tg(env, "sendMessage", { chat_id: chatId, text: "سفارشی با این کد پیدا نشد." }); return json({ ok: true }); }
      await writeStore(env, (st) => { const ord = st.orders[code]; if (ord) { ord.tracking = num; ord.status = "shipped"; } });
      if (o.chatId) await tg(env, "sendMessage", {
        chat_id: o.chatId, parse_mode: "HTML",
        text: `🚚 <b>کد رهگیری سفارش <code>${code}</code></b>\n<code>${num}</code>\n\nاز پست رهگیری کن: https://tracking.post.ir`,
      }).catch(() => {});
      await tg(env, "sendMessage", { chat_id: chatId, text: `✅ کد رهگیری ثبت و برای مشتری فرستاده شد.` });
      return json({ ok: true });
    }

    if (text.startsWith("/orders")) {
      const list = Object.values(store.orders || {}).sort((a, b) => b.ts - a.ts).slice(0, 10);
      const rows = list.length ? list.map((o) => `• <code>${o.code}</code> — ${statusFa(o.status)} — ${FA.format(o.totals?.total || 0)} تومان`) : ["سفارشی ثبت نشده."];
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: ["🧾 <b>آخرین سفارش‌ها</b>", "", ...rows].join("\n") });
      return json({ ok: true });
    }

    if (text.startsWith("/help")) {
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: [
        "<b>دستورهای مدیریتی ورتکس</b>", "",
        "<code>/setcard 6037-... نام</code> — ثبت شمارهٔ کارت برای پیام پرداخت خودکار",
        "<code>/stock</code> — دیدن موجودی",
        "<code>/stock tee M 12</code> — ثبت موجودی · <code>/stock tee M -1</code> — کم‌کردن یک عدد",
        "<code>/track VX-... 1234...</code> — ثبت کد رهگیری و اطلاع خودکار به مشتری",
        "<code>/orders</code> — ۱۰ سفارش آخر",
        "<code>/id</code> — شناسهٔ چت",
      ].join("\n") });
      return json({ ok: true });
    }
  }

  if (text.startsWith("/id")) {
    await tg(env, "sendMessage", { chat_id: chatId, text: `🆔 <code>${chatId}</code>`, parse_mode: "HTML" });
    return json({ ok: true });
  }

  /* ---------- مشتری: /start CODE  یا  /status ---------- */
  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch) {
    const code = startMatch[1];
    let order = null;
    if (code && /^VX-/.test(code)) {
      order = store.orders[code];
      if (order && !order.chatId) await writeStore(env, (st) => { if (st.orders[code]) st.orders[code].chatId = chatId; });
    }
    if (order) {
      await tg(env, "sendMessage", { chat_id: chatId, text: customerStatusMessage(order), parse_mode: "HTML" });
      if (order.status === "new") await tg(env, "sendMessage", { chat_id: chatId, text: paymentMessage(order, code, cfg), parse_mode: "HTML" });
      if (order.status === "paid") await tg(env, "sendMessage", { chat_id: chatId, text: addressRequestMessage(order), parse_mode: "HTML" });
      return json({ ok: true, order: code });
    }
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: [
        "🟢 <b>ورتکس — ساخته‌شده برای شدت</b>", "",
        "پوشاک و تجهیزات کراس‌فیت: تی‌شرت تمرین، کراپ، مچ‌بند، گچ مایع و اکسسوری.",
        "برای دیدن محصولات و ثبت سفارش، دکمهٔ زیر را بزن 👇", "",
        "اگر سفارش داری، کد سفارش را اینطور بفرست: <code>/status VX-...</code>",
      ].join("\n"),
      reply_markup: keyboard,
    });
    return json({ ok: true });
  }

  if (text.startsWith("/status") || text.startsWith("/shop")) {
    const m = text.match(/\/status\s+(\S+)/);
    let order = m ? store.orders[m[1]] : Object.values(store.orders || {}).filter((o) => o.chatId === chatId).sort((a, b) => b.ts - a.ts)[0];
    if (order) {
      await tg(env, "sendMessage", { chat_id: chatId, text: customerStatusMessage(order), parse_mode: "HTML" });
      return json({ ok: true });
    }
    await tg(env, "sendMessage", { chat_id: chatId, text: "سفارشی برای این چت پیدا نشد. کد سفارشت را اینطور بفرست: <code>/status VX-...</code>", parse_mode: "HTML", reply_markup: keyboard });
    return json({ ok: true });
  }

  /* ---------- مشتری: آدرس یا رسید ---------- */
  const mine = Object.values(store.orders || {}).filter((o) => o.chatId === chatId).sort((a, b) => b.ts - a.ts)[0];
  if (mine) {
    /* رسید عکس */
    if (msg.photo && msg.photo.length) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      await writeStore(env, (st) => { const o = st.orders[mine.code]; if (o) o.photoFileId = fileId; });
      await tg(env, "forwardMessage", { chat_id: env.OWNER_CHAT_ID, from_chat_id: chatId, message_id: msg.message_id }).catch(() => {});
      await tg(env, "sendMessage", { chat_id: env.OWNER_CHAT_ID, parse_mode: "HTML",
        text: `🧾 رسید پرداخت سفارش <code>${mine.code}</code> رسید. برای تأیید، دکمهٔ «✅ پرداخت تأیید شد» را بزن.` }).catch(() => {});
      await tg(env, "sendMessage", { chat_id: chatId, text: "🧾 رسیدت رسید. بعد از تأیید پرداخت، همین‌جا آدرس را از تو می‌پرسیم." });
      return json({ ok: true, receipt: true });
    }

    /* آدرس ۵ خطی */
    if (mine.status === "paid" || mine.status === "new" || mine.status === "ready") {
      const parsed = parseAddressBlock(text);
      if (parsed) {
        let updated = null;
        await writeStore(env, (st) => {
          const o = st.orders[mine.code];
          if (!o) return;
          o.buyer = { ...(o.buyer || {}), ...parsed, name: parsed.name || o.buyer?.name || "", phone: parsed.phone, city: parsed.city, addr: parsed.address, postal: parsed.postal };
          if (o.status === "new") o.status = "paid";           // آدرس آمد، یعنی مشتری معتبر است → مالک باید پرداخت را چک کند
          if (o.status === "paid") o.status = "ready";         // آدرس گرفته شد → آمادهٔ ارسال
          updated = { ...o };
        });
        /* اطلاع به مالک با دکمهٔ ارسال */
        await tg(env, "sendMessage", {
          chat_id: env.OWNER_CHAT_ID, parse_mode: "HTML",
          text: addressSummary(updated || mine, true),
          reply_markup: { inline_keyboard: [[{ text: "🚚 ارسال شد", callback_data: `ship:${mine.code}` }]] },
        });
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
          text: `✅ آدرس ثبت شد.\nکد سفارش: <code>${mine.code}</code>\nبه‌محض ارسال، همین‌جا خبر می‌دهیم. 🚚` });
        return json({ ok: true, address: true });
      }
      /* متن آزاد → راهنمایی */
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: addressRequestMessage(mine) });
      return json({ ok: true });
    }

    /* سایر پیامها → اطلاع وضعیت + فوروارد به مالک */
    await tg(env, "sendMessage", { chat_id: chatId, text: customerStatusMessage(mine), parse_mode: "HTML" }).catch(() => {});
  }

  /* ---------- فوروارد پیامهای دیگر به مالک ---------- */
  if (env.OWNER_CHAT_ID) {
    const from = msg.from || {};
    const who = from.username ? `@${from.username}` : `${from.first_name || ""} ${from.last_name || ""}`.trim();
    await tg(env, "forwardMessage", { chat_id: env.OWNER_CHAT_ID, from_chat_id: chatId, message_id: msg.message_id }).catch(() => {});
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "📨 پیامت ثبت شد و برای تیم ورتکس فرستادیم.\nبرای جواب سریع‌تر شماره‌ات را هم بنویس.\n\n— ورتکس",
    });
    console.log("forwarded message from", who, chatId);
  }
  return json({ ok: true });
}

/* ---------- روتر -------------------------------------------------------- */
const APEX = "vortexgear.ir";

/* www.vortexgear.ir -> vortexgear.ir  (301, مسیر و پارامترها حفظ می‌شوند) */
function redirectWww(url) {
  if (url.hostname === `www.${APEX}`) {
    url.hostname = APEX;
    return Response.redirect(url.toString(), 301);
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const wwwJump = redirectWww(url);
    if (wwwJump) return wwwJump;

    if (url.pathname === "/api/order") {
      if (request.method === "OPTIONS") return json({ ok: true });
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
      return handleOrder(request, env);
    }

    if (url.pathname === "/api/tg/webhook") {
      if (request.method !== "POST") return json({ ok: false }, 405);
      return handleWebhook(request, env);
    }

    if (url.pathname === "/api/stock") {
      const store = await readStore(env);
      return json({ ok: true, stock: store.stock || {} }, 200, { "cache-control": "public, max-age=30" });
    }

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        bot: Boolean(env.BOT_TOKEN),
        owner: Boolean(env.OWNER_CHAT_ID),
        webhook: Boolean(env.WEBHOOK_SECRET),
        version: 1,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
