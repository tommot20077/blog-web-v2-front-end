# Frontend ↔ Backend API 對比差異

> **Backend commit:** `9ca1f19` (`/home/tom/dev/blog-web-v2` `develop` HEAD) · **Frontend commit:** `feature/api-integration` @ `253c7da` · **產生時間:** 2026-04-22 UTC
>
> **資料來源:** live OpenAPI 快照 `api-reference/openapi.json`（`curl http://localhost:8080/v3/api-docs | jq . > ...`，2849 行）+ 後端 controller/DTO Java 原始碼 + 前端 `src/api/*Service.ts` + `src/types/*.ts`。
>
> **相對上一版（對齊 `80fbcb8`）的重大變化：** backend 從 4 個 controller / 17 endpoints 暴增到 13 個 controller / **48 endpoints**。`PageResult<T>` 欄位整組重命名（`list→records, pageNum→current, pageSize→size, totalPage→pages`）；article 列表改用 `page/size` 參數；CORS 加上 `allowCredentials=true` 並白名單 localhost:5500 / :3000 / 127.0.0.1:5500；Category / Tag / File / Search / Recommend 五個模組全部實作 controller；`GET /api/v1/users/me` / `resend-verification` / `slug lookup` / `submit for review` / `quota` / `user files` 全部補上。

---

## 0. 共通契約（無差異）

| 項目 | 值 |
|---|---|
| 成功碼 | `"00000"` (`CommonErrorCode.SUCCESS` ↔ `apiClient.isSuccessCode`) |
| 回應封套 | `{ code: string, message: string, data: T \| null, timestamp: long }` |
| Access token 傳遞 | `Authorization: Bearer <token>` header |
| Refresh token 傳遞 | HttpOnly `refreshToken` cookie，`Path=/api/v1/auth`, `SameSite=Strict`, `Secure`, maxAge 7d |
| CORS | `allowCredentials=true`；`allowedOrigins` 來自 env `APP_CORS_ALLOWED_ORIGINS`，預設 `http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500`。前端 dev server (`:5500`) 直接在清單裡。 |

**後端 `PageResult<T>` schema（OpenAPI 確認）**：
```
{ current, size, pages, total, records }
```
**前端 `src/types/editor.ts:115` `PageResult<T>` 完全對齊**：`{ records, total, size, current, pages }`。
**但前端 `src/api/utils.ts` 的 `BackendPageResult<T>` 仍停在舊 shape `{ list, pageNum, pageSize, totalPage, total }`** — `mapPageResult` 會把所有欄位對應到 undefined。見 §2.3。

**後端 Base path 約定（OpenAPI + SecurityConfig 確認）**：
- `/api/v1/auth/**` — 不需登入
- `/api/v1/{articles,categories,tags,users,recommend,search,files}/**` GET — 公開（含部分 POST，詳見 SecurityConfig）
- `/api/admin/**` — **需 `ROLE_ADMIN`**（注意：**沒有 `/v1`**）
- `/actuator/health/**`, `/actuator/info` — 公開

---

## 1. ✅ 契約一致（可直接整合，48 後端 endpoints 中 44 條有前端 caller 或不需要）

按 domain 分組，列出前端 caller 對應的後端 operation。標 **🆕** 者為這次（`80fbcb8 → 9ca1f19`）新實作的。

### 1.1 Auth（7/7 路徑一致）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `POST /api/v1/auth/register` `authService.ts:18` | `register` | body `{email, password, nickname}` 對齊；前端 `RegisterPayload` 多傳 `username` 欄位，backend 會忽略（harmless）|
| `POST /api/v1/auth/login` `authService.ts:10` | `login` | body `{identifier, password}`；回傳 `AuthResponse{accessToken}` + `Set-Cookie: refreshToken` |
| `POST /api/v1/auth/refresh` `authService.ts:26` | `refresh` | cookie-based |
| `POST /api/v1/auth/logout` `authService.ts:34` | `logout` | 需 access token |
| `POST /api/v1/auth/forgot-password` `authService.ts:42` | `forgotPassword` | body `{email}` |
| `POST /api/v1/auth/reset-password` `authService.ts:50` | `resetPassword` | body `{token, newPassword}` |
| `POST /api/v1/auth/resend-verification` `authService.ts:74` | `resendVerification` 🆕 | body `{email}` |

