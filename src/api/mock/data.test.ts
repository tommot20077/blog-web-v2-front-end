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
