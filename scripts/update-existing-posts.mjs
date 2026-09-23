import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const postsDir = "posts";
const postFolders = readdirSync(postsDir).filter((name) =>
  statSync(join(postsDir, name)).isDirectory()
);

const standardAuthorCard = `        <div class="author-card" style="margin-top: 36px; padding: 20px 24px; background: #fffaf5; border-radius: 12px; border: 1px solid #fed7aa; display: flex; gap: 16px; align-items: flex-start;">
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
        </div>`;

let updatedCount = 0;

for (const folder of postFolders) {
  const filePath = join(postsDir, folder, "index.html");
  let content = readFileSync(filePath, "utf8");

  // 1. JSON-LD update
  const ldJsonMatch = content.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (ldJsonMatch) {
    const rawJson = ldJsonMatch[1];
    const data = JSON.parse(rawJson);
    if (data["@graph"]) {
      for (const item of data["@graph"]) {
        if (item["@type"] === "BlogPosting" || item["@type"] === "Article") {
          item.author = {
            "@type": "Person",
            name: "김민경",
            jobTitle: "사람과성장 코칭심리상담센터 센터장",
            description: "보건복지부 임상심리사 1급, 명지대학교 대학원 코칭심리학 박사 과정, 명지대학교 대학원 상담심리 석사 졸업, 보건복지부 사회복지사 1급, 여성가족부 청소년상담사 2급",
            url: "https://mindgrove.kr",
            worksFor: {
              "@type": "Organization",
              name: "사람과성장 코칭심리상담센터",
              url: "https://mindgrove.kr"
            },
            hasCredential: [
              { "@type": "EducationalOccupationalCredential", name: "보건복지부 임상심리사 1급" },
              { "@type": "EducationalOccupationalCredential", name: "보건복지부 사회복지사 1급" },
              { "@type": "EducationalOccupationalCredential", name: "여성가족부 청소년상담사 2급" }
            ],
            alumniOf: [
              { "@type": "EducationalOrganization", name: "명지대학교 대학원 코칭심리학 박사 과정" },
              { "@type": "EducationalOrganization", name: "명지대학교 대학원 상담심리 석사" }
            ]
          };
          item.reviewedBy = {
            "@type": "Person",
            name: "김민경",
            jobTitle: "사람과성장 코칭심리상담센터 센터장",
            description: "보건복지부 임상심리사 1급, 명지대학교 대학원 코칭심리학 박사 과정, 명지대학교 대학원 상담심리 석사 졸업",
            url: "https://mindgrove.kr"
          };
        }
      }
    }
    const newLdJsonTag = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    content = content.replace(ldJsonMatch[0], newLdJsonTag);
  }

  // 2. Author Card UI update
  // Check if author-card exists
  const authorCardRegex = /<div class="author-card".*?<!-- author-card-end -->|<div class="author-card"[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/;
  if (authorCardRegex.test(content)) {
    content = content.replace(authorCardRegex, standardAuthorCard);
  } else {
    // If not present, insert before footer or end of article
    if (content.includes('<footer class="post-footer">')) {
      content = content.replace(
        '<footer class="post-footer">',
        `${standardAuthorCard}\n        <footer class="post-footer">`
      );
    } else if (content.includes('</div></article>')) {
      content = content.replace(
        '</div></article>',
        `${standardAuthorCard}\n</div></article>`
      );
    } else if (content.includes('</article>')) {
      content = content.replace(
        '</article>',
        `${standardAuthorCard}\n</article>`
      );
    }
  }

  writeFileSync(filePath, content, "utf8");
  updatedCount++;
}

console.log(`Successfully updated ${updatedCount} posts.`);
