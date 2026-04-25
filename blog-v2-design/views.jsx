/* global React */
const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM, useCallback: uC } = React;

// ============ MARKDOWN RENDERER (tiny, no deps) ============
function renderMd(src) {
  if (!src) return '';
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  const inline = s => s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_,alt,url,meta) => {
      const align = (meta && meta.match(/align=(\w+)/)?.[1]) || 'center';
      return `<figure class="md-fig align-${align}"><img loading="lazy" decoding="async" src="${url}" alt="${alt||''}"/>${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const lang = l.slice(3).trim();
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      const esc = buf.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      out.push(`<pre data-lang="${lang}"><code>${esc}</code></pre>`);
      continue;
    }
    if (l.startsWith('# ')) { out.push('<h1>'+inline(l.slice(2))+'</h1>'); i++; continue; }
    if (l.startsWith('## ')) { out.push('<h2 id="'+ l.slice(3).replace(/\s+/g,'-').replace(/[^\w\u4e00-\u9fa5-]/g,'').toLowerCase() +'">'+inline(l.slice(3))+'</h2>'); i++; continue; }
    if (l.startsWith('### ')) { out.push('<h3>'+inline(l.slice(4))+'</h3>'); i++; continue; }
    if (l.startsWith('> ')) { out.push('<blockquote>'+inline(l.slice(2))+'</blockquote>'); i++; continue; }
    if (l.trim() === '---') { out.push('<hr/>'); i++; continue; }
    if (/^-\s/.test(l)) {
      const items = [];
      while (i < lines.length && /^-\s/.test(lines[i])) { items.push('<li>'+inline(lines[i].slice(2))+'</li>'); i++; }
      out.push('<ul>'+items.join('')+'</ul>');
      continue;
    }
    if (l.trim() === '') { i++; continue; }
    const para = [l]; i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|>|-|```)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push('<p>'+inline(para.join(' '))+'</p>');
  }
  return out.join('\n');
}

// ============ MY ARTICLES ============
const STATUS_LABELS = { ALL:'All', DRAFT:'Drafts', PENDING_REVIEW:'In review', PUBLISHED:'Published', REJECTED:'Rejected', ARCHIVED:'Archived' };

function MyArticles({ go }) {
  const C = window.BLOG_CONTENT;
  const [filter, setFilter] = uS('ALL');
  const [view, setView] = uS('list');
  const [q, setQ] = uS('');
  const counts = uM(() => {
    const c = { ALL: C.myArticles.length };
    C.myArticles.forEach(a => { c[a.status] = (c[a.status]||0)+1; });
    return c;
  }, [C]);
  const stats = uM(() => ({
    total: C.myArticles.length,
    views: C.myArticles.reduce((s,a)=>s+a.viewCount,0),
    likes: C.myArticles.reduce((s,a)=>s+a.likeCount,0),
    pending: (counts.PENDING_REVIEW||0) + (counts.DRAFT||0),
  }), [C, counts]);
  const filtered = uM(() => {
    return C.myArticles
      .filter(a => filter==='ALL' || a.status===filter)
      .filter(a => !q || a.title.toLowerCase().includes(q.toLowerCase()) || a.tags.some(t=>t.toLowerCase().includes(q.toLowerCase())));
  }, [C, filter, q]);

  return React.createElement(Shell, { active: 'my', go },
    React.createElement('div', { className: 'ma-head' },
      React.createElement('div', { className: 'ma-title-row' },
        React.createElement('div', null,
          React.createElement('div', { className: 'ma-sub' }, '作者後台 · Yuan Luca'),
          React.createElement('h1', { className: 'ma-title' }, '我的文章', React.createElement('span', { className: 'em' }, '.'))
        ),
        React.createElement('button', { className: 'ma-new', 'data-hover': true, onClick: () => go('editor','new') },
          React.createElement('span', { className: 'plus' }, '＋'), '開始新文章'
        )
      ),
      React.createElement('div', { className: 'ma-stats' },
        React.createElement(Stat, { k: 'Total', v: stats.total, unit: 'essays' }),
        React.createElement(Stat, { k: 'Views', v: stats.views.toLocaleString() }),
        React.createElement(Stat, { k: 'Likes', v: stats.likes }),
        React.createElement(Stat, { k: 'In progress', v: stats.pending, unit: 'items' })
      )
    ),
    React.createElement('div', { className: 'ma-toolbar' },
      ['ALL','DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','ARCHIVED'].map(k =>
        React.createElement('button', {
          key: k, className: 'ma-chip '+(filter===k?'active':''),
          'data-hover': true, onClick: ()=>setFilter(k)
        }, STATUS_LABELS[k], React.createElement('span',{className:'n'}, counts[k]||0))
      ),
      React.createElement('div', { className: 'ma-search' },
        React.createElement('span', {style:{color:'var(--muted)',fontSize:12}}, '⌕'),
        React.createElement('input', { placeholder:'搜尋標題或 tag…', value:q, onChange:e=>setQ(e.target.value) })
      ),
      React.createElement('div', { className: 'ma-view-toggle' },
        React.createElement('button', { className: view==='list'?'active':'', 'data-hover':true, onClick:()=>setView('list') }, 'List'),
        React.createElement('button', { className: view==='grid'?'active':'', 'data-hover':true, onClick:()=>setView('grid') }, 'Grid')
      )
    ),
    view==='list'
      ? React.createElement('div', { className: 'ma-list' },
          filtered.map(a => React.createElement(MaRow, { key: a.uuid, a, go }))
        )
      : React.createElement('div', { className: 'ma-grid' },
          filtered.map(a => React.createElement(MaCard, { key: a.uuid, a, go }))
        ),
    filtered.length === 0 && React.createElement('div', {
      style:{padding:'60px 0', textAlign:'center', color:'var(--muted)', fontFamily:'var(--f-mono)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase'}
    }, '— 這個分類暫時是空的 —')
  );
}

function Stat({k,v,unit}) {
  return React.createElement('div', { className: 'ma-stat' },
    React.createElement('div', {className:'k'}, k),
    React.createElement('div', {className:'v'}, v, unit && React.createElement('span',{className:'unit'}, ' '+unit))
  );
}

function MaRow({a, go}) {
  return React.createElement('div', null,
    React.createElement('div', { className: 'ma-row' },
      React.createElement('div', { className: 'ma-thumb' }, React.createElement('span',{className:'t'}, a.artTag)),
      React.createElement('div', { className: 'ma-row-title' },
        React.createElement('div', { className: 't' }, a.title),
        React.createElement('div', { className: 's' }, a.summary),
        React.createElement('div', { className: 'tags' },
          a.tags.slice(0,3).map(t => React.createElement('span', {key:t}, t))
        )
      ),
      React.createElement('div', { className: 'ma-status '+a.status }, STATUS_LABELS[a.status]),
      React.createElement('div', { className: 'ma-metrics' },
        a.status==='PUBLISHED' ? React.createElement(React.Fragment, null,
          React.createElement('span', null, React.createElement('b',null, a.viewCount.toLocaleString()), ' views'),
          React.createElement('span', null, React.createElement('b',null, a.likeCount), ' ♡')
        ) : React.createElement('span', {style:{color:'var(--muted-2)'}}, '—')
      ),
      React.createElement('div', { className: 'ma-updated' }, 'Upd ', a.updatedAt.replace(/-/g,' · ')),
      React.createElement('div', { className: 'ma-actions' },
        a.status==='DRAFT' && React.createElement('button', { className: 'ma-action primary', 'data-hover':true }, 'Submit'),
        a.status==='REJECTED' && React.createElement('button', { className: 'ma-action primary', 'data-hover':true }, 'Fix'),
        React.createElement('button', { className: 'ma-action', 'data-hover':true, onClick:()=>go('editor', a.uuid) }, 'Edit'),
        React.createElement('button', { className: 'ma-action', 'data-hover':true, onClick:()=>go('article', a.uuid) }, 'View'),
      )
    ),
    a.status==='REJECTED' && a.rejectReason && React.createElement('div', { className: 'ma-reject' },
      React.createElement('b', null, 'Reviewer · 退回原因'), a.rejectReason
    )
  );
}

