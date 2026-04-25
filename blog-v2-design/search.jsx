/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// ============ MOCK ELASTICSEARCH ADAPTER ============
// Replace this with: fetch('/api/search?q=' + q).then(r => r.json())
function mockSearch(query) {
  const q = (query || '').trim().toLowerCase();
  const C = window.BLOG_CONTENT || {};
  const articles = [...(C.trending || []), ...(C.latest || [])];
  const tags = C.tags || [];
  const authors = C.authors || [];

  if (!q) return { articles: [], tags: [], authors: [], total: 0 };

  const hitArticles = articles
    .map(a => {
      const title = (a.title || '').toLowerCase();
      const excerpt = (a.excerpt || a.lede || '').toLowerCase();
      const cat = (a.category || a.tag || '').toLowerCase();
      const score =
        (title.includes(q) ? 10 : 0) +
        (excerpt.includes(q) ? 5 : 0) +
        (cat.includes(q) ? 3 : 0);
      return score > 0 ? { ...a, _score: score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score);

  const hitTags = tags.filter(t => t.name.toLowerCase().includes(q));
  const hitAuthors = authors.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.role || '').toLowerCase().includes(q) ||
    (a.handle || '').toLowerCase().includes(q)
  );

  return {
    articles: hitArticles,
    tags: hitTags,
    authors: hitAuthors,
    total: hitArticles.length + hitTags.length + hitAuthors.length
  };
}

// Highlight query in text
function highlight(text, q) {
  if (!q || !text) return text;
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? React.createElement('mark', { key: i }, p) : p
  );
}

