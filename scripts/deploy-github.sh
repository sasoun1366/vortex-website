#!/usr/bin/env bash
# ==========================================================================
# VORTEX — ساخت ریپوی گیت‌هاب و پوش کد
# استفاده:  GITHUB_TOKEN=xxxx bash scripts/deploy-github.sh vortex-website
# ==========================================================================
set -euo pipefail
: "${GITHUB_TOKEN:?❌ متغیر GITHUB_TOKEN ست نشده است}"
REPO_NAME="${1:-vortex-website}"
API="https://api.github.com"
H_AUTH="Authorization: Bearer ${GITHUB_TOKEN}"
H_ACC="Accept: application/vnd.github+json"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---------- ۱) توکن برای کدام حساب است؟ ----------
USER_JSON="$(curl -sS -H "$H_AUTH" -H "$H_ACC" "$API/user")"
OWNER="$(printf '%s' "$USER_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("login",""))')"
if [ -z "$OWNER" ]; then
  echo "❌ توکن معتبر نیست یا دسترسی ندارد:"; printf '%s\n' "$USER_JSON" | head -20; exit 1
fi
echo "👤 حساب گیت‌هاب: $OWNER"

# ---------- ۲) ساخت ریپو (اگر وجود ندارد) ----------
CODE="$(curl -sS -o /tmp/vx-repo.json -w '%{http_code}' -X POST -H "$H_AUTH" -H "$H_ACC" \
  "$API/user/repos" \
  -d "{\"name\":\"${REPO_NAME}\",\"description\":\"VORTEX — bilingual CrossFit brand site + shop (fa/en)\",\"private\":false,\"has_issues\":true,\"has_wiki\":false}")"
if [ "$CODE" = "201" ]; then
  echo "✅ ریپو ساخته شد: https://github.com/${OWNER}/${REPO_NAME}"
elif [ "$CODE" = "422" ]; then
  echo "ℹ️  ریپو از قبل وجود دارد — ادامه می‌دهیم"
else
  echo "⚠️  پاسخ ساخت ریپو ($CODE):"; head -c 400 /tmp/vx-repo.json; echo
fi

# ---------- ۳) کامیت هر تغییر باقی‌مانده ----------
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git status --porcelain)" ]; then
  git add -A
  git -c user.name="Vortex" -c user.email="hello@vortexgear.ir" commit -q -m "chore: update site" || true
fi

# ---------- ۴) پوش ----------
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO_NAME}.git"
git push -u origin main --force-with-lease || git push -u origin main
# توکن را از remote پاک کن (ذخیره نشود)
git remote set-url origin "https://github.com/${OWNER}/${REPO_NAME}.git"
echo "🎉 پوش انجام شد: https://github.com/${OWNER}/${REPO_NAME}"
