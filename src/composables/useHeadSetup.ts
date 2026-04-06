import { useHead } from '@unhead/vue';

const SITE_NAME = 'MY BLOG WEB.';
const SITE_TITLE = `${SITE_NAME} | 技術部落格`;
const SITE_DESCRIPTION = '分享前後端技術、架構設計與開發實踐的個人技術部落格。';

/**
 * 首頁 SEO / AEO 設定
 *
 * 提供：
 *  - 動態 <title> 與 <meta name="description">
 *  - Open Graph 標籤
 *  - JSON-LD 結構化資料（WebSite + Blog Schema）
 *
 * 在 app 中未 provide head（例如單元測試未註冊 @unhead/vue plugin）時，
 * 會靜默略過 useHead 的執行，但仍回傳所有資料供測試驗證。
 */
export function useHeadSetup() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const ogTags = [
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: SITE_DESCRIPTION },
    { property: 'og:url', content: siteUrl },
  ];

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        inLanguage: 'zh-Hant',
      },
      {
        '@type': 'Blog',
        name: SITE_TITLE,
        url: siteUrl,
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
  } catch (error) {
    if (import.meta.env.MODE !== 'test') {
      console.warn('[useHeadSetup] Failed to apply head metadata via useHead:', error);
    }
  }

  return { title: SITE_TITLE, description: SITE_DESCRIPTION, ogTags, jsonLd, siteUrl };
}
