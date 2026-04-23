I'm using the writing-plans skill to create the implementation plan.

# GitHub Pages Markdown Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 GitHub Pages 上建立一個從 `content/` 讀取 Markdown，顯示 outline（以檔名為標題）與文章內容的簡易、響應式網站；無建置流程（Client-side SPA），可選擇性加入自動產生 `content/index.json` 的 CI。

**Architecture:** Single-page app（`index.html` + `assets/js/main.js`）由 GitHub Pages 提供，透過 `content/index.json` 取得檔案清單，點選檔名後以 `fetch('/content/<filename>')` 取得 Markdown 並用 `markdown-it` 在前端渲染；使用 `.nojekyll` 避免 Jekyll 影響原始 Markdown 檔案。

**Tech Stack:** HTML, CSS, vanilla JavaScript, markdown-it (CDN), DOMPurify (CDN)；Node.js 腳本 `scripts/generate-index.js`（可選）用於自動產生 `content/index.json`；GitHub Actions 可自動更新 `index.json`（可選）。

---

### Task 1: Repo Prep

**Files:**
- Create: `.nojekyll`

- [ ] **Step 1: 在 repo 根目錄建立 `.nojekyll` 檔案**

```bash
# 在 repo 根目錄下執行
touch .nojekyll
git add .nojekyll
git commit -m "chore: add .nojekyll to serve raw files on GitHub Pages"
```

Expected: `.nojekyll` exists in repo root; GitHub Pages 不會用 Jekyll 處理檔案。

---

### Task 2: Site Skeleton (index, assets)

**Files:**
- Create: `index.html`
- Create: `assets/css/style.css`
- Create: `assets/js/main.js`

**Goal:** 建立單頁應用（SPA）骨架，載入 `content/index.json` 顯示大綱，點選項目載入 Markdown 並渲染。

