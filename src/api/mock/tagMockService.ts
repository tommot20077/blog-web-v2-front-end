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

const followedTagIds = new Set<string>();

export function resetTagMockState(): void {
  followedTagIds.clear();
}

export function seedFollowedTag(id: string): void {
  followedTagIds.add(id);
}

// 根據 slug 取得標籤詳情
export function getTagBySlugMock(slug: string): Promise<TagDetail | null> {
  const detail = mockTagDetails.find(t => t.slug === slug);
  if (!detail) return Promise.resolve(null);
  return Promise.resolve({ ...detail, followed: followedTagIds.has(detail.uuid) });
}

// 追蹤標籤
export function followTagMock(id: string): Promise<void> {
  followedTagIds.add(id);
  return Promise.resolve();
}

// 取消追蹤標籤
export function unfollowTagMock(id: string): Promise<void> {
  followedTagIds.delete(id);
  return Promise.resolve();
}
