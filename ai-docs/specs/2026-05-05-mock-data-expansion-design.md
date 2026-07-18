# Mock Data 擴充設計（Phase 1 / 2 / 3）

- **日期**：2026-05-05
- **作者**：Yuan + Claude
- **狀態**：Design approved，等待 Phase 1 implementation plan

---

## 背景

當前 `src/api/mock/data.ts` 共 52 篇 mock article，問題：

- 50 篇是「Vue 3 Reactivity 篇章 N」「Microservices API Gateway 實踐 N」交替，summary 全部一樣
- `publishedAt` 全集中在 `2026-03-XX`，看不出 archive 的縱深
- tag 動態算出只有約 8 個 unique
- 作者只有 5 人（Yuan / 小明 / TechLead / 旅行者 / DevGuru）
- mockArticleContent 整篇 markdown 共用，所有文章內頁長一樣

「先從首頁開始」擴充，但既然首頁讀的是 `allMockArticles`，此次擴充會連動 Trending / Latest / HotTags / Archive / TagsIndex / TagDetail / Search 等所有 list 場景；後續 Phase 也包含 ArticleDetail 的 markdown body。

---

## 決策摘要

| 議題 | 決策 |
|---|---|
| 量 | 由 52 → **105 篇**（含 Life 類仍保留） |
| 風格 | 真實感 — 標題/summary/tag/作者/日期全個性化 |
| 作者 | **Yuan 70% + 3 客座 30%**（Han 後端 / Mira 設計 / Chen 生活） |
| 時間 | **2023-04 ~ 2026-04**，真實節奏（初期密集→中期穩定→近期稀疏） |
| Body | **每篇 markdown 個性化**（Phase 3 處理） |
| Scope | **分 3 個 Phase / 3 個 PR**，本 spec 為三 Phase 統一規劃，Phase 1 為當前實作目標 |

---

## 作者陣容

### Yuan · Luca（主筆，74 篇 ≈ 70.5%）
- **Tagline**：台北的前端工程師，偶爾設計，長期思考怎麼把複雜的事寫得更直白
- **主題**：Vue 3 / TypeScript / CSS / 設計系統 / 寫作思考 / 開發流程
- **風格**：個人化、有觀點、不裝專業
- **EST**：2023-04（建站第一篇）

### Han · 劉漢威（後端 / 系統架構，14 篇 ≈ 13.3%）
- **Tagline**：寫了 10 年 Java，最近開始投奔 Go
- **主題**：Spring Boot / PostgreSQL / Redis / 微服務 / 效能調校
- **與 Yuan 關係**：前同事，10 年朋友
- **首次出現**：2023-Q3
- **風格**：硬核技術文，案例多

### Mira · 黃米拉（Design / UI/UX，10 篇 ≈ 9.5%）
- **Tagline**：Visual designer turned design engineer
- **主題**：Design Token / Typography / Color / Motion / UI 系統
- **與 Yuan 關係**：design system 專案合作認識
- **首次出現**：2024 年初
- **風格**：偏感性、注重視覺細節

### Chen · 陳則凱（書評 / 生活思考，7 篇 ≈ 6.7%）
- **Tagline**：工程師的另一面是讀書與寫信
- **主題**：書評 / 生產力 / 職涯 / 遠端工作 / 技術人讀書筆記
- **與 Yuan 關係**：大學同學
- **首次出現**：2024 年中
- **風格**：散文式、引用書本

---

## Tag 集合（24 個，分 5 組）

| 分類 | Tags | 代表作者 |
|---|---|---|
| **Frontend** (7) | Vue 3 · React · TypeScript · CSS · Animation · Tailwind · Vite | Yuan |
| **Backend** (6) | Spring · PostgreSQL · Redis · Microservices · Performance · Go | Han |
| **Design** (4) | Design System · Typography · Color · Motion | Mira + Yuan |
| **Practice** (3) | Testing · TDD · CI/CD | Yuan + Han |
| **Life** (4) | Books · Productivity · Remote Work · Career | Chen + Yuan |

**規則：**
- 每篇文章帶 1~3 個 tag
- 每個 tag 至少出現 3+ 次（避免「孤兒 tag」）
- 跨分類組合允許：例如「TDD + Vue 3」「Design System + CSS」

---

## 時間分布（EST 2023-04 → 2026-05，38 個月）

| 期間 | 月數 | 篇數 | 月均 | 風格描述 |
|---|---|---|---|---|
| 2023-04 ~ 2023-12 | 9 | **50** | ~5.6 | 剛建站熱情爆發期，週更甚至雙更 |
| 2024-01 ~ 2024-12 | 12 | **30** | ~2.5 | 進入穩定期，半月一篇 |
| 2025-01 ~ 2025-12 | 12 | **18** | ~1.5 | 工作忙了，月更為主 |
| 2026-01 ~ 2026-05 | 5 | **7** | ~1.4 | 近期狀態，最新一篇大約 2026-04 末（避免 publishedAt ≥ today 2026-05-05） |
| **總計** | 38 | **105** | ~2.8 | |

**日期分配規則：**
- 同月內日期分散，避免擠在月初/月末
- 不出現 `> 2026-04-30` 的未來日期（今天 2026-05-05）
- 客座作者出現節奏：Han 2023-Q3 起、Mira 2024-Q1 起、Chen 2024-Q3 起