### 1.2 User（4/4）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `GET /api/v1/users/me` `authService.ts:66` | `getMe` 🆕 | 回傳 `UserProfileResponse{uuid, email, nickname, avatarUrl, role, emailVerified, createdAt}` — **欄位與前端 `User` type (`types/auth.ts:24`) 完全對齊** |
| `PATCH /api/v1/users/me/profile` `userService.ts:10` | `updateProfile` | backend body 只吃 `{nickname, bio}`；前端 `UpdateProfileRequest` 多送 `website, socialLinks` — **§2.5** |
| `POST /api/v1/users/me/change-password` `userService.ts:18` | `changePassword` | body `{oldPassword, newPassword}` 對齊 |
| `DELETE /api/v1/users/me` body `{password}` `userService.ts:26` | `deleteAccount` | **backend 改成 `@RequestBody DeleteAccountRequest` 🆕（舊版是 `@RequestParam`）**，現在與前端對齊 |

### 1.3 Article（public + author）（8/8）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `GET /api/v1/articles?page&size&categorySlug` `articleService.ts:95` | `getPublishedArticles` | **backend 現支援 `page/size` 🆕**（前一版是 `pageNum/pageSize`）|
| `GET /api/v1/articles/{uuid}` `articleService.ts:113` | `getArticle` | 回傳 `ArticleResponse` — 見 §1.10 DTO 對照 |
| `GET /api/v1/articles/slug/{slug}` `articleService.ts:130` | `getArticleBySlug` 🆕 | 回傳 `ArticleResponse` |
| `POST /api/v1/articles` `editorService.ts:10` | `createArticle` | body `CreateArticleRequest{title, content, summary, coverImageUrl, status, categoryIds[], tagNames[]}` — **與前端 `ArticleFormData` 完全對齊 🆕** |
| `PUT /api/v1/articles/{uuid}` `editorService.ts:18` | `updateArticle` | 同上 |
| `DELETE /api/v1/articles/{uuid}` `myArticlesService.ts:51` | `deleteArticle` | |
| `GET /api/v1/articles/me?page&size&status` `myArticlesService.ts:38` | `getMyArticles` | 回傳 `PageResult<ArticleSummaryResponse>` |
| `POST /api/v1/articles/{uuid}/submit` `myArticlesService.ts:59` | `submitForReview` 🆕 | 無 body |

### 1.4 Article admin 操作（2/2）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `POST /api/v1/articles/{uuid}/publish` `adminService.ts:35` | `publishArticle` | 路徑在 `ArticleController`（非 admin），授權走 service-level（作者本人或 ADMIN）|
| `POST /api/v1/articles/{uuid}/reject` `adminService.ts:43` | `rejectArticle` | body `{reason}` 對齊 |

### 1.5 Category（2/2，🆕 整個 module）
| 前端 call | 後端 op |
|---|---|
| `GET /api/v1/categories` `categoryService.ts:11` | `getAllCategories` 🆕 |
| `GET /api/v1/categories/{slug}` `categoryService.ts:24` | `getCategoryBySlug` 🆕 |

### 1.6 Tag（4/4，🆕 整個 module）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `GET /api/v1/tags/hot?limit` `tagService.ts:64` | `getHotTags` 🆕 | 回傳 `Tag[]`；前端 `mapBackendTag` 讀 `{id, name, slug, usageCount}` 都存在 |
| `GET /api/v1/tags/{slug}` `tagService.ts:84` | `getTagDetail` 🆕 | 回傳 `TagDetailResponse` — 前端 `mapBackendTagDetail` 讀取欄位全部對齊 |
| `POST /api/v1/tags/{id}/follow` `tagService.ts:107` | `followTag` 🆕 | |
| `DELETE /api/v1/tags/{id}/follow` `tagService.ts:125` | `unfollowTag` 🆕 | |
| `GET /api/v1/tags/suggest?q` `tagSuggestService.ts:13` | `suggest` 🆕 | 回傳 `List<TagSuggestion>` 形式 — **待 §2.4 驗證** |