function MaCard({a, go}) {
  return React.createElement('article', { className: 'ma-card reveal', 'data-hover':true, onClick:()=>go('editor', a.uuid) },
    React.createElement('div', { className:'thumb' },
      React.createElement('span', {className:'t'}, a.artTag),
      React.createElement('span', {className:'s ma-status '+a.status}, STATUS_LABELS[a.status])
    ),
    React.createElement('div', { className:'body' },
      React.createElement('h4', null, a.title),
      React.createElement('p', null, a.summary)
    ),
    React.createElement('div', { className:'foot' },
      React.createElement('span', null, a.updatedAt.replace(/-/g,'·')),
      React.createElement('span', null, a.viewCount.toLocaleString(), ' views · ', a.likeCount, ' ♡')
    )
  );
}

// ============ SHELL (sidebar rail) ============
function Shell({active, go, children}) {
  const item = (k, label, target, n) => React.createElement('a', {
    href:'#', className:'rail-item '+(active===k?'active':''), 'data-hover':true,
    onClick:e=>{e.preventDefault(); go(target);}
  }, React.createElement('span',{className:'rail-label'}, label), n!=null && React.createElement('span',{className:'n'}, n));
  return React.createElement('div', { className: 'shell' },
    React.createElement('aside', { className: 'shell-rail' },
      React.createElement('a', {href:'#', className:'brand', 'data-hover':true, onClick:e=>{e.preventDefault(); go('home');}},
        React.createElement('span', { className:'mark' }),
        React.createElement('span', { className:'name' }, 'MY BLOG WEB.')
      ),
      React.createElement('div', { className:'rail-section' }, 'Workspace'),
      item('my', '我的文章', 'my', 8),
      item('new', '開始新文章', 'editor-new'),
      item('stats', '統計', 'stats'),
      React.createElement('div', { className:'rail-section' }, 'Library'),
      item('drafts', '草稿', 'my-drafts', 2),
      item('published', '已發布', 'my-published', 4),
      item('archived', '封存', 'my-archived', 1),
      React.createElement('div', { className:'rail-section' }, 'Back to'),
      item('home', 'Blog 首頁', 'home'),
      React.createElement('div', { className:'rail-foot' }, '© 2026', React.createElement('br'), 'Yuan Luca')
    ),
    React.createElement('main', { className: 'shell-main' }, children)
  );
}

