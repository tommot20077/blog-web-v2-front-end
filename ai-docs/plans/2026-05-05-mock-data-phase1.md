# Mock Data Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 4 位作者 metadata + 24 個 tag 集合 + 30 篇示範文章，並修齊受影響的 unit / e2e 測試。

**Architecture:** 新增 `profiles.ts`（作者 metadata）與 `tagRegistry.ts`（tag 常數）兩個獨立模組；改寫 `data.ts` 的 `allMockArticles` 為明確列舉的 30 篇陣列（不引入 random/auto-generator）；以 TDD 順序：先補 `data.test.ts` 結構斷言（總數/作者占比/時間分布/tag 覆蓋）→ 滿足斷言地手寫 30 篇 → 修齊既有 hard-coded 假設的測試。

**Tech Stack:** TypeScript / Vitest / Playwright

**Spec reference:** `ai-docs/specs/2026-05-05-mock-data-expansion-design.md`

---

## File Structure

| 操作 | 檔案 | 責任 |
|---|---|---|
| Create | `src/api/mock/profiles.ts` | 4 位作者 metadata（nickname / tagline / avatarSeed） |
| Create | `src/api/mock/profiles.test.ts` | 驗證 profiles 結構正確 |
| Create | `src/api/mock/tagRegistry.ts` | 24 個 tag 分 5 組常數 + flat list |
| Create | `src/api/mock/tagRegistry.test.ts` | 驗證 tag registry 結構與計數 |
| Modify | `src/api/mock/data.ts` | 重寫 `allMockArticles`：30 篇手寫，import profiles + tagRegistry |
| Modify | `src/api/mock/data.test.ts` | 重寫斷言：30 篇 / 作者占比 / 時間分布 / tag 覆蓋 / 每篇 1~3 tag |
| Modify | `src/api/mock/articleMockService.test.ts` | 移除「Vue 第一篇」「偶數/奇數 Frontend/Backend」之類 hard-coded 假設 |
| Modify | `src/api/mock/recommendMockService.test.ts` | 若有 hard-coded 標題，動態化 |
| Modify | `e2e/mock/new-pages.spec.ts` | TagsIndexView 黑名單測試的 tag 名單需更新（若有衝突） |

**不動：**
- `mockArticleContent.ts`（Phase 3 才動 markdown body）
- `getMockArticleDetail`（仍共用 mockArticleContent）
- recommendMockService / tagMockService 等實作層（資料變但 service 邏輯不變）

---

## 30 篇配額規劃

| 時期 | 篇數 | 作者分布 |
|---|---|---|
| 2023-04 ~ 2023-12 | **12** | Yuan 9 + Han 3 |
| 2024-01 ~ 2024-12 | **10** | Yuan 5 + Han 2 + Mira 2 + Chen 1 |
| 2025-01 ~ 2026-04 | **8** | Yuan 5 + Han 1 + Mira 1 + Chen 1 |
| **合計** | **30** | Yuan 19 + Han 6 + Mira 3 + Chen 2 |

主題分布（30 篇）：Frontend 12 / Backend 6 / Design 4 / Practice 4 / Life 4

每個 tag 至少出現 1 次（24 個 tag 全覆蓋）。

---

## Task 1: 建立 profiles.ts

**Files:**
- Create: `src/api/mock/profiles.ts`
- Test: `src/api/mock/profiles.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
// src/api/mock/profiles.test.ts
import { describe, it, expect } from 'vitest';
import { MOCK_AUTHOR_PROFILES, AUTHOR_KEYS } from './profiles';

describe('MOCK_AUTHOR_PROFILES', () => {
  it('包含 4 位作者：yuan / han / mira / chen', () => {
    expect(AUTHOR_KEYS).toEqual(['yuan', 'han', 'mira', 'chen']);
  });

  it('每位作者皆有 nickname / tagline / avatarSeed', () => {
    for (const key of AUTHOR_KEYS) {
      const p = MOCK_AUTHOR_PROFILES[key];
      expect(p.nickname).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.avatarSeed).toBeTruthy();
    }
  });

  it('Yuan 為主筆，nickname === "Yuan"', () => {
    expect(MOCK_AUTHOR_PROFILES.yuan.nickname).toBe('Yuan');
  });
});
```

- [ ] **Step 2: 跑測試確認 fail**

```bash
npx vitest run src/api/mock/profiles.test.ts
```
Expected: FAIL with `Cannot find module './profiles'`

- [ ] **Step 3: 建立 profiles.ts**

```ts
// src/api/mock/profiles.ts
export const MOCK_AUTHOR_PROFILES = {
  yuan: {
    nickname: 'Yuan',
    tagline: '台北的前端工程師，偶爾設計，長期思考怎麼把複雜的事寫得更直白',
    avatarSeed: 'yuan-luca',
  },
  han: {
    nickname: 'Han',
    tagline: '寫了 10 年 Java，最近開始投奔 Go',
    avatarSeed: 'han-liu',
  },
  mira: {
    nickname: 'Mira',
    tagline: 'Visual designer turned design engineer',
    avatarSeed: 'mira-huang',
  },
  chen: {
    nickname: 'Chen',
    tagline: '工程師的另一面是讀書與寫信',
    avatarSeed: 'chen-zekai',
  },
} as const;

export const AUTHOR_KEYS = Object.keys(MOCK_AUTHOR_PROFILES) as Array<keyof typeof MOCK_AUTHOR_PROFILES>;

export type AuthorKey = keyof typeof MOCK_AUTHOR_PROFILES;
```

