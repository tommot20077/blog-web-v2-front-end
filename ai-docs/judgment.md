# 專案判斷準則(Judgment)

> 讀者:在此 repo 工作的任何 AI session。這裡放**機械規則蓋不到的判斷**;機械規則本身在 `ai-docs/code-standards.md` 等,不在這重複。
> 每條格式:判準 → ✅ 正例 → ❌ 反例。

## 1. 何時算「真完成」

判準:對應層級測試綠(Unit/Component/Integration,見 `testing-standards.md` 分層表)+ 輸出乾淨 + 手動路徑至少走過一次(dev server 上該功能真的動)。「型別過了」「畫面應該會出來」不是完成。

- ✅ 「`ArticleCard.test.ts` 8 綠(貼上 vitest 摘要),dev server 實測點擊進入詳情頁正常」
- ❌ 「元件已建立,props 型別正確」——沒有行為證據

## 2. API 契約真相鏈(前端最重要的判斷)

判準:後端行為的真相順序是 `api-reference/openapi.json`(快照)→ `ai-docs/api-contract.md`(慣例)→ 問 Yuan。**前端不發明契約**:快照裡沒有的欄位/端點,不能假設存在。

- ✅ UI 需要的資料契約裡沒有 → 照 `ai-docs/backend-request-editor-api.md` 的模式寫一份需求文件,功能先掛 pending(參考 `pending.md` 的 Guestbook 前例),再問 Yuan
- ❌ 「後端大概有這欄位」→ 直接寫進 type + service ——之後對接時整段重寫

## 3. Mock 紀律

判準:Mock 只存在於 `api/mock/`(`code-standards.md` §Mock 資料分離);**用 mock 頂替一個「後端還沒有」的 API 時,必須同時在 `pending.md` 登記**,否則 mock 會被當成真的。

- ✅ 新互動功能後端未支援 → `api/mock/xxxMockService.ts` + `pending.md` 加一節(狀態/待解任務)
- ❌ 在元件裡寫死假資料「先讓畫面出來」——mock 洩漏進業務碼,tree-shaking 也救不了

## 4. 危險模式訊號(看到就停,先查規範)

| 訊號 | 對應地雷 |
|------|----------|
| `v-html` 沒有配 `DOMPurify.sanitize()` | `code-standards.md` §HTML Safety(CRITICAL) |
| `ref()` 包 CodeMirror `EditorView` 等函式庫實例 | `code-standards.md` §shallowRef——Vue Proxy 會弄壞 CM6 |
| `enum` 關鍵字 | `code-standards.md` §erasableSyntaxOnly——編譯錯,用 `as const` 模式 |
| token 寫進 `localStorage` | `api-contract.md` §Token Storage:Access Token 只放 Pinia 記憶體 |
| 動到 401 refresh 佇列邏輯 | `api-contract.md` §Token Refresh——防無限迴圈的細節多,改前先問 |

- ✅ 看到訊號 → 開對應規範,照規範寫,回報註明「已按 §X 處理」
- ❌ 「這裡特殊,先繞過規範」

## 5. 測試失敗的處理方向

判準:先判斷「測試對還是程式對」。修法只能是修根因;讓測試「安靜」的手段都是方向錯誤。Component 測試斷言**行為**(使用者看得到的),不斷言實作細節。

- ✅ 測試因改版失敗 → 確認新行為是預期 → 更新測試去驗新行為
- ❌ `it.skip`、斷言改成 `toBeTruthy()`、加 `any` 繞型別、mock 掉被測物本身

## 6. 何時停下問 Yuan

- 視覺/設計決策超出 `design-system.md` 既有 token(新色、新字級、新間距系統)
- 刪除或啟用 `pending.md` 裡掛起的功能(如 Guestbook 的 `<StickyNoteBoard />`)
- auth flow 任何變更(login/refresh/導向邏輯)
- 對後端契約的破壞性假設(欄位語意、分頁行為)
- 重寫任何系統(`code-standards.md`:「Ask before rewriting systems」)、測試豁免(`testing-standards.md`)

- ✅ 「這頁需要新的強調色,design token 沒有,先停下來問」
- ❌ 自己挑一個看起來像的十六進位色寫進 style

## 7. 何時該換路而非重試

判準:同一修法失敗兩次、或錯誤在不同元件間游走 → 假設錯了。停止重試,回到根因(讀契約/讀規範/縮小重現),必要時按 `agent-dispatch.md` 升級。

- ✅ 響應式更新兩次修不好 → 停,檢查是不是 `shallowRef`/Proxy 邊界問題,而不是第三次調 `watch`
- ❌ 繼續往上加 `nextTick()` 和 `setTimeout`

## 8. 品質底線怎麼驗(抽查法)

判準:驗收 subagent 實作時抽查:RED 證據、測試斷言驗的是行為不是實作、diff 沒超出範圍、沒有新 `any`/`@ts-ignore`/`it.skip`。

- ✅ 抽開測試檔看斷言內容,grep diff 裡的 `any|ts-ignore|skip`
- ❌ 「subagent 說全綠」就標完成
