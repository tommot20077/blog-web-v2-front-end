import { useHead } from '@unhead/vue';

const SITE_NAME = 'MY BLOG WEB.';
const SITE_TITLE = `${SITE_NAME} | 技術部落格`;
const SITE_DESCRIPTION = '分享前後端技術、架構設計與開發實踐的個人技術部落格。';
const SITE_URL = 'https://myblogweb.com'; // 可依實際 production URL 替換

const ogTags = [
  { property: 'og:type', content: 'website' },
  { property: 'og:title', content: SITE_TITLE },
  { property: 'og:description', content: SITE_DESCRIPTION },
  { property: 'og:url', content: SITE_URL },
];

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'zh-Hant',
    },
    {
      '@type': 'Blog',
      name: SITE_TITLE,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'zh-Hant',
      author: {
        '@type': 'Person',
        name: 'Yuan',
        url: 'https://github.com/tommot20077',
      },
    },
  ],
});

/**
 * 首頁 SEO / AEO 設定
 *
 * 提供：
 *  - 動態 <title> 與 <meta name="description">
 *  - Open Graph 標籤
 *  - JSON-LD 結構化資料（WebSite + Blog Schema）
 *
 * 在沒有安裝 @unhead/vue 的環境（如單元測試）中會靜默略過 useHead，
 * 但仍回傳所有資料供測試驗證。
 */
export function useHeadSetup() {
  try {
    useHead({
      title: SITE_TITLE,
      meta: [
        { name: 'description', content: SITE_DESCRIPTION },
        ...ogTags.map((tag) => ({ property: tag.property, content: tag.content })),
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: jsonLd,
        },
      ],
    });
  } catch {
    // 在測試環境或未安裝 head plugin 時靜默略過
  }

  // 回傳供測試驗證用（不依賴真實 DOM / head plugin）
  return { title: SITE_TITLE, description: SITE_DESCRIPTION, ogTags, jsonLd };
}

