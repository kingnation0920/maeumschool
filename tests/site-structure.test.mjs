import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const feed = readFileSync("feed.xml", "utf8");
const source = `${html}\n${css}`;
const postPath = "posts/bubu-daehwa/index.html";

for (const label of ["홈", "관계심리", "위기와 회복", "성심리", "전체 글"]) {
  assert.match(html, new RegExp(`>${label}<`), `missing menu item: ${label}`);
}

for (const section of [
  "관계는 배워지는 감각입니다",
  "관계심리",
  "위기와 회복",
  "성심리",
  "마음결혼학교가 쓰는 방식",
  "부부 대화 주제 친밀함을 회복하는 마음의 언어",
]) {
  assert.match(html, new RegExp(section), `missing homepage section: ${section}`);
}

for (const asset of ["photo/07.jpg", "photo/08.jpg", "photo/02.jpg", "photo/03.jpg"]) {
  assert.match(source, new RegExp(asset), `missing image reference: ${asset}`);
  assert.equal(existsSync(asset), true, `missing image file: ${asset}`);
}

for (const file of ["robots.txt", "sitemap.xml", "feed.xml"]) {
  assert.equal(existsSync(file), true, `missing SEO file: ${file}`);
}

const naverVerificationFile = "naverfe88afb46308e0d3e887803ad4ec4466.html";
assert.equal(existsSync(naverVerificationFile), true, "missing Naver verification file");
assert.match(
  readFileSync(naverVerificationFile, "utf8"),
  /naver-site-verification: naverfe88afb46308e0d3e887803ad4ec4466\.html/,
  "Naver verification file content is invalid",
);

assert.match(html, /wcs\.pstatic\.net\/wcslog\.js/, "missing Naver Analytics script");
assert.match(html, /1af85d89318d180/, "missing Naver Analytics site id");

assert.equal(existsSync(postPath), true, "missing couple conversation post page");
const postHtml = existsSync(postPath) ? readFileSync(postPath, "utf8") : "";
assert.match(postHtml, /부부 대화 주제 친밀함을 회복하는 마음의 언어/, "missing post title");
assert.match(postHtml, /wcs\.pstatic\.net\/wcslog\.js/, "missing analytics on post page");
for (const image of [
  "posts/bubu-daehwa/1.jpg",
  "posts/bubu-daehwa/2.jpg",
  "posts/bubu-daehwa/3.jpg",
  "posts/bubu-daehwa/4.jpg",
  "posts/bubu-daehwa/5.jpg",
]) {
  assert.equal(existsSync(image), true, `missing post image: ${image}`);
  assert.match(postHtml, new RegExp(image.replace(/\//g, "\\/")), `post does not reference ${image}`);
}
assert.match(html, /posts\/bubu-daehwa/, "homepage does not link to the new post");
assert.match(feed, /posts\/bubu-daehwa/, "RSS does not include the new post");

assert.match(feed, /<title>마음결혼학교<\/title>/, "RSS title is not valid Korean");
assert.match(feed, /커플과 부부를 위한 관계심리/, "RSS description is not valid Korean");
assert.doesNotMatch(feed, /�|留|덉|쓬|寃|숆/, "RSS still contains mojibake");
