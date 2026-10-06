#!/usr/bin/env bash
# ==========================================================================
# VORTEX — ساخت پروژه Pages و انتشار سایت روی Cloudflare
# استفاده:
#   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy bash scripts/deploy-cloudflare.sh
# ==========================================================================
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?❌ متغیر CLOUDFLARE_API_TOKEN ست نشده است}"
: "${CLOUDFLARE_ACCOUNT_ID:?❌ متغیر CLOUDFLARE_ACCOUNT_ID ست نشده است}"
PROJECT="${PROJECT_NAME:-vortexgear}"
API="https://api.cloudflare.com/client/v4"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "1️⃣  بررسی توکن…"
curl -sS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$API/user/tokens/verify" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("   ", "✅ توکن معتبر است" if d.get("success") else "❌ "+str(d.get("errors")))'

echo "2️⃣  ساخت پروژه Pages (اگر نباشد)…"
CODE="$(curl -sS -o /tmp/vx-cf.json -w '%{http_code}' -X POST \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" \
  "$API/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
  -d "{\"name\":\"${PROJECT}\",\"production_branch\":\"main\"}")"
if [ "$CODE" = "200" ]; then echo "   ✅ پروژه ${PROJECT} ساخته شد"
elif [ "$CODE" = "409" ] || grep -q "already exists" /tmp/vx-cf.json 2>/dev/null; then echo "   ℹ️  پروژه از قبل هست"
else echo "   ⚠️  پاسخ ($CODE):"; head -c 400 /tmp/vx-cf.json; echo; fi

echo "3️⃣  انتشار سایت با wrangler…"
cd "$ROOT"
npx --yes wrangler@4 pages deploy public \
  --project-name="$PROJECT" --branch=main --commit-dirty=true

echo "🎉 تمام. آدرس موقت: https://${PROJECT}.pages.dev"
