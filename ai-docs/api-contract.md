# API Contract

本文件記錄前後端共用的 API 契約，確保雙方對接一致。

## Response Wrapper

所有後端回應遵循 `ApiResponse<T>` 包裝：

```typescript
interface ApiResponse<T> {
  code: number       // 200 = 成功，其他 = 錯誤碼
  message: string    // 操作描述或錯誤訊息
  data: T | null     // 回應資料
}
```

## Pagination

分頁回應使用 `PageResult<T>`：

```typescript
interface PageResult<T> {
  records: T[]       // 當前頁資料
  total: number      // 總筆數
  size: number       // 每頁筆數
  current: number    // 當前頁碼（1-based）
  pages: number      // 總頁數
}
```

### 分頁參數驗證（後端 2026-09-27 起）

所有分頁端點的 `page` / `size` 超出範圍時回 **400（`A0001`）**，不再靜默修正：`page < 1`、`size < 1`、`size > 1000`、非整數皆然。未帶參數時採各端點預設值。`size` 上限預計降到 100（前端改伺服器端分頁後），屆時 `size > 100` 亦為 400。

### 公開文章列表查詢（`GET /api/v1/articles`）

| 參數 | 語意 | 備註 |
|---|---|---|
| `tags` | 標籤 **slug**，**AND**（文章須同時帶有全部） | 多值以逗號分隔；後端轉小寫、去重 |
| `categorySlug` | 分類 **slug**，**OR** | 同上；單值呼叫語意不變 |
| `authorUuids` | 作者 UUID，OR | UUID 格式錯誤回 400 |
| `publishedWithinDays` | 只取最近 N 天發布者 | ≤ 0 視為不篩選 |
| `sort` | `latest`（預設，依發布時間）／`popular`（瀏覽數）／`commented`（留言數） | 未知值退回 `latest` |

- 多值參數任一**超過 20 個回 400（`A0210`）**，不截斷
- 多值請以**逗號分隔的單一參數**傳送（`tags=a,b`）——axios 預設把陣列序列化成 `tags[]=a&tags[]=b`，後端不認得
- 分類 slug 自後端 V23 起限定 `^[a-z0-9]+(-[a-z0-9]+)*$`（建立／更新分類時不符回 400）

### 公開作者端點（2026-11-04 起；匿名可存取）

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/users/{uuid}/profile` | 公開作者頁資料（`authorService.getProfile`） |
| GET | `/api/v1/authors?keyword=` | 作者下拉搜尋（`authorService.searchAuthors`） |

**`GET /api/v1/users/{uuid}/profile`**

- 回 `uuid, nickname, avatarUrl, bio, location, website, socialLinks, joinedAt, stats{publishedArticleCount,totalViewCount,totalLikeCount}`；不含 email、username、role。
- **不存在、已刪除、未驗證信箱、停權一律 HTTP 404 + `A0101`，彼此不可區分。**
- ⚠️ 專案其他「不存在」多半回 400，**這支是 404**：前端以 `error.status === 404 || error.code === 'A0101'` 判斷（`apiClient` 對非 401 錯誤會在 Error 上附 `status`／`code`），回 `null` 讓畫面顯示「找不到這位作者」；5xx、網路錯誤必須**向上拋出**，不可誤判成「找不到」。
- 沒有已發布文章的 ACTIVE 使用者照常回 200，`stats` 全為 0。
- `website` 只會是 http(s) 或 `null`；前端仍以 `isHttpUrl` 再過濾一次才渲染成連結（防禦縱深）。

**`socialLinks` 是「帳號名稱（handle）」，不是網址**（Yuan 2026-11-01 決定）

- 寫入（`PATCH /api/v1/users/me/profile`）規則由後端 `SafeSocialLinksValidator.isSafeHandle` 定義，前端 `src/utils/socialLinks.ts` 的 `isSafeHandle` 為**同一份規則**（測試用同一組合格／不合格案例）：空字串＝未填；≤ 100 字；不得含控制字元、空白、Unicode FORMAT 字元；原字串與 NFKC 後都不得含 `/ : \ < > "`；至多一個前導 `@`，其後不得為空、不得再有 `@`。key 須符合 `[a-z0-9_]{1,32}`，最多 10 個，整份 JSON ≤ 2000 字。
- 讀取（公開頁）：`github`、`twitter`、`linkedin` 三個 key 恆存在，未填或不合格為 `null`；其他合格 key 照實輸出。
- 前端組網址一律「固定前綴 + `encodeURIComponent(去掉前置 @ 的 handle)`」：github → `https://github.com/`、twitter → `https://x.com/`、linkedin → `https://www.linkedin.com/in/`。**未知 key 不產生連結也不顯示**；不接受使用者提供的網址。
- 舊資料（歷史上存過網址）不遷移：公開頁讀到不合格值時後端回 `null`；設定頁載入舊值時會即時顯示格式錯誤，使用者改成帳號名稱前無法儲存。

**`GET /api/v1/authors`**

