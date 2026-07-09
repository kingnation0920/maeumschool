import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";

const queueDir = "블로그 글 대기";
const successDir = "블로그 글 성공";
const failureDir = "블로그 글 실패";
const siteUrl = "https://maeumschool.kr";

for (const dir of [queueDir, successDir, failureDir, "posts"]) {
  mkdirSync(dir, { recursive: true });
}

const queuedFolders = readdirSync(queueDir)
  .map((name) => join(queueDir, name))
  .filter((path) => statSync(path).isDirectory());

if (queuedFolders.length === 0) {
  console.log("No queued blog posts.");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);

for (const folderPath of queuedFolders) {
  const folderName = basename(folderPath);

  try {
    publishFolder(folderPath, folderName);
    moveFolder(folderPath, join(successDir, folderName));
    console.log(`Published: ${folderName}`);
  } catch (error) {
    moveFolder(folderPath, join(failureDir, folderName));
    console.error(`Failed: ${folderName}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function publishFolder(folderPath, folderName) {
  const files = readdirSync(folderPath);
  const textFile = files.find((file) => file.toLowerCase().endsWith(".txt"));

  if (!textFile) {
    throw new Error("No .txt file found.");
  }

  const rawText = readFileSync(join(folderPath, textFile), "utf8");
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Text file is empty.");
  }

  const title = lines[0];
  const slug = makeSlug(folderName, title);
  const postDir = join("posts", slug);
  mkdirSync(postDir, { recursive: true });

  const imageFiles = files
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => naturalImageOrder(a, b));

  imageFiles.forEach((file, index) => {
    const extension = extname(file).toLowerCase() || ".jpg";
    copyFileSync(join(folderPath, file), join(postDir, `${index + 1}${extension}`));
  });

  writeFileSync(
    join(postDir, "index.html"),
    buildPostHtml({ title, lines, slug, imageFiles }),
    "utf8",
  );

  updateHome({ title, slug });
  updateSitemap({ title, slug });
  updateFeed({ title, slug, summary: lines[1] || title });
}

function buildPostHtml({ title, lines, slug, imageFiles }) {
  const bodyLines = lines.slice(1);
  const imageQueue = imageFiles.map((file, index) => {
    const extension = extname(file).toLowerCase() || ".jpg";
    return `/posts/${slug}/${index + 1}${extension}`;
  });

  const body = bodyLines
    .map((line, index) => {
      const isHeading =
        index > 0 &&
        (line.endsWith("있어요") ||
          line.endsWith("달라졌어요") ||
          line.endsWith("보았습니다") ||
          line.endsWith("하나요?"));

      const block = isHeading ? `<h2>${escapeHtml(line)}</h2>` : `<p>${escapeHtml(line)}</p>`;
      const image = shouldInsertImage(index, bodyLines.length, imageQueue.length)
        ? imageQueue.shift()
        : null;

      return image
        ? `${block}
          <figure class="post-image inline">
            <img src="${image}" alt="${escapeHtml(title)} 이미지" />
          </figure>`
        : block;
    })
    .join("\n");

  const remainingImages = imageQueue
    .map(
      (image) => `
          <figure class="post-image inline">
            <img src="${image}" alt="${escapeHtml(title)} 이미지" />
          </figure>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | 마음결혼학교</title>
    <meta name="description" content="${escapeHtml(lines[1] || title)}" />
    <link rel="canonical" href="${siteUrl}/posts/${slug}/" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="마음결혼학교" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(lines[1] || title)}" />
    <meta property="og:url" content="${siteUrl}/posts/${slug}/" />
    <meta property="og:image" content="${siteUrl}/posts/${slug}/1${imageFiles[0] ? extname(imageFiles[0]).toLowerCase() : ".jpg"}" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">본문으로 바로가기</a>
    <header class="site-header">
      <div class="top-note"><span>관계 점검 노트</span><a href="/#all-posts">전체 글 보기</a></div>
      <div class="brand-row">
        <a class="brand-mark" href="/" aria-label="마음결혼학교 홈">ㅁ</a>
        <a class="brand-name" href="/">마음결혼학교</a>
        <p>couple psychology magazine</p>
      </div>
      <nav class="main-nav" aria-label="주요 메뉴">
        <a href="/">홈</a>
        <a href="/#relationship">관계심리</a>
        <a href="/#recovery">위기와 회복</a>
        <a href="/#sexuality">성심리</a>
        <a href="/#all-posts">전체 글</a>
      </nav>
    </header>
    <main id="main" class="post-page">
      <article class="post-article">
        <header class="post-hero">
          <p class="eyebrow">relationship psychology</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="post-meta">관계심리 · ${today}</p>
        </header>
        <div class="post-body">
${body}
${remainingImages}
        </div>
        <footer class="post-footer"><a class="button ghost" href="/#all-posts">전체 글로 돌아가기</a></footer>
      </article>
    </main>
    <script type="text/javascript" src="//wcs.pstatic.net/wcslog.js"></script>
    <script type="text/javascript">
      if (!wcs_add) var wcs_add = {};
      wcs_add["wa"] = "1af85d89318d180";
      if (window.wcs) {
        wcs_do();
      }
    </script>
  </body>
</html>
`;
}

function updateHome({ title, slug }) {
  const html = readFileSync("index.html", "utf8");
  const href = `/posts/${slug}/`;
  if (html.includes(href)) return;

  const entry = `          <a href="${href}">
            <span>관계심리</span>
            <strong>${escapeHtml(title)}</strong>
            <em>글 보기</em>
          </a>
`;

  writeFileSync("index.html", html.replace('        <div class="archive-list">\n', `        <div class="archive-list">\n${entry}`), "utf8");
}

function updateSitemap({ slug }) {
  const sitemap = readFileSync("sitemap.xml", "utf8");
  const loc = `${siteUrl}/posts/${slug}/`;
  if (sitemap.includes(loc)) return;

  const entry = `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  writeFileSync("sitemap.xml", sitemap.replace("</urlset>", `${entry}</urlset>`), "utf8");
}

function updateFeed({ title, slug, summary }) {
  const feed = readFileSync("feed.xml", "utf8");
  const link = `${siteUrl}/posts/${slug}/`;
  if (feed.includes(link)) return;

  const entry = `    <item>
      <title>${escapeHtml(title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${rssDate()}</pubDate>
      <description>${escapeHtml(summary)}</description>
    </item>
`;

  writeFileSync("feed.xml", feed.replace("  </channel>", `${entry}  </channel>`), "utf8");
}

function makeSlug(folderName, title) {
  const ascii = `${folderName}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || `post-${today}`;
}

function naturalImageOrder(a, b) {
  const left = Number.parseInt(basename(a, extname(a)), 10);
  const right = Number.parseInt(basename(b, extname(b)), 10);

  if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
  return a.localeCompare(b, "ko");
}

function shouldInsertImage(index, length, imageCount) {
  if (imageCount === 0) return false;
  const interval = Math.max(1, Math.floor(length / imageCount));
  return index > 0 && index % interval === 0;
}

function moveFolder(from, to) {
  let target = to;
  if (existsSync(target)) {
    target = `${to}-${Date.now()}`;
  }
  renameSync(from, target);
}

function rssDate() {
  return new Date().toUTCString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
