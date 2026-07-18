# Architecture & Design

## Project Structure

```
src/
  main.ts                    # App 進入點
  App.vue                    # 根元件（NavigationBar + RouterView）
  index.css                  # Tailwind directives + design tokens
  vite-env.d.ts              # Vue SFC 型別宣告

  api/                       # API 服務層 + Mock 系統
    articleService.ts        # Article API client（使用 fetch）
    mock/                    # Mock 層（獨立於業務程式碼）
      data.ts                # 種子資料（in-memory）
      mockArticleContent.ts  # Mock 用的 Markdown 長文本
      articleMockService.ts  # Article mock 實作（同介面的 mock 版本）

  components/                # Vue SFC，按功能領域組織
    ui/                      # 共用基礎元件（BaseButton, BaseInput...）
    layout/                  # Shell 元件（NavigationBar, Footer, ThemeSwitcher）
    article/                 # 文章領域
    editor/                  # 編輯器領域
    auth/                    # 認證領域
    search/                  # 搜尋領域
    admin/                   # 管理功能
    home/                    # 首頁專屬
    common/                  # 跨領域共用

  composables/               # Composition API 可重用邏輯
  router/                    # Vue Router 設定 + 守衛
  stores/                    # Pinia stores（auth 等）
  types/                     # TypeScript 型別定義
  views/                     # 頁面級元件（路由目標）
  styles/                    # 全域 CSS（editor.css 等）
```

## Three-Tier Component Architecture

| 層級 | 位置 | 職責 |
|------|------|------|
| **Page** | `views/` | 協調子元件、持有頁面級狀態、與 router 對接 |
| **Feature** | `components/<feature>/` | 領域邏輯、消費 composables |
| **UI** | `components/ui/` | 無狀態 / presentational、props 驅動、可重用 |

## Composable Pattern

所有共享邏輯放入 `composables/`，遵循以下規則：

*   函式命名 `use<Feature>`（如 `useTheme()`, `useWeather()`）
*   回傳響應式狀態與方法
*   管理生命週期（`onMounted` / `onUnmounted` 清理）
*   使用 JSDoc 標註用途、參數、回傳值

## Mock API System

*   由 `VITE_USE_MOCK` 環境變數控制
*   Service 方法內以 `import.meta.env.VITE_USE_MOCK` 判斷，透過 dynamic `import()` 載入 mock 模組
*   **Mock 資料與邏輯必須獨立於業務程式碼**，統一放在 `api/mock/` 目錄
*   種子資料在 `api/mock/data.ts`，Mock 實作在 `api/mock/<domain>MockService.ts`
*   使用 dynamic import 確保 production build 自動排除 mock 程式碼（tree-shaking）
*   `.env.production` 中 `VITE_USE_MOCK=false` 確保生產環境不包含 mock

## Zone Architecture

主題專區（Zone）採兩層架構：

```
Zone（技術/旅遊/攝影）→ Category（Vue/React/TS...）
```

*   Zone 決定 Layout（文章列表 / 地圖 / 瀑布流）
*   `layoutType` 提升至 Zone 層
*   路由：`/zones/:zoneSlug`，動態載入對應 Layout 元件

## State Management

| 範圍 | 工具 | 範例 |
|------|------|------|
| 全域狀態 | Pinia store | `auth.ts`（user, token） |
| 功能局部狀態 | Composable | `useArticle()`, `useSearch()` |
| 元件內部狀態 | `ref` / `reactive` | 表單輸入、UI 切換 |
| 跨元件通訊 | Props / Emits | 父子元件資料傳遞 |

## Routing

Vue Router 搭配 route meta 實現守衛：

```typescript
meta: {
  requiresAuth?: boolean      // 需要登入
  requiredRole?: UserRole     // 需要特定角色
  guestOnly?: boolean         // 僅訪客可見（登入後重導）
}
```

*   非首頁路由使用 `() => import(...)` 動態載入
*   `scrollBehavior` 設定頁面切換時回到頂部
