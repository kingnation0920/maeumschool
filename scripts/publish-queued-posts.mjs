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
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArgument ? Number.parseInt(limitArgument.replace("--limit=", ""), 10) : queuedFolders.length;

for (const folderPath of queuedFolders.slice(0, Number.isFinite(limit) ? limit : queuedFolders.length)) {
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
      let block;
      if (line.startsWith("### ")) {
        block = `<h3>${escapeHtml(line.replace(/^###\s*/, ""))}</h3>`;
      } else if (line.startsWith("## ")) {
        block = `<h2>${escapeHtml(line.replace(/^##\s*/, ""))}</h2>`;
      } else {
        const isHeading =
          index > 0 &&
          (line.endsWith("있어요") ||
            line.endsWith("달라졌어요") ||
            line.endsWith("보았습니다") ||
            line.endsWith("하나요?"));
        block = isHeading ? `<h2>${escapeHtml(line)}</h2>` : `<p>${escapeHtml(line)}</p>`;
      }

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: title,
        description: lines[1] || title,
        datePublished: today,
        dateModified: today,
        inLanguage: "ko-KR",
        mainEntityOfPage: `${siteUrl}/posts/${slug}/`,
        image: `${siteUrl}/posts/${slug}/1${imageFiles[0] ? extname(imageFiles[0]).toLowerCase() : ".jpg"}`,
        author: {
          "@type": "Person",
          name: "김민경",
          jobTitle: "사람과성장 코칭심리상담센터 센터장",
          description: "보건복지부 임상심리사 1급, 명지대학교 대학원 코칭심리학 박사 과정, 명지대학교 대학원 상담심리 석사 졸업, 보건복지부 사회복지사 1급, 여성가족부 청소년상담사 2급",
          url: "https://mindgrove.kr",
        },
        reviewedBy: {
          "@type": "Person",
          name: "김민경",
          jobTitle: "사람과성장 코칭심리상담센터 센터장",
          description: "보건복지부 임상심리사 1급, 명지대학교 대학원 코칭심리학 박사 과정, 명지대학교 대학원 상담심리 석사 졸업",
          url: "https://mindgrove.kr",
        },
        publisher: {
          "@type": "Organization",
          name: "마음결혼학교",
          url: siteUrl,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "부부 갈등이나 대화 단절은 상담으로 극복할 수 있나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "서로의 대화 패턴과 무의식적 방어기제를 객관적으로 이해하고 감정중심치료(EFT) 등 전문 소통 훈련을 거치면 오랜 침묵과 갈등을 충분히 회복할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: "배우자가 상담을 거부할 때는 어떻게 해야 하나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "부부 중 한 사람만 먼저 개인상담을 시작해도 자신의 반응 양식이 바뀌면서 상대방의 태도와 부부 관계 역동에 긍정적인 변화를 이끌어낼 수 있습니다.",
            },
          },
        ],
      },
    ],
  };

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
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
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
          <div class="direct-answer-box" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0 0; border-radius: 4px;">
            <p style="font-weight: 700; margin-bottom: 6px; color: #1e293b; font-size: 0.95rem;">💡 핵심 요약 (Direct Answer)</p>
            <p style="margin: 0; color: #334155; line-height: 1.6; font-size: 0.9rem;">${escapeHtml(lines[1] || title)}</p>
          </div>
        </header>
        <div class="post-body">
${body}
${remainingImages}
          <section class="faq-section" style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; color: #1e293b;">자주 묻는 질문 (FAQ)</h2>
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin-bottom: 4px;">Q. 부부 갈등이나 대화 단절은 상담으로 극복할 수 있나요?</h3>
              <p style="color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0;">서로의 대화 패턴과 무의식적 방어기제를 객관적으로 이해하고 감정중심치료(EFT) 등 전문 소통 훈련을 거치면 오랜 침묵과 갈등을 충분히 회복할 수 있습니다.</p>
            </div>
            <div style="margin-bottom: 16px;">
              <h3 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin-bottom: 4px;">Q. 배우자가 상담을 거부할 때는 어떻게 해야 하나요?</h3>
              <p style="color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0;">부부 중 한 사람만 먼저 개인상담을 시작해도 자신의 반응 양식이 바뀌면서 상대방의 태도와 부부 관계 역동에 긍정적인 변화를 이끌어낼 수 있습니다.</p>
            </div>
          </section>
          <div class="author-card" style="margin-top: 36px; padding: 20px 24px; background: #fffaf5; border-radius: 12px; border: 1px solid #fed7aa; display: flex; gap: 16px; align-items: flex-start;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #ea580c; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0;">
              김
            </div>
            <div>
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #1c1917; font-size: 1rem;">김민경 센터장</span>
                <span style="font-size: 0.75rem; background: #ffedd5; color: #c2410c; padding: 2px 8px; border-radius: 9999px; font-weight: 600;">보건복지부 임상심리사 1급</span>
                <span style="font-size: 0.8rem; color: #78716c;">명지대학교 코칭심리학 박사 과정</span>
              </div>
              <p style="margin: 0 0 10px; font-size: 0.85rem; color: #57534e; line-height: 1.6;">
                사람과성장 코칭심리상담센터(강남본원) 센터장. 명지대학교 대학원 코칭심리학 박사 과정, 명지대학교 대학원 상담심리 석사 졸업, 보건복지부 임상심리사 1급, 보건복지부 사회복지사 1급, 여성가족부 청소년상담사 2급. 부부·가족 갈등 회복 및 정서적 소통 코칭 전문.
              </p>
              <a href="https://mindgrove.kr/pages/02" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 0.8rem; color: #ea580c; font-weight: 600; text-decoration: underline;">
                → 사람과성장 강남본원 부부상담 예약 바로가기 (02-566-8291)
              </a>
            </div>
          </div>
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
