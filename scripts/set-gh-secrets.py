#!/usr/bin/env python3
"""
VORTEX — ست کردن سکرت‌های GitHub Actions برای دیپلوی خودکار Cloudflare
استفاده:
  GITHUB_TOKEN=xxx REPO=owner/vortex-website \
  CF_API_TOKEN=yyy CF_ACCOUNT_ID=zzz python3 scripts/set-gh-secrets.py
نیازمند: pip install pynacl
"""
import base64, json, os, sys, urllib.request

def api(url, token, method="GET", data=None):
    req = urllib.request.Request(url, method=method,
        headers={"Authorization": f"Bearer {token}",
                 "Accept": "application/vnd.github+json",
                 "Content-Type": "application/json"},
        data=json.dumps(data).encode() if data else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode()
        return json.loads(body) if body else {}

def main():
    gh   = os.environ["GITHUB_TOKEN"]
    repo = os.environ.get("REPO") or sys.exit("REPO=owner/name لازم است")
    secrets = {
        "CLOUDFLARE_API_TOKEN": os.environ.get("CF_API_TOKEN"),
        "CLOUDFLARE_ACCOUNT_ID": os.environ.get("CF_ACCOUNT_ID"),
    }
    secrets = {k: v for k, v in secrets.items() if v}
    if not secrets:
        sys.exit("CF_API_TOKEN / CF_ACCOUNT_ID خالی است")

    try:
        from nacl import encoding, public
    except ImportError:
        sys.exit("pynacl نصب نیست: pip install pynacl")

    key = api(f"https://api.github.com/repos/{repo}/actions/secrets/public-key", gh)
    pk = public.PublicKey(key["key"].encode(), encoding.Base64Encoder())

    for name, value in secrets.items():
        sealed = public.SealedBox(pk).encrypt(value.encode())
        enc = base64.b64encode(sealed).decode()
        api(f"https://api.github.com/repos/{repo}/actions/secrets/{name}", gh, "PUT",
            {"encrypted_value": enc, "key_id": key["key_id"]})
        print(f"✅ سکرت {name} ست شد")
    print(f"🎉 سکرت‌ها در {repo} آماده‌اند — حالا در .github/workflows/deploy.yml دو خط push را از کامنت دربیاور")

if __name__ == "__main__":
    main()