### 1.7 File（4/4，🆕 整個 module）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `POST /api/v1/files/upload` (multipart) `fileService.ts:14` | `uploadFile` 🆕 | 回傳 `FileUploadResponse{id, url, width, height, size, usageType}` |
| `GET /api/v1/files/{id}` `fileService.ts:24` | `getFileMetadata` 🆕 | 回傳 `FileMetadata` — 見 §1.10 |
| `DELETE /api/v1/files/{id}` `fileService.ts:32` | `deleteFile` 🆕 | |
| `GET /api/v1/users/me/files` `fileService.ts:41` | `getUserFiles` 🆕 | 回傳 `FileMetadata[]` |

### 1.8 Search（4/4，🆕 整個 module）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `GET /api/v1/search?q&tag&sort&page&size` `searchService.ts:15` | `search` 🆕 | 回傳 `PageResult<SearchResultResponse>` — 欄位與前端 `SearchResult` 對齊 (articleUuid/title/summary/slug/authorNickname/tagNames/publishedAt/viewCount/likeCount) |
| `GET /api/v1/search/suggest?q` `searchService.ts:32` | `suggest_1` 🆕 | 回傳 `string[]` |
| `GET /api/v1/search/history` `searchService.ts:48` | `getHistory` 🆕 | 需登入 |
| `DELETE /api/v1/search/history` `searchService.ts:61` | `clearHistory` 🆕 | 需登入 |

### 1.9 Recommend + Quota（3/3，🆕 整個 module）
| 前端 call | 後端 op | 備註 |
|---|---|---|
| `GET /api/v1/recommend/trending?period&limit` `recommendService.ts:54` | `getTrendingArticles` 🆕 | 回傳 `RecommendArticleResponse[]`；前端 `mapBackendRecommend` 讀 `{uuid, title, slug, summary, authorNickname, tagNames, viewCount, likeCount, publishedAt}` 全部存在 |
| `GET /api/v1/recommend/related/{articleUuid}` `recommendService.ts:74` | `getRelatedArticles` 🆕 | |
| `GET /api/v1/users/me/quota` `quotaService.ts:13` | `getQuota` 🆕 | 回傳 `QuotaResponse{usedBytes, limitBytes, remainingBytes}` 對齊 |

