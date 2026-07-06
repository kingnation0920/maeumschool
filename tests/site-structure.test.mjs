import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");

for (const label of ["홈", "관계심리", "위기와 회복", "성심리", "전체 글"]) {
  assert.match(html, new RegExp(`>${label}<`), `missing menu item: ${label}`);
}

for (const section of [
  "관계는 배워지는 감각입니다",
  "이번 주 많이 읽은 글",
  "관계심리",
  "위기와 회복",
  "성심리",
  "마음결혼학교가 쓰는 방식",
]) {
  assert.match(html, new RegExp(section), `missing homepage section: ${section}`);
}
