#!/usr/bin/env bash
# ==========================================================================
# VORTEX — انتشار سایت روی Cloudflare Workers (Static Assets)
# استفاده:
#   CLOUDFLARE_API_TOKEN=xxx bash scripts/deploy-cloudflare.sh
#   (اگر CLOUDFLARE_ACCOUNT_ID ندادی، خودش از API پیدا می‌کند)
# دسترسی لازم توکن:  Account → Workers Scripts → Edit
# ==========================================================================
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?❌ متغیر CLOUDFLARE_API_TOKEN ست نشده است}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "🔎 Account ID پیدا نشد — از API می‌خوانم…"
  CLOUDFLARE_ACCOUNT_ID="$(curl -sS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts" \
    | python3 -c 'import sys,json;r=(json.load(sys.stdin).get("result") or []);print(r[0]["id"] if r else "")')"
  [ -z "$CLOUDFLARE_ACCOUNT_ID" ] && { echo "❌ اکانتی پیدا نشد"; exit 1; }
fi
export CLOUDFLARE_ACCOUNT_ID
echo "👤 Account: ${CLOUDFLARE_ACCOUNT_ID}"

echo "🚀 انتشار…"
npx --yes wrangler@4 deploy
echo "✅ تمام — آدرس سایت در خروجی بالا چاپ شده است."
