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
**狀態**：`Pending`——2026-09-27 已整份重抓快照：`GET /api/v1/files/{id}/content` **已收錄**，但快照宣告回應為 `200` 而非實際的 `302`，且 `FileUploadResponse.url` 仍只宣告 `type: string`、未描述「相對路徑」語意。下方結案條件第 2 點因此尚未滿足——需後端在該端點補 `@ApiResponse(responseCode = "302")`、在 `url` 補 `@Schema(description = ...)` 後再重抓。另：物件儲存已於 2026-09-27 由 MinIO 改為 SeaweedFS（後端仍以 MinIO Java SDK 連線），下方「瀏覽器可達」的風險同樣適用。
**描述**：
後端 #54 新增 `GET /api/v1/files/{id}/content`（302 導向 presigned MinIO URL，非位元組代理），並將 `FileUploadResponse.url` 的語意由絕對網址改為相對路徑。但 `api-reference/openapi.json` 仍是 **#54 前的快照**——缺少 `/api/v1/files/{id}/content` 端點，且 `FileUploadResponse.url` 仍宣告為未區分語意的 `type: string`，與現行程式的相對路徑語意不一致。

**待解任務**：
1. 後端 #54 合併上線後，依 [maintenance.md](ai-docs/maintenance.md) §2 **整份重抓** `openapi.json`（後端跑於本機 9010）：
   `curl http://localhost:9010/v3/api-docs -o api-reference/openapi.json`
2. 確認快照補上 `/api/v1/files/{id}/content`（302 回應）且 `FileUploadResponse.url` 語意與 `src/api/real/fileService.ts` 一致後，刪除本項。

**⚠️ 未上線前的隱形風險**：
- **部署順序**：後端 #54 必須先於（或同時於）本前端上線，不可讓前端單獨搶先。`normalizeUploadUrl` 補丁已隨本次改動移除——若舊後端仍回絕對網址（`http://minio:9000/...`），前端不再有任何攔截點修正它，所有新上傳的封面與內文圖會立刻破圖。
- **基礎設施對齊**：後端 `minio.endpoint`（`MinioConfig.java`）同時供 server-side client 與 presigned URL 產生使用，必須是**瀏覽器可達**的公開 host。本 repo `docker-compose.e2e.yml:88` 的 `MINIO_ENDPOINT: http://minio:9000` 只適用容器內部網路——若部署拓撲直接沿用此值，302 `Location` 會帶出瀏覽器無法解析的內部 hostname，需與後端/infra 對齊改為公開可達位址（或新增 presigned 專用的公開 endpoint 設定）。
- **人工驗證項（無自動化測試覆蓋）**：`useAuthedImages.ts` 以 `withCredentials:false` 因應 MinIO wildcard CORS + credentials 的瀏覽器行為，屬作者實測過的設計，但單元測試把 `apiClient` 整個 mock 掉，對「帶 `Authorization` 的 XHR 跟隨跨來源 302 導向 MinIO」這條路徑沒有任何自動化防護網。變更 MinIO endpoint 或 CORS 設定後，需人工在 dev server 走一次「開自己的草稿文章」，於 DevTools Network 確認該 `<img>` 最終正常載入。
