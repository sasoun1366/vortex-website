/* ==========================================================================
   VORTEX — لایهٔ ذخیره‌سازی و اتوماسیون فروش
   یک فایل JSON در همین ریپو به‌عنوان دیتابیس سبک (GitHub Contents API).
   چرا؟ چون توکن کلودفلر فعلی اجازهٔ ساخت KV/D1 نمی‌دهد و این روش صفر
   زیرساخت اضافه دارد، نسخه‌بندی‌شده است و صاحب فروشگاه می‌تواند فایل را
   با چشم خودش ببیند. اگر روزی KV/D1 فعال شد، فقط همین فایل عوض می‌شود.
   ========================================================================== */

const GH_REPO = "sasoun1366/vortex-website";
const GH_FILE = "data/store.json";
const EMPTY_STORE = { cfg: { card: "", cardName: "", whatsapp: "" }, stock: {}, orders: {} };

/* کش کوتاه‌مدت در حافظهٔ همان isolate تا هر پیام یک درخواست به گیت‌هاب نزند */
let _cache = { at: 0, data: null, sha: null };
const TTL = 4000;

const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/\s/g, ""))));

export async function readStore(env) {
  if (_cache.data && Date.now() - _cache.at < TTL) return _cache.data;
  try {
    const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
      headers: {
        authorization: `Bearer ${env.GH_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "vortex-worker",
      },
      cf: { cacheTtl: 0 },
    });
    if (r.status === 404) {
      _cache = { at: Date.now(), data: structuredClone(EMPTY_STORE), sha: null };
      return _cache.data;
    }
    if (!r.ok) throw new Error("gh_read_" + r.status);
    const j = await r.json();
    const data = JSON.parse(b64d(j.content || "{}") || "{}");
    _cache = { at: Date.now(), data: { ...structuredClone(EMPTY_STORE), ...data }, sha: j.sha };
    return _cache.data;
  } catch (e) {
    console.error("store read failed:", e.message);
    return _cache.data || structuredClone(EMPTY_STORE);
  }
}

/* خواندن تازه از گیت‌هاب و بی‌اعتنایی به کش (برای نوشتن، تا دادهٔ قدیمی روی جدید را ننویسد) */
async function freshRead(env) {
  _cache = { at: 0, data: null, sha: null };
  return readStore(env);
}
export function invalidate() { _cache = { at: 0, data: null, sha: null }; }

export async function writeStore(env, mutate, _retry = 0) {
  const cur = await freshRead(env);
  const next = structuredClone(cur);
  mutate(next);
  try {
    let sha = _cache.sha;
    if (!sha) {
      const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
        headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json", "user-agent": "vortex-worker" },
      });
      if (r.ok) sha = (await r.json()).sha;
    }
    const body = {
      message: `store: ${new Date().toISOString()}`,
      content: b64e(JSON.stringify(next, null, 1)),
      committer: { name: "Vortex Bot", email: "hello@vortexgear.ir" },
    };
    if (sha) body.sha = sha;
    const put = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${env.GH_TOKEN}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "vortex-worker",
      },
      body: JSON.stringify(body),
    });
    if (!put.ok) {
      const txt = (await put.text()).slice(0, 140);
      if ((put.status === 409 || put.status === 422) && _retry < 2) {
        invalidate();
        return writeStore(env, mutate, _retry + 1);       // تضاد همزمانی → دوباره بخوان و بنویس
      }
      throw new Error("gh_write_" + put.status + " " + txt);
    }
    const j = await put.json();
    _cache = { at: Date.now(), data: next, sha: j.content && j.content.sha };
    return next;
  } catch (e) {
    console.error("store write failed:", e.message);
    _cache = { at: Date.now(), data: next, sha: _cache.sha };
    return next;
  }
}

/* ---------- موجودی ------------------------------------------------------- */
/* stock: { "tee": { "S": 4, "M": 9, "L": 0 }, "keychain": { "*": 25 } }
   کلید "*" یعنی همهٔ سایزها یکسان. اگر محصولی ثبت نشده باشد = نامحدود. */
/* کلید انبار را با شناسهٔ محصول تطبیق می‌دهد: هم «vx-tee-001» و هم «tee» کار می‌کند */
export function stockKey(store, pid) {
  const keys = Object.keys((store && store.stock) || {});
  if (!keys.length) return null;
  if (keys.includes(pid)) return pid;
  const norm = String(pid).toLowerCase();
  const hit = keys.find((k) => {
    const kk = String(k).toLowerCase();
    return norm.startsWith("vx-" + kk) || norm.includes(kk) || kk.includes(norm);
  });
  return hit || null;
}

export function stockFor(store, pid, size) {
  const key = stockKey(store, pid);
  const s = key ? store.stock[key] : null;
  if (!s) return null;
  if (s["*"] !== undefined) return Number(s["*"]);
  if (size && s[size] !== undefined) return Number(s[size]);
  const vals = Object.values(s).map(Number).filter((n) => !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0);
}

export function stockReport(store, items) {
  const out = [];
  for (const it of items || []) {
    const have = stockFor(store, it.id, it.size);
    if (have === null) continue;
    if (have <= 0) out.push({ ...it, have: 0 });
    else if (have < it.qty) out.push({ ...it, have });
  }
  return out;
}

export function decStock(store, items) {
  for (const it of items || []) {
    const key0 = stockKey(store, it.id);
    const s = key0 ? store.stock[key0] : null;
    if (!s) continue;
    const key = s["*"] !== undefined ? "*" : it.size && s[it.size] !== undefined ? it.size : null;
    if (!key) continue;
    s[key] = Math.max(0, Number(s[key]) - Number(it.qty || 1));
  }
}