// ============ EDITOR ============
function Editor({ uuid, go }) {
  const C = window.BLOG_CONTENT;
  const existing = uM(() => uuid==='new' ? null : C.myArticles.find(a=>a.uuid===uuid), [uuid]);
  const [title, setTitle] = uS(existing?.title || '');
  const [summary, setSummary] = uS(existing?.summary || '');
  const [md, setMd] = uS(existing ? C.articleBody : '# ' + (existing?.title || '還沒有標題') + '\n\n從這裡開始寫。支援 Markdown：標題 / 清單 / 引用 / 程式碼 / 連結。\n\n## §01. 第一個想法\n\n這裡先寫一段開場。');
  const [tags, setTags] = uS(existing?.tags || []);
  const [category, setCategory] = uS('c1');
  const [tagQuery, setTagQuery] = uS('');
  const [saving, setSaving] = uS('saved');
  const [showMeta, setShowMeta] = uS(true);
  const [mode, setMode] = uS(() => localStorage.getItem('blog.edMode') || 'split'); // 'write' | 'split' | 'preview'
  uE(() => { localStorage.setItem('blog.edMode', mode); }, [mode]);

  uE(() => {
    setSaving('typing');
    const t = setTimeout(() => setSaving('saved'), 900);
    return () => clearTimeout(t);
  }, [title, md, summary, tags]);

  const filteredTags = uM(() => {
    const pool = C.tagPool.filter(t => !tags.includes(t.name));
    if (!tagQuery) return pool.slice(0, 8);
    return pool.filter(t => t.name.toLowerCase().includes(tagQuery.toLowerCase())).slice(0,8);
  }, [tags, tagQuery, C]);

  const canCreateTag = tagQuery.trim() && !C.tagPool.some(t => t.name === tagQuery.trim().toLowerCase()) && !tags.includes(tagQuery.trim().toLowerCase());

  const lines = md.split('\n');
  const wordCount = md.trim().length;
  const taRef = uR(null);
  const fileRef = uR(null);
  const [images, setImages] = uS([]); // { name, url, size }
  const [dropping, setDropping] = uS(false);

  const insertAtCursor = (text) => {
    const ta = taRef.current;
    if (!ta) { setMd(m => m + '\n' + text + '\n'); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = md.slice(0,s) + text + md.slice(e);
    setMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + text.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const addImageFile = (file, alt, align) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const altText = alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g,' ');
    const al = align || 'center';
    const snippet = `\n\n![${altText}](${url} "align=${al}")\n\n`;
    insertAtCursor(snippet);
    setImages(prev => [...prev, { name: file.name, url, size: file.size, alt: altText, align: al }]);
  };

  const [pendingAlign, setPendingAlign] = uS('center');
  const [showInsertMenu, setShowInsertMenu] = uS(false);
  const [metaTab, setMetaTab] = uS('meta'); // 'meta' | 'outline'
  const [focus, setFocus] = uS(false);
  const [cursorLine, setCursorLine] = uS(0);

  // Track cursor line for outline highlight
  const onTaKeyUp = e => {
    const ta = e.target;
    const before = md.slice(0, ta.selectionStart);
    setCursorLine(before.split('\n').length - 1);
  };

  // Parse outline from markdown
  const outline = uM(() => {
    return md.split('\n').map((line, idx) => {
      const m = line.match(/^(#{1,3})\s+(.+)/);
      if (!m) return null;
      return { level: m[1].length, text: m[2].replace(/\*+/g,'').trim(), lineIdx: idx };
    }).filter(Boolean);
  }, [md]);

  // Jump to heading line in textarea
  const jumpToLine = lineIdx => {
    const ta = taRef.current; if (!ta) return;
    const lines = md.split('\n');
    const charsBefore = lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0);
    const lineEnd = charsBefore + lines[lineIdx].length;
    ta.focus();
    ta.setSelectionRange(charsBefore, lineEnd);
    const lh = 24; ta.scrollTop = Math.max(0, (lineIdx - 4) * lh);
    setCursorLine(lineIdx);
  };

  // Active outline heading (closest h at or before cursor)
  const activeOutlineIdx = uM(() => {
    const above = outline.filter(h => h.lineIdx <= cursorLine);
    return above.length > 0 ? above[above.length-1].lineIdx : -1;
  }, [outline, cursorLine]);

  // Focus mode: paragraph dimming
  const [focusPara, setFocusPara] = uS(-1);
  const onTaFocusScroll = e => {
    const ta = e.target;
    const before = md.slice(0, ta.selectionStart);
    const lineN = before.split('\n').length - 1;
    setFocusPara(lineN);
    onTaKeyUp(e);
  };

  const changeAlign = (idx, newAlign) => {
    setImages(prev => prev.map((im,i)=> i===idx ? {...im, align: newAlign} : im));
    // rewrite md: find the line with this url and replace title
    const target = images[idx];
    if (!target) return;
    const escUrl = target.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re = new RegExp('(!\\[[^\\]]*\\]\\(' + escUrl + ')(\\s+"[^"]*")?\\)');
    setMd(m => m.replace(re, `$1 "align=${newAlign}")`));
  };

  const jumpToImage = (url) => {
    const ta = taRef.current; if (!ta) return;
    const idx = md.indexOf(url);
    if (idx < 0) return;
    // find line start / end
    const lineStart = md.lastIndexOf('\n', idx - 1) + 1;
    let lineEnd = md.indexOf('\n', idx); if (lineEnd < 0) lineEnd = md.length;
    ta.focus();
    ta.setSelectionRange(lineStart, lineEnd);
    // approximate scroll
    const before = md.slice(0, lineStart);
    const lineNum = before.split('\n').length;
    const lineHeight = 24;
    ta.scrollTop = Math.max(0, (lineNum - 4) * lineHeight);
  };

  const onPickFiles = (e) => { Array.from(e.target.files || []).forEach(f => addImageFile(f, null, pendingAlign)); e.target.value = ''; setShowInsertMenu(false); };
  const onDrop = (e) => { e.preventDefault(); setDropping(false); Array.from(e.dataTransfer.files || []).forEach(f => addImageFile(f, null, 'center')); };
  const onDragOver = (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropping(true); } };
  const onDragLeave = () => setDropping(false);
  const onPaste = (e) => { const items = Array.from(e.clipboardData.items||[]); const imgs = items.filter(i => i.type.startsWith('image/')); if (imgs.length) { e.preventDefault(); imgs.forEach(i => addImageFile(i.getAsFile(), null, 'center')); } };

  const ALIGN_ICONS = {
    center: React.createElement('svg',{width:14,height:14,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:3.5,y:3,width:9,height:10,rx:0.8}),React.createElement('path',{d:'M1 5.5h1.5M13.5 5.5H15M1 10.5h1.5M13.5 10.5H15'})),
    wide:   React.createElement('svg',{width:14,height:14,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:1.5,y:3,width:13,height:10,rx:0.8})),
    full:   React.createElement('svg',{width:14,height:14,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:0.5,y:3,width:15,height:10})),
    left:   React.createElement('svg',{width:14,height:14,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:1.5,y:3,width:7,height:7,rx:0.8}),React.createElement('path',{d:'M9.5 4h5M9.5 7h5M9.5 10h5M1.5 13h13'})),
    right:  React.createElement('svg',{width:14,height:14,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:7.5,y:3,width:7,height:7,rx:0.8}),React.createElement('path',{d:'M1.5 4h5M1.5 7h5M1.5 10h5M1.5 13h13'})),
  };
  const ALIGN_OPTS = [
    ['center','Center · 置中'],
    ['wide','Wide · 寬版'],
    ['full','Full · 全幅'],
    ['left','Left · 浮左'],
    ['right','Right · 浮右'],
  ];
  const AlignRow = ({ value, onChange, compact }) =>
    React.createElement('div', { className: 'ed-align' + (compact?' compact':'') },
      ALIGN_OPTS.map(([k,label]) =>
        React.createElement('button', {
          key:k, 'data-hover':true,
          className: 'ed-align-btn '+(value===k?'active':''),
          onClick: ()=>onChange(k),
          title: label
        }, ALIGN_ICONS[k])
      )
    );

  return React.createElement('div', { className: 'ed-shell '+(focus?'focus-mode':''), onKeyDown:e=>{if(e.key==='Escape'&&focus){setFocus(false);}} },
    !focus && React.createElement('div', { className: 'ed-topbar' },
      React.createElement('button', { className: 'ed-back', 'data-hover':true, onClick:()=>go('my') }, '←', ' 我的文章'),
      React.createElement('input', {
        className: 'ed-title-input', placeholder: '為這篇文章取個標題…',
        value: title, onChange: e => setTitle(e.target.value)
      }),
      React.createElement('div', { className: 'ed-mode' },
        React.createElement('button', { 'data-hover':true, className: mode==='write'?'active':'', onClick:()=>setMode('write'), title:'只顯示編輯器' },
          React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.5},React.createElement('path',{d:'M2 3h12M2 7h12M2 11h8'})),
          'Write'
        ),
        React.createElement('button', { 'data-hover':true, className: mode==='split'?'active':'', onClick:()=>setMode('split'), title:'左寫 · 右看' },
          React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.5},React.createElement('rect',{x:1.5,y:2,width:6,height:12,rx:1}),React.createElement('rect',{x:8.5,y:2,width:6,height:12,rx:1,fill:'currentColor',opacity:0.15})),
          'Split'
        ),
        React.createElement('button', { 'data-hover':true, className: mode==='preview'?'active':'', onClick:()=>setMode('preview'), title:'只顯示預覽' },
          React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.5},React.createElement('path',{d:'M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z'}),React.createElement('circle',{cx:8,cy:8,r:2})),
          'Preview'
        )
      ),
      React.createElement('div', { className: 'ed-actions' },
        React.createElement('div', { className: 'ed-status' },
          React.createElement('span', { className: 'dot', style: { background: saving==='saved' ? '#47B881' : '#E0A820' } }),
          saving==='saved' ? '已自動儲存 · 剛剛' : '編輯中…'
        ),
        React.createElement('button', { className: 'ed-btn', 'data-hover':true, onClick:()=>setShowMeta(m=>!m) }, showMeta ? 'Hide meta' : 'Show meta'),
        React.createElement('button', { className: 'ed-btn '+(focus?'active':''), 'data-hover':true, onClick:()=>setFocus(f=>!f), title:'Focus mode (ESC to exit)' },
          React.createElement('svg',{width:13,height:13,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},
            React.createElement('path',{d:'M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3'})
          ),
          focus ? 'Exit focus' : 'Focus'
        ),
        React.createElement('button', { className: 'ed-btn', 'data-hover':true, onClick:()=>go('article', uuid) }, 'Preview ↗'),
        React.createElement('button', { className: 'ed-btn', 'data-hover':true }, 'Save draft'),
        React.createElement('button', { className: 'ed-btn primary', 'data-hover':true }, 'Submit for review →')
      )
    ),
    React.createElement('div', { className: 'ed-body mode-'+mode+' '+(showMeta?'':'no-meta') },
      // LEFT: markdown
      mode !== 'preview' && React.createElement('div', { className: 'ed-pane' },
        React.createElement('div', { className: 'ed-pane-head' },
          React.createElement('span', null, 'Markdown'),
          React.createElement('div', {className:'r'},
            React.createElement('div', {className:'ed-insert-wrap'},
              React.createElement('button', { 'data-hover':true, className:'ed-ph-btn', onClick:()=>setShowInsertMenu(v=>!v), title:'插入圖片' },
                React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.5},React.createElement('rect',{x:1.5,y:2.5,width:13,height:11,rx:1}),React.createElement('circle',{cx:5.5,cy:6.5,r:1.2}),React.createElement('path',{d:'M2 12l3.5-3.5 2.5 2.5 3-3 3 3'})),
                'Image'
              ),
              showInsertMenu && React.createElement('div', {className:'ed-insert-pop'},
                React.createElement('div', {className:'ed-insert-head'}, '插入圖片 · 選擇對齊方式'),
                React.createElement(AlignRow, {value: pendingAlign, onChange: setPendingAlign}),
                React.createElement('div', {className:'ed-insert-hint'}, ALIGN_OPTS.find(o=>o[0]===pendingAlign)[1]),
                React.createElement('button', {
                  className:'ed-insert-pick', 'data-hover':true,
                  onClick:()=>fileRef.current?.click()
                }, '選擇檔案…'),
                React.createElement('div', {className:'ed-insert-foot'}, '或直接拖拉／⌘V 貼上（預設 center）')
              )
            ),
            React.createElement('input', { ref: fileRef, type:'file', accept:'image/*', multiple:true, onChange:onPickFiles, style:{display:'none'} }),
            React.createElement('span', null, lines.length + ' lines'),
            React.createElement('span', null, wordCount + ' chars')
          )
        ),
        React.createElement('div', { className: 'ed-cm '+(dropping?'dropping':''), onDrop, onDragOver, onDragLeave },
          dropping && React.createElement('div', {className:'ed-drop-overlay'}, React.createElement('span',null, '放開以插入圖片')),
          React.createElement('div', {className:'ed-cm-inner'},
            React.createElement('div', {className:'ed-cm-gutter'},
              Array.from({length: Math.max(lines.length, 30)}).map((_,i)=>React.createElement('div',{key:i}, i+1))
            ),
            React.createElement('textarea', {
              ref: taRef, value: md,
              onChange: e => { setMd(e.target.value); onTaFocusScroll(e); },
              onKeyUp: onTaKeyUp,
              onClick: onTaKeyUp,
              onPaste, spellCheck: false,
              className: focus ? 'focus-textarea' : ''
            })
          )
        ),
        React.createElement('div', { className: 'ed-cm-footer' },
          React.createElement('span', null, 'Markdown · CodeMirror 6'),
          React.createElement('span', null, 'Ln ', lines.length, ' · Col 1')
        )
      ),
      // MIDDLE: preview
      mode !== 'write' && React.createElement('div', { className: 'ed-pane' },
        React.createElement('div', { className: 'ed-pane-head' },
          React.createElement('span', null, 'Preview'),
          React.createElement('div', {className:'r'}, React.createElement('span', null, 'Shiki · markdown-it'))
        ),
        React.createElement('div', { className: 'ed-preview' },
          React.createElement('div', { className: 'prose' },
            React.createElement('h1', null, title || '標題（預覽）'),
            summary && React.createElement('div', { className: 'lede' }, summary),
            React.createElement('div', { dangerouslySetInnerHTML: { __html: renderMd(md) } })
          )
        )
      ),
      // RIGHT: meta
      !focus && showMeta && React.createElement('div', { className: 'ed-pane ed-meta' },
        // Meta / Outline tab switcher
        React.createElement('div', { className: 'ed-meta-tabs' },
          React.createElement('button', { 'data-hover':true, className:'ed-meta-tab '+(metaTab==='meta'?'active':''), onClick:()=>setMetaTab('meta') }, 'Meta'),
          React.createElement('button', { 'data-hover':true, className:'ed-meta-tab '+(metaTab==='outline'?'active':''), onClick:()=>setMetaTab('outline') }, 'Outline')
        ),

        // OUTLINE tab
        metaTab === 'outline' && React.createElement('div', { className: 'ed-outline' },
          outline.length === 0
            ? React.createElement('div', { className: 'ed-outline-empty' }, '尚無標題', React.createElement('br'), React.createElement('span', null, '使用 # / ## / ### 新增大綱'))
            : outline.map((h, i) =>
                React.createElement('button', {
                  key: i, 'data-hover': true,
                  className: 'ed-outline-item level-'+h.level+' '+(activeOutlineIdx===h.lineIdx?'active':''),
                  onClick: ()=>jumpToLine(h.lineIdx),
                  style: { paddingLeft: (h.level-1)*14+8+'px' }
                },
                  React.createElement('span', { className: 'ed-outline-icon' }, h.level===1?'§':h.level===2?'¶':'·'),
                  React.createElement('span', { className: 'ed-outline-text' }, h.text)
                )
              )
        ),

        // META tab
        metaTab === 'meta' && React.createElement(React.Fragment, null,
        React.createElement('div', null,
          React.createElement('h5', null, 'Cover image · 封面'),
          React.createElement('div', { className: 'cover-upload', 'data-hover':true },
            '拖曳圖片到這裡', React.createElement('br'),
            React.createElement('span', {style:{fontSize:11, fontFamily:'var(--f-mono)', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted-2)'}}, '留空 · 後端自動生成')
          )
        ),
        React.createElement('div', null,
          React.createElement('h5', null, 'Images · 內文圖片',
            React.createElement('button', {
              className:'ed-img-add', 'data-hover':true,
              onClick:()=>{ setShowInsertMenu(true); setTimeout(()=>fileRef.current?.click(), 0); },
              title:'插入圖片（也可直接拖進編輯器 / 貼上）'
            }, '+ Insert')
          ),
          images.length === 0
            ? React.createElement('div', {className:'ed-img-empty'},
                '還沒有內文圖片', React.createElement('br'),
                React.createElement('span', null, '拖入編輯器 · ⌘V 貼上 · 或點 Insert'))
            : React.createElement('div', {className:'ed-img-list'},
                images.map((im, i) => React.createElement('div', {key:i, className:'ed-img-item'},
                  React.createElement('img', {src: im.url, alt: im.alt,
                    onClick:()=>jumpToImage(im.url), style:{cursor:'pointer'},
                    title:'點擊跳到編輯器對應行'
                  }),
                  React.createElement('div', {className:'ed-img-meta'},
                    React.createElement('b', {onClick:()=>jumpToImage(im.url), style:{cursor:'pointer'}}, im.alt),
                    React.createElement('span', null, (im.size/1024).toFixed(1)+' KB · ART_CONTENT'),
                    React.createElement(AlignRow, {value: im.align || 'center', onChange: a => changeAlign(i, a), compact: true})
                  ),
                  React.createElement('button', {
                    className:'ed-img-rm', 'data-hover':true, title:'從清單移除',
                    onClick:()=>setImages(images.filter((_,j)=>j!==i))
                  }, '×')
                ))
              )
        ),
        React.createElement('div', null,
          React.createElement('h5', null, 'Summary · 摘要'),
          React.createElement('textarea', { rows: 3, placeholder:'一段話，讓讀者決定要不要繼續。', value: summary, onChange: e=>setSummary(e.target.value) })
        ),
        React.createElement('div', null,
          React.createElement('h5', null, 'Category · 分類'),
          React.createElement('div', { className:'ed-cats' },
            C.categories.map(c =>
              React.createElement('button', {
                key:c.id, className: 'ed-cat '+(category===c.id?'active':''),
                'data-hover':true, onClick:()=>setCategory(c.id)
              }, c.name)
            )
          )
        ),
        React.createElement('div', { className: 'ed-tags-wrap' },
          React.createElement('h5', null, 'Tags · 標籤'),
          React.createElement('div', { className:'ed-tag-picked' },
            tags.length === 0 && React.createElement('span', {style:{fontSize:12,color:'var(--muted-2)'}}, '還沒有選標籤'),
            tags.map(t => React.createElement('span', {key:t, className:'ed-tag-chip'}, t,
              React.createElement('button', {'data-hover':true, onClick:()=>setTags(tags.filter(x=>x!==t))}, '×')
            ))
          ),
          React.createElement('div', { className: 'ed-tag-search' },
            React.createElement('input', { type:'text', placeholder:'搜尋或新建標籤…', value: tagQuery, onChange: e=>setTagQuery(e.target.value) })
          ),
          React.createElement('div', { className:'ed-tag-pool' },
            filteredTags.map(t => React.createElement('button', {
              key: t.name, className: 'ed-tag-opt', 'data-hover':true,
              onClick: () => { setTags([...tags, t.name]); setTagQuery(''); }
            }, React.createElement('span', null, t.name), React.createElement('span', {className:'n'}, t.articleCount))),
            canCreateTag && React.createElement('button', {
              className:'ed-tag-opt create', 'data-hover':true,
              onClick:()=>{ setTags([...tags, tagQuery.trim().toLowerCase()]); setTagQuery(''); }
            }, '＋ 新增「'+tagQuery.trim()+'」', React.createElement('span',{className:'n'}, 'new'))
          )
        ),
        React.createElement('div', null,
          React.createElement('h5', null, 'Status'),
          React.createElement('div', { className: 'ma-status '+(existing?.status||'DRAFT') }, STATUS_LABELS[existing?.status || 'DRAFT'])
        )
        )  // close React.Fragment for meta tab
      )  // close ed-meta pane
    ),

    // FOCUS MODE floating bar
    focus && React.createElement('div', { className: 'ed-focus-bar' },
      React.createElement('div', { className: 'ed-seg' },
        React.createElement('button', { 'data-hover':true, className: mode==='write'?'active':'', onClick:()=>setMode('write') }, 'Write'),
        React.createElement('button', { 'data-hover':true, className: mode==='split'?'active':'', onClick:()=>setMode('split') }, 'Split'),
        React.createElement('button', { 'data-hover':true, className: mode==='preview'?'active':'', onClick:()=>setMode('preview') }, 'Preview')
      ),
      React.createElement('span', { className: 'ed-focus-wc' }, wordCount, React.createElement('em',null,' chars')),
      React.createElement('button', { className: 'ed-focus-esc', 'data-hover':true, onClick:()=>setFocus(false) }, 'ESC · Exit focus')
    )
  );
}