### 1.10 DTO 形狀對照（關鍵差異）
| 前端型別 | 後端 schema | 比對 |
|---|---|---|
| `ArticleItem` (`articleService.ts:32`) | `ArticleSummaryResponse` | 前端期望 `{uuid, title, summary, coverImageUrl, authorNickname, viewCount, likeCount, commentCount, publishedAt, tags, slug}` — **全部存在** ✓。`mapArticle` 會 `raw.tags.map(t => t.name)` — backend 回 `TagSummaryResponse[]` with `name`，OK。 |
| `ArticleDetailItem` | `ArticleResponse` | `ArticleSummaryResponse` + `content` + **`contentHtml`**（前端沒讀取，OK）+ `categories`（前端沒讀取）+ `updatedAt`。前端所需欄位全都在。 |
| `BackendMyArticle` (`myArticlesService.ts:6`) | `ArticleSummaryResponse` | 前端期望 `{uuid, title, summary, coverImageUrl, status, tags: {id,name,slug}[], rejectReason, createdAt, updatedAt, viewCount, likeCount, commentCount}` — **全部存在** ✓ |
| `User` (`types/auth.ts:24`) | `UserProfileResponse` | `{uuid, email, nickname, avatarUrl, role, emailVerified, createdAt}` 全對齊 ✓ |
| `QuotaInfo` | `QuotaResponse` | `{usedBytes, limitBytes, remainingBytes}` 對齊 ✓ |
| `FileMetadata` (`types/user.ts:23`) | `FileMetadata` | 前端需要欄位都在；backend 多了 `storagePath, new` 前端沒讀 ✓ |
| `FileUploadResponse` (`types/editor.ts:86`) | `FileUploadResponse` | `{id, url, width, height, size, usageType}` 對齊 ✓ |
| `TagDetail` (`types/editor.ts:124`) | `TagDetailResponse` | `{uuid, name, slug, color, icon, description, usageCount}` — 後端用 `id` 但前端 `mapBackendTagDetail` 已做 `id→uuid` 映射 ✓ |
| `CategoryOption` (`types/editor.ts:103`) | `CategoryResponse` | 前端 `{id, name, slug}` vs 後端 `{uuid, name, slug, description, sortOrder}` — **§2.6** 欄位 key 不一致 |
| `SearchResult` (`types/search.ts:11`) | `SearchResultResponse` | 全部對齊 ✓ |
| `AuthTokens` | `AuthResponse` | 前端 `{accessToken, expiresIn?}`；後端只有 `accessToken`；`expiresIn` optional OK |

---

## 2. ⚠️ 規格不一致（要修）

### 2.1 Admin path 前綴不一致
| 前端 | 後端 | 影響 |
|---|---|---|
| `GET /api/v1/admin/articles/pending` `adminService.ts:11` | `GET /api/admin/articles/pending` (無 `/v1`) | 404 |

修法：前端單點修改 `/api/v1/admin/...` → `/api/admin/...`。（「先討論」所以這裡只記錄，不直接修。）

### 2.2 `verify-email` method + 參數位置不一致
| 前端 | 後端 |
|---|---|
| `POST /api/v1/auth/verify-email` body `{token}` `authService.ts:58` | `GET /api/v1/auth/verify-email?token=...` |

同樣是 method + 位置都不同；配合 email 連結（GET）體驗，**通常應該改前端成 GET+query**。

### 2.3 前端 `BackendPageResult` / `mapPageResult` 形狀過時（CRITICAL）
`src/api/utils.ts` 的 `BackendPageResult<T>` 仍用舊後端 shape：
```
{ list, pageNum, pageSize, totalPage, total }
```
後端 `PageResult<T>` 現在是：
```
{ records, current, size, pages, total }
```
→ `mapPageResult` 會把所有欄位讀成 undefined；`articleService.getArticles` / `myArticlesService.getMyArticles` / `searchService.search` 的資料全會掉。

**注意**：前端 `src/types/editor.ts` 的 `PageResult<T>`（給 UI 用的）**已經是新 shape**，所以理論上把 `utils.ts` 的 `BackendPageResult` 直接替換成 `PageResult` 的別名、`mapPageResult` 改為 identity（或整個拿掉）就好。**最小改動點集中在 `utils.ts`**。

### 2.4 `adminService.getPendingArticles` 型別沒走 `mapPageResult`
`adminService.ts:10-13` 直接把 return type 標成 `PageResult<MyArticle>` 呼叫 `apiClient.get`，沒走 `mapPageResult` — 之前是 bug（舊後端形狀 ≠ `PageResult`）；現在後端形狀剛好等於前端 `PageResult`，**錯誤巧合地被遮住**。屬於偶然相容，建議整理成一致路徑（若留著，§2.3 修完後仍 OK；若要清潔，全走 `mapPageResult` 或刪掉 mapping）。

### 2.5 `UpdateProfileRequest` 前端多送欄位
| 前端欄位 | 後端接受 |
|---|---|
| `nickname`, `bio`, `website`, `socialLinks` | 只有 `nickname, bio` |

