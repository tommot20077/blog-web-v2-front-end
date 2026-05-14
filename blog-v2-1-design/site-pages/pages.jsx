/* global React */
const { useState, useMemo, useEffect, useRef } = React;

/* ============================================================
   ARCHIVE — timeline grouped by year
   ============================================================ */
window.ArchivePage = function ArchivePage() {
  const posts = window.SITE_POSTS;
  const [filter, setFilter] = useState('all');

  const byYear = useMemo(() => {
    const m = new Map();
    posts.forEach(p => {
      const y = p.date.slice(0, 4);
      if (!m.has(y)) m.set(y, []);
      m.get(y).push(p);
    });
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [posts]);

  const stats = useMemo(() => {
    const total = posts.length;
    const tags = new Set();
    posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    const totalMin = posts.reduce((s, p) => s + p.readMin, 0);
    return { total, years: byYear.length, tags: tags.size, totalMin };
  }, [posts, byYear]);

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">archive · {stats.total} posts</div>
        <h1>每一篇<em>都還記得。</em></h1>
        <p>從 2025 年的第一篇到現在，全部 {stats.total} 篇按時間排好。可以按年份折疊；找特定主題用 Tags 頁面。</p>
      </div>

      <div className="ar-stats">
        <div className="ar-stat"><div className="n">{stats.total}</div><div className="l">Total Posts</div></div>
        <div className="ar-stat"><div className="n">{stats.years}</div><div className="l">Active Years</div></div>
        <div className="ar-stat"><div className="n">{stats.tags}</div><div className="l">Unique Tags</div></div>
        <div className="ar-stat"><div className="n">{Math.round(stats.totalMin / 60 * 10) / 10}h</div><div className="l">Reading Time</div></div>
      </div>

      {byYear.map(([year, list]) => (
        <section key={year} className="ar-year">
          <header className="ar-year-head">
            <span className="y">{year}</span>
            <span className="c">{list.length} {list.length === 1 ? 'post' : 'posts'}</span>
            <hr />
          </header>
          <div className="ar-list">
            {list.map(p => (
              <article key={p.slug} className="ar-row">
                <span className="d">{p.date.slice(5).replace('-', '.')}</span>
                <h3><a href="#">{p.title}</a></h3>
                <span className="t">{p.tags.slice(0, 2).map(t => <span key={t}>#{t}</span>)}</span>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

/* ============================================================
   TAGS & SERIES
   ============================================================ */
window.TagsPage = function TagsPage() {
  const posts = window.SITE_POSTS;
  const series = window.SITE_SERIES;
  const [activeTag, setActiveTag] = useState(null);

  const tagCounts = useMemo(() => {
    const m = new Map();
    posts.forEach(p => p.tags.forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filtered = activeTag ? posts.filter(p => p.tags.includes(activeTag)) : posts;

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">tags &amp; series · {tagCounts.length} topics</div>
        <h1>用主題<em>串起來看。</em></h1>
        <p>不是每篇都獨立。同一個 tag 是觀點的延伸，同一個 series 是一段完整的論證。挑一個進去。</p>
      </div>

      <div className="tg-cloud">
        <button className={`tg-chip ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag(null)} data-size="lg">
          All <span className="c">{posts.length}</span>
        </button>
        {tagCounts.map(([t, c]) => {
          const size = c >= 3 ? 'lg' : c >= 2 ? 'md' : 'sm';
          return (
            <button key={t} className={`tg-chip ${activeTag === t ? 'active' : ''}`} data-size={size} onClick={() => setActiveTag(t === activeTag ? null : t)}>
              #{t} <span className="c">{c}</span>
            </button>
          );
        })}
      </div>

      <div className="tg-grid">
        <div>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:'clamp(22px,2.6vw,28px)',letterSpacing:'-.014em',margin:'0 0 18px'}}>
            {activeTag ? <>標籤：<span style={{color:'var(--accent)'}}>#{activeTag}</span> <span style={{color:'var(--muted)',fontSize:'.6em'}}>· {filtered.length}</span></> : '全部文章'}
          </h2>
          <div className="ar-list">
            {filtered.map(p => (
              <article key={p.slug} className="ar-row">
                <span className="d">{p.date.slice(5).replace('-', '.')}</span>
                <h3><a href="#">{p.title}</a></h3>
                <span className="t">{p.tags.slice(0, 2).map(t => <span key={t}>#{t}</span>)}</span>
              </article>
            ))}
          </div>
        </div>

        <aside>
          <div style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.22em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>Series · 連載</div>
          {series.map(s => {
            const done = s.posts.filter(p => p.state === 'done').length;
            const cur = s.posts.find(p => p.state === 'cur');
            return (
              <div key={s.id} className="sr-card">
                <div className="sr-head">
                  <h3>{s.title}</h3>
                  <span className="meta">{done}/{s.total}</span>
                </div>
                <p style={{margin:0,color:'var(--ink-2)',fontSize:13.5,lineHeight:1.65}}>{s.desc}</p>
                <div className="sr-progress">
                  <div className="sr-bar"><div className="fill" style={{width: `${done / s.total * 100}%`}}></div></div>
                  <span>{Math.round(done / s.total * 100)}%</span>
                </div>
                <div className="sr-list">
                  {s.posts.map(p => (
                    <div key={p.idx} className={`sr-item ${p.state}`}>
                      <span className="n">{p.idx}</span>
                      <span><b>{p.title}</b></span>
                      <span className="when">{p.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="sr-card" style={{borderStyle:'dashed',background:'transparent',color:'var(--muted)',textAlign:'center',padding:'32px 22px'}}>
            <div style={{fontFamily:'var(--f-display)',fontSize:18,marginBottom:6,color:'var(--ink-2)'}}>下一個系列規劃中</div>
            <div style={{fontSize:13}}>關於 Vue 3 + Tailwind 的 12 篇連載</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ============================================================
   SEARCH
   ============================================================ */
window.SearchPage = function SearchPage() {
  const posts = window.SITE_POSTS;
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');

  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return posts
      .filter(p => {
        if (scope === 'titles') return p.title.toLowerCase().includes(needle);
        if (scope === 'tags') return p.tags.some(t => t.toLowerCase().includes(needle));
        return p.title.toLowerCase().includes(needle) || p.excerpt.toLowerCase().includes(needle) || p.tags.some(t => t.toLowerCase().includes(needle));
      })
      .map(p => {
        const hay = `${p.title} ${p.excerpt}`;
        const idx = hay.toLowerCase().indexOf(needle);
        let snippet = p.excerpt;
        if (idx >= 0 && idx < p.title.length + 1 + p.excerpt.length) {
          // build from excerpt with mark
          const exIdx = p.excerpt.toLowerCase().indexOf(needle);
          if (exIdx >= 0) {
            const start = Math.max(0, exIdx - 30);
            const end = Math.min(p.excerpt.length, exIdx + needle.length + 60);
            snippet = (start > 0 ? '… ' : '') + p.excerpt.slice(start, exIdx) + '\u0001' + p.excerpt.slice(exIdx, exIdx + needle.length) + '\u0002' + p.excerpt.slice(exIdx + needle.length, end) + (end < p.excerpt.length ? ' …' : '');
          }
        }
        return { ...p, snippet };
      });
  }, [q, scope, posts]);

  const renderSnippet = (s) => {
    const parts = s.split(/[\u0001\u0002]/);
    if (parts.length < 3) return s;
    return <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</>;
  };

  const trending = ['design system', 'oklch', 'composables', 'tdd', 'vue'];

  return (
    <div className="sp-wrap">
      <div className="sp-hero" style={{paddingBottom: 16}}>
        <div className="eyebrow">search · client-side · zero tracking</div>
        <h1>找一篇<em>讀過的東西。</em></h1>
        <p>從標題、摘要、tag 全文搜尋。沒有送任何字串到後端。⌘K 也可以叫起來，但這頁可以做更多。</p>
      </div>

      <label className="sc-input-wrap" htmlFor="sc-i">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
        <input ref={inputRef} id="sc-i" className="sc-input" placeholder="輸入關鍵字、tag 或片語…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button onClick={() => setQ('')} style={{color:'var(--muted)',fontSize:13}}>清除</button>}
        <kbd>⌘K</kbd>
      </label>

      <div className="sc-filters">
        {[
          { id: 'all', label: 'All Fields' },
          { id: 'titles', label: 'Titles only' },
          { id: 'tags', label: 'Tags only' },
        ].map(f => (
          <button key={f.id} className={`sc-fil ${scope === f.id ? 'active' : ''}`} onClick={() => setScope(f.id)}>{f.label}</button>
        ))}
        <span style={{flex:1}}></span>
        <span style={{fontFamily:'var(--f-mono)',fontSize:11,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>
          {q ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : `${posts.length} posts indexed`}
        </span>
      </div>

      {!q && (
        <div>
          <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>Trending searches</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:32}}>
            {trending.map(t => <button key={t} className="tg-chip" onClick={() => setQ(t)}>{t}</button>)}
          </div>
          <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>Recent posts</div>
          <div className="sc-results">
            {posts.slice(0, 5).map(p => (
              <a key={p.slug} href="#" className="sc-result">
                <div className="meta">{p.date} · {p.readMin} min · {p.tags.join(' · ')}</div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {q && results.length > 0 && (
        <div className="sc-results">
          {results.map(p => (
            <a key={p.slug} href="#" className="sc-result">
              <div className="meta">{p.date} · {p.readMin} min · {p.tags.join(' · ')}</div>
              <h3>{p.title}</h3>
              <p>{renderSnippet(p.snippet)}</p>
              <div className="path">/posts/{p.slug}</div>
            </a>
          ))}
        </div>
      )}

      {q && results.length === 0 && (
        <div className="sc-empty">
          <div className="art">∅</div>
          <h3>找不到「{q}」</h3>
          <p>檢查拼字、減少字數，或試試這些：</p>
          <div className="sug">
            {trending.map(t => <a key={t} href="#" onClick={e => { e.preventDefault(); setQ(t); }}>{t}</a>)}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   404
   ============================================================ */
window.NotFoundPage = function NotFoundPage() {
  const posts = window.SITE_POSTS.slice(0, 4);
  return (
    <div className="err-page">
      <div>
        <div className="err-art">
          404
          <span className="glitch" aria-hidden="true">404</span>
        </div>
        <h1>這裡沒有東西可讀。</h1>
        <p>網址打錯了、文章下架了、或者它從來不存在 — 你選一個喜歡的解釋。<br />底下是還活著的東西。</p>
        <div className="err-actions">
          <a href="#" className="pri">← 回首頁</a>
          <a href="#" className="sec">看 Archive</a>
          <a href="#" className="sec">寄信給我</a>
        </div>

        <div className="err-suggest">
          <div className="lbl">最近寫的 · 也許你會想看</div>
          <div className="ar-list">
            {posts.map(p => (
              <article key={p.slug} className="ar-row">
                <span className="d">{p.date.slice(5).replace('-', '.')}</span>
                <h3><a href="#">{p.title}</a></h3>
                <span className="t">{p.tags.slice(0, 1).map(t => <span key={t}>#{t}</span>)}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   500
   ============================================================ */
window.ServerErrorPage = function ServerErrorPage() {
  return (
    <div className="err-page">
      <div>
        <div className="err-art">
          500
          <span className="glitch" aria-hidden="true">500</span>
        </div>
        <h1>伺服器壞了，抱歉。</h1>
        <p>這不是你的錯。我已經收到通知，正在看 log。<br />等三十秒再試，或先去別的頁面晃晃。</p>
        <div className="err-actions">
          <a href="#" className="pri" onClick={e => { e.preventDefault(); location.reload(); }}>↻ 重新整理</a>
          <a href="#" className="sec">回首頁</a>
          <a href="https://status.example.com" className="sec">檢查狀態</a>
        </div>

        <div className="err-suggest" style={{textAlign:'center'}}>
          <div className="lbl" style={{marginBottom:18}}>Error Trace · 不太重要但給工程師看</div>
          <div style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)',background:'var(--bg-sub)',padding:'14px 18px',borderRadius:10,textAlign:'left',lineHeight:1.7}}>
            <div>request_id: <span style={{color:'var(--accent)'}}>req_8f3a2b1c9d</span></div>
            <div>timestamp: 2026-04-15T14:32:11Z</div>
            <div>node: blog-edge-tpe-02</div>
            <div>trace: TimeoutError → upstream → reading_list_service</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PRIVACY / TERMS
   ============================================================ */
window.PrivacyPage = function PrivacyPage() {
  const sections = [
    { id: 'overview', title: '總覽' },
    { id: 'collect', title: '我們收集什麼' },
    { id: 'use', title: '怎麼用這些資料' },
    { id: 'cookies', title: 'Cookies 與本機儲存' },
    { id: 'analytics', title: 'Analytics（沒有）' },
    { id: 'third', title: '第三方服務' },
    { id: 'rights', title: '你的權利' },
    { id: 'contact', title: '聯絡' },
  ];
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">privacy &amp; terms · v3.2</div>
        <h1>關於資料這件事，<em>我盡量少碰。</em></h1>
        <p>這頁告訴你我蒐集了什麼（很少）、怎麼用（更少）、以及你可以叫我刪掉哪些（全部）。沒有律師代筆，所以讀起來像人話。</p>
      </div>

      <div className="page-nav" role="tablist">
        <a href="#" className="active">隱私權政策</a>
        <a href="#">服務條款</a>
        <a href="#">Cookie 政策</a>
        <a href="#">內容授權 (CC BY 4.0)</a>
      </div>

      <div className="pv-grid">
        <nav className="pv-toc" aria-label="On this page">
          <span className="h">On this page</span>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'active' : ''}>{s.title}</a>
          ))}
        </nav>

        <article className="pv-body">
          <span className="pv-effective">生效日期 · 2026-04-01</span>

          <h2 id="overview">總覽</h2>
          <p>這個 blog 是我個人的寫作空間。它不是商業產品，不賣廣告、不接 sponsor、不做使用者追蹤。整個站台架在 Cloudflare Pages，靜態 HTML，沒有後端資料庫。</p>
          <div className="pv-callout">
            <b>30 秒摘要：</b>除了你主動寫進留言/訂閱表單的東西，我什麼都不蒐集。沒有 Google Analytics。沒有 Facebook Pixel。Reading List 跟 Highlights 只存在你自己的瀏覽器裡。
          </div>

          <h2 id="collect">我們收集什麼</h2>
          <p>分三類：</p>
          <ul>
            <li><b>你主動給的：</b>留言時的暱稱與 email、訂閱電子報的 email。僅此而已。</li>
            <li><b>瀏覽器自動送的：</b>standard HTTP request headers（User-Agent、Referer、IP）— 這些只在 Cloudflare access log 裡保留 24 小時，做 DDoS 防護用。</li>
            <li><b>本機儲存（不離開你的瀏覽器）：</b>主題偏好、reading list、最後閱讀位置、highlights。我看不到這些東西。</li>
          </ul>

          <h2 id="use">怎麼用這些資料</h2>
          <p>留言 email 用來避免 spam（gravatar 也不抓，純文字顯示）。訂閱 email 用來寄電子報，每月最多兩封。沒有別的。</p>

          <h2 id="cookies">Cookies 與本機儲存</h2>
          <p>我不放 third-party cookies。本機的 <code>localStorage</code> 用來：</p>
          <ul>
            <li><code>sp.theme</code> — 你選的 light / dark / sepia</li>
            <li><code>sp.bookmarks</code> — reading list 文章 slug 陣列</li>
            <li><code>sp.lastread.{'{slug}'}</code> — 每篇文章的捲動位置</li>
            <li><code>sp.highlights</code> — 你劃的線（含時間戳）</li>
          </ul>
          <p>清掉這些不影響閱讀，只是個人化會重置。瀏覽器設定裡可以一鍵清除。</p>

          <h2 id="analytics">Analytics（沒有）</h2>
          <p>這頁標題不是反話。我沒裝 GA、沒裝 Plausible、沒裝任何 pixel。我看不到「有多少人讀了這篇」。我選擇相信評論、訂閱、回信，這些訊號比數字真實。</p>
          <div className="pv-callout">
            <b>例外：</b>我每月會看一次 Cloudflare 的彙總頁，知道大概的流量區間（10k vs 100k）。沒有單一使用者層級的資料。
          </div>

          <h2 id="third">第三方服務</h2>
          <ul>
            <li><b>Cloudflare</b> — CDN + DDoS 防護，必要</li>
            <li><b>Buttondown</b> — 電子報寄送（只有訂閱者）</li>
            <li><b>Webmention.io</b> — 接收聯邦留言</li>
          </ul>
          <p>三個服務都簽了 DPA，不對 EU/TW 使用者轉售資料。</p>

          <h2 id="rights">你的權利</h2>
          <p>不論你住在 EU、加州、台灣或別處，你都可以：</p>
          <ul>
            <li>要求知道我手上有你哪些資料（通常就是一筆 email）</li>
            <li>要求修改或刪除（24 小時內處理）</li>
            <li>要求匯出（會回傳一個 JSON 檔）</li>
            <li>取消訂閱（電子報底下永遠有 unsubscribe 連結）</li>
          </ul>

          <h2 id="contact">聯絡</h2>
          <p>有疑問、發現我寫的跟做的不一致、或者單純想聊天 — 寄信到 <a href="mailto:hi@example.com" style={{borderBottom:'1px solid var(--accent)'}}>hi@example.com</a>。我自己讀，自己回，沒有客服系統。</p>
          <p style={{color:'var(--muted-2)',fontSize:13,marginTop:32}}>本政策的修改會記錄在 GitHub 上：<code>github.com/me/blog/commits/main/privacy.md</code></p>
        </article>
      </div>
    </div>
  );
};
