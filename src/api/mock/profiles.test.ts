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
