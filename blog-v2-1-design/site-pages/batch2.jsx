/* global React */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   READING LIST
   ============================================================ */
window.ReadingListPage = function ReadingListPage() {
  const posts = window.SITE_POSTS;
  const [tab, setTab] = useState('reading');

  // Mock states with localStorage hydration
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp.bookmarks') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    if (Object.keys(bookmarks).length === 0) {
      const seed = {
        [posts[0].slug]: { state: 'reading', progress: 64, addedAt: '2026-04-12', lastReadAt: '剛剛' },
        [posts[1].slug]: { state: 'reading', progress: 28, addedAt: '2026-04-10', lastReadAt: '昨天' },
        [posts[2].slug]: { state: 'queue',   progress: 0,  addedAt: '2026-04-15', lastReadAt: null },
        [posts[4].slug]: { state: 'queue',   progress: 0,  addedAt: '2026-04-13', lastReadAt: null },
        [posts[5].slug]: { state: 'queue',   progress: 0,  addedAt: '2026-04-09', lastReadAt: null },
        [posts[3].slug]: { state: 'done',    progress: 100,addedAt: '2026-03-28', lastReadAt: '2026-04-02' },
        [posts[6].slug]: { state: 'done',    progress: 100,addedAt: '2026-03-15', lastReadAt: '2026-03-21' },
      };
      setBookmarks(seed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sp.bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const items = useMemo(() => {
    return posts
      .map(p => ({ ...p, bm: bookmarks[p.slug] }))
      .filter(p => p.bm)
      .filter(p => tab === 'all' ? true : p.bm.state === tab);
  }, [posts, bookmarks, tab]);

  const counts = useMemo(() => {
    const c = { all: 0, reading: 0, queue: 0, done: 0 };
    Object.values(bookmarks).forEach(b => { c.all++; c[b.state] = (c[b.state] || 0) + 1; });
    return c;
  }, [bookmarks]);

  const remove = (slug) => {
    const next = { ...bookmarks }; delete next[slug]; setBookmarks(next);
  };
  const move = (slug, state) => {
    setBookmarks({ ...bookmarks, [slug]: { ...bookmarks[slug], state, progress: state === 'done' ? 100 : bookmarks[slug].progress } });
  };

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">reading list · localStorage only</div>
        <h1>你正在讀的<em>、想讀的、讀完的。</em></h1>
        <p>這裡的東西從來不離開你的瀏覽器。重灌、清快取就會消失 — 這是特性，不是 bug。</p>
      </div>

      <nav className="rl-tabs" role="tablist">
        {[
          { id: 'reading', label: 'Reading', c: counts.reading || 0 },
          { id: 'queue',   label: 'Queue',   c: counts.queue || 0 },
          { id: 'done',    label: 'Done',    c: counts.done || 0 },
          { id: 'all',     label: 'All',     c: counts.all || 0 },
        ].map(t => (
          <button key={t.id} className={`rl-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}>
            {t.label}<span className="c">{t.c}</span>
          </button>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="rl-empty">
          <div className="ic">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-4 7 4z"/></svg>
          </div>
          <h3>{tab === 'reading' ? '沒有正在讀的文章' : tab === 'queue' ? '清單是空的' : tab === 'done' ? '還沒讀完任何東西' : '還沒收藏任何文章'}</h3>
          <p>逛文章時點右上角的 ⌘ S（或書籤 icon），就會出現在這裡。</p>
        </div>
      ) : (
        <div className="rl-grid">
          {items.map(p => (
            <article key={p.slug} className="rl-card">
              <div className="meta">
                <span>{p.bm.state === 'reading' ? 'READING' : p.bm.state === 'queue' ? 'QUEUE' : 'DONE'}</span>
                <span className="dot"></span>
                <span>+ {p.bm.addedAt}</span>
                {p.bm.lastReadAt && <><span className="dot"></span><span>讀於 {p.bm.lastReadAt}</span></>}
              </div>
              <h3>{p.title}</h3>
              <p className="ex">{p.excerpt}</p>
              {p.bm.state === 'reading' && (
                <div className="progress">
                  <span>{p.bm.progress}%</span>
                  <div className="pbar"><div className="fill" style={{width: `${p.bm.progress}%`}}></div></div>
                  <span>{p.readMin}m</span>
                </div>
              )}
              <div className="actions">
                <button onClick={() => alert('Open: ' + p.slug)}>{p.bm.state === 'reading' ? '繼續讀' : p.bm.state === 'queue' ? '開始讀' : '重讀'}</button>
                {p.bm.state !== 'done' && <button onClick={() => move(p.slug, 'done')}>標完成</button>}
                {p.bm.state === 'done' && <button onClick={() => move(p.slug, 'queue')}>移回</button>}
                <button className="danger" onClick={() => remove(p.slug)} title="移除">✕</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   HIGHLIGHT & NOTE
   ============================================================ */
window.HighlightPage = function HighlightPage() {
  const articleRef = useRef(null);
  const [toolbar, setToolbar] = useState(null); // {x,y,text}
  const [popover, setPopover] = useState(null); // {x,y,id,quote,note}
  const [highlights, setHighlights] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp.highlights.demo') || '[]'); }
    catch { return []; }
  });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded && highlights.length === 0) {
      setHighlights([
        { id: 'h1', text: '一個 #f4f4f4 + 一個 #0a0a0b 就足以撐起整個站', color: 'yellow', note: '這個簡化原則想偷學', when: '2026-04-15 14:32' },
        { id: 'h2', text: '從 v1 的 1,820 行 → v2 的 802 行', color: 'green', note: '', when: '2026-04-15 14:35' },
      ]);
      setSeeded(true);
    }
  }, [seeded, highlights]);

  useEffect(() => {
    localStorage.setItem('sp.highlights.demo', JSON.stringify(highlights));
  }, [highlights]);

  // Selection -> toolbar
  useEffect(() => {
    const onUp = (e) => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      if (!text || text.length < 3) { setToolbar(null); return; }
      // Only inside our article
      if (!articleRef.current || !articleRef.current.contains(sel.anchorNode)) { setToolbar(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const wrap = articleRef.current.getBoundingClientRect();
      setToolbar({
        x: rect.left - wrap.left + rect.width / 2,
        y: rect.top - wrap.top,
        text,
      });
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('selectionchange', () => {
      if (!window.getSelection().toString()) setToolbar(null);
    });
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  const addHL = (color) => {
    if (!toolbar) return;
    const id = 'h' + Date.now();
    setHighlights(h => [...h, { id, text: toolbar.text, color, note: '', when: new Date().toISOString().slice(0, 16).replace('T', ' ') }]);
    setToolbar(null);
    window.getSelection().removeAllRanges();
  };

  const renderArticleText = (text) => {
    let result = text;
    highlights.sort((a, b) => b.text.length - a.text.length).forEach((h, idx) => {
      const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`(${escaped})`, ''), `\u0001${idx}\u0001$1\u0002`);
    });
    return result;
  };

  const articleParas = [
    `把整套 tokens 拆成五類：color, type, space, radius, motion。每一類都遵守同一個原則：少於 8 個變體，名稱用語義（--ink），不要用尺寸（--gray-900）。`,
    `灰階的決策是最關鍵的一步。一個 #f4f4f4 + 一個 #0a0a0b 就足以撐起整個站，剩下的全部用 color-mix 推導。我把這套方法帶到 v3 之後，從 v1 的 1,820 行 → v2 的 802 行，這還是含 dark mode、含三個 accent、含完整字級系統。`,
    `重點不在「行數」，而在「決策數」。每多一個 token 就是一個未來要協調的決策點。`,
  ];

  const handleHLClick = (e, idx) => {
    const h = highlights[idx];
    const rect = e.target.getBoundingClientRect();
    const wrap = articleRef.current.getBoundingClientRect();
    setPopover({
      x: rect.left - wrap.left,
      y: rect.bottom - wrap.top + 6,
      id: h.id,
      quote: h.text,
      note: h.note,
    });
  };

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">highlight & note · select any text</div>
        <h1>劃線跟筆記，<em>留在你這邊。</em></h1>
        <p>選一段文字試試。toolbar 會跳出來，挑顏色或加備註。所有東西存在 <code style={{fontFamily:'var(--f-mono)',fontSize:'.9em',background:'var(--bg-sub)',padding:'2px 6px',borderRadius:4}}>localStorage</code>，重整後還在。</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:32,alignItems:'start'}} className="hl-layout">
        <div ref={articleRef} className="demo-article" style={{position:'relative'}}>
          <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>
            節錄 · Design System 重寫日記 #3
          </div>
          {articleParas.map((para, pi) => {
            // Build segments
            const segs = [];
            let work = para;
            let cursor = 0;
            highlights.sort((a, b) => b.text.length - a.text.length);
            const used = new Set();
            const segments = [{ type: 'text', content: para }];
            highlights.forEach((h, idx) => {
              for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                if (s.type !== 'text') continue;
                const found = s.content.indexOf(h.text);
                if (found !== -1) {
                  const before = s.content.slice(0, found);
                  const after = s.content.slice(found + h.text.length);
                  segments.splice(i, 1,
                    { type: 'text', content: before },
                    { type: 'hl', content: h.text, idx },
                    { type: 'text', content: after }
                  );
                  break;
                }
              }
            });
            return (
              <p key={pi}>
                {segments.map((s, si) => s.type === 'text'
                  ? <span key={si}>{s.content}</span>
                  : <span key={si} className="hl" data-color={highlights[s.idx]?.color || 'yellow'} onClick={(e) => handleHLClick(e, s.idx)}>{s.content}</span>
                )}
              </p>
            );
          })}

          {toolbar && (
            <div className="hl-toolbar" style={{left: toolbar.x, top: toolbar.y, transform: 'translate(-50%, -100%) translateY(-8px)'}}>
              {['yellow', 'green', 'pink', 'blue'].map(c => (
                <button key={c} onClick={() => addHL(c)} title={c}>
                  <span className="swatch" style={{
                    background: c === 'yellow' ? 'rgba(250,204,21,.7)'
                              : c === 'green' ? 'rgba(34,197,94,.7)'
                              : c === 'pink' ? 'rgba(236,72,153,.7)'
                              : 'rgba(59,130,246,.7)'
                  }}></span>
                </button>
              ))}
              <div className="sep"></div>
              <button title="加註記" onClick={() => addHL('yellow')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </button>
              <button title="複製">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          )}

          {popover && (
            <div className="hl-popover" style={{left: Math.min(popover.x, 400), top: popover.y}}>
              <div className="quote">「{popover.quote}」</div>
              <textarea
                placeholder="寫點什麼…"
                defaultValue={popover.note}
                onChange={e => {
                  setHighlights(hs => hs.map(h => h.id === popover.id ? { ...h, note: e.target.value } : h));
                }}
              />
              <div className="row">
                <button onClick={() => { setHighlights(hs => hs.filter(h => h.id !== popover.id)); setPopover(null); }}>刪除</button>
                <button className="pri" onClick={() => setPopover(null)}>完成</button>
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky',top:90,padding:'18px',border:'1px solid var(--border)',borderRadius:12,background:'var(--surface)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
            <span style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)'}}>My Highlights</span>
            <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--accent)'}}>{highlights.length}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {highlights.length === 0 && <div style={{color:'var(--muted)',fontSize:13,padding:'24px 0',textAlign:'center'}}>還沒劃線。<br />選一段文字開始。</div>}
            {highlights.map(h => (
              <div key={h.id} style={{borderLeft:'3px solid', borderColor: h.color === 'yellow' ? 'rgb(250,204,21)' : h.color === 'green' ? 'rgb(34,197,94)' : h.color === 'pink' ? 'rgb(236,72,153)' : 'rgb(59,130,246)', paddingLeft:10}}>
                <div style={{fontSize:13,lineHeight:1.5,color:'var(--ink-2)'}}>{h.text}</div>
                {h.note && <div style={{fontSize:12,color:'var(--muted)',marginTop:6,fontStyle:'italic'}}>— {h.note}</div>}
                <div style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--muted-2)',marginTop:6}}>{h.when}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { setHighlights([]); }} style={{marginTop:14,padding:'8px 12px',width:'100%',border:'1px dashed var(--border-strong)',borderRadius:8,fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>清除全部</button>
        </aside>
      </div>
    </div>
  );
};

/* ============================================================
   LAST-READ INDICATOR
   ============================================================ */
window.LastReadPage = function LastReadPage() {
  const posts = window.SITE_POSTS;
  // Mock progress per post
  const progress = {
    [posts[0].slug]: 64,
    [posts[1].slug]: 100,
    [posts[2].slug]: 28,
    [posts[3].slug]: 100,
    [posts[5].slug]: 12,
  };
  const [showJump, setShowJump] = useState(true);

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">last-read · resume where you left off</div>
        <h1>記得你<em>讀到哪裡。</em></h1>
        <p>每篇文章的捲動位置存在本機。下次回來會看到「上次讀到 64%」的小卡片，一鍵跳回去。Index 上也會標記。</p>
      </div>

      <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:'clamp(20px,2.4vw,26px)',letterSpacing:'-.014em',margin:'32px 0 18px'}}>Article Index · 帶進度標記</h2>
      <div className="ar-list">
        {posts.slice(0, 8).map(p => {
          const pr = progress[p.slug];
          return (
            <article key={p.slug} className="ar-row" style={{position:'relative'}}>
              <span className="d">{p.date.slice(5).replace('-', '.')}</span>
              <h3>
                <a href="#">{p.title}</a>
                {pr !== undefined && pr < 100 && <span className="lr-badge" style={{marginLeft:10}}>讀到 {pr}%</span>}
                {pr === 100 && <span className="lr-badge" style={{marginLeft:10, background:'rgba(34,197,94,.16)', color:'#2f9e6e'}}>✓ 讀完</span>}
              </h3>
              <span className="t">{p.tags.slice(0, 2).map(t => <span key={t}>#{t}</span>)}</span>
              {pr !== undefined && pr < 100 && <div style={{position:'absolute',bottom:0,left:0,right:0,height:1.5,background:'var(--bg-sub)'}}><div style={{height:'100%',width:`${pr}%`,background:'var(--accent)'}}></div></div>}
            </article>
          );
        })}
      </div>

      <div style={{padding:24,marginTop:32,border:'1px dashed var(--border-strong)',borderRadius:12,background:'var(--bg-sub)'}}>
        <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Demo · 浮動「跳回」按鈕</div>
        <p style={{margin:'0 0 12px',color:'var(--ink-2)',fontSize:14}}>當文章還沒讀完，重新進入時右下角會浮出按鈕：</p>
        <button onClick={() => setShowJump(s => !s)} className="cmd-trigger">{showJump ? '隱藏' : '顯示'}浮動按鈕</button>
      </div>

      {showJump && (
        <div className="lr-jump" onClick={() => alert('跳回 64% 位置')}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          上次讀到
          <span className="pct">64%</span>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   PRINT STYLESHEET
   ============================================================ */
window.PrintPage = function PrintPage() {
  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">print stylesheet · @media print</div>
        <h1>列印出來，<em>還是好看的。</em></h1>
        <p>一個獨立的 print stylesheet：拿掉導覽、改用 serif 字、放 URL 到頁尾。預覽長這樣：</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'}} className="pr-layout">
        <div>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:20,margin:'0 0 14px'}}>螢幕顯示</h2>
          <div className="demo-article">
            <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>2026-04-15 · Design System</div>
            <h3 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:24,margin:'0 0 14px',letterSpacing:'-.018em'}}>把整個 Blog 收斂成 800 行 tokens。</h3>
            <p>三個月、兩次重寫、一個 design system。我把 1,820 行的 v1 砍成 802 行的 v2。重點不是行數，而是決策的密度。</p>
            <p>每一個 token 都是一個未來要協調的決策點。少一個 token 就少一場跨團隊的會議。</p>
          </div>
        </div>

        <div>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:20,margin:'0 0 14px',display:'flex',alignItems:'baseline',gap:10}}>
            列印預覽
            <span style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>A4 · serif</span>
          </h2>
          <div className="pr-preview">
            <h1>把整個 Blog 收斂成 800 行 tokens。</h1>
            <div className="byline">2026-04-15 · 8 min read · @me</div>
            <p>三個月、兩次重寫、一個 design system。我把 1,820 行的 v1 砍成 802 行的 v2。重點不是行數，而是決策的密度。</p>
            <p>每一個 token 都是一個未來要協調的決策點。少一個 token 就少一場跨團隊的會議。</p>
            <h2>從顏色到節奏</h2>
            <p>把整套 tokens 拆成五類：color, type, space, radius, motion。每一類都遵守同一個原則：少於 8 個變體，名稱用語義。</p>
            <div className="url">myblog.example.com/posts/design-system-rewrite</div>
          </div>
        </div>
      </div>

      <div style={{marginTop:32,padding:24,border:'1px solid var(--border)',borderRadius:12,background:'var(--surface)'}}>
        <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Print Stylesheet · 重點規則</div>
        <pre style={{margin:0,fontFamily:'var(--f-mono)',fontSize:12.5,lineHeight:1.7,color:'var(--ink-2)',overflow:'auto'}}>{`@media print {
  .sp-bar, .sp-footer, .lr-jump,
  .toc-sticky, .share-rail { display: none !important; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: white; }
  h1, h2, h3 { color: #000; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  a::after { content: " (" attr(href) ")"; font-size: .8em; color: #888; }
  pre, blockquote { page-break-inside: avoid; }
  @page { margin: 2cm; }
}`}</pre>
      </div>

      <button onClick={() => window.print()} className="cmd-trigger" style={{marginTop:18,padding:'12px 20px',background:'var(--ink)',color:'var(--bg)',borderColor:'var(--ink)'}}>↗ 試印這頁（會用瀏覽器原生 print）</button>
    </div>
  );
};

