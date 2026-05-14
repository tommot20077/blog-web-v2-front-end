/* global React */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   STATS DASHBOARD
   ============================================================ */
window.StatsPage = function StatsPage() {
  const days = Array.from({length: 30}, (_, i) => Math.floor(40 + Math.random() * 80 + Math.sin(i / 3) * 30));
  const peak = Math.max(...days);
  const cards = [
    { lbl: 'PAGE VIEWS', n: '12.4k', delta: '+18%', dir: 'up', sub: '近 30 天 · 較上期' },
    { lbl: 'UNIQUE VISITORS', n: '4,082', delta: '+12%', dir: 'up', sub: 'estimated · no tracking' },
    { lbl: 'AVG READ TIME', n: '4:32', delta: '+0:38', dir: 'up', sub: 'minutes:seconds' },
    { lbl: 'SUBSCRIBERS', n: '1,247', delta: '+34', dir: 'up', sub: 'this month' },
    { lbl: 'NEW COMMENTS', n: '89', delta: '-12', dir: 'down', sub: '較上月' },
    { lbl: 'BOUNCE RATE', n: '38%', delta: '-4%', dir: 'up', sub: '越低越好' },
  ];
  const top = [
    { ti: '把整個 Blog 收斂成 800 行 tokens。', v: '3,421', t: '8m', delta: '+22%' },
    { ti: 'useTheme() 的第三次重構。', v: '2,108', t: '6m', delta: '+8%' },
    { ti: '灰階不是偷懶的藉口。', v: '1,894', t: '5m', delta: '+15%' },
    { ti: '我為什麼離開 Pinia。', v: '1,672', t: '7m', delta: '+4%' },
    { ti: 'Vue 3 + Vitest 的 TDD 流程。', v: '1,233', t: '10m', delta: '-2%' },
  ];
  const referrers = [
    { src: 'Direct', pct: 42 },
    { src: 'twitter.com', pct: 18 },
    { src: 'news.ycombinator.com', pct: 14 },
    { src: 'google.com', pct: 12 },
    { src: 'github.com', pct: 8 },
    { src: 'Other', pct: 6 },
  ];

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Dashboard · 過去 30 天</span>
          <h1>站台數據</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">↓ Export CSV</button>
          <button className="bk-btn pri">+ New Post</button>
        </div>
      </div>

      <div className="stat-cards">
        {cards.map(c => (
          <div key={c.lbl} className="stat-card">
            <div className="lbl"><span>{c.lbl}</span><span className={`delta ${c.dir === 'down' ? 'down' : ''}`}>{c.delta}</span></div>
            <div className="n">{c.n}</div>
            <div className="sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bk-grid-2">
        <div className="bk-panel">
          <div className="ph"><h3>每日瀏覽量</h3><span className="meta">DAILY · 30 days</span></div>
          <div className="chart">
            {days.map((v, i) => <span key={i} className={`bar ${v === peak ? 'peak' : ''}`} style={{height: `${v / peak * 100}%`}} title={`Day ${i+1}: ${v}`}></span>)}
          </div>
          <div className="x">
            <span>30 days ago</span><span>15 days</span><span>Today</span>
          </div>
        </div>

        <div className="bk-panel">
          <div className="ph"><h3>流量來源</h3><span className="meta">REFERRERS</span></div>
          {referrers.map(r => (
            <div key={r.src} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,padding:'8px 0',alignItems:'center',fontSize:13}}>
              <span>{r.src}</span>
              <div style={{width:120,height:5,background:'var(--bg-sub)',borderRadius:999}}>
                <div style={{height:'100%',width:`${r.pct * 2.4}%`,background:'var(--accent)',borderRadius:999}}></div>
              </div>
              <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)',minWidth:36,textAlign:'right'}}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bk-panel">
        <div className="ph"><h3>熱門文章</h3><span className="meta">TOP 5 · BY VIEWS</span></div>
        {top.map((t, i) => (
          <div key={t.ti} className="tp-row">
            <span className="ti"><span style={{color:'var(--muted-2)',fontFamily:'var(--f-mono)',fontSize:11,marginRight:8}}>0{i+1}</span>{t.ti}</span>
            <span className="v">{t.v}</span>
            <span className="v">{t.t}</span>
            <span className={`v ${t.delta.startsWith('+') ? 'up' : ''}`}>{t.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   DRAFTS LIST + VERSION HISTORY
   ============================================================ */
window.DraftsPage = function DraftsPage() {
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);

  const drafts = [
    { id: 1, st: 'review', ti: '為什麼我把 React 轉到 Vue，又從 Vue 轉回 React。', sub: '預定主題：架構決策', when: '2 小時前', words: 1820, tag: 'Review' },
    { id: 2, st: 'draft', ti: 'Tailwind 4.0 的 14 個破壞性變更。', sub: '進度：第三段', when: '昨天', words: 940, tag: 'Draft' },
    { id: 3, st: 'scheduled', ti: 'Dark mode 的 OKLCH 解法。', sub: 'Series: Design System #4', when: '4/22 09:00', words: 2340, tag: 'Scheduled' },
    { id: 4, st: 'draft', ti: 'CSS @layer 在實務專案的應用筆記。', sub: '大綱階段', when: '3 天前', words: 320, tag: 'Draft' },
    { id: 5, st: 'review', ti: 'Vite 6 的 build 速度優化。', sub: '同事審稿中', when: '5 天前', words: 1654, tag: 'Review' },
    { id: 6, st: 'published', ti: '把整個 Blog 收斂成 800 行 tokens。', sub: 'v3.2', when: '4/15', words: 2820, tag: 'Live' },
  ];

  const filtered = filter === 'all' ? drafts : drafts.filter(d => d.st === filter);

  const versions = [
    { ver: 'v12', when: '剛剛', msg: '修正 typo 與配色', diff: { add: 14, del: 8 }, cur: true },
    { ver: 'v11', when: '12 分鐘前', msg: '加入 Section 4：dark mode 推導', diff: { add: 142, del: 12 } },
    { ver: 'v10', when: '一小時前', msg: '重寫前言', diff: { add: 64, del: 89 } },
    { ver: 'v9',  when: '昨天 22:14', msg: '草稿大綱完成', diff: { add: 1820, del: 0 } },
    { ver: 'v8',  when: '昨天 18:02', msg: '貼上 v1 比較資料', diff: { add: 220, del: 0 } },
    { ver: 'v1',  when: '3 天前',     msg: '初稿', diff: { add: 320, del: 0 } },
  ];

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Drafts · 草稿與發佈狀態</span>
          <h1>{drafts.length} 篇 in flight</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">↗ Import MD</button>
          <button className="bk-btn pri">+ New Draft</button>
        </div>
      </div>

      <div className="dr-toolbar">
        <input className="dr-search" placeholder="搜尋標題、tag、內文…" />
        {[['all','All',drafts.length],['draft','Drafts',drafts.filter(d=>d.st==='draft').length],['review','Review',drafts.filter(d=>d.st==='review').length],['scheduled','Scheduled',drafts.filter(d=>d.st==='scheduled').length],['published','Live',drafts.filter(d=>d.st==='published').length]].map(([id,l,c]) => (
            <button key={id} className={`dr-fil ${filter===id?'active':''}`} onClick={()=>setFilter(id)}>{l} · {c}</button>
        ))}
      </div>

      <div className="bk-panel" style={{padding:0}}>
        <div className="dr-table">
          {filtered.map(d => (
            <div key={d.id} className="dr-row" onClick={()=>setSel(d)}>
              <span className={`st ${d.st}`} title={d.tag}></span>
              <div className="ti"><b>{d.ti}</b><span>{d.sub}</span></div>
              <span className="badge">{d.tag}</span>
              <span className="when">{d.when}</span>
              <span className="words">{d.words.toLocaleString()} w</span>
              <span className="words">{Math.ceil(d.words / 250)} min</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bk-grid-2" style={{marginTop:18}}>
        <div className="bk-panel">
          <div className="ph"><h3>版本歷史</h3><span className="meta">{sel ? sel.ti.slice(0,18)+'…' : '選一篇看歷史'}</span></div>
          <div className="vh-list">
            {versions.map((v, i) => (
              <div key={v.ver} className={`vh-row ${v.cur ? 'cur' : ''}`}>
                <div className="when">{v.ver} · {v.when}</div>
                <div className="msg">{v.msg}</div>
                <div className="diff">
                  <span className="add">+{v.diff.add}</span> <span className="del">−{v.diff.del}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bk-panel">
          <div className="ph"><h3>Diff View</h3><span className="meta">v11 → v12</span></div>
          <div style={{fontFamily:'var(--f-mono)',fontSize:12.5,lineHeight:1.7,background:'var(--bg)',borderRadius:8,padding:14,maxHeight:300,overflow:'auto'}}>
            <div style={{color:'var(--muted)'}}>@@ section 3 @@</div>
            <div style={{color:'#c14444',background:'rgba(193,68,68,.08)'}}>- 把整套 tokens 拆成<b>四</b>類：color, type, space, radius。</div>
            <div style={{color:'#2f9e6e',background:'rgba(47,158,110,.08)'}}>+ 把整套 tokens 拆成<b>五</b>類：color, type, space, radius, motion。</div>
            <div style={{color:'#2f9e6e',background:'rgba(47,158,110,.08)'}}>+ 每一類都遵守同一個原則：少於 8 個變體。</div>
            <div style={{color:'var(--muted)',marginTop:10}}>@@ section 4 @@</div>
            <div style={{color:'#c14444',background:'rgba(193,68,68,.08)'}}>- ...</div>
            <div style={{color:'#2f9e6e',background:'rgba(47,158,110,.08)'}}>+ 灰階決策是最關鍵的一步。</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SCHEDULED TIMELINE
   ============================================================ */
window.ScheduledPage = function ScheduledPage() {
  const month = '2026 · 4月';
  // Build calendar for April 2026 (Apr 1 = Wed)
  const startPad = 3; // Mon-Tue-Wed start; we put Sun first so Apr 1 is column 4 (Wed)
  const days = 30;
  const today = 15;

  const events = {
    16: [{ title: 'Tailwind 4 變更', t: '09:00', kind: 'pin' }],
    18: [{ title: 'Vite 6 build 加速', t: '14:00', kind: 'pin' }],
    22: [{ title: 'Dark mode OKLCH', t: '09:00', kind: 'pin' }],
    25: [{ title: '電子報 #18', t: '08:00', kind: 'draft' }],
    28: [{ title: 'Series 收尾', t: '10:00', kind: 'pin' }],
  };

  const upcoming = [
    { date: '4/16', d: '16', m: 'APR', t: 'Wed 09:00', ti: 'Tailwind 4.0 的 14 個破壞性變更', sub: '預估 8 分鐘 · Series: 無' },
    { date: '4/18', d: '18', m: 'APR', t: 'Fri 14:00', ti: 'Vite 6 build 速度優化', sub: '預估 6 分鐘 · 含 benchmark' },
    { date: '4/22', d: '22', m: 'APR', t: 'Tue 09:00', ti: 'Dark mode 的 OKLCH 解法', sub: 'Design System #4 · 預估 10 分鐘' },
    { date: '4/25', d: '25', m: 'APR', t: 'Fri 08:00', ti: 'Newsletter #18 · 月報', sub: '本月精選 4 篇 + Slack 討論摘要' },
  ];

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Scheduled · 排程發佈</span>
          <h1>{month}</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">‹ 上個月</button>
          <button className="bk-btn">下個月 ›</button>
          <button className="bk-btn pri">+ 排程文章</button>
        </div>
      </div>

      <div className="sch-cal">
        {['日','一','二','三','四','五','六'].map(d => <div key={d} className="hdr">{d}</div>)}
        {Array.from({length: startPad}).map((_, i) => <div key={'p'+i} className="day other"><span className="d">{31 - startPad + i + 1}</span></div>)}
        {Array.from({length: days}).map((_, i) => {
          const d = i + 1;
          const ev = events[d] || [];
          return (
            <div key={d} className={`day ${d === today ? 'today' : ''}`}>
              <span className="d">{d}{d === today ? ' · 今天' : ''}</span>
              {ev.map((e, j) => (
                <div key={j} className={`pin ${e.kind === 'draft' ? 'draft' : ''}`}>
                  <span className="t">{e.t}</span>
                  {e.title}
                </div>
              ))}
            </div>
          );
        })}
        {Array.from({length: 42 - startPad - days}).map((_, i) => <div key={'n'+i} className="day other"><span className="d">{i+1}</span></div>)}
      </div>

      <h3 style={{fontFamily:'var(--f-display)',fontWeight:500,fontSize:16,letterSpacing:'-.012em',margin:'24px 0 0'}}>下一波 · Upcoming</h3>
      <div className="sch-list">
        {upcoming.map(u => (
          <div key={u.ti} className="sch-item">
            <div className="when"><span className="d">{u.d}</span>{u.t}</div>
            <div>
              <h4>{u.ti}</h4>
              <div className="sub">{u.sub}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className="bk-btn">編輯</button>
              <button className="bk-btn">立即發佈</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   MEDIA LIBRARY
   ============================================================ */
window.MediaPage = function MediaPage() {
  const [selected, setSelected] = useState(0);
  const items = [
    { name: 'tokens-diagram.svg', size: '14 KB', dim: '1200×800', alt: 'tokens 五大類別示意圖：color、type、space、radius、motion 的層級關係' },
    { name: 'oklch-wheel.png',    size: '128 KB', dim: '1600×1600', alt: 'OKLCH 色相環，標示 6 個 hue 區段' },
    { name: 'before-after.jpg',   size: '210 KB', dim: '1920×1080', alt: '' },
    { name: 'figma-tokens.png',   size: '88 KB', dim: '1440×900', alt: 'Figma Tokens Studio plugin 的 export 設定畫面' },
    { name: 'sepia-mode.webp',    size: '64 KB', dim: '1200×800', alt: '' },
    { name: 'team-photo.jpg',     size: '320 KB', dim: '2400×1600', alt: '團隊在 Off-site 合照，七個人' },
    { name: 'commit-graph.png',   size: '102 KB', dim: '1600×600', alt: '' },
    { name: 'editor-ui.svg',      size: '8 KB', dim: '1024×768', alt: '部落格編輯器的線稿 wireframe' },
  ];
  const cur = items[selected];
  const noAlt = items.filter(i => !i.alt).length;

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Media · 媒體庫</span>
          <h1>{items.length} files <span style={{fontFamily:'var(--f-display)',fontStyle:'italic',color:'var(--muted)',fontWeight:300}}>· {noAlt} 缺 alt 文字</span></h1>
        </div>
        <div className="actions">
          <button className="bk-btn">↓ Export Manifest</button>
          <button className="bk-btn pri">+ Upload</button>
        </div>
      </div>

      {noAlt > 0 && (
        <div style={{padding:'12px 16px',background:'color-mix(in oklab, #d97706 12%, var(--surface))',borderLeft:'3px solid #d97706',borderRadius:'0 8px 8px 0',fontSize:13,marginBottom:18}}>
          <b>無障礙提醒：</b>{noAlt} 個檔案沒有 alt 文字。盲人讀者跟搜尋引擎都讀不到那些圖。點橘色驚嘆號的圖片補上。
        </div>
      )}

      <div className="ml-grid">
        {items.map((it, i) => (
          <div key={i} className="ml-item" onClick={() => setSelected(i)} style={selected === i ? {boxShadow:'0 0 0 2px var(--accent)'} : null}>
            <div className="ph">{it.name.split('.').pop().toUpperCase()}</div>
            <div className="info">
              <span>{it.dim}</span>
              <span>{it.size}</span>
            </div>
            {it.alt ? <span className="alt-ok">✓</span> : <span className="alt-warn">!</span>}
          </div>
        ))}
      </div>

      <div className="ml-detail">
        <div className="preview">{cur.name.split('.').pop().toUpperCase()}</div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
            <h3 style={{margin:0,fontFamily:'var(--f-display)',fontWeight:500,fontSize:17,letterSpacing:'-.012em'}}>{cur.name}</h3>
            <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)'}}>{cur.dim} · {cur.size}</span>
          </div>
          <div className="field">
            <label>Alt 文字（給 screen reader 用）</label>
            <textarea defaultValue={cur.alt} placeholder="描述圖片內容、不要寫『圖片』『照片』。包含對讀者重要的細節。" rows={3} />
            {!cur.alt && (
              <div className="alt-helper">
                <b>寫 alt 的訣竅：</b>用一句話描述圖中發生什麼事 → 包含對文意關鍵的元素 → 不要超過 125 字。例如：「OKLCH 色相環，標示 6 個 hue 區段」。
              </div>
            )}
          </div>
          <div className="field">
            <label>Caption（顯示在文章圖片下方）</label>
            <input type="text" placeholder="（選填）⋯" />
          </div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button className="bk-btn pri">儲存</button>
            <button className="bk-btn">複製連結</button>
            <button className="bk-btn danger">刪除</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SLASH COMMAND IN EDITOR
   ============================================================ */
window.SlashCommandPage = function SlashCommandPage() {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState('');
  const [sel, setSel] = useState(0);
  const [saved, setSaved] = useState('saved');
  const [content, setContent] = useState('一個段落，輸入 / 看看會發生什麼事。');

  const cmds = [
    { ic: 'H1', l: 'Heading 1', desc: '大標題', kbd: '#' },
    { ic: 'H2', l: 'Heading 2', desc: '中標題', kbd: '##' },
    { ic: 'H3', l: 'Heading 3', desc: '小標題', kbd: '###' },
    { ic: '¶',  l: 'Paragraph', desc: '普通段落', kbd: '' },
    { ic: '"',  l: 'Quote', desc: '引用塊', kbd: '>' },
    { ic: '<>',  l: 'Code Block', desc: '程式碼，含語法高亮', kbd: '```' },
    { ic: '─',  l: 'Divider', desc: '水平分隔線', kbd: '---' },
    { ic: '•',  l: 'Bullet List', desc: '無序清單', kbd: '-' },
    { ic: '1.', l: 'Numbered List', desc: '有序清單', kbd: '1.' },
    { ic: '☐',  l: 'To-do', desc: 'Checkbox 清單', kbd: '[ ]' },
    { ic: '🖼', l: 'Image', desc: '從媒體庫插入圖片', kbd: '' },
    { ic: '⊞', l: 'Embed', desc: 'YouTube / Tweet / CodePen', kbd: '' },
    { ic: '📊', l: 'Table', desc: '插入表格', kbd: '|' },
    { ic: 'ƒ', l: 'Footnote', desc: '註腳，hover 顯示', kbd: '[^]' },
  ];
  const filtered = cmds.filter(c => c.l.toLowerCase().includes(filter.toLowerCase()));

  // Fake autosave
  useEffect(() => {
    setSaved('saving');
    const t = setTimeout(() => setSaved('saved'), 800);
    return () => clearTimeout(t);
  }, [content]);

  const words = content.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  const chars = content.length;
  const minutes = Math.max(1, Math.ceil(words / 250));

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Editor · Slash Command</span>
          <h1>新文章草稿</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">預覽</button>
          <button className="bk-btn">存為草稿</button>
          <button className="bk-btn pri">發佈</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:24,alignItems:'start'}} className="ed-layout">
        <div className="ed-shell">
          <input className="ed-title" defaultValue="標題還沒想好" />
          <div className="ed-meta">2026-04-15 · 第 12 版 · 自動儲存中</div>
          <div className="ed-body">
            <p contentEditable suppressContentEditableWarning onInput={e => setContent(e.currentTarget.textContent)} style={{outline:'none',minHeight:24}}>{content}</p>
            <p style={{color:'var(--muted-2)'}}>底下還有更多段落…</p>
          </div>

          {open && (
            <div className="slash-menu" style={{left: 32, top: 200}}>
              <div style={{padding:'6px 10px',borderBottom:'1px solid var(--divider)',marginBottom:4,fontFamily:'var(--f-mono)',fontSize:10.5,color:'var(--muted)',letterSpacing:'.14em',textTransform:'uppercase',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>{filtered.length} 個指令</span>
                <input value={filter} onChange={e=>{setFilter(e.target.value);setSel(0);}} placeholder="搜尋…" style={{border:0,outline:0,background:'transparent',font:'inherit',color:'var(--ink)',width:80,textTransform:'none',letterSpacing:0}} />
              </div>
              <div style={{maxHeight:280,overflow:'auto'}}>
                {filtered.slice(0, 8).map((c, i) => (
                  <div key={c.l} className={`slash-item ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => setOpen(false)}>
                    <div className="ic">{c.ic}</div>
                    <div className="l">{c.l}<span className="desc">{c.desc}</span></div>
                    {c.kbd && <kbd>{c.kbd}</kbd>}
                  </div>
                ))}
              </div>
              <div style={{padding:'6px 10px',borderTop:'1px solid var(--divider)',marginTop:4,fontFamily:'var(--f-mono)',fontSize:10,color:'var(--muted-2)',display:'flex',gap:14,justifyContent:'center'}}>
                <span>↑↓ 選擇</span><span>↵ 插入</span><span>esc 取消</span>
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky',top:20,padding:18,border:'1px solid var(--border)',borderRadius:12,background:'var(--surface)'}}>
          <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:14}}>Document</div>
          <div style={{display:'flex',flexDirection:'column',gap:10,fontSize:13}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>字數</span><b style={{fontFamily:'var(--f-mono)'}}>{words}</b></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>字元</span><b style={{fontFamily:'var(--f-mono)'}}>{chars}</b></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>閱讀時間</span><b style={{fontFamily:'var(--f-mono)'}}>{minutes} 分鐘</b></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>段落</span><b style={{fontFamily:'var(--f-mono)'}}>2</b></div>
          </div>
          <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid var(--divider)'}}>
            <div style={{fontFamily:'var(--f-mono)',fontSize:10.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',marginBottom:10}}>Slash Tips</div>
            <ul style={{margin:0,paddingLeft:18,fontSize:12.5,color:'var(--ink-2)',lineHeight:1.7}}>
              <li>輸入 <code style={{fontFamily:'var(--f-mono)',background:'var(--bg-sub)',padding:'1px 5px',borderRadius:3,fontSize:11}}>/</code> 叫出指令</li>
              <li><code style={{fontFamily:'var(--f-mono)',background:'var(--bg-sub)',padding:'1px 5px',borderRadius:3,fontSize:11}}>/h2</code> 直接插 H2</li>
              <li>↑↓ 移動，Enter 確認</li>
              <li>選文字 → 浮現 toolbar（粗體、斜體、連結）</li>
            </ul>
            <button onClick={() => setOpen(o => !o)} className="bk-btn" style={{marginTop:14,width:'100%'}}>{open ? '隱藏 Slash 選單' : '顯示 Slash 選單'}</button>
          </div>
        </aside>
      </div>

      <div className="ed-stats">
        <span className={`save ${saved === 'saving' ? 'saving' : ''}`}>{saved === 'saving' ? '儲存中…' : '已儲存於 14:32'}</span>
        <span>{words} 字</span>
        <span>{minutes} min</span>
      </div>
    </div>
  );
};

/* ============================================================
   EMAIL DIGEST
   ============================================================ */
window.EmailDigestPage = function EmailDigestPage() {
  const [opts, setOpts] = useState({
    perPost: false,
    weekly: true,
    monthly: true,
    series: true,
    plain: false,
  });
  const [tags, setTags] = useState({ 'design-system': true, 'css': true, 'vue': true, 'tdd': false });

  const toggle = (k) => setOpts(o => ({ ...o, [k]: !o[k] }));
  const tagToggle = (k) => setTags(t => ({ ...t, [k]: !t[k] }));

  const allTags = ['design-system','css','vue','tdd','typography','color','tokens','figma','reflection','testing','composables','state'];

  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Email Digest · 訂閱者偏好</span>
          <h1>1,247 訂閱者</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">↓ Export Subscribers</button>
          <button className="bk-btn pri">+ Compose Newsletter</button>
        </div>
      </div>

      <div className="bk-grid-2">
        <div>
          <div className="em-card">
            <div className="h"><h3>每篇即時通知</h3><span className={`badge ${opts.perPost ? 'on' : 'off'}`}>{opts.perPost ? 'ON' : 'OFF'}</span></div>
            <div className="em-pref-row">
              <div className="l"><b>每篇文章發佈時寄一封</b><span>適合死忠讀者 · 每月最多 10 封</span></div>
              <div className={`tg-switch ${opts.perPost ? 'on' : ''}`} onClick={()=>toggle('perPost')}></div>
            </div>
          </div>

          <div className="em-card">
            <div className="h"><h3>週報（每週日早上）</h3><span className={`badge ${opts.weekly ? 'on' : 'off'}`}>{opts.weekly ? 'ON' : 'OFF'}</span></div>
            <p>每週寄一封，整理那週寫的文章 + 推薦讀過的好東西。</p>
            <div className="em-pref-row">
              <div className="l"><b>啟用週報</b><span>1,247 訂閱者中有 892 位選了這個</span></div>
              <div className={`tg-switch ${opts.weekly ? 'on' : ''}`} onClick={()=>toggle('weekly')}></div>
            </div>
            <div className="em-pref-row">
              <div className="l"><b>純文字版本</b><span>不要任何 HTML 排版</span></div>
              <div className={`tg-switch ${opts.plain ? 'on' : ''}`} onClick={()=>toggle('plain')}></div>
            </div>
          </div>

          <div className="em-card">
            <div className="h"><h3>月報</h3><span className={`badge ${opts.monthly ? 'on' : 'off'}`}>{opts.monthly ? 'ON' : 'OFF'}</span></div>
            <p>每月一封，4–6 篇精選 + 我寫作這個月的反省。</p>
            <div className="em-pref-row">
              <div className="l"><b>啟用月報</b><span>355 訂閱者選了這個</span></div>
              <div className={`tg-switch ${opts.monthly ? 'on' : ''}`} onClick={()=>toggle('monthly')}></div>
            </div>
          </div>

          <div className="em-card">
            <div className="h"><h3>連載通知</h3><span className={`badge ${opts.series ? 'on' : 'off'}`}>{opts.series ? 'ON' : 'OFF'}</span></div>
            <p>系列文（如 Design System 重寫日記）有新一篇就通知，避免漏掉中間篇章。</p>
            <div className="em-pref-row">
              <div className="l"><b>啟用連載通知</b><span>跨所有 series</span></div>
              <div className={`tg-switch ${opts.series ? 'on' : ''}`} onClick={()=>toggle('series')}></div>
            </div>
          </div>
        </div>

        <div>
          <div className="em-card">
            <div className="h"><h3>過濾主題</h3><span className="badge off">{Object.values(tags).filter(Boolean).length} / {allTags.length}</span></div>
            <p>只想收到特定主題的文章？選下面的 tag。</p>
            <div className="em-tags">
              {allTags.map(t => (
                <button key={t} className={`em-tag ${tags[t] ? 'on' : ''}`} onClick={() => tagToggle(t)}>#{t}</button>
              ))}
            </div>
            <div className="em-stats">
              <div><b>1,247</b>active</div>
              <div><b>34%</b>open rate</div>
              <div><b>11%</b>click rate</div>
            </div>
          </div>

          <div className="em-card">
            <div className="h"><h3>近期寄送</h3><span className="meta" style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--muted)'}}>LAST 5</span></div>
            {[
              { date: '4/14 週一', ti: 'Newsletter #17 · Design System 重寫第三集', open: '38%', click: '14%' },
              { date: '4/07 週一', ti: 'Newsletter #16 · OKLCH 入坑指南', open: '41%', click: '18%' },
              { date: '3/31 週一', ti: 'Newsletter #15 · 三月精選', open: '36%', click: '11%' },
              { date: '3/24 週一', ti: 'Newsletter #14 · TDD with Vue', open: '33%', click: '9%' },
              { date: '3/17 週一', ti: 'Newsletter #13 · 為何離開 Pinia', open: '44%', click: '21%' },
            ].map(n => (
              <div key={n.ti} style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:14,padding:'10px 0',borderTop:'1px solid var(--divider)',alignItems:'center',fontSize:13}}>
                <span style={{fontFamily:'var(--f-mono)',fontSize:10.5,color:'var(--muted)',minWidth:60}}>{n.date}</span>
                <span style={{fontWeight:500,fontSize:13}}>{n.ti}</span>
                <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--muted)'}}>{n.open} · {n.click}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   AUTHOR PROFILE + MULTI-AUTHOR
   ============================================================ */
window.AuthorPage = function AuthorPage() {
  return (
    <div>
      <div className="bk-head">
        <div className="l">
          <span className="crumb">Authors · 作者管理</span>
          <h1>個人檔案 &amp; 團隊</h1>
        </div>
        <div className="actions">
          <button className="bk-btn">+ Invite Author</button>
          <button className="bk-btn pri">儲存變更</button>
        </div>
      </div>

      <div className="au-grid">
        <div className="au-card">
          <div className="au-avatar">M</div>
          <div>
            <h3 className="au-name">Mei Lin</h3>
            <span className="au-handle">@mei · Owner</span>
          </div>
          <p className="au-bio">設計系統工程師，目前在做 Vue 跟 Tailwind 的整合工具。喜歡 OKLCH、不喜歡開會。</p>
          <div className="au-stats">
            <div><b>89</b><span>posts</span></div>
            <div><b>12.4k</b><span>views</span></div>
            <div><b>1,247</b><span>subs</span></div>
          </div>
          <div className="au-links">
            <a href="#">@mei</a><a href="#">github</a><a href="#">mastodon</a><a href="#">RSS</a>
          </div>
        </div>

        <div>
          <div className="bk-panel">
            <div className="ph"><h3>個人資訊</h3><span className="meta">SHOWN ON /about</span></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="au-form">
              <div className="ml-detail" style={{display:'block',padding:0,border:0,marginTop:0}}>
                <div className="field"><label>顯示名稱</label><input defaultValue="Mei Lin" /></div>
                <div className="field"><label>Handle</label><input defaultValue="@mei" /></div>
                <div className="field"><label>角色</label><input defaultValue="Founder · Author · Designer" /></div>
                <div className="field"><label>所在地</label><input defaultValue="台北 · Taipei" /></div>
              </div>
              <div className="ml-detail" style={{display:'block',padding:0,border:0,marginTop:0}}>
                <div className="field"><label>Bio（短）</label><textarea rows={3} defaultValue="設計系統工程師，目前在做 Vue 跟 Tailwind 的整合工具。" /></div>
                <div className="field"><label>About 頁長 bio</label><textarea rows={4} defaultValue="2018 年從 React 圈轉到 Vue。寫 blog 是為了強迫自己想清楚每個技術決策⋯" /></div>
                <div className="field"><label>Email（公開）</label><input defaultValue="hi@mei.dev" /></div>
              </div>
            </div>
          </div>

          <div className="bk-panel" style={{marginTop:18}}>
            <div className="ph"><h3>團隊成員</h3><span className="meta">3 ACTIVE · 1 INVITED</span></div>
            <div className="au-team-grid">
              {[
                { n: 'Kenji Watanabe', h: '@kenji', role: 'Editor',     c: '#5B8DEF' },
                { n: 'Sara Chen',      h: '@sara',  role: 'Author',     c: '#2f9e6e' },
                { n: 'Diego Rojas',    h: '@diego', role: 'Author',     c: '#d97706' },
                { n: 'Aria Tanaka',    h: '@aria',  role: 'Invited',    c: '#9a9aa0' },
              ].map(t => (
                <div key={t.h} className="au-team-item">
                  <div className="av" style={{background: t.c}}>{t.n.charAt(0)}</div>
                  <div className="l">
                    <b>{t.n}</b>
                    <span>{t.h}</span>
                    <span className="role">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bk-panel" style={{marginTop:18}}>
            <div className="ph"><h3>權限</h3><span className="meta">ROLE MATRIX</span></div>
            <div style={{overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:520}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--border)'}}>
                    <th style={{textAlign:'left',padding:'10px 8px',fontFamily:'var(--f-mono)',fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>Permission</th>
                    <th style={{padding:'10px 8px',fontFamily:'var(--f-mono)',fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>Owner</th>
                    <th style={{padding:'10px 8px',fontFamily:'var(--f-mono)',fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>Editor</th>
                    <th style={{padding:'10px 8px',fontFamily:'var(--f-mono)',fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)'}}>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['寫草稿', '✓', '✓', '✓'],
                    ['發佈自己的文章', '✓', '✓', '—'],
                    ['發佈他人的文章', '✓', '✓', '—'],
                    ['編輯設計系統', '✓', '—', '—'],
                    ['寄送 newsletter', '✓', '✓', '—'],
                    ['邀請成員', '✓', '—', '—'],
                    ['看 Stats Dashboard', '✓', '✓', '看自己的'],
                  ].map((r,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid var(--divider)'}}>
                      <td style={{padding:'8px',fontWeight:500}}>{r[0]}</td>
                      <td style={{padding:'8px',textAlign:'center',color: r[1]==='✓' ? '#2f9e6e' : 'var(--muted-2)'}}>{r[1]}</td>
                      <td style={{padding:'8px',textAlign:'center',color: r[2]==='✓' ? '#2f9e6e' : 'var(--muted-2)'}}>{r[2]}</td>
                      <td style={{padding:'8px',textAlign:'center',color: r[3]==='✓' ? '#2f9e6e' : 'var(--muted-2)',fontSize:12}}>{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