- 回 `[{ uuid, nickname, avatarUrl, publishedArticleCount }]`；只列 ACTIVE 且至少 1 篇已發布文章的作者。
- `keyword` 選填：trim 後不分大小寫、任意位置比對暱稱，`% _ \` 當字面字元；**trim 後超過 50 字回 400**（前端輸入框 `maxlength=50`）。
- 排序固定為 篇數 DESC → nickname（不分大小寫）ASC → uuid ASC；**最多 20 筆**，沒有分頁。
- 前端 `AuthorMultiSelect`：300ms debounce、序號守衛丟棄舊回應；選到的值是 `authorUuid`，餵給 `GET /api/v1/articles?authorUuids=`（上限 20，見上）。

**其他端點新增的 `authorUuid`**

- 搜尋結果（`/api/v1/search` 的 `records[]`）、推薦（`/api/v1/recommend/**`）新增 `authorUuid`，前端型別為 `authorUuid?: string | null`。
- 推薦的 Redis 舊快取在上線後最多 1 小時內為 `null`；`AuthorName` 在 `null`／缺漏時顯示純文字，不產生連結。
- 留言作者（`CommentResponse.author`）本來就含 `uuid`；收藏／系列的文章摘要型別有 `authorUuid?`，但目前畫面沒有以該欄位為來源的作者入口（見 `AuthorName`）。

## ID Convention

*   所有外部實體 ID 均為 **UUID**（`string`）
*   內部 PK（`Long`）永不暴露給前端

> ℹ️ version / series 端點於後端 **#50（H4）** 完成 DTO 化：`POST /series`、`PUT /series/{uuid}` 回 `SeriesSummaryResponse`（含 `author` 物件，非 `authorId`）；`POST /versions/manual`、`.../promote` 回 `VersionDetailResponse`，且 Version DTO 已移除內部 `authorId` / `categoryId`。前端型別已於 PR #39 對齊；**快照已於 2026-09-27 整份重抓**，已反映上述 DTO 化（不再宣告 `ApiResponseSeries`、`ApiResponseArticleVersion` 及 Version DTO 的 `authorId`/`categoryId`）。
>
> ℹ️ 信箱驗證端點於後端 **#48（H6）** 改為 `POST /api/v1/auth/verify-email`，body `{ token }`（token 屬憑證，不再走 query string，避免進入 access log 與瀏覽器歷史；後端以 `VerifyEmailRequest` + `@NotBlank` 驗證）。前端 `authService.verifyEmail` 已於 PR #38 對齊為 `apiClient.post(...)`；**快照已於 2026-09-27 整份重抓**，已改宣告 `POST` + `VerifyEmailRequest`。

## Auth Flow

### Login

```
POST /api/v1/auth/login
Body: { email, password }
Response: ApiResponse<{ accessToken, expiresIn }>
```

### Token Storage

*   **Access Token**: 存於 Pinia state（記憶體），**絕不存 localStorage**
*   **Refresh Token**: HttpOnly cookie（由後端設定），前端不可讀

### Request Authentication

```
Authorization: Bearer <accessToken>
```

### Token Refresh (401 Refresh Queue)

```
Response 401:
  if (isRefreshing) → 排入 failedQueue 等待
  else → isRefreshing=true → POST /api/v1/auth/refresh
    成功: 重發原始請求 + 清空佇列全部 resolve 重發
    失敗: logout() + 清空佇列全部 reject
  /auth/refresh 本身的 401 不觸發再次 refresh（防無限迴圈）
```

## Roles & Permissions

| Role | Spring Role | Permissions |
|------|-------------|-------------|
| USER | ROLE_USER | COMMENT_WRITE, COMMENT_DELETE |
| AUTHOR | ROLE_AUTHOR | All USER + ARTICLE_CREATE, ARTICLE_EDIT, ARTICLE_DELETE, ARTICLE_PIN, FILE_UPLOAD |
| ADMIN | ROLE_ADMIN | All permissions |

前端路由守衛透過 `meta.requiredRole` 映射這些角色。

## Public Endpoints（不需認證）

| Method | Path | Description |
|--------|------|-------------|
| ANY | `/api/v1/auth/**` | 登入、註冊等 |
| GET | `/api/v1/articles/**` | 公開文章瀏覽 |
| GET | `/api/v1/tags/**` | 標籤查詢 |
| GET | `/api/v1/files/**` | 公開檔案存取 |
| GET | `/api/v1/categories/**` | 分類查詢 |
| GET | `/api/v1/series/**` | 公開系列瀏覽(列表與詳情;寫入仍需認證) |
| GET | `/api/v1/recommend/**` | 推薦 |
| GET | `/api/v1/search` | 搜尋 |
| GET | `/api/v1/search/suggest` | 搜尋建議 |
| GET | `/api/v1/users/{uuid}/profile` | 公開作者頁資料(僅 GET;路徑限 UUID 形狀) |
| GET | `/api/v1/authors` | 作者下拉搜尋 |

> ⚠️ `/api/v1/users/**` **需要認證**(後端已收窄,呼叫必須帶 Authorization header);**唯一例外是 `GET /api/v1/users/{uuid}/profile`(公開作者頁,2026-11-04 起匿名可存取)**。此表以後端 `SecurityConfig.java` 為真相,2026-07-07 校正。
> ℹ️ `GET /api/v1/series/**` 於 **2026-07-16** 才由後端補上 permitAll(後端 PR #49,backlog H5)。**在該 PR 上線前**,匿名呼叫 series 端點會得到 **401**——這正是 `TagsIndexView` 的系列區塊對未登入訪客靜默消失的原因(該頁以 `Promise.allSettled` 把失敗降級為空清單)。後端上線後該區塊即自然恢復,前端無需改動。

所有其他端點需要 **authentication**（`authenticated()`）。
`/api/admin/**` 額外需要 **ADMIN** 角色。

## Error Handling

前端需處理以下情境：

| 情境 | 前端行為 |
|------|----------|
| `code !== 200` | 顯示 `message` 作為 Toast 通知 |
| HTTP 401 | 觸發 token refresh 或重導到登入頁 |
| HTTP 403 | 顯示「權限不足」提示 |
| HTTP 5xx | 顯示通用錯誤訊息 |

## File Upload

```
POST /api/v1/files/upload
Content-Type: multipart/form-data
Body: file (binary), usageType (ARTICLE_CONTENT | ARTICLE_COVER | AVATAR)
Response: ApiResponse<{ url, fileId }>
```
