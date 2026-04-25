// Sample article content for the blog prototype
window.BLOG_CONTENT = {
  trending: [
    { no: "01", title: "A design system that quietly disappears.", category: "Design Systems", date: "2026 · 04 · 12", unread: true },
    { no: "02", title: "Composition API, two years in.", category: "Vue 3", date: "2026 · 04 · 05", unread: true },
    { no: "03", title: "Signals, stores, and when not to reach for either.", category: "Frontend", date: "2026 · 03 · 28", unread: false },
    { no: "04", title: "Writing a Tailwind plugin for typographic rhythm.", category: "CSS", date: "2026 · 03 · 18", unread: false },
    { no: "05", title: "The slow web: why I archive my own posts.", category: "Essay", date: "2026 · 03 · 02", unread: false },
  ],
  featured: {
    eyebrow: "Long read · 2026 · 24 min",
    title: "一個安靜的系統，用來收整想法。",
    lede: "花了三個月把整個 Blog 的 Design System 收斂成一份 800 行的 tokens.css。過程中，我學到比 Figma 更重要的事：把「不加什麼」寫進規範。這篇記錄了在 Vue 3 + TDD 底下，如何讓一個 side project 的設計不再被自己拖垮。",
    author: "Yuan Luca",
    role: "Frontend · Taiwan",
    stat: "042",
  },
  latest: [
    { tag: "Essay · Featured", date: "2026 · 04 · 14", title: "Writing less, publishing more.", excerpt: "我不相信「日更」是什麼好事。真正有用的是：每篇文章都只解決一個問題，然後在一週內把它說清楚。", artTag: "FT · 01" },
    { tag: "Vue", date: "2026 · 04 · 08", title: "`useTheme()` 的第三次重構。", excerpt: "從 localStorage 到 system preference 再到 data-theme；這次我把 0.5s 的淡入也放進 composable 裡。", artTag: "IMG · 02" },
    { tag: "CSS", date: "2026 · 04 · 02", title: "灰階不是偷懶的藉口。", excerpt: "一個 #f4f4f4 的背景，配 #0a0a0b 的文字，就足以撐起整個站。秘訣在差異，不在顏色。", artTag: "IMG · 03" },
    { tag: "Frontend", date: "2026 · 03 · 26", title: "我為什麼離開 Pinia。", excerpt: "短答：我沒有離開，只是把它藏回 composables 的後面。", artTag: "IMG · 04" },
    { tag: "Tooling", date: "2026 · 03 · 19", title: "Vitest 4 的 happy-dom 紀實。", excerpt: "一次把 200 個測試從 jsdom 遷到 happy-dom，TDD 體感變兩倍快。", artTag: "IMG · 05" },
    { tag: "Notes", date: "2026 · 03 · 12", title: "關於 Markdown Editor 的體感決策。", excerpt: "CodeMirror 6 + markdown-it + shiki 的組合，讓預覽與編輯終於像一件事。", artTag: "IMG · 06" },
  ],
  tags: [
    { name: "design systems", n: 14, active: true },
    { name: "vue 3", n: 22 },
    { name: "composition api", n: 11 },
    { name: "tdd", n: 9 },
    { name: "tailwind", n: 18 },
    { name: "css", n: 24 },
    { name: "glassmorphism", n: 4 },
    { name: "typography", n: 7 },
    { name: "markdown", n: 6 },
    { name: "vitest", n: 5 },
    { name: "essay", n: 13 },
    { name: "slow web", n: 3 },
    { name: "side project", n: 8 },
    { name: "pinia", n: 4 },
    { name: "codemirror", n: 3 },
    { name: "shiki", n: 2 },
  ],
  // Tag pool for editor autocomplete
  tagPool: [
    { name: "design systems", articleCount: 14 },
    { name: "vue 3", articleCount: 22 },
    { name: "composition api", articleCount: 11 },
    { name: "tdd", articleCount: 9 },
    { name: "tailwind", articleCount: 18 },
    { name: "css", articleCount: 24 },
    { name: "glassmorphism", articleCount: 4 },
    { name: "typography", articleCount: 7 },
    { name: "markdown", articleCount: 6 },
    { name: "vitest", articleCount: 5 },
    { name: "essay", articleCount: 13 },
    { name: "slow web", articleCount: 3 },
    { name: "side project", articleCount: 8 },
    { name: "pinia", articleCount: 4 },
    { name: "codemirror", articleCount: 3 },
    { name: "shiki", articleCount: 2 },
    { name: "frontend", articleCount: 19 },
    { name: "vite", articleCount: 6 },
    { name: "typescript", articleCount: 15 },
    { name: "playwright", articleCount: 4 },
  ],
  categories: [
    { id: "c1", name: "Engineering", slug: "engineering" },
    { id: "c2", name: "Essay", slug: "essay" },
    { id: "c3", name: "Notes", slug: "notes" },
    { id: "c4", name: "Design", slug: "design" },
  ],
  // My Articles — mixed statuses
  myArticles: [
    { uuid: "a1", title: "一個安靜的系統，用來收整想法。", summary: "花了三個月把整個 Blog 的 Design System 收斂成一份 800 行的 tokens.css。", coverImageUrl: null, status: "PUBLISHED", tags: ["design systems", "essay", "tdd"], rejectReason: null, createdAt: "2026-03-20", updatedAt: "2026-04-14", viewCount: 2841, likeCount: 184, commentCount: 27, artTag: "ART · 01" },
    { uuid: "a2", title: "Writing less, publishing more.", summary: "不相信日更。每篇文章只解決一個問題。", coverImageUrl: null, status: "PUBLISHED", tags: ["essay", "slow web"], rejectReason: null, createdAt: "2026-04-10", updatedAt: "2026-04-14", viewCount: 1205, likeCount: 92, commentCount: 14, artTag: "ART · 02" },
    { uuid: "a3", title: "關於 Tailwind v4 的第一印象", summary: "從設定檔消失，到 @theme 指令；工程體感明顯不同。", coverImageUrl: null, status: "DRAFT", tags: ["tailwind", "css"], rejectReason: null, createdAt: "2026-04-16", updatedAt: "2026-04-17", viewCount: 0, likeCount: 0, commentCount: 0, artTag: "ART · 03" },
    { uuid: "a4", title: "Vitest 4 遷移筆記", summary: "happy-dom 取代 jsdom，測試快兩倍。", coverImageUrl: null, status: "PENDING_REVIEW", tags: ["vitest", "tdd"], rejectReason: null, createdAt: "2026-04-12", updatedAt: "2026-04-16", viewCount: 0, likeCount: 0, commentCount: 0, artTag: "ART · 04" },
    { uuid: "a5", title: "CodeMirror 6 自訂主題心法", summary: "從 @lezer/highlight 開始，少即是多。", coverImageUrl: null, status: "REJECTED", tags: ["codemirror", "frontend"], rejectReason: "內文範例截圖解析度太低，請補圖；另標題 § 02 的程式碼區塊請加上語言標註。", createdAt: "2026-04-08", updatedAt: "2026-04-11", viewCount: 0, likeCount: 0, commentCount: 0, artTag: "ART · 05" },
    { uuid: "a6", title: "我為什麼離開 Pinia。", summary: "短答：我沒有離開，只是把它藏回 composables 的後面。", coverImageUrl: null, status: "PUBLISHED", tags: ["pinia", "vue 3"], rejectReason: null, createdAt: "2026-03-20", updatedAt: "2026-03-26", viewCount: 984, likeCount: 62, commentCount: 8, artTag: "ART · 06" },
    { uuid: "a7", title: "試著用 JetBrains Mono 寫整個 Blog", summary: "一個字體的決策，會影響四十個頁面。", coverImageUrl: null, status: "ARCHIVED", tags: ["typography", "design systems"], rejectReason: null, createdAt: "2025-12-01", updatedAt: "2025-12-08", viewCount: 432, likeCount: 31, commentCount: 3, artTag: "ART · 07" },
    { uuid: "a8", title: "灰階不是偷懶的藉口。", summary: "一個 #f4f4f4 的背景，配 #0a0a0b 的文字，就足以撐起整個站。", coverImageUrl: null, status: "PUBLISHED", tags: ["css", "typography"], rejectReason: null, createdAt: "2026-03-28", updatedAt: "2026-04-02", viewCount: 1532, likeCount: 118, commentCount: 19, artTag: "ART · 08" },
  ],
  // Sample article body for detail view + preview
  // Authors pool (for Articles page filter)
  authors: [
    { handle: "yuanluca", name: "Yuan Luca", role: "Frontend · Taipei", articleCount: 42 },
    { handle: "kimura", name: "Kimura A.", role: "Design · Tokyo", articleCount: 8 },
    { handle: "norafeng", name: "Nora Feng", role: "Product · Taipei", articleCount: 5 },
    { handle: "olsen", name: "M. Olsen", role: "Backend · Copenhagen", articleCount: 3 },
  ],
  articleBody: `一個 Blog 的 Design System，不應該讓作者在發表前先被自己卡住。

這一篇想把過去三個月，我把整個 Blog 的 tokens 收斂成一份 800 行 \`tokens.css\` 的過程寫下來。結論先說：**減法遠比加法難**。

## §01. 問題的起點

最初我用 Tailwind 預設值跑了整個首頁，後台與內頁。短期看起來很方便，但：

- 每新增一個頁面，我會本能地開始微調間距、圓角、字重
- 三個月後再打開第一版 CSS，像在讀別人的文章
- 最糟的是：**同一種 shadow 出現了四個變形**

這跟品質無關。跟紀律有關。

## §02. 把「不加什麼」寫進規範

後來我做了一件事：在 tokens 的開頭寫了一段註解——

\`\`\`css
/* ============ TOKENS ============
 * 這份檔案不追求完整，追求「夠用」。
 * 新增前請先問自己：這個 token 真的無法用既有的表達嗎？
 * 能不能刪、不加、或合併，比能不能新增重要。
 * ============== */
\`\`\`

接著我把所有 shadow 砍到剩 3 個。間距只留 \`4 / 8 / 12 / 16 / 24 / 40 / 64 / 96\`。圓角只留 \`6 / 12 / 999\`。

剛砍完的那一週我寫不出新元件——因為每個既有設定都少了一點「剛剛好」。但第二週開始，寫頁面的速度變快了。我不再花 10 分鐘選 shadow，因為只有 3 個可以選。

## §03. 非對稱網格救了我

最後一件事：我放棄了 12 欄對稱網格，改用 \`5fr 7fr\` 的非對稱雙欄。首頁的 Featured 區、文章內頁的 sidebar、我的文章列表的 chip 區，都吃這一組。

這件事讓整個站看起來像一本 **editorial** 而不是 admin dashboard。

> 好的設計系統會消失。你不應該感覺到它的存在，你只會感覺到：事情順了。

---

接下來幾篇會寫 CodeMirror 主題、Shiki 高亮配色、以及我如何在 Vitest 4 下做 TDD。慢慢寫。`,

  // Full articles feed — for the Articles page catalog
  articlesFeed: [
    { uuid: "f01", title: "一個安靜的系統，用來收整想法。", summary: "花了三個月把整個 Blog 的 Design System 收斂成一份 800 行的 tokens.css。減法遠比加法難。", category: "c4", tags: ["design systems", "essay", "css"], authorHandle: "yuanluca", updatedAt: "2026-04-14", readMinutes: 9, viewCount: 2841, likeCount: 184, commentCount: 27 },
    { uuid: "f02", title: "Writing less, publishing more.", summary: "不相信日更。每篇文章只解決一個問題。一年下來比勉強日更的人多寫了兩倍。", category: "c2", tags: ["essay", "slow web"], authorHandle: "yuanluca", updatedAt: "2026-04-11", readMinutes: 5, viewCount: 1205, likeCount: 92, commentCount: 14 },
    { uuid: "f03", title: "關於 Tailwind v4 的第一印象。", summary: "設定檔消失，@theme 指令接手；Lightning CSS 的速度讓熱重載像是沒有發生。", category: "c1", tags: ["tailwind", "css", "frontend"], authorHandle: "yuanluca", updatedAt: "2026-04-08", readMinutes: 7, viewCount: 3412, likeCount: 246, commentCount: 31 },
    { uuid: "f04", title: "Vitest 4 遷移筆記。", summary: "happy-dom 取代 jsdom，測試快兩倍；但有三個 edge case 讓我回滾了一次。", category: "c1", tags: ["vitest", "tdd", "typescript"], authorHandle: "olsen", updatedAt: "2026-04-03", readMinutes: 11, viewCount: 1876, likeCount: 104, commentCount: 18 },
    { uuid: "f05", title: "CodeMirror 6 自訂主題心法。", summary: "從 @lezer/highlight 開始，少即是多。十二個 token 顏色，做出的主題比二十四個還耐看。", category: "c4", tags: ["codemirror", "frontend", "typography"], authorHandle: "kimura", updatedAt: "2026-03-29", readMinutes: 13, viewCount: 942, likeCount: 71, commentCount: 9 },
    { uuid: "f06", title: "我為什麼離開 Pinia。", summary: "短答：我沒有離開，只是把它藏回 composables 的後面。長答比較有趣。", category: "c1", tags: ["pinia", "vue 3", "frontend"], authorHandle: "yuanluca", updatedAt: "2026-03-26", readMinutes: 8, viewCount: 2108, likeCount: 156, commentCount: 22 },
    { uuid: "f07", title: "試著用 JetBrains Mono 寫整個 Blog。", summary: "一個字體的決策，會影響四十個頁面。也會讓你重新思考什麼叫做「閱讀」。", category: "c4", tags: ["typography", "design systems"], authorHandle: "kimura", updatedAt: "2026-03-20", readMinutes: 6, viewCount: 432, likeCount: 31, commentCount: 3 },
    { uuid: "f08", title: "灰階不是偷懶的藉口。", summary: "一個 #f4f4f4 的背景，配 #0a0a0b 的文字，就足以撐起整個站。限制是一種風格。", category: "c4", tags: ["css", "typography", "design systems"], authorHandle: "yuanluca", updatedAt: "2026-03-17", readMinutes: 4, viewCount: 1532, likeCount: 118, commentCount: 19 },
    { uuid: "f09", title: "Playwright 取代 Cypress 的那一天。", summary: "不是 Cypress 不好，是 Playwright 的 Trace Viewer 把我寵壞了。", category: "c1", tags: ["playwright", "tdd", "frontend"], authorHandle: "olsen", updatedAt: "2026-03-12", readMinutes: 10, viewCount: 1689, likeCount: 127, commentCount: 15 },
    { uuid: "f10", title: "在 Figma 裡寫 MDX。", summary: "把設計文件從「附件」變成「內容」的一個小實驗。失敗了，但學到很多。", category: "c4", tags: ["figma", "design systems", "essay"], authorHandle: "norafeng", updatedAt: "2026-03-06", readMinutes: 7, viewCount: 821, likeCount: 54, commentCount: 11 },
    { uuid: "f11", title: "為什麼我關掉了所有通知。", summary: "包括 GitHub 的。尤其是 GitHub 的。三個月後的心智耗能曲線。", category: "c2", tags: ["essay", "slow web"], authorHandle: "norafeng", updatedAt: "2026-02-28", readMinutes: 5, viewCount: 2945, likeCount: 289, commentCount: 42 },
    { uuid: "f12", title: "Vite 5 → 6：我改了什麼沒改什麼。", summary: "upgrade guide 之外的真實經驗。三個專案，兩個順利，一個出了意外。", category: "c1", tags: ["vite", "frontend", "typescript"], authorHandle: "yuanluca", updatedAt: "2026-02-22", readMinutes: 9, viewCount: 1423, likeCount: 98, commentCount: 12 },
    { uuid: "f13", title: "Shiki 跟我的 IDE 終於長得一樣。", summary: "把 VS Code 的 theme 搬到網頁上，差點讓我變成 JSON 工程師。", category: "c4", tags: ["shiki", "css", "typography"], authorHandle: "kimura", updatedAt: "2026-02-15", readMinutes: 6, viewCount: 756, likeCount: 48, commentCount: 7 },
    { uuid: "f14", title: "TDD 是一種寫作練習。", summary: "紅、綠、重構，其實跟寫作的初稿、修稿、潤稿是同一件事。", category: "c2", tags: ["tdd", "essay"], authorHandle: "olsen", updatedAt: "2026-02-08", readMinutes: 8, viewCount: 1102, likeCount: 87, commentCount: 16 },
    { uuid: "f15", title: "Notes — 關於「完成」的定義。", summary: "部落格文章、產品、設計系統，各自的「完成」都不一樣。", category: "c3", tags: ["essay", "slow web"], authorHandle: "yuanluca", updatedAt: "2026-02-01", readMinutes: 3, viewCount: 689, likeCount: 52, commentCount: 6 },
    { uuid: "f16", title: "為 Blog 做一份 2025 總結。", summary: "42 篇發文、6 個草稿、3 次大改版。一張表看完一整年。", category: "c2", tags: ["essay"], authorHandle: "yuanluca", updatedAt: "2026-01-12", readMinutes: 12, viewCount: 4215, likeCount: 312, commentCount: 58 },
    { uuid: "f17", title: "TypeScript 5.8 的 const type parameters，改變了什麼？", summary: "把一個 200 行的 utility library 重寫成 80 行的過程。型別是會呼吸的。", category: "c1", tags: ["typescript", "frontend"], authorHandle: "olsen", updatedAt: "2026-01-05", readMinutes: 10, viewCount: 1887, likeCount: 142, commentCount: 20 },
    { uuid: "f18", title: "一個 designer 的 git 習慣。", summary: "commit message 我寫很長。不是為了別人，是為了三個月後的自己。", category: "c4", tags: ["essay", "design systems"], authorHandle: "norafeng", updatedAt: "2025-12-28", readMinutes: 4, viewCount: 943, likeCount: 72, commentCount: 9 },
    { uuid: "f19", title: "從零開始做一個部落格系統（上）。", summary: "為什麼決定自己做、不用 Ghost / Hashnode / Medium。需求清單、技術選擇。", category: "c1", tags: ["vue 3", "frontend", "essay"], authorHandle: "yuanluca", updatedAt: "2025-12-20", readMinutes: 14, viewCount: 2678, likeCount: 198, commentCount: 29 },
    { uuid: "f20", title: "從零開始做一個部落格系統（下）。", summary: "資料模型、編輯器、發布流程、以及那些沒做的功能。", category: "c1", tags: ["vue 3", "frontend", "essay"], authorHandle: "yuanluca", updatedAt: "2025-12-14", readMinutes: 16, viewCount: 2341, likeCount: 176, commentCount: 24 },
    { uuid: "f21", title: "Notes — 讀 Edward Tufte。", summary: "資料視覺化的三個原則，放在部落格排版也成立。", category: "c3", tags: ["typography", "essay"], authorHandle: "kimura", updatedAt: "2025-12-02", readMinutes: 5, viewCount: 587, likeCount: 41, commentCount: 4 },
    { uuid: "f22", title: "我重新定義「首頁」。", summary: "從 feed 變成 index，從動態變成靜態。讀者多待了四倍的時間。", category: "c4", tags: ["design systems", "essay"], authorHandle: "norafeng", updatedAt: "2025-11-22", readMinutes: 7, viewCount: 1456, likeCount: 108, commentCount: 17 },
    { uuid: "f23", title: "CSS cascade layers 真的改變了我的寫法。", summary: "@layer reset, base, components, utilities — 一個簡單的秩序，解決了五年的焦慮。", category: "c1", tags: ["css", "frontend"], authorHandle: "yuanluca", updatedAt: "2025-11-10", readMinutes: 8, viewCount: 2087, likeCount: 163, commentCount: 21 },
    { uuid: "f24", title: "一年了，那個「全站黑白」的決定。", summary: "從 12 個 accent color，砍到只剩一個萊姆。回頭看，是對的。", category: "c4", tags: ["design systems", "essay"], authorHandle: "yuanluca", updatedAt: "2025-10-30", readMinutes: 6, viewCount: 1823, likeCount: 137, commentCount: 19 },
  ],
};
