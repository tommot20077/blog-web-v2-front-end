# Design System

## Visual Language

本專案採用**玻璃擬態（Glassmorphism）**設計語言：半透明背景 + `backdrop-filter: blur()` + 邊框高光。

## Color Tokens

基礎色階定義於 `src/assets/design/styles.css`（designer source，`src/index.css:1` 標註 do not edit，**禁止編輯**）的 `:root` / `[data-theme="dark"]`；`src/index.css` 疊加暗色覆寫（Apple 柔和色調）與跨元件語意 token。同特異性下，後載入者勝，故 `src/index.css` 的值即為實際渲染值。透過 CSS custom properties 實現主題切換。

> 舊版本文件曾記載 `--bg-color` / `--text-main` / `--glass-panel` / `--accent-color: #FF8D28`，這些 token 名稱與色值在目前的 `src/` 中**零命中**，已不存在；以下為實際使用中的 token。

### Light Mode (`:root`, `src/assets/design/styles.css`)

| Token | Value | 用途 |
|-------|-------|------|
| `--bg` | `#f4f4f4` | 頁面背景 |
| `--bg-sub` | `#ededed` | 次要背景（skeleton、卡片底） |
| `--surface` | `#fbfbfb` | 表面色 |
| `--ink` | `#0a0a0b` | 主要文字 |
| `--ink-2` | `#2a2a2c` | 次要文字 |
| `--muted` | `#6b6b70` | 弱化文字 |
| `--glass` | `rgba(255,255,255,0.62)` | 玻璃面板背景 |
| `--glass-border` | `rgba(255,255,255,0.9)` | 玻璃面板邊框 |
| `--accent` | `#5B8DEF` | 強調色（藍） |

### Dark Mode (`[data-theme="dark"]`)

暗色階採用 Apple 柔和色調（`src/index.css:27-48` 覆寫），蓋過 `styles.css` 原本的 `--bg: #0d0d0f` 近純黑，避免 halation（白字邊緣發光）：

| Token | Value | 用途 | 定義位置 |
|-------|-------|------|----------|
| `--bg` | `#1d1d1f` | 頁面背景 | `src/index.css`（覆寫 styles.css 的 `#0d0d0f`） |
| `--bg-sub` | `#242426` | 次要背景 | `src/index.css` |
| `--surface` | `#2b2b2e` | 表面色 | `src/index.css` |
| `--ink` | `#e8e8ed` | 主要文字 | `src/index.css` |
| `--ink-2` | `#c7c7cc` | 次要文字 | `src/index.css` |
| `--muted` | `#98989d` | 弱化文字 | `src/index.css` |
| `--glass` | `rgba(36,36,38,0.74)` | 玻璃面板背景（更透） | `src/index.css`（覆寫 styles.css 的 `rgba(22,22,24,0.62)`） |
| `--glass-border` | `rgba(255,255,255,0.11)` | 玻璃面板邊框 | `src/index.css` |
| `--accent` | `#7BA8F5` | 強調色（隨主題微調） | `styles.css` |

### Semantic Tokens（`src/index.css`，不寫入 `assets/design/*.css`）

除了上述基礎色階，`src/index.css` 另外定義了語意色 token，供跨元件表達「狀態」而非單純視覺色：

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `--ok` | `#3f8f5f` | `#6fbf8b` | 「達成」語意綠（密碼強度、註冊成功） |
| `--danger` | `#b91c1c` | `#f87171` | 「錯誤/危險」語意紅（錯誤訊息文字、reject 按鈕/badge 文字與邊框） |
| `--danger-strong` | `#ef4444`（不隨主題變化） | 同左 | 白字配實心/近實心紅底時的基底紅（如「確認拒絕」「刪除」按鈕）；各處半透明紅底一律以 `color-mix(in srgb, var(--danger-strong) X%, transparent)` 推導，取代舊有 `rgba(239,68,68,X)` 硬編碼 |

`--danger` 的暗色值（`#f87171`）已用 WCAG 對比度公式驗證：對暗色背景 `--bg`（`#1d1d1f`）約 6.1:1、`--bg-sub`（`#242426`）約 5.6:1，皆超過 AA 文字門檻 4.5:1（計算與斷言見 `src/dangerToken.test.ts`）。舊硬編碼 `#b91c1c` 對同樣的暗色背景僅 ≈2.4~2.6:1，未達標——這是新增 `--danger` token 的直接動機；亮色沿用 `#b91c1c`（對 `--bg` 約 5.9:1，本就合格，不變動觀感）。

**維護原則**：`src/assets/design/*.css` 是 designer source，禁止編輯；新增或覆寫 token 一律寫在 `src/index.css`（同特異性下，後載入者勝）。

## Dark Mode Implementation

*   `data-theme` 屬性設定於 `<html>` 元素
*   CSS variables 隨 `data-theme` 切換
*   Tailwind `darkMode: 'class'` 策略
*   狀態持久化至 `localStorage`
*   主題切換由 `useTheme()` composable 管理

## Component Style Conventions

### Glass Card

```html
<div class="bg-white/60 backdrop-blur-md rounded-3xl border border-white/80">
```

Dark mode 下自動降低透明度（透過 CSS variables）。

### Buttons

*   Pill 形狀：`rounded-full`
*   主要按鈕使用 `--accent`
*   次要按鈕使用 glass 風格

### Status Badges

色碼映射：

| 狀態 | 顏色 |
|------|------|
| DRAFT | gray |
| PENDING_REVIEW | yellow |
| PUBLISHED | green |
| REJECTED | red |
| ARCHIVED | blue |

## Responsive Strategy

*   **Mobile-first** 設計
*   斷點：`md:` (768px, 平板), `lg:` (1024px, 桌面)
*   文章卡片：桌面 3 欄 → 手機 1 欄
*   編輯器：桌面左右分割 → 手機 Tab 切換

## Transitions

*   主題切換：`transition: background-color 0.3s ease, color 0.3s ease`
*   路由切換：`<Transition name="fade">`
*   元素出現：考慮交錯延遲動畫（staggered delay）
