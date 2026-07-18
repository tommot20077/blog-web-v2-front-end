# Design System

## Visual Language

本專案採用**玻璃擬態（Glassmorphism）**設計語言：半透明背景 + `backdrop-filter: blur()` + 邊框高光。

## Color Tokens

定義於 `src/index.css`，透過 CSS custom properties 實現主題切換：

### Light Mode (`:root`)

| Token | Value | 用途 |
|-------|-------|------|
| `--bg-color` | `#E7E7E7` | 頁面背景 |
| `--text-main` | `#141414` | 主要文字 |
| `--glass-panel` | `rgba(255, 255, 255, 0.6)` | 玻璃面板背景 |
| `--glass-border` | `rgba(255, 255, 255, 0.8)` | 玻璃面板邊框 |
| `--accent-color` | `#FF8D28` | 強調色（橘色） |

### Dark Mode (`[data-theme="dark"]`)

| Token | Value | 用途 |
|-------|-------|------|
| `--bg-color` | `#1A1A1A` | 頁面背景 |
| `--text-main` | `#E7E7E7` | 主要文字 |
| `--glass-panel` | `rgba(255, 255, 255, 0.08)` | 玻璃面板背景（更透） |
| `--glass-border` | `rgba(255, 255, 255, 0.15)` | 玻璃面板邊框 |
| `--accent-color` | `#FF8D28` | 強調色（不變） |

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
*   主要按鈕使用 `--accent-color`
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
