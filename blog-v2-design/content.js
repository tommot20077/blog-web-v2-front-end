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

  // Comments mock data
  comments: [
    {
      id: "c1", author: "Kimura A.", handle: "kimura", time: "2026-04-15 · 14:32",
      body: "tokens.css 的那段「不加什麼」讓我想到 Dieter Rams 的十個原則。設計語言最難的地方不是選什麼，而是為什麼不選某些東西。這篇說清楚了。",
      likes: 18, liked: false,
      replies: [
        { id: "c1r1", author: "Yuan Luca", handle: "yuanluca", time: "2026-04-15 · 15:08",
          body: "對，Rams 的 Less, but better 是我整理這份 tokens 的起點。設計決策最重要的文件往往是「不做清單」。謝謝你的共鳴。", likes: 7, liked: false },
        { id: "c1r2", author: "Nora Feng", handle: "norafeng", time: "2026-04-16 · 09:14",
          body: "同感。我也試著在 Figma 裡維護一份「不用的元件」資料夾，定期回顧。某種意義上是在練習放棄的勇氣。", likes: 5, liked: false },
        { id: "c1r3", author: "M. Olsen", handle: "olsen", time: "2026-04-16 · 11:20",
          body: "這個做法可以形式化嗎？比如用 ADR（Architecture Decision Records）記錄「不做」的決定？", likes: 3, liked: false },
      ]
    },
    {
      id: "c2", author: "M. Olsen", handle: "olsen", time: "2026-04-16 · 10:45",
      body: "§03 的非對稱網格那段讓我重新看了一遍自己的 CSS。我現在 12 欄裡至少有六種不同的「7 欄」寫法，每一個都是當下最合理的選擇。讀完這篇我要去統一它了。",
      likes: 11, liked: false,
      replies: [
        { id: "c2r1", author: "Yuan Luca", handle: "yuanluca", time: "2026-04-16 · 12:30",
          body: "六種！哈哈。我也有過同樣的問題，最後的解法就是先寫測試（對，Grid 也能有測試），確定行為再統一語義。", likes: 4, liked: false },
      ]
    },
    {
      id: "c3", author: "Nora Feng", handle: "norafeng", time: "2026-04-17 · 08:20",
      body: "「三個月後再打開第一版 CSS，像在讀別人的文章」— 這句話讓我有點心虛。我有一個六個月前的 Figma 檔，上面有我當時非常確定的 shadow token，現在完全看不懂自己在想什麼。",
      likes: 24, liked: true,
      replies: []
    },
    {
      id: "c4", author: "Alex Chen", handle: "alexchen", time: "2026-04-18 · 16:05",
      body: "這篇讓我下定決心把公司的 design system 從 Tailwind 的 arbitrary values 搬回 token。上一次嘗試中途放棄，這次有這篇當參考應該會更清楚切入點。",
      likes: 8, liked: false,
      replies: []
    },
    {
      id: "c5", author: "Lena Wu", handle: "lenawu", time: "2026-04-19 · 22:11",
      body: "請問 tokens.css 的 800 行有考慮開源嗎？想看看實際的結構長什麼樣子。",
      likes: 15, liked: false,
      replies: [
        { id: "c5r1", author: "Yuan Luca", handle: "yuanluca", time: "2026-04-20 · 09:00",
          body: "在考慮中！打算整理成更通用的版本再發出來。先訂閱 newsletter 我會在那裡第一時間公告。", likes: 9, liked: false },
      ]
    },
  ],
  articlesFeed: [
    // ── Yuan Luca ──
    { uuid: "f01", title: "一個安靜的系統，用來收整想法。", summary: "花了三個月把整個 Blog 的 Design System 收斂成一份 800 行的 tokens.css。減法遠比加法難，但值得。", category: "c4", tags: ["design systems", "essay", "css"], authorHandle: "yuanluca", updatedAt: "2026-04-14", readMinutes: 9, viewCount: 2841, likeCount: 184, commentCount: 27 },
    { uuid: "f02", title: "Writing less, publishing more.", summary: "不相信日更。每篇文章只解決一個問題，然後在一週內把它說清楚。一年下來反而比強迫日更的人多寫了兩倍有用的東西。", category: "c2", tags: ["essay", "slow web"], authorHandle: "yuanluca", updatedAt: "2026-04-11", readMinutes: 5, viewCount: 1205, likeCount: 92, commentCount: 14 },
    { uuid: "f03", title: "關於 Tailwind v4 的第一印象。", summary: "設定檔消失，@theme 指令接手；Lightning CSS 的速度讓熱重載像是沒有發生。這是我用了三天之後的誠實感想。", category: "c1", tags: ["tailwind", "css", "frontend"], authorHandle: "yuanluca", updatedAt: "2026-04-08", readMinutes: 7, viewCount: 3412, likeCount: 246, commentCount: 31 },
    { uuid: "f06", title: "我為什麼離開 Pinia。", summary: "短答：我沒有離開，只是把它藏回 composables 的後面。長答比較有趣，涉及到一個關於「誰應該知道狀態存在」的設計問題。", category: "c1", tags: ["pinia", "vue 3", "frontend"], authorHandle: "yuanluca", updatedAt: "2026-03-26", readMinutes: 8, viewCount: 2108, likeCount: 156, commentCount: 22 },
    { uuid: "f08", title: "灰階不是偷懶的藉口。", summary: "一個 #f4f4f4 的背景，配 #0a0a0b 的文字，就足以撐起整個站。限制是一種風格，不是妥協。", category: "c4", tags: ["css", "typography", "design systems"], authorHandle: "yuanluca", updatedAt: "2026-03-17", readMinutes: 4, viewCount: 1532, likeCount: 118, commentCount: 19 },
    { uuid: "f12", title: "Vite 5 to 6：我改了什麼沒改什麼。", summary: "upgrade guide 之外的真實遷移經驗。三個專案，兩個順利，一個出了意外，一個讓我對 plugin API 重新有了敬意。", category: "c1", tags: ["vite", "frontend", "typescript"], authorHandle: "yuanluca", updatedAt: "2026-02-22", readMinutes: 9, viewCount: 1423, likeCount: 98, commentCount: 12 },
    { uuid: "f15", title: "Notes — 關於「完成」的定義。", summary: "部落格文章、產品、設計系統，各自的「完成」都不一樣。我最近把「完成」拆成三個問題，反而更容易放手。", category: "c3", tags: ["essay", "slow web"], authorHandle: "yuanluca", updatedAt: "2026-02-01", readMinutes: 3, viewCount: 689, likeCount: 52, commentCount: 6 },
    { uuid: "f16", title: "為 Blog 做一份 2025 總結。", summary: "42 篇發文、6 個草稿、3 次大改版、一次全站重寫。一張表看完一整年。最讓我意外的數字是留言數。", category: "c2", tags: ["essay"], authorHandle: "yuanluca", updatedAt: "2026-01-12", readMinutes: 12, viewCount: 4215, likeCount: 312, commentCount: 58 },
    { uuid: "f19", title: "從零開始做一個部落格系統（上）。", summary: "為什麼決定自己做、不用 Ghost / Hashnode / Medium。需求清單、技術選擇、以及我在第一週就後悔的那個決定。", category: "c1", tags: ["vue 3", "frontend", "essay"], authorHandle: "yuanluca", updatedAt: "2025-12-20", readMinutes: 14, viewCount: 2678, likeCount: 198, commentCount: 29 },
    { uuid: "f20", title: "從零開始做一個部落格系統（下）。", summary: "資料模型、編輯器選型、發布流程、以及那些我刻意沒做的功能。有時候空白才是設計。", category: "c1", tags: ["vue 3", "frontend", "essay"], authorHandle: "yuanluca", updatedAt: "2025-12-14", readMinutes: 16, viewCount: 2341, likeCount: 176, commentCount: 24 },
    { uuid: "f23", title: "CSS cascade layers 真的改變了我的寫法。", summary: "@layer reset, base, components, utilities — 一個簡單的秩序，解決了五年的焦慮。Tailwind 在這個體系裡的位置也終於說清楚了。", category: "c1", tags: ["css", "frontend"], authorHandle: "yuanluca", updatedAt: "2025-11-10", readMinutes: 8, viewCount: 2087, likeCount: 163, commentCount: 21 },
    { uuid: "f24", title: "一年了，那個「全站黑白」的決定。", summary: "從 12 個 accent color，砍到只剩一個冷藍。回頭看，是對的。有時候少選一個顏色，反而逼你在排版上更用心。", category: "c4", tags: ["design systems", "essay"], authorHandle: "yuanluca", updatedAt: "2025-10-30", readMinutes: 6, viewCount: 1823, likeCount: 137, commentCount: 19 },
    // ── Kimura A. ──
    { uuid: "f05", title: "CodeMirror 6 自訂主題心法。", summary: "從 @lezer/highlight 開始，少即是多。十二個 token 顏色做出的主題，比二十四個還耐看。關鍵在於你決定不上色什麼。", category: "c4", tags: ["codemirror", "frontend", "typography"], authorHandle: "kimura", updatedAt: "2026-03-29", readMinutes: 13, viewCount: 942, likeCount: 71, commentCount: 9 },
    { uuid: "f07", title: "試著用 JetBrains Mono 寫整個 Blog。", summary: "一個字體的決策，會影響四十個頁面。也會讓你重新思考什麼叫做「閱讀」。後來我換了，但不後悔那個月的實驗。", category: "c4", tags: ["typography", "design systems"], authorHandle: "kimura", updatedAt: "2026-03-20", readMinutes: 6, viewCount: 432, likeCount: 31, commentCount: 3 },
    { uuid: "f13", title: "Shiki 跟我的 IDE 終於長得一樣。", summary: "把 VS Code 的 One Dark Pro 搬到網頁上，差點讓我變成 JSON 工程師。最後用 theme studio 省了很多時間。", category: "c4", tags: ["shiki", "css", "typography"], authorHandle: "kimura", updatedAt: "2026-02-15", readMinutes: 6, viewCount: 756, likeCount: 48, commentCount: 7 },
    { uuid: "f21", title: "Notes — 讀 Edward Tufte。", summary: "資料視覺化的三個原則，放在部落格排版也完全成立。Data-ink ratio 在 CSS 的世界叫做 specificity-ink ratio。", category: "c3", tags: ["typography", "essay"], authorHandle: "kimura", updatedAt: "2025-12-02", readMinutes: 5, viewCount: 587, likeCount: 41, commentCount: 4 },
    { uuid: "fk01", title: "Motion design 在 UI 裡不是裝飾。", summary: "動畫的意義不是讓東西動起來，而是讓使用者知道「現在發生了什麼」。三個讓動畫有意義的原則。", category: "c4", tags: ["design systems", "essay"], authorHandle: "kimura", updatedAt: "2026-01-20", readMinutes: 7, viewCount: 1104, likeCount: 88, commentCount: 12 },
    { uuid: "fk02", title: "Type scale 的選擇比你想的重要。", summary: "用 Major Third 還是 Perfect Fourth？這個問題在你的設計裡每天都在問你，只是你沒聽到。", category: "c4", tags: ["typography", "design systems"], authorHandle: "kimura", updatedAt: "2025-11-28", readMinutes: 8, viewCount: 879, likeCount: 62, commentCount: 8 },
    // ── Nora Feng ──
    { uuid: "f10", title: "在 Figma 裡寫 MDX。", summary: "把設計文件從「附件」變成「內容」的一個小實驗。失敗了，但學到了很多關於設計交付流程的事。", category: "c4", tags: ["figma", "design systems", "essay"], authorHandle: "norafeng", updatedAt: "2026-03-06", readMinutes: 7, viewCount: 821, likeCount: 54, commentCount: 11 },
    { uuid: "f11", title: "為什麼我關掉了所有通知。", summary: "包括 GitHub 的。尤其是 GitHub 的。三個月後的心智耗能曲線讓我相信：非同步才是預設值。", category: "c2", tags: ["essay", "slow web"], authorHandle: "norafeng", updatedAt: "2026-02-28", readMinutes: 5, viewCount: 2945, likeCount: 289, commentCount: 42 },
    { uuid: "f18", title: "一個 designer 的 git 習慣。", summary: "commit message 我寫很長。不是為了別人，是為了三個月後的自己。feat 和 fix 之外，我還有一個 think。", category: "c4", tags: ["essay", "design systems"], authorHandle: "norafeng", updatedAt: "2025-12-28", readMinutes: 4, viewCount: 943, likeCount: 72, commentCount: 9 },
    { uuid: "f22", title: "我重新定義「首頁」。", summary: "從 feed 變成 index，從動態變成靜態。讀者平均停留時間多了四倍。這讓我開始懷疑「最新」是不是錯的預設。", category: "c4", tags: ["design systems", "essay"], authorHandle: "norafeng", updatedAt: "2025-11-22", readMinutes: 7, viewCount: 1456, likeCount: 108, commentCount: 17 },
    { uuid: "fn01", title: "Product 思維跟 Design 思維為什麼吵架。", summary: "在同一間公司待了兩年，我終於知道為什麼 PM 和 Designer 永遠在爭論「使用者到底要什麼」。", category: "c2", tags: ["essay"], authorHandle: "norafeng", updatedAt: "2026-01-08", readMinutes: 9, viewCount: 1678, likeCount: 124, commentCount: 23 },
    // ── M. Olsen ──
    { uuid: "f04", title: "Vitest 4 遷移筆記。", summary: "happy-dom 取代 jsdom，測試快兩倍；但有三個 edge case 讓我回滾了一次，最後在 CI 上才發現真正的問題。", category: "c1", tags: ["vitest", "tdd", "typescript"], authorHandle: "olsen", updatedAt: "2026-04-03", readMinutes: 11, viewCount: 1876, likeCount: 104, commentCount: 18 },
    { uuid: "f09", title: "Playwright 取代 Cypress 的那一天。", summary: "不是 Cypress 不好，是 Playwright 的 Trace Viewer 把我寵壞了。現在回不去了。", category: "c1", tags: ["playwright", "tdd", "frontend"], authorHandle: "olsen", updatedAt: "2026-03-12", readMinutes: 10, viewCount: 1689, likeCount: 127, commentCount: 15 },
    { uuid: "f14", title: "TDD 是一種寫作練習。", summary: "紅、綠、重構，其實跟寫作的初稿、修稿、潤稿是同一件事。我在準備技術分享的時候才突然想通。", category: "c2", tags: ["tdd", "essay"], authorHandle: "olsen", updatedAt: "2026-02-08", readMinutes: 8, viewCount: 1102, likeCount: 87, commentCount: 16 },
    { uuid: "f17", title: "TypeScript 5.8 的 const type parameters，改變了什麼？", summary: "把一個 200 行的 utility library 重寫成 80 行的過程。型別推導在這個版本終於開始像是在幫你，而不是在考你。", category: "c1", tags: ["typescript", "frontend"], authorHandle: "olsen", updatedAt: "2026-01-05", readMinutes: 10, viewCount: 1887, likeCount: 142, commentCount: 20 },
    { uuid: "fo01", title: "Event sourcing 在小 side project 有意義嗎？", summary: "我在一個個人部落格後端裡試著用 event sourcing。結論是：有趣，但你需要很清楚自己為什麼要這樣做。", category: "c1", tags: ["frontend", "essay"], authorHandle: "olsen", updatedAt: "2025-12-10", readMinutes: 12, viewCount: 934, likeCount: 71, commentCount: 11 },
  ],
};
