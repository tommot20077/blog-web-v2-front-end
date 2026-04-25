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

  return React.createElement('div', { className: 'ed-shell' },
    React.createElement('div', { className: 'ed-topbar' },
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
              ref: taRef, value: md, onChange: e => setMd(e.target.value), onPaste, spellCheck: false
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
      showMeta && React.createElement('div', { className: 'ed-pane ed-meta' },
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
      )
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
      )
    )
  );
}

// Export to window for app.jsx
window.BlogViews = { MyArticles, Editor, ArticleDetail };
