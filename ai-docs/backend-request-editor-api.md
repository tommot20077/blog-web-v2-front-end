# 後端需求：Editor API 行為規格確認

> 日期：2026-04-06  
> 發起方：前端  
> 關聯 Bug：儲存草稿後重複建立文章（`isNew` 判斷依賴前端狀態，每次儲存都呼叫 POST）

---

## 背景說明

目前前端 Editor 的儲存邏輯：

- 進入 `/editor`（新建）→ 每次點「儲存草稿」都呼叫 `POST /api/v1/articles`
- 進入 `/editor/:uuid`（編輯）→ 呼叫 `PUT /api/v1/articles/:uuid`

**問題**：使用者在新建頁面連續儲存 2 次，會建立 2 篇獨立文章。

**根本原因**：前端用 prop 判斷 `isNew`，但第一次 POST 成功後前端未更新判斷依據。

**解決方向**：讓前端在第一次 POST 拿到 uuid 後，後續儲存改用 `PUT /api/v1/articles/{uuid}`。後端只需確保下列規格一致。

---

## 需要後端確認的 API 行為

### 1. `POST /api/v1/articles`（建立草稿）

**請確認回應格式如下：**

```json
// Response: ApiResponse<EditorArticle>
{
  "code": 200,
  "message": "草稿建立成功",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440001",   // ← 必須有，前端用來後續 update
    "title": "我的文章",
    "summary": "",
    "content": "# Hello",
    "coverImageUrl": null,
    "status": "DRAFT",
    "categories": [],
    "tags": [],
    "rejectReason": null,
    "createdAt": "2026-04-06T10:00:00Z",
    "updatedAt": "2026-04-06T10:00:00Z"
  }
}
```

**前端 Request Body（`ArticleFormData`）：**

```json
{
  "title": "string",
  "summary": "string",
  "content": "string（Markdown 原始內容）",
  "coverImageUrl": "string | null",
  "categoryIds": ["uuid-1", "uuid-2"],
  "tagNames": ["Vue", "TypeScript"]
}
```

**關鍵要求**：
- `data.uuid` 必須在建立時即回傳，前端憑此 uuid 做後續 PUT

---

### 2. `PUT /api/v1/articles/:uuid`（更新草稿）

**請確認此端點為冪等操作（Idempotent）：**

- 相同 payload 多次呼叫，結果相同，不建立重複資料
- 後端不依賴前端傳「是否新建」的旗標，僅憑 uuid 查找並更新

**Request Body**：同上 `ArticleFormData`

**Response**：同上 `EditorArticle`（回傳更新後的完整文章資料）

**狀態限制（請確認）**：
- 僅允許 `status = DRAFT` 或 `status = REJECTED` 的文章被更新
- 嘗試更新 `PENDING_REVIEW` / `PUBLISHED` / `ARCHIVED` 的文章，應回傳：
  ```json
  { "code": 403, "message": "目前狀態不允許編輯", "data": null }
  ```

---

### 3. `GET /api/v1/articles/:uuid/edit`（取得編輯用文章）

**現有規格（確認一致）：**

```
GET /api/v1/articles/{uuid}/edit
Authorization: Bearer <accessToken>
Response: ApiResponse<EditorArticle>
```

- 僅回傳**本人**所有的文章
- 他人文章回傳 403
- 不存在回傳 404

---

## 前端會做的對應修改（供後端了解）

| 檔案 | 修改內容 |
|------|--------|
| `src/composables/useEditorForm.ts` | 內部改用 `currentUuid = ref(uuid)`，第一次 POST 後更新 `currentUuid`，後續走 PUT |
| `src/views/EditorView.vue` | 第一次儲存成功後呼叫 `router.replace('/editor/' + uuid)`，更新 URL |

修改後前端行為：

```
使用者進入 /editor（新建）
  → 點儲存草稿
  → POST /api/v1/articles  ← 第一次，新建
  → 拿到 uuid
  → URL 更新為 /editor/{uuid}
  → 再次點儲存草稿
  → PUT /api/v1/articles/{uuid}  ← 後續，更新
```

---

## 需要後端回覆的問題

1. `POST /api/v1/articles` 的 response `data` 中是否已包含 `uuid`？（目前 mock 有，真實 API 需確認）
2. `PUT /api/v1/articles/:uuid` 確認是冪等的嗎？
3. 哪些 `status` 允許被 PUT 更新？
