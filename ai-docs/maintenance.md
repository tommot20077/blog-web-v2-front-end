# 制度維護協議(Maintenance)

> 讀者:在此 repo 工作的任何 AI session + Yuan。定義:學習怎麼流動、契約怎麼同步、誰能改哪些檔、常載層怎麼保持薄。

## 1. 學習晉升飛輪(唯一的一條學習管道,不新建第二套)

```
臨時觀察/踩雷
  → 修完 bug 後跑 /post-bug → ai-docs/bug-reports/(結構化 post-mortem)
    → 預防措施「當場分流」:
        文件類(改規範就能防)→ 立即晉升進對應 ai-docs 檔,狀態標 DONE(日期+目標檔)
        程式類(要寫測試/lint 規則)→ 開待辦項,狀態標 TODO
  → 每累積 3 份報告、或出現 HIGH bug 後、或上線前 → 跑 /review-bugs 做模式分析
    → 重複出現的坑 → 晉升為規範條文;判斷類教訓 → ai-docs/judgment.md(一正例一反例)
```

**鐵律:預防措施不准以 TODO 狀態沉睡**——每次 `/review-bugs` 必須盤點殘留 TODO:晉升、排程、或明寫「擱置+理由」。
(教訓來源:後端 repo BUG-2026-001 的措施懸置三個多月;本 repo 目前 0 份報告,飛輪還沒開始轉——修完任何 bug 記得跑 `/post-bug`。)

## 2. API 契約同步(前端特有,與後端 repo 的臍帶)

契約真相鏈:後端 OpenAPI → `api-reference/openapi.json`(快照)→ `ai-docs/api-contract.md`(慣例摘要)。

- 後端契約變更合併後:重新抓 `openapi.json` 快照 → 比對受影響的 `src/api/*Service.ts` 與 `src/types/` → 更新 `api-contract.md` 受影響段落。
- 前端需要後端沒有的行為:寫需求文件(照 `ai-docs/backend-request-editor-api.md` 模式)+ 功能掛 `pending.md`,不瞎 mock 上線。
- `diff.md` 是**一次性快照產物**(2026-05-14,基於已不存在的 Linux 路徑),過期即棄;要新的對比就重新生成,不要沿用舊檔內容。

## 3. 文件地圖(root 散檔的狀態,弱模型導航用)

| 檔案 | 狀態 | 規則 |
|------|------|------|
| `ai-docs/*` | ✅ 現行規範 | 唯一的規範正典位置 |
| `todo.md` | 🗄️ 歷史(2026-04-02 後未更新) | 功能清單+決策記錄,僅供考古;現況以程式碼與 pending.md 為準 |
| `pending.md` | ✅ 現行 | 掛起功能登記簿,mock 頂替後端 API 時必須登記 |
| `diff.md` | 🗄️ 過期快照(2026-05-14) | 見 §2,不要引用其內容做決策 |
| `runbook-integration.md` | ✅ 現行 | 本機整合環境(前端+真後端)啟動手冊 |
| `blog-v2-design/`、`blog-v2-1-design/`、`old-src/` | 🗄️ 歷史原型 | 掃描一律排除 |

新增 root `*.md` 前先想:它屬於 ai-docs 哪一類?若是新的一次性產物,放進上表並標狀態,否則 root 散檔是文件腐化的起點。

## 4. 檔案所有權表(動檔前先查這張表)

| 檔案 | AI 可自行改? | 規則 |
|------|-------------|------|
| `ai-docs/bug-reports/*`、`pending.md` | ✅ | 照流程產生/更新 |
| `api-reference/openapi.json` | ✅ 快照更新 | 只能整份重抓,不手改內容 |
| `ai-docs/judgment.md`、`task-briefs.md`、`agent-dispatch.md`、本檔 | ⚠️ 提案制 | 可草擬修改,合併前給 Yuan 過目 |
| `ai-docs/code-standards.md`、`testing-standards.md`、`architecture.md`、`api-contract.md`、`git-convention.md` | ⚠️ 提案制 | 收緊規則可提案;放寬規則必問 |
| `ai-docs/design-system.md` | ❌ 先問 | 視覺決策屬 Yuan |
| `CLAUDE.md` | ❌ 先問 | 常載層,改一行影響所有 session |
| `.claude/skills/*` | ❌ 先問 | 程序變更影響所有工作流 |
| `todo.md`、`diff.md` | ❌ 不再更新 | 歷史檔,只讀 |

## 5. 常載路由層規則

- **CLAUDE.md 上限 150 行**,只放:身分/溝通原則、鐵律級短規則、索引(markdown 連結=按需,不用 `@` import——`@` 是開場全載)。
- 新的長內容一律寫 `ai-docs/` 新檔,CLAUDE.md 只加一行索引。
- 本 repo 沒有 AGENTS.md/GEMINI.md;若未來要加,直接建純指標檔指向 CLAUDE.md(參考後端 repo 作法),**不要**複製內容。

## 6. 何時做成 skill(判準)

- 事實/規則 → 寫進 `ai-docs/` 文件
- 多步驟程序 + 弱模型會錯 + 沒有現成指令 → 才做 `.claude/skills/`
- 已有現成指令(`/post-bug`、`/review-bugs`、`/git-action`)→ 別包一層重造

## 7. 制度健康檢查(每次 /review-bugs 順手做,5 分鐘)

1. CLAUDE.md 仍 ≤150 行、索引連結都指向存在的檔
2. §3 文件地圖與 root 實況一致(有新散檔就登記)
3. `openapi.json` 快照日期 vs 後端最近契約變更(過期就重抓)
4. bug-reports 各報告無沉睡 TODO 措施
