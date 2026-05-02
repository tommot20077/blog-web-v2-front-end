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
const mockTagDetails: TagDetail[] = [
  { uuid: 'tag-1', name: 'Vue', slug: 'vue', color: '#42b883', icon: 'vue-icon', description: 'Vue.js 前端框架', usageCount: 18, followed: false },
  { uuid: 'tag-2', name: 'React', slug: 'react', color: '#61dafb', icon: 'react-icon', description: 'React 前端框架', usageCount: 12, followed: false },
  { uuid: 'tag-3', name: 'TypeScript', slug: 'typescript', color: '#3178c6', icon: 'ts-icon', description: 'TypeScript 程式語言', usageCount: 15, followed: false },
  { uuid: 'tag-4', name: 'Tailwind CSS', slug: 'tailwind-css', color: '#38bdf8', icon: 'tailwind-icon', description: 'Utility-first CSS 框架', usageCount: 9, followed: false },
  { uuid: 'tag-5', name: 'Node.js', slug: 'nodejs', color: '#339933', icon: 'node-icon', description: 'Node.js 後端執行環境', usageCount: 11, followed: false },
];

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
