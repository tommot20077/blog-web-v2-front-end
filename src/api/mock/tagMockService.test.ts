import { getHotTagsMock } from './tagMockService';

describe('tagMockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('回傳指定數量的熱門標籤', async () => {
    const promise = getHotTagsMock(10);
    vi.advanceTimersByTime(300);
    const result = await promise;

    expect(result).toHaveLength(10);
  });

  it('回傳結果按 articleCount 降序排列', async () => {
    const promise = getHotTagsMock(20);
    vi.advanceTimersByTime(300);
    const result = await promise;

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].articleCount).toBeGreaterThanOrEqual(result[i].articleCount);
    }
  });

  it('每筆結果包含 TagDetailResponse 所有欄位', async () => {
    const promise = getHotTagsMock(5);
    vi.advanceTimersByTime(300);
    const result = await promise;

    for (const tag of result) {
      expect(tag).toHaveProperty('uuid');
      expect(tag).toHaveProperty('name');
      expect(tag).toHaveProperty('slug');
      expect(tag).toHaveProperty('articleCount');
    }
  });

  it('limit 超過資料總量時回傳全部', async () => {
    const promise = getHotTagsMock(100);
    vi.advanceTimersByTime(300);
    const result = await promise;

    expect(result).toHaveLength(20);
  });
});