const POPULAR_QUERIES = ['tailwind', 'vue 3', 'tdd', 'design systems', 'markdown', 'vitest'];
const RECENT_KEY = 'blog.recentSearches';

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(q) {
  if (!q || !q.trim()) return;
  const list = getRecent().filter(x => x !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
}
function clearRecent() { localStorage.removeItem(RECENT_KEY); }

// ============ SEARCH VIEW (C — Spotlight Grid) ============
function SearchView({ go, initialQuery }) {
  const [q, setQ] = useState(initialQuery || '');
  const [debounced, setDebounced] = useState(initialQuery || '');
  const [recent, setRecent] = useState(getRecent());
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    // Save to recent on meaningful query
    if (debounced && debounced.length >= 2) {
      const tm = setTimeout(() => { addRecent(debounced); setRecent(getRecent()); }, 1200);
      return () => clearTimeout(tm);
    }
  }, [debounced]);

  const results = useMemo(() => mockSearch(debounced), [debounced]);
  const hasQuery = !!debounced.trim();
  const hasResults = results.total > 0;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setQ(''); inputRef.current && inputRef.current.focus(); }
    if (e.key === 'Enter' && results.articles[0]) {
      go('article', results.articles[0].uuid || 'a1');
    }
  };

  return React.createElement('div', { className: 'sv-page' },
    React.createElement('div', { className: 'sv-wrap' },

      // ---- Search bar ----
      React.createElement('div', { className: 'sv-search ' + (focused ? 'focus' : '') },
        React.createElement('svg', {
          className: 'sv-icon', width: 26, height: 26, viewBox: '0 0 24 24',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.4
        },
          React.createElement('circle', { cx: 11, cy: 11, r: 7 }),
          React.createElement('path', { d: 'm16.5 16.5 4 4' })
        ),
        React.createElement('input', {
          ref: inputRef,
          value: q,
          onChange: e => setQ(e.target.value),
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          onKeyDown,
          placeholder: '搜尋文章、標籤、作者…',
          'data-hover': true,
          spellCheck: false,
          autoComplete: 'off'
        }),
        hasQuery && React.createElement('button', {
          className: 'sv-clear', onClick: () => setQ(''), 'data-hover': true,
          title: 'Clear'
        }, '×'),
        React.createElement('span', { className: 'sv-count' },
          hasQuery ? `${results.total} / ${(window.BLOG_CONTENT?.latest?.length || 0) + (window.BLOG_CONTENT?.trending?.length || 0)}` : '⌘K'
        )
      ),

      React.createElement('div', { className: 'sv-meta-row' },
        React.createElement('span', { className: 'sv-meta-q' }, hasQuery ? `Q · "${debounced}"` : '— 開始輸入以搜尋'),
        React.createElement('span', { className: 'sv-meta-r' }, hasQuery ? `${results.articles.length} articles · ${results.tags.length} tags · ${results.authors.length} authors` : 'ES-backed · full-text')
      ),

      // ---- EMPTY STATE (no query) ----
      !hasQuery && React.createElement('div', { className: 'sv-empty' },
        recent.length > 0 && React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '最近搜尋 · Recent'),
            React.createElement('button', {
              className: 'sv-link-btn', 'data-hover': true,
              onClick: () => { clearRecent(); setRecent([]); }
            }, 'clear')
          ),
          React.createElement('div', { className: 'sv-chips' },
            recent.map((r, i) =>
              React.createElement('button', {
                key: 'r' + i, className: 'sv-chip', 'data-hover': true,
                onClick: () => setQ(r)
              },
                React.createElement('span', { className: 'sv-chip-i' }, '↺'),
                r
              )
            )
          )
        ),

        React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '熱門查詢 · Popular'),
            React.createElement('span', { className: 'sv-section-note' }, 'trending this week')
          ),
          React.createElement('div', { className: 'sv-chips' },
            POPULAR_QUERIES.map((p, i) =>
              React.createElement('button', {
                key: 'p' + i, className: 'sv-chip', 'data-hover': true,
                onClick: () => setQ(p)
              },
                React.createElement('span', { className: 'sv-chip-n' }, String(i + 1).padStart(2, '0')),
                p
              )
            )
          )
        ),

        React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '全部標籤 · All tags'),
            React.createElement('span', { className: 'sv-section-note' }, (window.BLOG_CONTENT?.tags?.length || 0) + ' tags')
          ),
          React.createElement('div', { className: 'sv-tags' },
            (window.BLOG_CONTENT?.tags || []).map((t, i) =>
              React.createElement('button', {
                key: 't' + i, className: 'sv-tag-pill', 'data-hover': true,
                onClick: () => setQ(t.name)
              },
                '#', t.name,
                React.createElement('span', { className: 'sv-tag-n' }, t.n)
              )
            )
          )
        )
      ),

      // ---- NO RESULTS ----
      hasQuery && !hasResults && React.createElement('div', { className: 'sv-noresult' },
        React.createElement('div', { className: 'sv-noresult-mark' }, '∅'),
        React.createElement('h3', null, '沒有符合「', debounced, '」的結果。'),
        React.createElement('p', null, '試試看這些熱門查詢：'),
        React.createElement('div', { className: 'sv-chips', style: { justifyContent: 'center' } },
          POPULAR_QUERIES.map((p, i) =>
            React.createElement('button', {
              key: 'np' + i, className: 'sv-chip', 'data-hover': true,
              onClick: () => setQ(p)
            }, p)
          )
        )
      ),

      // ---- RESULTS ----
      hasQuery && hasResults && React.createElement(React.Fragment, null,

        // Articles
        results.articles.length > 0 && React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '§ Articles · ', results.articles.length, ' matches'),
            React.createElement('span', { className: 'sv-section-note' }, 'sorted by relevance')
          ),
          React.createElement('div', { className: 'sv-cards' },
            results.articles.map((a, i) =>
              React.createElement('article', {
                key: 'a' + i, className: 'sv-card', 'data-hover': true,
                onClick: () => go('article', a.uuid || 'a1')
              },
                React.createElement('div', { className: 'sv-thumb', 'data-tag': (a.category || a.tag || 'essay').toUpperCase() },
                  React.createElement('span', { className: 'sv-thumb-n' }, String(i + 1).padStart(2, '0'))
                ),
                React.createElement('h5', null, highlight(a.title, debounced)),
                (a.excerpt || a.lede) && React.createElement('p', null,
                  highlight((a.excerpt || a.lede).slice(0, 120) + ((a.excerpt || a.lede).length > 120 ? '…' : ''), debounced)
                ),
                React.createElement('div', { className: 'sv-card-foot' },
                  React.createElement('span', null, a.date || '2026'),
                  React.createElement('span', { className: 'sv-card-arr' }, '→')
                )
              )
            )
          )
        ),

        // Tags
        results.tags.length > 0 && React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '§ Tags · ', results.tags.length, ' matches'),
            React.createElement('span', { className: 'sv-section-note' }, 'click to filter articles')
          ),
          React.createElement('div', { className: 'sv-tags' },
            results.tags.map((t, i) =>
              React.createElement('button', {
                key: 'st' + i, className: 'sv-tag-pill', 'data-hover': true,
                onClick: () => go('articles', 'tag:' + t.name)
              },
                '#', highlight(t.name, debounced),
                React.createElement('span', { className: 'sv-tag-n' }, t.n)
              )
            )
          )
        ),

        // Authors
        results.authors.length > 0 && React.createElement('section', { className: 'sv-section' },
          React.createElement('div', { className: 'sv-section-head' },
            React.createElement('span', null, '§ Authors · ', results.authors.length, ' matches'),
            React.createElement('span', { className: 'sv-section-note' }, '')
          ),
          React.createElement('div', { className: 'sv-authors' },
            results.authors.map((au, i) =>
              React.createElement('button', {
                key: 'au' + i, className: 'sv-author', 'data-hover': true,
                onClick: () => go('articles', 'author:' + au.handle)
              },
                React.createElement('div', { className: 'sv-author-av' },
                  au.name.split(' ').map(p => p[0]).slice(0, 2).join('')
                ),
                React.createElement('div', { className: 'sv-author-txt' },
                  React.createElement('div', { className: 'sv-author-n' }, highlight(au.name, debounced)),
                  React.createElement('div', { className: 'sv-author-r' },
                    au.role, ' · ', au.articleCount, ' articles'
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

window.SearchView = SearchView;