- [ ] **Step 4: 跑測試確認 pass**

```bash
npx vitest run src/api/mock/profiles.test.ts
```
Expected: PASS, 3/3

- [ ] **Step 5: Commit**

```bash
git add src/api/mock/profiles.ts src/api/mock/profiles.test.ts
git commit -m "feat(mock): 加入 4 位作者 profiles metadata (Phase 1)"
```

---

## Task 2: 建立 tagRegistry.ts

**Files:**
- Create: `src/api/mock/tagRegistry.ts`
- Test: `src/api/mock/tagRegistry.test.ts`

- [ ] **Step 1: 寫失敗測試**

```ts
// src/api/mock/tagRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { MOCK_TAG_REGISTRY, ALL_MOCK_TAGS, TAG_CATEGORY_KEYS } from './tagRegistry';

describe('MOCK_TAG_REGISTRY', () => {
  it('包含 5 個分類：frontend / backend / design / practice / life', () => {
    expect(TAG_CATEGORY_KEYS).toEqual(['frontend', 'backend', 'design', 'practice', 'life']);
  });

  it('總共 24 個 tag', () => {
    expect(ALL_MOCK_TAGS.length).toBe(24);
  });

  it('每組 tag 數量正確', () => {
    expect(MOCK_TAG_REGISTRY.frontend).toHaveLength(7);
    expect(MOCK_TAG_REGISTRY.backend).toHaveLength(6);
    expect(MOCK_TAG_REGISTRY.design).toHaveLength(4);
    expect(MOCK_TAG_REGISTRY.practice).toHaveLength(3);
    expect(MOCK_TAG_REGISTRY.life).toHaveLength(4);
  });

  it('關鍵 tag 存在', () => {
    expect(MOCK_TAG_REGISTRY.frontend).toContain('Vue 3');
    expect(MOCK_TAG_REGISTRY.backend).toContain('Spring');
    expect(MOCK_TAG_REGISTRY.design).toContain('Design System');
    expect(MOCK_TAG_REGISTRY.practice).toContain('TDD');
    expect(MOCK_TAG_REGISTRY.life).toContain('Books');
  });

  it('ALL_MOCK_TAGS 不含重複', () => {
    expect(new Set(ALL_MOCK_TAGS).size).toBe(ALL_MOCK_TAGS.length);
  });
});
```

- [ ] **Step 2: 跑測試確認 fail**

```bash
npx vitest run src/api/mock/tagRegistry.test.ts
```
Expected: FAIL with `Cannot find module './tagRegistry'`

- [ ] **Step 3: 建立 tagRegistry.ts**

```ts
// src/api/mock/tagRegistry.ts
export const MOCK_TAG_REGISTRY = {
  frontend: ['Vue 3', 'React', 'TypeScript', 'CSS', 'Animation', 'Tailwind', 'Vite'],
  backend: ['Spring', 'PostgreSQL', 'Redis', 'Microservices', 'Performance', 'Go'],
  design: ['Design System', 'Typography', 'Color', 'Motion'],
  practice: ['Testing', 'TDD', 'CI/CD'],
  life: ['Books', 'Productivity', 'Remote Work', 'Career'],
} as const;

export const TAG_CATEGORY_KEYS = Object.keys(MOCK_TAG_REGISTRY) as Array<keyof typeof MOCK_TAG_REGISTRY>;

export const ALL_MOCK_TAGS: readonly string[] = Object.values(MOCK_TAG_REGISTRY).flat();

export type TagCategoryKey = keyof typeof MOCK_TAG_REGISTRY;
```

- [ ] **Step 4: 跑測試確認 pass**

```bash
npx vitest run src/api/mock/tagRegistry.test.ts
```
Expected: PASS, 5/5

- [ ] **Step 5: Commit**

```bash
git add src/api/mock/tagRegistry.ts src/api/mock/tagRegistry.test.ts
git commit -m "feat(mock): 加入 24 個 tag 5 分類常數 (Phase 1)"
```

---

## Task 3: 重寫 data.test.ts 結構斷言（Red）

**Files:**
- Modify: `src/api/mock/data.test.ts`

先把斷言改成 Phase 1 後該有的形狀，跑測試應該全紅（因為 data.ts 還沒改）。

- [ ] **Step 1: 重寫 data.test.ts 全部斷言**

