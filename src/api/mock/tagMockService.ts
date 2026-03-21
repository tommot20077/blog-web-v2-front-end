import type { TagDetailResponse } from '../tagService';
import { allMockTags } from './data';

// 模擬熱門標籤服務：依照 articleCount 排序取前 N 個
export function getHotTagsMock(limit: number): Promise<TagDetailResponse[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sorted = [...allMockTags].sort((a, b) => b.articleCount - a.articleCount);
      resolve(sorted.slice(0, limit));
    }, 300);
  });
}
