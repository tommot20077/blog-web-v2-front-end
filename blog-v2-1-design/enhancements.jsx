/* global React, ReactDOM */
/* ============================================================
   ENHANCEMENTS — Toast / Modal / Drawer / Newsletter components
   Exposed on window so the prototype can opt-in.
   ============================================================ */
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ===== Toast system =====
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);
  const push = useCallback((type, title, msg) => {
    const id = idRef.current++;
    setToasts(t => [...t, { id, type, title, msg, state: 'in' }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, state: 'out' } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 400);
    }, 3600);
    return id;
  }, []);
  const dismiss = (id) => setToasts(t => t.map(x => x.id === id ? { ...x, state: 'out' } : x));
  const api = { push, dismiss, success: (t, m) => push('success', t, m), error: (t, m) => push('error', t, m), info: (t, m) => push('info', t, m) };
  return React.createElement(ToastContext.Provider, { value: api },
    children,
    React.createElement('div', { className: 'toast-stack' },
      toasts.map(t => React.createElement('div', { key: t.id, className: `toast ${t.type} ${t.state}` },
        React.createElement('span', { className: 'ic' }, t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'i'),
        React.createElement('div', { className: 'msg' },
          React.createElement('b', null, t.title),
          t.msg && React.createElement('span', null, t.msg),
        ),
        React.createElement('button', { className: 'close', onClick: () => dismiss(t.id) }, '✕'),
      ))
    )
  );
}
const useToast = () => useContext(ToastContext) || { success: () => {}, error: () => {}, info: () => {}, push: () => {}, dismiss: () => {} };

// ===== Confirm Modal =====
const ConfirmContext = createContext(null);
function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false });
  const resolverRef = useRef(null);
  const confirm = useCallback((opts) => new Promise(resolve => {
    setState({ open: true, ...opts });
    resolverRef.current = resolve;
  }), []);
  const settle = (val) => {
    setState(s => ({ ...s, open: false }));
    if (resolverRef.current) { resolverRef.current(val); resolverRef.current = null; }
  };
  return React.createElement(ConfirmContext.Provider, { value: confirm },
    children,
    React.createElement('div', { className: 'modal-overlay' + (state.open ? ' open' : ''), onClick: (e) => { if (e.target === e.currentTarget) settle(false); } },
      React.createElement('div', { className: 'modal', role: 'dialog', 'aria-modal': true },
        state.eyebrow && React.createElement('div', { className: 'eyebrow' }, state.eyebrow),
        React.createElement('h3', null, state.title || 'Confirm'),
        React.createElement('p', null, state.message || ''),
        React.createElement('div', { className: 'actions' },
          React.createElement('button', { className: 'btn-ghost', onClick: () => settle(false) }, state.cancelLabel || 'Cancel'),
          React.createElement('button', { className: 'btn-confirm' + (state.danger ? ' danger' : ''), onClick: () => settle(true) }, state.confirmLabel || 'Confirm'),
        )
      )
    )
  );
}
const useConfirm = () => useContext(ConfirmContext) || (async () => true);

// ===== Mobile Nav Drawer =====
function MobileDrawer({ open, onClose, view, setView, go }) {
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const goView = (v) => { (go || setView)(v); onClose(); };

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'drawer-overlay' + (open ? ' open' : ''), onClick: onClose }),
    React.createElement('aside', { className: 'drawer' + (open ? ' open' : ''), 'aria-hidden': !open },
      React.createElement('div', { className: 'drawer-head' },
        React.createElement('span', { style: { fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 16 } }, 'MY BLOG WEB.'),
        React.createElement('button', { className: 'drawer-close', onClick: onClose, 'aria-label': 'Close' }, '✕'),
      ),
      React.createElement('div', { className: 'drawer-section-title' }, 'Reading'),
      React.createElement('nav', { className: 'drawer-list' },
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'home' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('home'); } }, 'Writing', React.createElement('span', { className: 'arr' }, '→')),
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'articles' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('articles'); } }, 'All articles', React.createElement('span', { className: 'arr' }, '→')),
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'search' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('search'); } }, 'Search', React.createElement('span', { className: 'arr' }, '⌘K')),
      ),
      React.createElement('div', { className: 'drawer-section-title' }, 'Account'),
      React.createElement('nav', { className: 'drawer-list' },
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'my' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('my'); } }, 'My articles', React.createElement('span', { className: 'arr' }, '→')),
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'editor' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('editor'); } }, 'New post', React.createElement('span', { className: 'arr' }, '+')),
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'settings' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('settings'); } }, 'Settings', React.createElement('span', { className: 'arr' }, '→')),
        React.createElement('a', { href: '#', className: 'drawer-link' + (view === 'login' ? ' active' : ''), onClick: e => { e.preventDefault(); goView('login'); } }, 'Sign in', React.createElement('span', { className: 'arr' }, '↗')),
      ),
      React.createElement('div', { className: 'drawer-foot' },
        React.createElement('span', null, '© 2026'),
        React.createElement('span', null, 'EST · 2023'),
      )
    )
  );
}

