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

## 📌 契約快照待補註解 + 部署順序：檔案存取控制（後端 #54）
**狀態**：`Pending`（僅剩 `FileUploadResponse.url` 語意註解）——**2026-11-07 更新**：快照（後端 W7 PR tommot20077/blog-web-v2#102）已把 `GET /api/v1/files/{id}/content` 宣告為 **200 二進位串流**（`ETag`／304），已收錄；後端 `FileController.getFileContent` 直接寫 `response` 串流、`FileControllerIT` 斷言無 `Location`，**不再是 302 導向 presigned URL**。`useAuthedImages.ts` 等處的「302」舊註解已清理。**未完成的只剩**：快照中 `FileUploadResponse.url` 仍只有 `type: string`、無「相對路徑」語意描述（結案條件 2），需後端補 `@Schema(description = ...)` 後重抓。
**描述**：
後端 #54 新增 `GET /api/v1/files/{id}/content`，並將 `FileUploadResponse.url` 的語意由絕對網址改為相對路徑（`/api/v1/files/{id}/content`）。端點本身已收錄於快照（現為 200 串流，原先設計的 302 導向 presigned MinIO URL 已被取代）；`FileUploadResponse.url` 仍宣告為未區分語意的 `type: string`，與現行程式的相對路徑語意（`src/api/real/fileService.ts`）只能靠文件對齊。

**待解任務**：
1. 後端 #54 合併上線後，依 [maintenance.md](ai-docs/maintenance.md) §2 **整份重抓** `openapi.json`（後端跑於本機 9010）：
   `curl http://localhost:9010/v3/api-docs -o api-reference/openapi.json`
2. 確認快照中 `FileUploadResponse.url` 帶有相對路徑語意描述（與 `src/api/real/fileService.ts` 一致）後，刪除本項。（端點的 200 串流宣告已確認，不再需要 302。）

**⚠️ 未上線前的隱形風險**：
- **部署順序**：後端 #54 必須先於（或同時於）本前端上線，不可讓前端單獨搶先。`normalizeUploadUrl` 補丁已隨本次改動移除——若舊後端仍回絕對網址（`http://minio:9000/...`），前端不再有任何攔截點修正它，所有新上傳的封面與內文圖會立刻破圖。
- **已解除（2026-11-07）基礎設施對齊（MinIO 瀏覽器可達）**：原擔心 302 `Location` 帶出內部 hostname。端點改為後端同源串流後，物件儲存不對外，瀏覽器不再接觸 MinIO endpoint。依據：快照 200 串流宣告、`FileController.getFileContent`（`openContent` 串流）、`FileControllerIT`（`header().doesNotExist(LOCATION)`）。
- **已解除（2026-11-07）wildcard CORS＋credentials 跨來源 302**：不再有跨來源 302；`useAuthedImages.ts` 仍保留 `withCredentials:false`（靠 Authorization header 認證，不需 cookie），註解與測試描述已更新。人工驗證項（開自己的草稿文章確認 `<img>` 載入）不再需要。