```ts
// src/api/mock/data.test.ts
import { describe, it, expect } from 'vitest';
import { allMockArticles } from './data';
import { MOCK_AUTHOR_PROFILES, AUTHOR_KEYS } from './profiles';
import { ALL_MOCK_TAGS } from './tagRegistry';

describe('allMockArticles (Phase 1)', () => {
  it('共 30 篇文章', () => {
    expect(allMockArticles).toHaveLength(30);
  });

  describe('作者分布', () => {
    function countByNickname(nickname: string) {
      return allMockArticles.filter(a => a.authorNickname === nickname).length;
    }

    it('Yuan 寫 19 篇', () => {
      expect(countByNickname('Yuan')).toBe(19);
    });
    it('Han 寫 6 篇', () => {
      expect(countByNickname('Han')).toBe(6);
    });
    it('Mira 寫 3 篇', () => {
      expect(countByNickname('Mira')).toBe(3);
    });
    it('Chen 寫 2 篇', () => {
      expect(countByNickname('Chen')).toBe(2);
    });

    it('所有作者 nickname 都來自 MOCK_AUTHOR_PROFILES', () => {
      const validNicknames = AUTHOR_KEYS.map(k => MOCK_AUTHOR_PROFILES[k].nickname);
      for (const a of allMockArticles) {
        expect(validNicknames).toContain(a.authorNickname);
      }
    });
  });

  describe('時間分布', () => {
    function countByYear(year: string) {
      return allMockArticles.filter(a => a.publishedAt.startsWith(year)).length;
    }

    it('2023 共 12 篇', () => {
      expect(countByYear('2023')).toBe(12);
    });
    it('2024 共 10 篇', () => {
      expect(countByYear('2024')).toBe(10);
    });
    it('2025 + 2026 共 8 篇', () => {
      expect(countByYear('2025') + countByYear('2026')).toBe(8);
    });

    it('publishedAt 在 [2023-04-01, 2026-04-30] 區間', () => {
      for (const a of allMockArticles) {
        expect(a.publishedAt >= '2023-04-01').toBe(true);
        expect(a.publishedAt <= '2026-04-30').toBe(true);
      }
    });
  });

  describe('Tag 規則', () => {
    it('每篇文章帶 1~3 個 tag', () => {
      for (const a of allMockArticles) {
        expect(a.tags.length).toBeGreaterThanOrEqual(1);
        expect(a.tags.length).toBeLessThanOrEqual(3);
      }
    });

    it('所有 tag 都來自 ALL_MOCK_TAGS', () => {
      for (const a of allMockArticles) {
        for (const tag of a.tags) {
          expect(ALL_MOCK_TAGS).toContain(tag);
        }
      }
    });

    it('24 個 tag 每個都至少出現 1 次（Phase 1 全覆蓋）', () => {
      const used = new Set(allMockArticles.flatMap(a => a.tags));
      for (const tag of ALL_MOCK_TAGS) {
        expect(used.has(tag)).toBe(true);
      }
    });
  });

  describe('每篇文章基本欄位', () => {
    it('title 不為空', () => {
      for (const a of allMockArticles) {
        expect(a.title.length).toBeGreaterThan(0);
      }
    });
    it('summary 不為空且長度 > 20', () => {
      for (const a of allMockArticles) {
        expect(a.summary.length).toBeGreaterThan(20);
      }
    });
    it('uuid 唯一', () => {
      const uuids = allMockArticles.map(a => a.uuid);
      expect(new Set(uuids).size).toBe(uuids.length);
    });
  });
});
```

- [ ] **Step 2: 跑測試確認全紅**

```bash
npx vitest run src/api/mock/data.test.ts
```
Expected: FAIL，多項斷言失敗（length=52、作者數對不上、tag 覆蓋失敗）

- [ ] **Step 3: Commit (Red)**

```bash
git add src/api/mock/data.test.ts
git commit -m "test(mock): 加 Phase 1 結構斷言 (30 篇 / 作者占比 / 時間 / tag) — Red"
```

---

## Task 4: 重寫 data.ts — 2023 期 12 篇

**Files:**
- Modify: `src/api/mock/data.ts`

按 Yuan 9 + Han 3 配額，主題分布：Yuan = Frontend 5 + Practice 2 + Life 1 + Backend 1，Han = Backend 3。

- [ ] **Step 1: 改寫 data.ts 開頭，import + 留空陣列**

```ts
// src/api/mock/data.ts (頂部)
import type { ArticleItem, ArticleDetailItem } from '../articleService';
import type { RecommendArticleResponse } from '../recommendService';
import type { TagDetailResponse } from '../tagService';
import { mockMarkdownContent } from './mockArticleContent';
import type { CategoryOption, TagSuggestion, QuotaInfo, EditorArticle, MyArticle, PendingArticle } from '../../types/editor';
import { MOCK_AUTHOR_PROFILES } from './profiles';

const yuan = MOCK_AUTHOR_PROFILES.yuan.nickname;
const han  = MOCK_AUTHOR_PROFILES.han.nickname;
const mira = MOCK_AUTHOR_PROFILES.mira.nickname;
const chen = MOCK_AUTHOR_PROFILES.chen.nickname;

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/800/400`;
}

