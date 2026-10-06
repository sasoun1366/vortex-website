#!/usr/bin/env bash
# ==========================================================================
# VORTEX — تنظیم بات فروشگاه (وب‌هوک + دستورها) و سکرت‌های Worker
# استفاده:
#   BOT_TOKEN="123:ABC" WORKER_URL="https://vortexgear.xxx.workers.dev" \
#   WEBHOOK_SECRET="$(openssl rand -hex 24)" CLOUDFLARE_API_TOKEN=xxx \
#   bash scripts/setup-telegram.sh
# ==========================================================================
set -euo pipefail
: "${BOT_TOKEN:?❌ BOT_TOKEN لازم است (از @BotFather)}"
WORKER_URL="${WORKER_URL:-https://vortexgear.s-photography1987.workers.dev}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')}"

echo "1️⃣  بررسی بات…"
curl -sS "https://api.telegram.org/bot${BOT_TOKEN}/getMe" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("   ✅",d["result"]["first_name"],"@"+d["result"]["username"]) if d.get("ok") else sys.exit("❌ توکن بات نامعتبر است")'

echo "2️⃣  ست کردن وب‌هوک…"
curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WORKER_URL}/api/tg/webhook" \
  -d "secret_token=${WEBHOOK_SECRET}" \
  -d "allowed_updates=[\"message\",\"callback_query\"]" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("   ✅ وب‌هوک ثبت شد" if d.get("ok") else "   ❌ "+str(d.get("description")))'

echo "3️⃣  تنظیم دستورهای بات…"
curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands" \
  -H 'content-type: application/json' \
  -d '{"commands":[{"command":"start","description":"شروع / ورود به فروشگاه"},
                   {"command":"shop","description":"دیدن محصولات ورتکس"},
                   {"command":"id","description":"نمایش شناسه چت من"},
                   {"command":"help","description":"راهنما"}]}' >/dev/null
echo "   ✅ دستورها ثبت شد"

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "4️⃣  ذخیره سکرت‌ها روی Cloudflare…"
  cd "$(dirname "$0")/.."
  echo "$BOT_TOKEN"        | npx --yes wrangler@4 secret put BOT_TOKEN        >/dev/null && echo "   ✅ BOT_TOKEN"
  echo "$WEBHOOK_SECRET"   | npx --yes wrangler@4 secret put WEBHOOK_SECRET   >/dev/null && echo "   ✅ WEBHOOK_SECRET"
  if [ -n "${OWNER_CHAT_ID:-}" ]; then
    echo "$OWNER_CHAT_ID"  | npx --yes wrangler@4 secret put OWNER_CHAT_ID    >/dev/null && echo "   ✅ OWNER_CHAT_ID"
  else
    echo "   ⏳ OWNER_CHAT_ID ست نشد — بعد از گرفتن شناسه با /id در بات، این را اجرا کن:"
    echo "      echo \"<چت‌آی‌دی>\" | npx wrangler secret put OWNER_CHAT_ID && npx wrangler deploy"
  fi
else
  echo "4️⃣  ⏭  CLOUDFLARE_API_TOKEN داده نشد — سکرت‌ها دستی ست شوند:"
  echo "      echo \"$BOT_TOKEN\" | npx wrangler secret put BOT_TOKEN"
  echo "      echo \"$WEBHOOK_SECRET\" | npx wrangler secret put WEBHOOK_SECRET"
  echo "      echo \"<چت‌آی‌دی>\" | npx wrangler secret put OWNER_CHAT_ID"
fi

echo
echo "🔐 WEBHOOK_SECRET: ${WEBHOOK_SECRET}"
echo "🔗 وب‌هوک: ${WORKER_URL}/api/tg/webhook"