後端會 ignore 多送欄位（Spring 預設），功能面無錯，但前端設定 `website/socialLinks` 不會被保存 — 使用者會覺得「改了沒生效」。需要決定：（a）後端補欄位、（b）前端 UI 移除欄位。

### 2.6 `CategoryOption` 用 `id`，後端 `CategoryResponse` 用 `uuid`
前端 `types/editor.ts:103`：`{ id, name, slug }`。
後端 `CategoryResponse`：`{ uuid, name, slug, description, sortOrder }`。
`categoryService.ts:11/24` 直接把返回值 cast 成 `CategoryOption` — **`option.id` 會是 undefined**。需要加 mapper（`raw.uuid → option.id`）或前端改用 `uuid`。

### 2.7 `articleService.getArticles` 傳 `keyword` 參數
後端 `GET /api/v1/articles` 只接受 `page, size, categorySlug`（OpenAPI 確認）— **沒有 `keyword`**。前端 `articleService.ts:91-93` 會在輸入 keyword 時多加一個參數，backend 直接 ignore，搜尋不會過濾。全文搜尋應該改打 `GET /api/v1/search?q=...`（已實作）。

### 2.8 Editor 的「取得編輯用文章」在後端無對應端點
前端 `editorService.getArticleForEdit` 打 `GET /api/v1/articles/{uuid}/edit` — **OpenAPI 無此路徑**。語意上這是「作者/管理員看到 DRAFT/REJECTED 等非公開狀態」，後端的 `GET /api/v1/articles/{uuid}` 其實已含權限檢查（controller 從 SecurityContext 拿 viewerRole 交給 service），**實務上直接呼叫 `getArticle` 應該可以通過**。前端可改成直接用 `articleService.getArticleByUuid` 或保留原路徑但轉指向同一端點。

---

## 3. ❌ 後端尚未實作（前端仍走 mock / fallback）

上一版列 11 條 missing，這一版只剩 1 條：

| # | 前端 call | 備註 |
|---|---|---|
| 1 | `GET /api/v1/articles/{uuid}/edit` `editorService.ts:27` | 見 §2.8 — 可用 `GET /api/v1/articles/{uuid}` 取代，非真正缺 |

---

## 4. 後端有、前端尚無 caller 的新端點（未來可用）

| 後端 op | 路徑 | 用途 |
|---|---|---|
| `getPendingArticleCount` | `GET /api/admin/articles/pending/count` | 快速取得待審數（前端 `adminService.getPendingCount` 目前是拉 1 筆分頁再讀 `.total`，可改用這個） |
| `createCategory` / `updateCategory` / `deleteCategory` | `POST/PUT/DELETE /api/admin/categories(/{uuid})?` | Admin category CRUD — 前端還沒管理分類的 UI |
| `updateTag` / `deleteTag` | `PUT/DELETE /api/admin/tags/{id}` | Admin tag CRUD — 前端還沒管理 tag 的 UI |
| `reindex` | `POST /api/admin/search/reindex` | Admin 手動重建搜尋索引 — 維運用 |

---

## 5. 風險 / 未決問題

