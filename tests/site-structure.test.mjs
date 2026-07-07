import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const feed = readFileSync("feed.xml", "utf8");
const source = `${html}\n${css}`;

for (const label of ["홈", "관계심리", "위기와 회복", "성심리", "전체 글"]) {
  assert.match(html, new RegExp(`>${label}<`), `missing menu item: ${label}`);
}

for (const section of [
  "관계는 배워지는 감각입니다",
  "관계심리",
  "위기와 회복",
  "성심리",
  "마음결혼학교가 쓰는 방식",
  "아직 올라온 글이 없습니다",
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

assert.match(feed, /<title>마음결혼학교<\/title>/, "RSS title is not valid Korean");
assert.match(feed, /커플과 부부를 위한 관계심리/, "RSS description is not valid Korean");
assert.doesNotMatch(feed, /�|留|덉|쓬|寃|숆/, "RSS still contains mojibake");
