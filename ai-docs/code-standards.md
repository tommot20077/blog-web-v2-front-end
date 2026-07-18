# Code Standards

## Code Quality

*   **Simplicity**: Simple > Clever. Readability is paramount.
*   **Small Changes**: Atomic commits. Ask before rewriting systems.
*   **Consistency**: Follow existing local style over external "standards".
*   **Early Return**: Prefer early return over deeply nested conditions. Max nesting depth: 3 levels.

## TypeScript Conventions

### `erasableSyntaxOnly` — 禁用 `enum`

`tsconfig.app.json` 啟用了 `erasableSyntaxOnly: true`，意味著**禁止使用 `enum` 關鍵字**。
改用 string literal union + `as const` object 模式：

```typescript
// ✅ Correct
const ARTICLE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const

type ArticleStatus = (typeof ARTICLE_STATUS)[keyof typeof ARTICLE_STATUS]

// ❌ Forbidden
enum ArticleStatus { DRAFT, PENDING_REVIEW }
```

### `strict: true` — 嚴格模式

所有嚴格檢查已啟用：`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`。

### `shallowRef` — 複雜非響應式物件

對於不應被 Vue 響應式代理包裝的複雜物件（如 CodeMirror 6 `EditorView`），**必須使用 `shallowRef`**，絕對不能用 `ref()`。

```typescript
// ✅ Correct
const editorView = shallowRef<EditorView>()

// ❌ Forbidden — Vue Proxy 會破壞 CM6 內部狀態
const editorView = ref<EditorView>()
```

### Type vs Interface

*   `type` 用於 union types 和 simple aliases
*   `interface` 用於可擴展的物件結構

## Vue SFC Style

*   **Always** use `<script setup lang="ts">`（Composition API，禁止 Options API）
*   Component order: `<script setup>` → `<template>` → `<style>`
*   Props: `defineProps<{ ... }>()`（TypeScript generics）
*   Emits: `defineEmits<{ ... }>()`（TypeScript generics）
*   **禁止 `this` 關鍵字**

## Naming Conventions

| 項目 | 慣例 | 範例 |
|------|------|------|
| Vue 元件檔案 | PascalCase `.vue` | `ArticleCard.vue` |
| TypeScript 檔案 | camelCase `.ts` | `useArticle.ts` |
| Composables | `use<Feature>` 函式 | `useTheme()`, `useWeather()` |
| Types / Interfaces | PascalCase | `ArticleItem`, `PageResult<T>` |
| Constants | UPPER_SNAKE_CASE | `ARTICLE_STATUS` |
| CSS classes | Tailwind utility-first | 自訂 CSS 僅透過 CSS variables |

## Tailwind Usage

*   Utility-first；避免 `@apply` 除非建立真正可重用的 utility
*   Dark mode: `class` 策略（Tailwind）+ `data-theme` 屬性（CSS variables）
*   Design token 顏色透過 CSS custom properties 定義於 `src/index.css`

## Mock 資料分離（CRITICAL）

*   **Mock 資料與邏輯禁止寫在業務程式碼中**，必須獨立放在 `api/mock/` 目錄
*   種子資料放 `api/mock/data.ts`，Mock 實作放 `api/mock/<domain>MockService.ts`
*   業務 Service 透過 dynamic `import()` 條件載入 mock 模組，確保 production build tree-shaking
*   測試用的 factory 函式放 `test-utils/factories.ts`，與 mock 種子資料分開

## HTML Safety (CRITICAL)

*   所有 `v-html` 內容**必須**先經過 `DOMPurify.sanitize()` 消毒
*   絕對不可直接渲染未消毒的使用者提供 HTML

## Documentation & Comments

*   **Language**: 所有註解必須使用**繁體中文（Traditional Chinese）**
*   Composables 需 JSDoc：用途、參數、回傳值
*   複雜元件在 `<script setup>` 頂部加註解區塊
