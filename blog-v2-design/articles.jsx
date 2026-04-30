/* global React */
// ============ ARTICLES PAGE (full catalog) ============
const { useState: aS, useEffect: aE, useMemo: aM, useRef: aR } = React;

function ArticlesPage({ go, preFilter }) {
  const C = window.BLOG_CONTENT;
  // Reveal-on-enter for cards (re-scan on content change)
  aE(() => {
    const els = document.querySelectorAll('.art-page .reveal:not(.in)');
    els.forEach(el => el.classList.add('in'));
  });

  const all = aM(() => {
    // real, diverse dataset for testing
    const base = window.BLOG_CONTENT.articlesFeed || [];
    return base;
  }, [C]);

  // view controls
  const [view, setView] = aS(() => localStorage.getItem('blog.art.view') || 'grid');
  const [sort, setSort] = aS(() => (preFilter === 'popular' ? 'popular' : (localStorage.getItem('blog.art.sort') || 'latest')));
  const [paging, setPaging] = aS(() => localStorage.getItem('blog.art.paging') || 'infinite');
  const [page, setPage] = aS(1);
  const [selTags, setSelTags] = aS([]);
  const [selCats, setSelCats] = aS([]);
  const [selAuthors, setSelAuthors] = aS([]);
  const [dateRange, setDateRange] = aS('any');

  aE(() => { localStorage.setItem('blog.art.view', view); }, [view]);
  aE(() => { localStorage.setItem('blog.art.sort', sort); }, [sort]);
  aE(() => { localStorage.setItem('blog.art.paging', paging); }, [paging]);

  const filtered = aM(() => {
    let r = all;
    if (selTags.length) r = r.filter(a => selTags.every(t => a.tags.includes(t)));
    if (selCats.length) r = r.filter(a => selCats.includes(a.category));
    if (selAuthors.length) r = r.filter(a => selAuthors.includes(a.authorHandle));
    if (dateRange !== 'any') {
      const m = { '30':30, '90':90, '365':365 }[dateRange];
      if (m) { const cut = Date.now() - m*86400000; r = r.filter(a => new Date(a.updatedAt).getTime() >= cut); }
    }
    if (sort === 'popular') r = [...r].sort((a,b)=>b.viewCount-a.viewCount);
    else if (sort === 'commented') r = [...r].sort((a,b)=>b.commentCount-a.commentCount);
    else r = [...r].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    return r;
  }, [all, selTags, selCats, selAuthors, dateRange, sort]);

  const PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = paging === 'pagination'
    ? filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
    : filtered.slice(0, page * PER_PAGE);

  aE(() => { setPage(1); }, [selTags, selCats, selAuthors, dateRange, sort, paging]);

  // infinite scroll sentinel
  const sentRef = aR(null);
  aE(() => {
    if (paging !== 'infinite') return;
    if (!sentRef.current) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && page * PER_PAGE < filtered.length) setPage(p => p + 1); });
    }, { rootMargin: '200px' });
    io.observe(sentRef.current);
    return () => io.disconnect();
  }, [paging, page, filtered.length]);

  const toggleTag = t => setSelTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  const toggleCat = c => setSelCats(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
  const toggleAuthor = h => setSelAuthors(prev => prev.includes(h) ? prev.filter(x=>x!==h) : [...prev, h]);
  const clearAll = () => { setSelTags([]); setSelCats([]); setSelAuthors([]); setDateRange('any'); };

  const totalActive = selTags.length + selCats.length + selAuthors.length + (dateRange!=='any'?1:0);

  return React.createElement('main', { className: 'art-page' },
    // BODY
    React.createElement('div', { className: 'art-page-body wrap' },
      // RAIL
      React.createElement('aside', { className: 'art-rail' },
        React.createElement('div', {className:'art-rail-head'},
          React.createElement('span', null, 'FILTERS'),
          totalActive > 0 && React.createElement('button', {'data-hover':true, onClick:clearAll, className:'clear'}, 'Clear · '+totalActive)
        ),

        React.createElement('div', {className:'art-rail-group'},
          React.createElement('h5', null, 'Date'),
          React.createElement('div', {className:'art-radio-row'},
            [['any','Any'],['30','Last 30'],['90','Last 90'],['365','This year']].map(([k,l]) =>
              React.createElement('button', {
                key:k, 'data-hover':true,
                className: 'art-chip '+(dateRange===k?'active':''),
                onClick:()=>setDateRange(k)
              }, l)
            )
          )
        ),

        React.createElement('div', {className:'art-rail-group'},
          React.createElement('h5', null, 'Category'),
          C.categories.map(c => React.createElement('label', {key:c.id, className:'art-check'},
            React.createElement('input', {type:'checkbox', checked: selCats.includes(c.id), onChange:()=>toggleCat(c.id)}),
            React.createElement('span', {className:'box'}),
            React.createElement('span', {className:'l'}, c.name)
          ))
        ),

        React.createElement('div', {className:'art-rail-group'},
          React.createElement('h5', null, 'Tags'),
          React.createElement('div', {className:'art-tag-grid'},
            C.tagPool.slice(0, 12).map(t => React.createElement('button', {
              key:t.name, 'data-hover':true,
              className: 'art-tag '+(selTags.includes(t.name)?'active':''),
              onClick:()=>toggleTag(t.name)
            }, t.name, React.createElement('span',{className:'n'}, t.articleCount)))
          )
        ),

        React.createElement('div', {className:'art-rail-group'},
          React.createElement('h5', null, 'Author'),
          (C.authors || []).map(a => React.createElement('label', {key:a.handle, className:'art-check'},
            React.createElement('input', {type:'checkbox', checked: selAuthors.includes(a.handle), onChange:()=>toggleAuthor(a.handle)}),
            React.createElement('span', {className:'box'}),
            React.createElement('span', {className:'l'}, a.name),
            React.createElement('span', {className:'rt'}, a.articleCount)
          ))
        )
      ),

      // MAIN
      React.createElement('section', { className: 'art-page-main' },
        // toolbar
        React.createElement('div', { className: 'art-toolbar' },
          React.createElement('div', {className:'art-tb-left'},
            React.createElement('span', {className:'art-tb-count'}, filtered.length, React.createElement('em', null, ' articles')),
            totalActive > 0 && React.createElement('div', {className:'art-active-filters'},
              selTags.map(t => React.createElement('span', {key:t, className:'art-af'}, '#'+t, React.createElement('button', {'data-hover':true, onClick:()=>toggleTag(t)}, '×'))),
              selCats.map(c => { const cat = C.categories.find(x=>x.id===c); return React.createElement('span', {key:c, className:'art-af'}, cat?.name||c, React.createElement('button', {'data-hover':true, onClick:()=>toggleCat(c)}, '×')); }),
              selAuthors.map(h => { const au = (C.authors||[]).find(x=>x.handle===h); return React.createElement('span', {key:h, className:'art-af'}, '@'+(au?.name||h), React.createElement('button', {'data-hover':true, onClick:()=>toggleAuthor(h)}, '×')); }),
              dateRange !== 'any' && React.createElement('span', {className:'art-af'}, 'date: '+dateRange+'d', React.createElement('button', {'data-hover':true, onClick:()=>setDateRange('any')}, '×'))
            )
          ),
          React.createElement('div', {className:'art-tb-right'},
            React.createElement('div', {className:'art-seg'},
              [['latest','Latest'],['popular','Popular'],['commented','Most commented']].map(([k,l]) =>
                React.createElement('button', {key:k, 'data-hover':true, className: sort===k?'active':'', onClick:()=>setSort(k)}, l)
              )
            ),
            React.createElement('div', {className:'art-seg art-seg-icon'},
              React.createElement('button', {'data-hover':true, className: view==='list'?'active':'', onClick:()=>setView('list'), title:'List'},
                React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('path',{d:'M2 4h12M2 8h12M2 12h12'}))
              ),
              React.createElement('button', {'data-hover':true, className: view==='grid'?'active':'', onClick:()=>setView('grid'), title:'Grid'},
                React.createElement('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor',strokeWidth:1.4},React.createElement('rect',{x:2,y:2,width:5,height:5}),React.createElement('rect',{x:9,y:2,width:5,height:5}),React.createElement('rect',{x:2,y:9,width:5,height:5}),React.createElement('rect',{x:9,y:9,width:5,height:5}))
              )
            ),
            React.createElement('div', {className:'art-seg'},
              React.createElement('button', {'data-hover':true, className: paging==='pagination'?'active':'', onClick:()=>setPaging('pagination'), title:'底部頁碼'}, 'Pages'),
              React.createElement('button', {'data-hover':true, className: paging==='infinite'?'active':'', onClick:()=>setPaging('infinite'), title:'滾動載入'}, '∞ Infinite')
            )
          )
        ),

        // RESULT
        filtered.length === 0
          ? React.createElement('div', {className:'art-empty'},
              React.createElement('div', {className:'art-empty-mark'}, '∅'),
              React.createElement('h3', null, '沒有符合的結果'),
              React.createElement('p', null, '試著放寬條件，或清除目前的篩選。'),
              React.createElement('button', {'data-hover':true, className:'art-empty-btn', onClick:clearAll}, 'Clear all filters')
            )
          : React.createElement('div', {className: view==='grid' ? 'art-grid' : 'art-list'},
              visible.map((a, i) => view === 'grid'
                ? React.createElement('article', {key:a.uuid, className:'art-card-g reveal'},
                    React.createElement('a', {href:'#', onClick:e=>{e.preventDefault();go&&go('article', a.uuid.split('_')[0]);}, className:'art-card-thumb', 'data-tag':a.artTag}),
                    React.createElement('div', {className:'art-card-body'},
                      React.createElement('div', {className:'art-card-meta'},
                        React.createElement('span', null, (C.categories.find(c=>c.id===a.category)?.name)||'Essay'),
                        React.createElement('span', null, '·'),
                        React.createElement('span', null, a.updatedAt.replace(/-/g,'.'))
                      ),
                      React.createElement('h4', null, React.createElement('a', {href:'#', onClick:e=>{e.preventDefault();go&&go('article', a.uuid.split('_')[0]);}}, a.title)),
                      React.createElement('p', null, a.summary),
                      React.createElement('div', {className:'art-card-foot'},
                        React.createElement('div', {className:'art-card-tags'},
                          a.tags.slice(0,2).map(t => React.createElement('button', {key:t, 'data-hover':true, className:'mini-tag', onClick:()=>toggleTag(t)}, '#'+t))
                        ),
                        React.createElement('div', {className:'art-card-stats'},
                          React.createElement('span', null, a.viewCount.toLocaleString(), ' views'),
                          React.createElement('span', null, a.likeCount, ' ♡')
                        )
                      )
                    )
                  )
                : React.createElement('article', {key:a.uuid, className:'art-row reveal'},
                    React.createElement('span', {className:'art-row-n'}, String(i+1).padStart(3,'0')),
                    React.createElement('a', {
                      href:'#', onClick:e=>{e.preventDefault();go&&go('article', a.uuid.split('_')[0]);},
                      className:'art-row-thumb', 'data-tag': (C.categories.find(c=>c.id===a.category)?.name)||'ESSAY'
                    }),
                    React.createElement('div', {className:'art-row-body'},
                      React.createElement('div', {className:'art-row-meta'},
                        React.createElement('span', null, (C.categories.find(c=>c.id===a.category)?.name)||'Essay'),
                        React.createElement('span', null, a.updatedAt.replace(/-/g,'.')),
                        a.tags.slice(0,3).map(t => React.createElement('span', {key:t, className:'art-row-tag'}, '#'+t))
                      ),
                      React.createElement('h3', null, React.createElement('a', {href:'#', onClick:e=>{e.preventDefault();go&&go('article', a.uuid.split('_')[0]);}}, a.title)),
                      React.createElement('p', null, a.summary)
                    ),
                    React.createElement('div', {className:'art-row-stats'},
                      React.createElement('div', null, React.createElement('b',null, a.viewCount.toLocaleString()), React.createElement('span', null, 'views')),
                      React.createElement('div', null, React.createElement('b',null, a.likeCount), React.createElement('span', null, 'likes')),
                      React.createElement('div', null, React.createElement('b',null, a.commentCount), React.createElement('span', null, 'replies'))
                    ),
                    React.createElement('span', {className:'art-row-arr'}, '→')
                  )
              )
            ),

        // PAGING / SENTINEL
        filtered.length > 0 && paging === 'pagination' && React.createElement('div', {className:'art-pager'},
          React.createElement('button', {'data-hover':true, disabled: page===1, onClick:()=>setPage(p=>Math.max(1,p-1))}, '← Prev'),
          React.createElement('div', {className:'art-pager-nums'},
            Array.from({length: totalPages}).map((_,i) => React.createElement('button', {
              key:i, 'data-hover':true,
              className: page===(i+1)?'active':'',
              onClick:()=>setPage(i+1)
            }, String(i+1).padStart(2,'0')))
          ),
          React.createElement('button', {'data-hover':true, disabled: page===totalPages, onClick:()=>setPage(p=>Math.min(totalPages,p+1))}, 'Next →')
        ),
        filtered.length > 0 && paging === 'infinite' && (page * PER_PAGE < filtered.length
          ? React.createElement('div', {ref: sentRef, className:'art-sentinel'},
              React.createElement('span', null, 'Loading more…'),
              React.createElement('span', {className:'dots'}, React.createElement('i'),React.createElement('i'),React.createElement('i'))
            )
          : React.createElement('div', {className:'art-sentinel done'},
              React.createElement('span', null, 'END · 共 '+filtered.length+' 篇')
            )
        )
      )
    )
  );
}

window.ArticlesPage = ArticlesPage;