// ===== Reading Progress Bar =====
function ReadingProgress({ targetSelector }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = targetSelector ? document.querySelector(targetSelector) : null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const p = Math.max(0, Math.min(100, (scrolled / total) * 100));
        setPct(p);
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        setPct(Math.max(0, Math.min(100, (scrolled / total) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [targetSelector]);
  return React.createElement('div', { className: 'read-progress', style: { width: pct + '%' } });
}

// ===== Sticky TOC =====
function StickyTOC({ items }) {
  const [active, setActive] = useState(items[0] && items[0].id);
  useEffect(() => {
    const onScroll = () => {
      let cur = active;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top < 120) cur = it.id;
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);
  return React.createElement('nav', { className: 'toc-sticky', 'aria-label': 'Table of contents' },
    React.createElement('div', { className: 'toc-head' }, '§ on this page'),
    items.map(it => React.createElement('a', {
      key: it.id, href: '#' + it.id,
      className: (active === it.id ? 'active ' : '') + 'lvl-' + (it.level || 2),
      onClick: e => { e.preventDefault(); const el = document.getElementById(it.id); if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }); },
    }, it.label))
  );
}

// ===== Share Rail =====
function ShareRail({ url, title }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const realUrl = url || (typeof location !== 'undefined' ? location.href : '');
  const realTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(realUrl);
      setCopied(true);
      toast.success('Link copied', 'Share away.');
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('Copy failed'); }
  };
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(realTitle)}&url=${encodeURIComponent(realUrl)}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(realUrl)}`;
  const Icon = ({ d }) => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d }));
  return React.createElement('div', { className: 'share-rail', role: 'toolbar', 'aria-label': 'Share' },
    React.createElement('button', { className: 'sh-btn' + (copied ? ' copied' : ''), onClick: copy, 'data-hover': true, 'aria-label': 'Copy link', title: 'Copy link' },
      copied
        ? React.createElement(Icon, { d: 'M5 12l4 4L19 7' })
        : React.createElement(Icon, { d: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1' })
    ),
    React.createElement('a', { className: 'sh-btn', href: tw, target: '_blank', rel: 'noopener', 'data-hover': true, 'aria-label': 'Share on X', title: 'Share on X' },
      React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
        React.createElement('path', { d: 'M18.244 2H21l-6.52 7.45L22 22h-6.86l-4.78-6.24L4.7 22H2l7.05-8.06L2 2h7.04l4.31 5.69L18.244 2zm-1.2 18.4h1.84L7.05 3.5H5.1l11.94 16.9z' })
      )
    ),
    React.createElement('a', { className: 'sh-btn', href: ln, target: '_blank', rel: 'noopener', 'data-hover': true, 'aria-label': 'Share on LinkedIn', title: 'Share on LinkedIn' },
      React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
        React.createElement('path', { d: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88V21h-4V9z' })
      )
    ),
  );
}

// ===== Newsletter =====
function NewsletterBlock({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Email looks off', 'Try again with a full address.'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    setSubmitting(false);
    setEmail('');
    toast.success('Subscribed', '一封確認信已寄到 ' + email);
    onSubmit && onSubmit(email);
  };
  return React.createElement('section', { className: 'nl-block wrap' },
    React.createElement('div', { className: 'lhs' },
      React.createElement('div', { className: 'eyebrow' }, '§ Newsletter · monthly'),
      React.createElement('h3', null, '一個月一封信。', React.createElement('br'), '只寫值得寄出的東西。'),
      React.createElement('p', null, '不販售你的 email、不轉手第三方，隨時可以退訂。約 800 字、附程式碼片段，每月 1 號寄出。')
    ),
    React.createElement('form', { className: 'nl-form', onSubmit: submit },
      React.createElement('input', { type: 'email', placeholder: 'you@example.com', value: email, onChange: e => setEmail(e.target.value), required: true, 'aria-label': 'Email' }),
      React.createElement('button', { type: 'submit', disabled: submitting }, submitting ? 'Sending…' : 'Subscribe', React.createElement('span', null, '→'))
    )
  );
}

// ===== Comments block =====
function CommentsBlock({ comments }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [list, setList] = useState(comments || []);
  const submit = (e) => {
    e.preventDefault();
    if (text.trim().length < 3) { toast.error('再多寫幾個字。'); return; }
    const newC = { id: Date.now(), name: '你', when: 'just now', body: text };
    setList([newC, ...list]);
    setText('');
    toast.success('Comment posted', '感謝你的留言。');
  };
  return React.createElement('section', { className: 'cm-block' },
    React.createElement('div', { className: 'cm-head' },
      React.createElement('h3', null, '討論'),
      React.createElement('span', { className: 'n' }, list.length + ' comments')
    ),
    React.createElement('form', { className: 'cm-write', onSubmit: submit },
      React.createElement('div', { className: 'av' }),
      React.createElement('div', null,
        React.createElement('textarea', { placeholder: '寫下你的想法⋯（Markdown 支援）', value: text, onChange: e => setText(e.target.value) }),
        React.createElement('div', { className: 'row' },
          React.createElement('span', { className: 'hint' }, '⌘ + Enter 送出 · 友善至上'),
          React.createElement('button', { type: 'submit', className: 'submit', disabled: text.trim().length < 3 }, 'Post')
        )
      )
    ),
    React.createElement('div', { className: 'cm-list' },
      list.map(c => React.createElement(CommentItem, { key: c.id, c, onReply: () => toast.info('Reply coming soon') }))
    )
  );
}
function CommentItem({ c, onReply }) {
  return React.createElement('article', { className: 'cm-item' },
    React.createElement('div', { className: 'av' }),
    React.createElement('div', { className: 'body' },
      React.createElement('div', { className: 'who' },
        React.createElement('b', null, c.name),
        React.createElement('span', { className: 'when' }, c.when)
      ),
      React.createElement('p', null, c.body),
      React.createElement('div', { className: 'acts' },
        React.createElement('button', { onClick: onReply }, 'Reply'),
        React.createElement('button', null, '♥ ' + (c.likes || 0)),
      ),
      c.replies && c.replies.length > 0 && React.createElement('div', { className: 'replies' },
        c.replies.map(r => React.createElement(CommentItem, { key: r.id, c: r, onReply }))
      )
    )
  );
}

// ===== Related articles =====
function RelatedBlock({ items, onOpen }) {
  return React.createElement('section', { className: 'related-block wrap' },
    React.createElement('div', { className: 'h-row' },
      React.createElement('h3', null, '繼續讀。'),
      React.createElement('a', { href: '#', className: 'caption', onClick: e => { e.preventDefault(); onOpen && onOpen('articles'); } }, 'All →')
    ),
    React.createElement('div', { className: 'related-grid' },
      items.map((a, i) => React.createElement('a', { key: i, className: 'rel-card', href: '#', 'data-hover': true, onClick: e => { e.preventDefault(); onOpen && onOpen('article', a.id); } },
        React.createElement('div', { className: 'thumb' }),
        React.createElement('div', { className: 'meta' }, a.tag + ' · ' + a.date),
        React.createElement('h4', null, a.title)
      ))
    )
  );
}

// ===== Editor mobile tab bar =====
function EditorMobileTabs({ tab, setTab }) {
  return React.createElement('div', { className: 'ed-mobile-tabs', role: 'tablist' },
    React.createElement('button', { role: 'tab', className: tab === 'write' ? 'active' : '', onClick: () => setTab('write') }, 'Write'),
    React.createElement('button', { role: 'tab', className: tab === 'preview' ? 'active' : '', onClick: () => setTab('preview') }, 'Preview'),
    React.createElement('button', { role: 'tab', className: tab === 'meta' ? 'active' : '', onClick: () => setTab('meta') }, 'Meta')
  );
}

// ===== Skeleton block helper =====
function SkeletonBlock({ rows }) {
  return React.createElement('div', { className: 'sk-block' },
    Array.from({ length: rows || 3 }).map((_, i) => React.createElement('div', { key: i, className: 'sk-row-flex' },
      React.createElement('div', { className: 'sk-pulse sk-circle' }),
      React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 } },
        React.createElement('div', { className: 'sk-pulse sk-title-line' }),
        React.createElement('div', { className: 'sk-pulse sk-meta-line' })
      )
    ))
  );
}

// ===== Empty state =====
function EmptyState({ glyph, title, sub, ctaLabel, onCta }) {
  return React.createElement('div', { className: 'es-wrap' },
    React.createElement('div', { className: 'es-art' }, glyph || '∅'),
    React.createElement('h4', { className: 'es-title' }, title || 'Nothing here yet.'),
    sub && React.createElement('p', { className: 'es-sub' }, sub),
    ctaLabel && React.createElement('button', { className: 'es-cta', onClick: onCta, 'data-hover': true }, ctaLabel)
  );
}

// ===== Lazy Image =====
function LazyImage({ src, alt, ratio }) {
  const [loaded, setLoaded] = useState(false);
  return React.createElement('div', { className: 'lazy-wrap', style: { aspectRatio: ratio || '16/10' } },
    React.createElement('img', {
      src, alt: alt || '',
      className: 'lazy-img' + (loaded ? ' loaded' : ''),
      loading: 'lazy', decoding: 'async',
      onLoad: () => setLoaded(true),
      style: { width: '100%', height: '100%', objectFit: 'cover' }
    })
  );
}

// expose
Object.assign(window, {
  ToastProvider, useToast,
  ConfirmProvider, useConfirm,
  MobileDrawer,
  ReadingProgress,
  StickyTOC,
  ShareRail,
  NewsletterBlock,
  CommentsBlock, CommentItem,
  RelatedBlock,
  EditorMobileTabs,
  SkeletonBlock,
  EmptyState,
  LazyImage,
});
