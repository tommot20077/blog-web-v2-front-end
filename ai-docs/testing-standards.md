# Testing Standards

## Test Runner & Libraries

| 工具 | 用途 |
|------|------|
| **Vitest** | Test runner（對齊 Vite 生態系） |
| **@testing-library/vue** | 元件行為測試（以使用者行為驅動） |
| **@vue/test-utils** | 底層元件測試工具（補充 testing-library 不足之處） |

## Coverage

*   Tests must cover the feature.
*   **Pristine Output**: 測試期間的 log 應保持乾淨，除非測試的是錯誤處理。
*   **No Exceptions**: "Not applicable" is not an excuse. Unit, Component, Integration tests are required unless explicitly waived by Yuan.

## What to Test at Each Level

| 層級 | 測試對象 | 範例 |
|------|----------|------|
| **Unit** | Composables, utility functions, type guards, API response transformers | `useWordCount()`, `sanitizeHtml()` |
| **Component** | 使用者互動流程、條件渲染、事件觸發 | 點擊按鈕觸發事件、條件顯示元素 |
| **Integration** | Composable + Mock API 互動、路由守衛行為 | `useArticle()` 搭配 mock API |

## Test File Naming & Location

*   檔案名稱：`<name>.test.ts` 或 `<name>.spec.ts`
*   位置：與原始碼**同層級**（colocated）

```
src/
  composables/
    useTheme.ts
    useTheme.test.ts        ← colocated
  components/
    article/
      ArticleCard.vue
      ArticleCard.test.ts   ← colocated
```

## Test Description Language

使用 `describe` / `it` 區塊，描述使用**繁體中文**：

```typescript
describe('useWordCount', () => {
  it('計算中文字元數（按字元計算）', () => {
    // ...
  })

  it('計算英文單字數（按空格分割）', () => {
    // ...
  })

  it('混合中英文時分別計算', () => {
    // ...
  })
})
```

## Run Commands

```bash
# 全部測試
npx vitest run

# 詳細輸出
npx vitest run --reporter verbose

# 特定目錄
npx vitest run src/composables/

# 特定檔案
npx vitest run src/composables/useTheme.test.ts

# Watch 模式（開發中）
npx vitest
```

## TDD Boundary Analysis Template

在寫第一個測試之前，先產出測試場景表：

```
## TDD Boundary Analysis: <FeatureName>

### Unit Under Test
- Composable: useArticle
- Method: saveDraft()

### Test Scenario Table
| # | Scenario            | Test Description                          | Expected Result                    |
|---|---------------------|-------------------------------------------|------------------------------------|
| 1 | Valid draft data    | 有效標題和內容時成功儲存草稿                  | 回傳帶有 uuid 的已儲存文章          |
| 2 | Empty title         | 標題為空時拒絕儲存                           | 拋出或回傳驗證錯誤                  |
| 3 | Network failure     | API 失敗時優雅處理                           | 設定錯誤狀態，顯示 toast            |
```
