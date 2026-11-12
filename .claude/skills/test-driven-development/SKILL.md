---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

- Red → Green → Refactor — no skipping steps
- Watched the test fail? If not, you don't know if it tests the right thing
- Wrote code before the test? Delete it. Start over.

## TDD Cycle

```
Red      → Write a failing test. Confirm it actually fails.
Green    → Write the minimum implementation to make it pass.
Refactor → Improve code quality while keeping all tests green.
```

## Boundary Analysis (before writing the first test)

Produce a test scenario table before coding:

```
## TDD Boundary Analysis: <FeatureName>

### Unit Under Test
- Composable: useArticle
- Method: saveDraft()

### Test Scenario Table
| # | Scenario            | Test Description                                    | Expected Result                    |
|---|---------------------|-----------------------------------------------------|------------------------------------|
| 1 | Valid input         | 有效標題和內容時成功儲存草稿                            | 回傳帶有 uuid 的已儲存文章          |
| 2 | Blank title         | 標題為空時拒絕儲存                                     | 拋出或回傳驗證錯誤                  |
| 3 | Null author         | 未登入時嘗試儲存                                       | 重導到登入頁或顯示錯誤              |
| 4 | Network failure     | API 失敗時優雅處理                                     | 設定錯誤狀態，顯示 toast            |
```

## Test Naming Convention

使用 `describe` / `it` 區塊，描述用繁體中文：

```typescript
describe('useArticle', () => {
  describe('saveDraft', () => {
    it('有效標題和內容時成功儲存草稿', () => { ... })
    it('標題為空時拒絕儲存', () => { ... })
    it('API 失敗時設定錯誤狀態', () => { ... })
  })
})
```

## Run Commands (this project)

```bash
# 全部測試
npx vitest run

# 特定目錄
npx vitest run src/composables/

# 特定檔案
npx vitest run src/composables/useArticle.test.ts

# 詳細輸出
npx vitest run --reporter verbose
```

## Verification Checklist

- [ ] Every new method has at least one test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass — no extra features
- [ ] All tests pass, output is pristine (no errors/warnings)
- [ ] Edge cases, null inputs, and exception paths covered

## Red Flags — Stop and Restart

- Wrote code before a test
- Test passed immediately without any implementation
- Can't explain why the test failed
- "I'll add tests after" / "Just this once"
- Keeping code as "reference" while writing tests

**All of these mean: Delete code. Start over with TDD.**
