# 마음결혼학교

커플과 부부를 위한 심리 콘텐츠 매거진 정적 사이트입니다.

## Local Preview

```powershell
npm run dev
```

Open `http://localhost:4173`.

## Test

```powershell
npm test
```

## Deployment

1. Push this repository to GitHub.
2. Import the GitHub repository in Vercel.
3. Use the default static deployment settings.
4. Add the production domain: `maeumschool.kr`.
5. In the domain DNS provider, connect Vercel's required records.

Recommended Vercel DNS records:

- Apex domain `maeumschool.kr`: `A` record to `76.76.21.21`
- `www.maeumschool.kr`: `CNAME` record to `cname.vercel-dns.com`

After DNS propagation, set `maeumschool.kr` as the primary production domain in Vercel.