---

## 主題分類矩陣（誰寫什麼，多少篇）

|  | Yuan | Han | Mira | Chen | 小計 |
|---|---|---|---|---|---|
| **Frontend** | 35 | 0 | 5 ¹ | 0 | **40** |
| **Backend** | 5 ² | 12 | 0 | 0 | **17** |
| **Design** | 8 | 0 | 5 | 0 | **13** |
| **Practice** | 12 | 2 | 0 | 0 | **14** |
| **Life** | 14 | 0 | 0 | 7 | **21** |
| **小計** | **74** | **14** | **10** | **7** | **105** |

**註：**
1. Mira 的 Frontend 文章偏「以 design 視角談 CSS / Animation」（如「圖層思維設計按鈕的 hover state」）
2. Yuan 的 Backend 文章偏「前端視角看後端」（如「我為什麼想搞懂自己 API 的 N+1 問題」）

**主題占比：** Frontend 38% · Backend 16% · Design 12% · Practice 13% · Life 20%

---

## 分階段執行計畫

### Phase 1（本 PR） — 設計骨架 + 30 篇示範
- 在 `data.ts` 加入 4 位作者的 metadata 結構（如 `MOCK_AUTHOR_PROFILES`）
- 建立 24 個 tag 的常數集合（如 `MOCK_TAG_REGISTRY`）
- 重寫文章生成邏輯：依時間分布表 × 主題分類矩陣 × 作者規則生成
- **先寫 30 篇示範**，涵蓋每個（時期 × 作者 × 主題）的代表組合
  - 早期（2023）：~12 篇（Yuan 9 + Han 3）
  - 穩定期（2024）：~10 篇（涵蓋 Mira/Chen 首篇）
  - 近期（2025-2026）：~8 篇
- 既有 `lifeMockArticles`（2 篇）併入新體系（重新分配作者/日期/tag）
- 既有 `getMockArticleDetail` / `mockArticleContent` 不動，body 仍共用範本
- **更新 mock data 相關測試**：`data.test.ts` / `articleMockService.test.ts` / `recommendMockService.test.ts` / `tagMockService.test.ts` / `categoryMockService.test.ts` / `searchMockService.ts` 等
- **更新 e2e**：可能影響 `home.spec.ts` / `articles-list.spec.ts` / `archive` / `tags-index` 預期數量、tag 名稱等

### Phase 2 — 補滿到 105 篇 list 資料
- 接 Phase 1 的生成邏輯，補上剩餘 75 篇
- 仍不動 markdown body
- 確保 archive 看起來「3 年厚度」、tag cloud 24 個都填好

### Phase 3 — 每篇 markdown body 個性化
- 拆分 `mockArticleContent`：依主題類別準備不同 markdown 範本，再依文章 metadata（標題、tag、作者）填充細節
- 可能再分批（按主題或按作者）多個 PR
- ArticleDetail 頁進去後每篇都有獨立內文

---

## Phase 1 實作要點（writing-plans 階段細化）

> 以下為 Phase 1 的範圍提示，正式 task list 由 writing-plans skill 產出。

1. **資料結構**
   - `MOCK_AUTHOR_PROFILES`: `Record<AuthorKey, { nickname, tagline, avatarSeed }>`
   - `MOCK_TAG_REGISTRY`: `Record<TagKey, { name, category }>`
   - 文章生成函數：`generateMockArticle({ index, period, author, topic, ... })`

2. **生成策略**
   - Phase 1 先用「手寫 30 篇 + 顯式列表」方式，避免一開始就建生成器導致設計 over-engineered
   - Phase 2 補篇時若仍手寫得動，繼續手寫；若覺得繁瑣再轉生成器
   - **不引入 LLM/random 生成** — 違反 mock data 的可預期性原則

3. **TDD**
   - 先補 `data.test.ts` 的斷言：總數、作者占比、時間分布、tag 出現次數
   - 改寫 `allMockArticles` 後測試自動 fail
   - 逐步補 30 篇通過測試
   - 既有 service test 跟 e2e 預期值同步調整

4. **既有測試處理**
   - 任何 hard-code「50 篇」「2026-03-XX」「articleNickname === 'Yuan'」的測試斷言都要更新
   - 預期至少 5~10 個既有 test 需要調整

---

## 風險與已知問題

- **既有測試大量調整**：mock data 是 e2e 與 unit 測試的共用 fixture，更動會影響廣。Phase 1 預估 ~10 個測試檔需要 review，工作量可能大於文章本身
- **Phase 3 的工作量**：每篇 500~2000 字 markdown × 105 篇 = 50000~200000 字。即使分批，也是長期工作
- **Tag 名稱穩定性**：tag slug（如 `vue-3` / `design-system`）一旦固定，後續 PR 要避免改名（會破壞 TagView routing 與 tag detail mock）

---

## 不在範圍內

- ArticleDetail 頁的 markdown body 重寫（Phase 3）
- 評論 / 點贊數的真實感調整（沿用既有 random）
- 圖片資源更換（仍用 picsum.photos seed）
- 真實 backend 整合（純 mock 層擴充）
- 多語系內容（仍只有繁中）
