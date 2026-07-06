# 마음결혼학교 Static Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visible static psychological magazine homepage for `마음결혼학교`.

**Architecture:** Use a small static site so the user can view it immediately and later publish it on Vercel. `index.html` holds content and structure, `styles.css` holds the visual system, and a Node smoke test verifies menu and homepage sections.

**Tech Stack:** HTML, CSS, Node.js built-in test script, local static server.

---

### Task 1: Structure Test

**Files:**
- Create: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/site-structure.test.mjs`

Expected: FAIL because `index.html` does not exist.

### Task 2: Static Site

**Files:**
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: Implement static homepage**

Create `index.html` with 5 menu items, an editorial hero, image collage, featured article, popular articles, category bands, and footer.

- [ ] **Step 2: Implement visual system**

Create `styles.css` with warm off-white background, centered logo header, uppercase navigation, large editorial headline, image collage, article cards, mobile menu wrapping, and accessible contrast.

- [ ] **Step 3: Run structure test**

Run: `node tests/site-structure.test.mjs`

Expected: PASS.

### Task 3: Local Preview

**Files:**
- No new files.

- [ ] **Step 1: Start local static server**

Run: `python -m http.server 4173`

Expected: local server available at `http://localhost:4173`.

- [ ] **Step 2: Open browser and inspect page**

Use the in-app browser to open `http://localhost:4173` and confirm the homepage is visible with the 5-item menu and Melyssa-inspired editorial structure.