- [ ] **Step 1: 建立 `index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Articles</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
</head>
<body>
  <header>
    <h1>Articles</h1>
  </header>
  <main class="container">
    <aside class="outline" id="outline"></aside>
    <article class="content" id="content"></article>
  </main>

  <!-- markdown-it + DOMPurify from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@2.3.10/dist/purify.min.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 建立 `assets/css/style.css`（簡單響應式樣式）**

```css
/* assets/css/style.css */
*{box-sizing:border-box}
body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; color:#111}
header{padding:16px; background:#f8f9fa; border-bottom:1px solid #e6e6e6}
.container{display:flex; gap:16px; padding:16px}
.outline{width:260px; max-width:35%; overflow:auto}
.outline ul{list-style:none; padding:0; margin:0}
.outline li{padding:8px 4px; border-bottom:1px solid #eee}
.outline a{color:#0366d6; text-decoration:none}
.content{flex:1; max-width:800px}
@media(max-width:800px){
  .container{flex-direction:column}
  .outline{width:100%; max-width:100%}
}
```

- [ ] **Step 3: 建立 `assets/js/main.js`（核心邏輯）**

```js
// assets/js/main.js
(async function(){
  const md = window.markdownit({html:false});
  const outlineEl = document.getElementById('outline');
  const contentEl = document.getElementById('content');

  function filenameToTitle(name){
    // Remove extension and decode
    const base = name.replace(/\.md$/i, '');
    return decodeURIComponent(base).replace(/[-_]+/g,' ').trim();
  }

  async function loadIndex(){
    try{
      const res = await fetch('/content/index.json');
      if(!res.ok) throw new Error('index.json not found');
      const list = await res.json();
      renderOutline(list);
    }catch(e){
      outlineEl.innerHTML = '<p>無法讀取 content/index.json，請確認檔案存在或產生 index.json。</p>';
    }
  }

  function renderOutline(list){
    const ul = document.createElement('ul');
    list.forEach(fname=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      const url = '?file=' + encodeURIComponent(fname);
      a.href = url;
      a.textContent = filenameToTitle(fname);
      li.appendChild(a);
      ul.appendChild(li);
    });
    outlineEl.innerHTML = '';
    outlineEl.appendChild(ul);
  }

  async function loadFileFromQuery(){
    const params = new URLSearchParams(location.search);
    const file = params.get('file');
    if(file){
      await loadAndRenderFile(file);
    } else {
      contentEl.innerHTML = '<p>請從左側選擇一篇文章。</p>';
    }
  }

  async function loadAndRenderFile(fname){
    try{
      const res = await fetch('/content/' + encodeURIComponent(fname));
      if(!res.ok) throw new Error('not found');
      const text = await res.text();
      const html = md.render(text);
      contentEl.innerHTML = DOMPurify.sanitize(html);
    }catch(e){
      contentEl.innerHTML = '<p>無法載入檔案：' + fname + '</p>';
    }
  }

  // Init
  await loadIndex();
  await loadFileFromQuery();

  // Handle navigation clicks (so SPA doesn't reload)
  window.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(href && href.startsWith('?file=')){
      e.preventDefault();
      history.pushState(null, '', href);
      const params = new URLSearchParams(href.replace('?',''));
      const f = params.get('file');
      loadAndRenderFile(f);
    }
  });

  window.addEventListener('popstate', loadFileFromQuery);
})();
```

Expected: 開啟 `index.html`（或本地 http server）時左側顯示 `content/index.json` 的檔案清單，點選後右側顯示渲染後的文章。

---

### Task 3: content/index.json 與 sample content

**Files:**
- Create: `content/index.json` (由腳本生成或手動維護)
- Add: 若干 `content/*.md`（現有檔案直接使用）

- [ ] **Step 1: 建立 `content/index.json` 範例**

```json
[
  "Day216.md",
  "Day272.md",
  "How to Ask for Directions.md",
  "How to Order at Starbucks Like a Native.md"
]
```

- [ ] **Step 2: 若尚未有 sample markdown，可新增一個 sample**

```markdown
<!-- content/Welcome.md -->
# 歡迎

這是一篇範例文章。
```

Commit: `git add content/index.json content/Welcome.md && git commit -m "chore: add sample index and sample article"`

Note: 因為瀏覽器無法列目錄，必須提供 `content/index.json`（手動或自動產生）作為清單來源。

---

### Task 4: Optional — 自動產生 index.json 的 Node 腳本

**Files:**
- Create: `scripts/generate-index.js`

- [ ] **Step 1: 新增 `scripts/generate-index.js`**

```js
// scripts/generate-index.js
const fs = require('fs');
const path = require('path');
const contentDir = path.join(__dirname, '..', 'content');
const outFile = path.join(contentDir, 'index.json');

const files = fs.readdirSync(contentDir)
  .filter(f => f.toLowerCase().endsWith('.md'))
  .sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));

fs.writeFileSync(outFile, JSON.stringify(files, null, 2)+"\n");
console.log(`Wrote ${files.length} entries to ${outFile}`);
```

- [ ] **Step 2: 執行腳本以產生 index.json**

```bash
node scripts/generate-index.js
git add content/index.json
git commit -m "chore: update content/index.json (auto-generated)"
```

Expected: `content/index.json` 會列出所有 `.md` 檔名。

---

### Task 5: Optional — GitHub Action 自動更新 index.json

**Files:**
- Create: `.github/workflows/update-index.yml`

- [ ] **Step 1: 新增 workflow，push 時自動執行腳本並提交變更**

```yaml
# .github/workflows/update-index.yml
name: Update content index
on:
  push:
    paths:
      - 'content/**'
      - 'scripts/generate-index.js'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: true
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install deps (none required)
        run: echo 'No deps'
      - name: Run generator
        run: node scripts/generate-index.js
      - name: Commit index.json if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add content/index.json || true
          if ! git diff --cached --quiet; then
            git commit -m "chore: update content/index.json [skip ci]"
            git push
          else
            echo "No changes to commit"
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Expected: 每次 push 內容或腳本更新時，自動更新 `content/index.json` 並 push 回 repo（若有差異）。

---

### Task 6: Local Verification

- [ ] **Step 1: 啟動本機靜態伺服器**

```bash
# 在 repo 根目錄
python3 -m http.server 8000
# 然後在瀏覽器開啟 http://localhost:8000
```

- [ ] **Step 2: 驗證行為**
  - 大綱（左側）顯示 `content/index.json` 內容
  - 點選檔案後，右側顯示渲染後的文章
  - 在手機視窗下檢視，確保版面不破版

---

### Task 7: Commit & Push

- [ ] **Step 1: Add & Commit**

```bash
git add index.html assets scripts content .nojekyll .github/workflows/update-index.yml
git commit -m "feat: add client-side markdown site with index.json support"
git push origin main
```

---

### Task 8: Enable GitHub Pages (手動)

- [ ] **Step 1: 在 GitHub repo 的 Settings > Pages，設定來源分支為 `main`（root）並儲存**
- [ ] **Step 2: 若使用 `docs/` 作為來源，請把檔案放到 `docs/`，或修改策略**

Note: 若選擇根目錄為 Pages 來源，`index.html` 與 `content/` 將會被公開。

---

### Verification

1. 在本地 `python3 -m http.server` 測試，確保 `content/index.json` 正確列出檔案且點選能載入。
2. Push 並開啟 GitHub Pages 網站，確認 index 與文章能被載入。
3. 搜尋/共享時檢查網址（例如 `/?file=Day216.md`）可以直接載入特定文章。

---

### Decisions

- 採用 Client-side SPA（無建置），理由：部署流程最簡單、易於維護；缺點是原生 SEO 受限，需額外 server-side 或 pre-render 若需 SEO。
- 為了簡單性與可部署性，選擇使用 `content/index.json` 作為檔案清單來源，並提供 Node 腳本 + GitHub Action 供自動化更新（可選）。

---

### Further Considerations

1. 若需要較佳 SEO 或社群分享卡片（og:
），建議改用 Jekyll / Eleventy 並在 build 時把 Markdown 轉成 HTML。
2. 可加入簡單搜尋（在前端做全文索引或使用 lunr.js）
3. 可把 plan 寫入 `plans/` 或 `docs/superpowers/plans/`，請指示偏好路徑。

---

### Self-Review

- [ ] Spec coverage: 本計畫對照需求：只讀取 `content/`、大綱以檔名為標題、支援 mobile/desktop、簡單風格 -> 已覆蓋。
- [ ] Placeholder scan: 無 "TBD" 或未完成步驟；每個步驟包含具體檔案、程式碼與命令。
- [ ] Consistency: 檔案路徑統一使用 repo root 相對路徑（`index.html`, `assets/`, `content/`, `scripts/`）。

---

Saved plan filename suggestion for workspace: `plans/github-pages-markdown-site.md` (若你希望我也把計畫寫入 workspace 的 `plans/`，請允許我進行檔案寫入操作)。
