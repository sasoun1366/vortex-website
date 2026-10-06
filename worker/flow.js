/* ==========================================================================
   VORTEX — متن‌ها و گردش‌کار اتوماسیون فروش (فارسی/انگلیسی)
   ========================================================================== */

/* شمارهٔ کارت: اگر در انباره تنظیم شده باشد اولویت دارد، وگرنه از Secret کلودفلر می‌آید
   (تا شماره در ریپوی عمومی ذخیره نشود) */
export function resolveCfg(env, store) {
  const cfg = (store && store.cfg) || {};
  const raw = String(cfg.card || env.CARD_NUMBER || "");
  const num = raw.replace(/[^0-9]/g, "");
  const pretty = num.length === 16 ? num.slice(0, 4) + "-" + num.slice(4, 8) + "-" + num.slice(8, 12) + "-" + num.slice(12) : raw;
  return { card: pretty, cardName: cfg.cardName || env.CARD_HOLDER || "" };
}

export function maskedCard(cfg) {
  const n = String((cfg && cfg.card) || "").replace(/[^0-9]/g, "");
  if (!n) return "—";
  return n.slice(0, 4) + "-****-****-" + n.slice(-4);
}

const FAn = new Intl.NumberFormat("fa-IR");
const ENn = new Intl.NumberFormat("en-US");
const money2 = (n, lang) => `${(lang === "en" ? ENn : FAn).format(Math.round(n || 0))} ${lang === "en" ? "Toman" : "تومان"}`;
const fx = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* وضعیت‌ها: new → paid(address waiting) → ready → shipped | cancelled */

export function statusFa(st) {
  return {
    new: "در انتظار پرداخت",
    paycheck: "پرداخت اعلام شد — منتظر تأیید",
    paid: "پرداخت تأیید شد — منتظر آدرس",
    ready: "آمادهٔ ارسال",
    shipped: "ارسال شد",
    cancelled: "لغو / ناموجود",
  }[st] || st;
}

export function statusEn(st) {
  return {
    new: "Awaiting payment",
    paycheck: "Payment declared — awaiting check",
    paid: "Payment confirmed — address needed",
    ready: "Ready to ship",
    shipped: "Shipped",
    cancelled: "Cancelled / out of stock",
  }[st] || st;
}

const CARD_TIP_FA = [
  "💳 <b>پرداخت کارت‌به‌کارت</b>",
  "مبلغ <b>{total}</b> را به کارت زیر واریز کن:",
  "",
  "🔢 <code>{card}</code>",
  "{holder}",
  "",
  "بعد از واریز، همین‌جا در تلگرام یکی از این دو کار را بکن:",
  "• عکس رسید را بفرست، یا",
  "• بنویس: <code>چهار رقم آخر · ساعت واریز · مبلغ</code>",
  "",
  "به‌محض تأیید، همین بات آدرس را از تو می‌گیرد و سفارش برای ارسال آماده می‌شود. 🚚",
].join("\n");

const CARD_TIP_EN = [
  "💳 <b>Card-to-card payment</b>",
  "Please transfer <b>{total}</b> to:",
  "",
  "🔢 <code>{card}</code>",
  "{holder}",
  "",
  "Then either send a photo of the receipt here, or write:",
  "<code>last 4 digits · time · amount</code>",
].join("\n");

export function paymentMessage(order, code, cfg) {
  const L = order.lang !== "en";
  const total = money2(order.totals?.total || 0, order.lang || "fa");
  const holder = cfg.cardName ? (L ? `به نام: <b>${fx(cfg.cardName)}</b>` : `Account name: <b>${fx(cfg.cardName)}</b>`) : "";
  const head = L
    ? ["🧾 <b>سفارش تو ثبت شد</b>", `کد سفارش: <code>${code}</code>`, "", "فقط یک قدم مانده: پرداخت. 👇", ""].join("\n")
    : ["🧾 <b>Order received</b>", `Order code: <code>${code}</code>`, ""].join("\n");
  const body = cfg.card
    ? (L ? CARD_TIP_FA : CARD_TIP_EN).replace("{total}", total).replace("{card}", fx(cfg.card)).replace("{holder}", holder)
    : (L ? "همکاران ما به‌زودی برای هماهنگی پرداخت با تو تماس می‌گیرند." : "Our team will contact you to arrange payment.");
  return head + body;
}

export function addressRequestMessage(order) {
  const L = order.lang !== "en";
  return [
    L ? "✅ <b>پرداخت تأیید شد.</b>" : "✅ <b>Payment confirmed.</b>",
    "",
    L ? "برای ارسال، این ۵ خط را همین‌جا کپی کن، پُر کن و بفرست:" : "Please copy, fill and send these 5 lines:",
    "",
    "<code>نام و نام خانوادگی\n09xxxxxxxxx\nاستان / شهر\nآدرس کامل با پلاک و واحد\nکدپستی</code>",
    "",
    L ? "🔹 خط دوم باید شماره موبایل باشد (با ۰۹ شروع شود)." : "🔹 Line 2 must be a mobile number starting with 09.",
    L ? "🔹 لازم نبود کدپستی، همان خط را خالی بگذار." : "🔹 No postal code? Leave that line empty.",
  ].join("\n");
}

