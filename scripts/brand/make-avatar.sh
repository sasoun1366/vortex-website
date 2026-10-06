#!/usr/bin/env bash
# ==========================================================================
# ساخت عکس پروفایل بات/شبکه‌های اجتماعی از لوگوی ورتکس
# خروجی: brand/bot-avatar.png (۶۴۰×۶۴۰) و brand/bot-avatar-512.jpg
# استفاده:  bash scripts/brand/make-avatar.sh
# نیاز: python3 + playwright (chromium) + imagemagick
# ==========================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
python3 - <<'PY'
from playwright.sync_api import sync_playwright
import subprocess, sys, pathlib
srv = subprocess.Popen([sys.executable,"-m","http.server","8090","--bind","127.0.0.1"],
                       cwd="scripts/brand", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_context(viewport={"width":640,"height":640}, device_scale_factor=2).new_page()
        p.goto("http://127.0.0.1:8090/avatar.html", wait_until="networkidle"); p.wait_for_timeout(900)
        p.screenshot(path="brand/bot-avatar.png", clip={"x":0,"y":0,"width":640,"height":640})
        b.close()
finally:
    srv.terminate()
print("✅ brand/bot-avatar.png ساخته شد")
PY
convert brand/bot-avatar.png -resize 512x512 -strip -quality 92 brand/bot-avatar-512.jpg
echo "✅ brand/bot-avatar-512.jpg ساخته شد"
