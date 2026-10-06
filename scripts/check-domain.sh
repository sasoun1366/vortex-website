#!/usr/bin/env bash
# ==========================================================================
# بررسی سریع وضعیت دامنهٔ vortexgear.ir
# استفاده: bash scripts/check-domain.sh
# ==========================================================================
set -uo pipefail
D="vortexgear.ir"
echo "🔍 وضعیت دامنه: $D  —  $(date '+%Y-%m-%d %H:%M')"
echo
echo "— نیم‌سرورها از دید DNS جهانی —"
for r in "Cloudflare|https://cloudflare-dns.com/dns-query" "Google|https://dns.google/resolve"; do
  n="${r%%|*}"; u="${r##*|}"
  out=$(curl -s --max-time 12 -H 'accept: application/dns-json' "$u?name=$D&type=NS" \
    | python3 -c "import sys,json;a=json.load(sys.stdin).get('Answer') or [];print(', '.join(sorted(x['data'].rstrip('.') for x in a)) if a else '—')")
  printf "  %-11s → %s\n" "$n" "$out"
done
echo
echo "— انتظار —"
echo "  alaric.ns.cloudflare.com, kallie.ns.cloudflare.com   ← باید این دو دیده شود"
echo
echo "— رکورد A فعلی —"
curl -s --max-time 12 -H 'accept: application/dns-json' "https://cloudflare-dns.com/dns-query?name=$D&type=A" \
  | python3 -c "import sys,json;a=json.load(sys.stdin).get('Answer') or [];print('  ', [x['data'] for x in a] if a else '—')"
echo
echo "— سایت فعلی (workers.dev) —"
curl -s --max-time 12 https://vortexgear.s-photography1987.workers.dev/api/health || echo "  خطا"
echo
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "— وضعیت Zone در کلودفلر —"
  zid=$(curl -s --max-time 15 -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones?name=$D" \
        | python3 -c "import sys,json;r=json.load(sys.stdin).get('result') or [{}];print((r[0] or {}).get('id',''))")
  [ -n "$zid" ] && curl -s --max-time 15 -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      "https://api.cloudflare.com/client/v4/zones/$zid" \
      | python3 -c "import sys,json;r=json.load(sys.stdin).get('result') or {};print('  status:', r.get('status'), '| NS:', ', '.join(r.get('name_servers') or []))"
fi
