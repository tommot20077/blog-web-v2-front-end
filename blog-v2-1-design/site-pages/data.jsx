/* global React */
const { useState, useMemo, useEffect } = React;

/* ============================================================
   Mock data — shared across pages
   ============================================================ */
window.SITE_POSTS = [
  { slug: 'design-system-rewrite', title: '把整個 Blog 收斂成 800 行 tokens。', date: '2026-04-15', tags: ['design-system','css','tokens'], series: 'design-system-rewrite', seriesIdx: 3, excerpt: '三個月、兩次重寫、一個 design system。我把 1,820 行的 v1 砍成 802 行的 v2。', readMin: 8 },
  { slug: 'usetheme-rewrite-3', title: 'useTheme() 的第三次重構。', date: '2026-04-08', tags: ['vue','composables'], excerpt: '從 React Context 到 Vue provide/inject，再到一個全域 ref()。每一次重構都讓我更愛 Vue。', readMin: 6 },
  { slug: 'grayscale', title: '灰階不是偷懶的藉口。', date: '2026-04-02', tags: ['css','design-system'], series: 'design-system-rewrite', seriesIdx: 2, excerpt: '一個 #f4f4f4 + 一個 #0a0a0b 就足以撐起整個站。', readMin: 5 },
  { slug: 'leaving-pinia', title: '我為什麼離開 Pinia。', date: '2026-03-26', tags: ['vue','state'], excerpt: '不是 Pinia 不好，是我不再需要 store。', readMin: 7 },
  { slug: 'tdd-vue3', title: 'Vue 3 + Vitest 的 TDD 流程。', date: '2026-03-18', tags: ['vue','testing','tdd'], excerpt: '紅綠重構，三秒一個迴圈。', readMin: 10 },
  { slug: 'why-i-rewrote-twice', title: '一個 design system，兩次重寫。', date: '2026-03-09', tags: ['design-system','reflection'], series: 'design-system-rewrite', seriesIdx: 1, excerpt: '第一次是 over-engineering，第二次是 under-thinking。', readMin: 9 },
  { slug: 'oklch-in-real-life', title: 'OKLCH 在真實專案裡的樣子。', date: '2026-02-28', tags: ['css','color'], excerpt: '理論很美，實務很雷。我列出 5 個你會踩的坑。', readMin: 6 },
  { slug: 'fluid-typography', title: 'clamp() 是新的 8 階字級。', date: '2026-02-15', tags: ['css','typography'], excerpt: '別再 sm/md/lg 了。一行 clamp() 解決所有事。', readMin: 4 },
  { slug: 'dont-use-rem-for-everything', title: '不要每個地方都用 rem。', date: '2026-02-04', tags: ['css'], excerpt: 'em、rem、px、%、vw、vh — 六個單位的合適場合。', readMin: 8 },
  { slug: 'figma-tokens-export', title: 'Figma 變數 → CSS 的最後一哩路。', date: '2026-01-21', tags: ['design-system','figma','tokens'], excerpt: 'Tokens Studio plugin 後的腳本一條龍。', readMin: 7 },
  { slug: 'when-to-not-use-flex', title: '什麼時候不該用 Flex。', date: '2026-01-10', tags: ['css'], excerpt: 'Grid 不是 Flex 的進階版，是另一個工具。', readMin: 5 },
  { slug: 'vue-pinia-vs-ref', title: 'Pinia store vs. 全域 ref()。', date: '2025-12-22', tags: ['vue','state'], excerpt: '什麼時候選哪個？我的判斷標準。', readMin: 6 },
  { slug: 'composables-pattern', title: 'Composables 的 8 個寫法。', date: '2025-12-08', tags: ['vue','composables'], excerpt: '從 useToggle 到 useFetch，模式整理。', readMin: 11 },
  { slug: 'design-system-v1-postmortem', title: 'Design System v1 死亡報告。', date: '2025-11-29', tags: ['design-system','reflection'], excerpt: '當你的 token 比元件還多，就是該砍掉重練了。', readMin: 8 },
];

window.SITE_SERIES = [
  {
    id: 'design-system-rewrite',
    title: 'Design System 重寫日記',
    desc: '從 v1 的 1,820 行 → v2 的 802 行。三個月、兩次重寫的全紀錄。',
    total: 5,
    posts: [
      { idx: 1, slug: 'why-i-rewrote-twice', title: '一個 design system，兩次重寫。', date: '2026-03-09', state: 'done' },
      { idx: 2, slug: 'grayscale', title: '灰階不是偷懶的藉口。', date: '2026-04-02', state: 'done' },
      { idx: 3, slug: 'design-system-rewrite', title: '把整個 Blog 收斂成 800 行 tokens。', date: '2026-04-15', state: 'cur' },
      { idx: 4, slug: '', title: 'Dark mode 的 OKLCH 解法。', date: '預計 2026-05', state: 'next' },
      { idx: 5, slug: '', title: '結語：什麼時候該重寫，什麼時候該重構。', date: '預計 2026-06', state: 'next' },
    ],
  },
];

/* ============================================================
   Shared TopBar + Footer
   ============================================================ */
window.SitePagesTopBar = function SitePagesTopBar({ active, onCmd, theme, toggle }) {
  const items = [
    { id: 'home', label: 'Home', href: 'Refinements v3 — AI & SEO.html' },
    { id: 'archive', label: 'Archive', href: 'site-pages/Archive.html' },
    { id: 'tags', label: 'Tags / Series', href: 'site-pages/Tags & Series.html' },
    { id: 'search', label: 'Search', href: 'site-pages/Search.html' },
    { id: 'privacy', label: 'Privacy', href: 'site-pages/Privacy & Terms.html' },
  ];
  return (
    <header className="sp-bar">
      <a href="../Refinements v3 — AI & SEO.html" className="brand"><span className="mk"></span><span>MY BLOG WEB.</span></a>
      <nav>
        {items.map(it => <a key={it.id} href={it.href} className={active === it.id ? 'active' : ''}>{it.label}</a>)}
      </nav>
      <div style={{display:'flex', gap:6}}>
        {onCmd && <button className="cmd-trigger" onClick={onCmd}>⌘K</button>}
        {toggle && (
          <button className="theme-tog" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
          </button>
        )}
      </div>
    </header>
  );
};

window.SitePagesFooter = function () {
  return (
    <footer className="sp-footer">
      <span>© 2026 · MY BLOG WEB.</span>
      <span>EST · 2023 · Site v3</span>
    </footer>
  );
};

window.useTheme = function () {
  const [theme, setTheme] = useState(() => localStorage.getItem('sp.theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sp.theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
};