function rand(seed: number, max: number): number {
  // 用 index 做穩定 pseudo-random，避免每次刷新數字跳動
  const x = Math.sin(seed * 9999) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

const articles2023: ArticleItem[] = [
  // 將在 Step 2 填入 12 篇
];
```

- [ ] **Step 2: 填入 2023 期 12 篇**

把 `articles2023` 內容寫成下列 12 篇（把以下 array literal 整段貼進去）：

```ts
const articles2023: ArticleItem[] = [
  // ── Yuan 9 篇 ──
  {
    uuid: 'a-2023-01', title: '為什麼我又重寫了一次 useTheme()',
    summary: '從 v-bind:class 到 CSS variables，再到 useTheme composable — 兩年內的第三次重構，這次想我終於想清楚了。',
    coverImageUrl: img('a-2023-01'),
    authorNickname: yuan, viewCount: 4120, likeCount: 168, commentCount: 24,
    publishedAt: '2023-04-08',
    tags: ['Vue 3', 'CSS'], categories: ['Frontend'], slug: 'rewriting-use-theme',
  },
  {
    uuid: 'a-2023-02', title: 'TypeScript 的 const generic 解開了我半年的 prop type 苦惱',
    summary: '從 Vue 3.4 開始，type T extends readonly any[] 終於可以推導出 literal tuple，再也不用手動 as const。',
    coverImageUrl: img('a-2023-02'),
    authorNickname: yuan, viewCount: 2890, likeCount: 142, commentCount: 18,
    publishedAt: '2023-04-21',
    tags: ['TypeScript', 'Vue 3'], categories: ['Frontend'], slug: 'const-generic-saved-me',
  },
  {
    uuid: 'a-2023-03', title: 'CSS subgrid 終於可以用了，但我發現它解不了我以為的問題',
    summary: '原本期待 subgrid 能讓 card grid 內的元素垂直對齊，實際試了才發現問題在我的 design system，不在 CSS。',
    coverImageUrl: img('a-2023-03'),
    authorNickname: yuan, viewCount: 3340, likeCount: 156, commentCount: 31,
    publishedAt: '2023-05-12',
    tags: ['CSS'], categories: ['Frontend'], slug: 'subgrid-not-the-answer',
  },
  {
    uuid: 'a-2023-04', title: 'Vite 5 升上去之後，我終於拿掉了三個 polyfill',
    summary: '原本為了 IE11 留的舊 plugin、為 Safari 14 留的 ResizeObserver polyfill — Vite 5 之後這些可以乾淨拔掉。',
    coverImageUrl: img('a-2023-04'),
    authorNickname: yuan, viewCount: 2110, likeCount: 89, commentCount: 12,
    publishedAt: '2023-06-03',
    tags: ['Vite', 'Vue 3'], categories: ['Frontend'], slug: 'vite-5-polyfill-cleanup',
  },
  {
    uuid: 'a-2023-05', title: 'CSS 動畫的時間曲線，我不再用 ease-in-out',
    summary: 'cubic-bezier(0.16, 1, 0.3, 1) 才是我這一年來最常用的 easing — 為什麼？因為它感覺「對」。',
    coverImageUrl: img('a-2023-05'),
    authorNickname: yuan, viewCount: 5210, likeCount: 248, commentCount: 42,
    publishedAt: '2023-07-09',
    tags: ['Animation', 'CSS'], categories: ['Frontend'], slug: 'easing-i-actually-use',
  },
  {
    uuid: 'a-2023-06', title: '我們的 e2e 從 Cypress 搬到 Playwright 之後',
    summary: '速度快了 3 倍、flake 從每週 5 次降到每月 1 次。但我們也踩到三個沒人講的雷。',
    coverImageUrl: img('a-2023-06'),
    authorNickname: yuan, viewCount: 6480, likeCount: 312, commentCount: 58,
    publishedAt: '2023-08-19',
    tags: ['Testing', 'CI/CD'], categories: ['Practice'], slug: 'cypress-to-playwright',
  },
  {
    uuid: 'a-2023-07', title: 'TDD 在前端到底做不做得起來：我做了一年的觀察',
    summary: '我以為前端 TDD 是某種烏托邦，做了一年發現「可以」但條件很挑 — 元件純不純、storybook 在不在。',
    coverImageUrl: img('a-2023-07'),
    authorNickname: yuan, viewCount: 4720, likeCount: 198, commentCount: 67,
    publishedAt: '2023-10-04',
    tags: ['TDD', 'Testing'], categories: ['Practice'], slug: 'frontend-tdd-one-year-in',
  },
  {
    uuid: 'a-2023-08', title: '我為什麼想搞懂自己 API 的 N+1 問題',
    summary: '前端工程師不該只丟 issue 給後端。某天 Han 說「你看一下 console」之後，我學會看 PostgreSQL 的 EXPLAIN ANALYZE。',
    coverImageUrl: img('a-2023-08'),
    authorNickname: yuan, viewCount: 3160, likeCount: 134, commentCount: 28,
    publishedAt: '2023-11-15',
    tags: ['PostgreSQL', 'Performance'], categories: ['Backend'], slug: 'frontend-cares-about-n-plus-one',
  },
  {
    uuid: 'a-2023-09', title: '從工程師轉去做技術 lead 的第一年我學到什麼',
    summary: '不是技術判斷，不是溝通，而是「忍住不寫 code」。我用了一整年才學會把鍵盤交給隊友。',
    coverImageUrl: img('a-2023-09'),
    authorNickname: yuan, viewCount: 8120, likeCount: 421, commentCount: 89,
    publishedAt: '2023-12-22',
    tags: ['Career'], categories: ['Life'], slug: 'first-year-as-tech-lead',
  },
  // ── Han 3 篇 ──
  {
    uuid: 'a-2023-10', title: 'Spring Boot 3.2 的 Virtual Threads 真的可以用了嗎',
    summary: '生產環境跑了三個月，QPS 提升 4 倍但有兩個 pinning 雷。整理我們踩到的所有問題。',
    coverImageUrl: img('a-2023-10'),
    authorNickname: han, viewCount: 5890, likeCount: 287, commentCount: 51,
    publishedAt: '2023-09-02',
    tags: ['Spring', 'Performance'], categories: ['Backend'], slug: 'virtual-threads-in-production',
  },
  {
    uuid: 'a-2023-11', title: 'PostgreSQL 14 的 SEARCH 跟 CYCLE 子句真的不夠看',
    summary: '為了組織樹遞迴查詢，我們從 hard-coded recursive CTE 改成 SEARCH BREADTH，結果 plan 反而變糟。',
    coverImageUrl: img('a-2023-11'),
    authorNickname: han, viewCount: 2340, likeCount: 98, commentCount: 19,
    publishedAt: '2023-10-18',
    tags: ['PostgreSQL'], categories: ['Backend'], slug: 'pg-recursive-cte-pitfall',
  },
  {
    uuid: 'a-2023-12', title: 'Redis Streams 取代 Kafka 的三個適用場景',
    summary: '不是每個 event-driven system 都需要 Kafka 的 partitioning。當 throughput < 10k/s，Redis Streams 是更便宜的選擇。',
    coverImageUrl: img('a-2023-12'),
    authorNickname: han, viewCount: 4180, likeCount: 211, commentCount: 36,
    publishedAt: '2023-12-05',
    tags: ['Redis', 'Microservices'], categories: ['Backend'], slug: 'redis-streams-vs-kafka',
  },
];
```

- [ ] **Step 3: 改 `allMockArticles` export 為臨時只含 articles2023**

```ts
// 同檔案，舊的 baseMockArticles / lifeMockArticles 全部刪除
export const allMockArticles: ArticleItem[] = [
  ...articles2023,
];
```

保留 `getMockArticleDetail` 函數不動。

- [ ] **Step 4: 跑 data.test.ts 看當前狀態**

```bash
npx vitest run src/api/mock/data.test.ts
```
Expected: 仍多項 fail（總數 12 ≠ 30、作者數差、時間分布只有 2023），但 import 應該能 resolve、tag 應全部 from ALL_MOCK_TAGS。

- [ ] **Step 5: Commit**

```bash
git add src/api/mock/data.ts
git commit -m "feat(mock): Phase 1 寫入 2023 期 12 篇文章"
```

---

## Task 5: 寫 2024 期 10 篇

**Files:**
- Modify: `src/api/mock/data.ts`

Yuan 5 + Han 2 + Mira 2 + Chen 1。Mira/Chen 在 2024 首次登場。主題：Yuan = Frontend 2(React, Tailwind) + Design 1 + Practice 1 + Life 1，Han = Backend 2(Microservices, Performance)，Mira = Design 1 + Frontend 1，Chen = Life 1。

- [ ] **Step 1: 在 articles2023 後加入 articles2024**

```ts
const articles2024: ArticleItem[] = [
  // ── Yuan 5 篇 ──
  {
    uuid: 'a-2024-01', title: '我把 React 加進原本純 Vue 的專案，後悔了三件事',
    summary: '為了 hire 而引入 React，預期省的時間都被吃掉了。寫給「想 hybrid」的 lead 看的決策後悔錄。',
    coverImageUrl: img('a-2024-01'),
    authorNickname: yuan, viewCount: 9210, likeCount: 487, commentCount: 124,
    publishedAt: '2024-01-14',
    tags: ['React', 'Vue 3'], categories: ['Frontend'], slug: 'mixing-react-into-vue',
  },
  {
    uuid: 'a-2024-02', title: 'Tailwind v4 的 oklch 配色，我終於理解 design token 該怎麼設計',
    summary: '從 hex 到 hsl 到 oklch，每換一次都覺得是工具進步。實際是我的色彩思維在被工具教育。',
    coverImageUrl: img('a-2024-02'),
    authorNickname: yuan, viewCount: 6420, likeCount: 318, commentCount: 47,
    publishedAt: '2024-03-22',
    tags: ['Tailwind', 'Design System', 'Color'], categories: ['Frontend'], slug: 'tailwind-v4-oklch',
  },
  {
    uuid: 'a-2024-03', title: '我的 design token 命名規則第三次大改',
    summary: 'color.brand.primary → color.action.primary → semantic.action — 為什麼我又改名了。',
    coverImageUrl: img('a-2024-03'),
    authorNickname: yuan, viewCount: 3890, likeCount: 187, commentCount: 26,
    publishedAt: '2024-06-08',
    tags: ['Design System', 'CSS'], categories: ['Design'], slug: 'design-token-naming-v3',
  },
  {
    uuid: 'a-2024-04', title: 'GitHub Actions 裡 cache vue 的 .vite 整整省了 8 分鐘',
    summary: 'cache key 設計這件事很容易做錯。我們的 CI 從 12 分鐘降到 4 分鐘，主要靠正確的 hash 來源。',
    coverImageUrl: img('a-2024-04'),
    authorNickname: yuan, viewCount: 2780, likeCount: 124, commentCount: 19,
    publishedAt: '2024-08-30',
    tags: ['CI/CD', 'Vite'], categories: ['Practice'], slug: 'gha-vite-cache-saved-8min',
  },
  {
    uuid: 'a-2024-05', title: '《Working in Public》看完之後我重新想了一遍 open source',
    summary: '我以為 open source 是給予，看完才知道大部分時間是 housekeeping。Nadia 把 maintainer 的累寫得很準。',
    coverImageUrl: img('a-2024-05'),
    authorNickname: yuan, viewCount: 4310, likeCount: 234, commentCount: 38,
    publishedAt: '2024-11-17',
    tags: ['Books'], categories: ['Life'], slug: 'working-in-public-rereading',
  },
  // ── Han 2 篇 ──
  {
    uuid: 'a-2024-06', title: '微服務拆分的時候，我們做錯的三件事',
    summary: '把 monolith 拆成 12 個 service 之後，我們花了 8 個月把它縮回 5 個。寫給「想拆」的團隊看。',
    coverImageUrl: img('a-2024-06'),
    authorNickname: han, viewCount: 7240, likeCount: 389, commentCount: 92,
    publishedAt: '2024-04-11',
    tags: ['Microservices'], categories: ['Backend'], slug: 'microservices-three-mistakes',
  },
  {
    uuid: 'a-2024-07', title: 'Spring 的 @Async 真的不是「丟到 thread pool」這麼簡單',
    summary: '我們的 Async task 在 prod 偶發 thread starvation，追了三天才發現是 propagation context 的問題。',
    coverImageUrl: img('a-2024-07'),
    authorNickname: han, viewCount: 4920, likeCount: 248, commentCount: 56,
    publishedAt: '2024-09-25',
    tags: ['Spring', 'Performance'], categories: ['Backend'], slug: 'spring-async-pitfall',
  },
  // ── Mira 2 篇（首次登場） ──
  {
    uuid: 'a-2024-08', title: '我們建立 design system 的第一年，學到了什麼（首篇客座）',
    summary: '從 Figma 變數到實際 production CSS variable，看似一條線，實際上中間斷掉的地方比連起來的還多。',
    coverImageUrl: img('a-2024-08'),
    authorNickname: mira, viewCount: 5610, likeCount: 287, commentCount: 64,
    publishedAt: '2024-02-29',
    tags: ['Design System', 'Typography'], categories: ['Design'], slug: 'design-system-first-year',
  },
  {
    uuid: 'a-2024-09', title: 'Hover state 不該只是換顏色 — 用圖層思維設計按鈕',
    summary: '一個按鈕有 5 層：base、shadow、border、icon、label。每層在 hover 時的反應應該獨立想，不是統一變色。',
    coverImageUrl: img('a-2024-09'),
    authorNickname: mira, viewCount: 6780, likeCount: 342, commentCount: 51,
    publishedAt: '2024-07-03',
    tags: ['CSS', 'Animation'], categories: ['Frontend'], slug: 'hover-state-as-layers',
  },
  // ── Chen 1 篇（首次登場） ──
  {
    uuid: 'a-2024-10', title: '《Deep Work》之後，我把通知全關掉的第 90 天（首篇客座）',
    summary: '不是 Cal Newport 那種極端版本。我留下 Slack mention 跟手機電話，其他全關。三個月後的觀察。',
    coverImageUrl: img('a-2024-10'),
    authorNickname: chen, viewCount: 8420, likeCount: 451, commentCount: 78,
    publishedAt: '2024-10-12',
    tags: ['Productivity', 'Books'], categories: ['Life'], slug: 'deep-work-day-90',
  },
];

// 把 articles2024 加進 export
export const allMockArticles: ArticleItem[] = [
  ...articles2023,
  ...articles2024,
];
```

- [ ] **Step 2: 跑 data.test.ts**

```bash
npx vitest run src/api/mock/data.test.ts
```
Expected: 2023 + 2024 = 22 篇仍 < 30，但 2024 斷言應通過、Mira/Chen 數對。

- [ ] **Step 3: Commit**

```bash
git add src/api/mock/data.ts
git commit -m "feat(mock): Phase 1 寫入 2024 期 10 篇 + Mira/Chen 首次登場"
```

---

## Task 6: 寫 2025-2026 期 8 篇

**Files:**
- Modify: `src/api/mock/data.ts`

Yuan 5 + Han 1 + Mira 1 + Chen 1。Yuan = Frontend 2(Vue 3 進階, TypeScript) + Practice 1(Testing) + Design 1(Typography) + Life 1(Remote Work)；Han = Backend 1(Go)；Mira = Design 1(Motion)；Chen = Life 1(Books)。

- [ ] **Step 1: 加入 articles2025_2026**

```ts
const articles2025_2026: ArticleItem[] = [
  // ── 2025 ──
  {
    uuid: 'a-2025-01', title: 'Vue 3.5 的 useTemplateRef 改寫了我所有 ref 的習慣',
    summary: '不再 `const el = ref<HTMLElement>()` + `defineExpose`。useTemplateRef 把這個流程縮成一行，且 type 推得更準。',
    coverImageUrl: img('a-2025-01'),
    authorNickname: yuan, viewCount: 11240, likeCount: 568, commentCount: 134,
    publishedAt: '2025-02-18',
    tags: ['Vue 3', 'TypeScript'], categories: ['Frontend'], slug: 'use-template-ref-changed-everything',
  },
  {
    uuid: 'a-2025-02', title: 'TypeScript 5.5 的 inferred type predicate 解決了我寫 filter 的 N 種糟糕方法',
    summary: '`array.filter(Boolean as any)`、`as Foo[]` 之類的 hack 終於可以下架。這個小改動的影響比想像中大。',
    coverImageUrl: img('a-2025-02'),
    authorNickname: yuan, viewCount: 7680, likeCount: 412, commentCount: 87,
    publishedAt: '2025-05-09',
    tags: ['TypeScript'], categories: ['Frontend'], slug: 'ts-55-inferred-predicate',
  },
  {
    uuid: 'a-2025-03', title: '為什麼我又重寫了 component 測試 — Testing Library 的第三次回頭',
    summary: '從 Jest snapshot 到 Vitest + Vue Test Utils 到 Testing Library 再回 VTU。每個工具都有適合的場景，但我終於知道怎麼選了。',
    coverImageUrl: img('a-2025-03'),
    authorNickname: yuan, viewCount: 5240, likeCount: 234, commentCount: 56,
    publishedAt: '2025-08-21',
    tags: ['Testing', 'Vue 3'], categories: ['Practice'], slug: 'rewriting-component-tests-again',
  },
  {
    uuid: 'a-2025-04', title: 'Inter 換成 Geist 之後我才發現字型對 layout 的影響有多大',
    summary: '同樣 16px、line-height 1.5，換字型之後整個頁面的「重量」變了。Typography 從來不只是字體選擇。',
    coverImageUrl: img('a-2025-04'),
    authorNickname: yuan, viewCount: 6320, likeCount: 318, commentCount: 71,
    publishedAt: '2025-11-04',
    tags: ['Typography', 'Design System'], categories: ['Design'], slug: 'inter-to-geist',
  },
  {
    uuid: 'a-2025-05', title: '遠端工作三年，我終於不再嘗試「模擬辦公室」',
    summary: '從同步 standup、screen share pair programming 到完全 async — 我花了三年才學會 remote 的真正規則。',
    coverImageUrl: img('a-2025-05'),
    authorNickname: yuan, viewCount: 9810, likeCount: 521, commentCount: 142,
    publishedAt: '2025-12-19',
    tags: ['Remote Work', 'Career'], categories: ['Life'], slug: 'remote-three-years-in',
  },
  // ── Han 1 篇 ──
  {
    uuid: 'a-2025-06', title: '從 Java 跳 Go 一年，我懷念的跟我不懷念的',
    summary: '懷念 Stream API 跟 Lombok。不懷念 ClassNotFoundException 跟 Spring 的 magic auto-config。對 nil 仍有恨。',
    coverImageUrl: img('a-2025-06'),
    authorNickname: han, viewCount: 8740, likeCount: 467, commentCount: 158,
    publishedAt: '2025-06-26',
    tags: ['Go'], categories: ['Backend'], slug: 'java-to-go-one-year',
  },
  // ── Mira 1 篇 ──
  {
    uuid: 'a-2025-07', title: 'Motion design 在 web 上的克制 — 我們刪掉了 80% 的 transition',
    summary: '把 design system 裡所有 100ms 以下的 transition 全部移除之後，UI 反而感覺「更快」。為什麼？',
    coverImageUrl: img('a-2025-07'),
    authorNickname: mira, viewCount: 5420, likeCount: 289, commentCount: 47,
    publishedAt: '2025-04-15',
    tags: ['Motion', 'Animation'], categories: ['Design'], slug: 'restraint-in-motion',
  },
  // ── 2026 ──
  {
    uuid: 'a-2026-01', title: '《How to Take Smart Notes》之後我重做了我的 markdown vault',
    summary: 'Sönke 的 Zettelkasten 不是 note-taking 系統，是寫作系統。我花了一個月把 800 篇 obsidian note 全部重整。',
    coverImageUrl: img('a-2026-01'),
    authorNickname: chen, viewCount: 6890, likeCount: 354, commentCount: 89,
    publishedAt: '2026-03-08',
    tags: ['Books', 'Productivity'], categories: ['Life'], slug: 'smart-notes-rebuild-vault',
  },
];

export const allMockArticles: ArticleItem[] = [
  ...articles2023,
  ...articles2024,
  ...articles2025_2026,
];
```

- [ ] **Step 2: 跑 data.test.ts 全部斷言**

```bash
npx vitest run src/api/mock/data.test.ts
```
Expected: PASS — 30 篇 / 作者占比 / 時間分布 / tag 全覆蓋（24/24）/ 每篇欄位 OK

如果某個 tag 沒被覆蓋（例如 PostgreSQL 在 Yuan 篇用了，但 Vite 是否覆蓋？），調整某篇的 tag 補上。**核對 24 個 tag 都至少 1 次出現** 是 Phase 1 的硬要求，必要時調整現有篇 tags。

- [ ] **Step 3: Commit**

```bash
git add src/api/mock/data.ts
git commit -m "feat(mock): Phase 1 寫入 2025-2026 期 8 篇，30 篇齊備"
```

---

## Task 7: 修受影響的既有 unit 測試

**Files:**
- Modify: `src/api/mock/articleMockService.test.ts`
- Modify: 其他出現 fail 的 test 檔

新 mock data 不再有「偶數 Frontend / 奇數 Backend」「第一篇 title === 'Vue ...'」等規律，需更新斷言。

- [ ] **Step 1: 跑全部 unit test 找出 fail**

```bash
npx vitest run --reporter=line 2>&1 | grep -E "FAIL|×"
```

- [ ] **Step 2: 修 `articleMockService.test.ts`**

把以下兩種 hard-coded 假設替換：

`// 舊` (大概在 line 121 附近)：
```ts
expect(result!.title).toContain('Vue');
```
`// 新`：改用一個確定存在的 uuid，斷言 title 不為空：
```ts
expect(result!.title.length).toBeGreaterThan(0);
expect(result!.uuid).toBe(<該測試使用的 uuid>);
```

關於 keyword 'Vue' 搜尋測試 (line 50-58)：應仍可通過，因 Phase 1 含多篇 Vue 3 文章。若該測試斷言「結果非空」即可保留；若斷言具體篇數則改 `.length).toBeGreaterThan(0)`。

關於 category 'Frontend' 過濾 (line 63-70)：仍可通過，Phase 1 仍有 Frontend categories。

- [ ] **Step 3: 修 `data.test.ts` 舊區塊**

舊檔案中「偶數索引文章為前端主題」此區塊已被新斷言取代（在 Task 3），但若 grep 還有殘留請刪除。

- [ ] **Step 4: 修 `recommendMockService.test.ts`**

`recommendMockService.test.ts:54` 斷言 `result.length === allMockArticles.length`，仍對（30 = 30）。檢查其他 hard-coded 篇數、標題斷言。

- [ ] **Step 5: 跑全部 unit test 確認 Green**

```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```
Expected: All pass (~949 + 新增 8 個 = ~957 範圍)

- [ ] **Step 6: Commit**

```bash
git add src/api/mock/articleMockService.test.ts src/api/mock/recommendMockService.test.ts src/api/mock/data.test.ts
git commit -m "test(mock): 更新既有測試以對齊 Phase 1 mock data 結構"
```

---

## Task 8: 修受影響的 e2e 測試

**Files:**
- Modify: 各 `e2e/mock/*.spec.ts` 中 hard-coded 失效的部分

- [ ] **Step 1: 跑全部 mock e2e**

```bash
E2E_MOCK=1 npx playwright test --reporter=line 2>&1 | tail -30
```

- [ ] **Step 2: 逐一處理 fail spec**

可能會 fail 的：
- `e2e/mock/new-pages.spec.ts` 內 Tag cloud 黑名單 — 如果該測試假設 'Java' / 'Spring' 不存在，但 Phase 1 的 tag 集合包含 'Spring'，要更新黑名單
- TagsIndexView 顯示的 tag 數從 8 → 24，可能影響任何「一定出現幾個 chip」的斷言
- Archive 預期年份：原本只有 2026 一年，現在會有 2023/2024/2025/2026 四個 year group。任何 hard-coded 年份斷言要更新
- Trending / Latest 預期文章數仍由 service 決定，不受影響

策略：每個 fail 的測試逐一檢視 → 把 hard-coded value 改為「結構性斷言」（如「至少 N 個」「包含 X」）而非「精確等於」。

- [ ] **Step 3: 跑全部 mock e2e 確認 Green**

```bash
E2E_MOCK=1 npx playwright test --reporter=dot 2>&1 | tail -5
```
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add e2e/mock/
git commit -m "test(e2e): 更新 mock e2e 對齊 Phase 1 mock data 結構"
```

---

## Task 9: 整合驗證 + 手動 smoke test

**Files:** 無

- [ ] **Step 1: 跑全部 unit + e2e**

```bash
npx vitest run --reporter=dot 2>&1 | tail -5
E2E_MOCK=1 npx playwright test --reporter=dot 2>&1 | tail -5
```
Expected: 兩邊全綠

- [ ] **Step 2: 啟動 dev server (mock mode)**

```bash
VITE_USE_MOCK=true npx vite --port 5173 &
```

- [ ] **Step 3: 用 playwright-cli 巡視首頁與相關頁面**

```bash
playwright-cli open http://localhost:5173/
playwright-cli screenshot --filename=phase1-home.png
playwright-cli goto http://localhost:5173/articles
playwright-cli screenshot --filename=phase1-articles.png
playwright-cli goto http://localhost:5173/archive
playwright-cli screenshot --filename=phase1-archive.png
playwright-cli goto http://localhost:5173/tags
playwright-cli screenshot --filename=phase1-tags.png
```

確認視覺：
- 首頁 Trending / Latest / HotTags 顯示新標題、新作者、新 tag
- Archive 出現 4 個 year group (2023 ~ 2026)
- TagsIndex tag cloud 顯示 24 個 tag

- [ ] **Step 4: 關閉 dev server，清掉截圖**

```bash
playwright-cli close-all
taskkill //F //IM node.exe
rm -f phase1-*.png
```

- [ ] **Step 5: Push branch**

```bash
git push -u origin feat/mock-data-phase1
```

- [ ] **Step 6: 開 PR (Yuan 確認後執行)**

```bash
gh pr create --base develop --title "feat(mock): mock data 擴充 Phase 1 — 4 位作者 + 24 tag + 30 篇示範" --body "$(cat <<'EOF'
## Summary
- 實作 `ai-docs/specs/2026-05-05-mock-data-expansion-design.md` 的 **Phase 1**（共三 Phase）
- 新增 4 位作者 metadata（Yuan / Han / Mira / Chen）與 24 個 tag 5 分類常數
- 重寫 `allMockArticles` 為 30 篇個性化文章（涵蓋 2023-04 ~ 2026-04 三年時間骨架）
- 24 個 tag 全部至少出現 1 次

## Phase 範圍
- ✅ Phase 1（本 PR）：骨架 + 30 篇示範
- ⏳ Phase 2：補滿到 105 篇 list 資料
- ⏳ Phase 3：每篇 markdown body 個性化

## Test plan
- [x] Unit: `npx vitest run` — 全綠
- [x] E2E (mock): `E2E_MOCK=1 npx playwright test` — 全綠
- [x] 手測：首頁 / Articles / Archive / TagsIndex 視覺檢查通過

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

- ✅ 30 篇 metadata 全部已列出（沒留 placeholder）
- ✅ 24 個 tag 都覆蓋驗證（Task 6 Step 2 強調）
- ⚠️ Task 7 的「逐一修 fail」需要 implementation 階段現場判斷，但已給策略指引
- ⚠️ Task 8 的 e2e fail 同上
- ✅ TDD 順序：profiles/tagRegistry → data.test (Red) → data.ts 三批 → 修既有測試
- ✅ 每個 task 結尾都有 commit step
- ✅ 沒有「跟 Task N 類似」的省略 — 每個 step 完整代碼都列出
