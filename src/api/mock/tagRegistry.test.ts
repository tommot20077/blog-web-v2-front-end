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
