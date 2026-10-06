/**
 * ==========================================================================
 * VORTEX — Cloudflare Worker
 *   • فایل‌های استاتیک سایت را سرو می‌کند (پوشهٔ public)
 *   • اندپوینت /api/order را می‌گیرد و سفارش را در تلگرام به شما می‌فرستد
 *   • وب‌هوک بات تلگرام (/api/tg/webhook): /start ، /shop ، /help ، /id
 * ==========================================================================
 */

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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
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
function buildOrderMessage(order, code) {
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
  rows.push(L ? "برای تأیید موجودی، روی همین پیام ریپلای کنید." : "Reply to this message to confirm stock.");
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
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  if (!items.length) return json({ ok: false, error: "empty_cart" }, 400);

  const clean = {
    lang: body.lang === "en" ? "en" : "fa",
    items: items.map((i) => ({
      id: String(i.id || "").slice(0, 60),
      name: String(i.name || "").slice(0, 160),
      size: String(i.size || "").slice(0, 20),
      qty: Math.max(1, Math.min(20, Number(i.qty) || 1)),
      price: Math.max(0, Number(i.price) || 0),
    })),
    totals: {
      sub: Math.max(0, Number(body.totals?.sub) || 0),
      ship: Math.max(0, Number(body.totals?.ship) || 0),
      total: Math.max(0, Number(body.totals?.total) || 0),
    },
    buyer: {
      name: String(body.buyer?.name || "").slice(0, 120),
      phone: String(body.buyer?.phone || "").slice(0, 40),
      addr: String(body.buyer?.addr || "").slice(0, 300),
    },
    tgUser: await verifyInitData(env, body.initData),
  };

  const code = orderCode();
  const text = buildOrderMessage(clean, code);

  /* ۱) سفارش به ادمین/گروه فروشگاه */
  const toOwner = await tg(env, "sendMessage", {
    chat_id: env.OWNER_CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          env.ADMIN_URL ? { text: "🛠 پنل مدیریت", url: env.ADMIN_URL } : { text: "✅ تأیید موجودی", callback_data: `confirm:${code}` },
          { text: "❌ ناموجود", callback_data: `reject:${code}` },
        ],
      ],
    },
  });

  if (!toOwner.ok) return json({ ok: false, error: "telegram_send_failed" }, 502);

  /* ۲) پیام تأیید برای خود مشتری (اگر از داخل تلگرام سفارش داده) */
  if (clean.tgUser?.id) {
    await tg(env, "sendMessage", {
      chat_id: clean.tgUser.id,
      text: buildCustomerMessage(clean, code),
      parse_mode: "HTML",
    });
  }

  return json({ ok: true, code });
}

/* ---------- وب‌هوک بات تلگرام ------------------------------------------- */
async function handleWebhook(request, env) {
  if (!env.BOT_TOKEN || !env.WEBHOOK_SECRET) return json({ ok: false }, 503);
  if (request.headers.get("x-telegram-bot-api-secret-token") !== env.WEBHOOK_SECRET) return json({ ok: false }, 403);

  const update = await request.json().catch(() => ({}));
  const shopUrl = env.SHOP_URL || "https://vortexgear.s-photography1987.workers.dev";
  const msg = update.message || update.edited_message;
  const cb = update.callback_query;

  /* دکمه‌های تأیید/رد سفارش توسط ادمین */
  if (cb) {
    const [action, code] = String(cb.data || "").split(":");
    const label = action === "confirm" ? "✅ تأیید شد" : "❌ ناموجود شد";
    await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: `${label} — ${code}` });
    await tg(env, "editMessageReplyMarkup", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      reply_markup: { inline_keyboard: [[{ text: `${label} · ${code}`, callback_data: "done" }]] },
    });
    return json({ ok: true });
  }

  if (!msg) return json({ ok: true });
  const text = (msg.text || "").trim();
  const chatId = msg.chat.id;
  const L = text.startsWith("/start") || !text ? true : true;   // پیش‌فرض فارسی

  const keyboard = {
    inline_keyboard: [
      [{ text: "🛒 ورود به فروشگاه", web_app: { url: shopUrl } }],
      [
        { text: "📞 تماس با ما", url: "https://t.me/vortexgear" },
        { text: "📷 اینستاگرام", url: "https://instagram.com/vortex.gear" },
      ],
    ],
  };

  if (text.startsWith("/id")) {
    await tg(env, "sendMessage", { chat_id: chatId, text: `🆔 <code>${chatId}</code>`, parse_mode: "HTML" });
    return json({ ok: true });
  }

  if (text.startsWith("/shop") || text.startsWith("/start")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: [
        "🟢 <b>ورتکس — ساخته‌شده برای شدت</b>",
        "",
        "پوشاک و تجهیزات کراس‌فیت: تی‌شرت تمرین، کراپ، مچ‌بند، گچ مایع و اکسسوری.",
        "برای دیدن محصولات و ثبت سفارش، دکمهٔ زیر را بزن 👇",
      ].join("\n"),
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    return json({ ok: true });
  }

  /* پیام‌های دیگر کاربر → فوروارد به ادمین */
  if (env.OWNER_CHAT_ID) {
    const from = msg.from || {};
    const who = from.username ? `@${from.username}` : `${from.first_name || ""} ${from.last_name || ""}`.trim();
    await tg(env, "forwardMessage", { chat_id: env.OWNER_CHAT_ID, from_chat_id: chatId, message_id: msg.message_id }).catch(() => {});
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: `📨 پیام تو ثبت شد و برای تیم ورتکس فرستادیم.\nاگر سؤال فروش داری، سریع‌تر جواب می‌گیری اگر شماره‌ات را هم بنویسی.\n\n— ورتکس`,
    });
    console.log("forwarded message from", who, chatId);
  }
  return json({ ok: true });
}

/* ---------- روتر -------------------------------------------------------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/order") {
      if (request.method === "OPTIONS") return json({ ok: true });
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
      return handleOrder(request, env);
    }

    if (url.pathname === "/api/tg/webhook") {
      if (request.method !== "POST") return json({ ok: false }, 405);
      return handleWebhook(request, env);
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