// ============ ARTICLE DETAIL (used as Preview + Read) ============
function ArticleDetail({ uuid, go, fromEditor }) {
  const C = window.BLOG_CONTENT;
  const a = uM(() => C.myArticles.find(x => x.uuid === uuid) || C.myArticles[0], [uuid]);
  const [progress, setProgress] = uS(0);
  const [activeH, setActiveH] = uS('');
  const bodyRef = uR(null);
  const [chapters, setChapters] = uS([]);

  uE(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(100, (h.scrollTop / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  uE(() => {
    if (!bodyRef.current) return;
    const hs = Array.from(bodyRef.current.querySelectorAll('h2'));
    setChapters(hs.map(h => ({ id: h.id, text: h.textContent })));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveH(e.target.id); });
    }, { rootMargin: '-20% 0px -60% 0px' });
    hs.forEach(h => io.observe(h));
    return () => io.disconnect();
  }, [uuid]);

  const goChapter = id => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' }); };

  return React.createElement(React.Fragment, null,
    // Scroll progress
    React.createElement('div', { className: 'art-progress' },
      React.createElement('div', { className: 'bar', style: { width: progress + '%' } })
    ),
    // Chapter dots
    chapters.length > 0 && React.createElement('nav', { className: 'art-nav' },
      chapters.map((c,i) => React.createElement('a', {
        key: c.id, href: '#'+c.id,
        className: 'art-nav-dot '+(activeH===c.id?'active':''),
        'data-hover':true,
        onClick: e => { e.preventDefault(); goChapter(c.id); }
      }, React.createElement('span', { className: 'label' }, String(i+1).padStart(2,'0')+' — '+c.text)))
    ),
    fromEditor && React.createElement('div', { className: 'preview-bar' },
      React.createElement('span', null, '⊙ Preview mode · 僅作者可見'),
      React.createElement('button', { 'data-hover':true, onClick:()=>go('editor', uuid), style:{fontFamily:'var(--f-mono)', fontSize:11, letterSpacing:'0.16em', textTransform:'uppercase'} }, '← Back to editor')
    ),
    React.createElement('main', { className: 'article' },
      React.createElement('section', { className: 'art-hero wrap' },
        React.createElement('div', { className: 'art-hero-meta' },
          React.createElement('span', null, '§ ' + String(a.artTag).replace('ART · ','')),
          React.createElement('span', null, a.tags[0] || 'Essay'),
          React.createElement('span', null, '24 MIN READ'),
          React.createElement('span', null, a.updatedAt.replace(/-/g,' · '))
        ),
        React.createElement('h1', null, a.title),
        React.createElement('div', { className: 'lede' }, a.summary || '一段開場白，慢慢進入主題。'),
        React.createElement('div', { className: 'art-hero-foot' },
          React.createElement('div', { className: 'who' },
            React.createElement('div', { className:'avatar' }),
            React.createElement('div', null,
              React.createElement('b', null, 'Yuan Luca'),
              React.createElement('span', null, 'Frontend · Taiwan')
            )
          ),
          React.createElement('div', { className: 'ma-metrics' },
            React.createElement('span', null, React.createElement('b',null, a.viewCount.toLocaleString()), ' views'),
            React.createElement('span', null, React.createElement('b',null, a.likeCount), ' ♡'),
            React.createElement('span', null, React.createElement('b',null, a.commentCount), ' ⎗')
          )
        )
      ),
      React.createElement('div', { className: 'wrap' },
        React.createElement('div', { className:'art-cover' },
          React.createElement('span', {className:'cover-tag'}, 'COVER · '+a.artTag),
          React.createElement('span', {className:'cover-num'}, String(a.artTag).replace('ART · ','№'))
        )
      ),
      React.createElement('article', { className: 'wrap' },
        React.createElement('div', { className: 'art-body prose', ref: bodyRef,
          dangerouslySetInnerHTML: { __html: renderMd(C.articleBody) }
        })
      ),
      React.createElement('div', { className:'wrap' },
        React.createElement('div', { className:'art-end' },
          React.createElement('div', {className:'reactions'},
            React.createElement('button', {className:'react', 'data-hover':true}, '♡', React.createElement('span',{className:'n'}, a.likeCount)),
            React.createElement('button', {className:'react', 'data-hover':true}, '⎗', React.createElement('span',{className:'n'}, a.commentCount)),
            React.createElement('button', {className:'react', 'data-hover':true}, '↗ Share')
          ),
          React.createElement('a', { className:'react', 'data-hover':true, href:'#top', onClick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});} }, 'Back to top ↑')
        )
      ),
      React.createElement(Comments, { articleUuid: uuid })
    )
  );
}

