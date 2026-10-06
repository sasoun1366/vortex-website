# اسکریپت‌های انتشار

| اسکریپت | کار | دسترسی لازم |
|---|---|---|
| `deploy-github.sh <repo>` | ساخت ریپو (اگر توکن اجازه بدهد) + کامیت + پوش کد | `Contents: RW` — و برای *ساخت* ریپو: `Administration: RW` |
| `deploy-cloudflare.sh` | ساخت پروژه Pages + انتشار فوری سایت | `Account → Cloudflare Pages: Edit` |
| `set-gh-secrets.py` | ست کردن سکرت‌های Actions برای دیپلوی خودکار | `Secrets: RW` + `Administration: RW` |

```bash
GITHUB_TOKEN=xxx                        bash scripts/deploy-github.sh vortex-website
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy  bash scripts/deploy-cloudflare.sh
GITHUB_TOKEN=xxx REPO=owner/vortex-website CF_API_TOKEN=xxx CF_ACCOUNT_ID=yyy \
  python3 scripts/set-gh-secrets.py
```
