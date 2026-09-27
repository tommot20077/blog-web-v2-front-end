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

> ⚠️ `/api/v1/users/**` **需要認證**(後端已收窄,呼叫必須帶 Authorization header)。此表以後端 `SecurityConfig.java` 為真相,2026-07-07 校正。
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