// ============ COMMENTS ============
function Comments({ articleUuid }) {
  const C = window.BLOG_CONTENT || {};
  const [comments, setComments] = uS(() => (C.comments || []).map(c => ({...c, replies: (c.replies||[]).map(r=>({...r}))})));
  const [body, setBody] = uS('');
  const [preview, setPreview] = uS(false);
  const [replyTo, setReplyTo] = uS(null);
  const [replyBody, setReplyBody] = uS('');
  const [collapsed, setCollapsed] = uS({});
  const THRESHOLD = 3;

  const toggleLike = (cid, rid) => {
    setComments(prev => prev.map(c => {
      if (rid) {
        if (c.id !== cid) return c;
        return { ...c, replies: c.replies.map(r => r.id === rid ? { ...r, liked: !r.liked, likes: r.liked ? r.likes-1 : r.likes+1 } : r) };
      }
      if (c.id !== cid) return c;
      return { ...c, liked: !c.liked, likes: c.liked ? c.likes-1 : c.likes+1 };
    }));
  };

  const postComment = e => {
    e.preventDefault();
    if (!body.trim()) return;
    setComments(prev => [{ id:'u'+Date.now(), author:'You', handle:'you', time:'Just now', body:body.trim(), likes:0, liked:false, replies:[] }, ...prev]);
    setBody(''); setPreview(false);
  };

  const postReply = cid => {
    if (!replyBody.trim()) return;
    setComments(prev => prev.map(c => c.id===cid ? {...c, replies:[...c.replies, {id:'ur'+Date.now(), author:'You', handle:'you', time:'Just now', body:replyBody.trim(), likes:0, liked:false}]} : c));
    setReplyTo(null); setReplyBody('');
  };

  const Av = ({ name }) => React.createElement('div', { className:'cm-av', style:{background:`hsl(${(name.charCodeAt(0)*47)%360}deg 28% ${name==='You'?'30':'38'}%)`} }, name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase());

  const CMBody = ({ t }) => React.createElement('div', { className:'cm-body', dangerouslySetInnerHTML:{__html: t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>')} });

  const total = comments.reduce((s,c)=>s+1+c.replies.length, 0);

  const CommentRow = ({ c, isReply }) => React.createElement('article', { className:'cm-comment '+(isReply?'reply':'') },
    React.createElement(Av, { name: c.author }),
    React.createElement('div', { className:'cm-right' },
      React.createElement('div', { className:'cm-meta' },
        React.createElement('span', { className:'cm-name' }, c.author),
        React.createElement('span', { className:'cm-time' }, c.time)
      ),
      React.createElement(CMBody, { t: c.body }),
      React.createElement('div', { className:'cm-actions' },
        React.createElement('button', { className:'cm-act '+(c.liked?'liked':''), 'data-hover':true, onClick:()=>toggleLike(isReply?c._parent:c.id, isReply?c.id:null) },
          '♡', React.createElement('span',null, c.likes)
        ),
        !isReply && React.createElement('button', { className:'cm-act '+(replyTo===c.id?'active':''), 'data-hover':true, onClick:()=>setReplyTo(replyTo===c.id?null:c.id) },
          replyTo===c.id ? 'Cancel' : 'Reply'
        )
      ),
      !isReply && replyTo===c.id && React.createElement('div', { className:'cm-reply-compose' },
        React.createElement('textarea', { className:'cm-textarea sm', rows:3, placeholder:`回覆 @${c.author}… 支援 **粗體**、\`code\``, value:replyBody, onChange:e=>setReplyBody(e.target.value) }),
        replyBody.trim() && React.createElement('div', { className:'cm-compose-foot' },
          React.createElement('button', { 'data-hover':true, className:'cm-post-btn sm', onClick:()=>postReply(c.id) }, 'Reply →')
        )
      ),
      !isReply && c.replies.length > 0 && React.createElement('div', { className:'cm-replies' },
        (collapsed[c.id]===false ? c.replies : c.replies.slice(0, THRESHOLD)).map(r =>
          React.createElement(CommentRow, { key:r.id, c:{...r, _parent:c.id}, isReply:true })
        ),
        c.replies.length > THRESHOLD && React.createElement('button', {
          className:'cm-show-more', 'data-hover':true,
          onClick:()=>setCollapsed(p=>({...p,[c.id]:p[c.id]===false?true:false}))
        }, collapsed[c.id]===false ? '收起回覆 ↑' : `展開另 ${c.replies.length-THRESHOLD} 則回覆 ↓`)
      )
    )
  );

  return React.createElement('section', { className:'cm-section wrap' },
    React.createElement('div', { className:'cm-head' },
      React.createElement('span', { className:'td-mono' }, '§ Comments'),
      React.createElement('span', { className:'cm-count' }, total, ' 則留言')
    ),
    React.createElement('form', { className:'cm-compose', onSubmit:postComment },
      React.createElement('div', { className:'cm-compose-top' },
        React.createElement(Av, { name:'You' }),
        React.createElement('div', { className:'cm-compose-right' },
          !preview
            ? React.createElement('textarea', { className:'cm-textarea', rows:4, placeholder:'留下你的想法… 支援 **粗體**、*斜體*、`code`', value:body, onChange:e=>setBody(e.target.value) })
            : React.createElement('div', { className:'cm-preview-box' },
                body.trim() ? React.createElement(CMBody,{t:body}) : React.createElement('span',{className:'cm-empty-preview'},'輸入內容後可預覽…')
              )
        )
      ),
      body.trim() && React.createElement('div', { className:'cm-compose-foot' },
        React.createElement('button', { type:'button', 'data-hover':true, className:'cm-foot-btn '+(preview?'active':''), onClick:()=>setPreview(p=>!p) }, preview?'Edit':'Preview'),
        React.createElement('button', { type:'submit', 'data-hover':true, className:'cm-post-btn' }, 'Post comment →')
      )
    ),
    comments.length===0
      ? React.createElement('div',{className:'cm-empty'},'還沒有人留言，你來第一個。')
      : React.createElement('div',{className:'cm-thread'},
          comments.map(c => React.createElement(CommentRow, {key:c.id, c, isReply:false}))
        )
  );
}

// ============ TAG DETAIL ============
function TagDetail({ tag, go }) {
  uE(() => { window.scrollTo({ top: 0 }); }, [tag]);

  const C = window.BLOG_CONTENT || {};
  const tagData = (C.tags || []).find(t => t.name === tag) || { name: tag, n: 0 };

  // All articles that mention this tag (mock: filter by tag name in category/tag field)
  const all = [...(C.trending || []), ...(C.latest || [])];
  const articles = all.filter(a => {
    const haystack = [(a.category||''),(a.tag||''),(a.title||'')].join(' ').toLowerCase();
    return haystack.includes(tag.toLowerCase());
  });
  // Fallback: show latest if tag has articles but none matched
  const list = articles.length > 0 ? articles : (C.latest || []).slice(0, tagData.n || 4);

  // Related tags: pick a few that aren't this one
  const related = (C.tags || []).filter(t => t.name !== tag).slice(0, 8);

  // Tag descriptions (mock)
  const DESC = {
    'vue 3': 'Composition API、Pinia、VueRouter 4 到 SSR，記錄從 Options API 移過來的每一個轉折點。',
    'tailwind': 'v3 到 v4 的遷移筆記，plugin 撰寫，以及我為什麼在 prose 之外幾乎不用 @apply。',
    'css': 'cascade layers、container queries、oklch 色彩空間，以及一些只有自己懂的 specificity 焦慮。',
    'design systems': '800 行 tokens.css 的誕生過程，以及如何在 side project 裡讓設計不再拖垮自己。',
    'tdd': 'Vitest + happy-dom 的組合筆記，測試先行的心理學，以及怎麼讓 CI 跑得比你的直覺還快。',
    'essay': '不是教學，也不是筆記。只是想把一件事說清楚。',
  };
  const desc = DESC[tag] || `關於 #${tag} 的所有文章與紀錄。`;

  return React.createElement('div', { className: 'td-page' },
    // Back link
    React.createElement('div', { className: 'td-back wrap' },
      React.createElement('a', {
        href: '#', className: 'td-back-link', 'data-hover': true,
        onClick: e => { e.preventDefault(); go('articles'); }
      }, '← 所有標籤')
    ),

    // Header
    React.createElement('header', { className: 'td-header wrap' },
      React.createElement('div', { className: 'td-header-inner' },
        React.createElement('div', { className: 'td-eyebrow' },
          React.createElement('span', { className: 'td-mono' }, '§ TAG'),
          React.createElement('span', { className: 'td-mono' }, `${list.length} articles`)
        ),
        React.createElement('h1', { className: 'td-title' }, '#', tagData.name),
        React.createElement('p', { className: 'td-desc' }, desc),
        React.createElement('div', { className: 'td-related' },
          React.createElement('span', { className: 'td-mono td-related-label' }, 'Related →'),
          related.map((t, i) =>
            React.createElement('button', {
              key: i, className: 'td-rel-pill', 'data-hover': true,
              onClick: () => go('tag', t.name)
            }, '#', t.name, React.createElement('span', { className: 'td-rel-n' }, t.n))
          )
        )
      )
    ),

    // Divider
    React.createElement('div', { className: 'td-divider wrap' }),

    // Article list
    React.createElement('main', { className: 'td-list wrap' },
      list.map((a, i) =>
        React.createElement('article', {
          key: i, className: 'td-row', 'data-hover': true,
          onClick: () => go('article', a.uuid || 'a1')
        },
          React.createElement('div', { className: 'td-row-left' },
            React.createElement('div', { className: 'td-thumb', 'data-cat': (a.category || a.tag || 'Essay').toUpperCase() },
              React.createElement('span', { className: 'td-thumb-n' }, String(i + 1).padStart(2, '0'))
            )
          ),
          React.createElement('div', { className: 'td-row-body' },
            React.createElement('div', { className: 'td-row-meta' },
              React.createElement('span', { className: 'td-mono' }, a.category || a.tag || 'Essay'),
              React.createElement('span', { className: 'td-dot' }),
              React.createElement('span', { className: 'td-mono' }, a.date || '2026')
            ),
            React.createElement('h3', { className: 'td-row-title' }, a.title),
            (a.excerpt || a.lede) && React.createElement('p', { className: 'td-row-excerpt' },
              (a.excerpt || a.lede).slice(0, 160) + ((a.excerpt || a.lede).length > 160 ? '…' : '')
            )
          ),
          React.createElement('div', { className: 'td-row-arr' }, '→')
        )
      )
    ),

    // Footer back link
    React.createElement('div', { className: 'td-foot wrap' },
      React.createElement('a', {
        href: '#', className: 'td-back-link', 'data-hover': true,
        onClick: e => { e.preventDefault(); go('home'); }
      }, '← 回首頁')
    )
  );
}

// ============ AUTHOR PROFILE ============
function AuthorProfile({ handle, go }) {
  uE(() => { window.scrollTo({ top: 0 }); }, [handle]);
  // Force reveal all cards immediately (no IntersectionObserver in this view)
  uE(() => {
    const els = document.querySelectorAll('.ap-page .reveal:not(.in)');
    els.forEach(el => el.classList.add('in'));
  });

  const C = window.BLOG_CONTENT || {};
  const authors = C.authors || [];
  const author = authors.find(a => a.handle === handle) || {
    handle: handle || 'yuanluca',
    name: 'Yuan Luca',
    role: 'Frontend · Taipei',
    articleCount: 42,
  };

  // Mock extended author data
  const PROFILES = {
    yuanluca: {
      bio: '寫 Vue 3、設計系統、以及那些花很長時間才想清楚的事。Frontend @ Taipei。平時喜歡把一件事說清楚，偶爾在咖啡館裡寫草稿。',
      joined: '2023 · Q3',
      views: '2.1k',
      social: { github: 'yuanluca', twitter: 'yuanluca_dev' },
      pinned: [0, 2],
    },
    kimura: {
      bio: 'Design systems, motion, and the space between pixels. Based in Tokyo.',
      joined: '2024 · Q1',
      views: '890',
      social: { github: 'kimura-a' },
      pinned: [0],
    },
  };
  const profile = PROFILES[author.handle] || PROFILES['yuanluca'];

  // Use articlesFeed (rich data), filter by handle
  const feed = (C.articlesFeed || []).filter(a => a.authorHandle === handle);
  // Fallback to trending/latest if feed is empty for this handle
  const allFallback = [...(C.trending || []), ...(C.latest || [])];
  const feedData = feed.length > 0 ? feed : allFallback.slice(0, author.articleCount || 6);

  // Map feedData to unified shape
  const normalize = a => ({
    uuid: a.uuid || 'a1',
    title: a.title,
    summary: a.summary || a.excerpt || a.lede || '',
    category: a.category || a.tag || 'Essay',
    updatedAt: a.updatedAt || a.date || '2026-01-01',
    tags: a.tags || [],
    viewCount: a.viewCount || 0,
    likeCount: a.likeCount || 0,
    commentCount: a.commentCount || 0,
    artTag: a.artTag || (a.category || a.tag || 'ESSAY').toUpperCase(),
  });
  const articles = feedData.map(normalize);
  const pinned = profile.pinned.map(i => articles[i]).filter(Boolean);

  // List controls
  const [artView, setArtView] = uS(() => localStorage.getItem('blog.ap.view') || 'grid');
  const [sort, setSort] = uS(() => localStorage.getItem('blog.ap.sort') || 'latest');
  const [paging, setPaging] = uS(() => localStorage.getItem('blog.ap.paging') || 'infinite');
  const [page, setPage] = uS(1);
  const sentRef = uR(null);

  uE(() => { localStorage.setItem('blog.ap.view', artView); }, [artView]);
  uE(() => { localStorage.setItem('blog.ap.sort', sort); }, [sort]);
  uE(() => { localStorage.setItem('blog.ap.paging', paging); }, [paging]);

  const sorted = uM(() => {
    let r = [...articles]; // show ALL articles including pinned
    if (sort === 'popular') r = [...r].sort((a,b) => b.viewCount - a.viewCount);
    else if (sort === 'commented') r = [...r].sort((a,b) => b.commentCount - a.commentCount);
    return r;
  }, [articles, sort]);
  const pinnedUuids = new Set(profile.pinned.map(i => articles[i]?.uuid).filter(Boolean));

  const PER = 6;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER));
  const visible = paging === 'pagination'
    ? sorted.slice((page-1)*PER, page*PER)
    : sorted.slice(0, page * PER);

  uE(() => { setPage(1); }, [sort, paging]);
  uE(() => {
    if (paging !== 'infinite' || !sentRef.current) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && page * PER < sorted.length) setPage(p => p+1); });
    }, { rootMargin: '200px' });
    io.observe(sentRef.current);
    return () => io.disconnect();
  }, [paging, page, sorted.length]);

  return React.createElement('div', { className: 'ap-page' },

    // Back
    React.createElement('div', { className: 'ap-back wrap' },
      React.createElement('a', {
        href: '#', className: 'td-back-link', 'data-hover': true,
        onClick: e => { e.preventDefault(); go('home'); }
      }, '← 回首頁')
    ),

    // Hero
    React.createElement('header', { className: 'ap-header wrap' },
      React.createElement('div', { className: 'ap-avatar-col' },
        React.createElement('div', { className: 'ap-avatar' },
          React.createElement('span', { className: 'ap-avatar-init' },
            author.name.split(' ').map(p => p[0]).slice(0, 2).join('')
          )
        )
      ),
      React.createElement('div', { className: 'ap-info' },
        React.createElement('div', { className: 'ap-eyebrow td-mono' }, '§ AUTHOR'),
        React.createElement('h1', { className: 'ap-name' }, author.name),
        React.createElement('div', { className: 'ap-role' }, author.role),
        React.createElement('p', { className: 'ap-bio' }, profile.bio),
        React.createElement('div', { className: 'ap-stats' },
          React.createElement('span', { className: 'ap-stat' },
            React.createElement('span', { className: 'ap-stat-n' }, author.articleCount),
            React.createElement('span', { className: 'ap-stat-l' }, 'articles')
          ),
          React.createElement('span', { className: 'ap-stat-div' }),
          React.createElement('span', { className: 'ap-stat' },
            React.createElement('span', { className: 'ap-stat-n' }, profile.views),
            React.createElement('span', { className: 'ap-stat-l' }, 'total views')
          ),
          React.createElement('span', { className: 'ap-stat-div' }),
          React.createElement('span', { className: 'ap-stat' },
            React.createElement('span', { className: 'ap-stat-n' }, profile.joined),
            React.createElement('span', { className: 'ap-stat-l' }, 'joined')
          )
        ),
        React.createElement('div', { className: 'ap-social' },
          profile.social.github && React.createElement('a', {
            href: '#', className: 'ap-social-link', 'data-hover': true,
            onClick: e => e.preventDefault()
          },
            React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' },
              React.createElement('path', { d: 'M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48 1 .1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.94 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.3c0 .32.22.69.82.58A12 12 0 0 0 12 .5z' })
            ),
            '@', profile.social.github
          ),
          profile.social.twitter && React.createElement('a', {
            href: '#', className: 'ap-social-link', 'data-hover': true,
            onClick: e => e.preventDefault()
          },
            React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' },
              React.createElement('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z' })
            ),
            '@', profile.social.twitter
          ),
          React.createElement('a', {
            href: '#', className: 'ap-social-link', 'data-hover': true,
            onClick: e => e.preventDefault()
          },
            React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
              React.createElement('path', { d: 'M4 11a9 9 0 0 1 9 9' }),
              React.createElement('path', { d: 'M4 4a16 16 0 0 1 16 16' }),
              React.createElement('circle', { cx: 5, cy: 19, r: 1, fill: 'currentColor', stroke: 'none' })
            ),
            'RSS'
          )
        )
      )
    ),

    React.createElement('div', { className: 'td-divider wrap' }),

    // Pinned
    pinned.length > 0 && React.createElement('section', { className: 'ap-section wrap' },
      React.createElement('div', { className: 'ap-section-head' },
        React.createElement('span', { className: 'td-mono' }, '§ Pinned · 精選'),
        React.createElement('span', { className: 'td-mono', style: { color: 'var(--muted-2)' } }, pinned.length + ' posts')
      ),
      React.createElement('div', { className: 'ap-pinned-grid' },
        pinned.map((a, i) =>
          React.createElement('article', {
            key: i, className: 'ap-pin-card', 'data-hover': true,
            onClick: () => go('article', a.uuid || 'a1')
          },
            React.createElement('div', { className: 'ap-pin-thumb', 'data-cat': (a.category || a.tag || 'ESSAY').toUpperCase() },
              React.createElement('span', { className: 'ap-pin-n' }, '★')
            ),
            React.createElement('div', { className: 'ap-pin-body' },
              React.createElement('div', { className: 'td-row-meta', style: { marginBottom: 8 } },
                React.createElement('span', { className: 'td-mono' }, a.category || a.tag || 'Essay'),
                React.createElement('span', { className: 'td-dot' }),
                React.createElement('span', { className: 'td-mono' }, a.date || '2026')
              ),
              React.createElement('h3', { className: 'ap-pin-title' }, a.title),
              (a.excerpt || a.lede) && React.createElement('p', { className: 'ap-pin-excerpt' },
                (a.excerpt || a.lede).slice(0, 120) + '…'
              )
            )
          )
        )
      )
    ),

    // All articles — full toolbar + cards
    React.createElement('section', { className: 'ap-section wrap' },
      React.createElement('div', { className: 'ap-section-head' },
        React.createElement('span', { className: 'td-mono' }, '§ All Articles · ', sorted.length, ' posts'),
        React.createElement('div', { className: 'ap-tb-right' },
          // sort
          React.createElement('div', { className: 'art-seg' },
            [['latest','Latest'],['popular','Popular'],['commented','Most commented']].map(([k,l]) =>
              React.createElement('button', { key:k, 'data-hover':true, className: sort===k?'active':'', onClick:()=>setSort(k) }, l)
            )
          ),
          // view
          React.createElement('div', { className: 'art-seg art-seg-icon' },
            React.createElement('button', { 'data-hover':true, className: artView==='list'?'active':'', onClick:()=>setArtView('list'), title:'List' },
              React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('path',{d:'M2 4h12M2 8h12M2 12h12'}))
            ),
            React.createElement('button', { 'data-hover':true, className: artView==='grid'?'active':'', onClick:()=>setArtView('grid'), title:'Grid' },
              React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:2,y:2,width:5,height:5}),React.createElement('rect',{x:9,y:2,width:5,height:5}),React.createElement('rect',{x:2,y:9,width:5,height:5}),React.createElement('rect',{x:9,y:9,width:5,height:5}))
            )
          ),
          // paging
          React.createElement('div', { className: 'art-seg' },
            React.createElement('button', { 'data-hover':true, className: paging==='pagination'?'active':'', onClick:()=>setPaging('pagination') }, 'Pages'),
            React.createElement('button', { 'data-hover':true, className: paging==='infinite'?'active':'', onClick:()=>setPaging('infinite') }, '∞')
          )
        )
      ),

      // Cards
      React.createElement('div', { className: artView === 'grid' ? 'art-grid' : 'art-list' },
        visible.map((a, i) => artView === 'grid'
          ? React.createElement('article', { key: a.uuid+'_'+i, className: 'art-card-g reveal' },
              React.createElement('a', { href:'#', onClick:e=>{e.preventDefault();go&&go('article',a.uuid);}, className:'art-card-thumb', 'data-tag':a.artTag },
                pinnedUuids.has(a.uuid) && React.createElement('span', { className:'ap-pin-star' }, '★ Pinned')
              ),
              React.createElement('div', { className:'art-card-body' },
                React.createElement('div', { className:'art-card-meta' },
                  React.createElement('span', null, a.category),
                  React.createElement('span', null, '·'),
                  React.createElement('span', null, a.updatedAt.replace(/-/g,'.'))
                ),
                React.createElement('h4', null, React.createElement('a', { href:'#', onClick:e=>{e.preventDefault();go&&go('article',a.uuid);} }, a.title)),
                React.createElement('p', null, a.summary.slice(0,120)+(a.summary.length>120?'…':'')),
                React.createElement('div', { className:'art-card-foot' },
                  React.createElement('div', { className:'art-card-tags' },
                    a.tags.slice(0,2).map(t => React.createElement('span', { key:t, className:'mini-tag' }, '#'+t))
                  ),
                  React.createElement('div', { className:'art-card-stats' },
                    React.createElement('span', null, a.viewCount.toLocaleString(), ' views'),
                    React.createElement('span', null, a.likeCount, ' ♡')
                  )
                )
              )
            )
          : React.createElement('article', { key: a.uuid+'_'+i, className:'art-row reveal' },
              React.createElement('span', { className:'art-row-n' }, String(i+1).padStart(3,'0')),
              React.createElement('a', { href:'#', onClick:e=>{e.preventDefault();go&&go('article',a.uuid);}, className:'art-row-thumb', 'data-tag':a.artTag }),
              React.createElement('div', { className:'art-row-body' },
                React.createElement('div', { className:'art-row-meta' },
                  React.createElement('span', null, a.category),
                  React.createElement('span', null, a.updatedAt.replace(/-/g,'.')),
                  a.tags.slice(0,2).map(t => React.createElement('span', { key:t, className:'art-row-tag' }, '#'+t))
                ),
                React.createElement('h3', null, React.createElement('a', { href:'#', onClick:e=>{e.preventDefault();go&&go('article',a.uuid);} }, a.title)),
                React.createElement('p', null, a.summary)
              ),
              React.createElement('div', { className:'art-row-stats' },
                React.createElement('div', null, React.createElement('b',null,a.viewCount.toLocaleString()), React.createElement('span',null,' views')),
                React.createElement('div', null, React.createElement('b',null,a.likeCount), React.createElement('span',null,' ♡'))
              ),
              React.createElement('span', { className:'art-row-arr' }, '→')
            )
        )
      ),

      // Pagination / Infinite sentinel
      sorted.length > 0 && paging === 'pagination' && React.createElement('div', { className:'art-pager' },
        React.createElement('button', { 'data-hover':true, disabled: page===1, onClick:()=>setPage(p=>Math.max(1,p-1)) }, '← Prev'),
        React.createElement('div', { className:'art-pager-nums' },
          Array.from({length: totalPages}).map((_,i) =>
            React.createElement('button', { key:i, 'data-hover':true, className: page===(i+1)?'active':'', onClick:()=>setPage(i+1) }, String(i+1).padStart(2,'0'))
          )
        ),
        React.createElement('button', { 'data-hover':true, disabled: page===totalPages, onClick:()=>setPage(p=>Math.min(totalPages,p+1)) }, 'Next →')
      ),
      sorted.length > 0 && paging === 'infinite' && (page * PER < sorted.length
        ? React.createElement('div', { ref: sentRef, className:'art-sentinel' },
            React.createElement('span', null, 'Loading more…'),
            React.createElement('span', { className:'dots' }, React.createElement('i'),React.createElement('i'),React.createElement('i'))
          )
        : React.createElement('div', { className:'art-sentinel done' },
            React.createElement('span', null, 'END · 共 '+sorted.length+' 篇')
          )
      )
    )
  );
}

// Export to window for app.jsx
window.BlogViews = { MyArticles, Editor, ArticleDetail, TagDetail, AuthorProfile };
