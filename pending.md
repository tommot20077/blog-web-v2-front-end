# 前端待辦與掛起項目 (Pending Tasks)

## 📌 留言板 / 全站塗鴉牆 (Guestbook)
**狀態**：`已暫停 (Pending)`
**描述**：
借鑒網頁 `postcards.mono.studio` 靈感實作的「便利貼 (Sticky Note)」互動留言板。原本在首頁最下方展示，目前因為後端 API 不支援（`GET /api/v1/comments` 僅限於個別文章）而先註解隱藏。

**待解任務**：
1. **後端**：建議新增對應的 API（例如：`GET/POST /api/v1/guestbook`），專門儲存這種全站公開的短語留言。
2. **前端**：串接真實回傳資料後，將 `src/views/Home.vue` 中的 `<StickyNoteBoard />` 解除註解。

---

## 📌 文章功能對接
**狀態**：`Pending`
**描述**：
等待對接後端真實的文章 API、評論系統與按讚等新功能。

---

## 📌 契約快照待重抓：version / series DTO（後端 #50 / H4）
**狀態**：`Pending`（綁定後端 blog-web-v2 #50 上線）
**描述**：
前端型別（PR #39）已先行對齊後端 H4 的 DTO 化——`create`/`update` 回 `SeriesSummaryResponse`、`createManual`/`promote` 回 `VersionDetailResponse`，並移除 Version DTO 的 `authorId` / `categoryId`。但 `api-reference/openapi.json` 仍是 **#50 前的快照**（仍宣告 `ApiResponseSeries`、`ApiResponseArticleVersion`，及 Version DTO 的 `authorId`/`categoryId`），與現行型別**相矛盾**。

**待解任務**：
1. 後端 #50 合併上線後，依 [maintenance.md](ai-docs/maintenance.md) §2 **整份重抓** `openapi.json`。
2. 比對 `src/api/real/{seriesService,articleVersionService}.ts` 與快照一致後，刪除本項。

**⚠️ 未上線前的隱形風險**：型別領先已部署契約。目前安全**僅因這四個方法無任何頁面消費**；一旦有人接「版本歷史 / 誰建立此快照」UI 並期待舊 `authorId`，或此前端先於 #50 進 prod，型別會靜默說謊（`apiClient` 無回應 schema 驗證層）。

---

## 📌 契約快照待重抓：verifyEmail 改 POST + body（後端 #48 / H6）
**狀態**：`Pending`（綁定後端 blog-web-v2 #48 上線）
**描述**：
後端 #48（H6）將 `/api/v1/auth/verify-email` 由 `GET ?token=` 改為 `POST` + request body `{ token }`（token 屬憑證，不得經 query string 傳遞——會進 access log 與瀏覽器歷史；後端新增 `VerifyEmailRequest`，`token` 標 `@NotBlank`）。前端 `src/api/real/authService.ts`（PR #38）已對齊為 `apiClient.post('/api/v1/auth/verify-email', { token })`，並在 `VerifyEmailView` 進頁即把 token 從網址移除。但 `api-reference/openapi.json` 仍是 **#48 前的快照**（宣告 `GET` + `token` query param），與現行程式**相矛盾**。

**待解任務**：
1. 後端 #48 合併上線後，依 [maintenance.md](ai-docs/maintenance.md) §2 **整份重抓** `openapi.json`（後端跑於本機 9010）：
   `curl http://localhost:9010/v3/api-docs -o api-reference/openapi.json`
2. 確認快照 `/api/v1/auth/verify-email` 已翻為 `post` + `VerifyEmailRequest` body schema、且與 `authService.verifyEmail` 一致後，刪除本項並移除 [api-contract.md](ai-docs/api-contract.md) 對應 ℹ️ 註記。

**⚠️ 未上線前的隱形風險**：前端已送 POST。若在後端 #48 部署前先進 prod → 後端仍是 GET → **405 Method Not Allowed → 所有信箱驗證失敗**。兩個 PR 必須同批部署（後端先或同時），前端不可單獨搶先上線。

---

## 📌 契約快照待重抓：admin 搜尋索引狀態端點（後端 #55）
**狀態**：`Pending`（綁定後端 blog-web-v2 #55 上線）
**描述**：
前端 `src/api/real/adminService.ts`（`getSearchStatus`）呼叫 `GET /api/v1/admin/search/status`，並以 `src/types/search.ts` 的 `SearchIndexStatus { documentCount: number | null; lastReindexAt: string | null; healthy: boolean }` 對應回應。此端點不是前端發明契約——已查證後端 blog-web-v2 develop 分支：`AdminSearchController`（`@RequestMapping("/api/v1/admin/search")`）以 `@GetMapping("/status")` 提供，回傳 `ApiResponse<SearchIndexStatusResponse>`，`SearchIndexStatusResponse` 欄位為 `Long documentCount` / `String lastReindexAt` / `boolean healthy`，與前端型別完全一致。但 `api-reference/openapi.json` 目前只登記了同資源下的 `/api/v1/admin/search/reindex`，**未收錄 `/status`**——快照落後於後端 **#55**。

**待解任務**：
1. 後端 #55 合併上線後，依 [maintenance.md](ai-docs/maintenance.md) §2 **整份重抓** `openapi.json`（後端跑於本機 9010）：
   `curl http://localhost:9010/v3/api-docs -o api-reference/openapi.json`
2. 確認快照已收錄 `GET /api/v1/admin/search/status` 且回應 schema 與 `SearchIndexStatus` 一致後，刪除本項。

**⚠️ 未上線前的隱形風險**：前端 `AdminSearchView` 已呼叫此端點。**後端 #55 需先於或同時於本前端上線**，否則 admin 搜尋索引頁的狀態查詢會 **404**，管理員看不到索引狀態、也無法判斷是否需要重建索引。