1. **前端 `BackendPageResult` / `mapPageResult` 立即失效**（§2.3）— 切到真實 API 就會空列表；整合第一步必修。
2. **Refresh 失敗路徑**：仍要確認 `POST /api/v1/auth/refresh` 失敗時是回 HTTP 401 還是 HTTP 200 + code `A0104`。前端 interceptor 只對 HTTP 401 觸發登出；若回 200，要在 `apiClient.ts:71` 加 `code === 'A0104'` 的特判。
3. **CORS** 目前 dev 應該直接可跑（`:5500` 已在 allowedOrigins），但若切換到別的 frontend port（例如 Playwright 的 `:5501` / `:5502`）要同時更新 `APP_CORS_ALLOWED_ORIGINS`。
4. **Frontend `utils.ts` 只是 shape 對映**：§2.3 修完後，可以把 `BackendPageResult` 整個移除，直接回傳 `PageResult<T>`；多個 service 的 `mapPageResult(data, mapItem)` 要改寫成 `{ ...data, records: data.records.map(mapItem) }`。
5. **Admin operation 權限**：OpenAPI spec 每個 op 的 `security` 仍是空陣列（SpringDoc 沒反映 `SecurityFilterChain`）；實際權限看 `SecurityConfig.java`。`/api/admin/**` 需 `ROLE_ADMIN`；公開 GET 範圍比上版廣（ `/api/v1/users/**`, `/api/v1/categories/**`, `/api/v1/recommend/**`, `/api/v1/search/**` 等的 GET 也 permitAll）— 整合時要逐端點確認前端是否在「未登入」狀態也該呼叫。
6. **`POST /api/v1/tags/suggest`**：後端 `suggest` operation 回傳結構（array of `Tag`? `TagSuggestion`?）需要再核對；OpenAPI schema 顯示為 `ApiResponseListTag`，但前端 `TagSuggestion` 只需要 `{name, articleCount}`，可以從 `Tag.name` / `Tag.usageCount` 映射。非關鍵。
7. **Backend admin 路徑無 `/v1`**：§2.1 修法直接，但如果未來想統一到 `/api/v1/admin`，需要 backend 端改動；記為 follow-up。

---

## 6. Reproduce this diff

```bash
# 1) Backend commit 驗證
(cd /home/tom/dev/blog-web-v2 && git rev-parse --short HEAD)

# 2) 重新產生 OpenAPI 快照（需要 backend 啟動，見 runbook）
curl -s http://localhost:8080/v3/api-docs | jq . \
  > /home/tom/dev/blog-web-v2-front-end/api-reference/openapi.json

# 3) 列出所有 backend operations
jq -r '.paths | to_entries[] as $p | $p.value | to_entries[] \
  | "\(.key|ascii_upcase) \($p.key) \(.value.operationId)"' \
  api-reference/openapi.json | sort

# 4) 列出前端 API call sites
grep -nE "apiClient\.(get|post|put|patch|delete)" \
  /home/tom/dev/blog-web-v2-front-end/src/api/*.ts

# 5) 比對關鍵 schema 欄位
for s in ArticleResponse ArticleSummaryResponse UserProfileResponse \
         QuotaResponse FileMetadata CategoryResponse TagDetailResponse \
         SearchResultResponse RecommendArticleResponse DeleteAccountRequest; do
  echo "=== $s ==="
  jq -r ".components.schemas.$s.properties | keys" api-reference/openapi.json
done
```

---

## 7. 覆蓋驗證

| 前端 service 檔 | 狀態 | 備註 |
|---|---|---|
| `authService.ts` | ✅ 7/9 matching / §2.2 verify-email / §1.2 getMe matching 🆕 | |
| `articleService.ts` | ✅ 3/3 matching (§2.7 keyword ignored) | |
| `categoryService.ts` | ✅ 2/2 matching / §2.6 id↔uuid | |
| `tagService.ts` | ✅ 4/4 matching | |
| `tagSuggestService.ts` | ✅ 1/1 matching (§5 #6 待確認回傳 shape) | |
| `editorService.ts` | ✅ 2/3 matching / §2.8 `/edit` 無對應 | |
| `myArticlesService.ts` | ✅ 3/3 matching | |
| `adminService.ts` | ✅ 2/3 matching / §2.1 path / §2.4 型別偶然對齊 | |
| `fileService.ts` | ✅ 4/4 matching 🆕 | |
| `searchService.ts` | ✅ 4/4 matching 🆕 | |
| `quotaService.ts` | ✅ 1/1 matching 🆕 | |
| `recommendService.ts` | ✅ 2/2 matching 🆕 | |
| `userService.ts` | ✅ 3/3 matching | |
| **`src/api/utils.ts`** | **⚠️ CRITICAL §2.3** | 整合的第一個必修項 |

**所有後端 48 個 operations 皆有列入第 1 章或第 4 章；所有前端 service 檔皆有上表紀錄。**
