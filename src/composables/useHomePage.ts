import { ref, onMounted } from 'vue';
import type { ArticleItem } from '../api/articleService';
import { articleService } from '../api/articleService';
import type { RecommendArticleResponse } from '../api/recommendService';
import { recommendService } from '../api/recommendService';
import type { TagDetailResponse } from '../api/tagService';
import { tagService } from '../api/tagService';
import { mockZoneEntries, type ZoneEntry } from '../api/mock/data';

export function useHomePage() {
  const trendingArticles = ref<RecommendArticleResponse[]>([]);
  const latestArticles = ref<ArticleItem[]>([]);
  const hotTags = ref<TagDetailResponse[]>([]);
  const zoneEntries = ref<ZoneEntry[]>([]);

  const isLoadingTrending = ref(false);
  const isLoadingLatest = ref(false);
  const isLoadingTags = ref(false);

  async function fetchTrending() {
    isLoadingTrending.value = true;
    try {
      trendingArticles.value = await recommendService.getTrending('7d', 6);
    } finally {
      isLoadingTrending.value = false;
    }
  }

  async function fetchLatest() {
    isLoadingLatest.value = true;
    try {
      const result = await articleService.getArticles(1, 6, '全部', '');
      latestArticles.value = result.records;
    } finally {
      isLoadingLatest.value = false;
    }
  }

  async function fetchHotTags() {
    isLoadingTags.value = true;
    try {
      hotTags.value = await tagService.getHotTags(20);
    } finally {
      isLoadingTags.value = false;
    }
  }

  function fetchZoneEntries() {
    // Zone 目前使用靜態 mock 資料
    zoneEntries.value = mockZoneEntries;
  }

  async function fetchAll() {
    fetchZoneEntries();
    await Promise.allSettled([
      fetchTrending(),
      fetchLatest(),
      fetchHotTags(),
    ]);
  }

  onMounted(() => {
    fetchAll();
  });

  return {
    trendingArticles,
    latestArticles,
    hotTags,
    zoneEntries,
    isLoadingTrending,
    isLoadingLatest,
    isLoadingTags,
    fetchAll,
  };
}