/* ============================================================
   THEME VARIANTS (sepia included)
   ============================================================ */
window.ThemeVariantsPage = function ThemeVariantsPage({ theme, setTheme, accent, setAccent }) {
  const themes = [
    { id: 'light', name: 'Light', desc: '預設明亮模式', cl: 'light' },
    { id: 'dark',  name: 'Dark',  desc: '深色模式', cl: 'dark' },
    { id: 'sepia', name: 'Sepia', desc: '長時間閱讀模式 · 護眼米黃', cl: 'sepia' },
  ];
  const accents = [
    { id: 'blue',   c: '#5B8DEF', name: 'Blue' },
    { id: 'green',  c: '#2f9e6e', name: 'Green' },
    { id: 'red',    c: '#e15554', name: 'Red' },
    { id: 'purple', c: '#8b5cf6', name: 'Purple' },
    { id: 'amber',  c: '#d97706', name: 'Amber' },
  ];

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">theme · 3 modes × 5 accents</div>
        <h1>挑一個<em>讀起來舒服的。</em></h1>
        <p>三種底色（亮、暗、米黃）× 五個強調色 = 15 種你的版本。選好之後存在本機，下次回來還在。</p>
      </div>

      <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:'clamp(20px,2.4vw,26px)',letterSpacing:'-.014em',margin:'24px 0 14px'}}>底色模式</h2>
      <div className="tv-grid">
        {themes.map(t => (
          <div key={t.id} className={`tv-card ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
            <div className={`swatch ${t.cl}`}>
              <div className="row">
                <span style={{background: t.cl === 'light' ? '#0a0a0b' : t.cl === 'dark' ? '#ededef' : '#3a2f1f'}}></span>
                <span style={{background: t.cl === 'light' ? '#ededed' : t.cl === 'dark' ? '#15151a' : '#e8dec5'}}></span>
                <span style={{background: 'var(--accent)'}}></span>
              </div>
              <div>
                <h4>Aa Bb 字</h4>
                <p>The quick brown fox</p>
              </div>
            </div>
            <div className="label">
              <span>{t.name}</span>
              <span className="n">{t.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:'clamp(20px,2.4vw,26px)',letterSpacing:'-.014em',margin:'40px 0 14px'}}>強調色</h2>
      <div className="cp-grid">
        {accents.map(a => (
          <button key={a.id} className={`cp-swatch ${accent === a.id ? 'active' : ''}`} onClick={() => setAccent(a.id)} aria-label={a.name}>
            <span className="fill" style={{background: a.c}}></span>
            <span className="name">{a.name}</span>
          </button>
        ))}
      </div>

      <h2 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:'clamp(20px,2.4vw,26px)',letterSpacing:'-.014em',margin:'40px 0 14px'}}>即時預覽</h2>
      <div className="demo-article">
        <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>2026-04-15 · 預覽</div>
        <h3 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:26,margin:'0 0 14px',letterSpacing:'-.018em'}}>讀起來像<span style={{color:'var(--accent)'}}>這樣</span>。</h3>
        <p>這段文字會用你選的字色與背景色。<a href="#" style={{color:'var(--accent)',borderBottom:'1px solid'}}>連結</a> 用強調色，<code style={{fontFamily:'var(--f-mono)',background:'var(--bg-sub)',padding:'1px 6px',borderRadius:4,fontSize:'.92em'}}>程式碼</code> 用 mono。</p>
        <p>段落之間有適當的留白。長時間閱讀記得切到 Sepia — 米黃底色對眼睛比較友善。</p>
      </div>
    </div>
  );
};

/* ============================================================
   i18n SCAFFOLDING
   ============================================================ */
window.I18nPage = function I18nPage() {
  const [lang, setLang] = useState('zh-Hant');
  const samples = {
    'zh-Hant': {
      meta: '2026年4月15日 · 8 分鐘閱讀',
      title: '把整個 Blog 收斂成 800 行 tokens。',
      body: '三個月、兩次重寫、一個 design system。我把 1,820 行的 v1 砍成 802 行的 v2。重點不是行數，而是決策的密度。',
      url: '/zh-Hant/posts/design-system-rewrite',
    },
    'en': {
      meta: 'April 15, 2026 · 8 min read',
      title: 'Compressing my blog into 800 lines of tokens.',
      body: "Three months, two rewrites, one design system. I cut v1 from 1,820 lines down to 802. It isn't about line count — it's about decision density.",
      url: '/en/posts/design-system-rewrite',
    },
    'ja': {
      meta: '2026年4月15日 · 8分で読了',
      title: 'ブログを800行のトークンに収束させた。',
      body: '3か月、2回の書き直し、1つのデザインシステム。v1の1,820行をv2の802行に削減した。大事なのは行数ではなく、決断の密度だ。',
      url: '/ja/posts/design-system-rewrite',
    },
  };
  const s = samples[lang];

  return (
    <div className="sp-wrap">
      <div className="sp-hero">
        <div className="eyebrow">i18n · 3 locales · hreflang ready</div>
        <h1>同一篇，<em>三種語言。</em></h1>
        <p>每篇文章可以有 <code style={{fontFamily:'var(--f-mono)',fontSize:'.92em',background:'var(--bg-sub)',padding:'2px 6px',borderRadius:4}}>zh-Hant / en / ja</code> 三個版本。URL 用前綴區分。Google 看得懂哪個版本對應哪個語言。</p>
      </div>

      <div style={{display:'flex',gap:16,alignItems:'center',marginTop:24,flexWrap:'wrap'}}>
        <div className="lang-switch" role="tablist">
          <button className={lang === 'zh-Hant' ? 'active' : ''} onClick={() => setLang('zh-Hant')}>繁體中文</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
          <button className={lang === 'ja' ? 'active' : ''} onClick={() => setLang('ja')}>日本語</button>
        </div>
        <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)'}}>偵測瀏覽器語言：<span style={{color:'var(--ink)'}}>{navigator.language}</span></span>
      </div>

      <div className="lang-sample" lang={lang}>
        <div className="meta">{s.meta}</div>
        <h3>{s.title}</h3>
        <p>{s.body}</p>
        <div style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)',marginTop:14,paddingTop:14,borderTop:'1px solid var(--divider)'}}>{s.url}</div>
      </div>

      <div style={{marginTop:32,padding:20,border:'1px solid var(--border)',borderRadius:12,background:'var(--surface)'}}>
        <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>head &lt;link rel="alternate"&gt; · 給 Google</div>
        <pre style={{margin:0,fontFamily:'var(--f-mono)',fontSize:12,lineHeight:1.7,color:'var(--ink-2)',overflowX:'auto'}}>{`<link rel="alternate" hreflang="zh-Hant" href="https://myblog.com/zh-Hant/posts/...">
<link rel="alternate" hreflang="en"      href="https://myblog.com/en/posts/...">
<link rel="alternate" hreflang="ja"      href="https://myblog.com/ja/posts/...">
<link rel="alternate" hreflang="x-default" href="https://myblog.com/posts/...">`}</pre>
      </div>

      <div style={{marginTop:24,padding:20,border:'1px dashed var(--border-strong)',borderRadius:12}}>
        <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>實作備忘 · i18n 不只是翻譯</div>
        <ul style={{margin:0,paddingLeft:20,color:'var(--ink-2)',fontSize:14,lineHeight:1.8}}>
          <li>日期格式：4/15 vs Apr 15 vs 4月15日 — 用 <code style={{fontFamily:'var(--f-mono)',fontSize:'.9em'}}>Intl.DateTimeFormat</code></li>
          <li>字型：日文要 Hiragino/Yu Mincho，中文要 Noto Sans TC，英文 Space Grotesk</li>
          <li>標點：中文全形「」，英文 ""，日文「」</li>
          <li>排版：英文 letter-spacing 比中日文鬆，行高也不一樣</li>
          <li>UI 字串：分離到 <code style={{fontFamily:'var(--f-mono)',fontSize:'.9em'}}>locales/*.json</code>，不要寫死</li>
        </ul>
      </div>
    </div>
  );
};
