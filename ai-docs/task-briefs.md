# 任務交辦範本(Task Briefs)

> 讀者:主線 session。派任何 subagent 前,從下面五種範本挑一種,填空後整段作為 prompt。
> 工作目錄契約永遠是 prompt 第一行(對齊 `.claude/skills/subagent-driven-development/SKILL.md`)。
> 調度規則(選哪個模型、何時升級)見 `ai-docs/agent-dispatch.md`。

## 共通頭(每個範本都以此開場)

```
Working directory: <WORKTREE_FULL_PATH>
All commands (npx, git, file edits) MUST be run from this directory.
Do NOT operate on the main repository root.
Exclude from all scans: node_modules/, dist/, playwright-report/, test-results/, old-src/, blog-v2-design/, blog-v2-1-design/
---
```

## 1. 搜尋/盤點(Search)

```
【目標與動機】盤點 <什麼> 的所有出現位置,因為 <為什麼需要>。
【範圍】目錄:<src/components/... 或全 src/>;檔案類型:<*.vue / *.ts / ...>
【禁區】只讀不改。
【驗收條件】結果涵蓋整個範圍(列出你掃過的目錄清單以茲證明);每筆附 file:line。
【回報格式】一張表:file:line | 片段(≤1行) | 分類。超過 30 筆 → 寫入 <輸出檔路徑>,只回摘要統計 + 路徑。
```

## 2. 實作(Implement,TDD 強制)

```
【目標與動機】實作 <功能/修復>,對應 <plan 檔/todo 項目的路徑>。
【規範】遵守 ai-docs/code-standards.md(尤其 enum 禁令、shallowRef、Mock 分離、HTML Safety)、
  testing-standards.md、design-system.md;涉及 API 一律以 api-reference/openapi.json + ai-docs/api-contract.md 為真相。
【流程】TDD 鐵律:
  1. Boundary Analysis:先產出測試場景表(見 testing-standards.md 的範本)
  2. RED:寫失敗測試,`npx vitest run <test-file>` 確認真的失敗
  3. GREEN:最小實作使其通過,再跑確認
  4. REFACTOR:保持綠的前提下整理
【禁區】不碰 <目錄/檔案> 之外的東西;不弱化既有測試;不新增 any / @ts-ignore;mock 只進 api/mock/。
【驗收條件】場景表齊全;RED 有失敗證據;最終 `npx vitest run <相關範圍>` 全綠且輸出 pristine。
【回報格式】場景表 + 測試名稱與結果 + 變更檔案清單(file:line 級)+ vitest 摘要。
```

## 3. 重構(Refactor)

```
【目標與動機】把 <現況模式> 重構為 <目標模式>,依據 <規範章節>。
【前置】先跑受影響範圍測試建立綠基線:npx vitest run <範圍>,記錄摘要。
【禁區】行為不得改變(元件對外 props/emits、路由、store 介面凍結);不新增功能;不動視覺樣式除非任務就是樣式。
【驗收條件】基線綠 → 重構後同樣綠;無新增測試豁免;diff 只含重構範圍。
【回報格式】重構前後對照(每類一例)+ 變更檔案清單 + 兩次測試摘要。
```

## 4. 研究(Research)

```
【目標與動機】回答 <具體問題>,供 <什麼決策> 使用。
【材料】先讀:<repo 內相關檔案,如 openapi.json 對應段落>;外部查證:<官方文件範圍>。
  套件版本以 package.json 為準;API 行為必須查證,不憑記憶。
【驗收條件】每個結論附來源(repo 內 file:line 或外部 URL);查不到的明確標「未確認」,不編造。
【回報格式】結論(≤5 條)→ 各附證據 → 「未確認」清單 → 建議(若被問)。長篇分析寫入 <輸出檔路徑>。
```

## 5. 審查(Review)

```
【目標與動機】審查 <diff 範圍/PR>,聚焦 <正確性/安全/契約一致性>。
【檢查清單】對照:ai-docs/judgment.md §4 危險模式訊號表(逐條 grep 驗證:v-html 無消毒、
  ref() 包函式庫實例、enum、localStorage 存 token)、code-standards.md(Mock 分離)、
  api-contract.md(回應包裝/分頁/UUID 慣例)、testing-standards.md(分層/命名/colocation)。
【驗收條件】每條 finding 附 file:line + 違反的規範條文 + 建議修法;無 finding 也要列「檢查過什麼」。
【回報格式】severity 分級表(CRITICAL/HIGH/MEDIUM/LOW),按 severity 排序;不確定的標 PLAUSIBLE 而非斷言。
```

## 驗收與回收(主線的責任)

- 收到回報先抽查(`ai-docs/judgment.md` §8),再標完成
- 升級門檻依模型分層(Haiku 錯一次/Sonnet 同任務連錯兩次),照 `ai-docs/agent-dispatch.md` 升降級路徑執行,勿在此另記數字
