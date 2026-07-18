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