export function parseAddressBlock(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  const phoneIdx = lines.findIndex((l) => /^(\+?98|0)?9\d{9}$/.test(l.replace(/[\s-]/g, "")));
  if (phoneIdx === -1) return null;
  const phone = lines[phoneIdx].replace(/[\s-]/g, "").replace(/^\+?98/, "0").replace(/^9/, "09");
  const name = phoneIdx > 0 ? lines[0] : "";
  const city = lines[phoneIdx + 1] || "";
  const rest = lines.slice(phoneIdx + 2);
  const postalLine = rest.find((l) => /^\d{10}$/.test(l));
  const address = rest.filter((l) => l !== postalLine).join("، ");
  if (!name || !city || !address) return null;
  return { name, phone, city, address, postal: postalLine || "" };
}

export function addressSummary(order, L = true) {
  const b = order.buyer || {};
  return [
    L ? "📦 <b>آمادهٔ ارسال</b>" : "📦 <b>Ready to ship</b>",
    `<b>${L ? "کد سفارش" : "Order code"}:</b> <code>${order.code}</code>`,
    "———",
    ...(order.items || []).map((i) => `• ${fx(i.qty || 1)} × ${fx(i.name)}${i.size ? ` (${fx(i.size)})` : ""}`),
    "———",
    `👤 ${fx(b.name || "—")}`,
    `📞 ${fx(b.phone || "—")}`,
    `🏙 ${fx(b.city || "—")}`,
    `📍 ${fx(b.address || "—")}`,
    b.postal ? `✉️ ${fx(b.postal)}` : "",
    order.note ? `📝 ${fx(order.note)}` : "",
    "———",
    `${L ? "مبلغ" : "Total"}: <b>${money2(order.totals?.total || 0, order.lang || "fa")}</b>`,
  ].filter(Boolean).join("\n");
}

export function customerStatusMessage(order) {
  const L = order.lang !== "en";
  const st = L ? statusFa(order.status) : statusEn(order.status);
  const lines = [
    `${L ? "کد سفارش" : "Order"}: <code>${order.code}</code>`,
    `<b>${L ? "وضعیت" : "Status"}: ${st}</b>`,
    "",
    ...(order.items || []).map((i) => `• ${fx(i.qty || 1)} × ${fx(i.name)}${i.size ? ` (${fx(i.size)})` : ""}`),
    "",
    `${L ? "مبلغ" : "Total"}: <b>${money2(order.totals?.total || 0, order.lang || "fa")}</b>`,
  ];
  if (order.tracking) lines.push("", `🚚 ${L ? "کد رهگیری پست" : "Tracking"}: <code>${fx(order.tracking)}</code>`);
  if (order.status === "new") lines.push("", L ? "اگر پرداخت کرده‌ای، رسید یا «چهار رقم آخر · ساعت · مبلغ» را همین‌جا بفرست." : "Already paid? Send the receipt or “last 4 digits · time · amount”.");
  if (order.status === "paycheck") {
    lines.push("", L ? "کد پیگیری‌ات ثبت شده: <code>" + fx(order.payRef || "—") + "</code>" : "Your reference: <code>" + fx(order.payRef || "—") + "</code>");
    lines.push(L ? "پرداختت در حال بررسی است و به‌زودی با تو تماس می‌گیریم. 🙏" : "We're verifying your payment and will call you shortly. 🙏");
  }
  if (order.status === "paid") lines.push("", L ? "برای ارسال، آدرس را با قالب ۵ خطی بفرست (بات قبلاً فرستاده)." : "Send your address in the 5-line template.");
  if (order.status === "shipped") lines.push("", L ? "مرسوله تحویل پست شد. ممنون که ورتکس را انتخاب کردی 💪" : "Your parcel is on the way. Thanks for choosing Vortex 💪");
  return lines.join("\n");
}

export function ownerStockReport(env, store) {
  const ids = Object.keys(store.stock || {});
  if (!ids.length) return "📦 هنوز موجودی‌ای ثبت نشده.\nمثال: <code>/stock tee M 12</code>";
  const rows = ["📦 <b>موجودی انبار</b>", ""];
  for (const id of ids) {
    const sizes = store.stock[id] || {};
    const parts = Object.entries(sizes).map(([k, v]) => `${k === "*" ? "همه" : k}: ${FAn.format(Number(v))}`);
    rows.push(`• <b>${fx(id)}</b> → ${parts.join(" · ")}`);
  }
  rows.push("", "برای تغییر: <code>/stock tee M 12</code>");
  return rows.join("\n");
}
