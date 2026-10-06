#!/usr/bin/env bash
# ==========================================================================
# VORTEX — بررسی خروجی استاتیک (public/) که روی Cloudflare منتشر می‌شود
#   public/  همان پوشه‌ای است که به Cloudflare می‌رود (Build output directory)
# استفاده: bash deploy.sh          → چک و خلاصه ساختار
#          bash deploy.sh zip      → ساخت vortex-upload.zip برای آپلود دستی
# ==========================================================================
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/public"

echo "📦 محتوای خروجی: $OUT"
find "$OUT" -maxdepth 1 -type f | sed "s|$OUT/|  - |" | sort
echo "  - assets/ ($(find "$OUT/assets" -type f | wc -l) فایل)"
echo "حجم کل: $(du -sh "$OUT" | cut -f1)"

if [ "${1:-}" = "zip" ]; then
  rm -f "$ROOT/../vortex-upload.zip"
  (cd "$OUT" && zip -qr "$ROOT/../vortex-upload.zip" . -x ".*")
  echo "✅ vortex-upload.zip ساخته شد"
fi
