# Agent 調度守則(Model Dispatch)

> 讀者:在此 repo 工作的任何 AI session(含較小模型)。目標:把貴的 context 花在判斷上,把便宜的 context 花在廣度上。
> 姊妹檔:後端 repo `D:\end\workspace\java\blog-web-v2\ai-docs\agent-dispatch.md`(獨立維護,不要求逐字同步)。

## 現役模型速查(2026-07 查證;會過時,調度前先確認實際可用型號,查不到就寫「待查」,不要憑記憶編)

| 模型 | 定位 | 用在 |
|------|------|------|
| Fable 5(`claude-fable-5`) | 最高階、額度稀缺 | 立制度、架構級判斷、一次性難題;不做日常任務 |
| Opus 4.8(`claude-opus-4-8`) | 高階 | 複雜元件重構、難搞的響應式/非同步 bug 根因 |
| Sonnet 5(`claude-sonnet-5`) | 日常主力 | 元件/composable 實作、測試修復、review、文件 |
| Haiku 4.5(`claude-haiku-4-5-20251001`) | 便宜快速 | 批次 grep/掃描、機械性套用已知模式、格式整理 |

## 分工原則:指揮官不下場

主線 session 負責:讀關鍵一手材料(規範檔、失敗測試輸出、契約文件)、做決策、驗收。
以下工作一律派 subagent,主線只收結論:

- 廣度掃描(全 src/ grep、盤點元件用法、找 API 呼叫點)
- 批次改檔(同一模式套用到 N 個元件/測試)
- 跑測試(vitest 單檔跑得快,但輸出長;subagent 消化後只回失敗摘要)
- 驗證他人(或自己)的產出

## 交辦三要素(缺一不派)

每個 subagent prompt 必含:

1. **目標與動機**:做什麼、為什麼(含 worktree 工作目錄契約,見 `ai-docs/task-briefs.md`)
2. **驗收條件**:可機械判定的完成標準(`npx vitest run <file>` 綠、grep 零命中、build 過……)
3. **回報格式**:只回結論 + `file:line` 證據;長產物寫檔、回傳路徑;禁止把整份檔案內容貼回主線

範本見 `ai-docs/task-briefs.md`(搜尋/實作/重構/研究/審查五種)。

## 回報合約(subagent 端)

- 結論先行,一段講完;證據用 `file:line`
- 產出超過 ~30 行 → 寫檔(路徑照任務指定),回報只給路徑 + 三行摘要
- 做不到就明說做不到 + 卡在哪,不要交「看起來像完成」的半成品

## 升降級路徑

- **升級**:Haiku 級錯一次 → 換 Sonnet 重派。Sonnet 級**同一子任務連錯兩次** → 帶完整失敗軌跡(兩次的 prompt、產出、驗收失敗原因)升 Opus。
- **降級**:高階模型解出模式後,把模式寫成明確步驟,降回便宜模型批次套用。
- **止損**:同一件事最多兩輪升級。仍不過 → 停下,把失敗軌跡整理好問 Yuan,不要無限重試。

## 驗證不自驗

產出者不能當自己的驗收者:

- 檔案類 → 派 fresh-context agent read-back(檔案存在、內容完整、規則可執行)
- 程式類 → 跑測試(`npx vitest run <目標>`),以實際輸出為證據,不接受「應該會過」
- 高風險判斷(auth flow、API 契約假設、`v-html` 相關)→ 第二意見:再派一個 agent 從反方立場審一次,或直接問 Yuan

## 本 repo 的成本地雷(vue 特有)

- **Playwright E2E 最貴**(要起 docker/後端):只在契約層變更、auth flow 變更或上線前跑;日常用 Vitest + Component 測試
- Vitest 單檔便宜:優先 `npx vitest run <file>`,少跑全套
- 契約問題別瞎猜:真相鏈是 `api-reference/openapi.json`(後端快照)→ `ai-docs/api-contract.md`,見 `ai-docs/judgment.md` §2
- `node_modules/`、`dist/`、`playwright-report/`、`old-src/`、兩個 `blog-v2*-design/` 原型目錄:掃描時一律排除,進去就是漏 token
