import type { TagDetailResponse } from '../tagService';
import type { TagDetail } from '../../types/editor';
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

// 模擬標籤詳情資料（TagDetail 完整結構）
const mockTagDetails: TagDetail[] = allMockTags.map((tag) => ({
  uuid: tag.uuid,
  name: tag.name,
  slug: tag.slug,
  color: '#64748b',
  icon: 'tag',
  description: `關於 #${tag.name} 的所有文章與紀錄。`,
  usageCount: tag.articleCount,
  followed: false,
}));

// 根據 slug 取得標籤詳情
export function getTagBySlugMock(slug: string): Promise<TagDetail | null> {
  return Promise.resolve(mockTagDetails.find(t => t.slug === slug) ?? null);
}

// 追蹤標籤（no-op）
export function followTagMock(_id: string): Promise<void> {
  return Promise.resolve();
}

// 取消追蹤標籤（no-op）
export function unfollowTagMock(_id: string): Promise<void> {
  return Promise.resolve();
}
