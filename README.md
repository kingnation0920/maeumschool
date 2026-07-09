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

## Blog Post Queue

새 글을 올릴 때는 `블로그 글 대기` 안에 글별 폴더를 하나 넣습니다.

예:

```text
블로그 글 대기/
  52/
    새 글 제목.txt
    1.jpg
    2.jpg
    3.jpg
```

그다음 실행:

```powershell
npm run publish:queued
```

처리 결과:

- 성공한 원본 폴더는 `블로그 글 성공`으로 이동
- 실패한 원본 폴더는 `블로그 글 실패`로 이동
- 글 페이지는 `posts/` 아래에 생성
- 홈, RSS, sitemap이 자동 갱신

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
