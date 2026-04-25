/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback } = React;

// ============ CUSTOM CURSOR ============
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    let x=window.innerWidth/2, y=window.innerHeight/2, rx=x, ry=y;
    const onMove = e => {
      x = e.clientX; y = e.clientY;
      if(dotRef.current){dotRef.current.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;}
    };
    const onOver = e => {
      const tgt = e.target.closest('a,button,[data-hover]');
      if (ringRef.current) ringRef.current.classList.toggle('hover', !!tgt);
      if (dotRef.current) dotRef.current.classList.toggle('hover', !!tgt);
      const isText = e.target.closest('input,textarea,[contenteditable]');
      if (ringRef.current) ringRef.current.classList.toggle('text', !!isText);
    };
    let paused = false;
    const onDown = e => { if (e.button === 1) { paused = true; } };
    const onUp = e => { if (e.button === 1) { paused = false; } };
    const tick = () => {
      if (!paused) { rx += (x-rx)*0.18; ry += (y-ry)*0.18; }
      if(ringRef.current) ringRef.current.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    tick();
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseover', onOver); window.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); };
  }, []);
  return React.createElement(React.Fragment, null,
    React.createElement('div', { ref: dotRef, className: 'cursor-dot' }),
    React.createElement('div', { ref: ringRef, className: 'cursor-ring' })
  );
}

// ============ REVEAL HOOK ============
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal:not(.in)'));
    // Reveal anything above the fold immediately on mount
    const vh = window.innerHeight;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9) el.classList.add('in');
    });
    const remaining = els.filter(el => !el.classList.contains('in'));
    // Fallback: reveal everything after 1.5s if observer never fires
    const fallback = setTimeout(() => { remaining.forEach(el => el.classList.add('in')); }, 1500);
    if (!('IntersectionObserver' in window)) { remaining.forEach(el=>el.classList.add('in')); return () => clearTimeout(fallback); }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    remaining.forEach(el => io.observe(el));
    return () => { io.disconnect(); clearTimeout(fallback); };
  }, []);
}

// ============ NAVBAR ============
function Navbar({ view, setView, theme, toggleTheme }) {
  const [visible, setVisible] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const hideTimer = React.useRef(null);
  const show = visible || hovered;

  const startHide = () => {
    hideTimer.current = setTimeout(() => setHovered(false), 300);
  };
  const cancelHide = () => {
    clearTimeout(hideTimer.current);
    setHovered(true);
  };

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 60) { setVisible(true); }
        else if (y > lastY + 4) { setVisible(false); }
        else if (y < lastY - 2) { setVisible(true); }
        lastY = y; ticking = false;
      }); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return React.createElement(React.Fragment, null,
    // Invisible hover zone at the top — triggers navbar to appear
    React.createElement('div', {
      style: { position:'fixed', top:0, left:0, right:0, height:64, zIndex:99, pointerEvents: show ? 'none' : 'auto' },
      onMouseEnter: cancelHide,
      onMouseLeave: startHide,
    }),
    React.createElement('div', {
      className: 'nav-wrap',
      style: { transform: show?'translateY(0)':'translateY(-120%)', transition:'transform 0.35s cubic-bezier(.22,1,.36,1)', pointerEvents: show?'auto':'none' },
      onMouseEnter: cancelHide,
      onMouseLeave: startHide,
    },
      React.createElement('a', { href: '#', className: 'nav-logo', onClick: e=>{e.preventDefault();setView('home');} },
        React.createElement('span', { className: 'mark' }),
        React.createElement('span', { className: 'name' }, 'MY BLOG WEB.')
      ),
      React.createElement('a', { href: '#', className: 'nav-link '+(view==='home'?'active':''), onClick:e=>{e.preventDefault();setView('home');} }, 'Writing'),
      React.createElement('a', { href: '#', className: 'nav-link '+(view==='articles'?'active':''), onClick:e=>{e.preventDefault();setView('articles');} }, 'Articles'),
      React.createElement('a', { href: '#', className: 'nav-link '+(view==='search'?'active':''), onClick:e=>{e.preventDefault();setView('search');} }, 'Search'),
      React.createElement('a', { href: '#', className: 'nav-link', onClick:e=>e.preventDefault() }, 'About'),
      React.createElement('a', { href: '#', className: 'nav-link '+(view==='login'?'active':''), onClick:e=>{e.preventDefault();setView('login');} },
        React.createElement('span',{className:'dot'}), 'Sign in'
      ),
      React.createElement('button', { className: 'theme-toggle', onClick: toggleTheme, 'aria-label':'Toggle theme' },
        theme === 'dark'
          ? React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8},
              React.createElement('circle',{cx:12,cy:12,r:4}),
              React.createElement('path',{d:'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'}))
          : React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8},
              React.createElement('path',{d:'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'}))
      )
    )  // close nav-wrap div
  );  // close Fragment
}

// ============ HOME ============
function Home({ go }) {
  useReveal();
  const C = window.BLOG_CONTENT;
  return React.createElement('main', { className: 'home' },
    // HERO — minimal, one thing only
    React.createElement('section', { className: 'hero' },
      React.createElement('div', { className: 'wrap' },
        React.createElement('div', { className: 'hero-inner' },
          React.createElement('div', { className: 'hero-eyebrow reveal d1' },
            React.createElement('span', { className: 'dot-live' }, '042 / Q2 · 2026'),
            React.createElement('span', null, 'Yuan Luca — writing, slowly.')
          ),
          React.createElement('h1', { className: 'hero-title reveal d2' },
            '慢慢把一件事，', React.createElement('br'),
            React.createElement('span', { className: 'em' }, '說'), React.createElement('span', {className:'accent'}, '清'), '楚。'
          ),
          React.createElement('div', { className: 'hero-foot-min reveal d3' },
            React.createElement('span', null, 'Scroll ↓'),
            React.createElement('a', { className: 'read-next', href:'#', 'data-hover': true, onClick:e=>{e.preventDefault();go && go('article');} },
              React.createElement('span', null, 'Read latest'),
              React.createElement('span', { className:'title' }, '— ' + (C.featured && C.featured.title ? C.featured.title : '最新一篇')),
              React.createElement('span', { className:'arr' }, '→')
            )
          )
        )
      ),
      React.createElement('div', { className: 'scroll-cue' },
        React.createElement('span', null, 'scroll'),
        React.createElement('span', { className: 'line' })
      )
    ),

    // TRENDING
    React.createElement('section', { className: 'trending wrap reveal' },
      React.createElement('div', { className: 'sec' },
        React.createElement('div', { className: 'sec-head' },
          React.createElement('span', { className: 'tag' }, '§ 01 — Trending'),
          React.createElement('h2', null, '本週最多人讀的五篇。'),
          React.createElement('a', { className: 'tag r', href:'#', 'data-hover':true, onClick:e=>{e.preventDefault();go && go('articles', 'popular');} }, 'See all trending →')
        )
      ),
      React.createElement('div', { className: 'trending-grid' },
        React.createElement('div', { style:{gridColumn:'1 / -1'} },
          C.trending.map((t, i) =>
            React.createElement('a', { href: '#', className: 't-card reveal', key: i, onClick:e=>{e.preventDefault();go && go('article');} },
              React.createElement('div', { className: 'row' },
                React.createElement('span', { className: 'no' }, t.no),
                React.createElement('span', { className: 'ttl' },
                  t.unread && React.createElement('span', { className: 'dot', title: 'unread' }),
                  t.title
                ),
                React.createElement('span', { className: 'cat' }, t.category),
                React.createElement('span', { className: 'date' }, t.date),
                React.createElement('span', { className: 'arrow' }, '→')
              )
            )
          )
        )
      ),

      // FEATURED
      React.createElement('div', { className: 'featured reveal' },
        React.createElement('div', { className: 'hero-art' },
          React.createElement('span', { className: 'tag-art' }, 'FEATURED · ESSAY'),
          React.createElement('span', { className: 'big-n' }, '№042'),
          React.createElement('span', { className: 'tag-art r' }, '24 MIN READ')
        ),
        React.createElement('div', { className: 'col-r' },
          React.createElement('div', null,
            React.createElement('span', { className: 'caption' }, C.featured.eyebrow),
            React.createElement('h3', null, React.createElement('a', {href:'#', onClick:e=>{e.preventDefault();go && go('article');}}, C.featured.title)),
            React.createElement('p', { className: 'lede' }, C.featured.lede)
          ),
          React.createElement('div', { className: 'meta-line' },
            React.createElement('div', { className: 'avatar' }),
            React.createElement('div', { className: 'who' },
              React.createElement('b', null, C.featured.author),
              React.createElement('div', null, C.featured.role)
            )
          )
        )
      )
    ),

    // LATEST
    React.createElement('section', { className: 'latest wrap' },
      React.createElement('div', { className: 'sec reveal' },
        React.createElement('div', { className: 'sec-head' },
          React.createElement('span', { className: 'tag' }, '§ 02 — Latest'),
          React.createElement('h2', null, '最近在寫的東西。'),
          React.createElement('a', { className: 'tag r', href: '#', 'data-hover':true, onClick:e=>{e.preventDefault();go && go('articles');} }, 'All essays →')
        )
      ),
      React.createElement('div', { className: 'latest-grid' },
        C.latest.map((a, i) =>
          React.createElement('article', { className: 'l-card reveal', key: i },
            React.createElement('div', { className: 'thumb', 'data-tag': a.artTag }),
            React.createElement('div', { className: 'meta' },
              i === 0 && React.createElement('span', { className: 'dot' }),
              React.createElement('span', null, a.tag),
              React.createElement('span', null, '·'),
              React.createElement('span', null, a.date)
            ),
            React.createElement('h4', null, React.createElement('a', {href:'#', onClick:e=>{e.preventDefault();go && go('article');}}, a.title)),
            React.createElement('p', null, a.excerpt)
          )
        )
      )
    ),

    // TAGS
    React.createElement('section', { className: 'tags wrap' },
      React.createElement('div', { className: 'sec reveal' },
        React.createElement('div', { className: 'sec-head' },
          React.createElement('span', { className: 'tag' }, '§ 03 — Topics'),
          React.createElement('h2', null, '依主題瀏覽。'),
          React.createElement('span', { className: 'tag r' }, '16 topics / 142 posts')
        )
      ),
      React.createElement('div', { className: 'tags-cloud reveal' },
        C.tags.map((t, i) =>
          React.createElement('a', { className: 'tag-pill '+(t.active?'active':''), href: '#', key: i, onClick:e=>{e.preventDefault();go && go('tag', t.name);} },
            t.name, React.createElement('span', { className: 'n' }, t.n)
          )
        )
      )
    ),

    // ABOUT — minimal author signature
    React.createElement('section', { className: 'about-home wrap' },
      React.createElement('div', { className: 'sec reveal' },
        React.createElement('div', { className: 'sec-head' },
          React.createElement('span', { className: 'tag' }, '§ 04 — About'),
          React.createElement('h2', null, '關於這個人。'),
          React.createElement('a', { className: 'tag r', href:'#', 'data-hover':true, onClick:e=>{e.preventDefault();go && go('profile','yuanluca');} }, 'View profile →')
        )
      ),
      React.createElement('div', { className: 'about-home-grid reveal' },
        React.createElement('div', { className: 'about-avatar' },
          React.createElement('div', { className: 'av' }),
          React.createElement('div', { className: 'av-meta' },
            React.createElement('span', null, 'YUAN · LUCA'),
            React.createElement('span', null, 'EST 2023'),
            React.createElement('span', null, 'TAIPEI · TW')
          )
        ),
        React.createElement('div', { className: 'about-text' },
          React.createElement('p', null,
            '台北的前端工程師，偶爾設計，長期思考怎麼把複雜的事寫得更直白。',
            React.createElement('br'),
            '平常在用 React / TypeScript / Figma，偶爾寫一些想了很久才敢下筆的東西。'
          ),
          React.createElement('p', {className:'about-p2'},
            '這個 blog 沒有追蹤你、沒有演算法、沒有訂閱牆。每一篇都是自己寫、慢慢改、慢慢發。'
          ),
          React.createElement('div', {className:'about-socials'},
            React.createElement('a', {href:'#', 'data-hover':true, onClick:e=>e.preventDefault()}, 'X / Twitter ↗'),
            React.createElement('span', {className:'sep'}, '·'),
            React.createElement('a', {href:'#', 'data-hover':true, onClick:e=>e.preventDefault()}, 'GitHub ↗'),
            React.createElement('span', {className:'sep'}, '·'),
            React.createElement('a', {href:'#', 'data-hover':true, onClick:e=>e.preventDefault()}, 'Email ↗')
          )
        )
      )
    ),

    React.createElement(Footer)
  );
}

// ============ AUTH ============
function Auth({ mode, setMode }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  useReveal();

  const submit = e => {
    e.preventDefault();
    if (!email.includes('@')) { setErr('請輸入有效的 Email'); return; }
    if (pw.length < 6) { setErr('密碼至少 6 個字元'); return; }
    setErr('');
    alert('（示意）'+(mode==='login'?'登入':'註冊')+' 成功：'+email);
  };

  return React.createElement('main', { className: 'auth-page' },
    React.createElement('div', { className: 'auth-art' },
      React.createElement('div', { className: 'quote reveal d1' },
        React.createElement('span', { className: 'em' }, 'Less'), ' ', React.createElement('span', null, '噪音，'), React.createElement('br'),
        '更多', ' ', React.createElement('span', { className: 'accent' }, '想法'), '。'
      ),
      React.createElement('div', { className: 'art-meta reveal d3' },
        React.createElement('div', null, 'MY BLOG WEB.', React.createElement('br'), 'EST · 2023'),
        React.createElement('div', { className: 'n' }, '042'),
        React.createElement('div', { style:{textAlign:'right'} }, mode==='login'?'RETURNING':'NEW HERE', React.createElement('br'), '2026 · Q2')
      )
    ),
    React.createElement('div', { className: 'auth-panel' },
      React.createElement('div', { className: 'switcher' },
        React.createElement('button', { className: mode==='login'?'active':'', onClick:()=>setMode('login') }, 'Sign in'),
        React.createElement('button', { className: mode==='register'?'active':'', onClick:()=>setMode('register') }, 'Register')
      ),
      React.createElement('h1', { className: 'reveal d1' }, mode==='login' ? '歡迎回來。' : '開始寫吧。'),
      React.createElement('p', { className: 'lede reveal d2' },
        mode==='login'
          ? '用你的 Email 登入。兩年前寫的草稿還在等你，慢慢讀。'
          : '建立帳號只需要 30 秒。你會拿到一個乾淨的 Editor，以及一座安靜的發表地。'
      ),
      React.createElement('form', { className: 'auth-form reveal d3', onSubmit: submit },
        mode==='register' && React.createElement('div', { className: 'field' },
          React.createElement('label', null, 'Display name', React.createElement('span', { className:'hint' }, '你希望讀者怎麼稱呼你')),
          React.createElement('input', { type:'text', placeholder:'Yuan Luca', value:name, onChange:e=>setName(e.target.value) })
        ),
        React.createElement('div', { className: 'field' },
          React.createElement('label', null, 'Email'),
          React.createElement('input', { type:'email', placeholder:'you@example.com', value:email, onChange:e=>setEmail(e.target.value) })
        ),
        React.createElement('div', { className: 'field' },
          React.createElement('label', null, 'Password',
            mode==='login' && React.createElement('a', { href:'#', className:'link-forgot', onClick:e=>e.preventDefault(), style:{textTransform:'none',letterSpacing:0} }, '忘記密碼 ↗')
          ),
          React.createElement('input', { type:'password', placeholder:'••••••••', value:pw, onChange:e=>setPw(e.target.value) })
        ),
        err && React.createElement('div', { className: 'err' }, err),
        React.createElement('div', { className: 'auth-actions' },
          React.createElement('button', { className: 'btn-primary', type:'submit' }, mode==='login'?'Sign in':'Create account', React.createElement('span', {className:'arrow'}, '→')),
          mode==='login'
            ? React.createElement('a', { href:'#', className:'link-forgot', onClick:e=>{e.preventDefault();setMode('register');} }, '還沒有帳號？')
            : React.createElement('a', { href:'#', className:'link-forgot', onClick:e=>{e.preventDefault();setMode('login');} }, '已有帳號？')
        )
      ),
      React.createElement('div', { className: 'auth-divider reveal d4' }, 'or continue with'),
      React.createElement('div', { className: 'oauth-row reveal d4' },
        React.createElement('button', { className: 'oauth-btn' },
          React.createElement('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'currentColor'}, React.createElement('path',{d:'M21.35 11.1h-9.17v2.9h5.27c-.23 1.48-1.67 4.34-5.27 4.34-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.44C16.73 4.17 14.73 3 12.18 3 6.92 3 2.67 7.25 2.67 12.5S6.92 22 12.18 22c6.95 0 9.56-4.88 9.56-7.82 0-.52-.06-.92-.13-1.3z'})),
          'Google'
        ),
        React.createElement('button', { className: 'oauth-btn' },
          React.createElement('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'currentColor'}, React.createElement('path',{d:'M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48 1 .1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.94 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.3c0 .32.22.69.82.58A12 12 0 0 0 12 .5z'})),
          'GitHub'
        )
      )
    )
  );
}

// ============ 404 / 500 ERROR PAGES ============
function ErrorPage({ code, go }) {
  const CODE = code || 404;
  const msgs = {
    404: { tag: '§ error · not found', title: '找不到這一頁。', sub: '這個 URL 可能已移除、改名，或從來就不存在。', cta: '回首頁 →' },
    500: { tag: '§ error · server error', title: '有些東西壞掉了。', sub: '伺服器遇到了一個非預期的錯誤，我們已經記錄下來。稍後再試。', cta: '回首頁 →' },
  };
  const m = msgs[CODE] || msgs[404];
  return React.createElement('div', { className: 'err-page' },
    React.createElement('div', { className: 'err-inner' },
      React.createElement('div', { className: 'err-bg-num' }, CODE),
      React.createElement('div', { className: 'err-tag' }, m.tag),
      React.createElement('h1', { className: 'err-title' }, m.title),
      React.createElement('p', { className: 'err-sub' }, m.sub),
      React.createElement('div', { className: 'err-rule' }),
      React.createElement('a', { href:'#', className:'err-cta', 'data-hover':true, onClick:e=>{e.preventDefault();go&&go('home');} }, m.cta)
    )
  );
}

// ============ FOOTER ============
function Footer() {
  return React.createElement('footer', { className: 'footer wrap' },
    React.createElement('div', { className: 'row' },
      React.createElement('span', { className: 'copy' }, '© 2026 · MY BLOG WEB. — written slowly, on purpose.'),
      React.createElement('a', { className: 'back-top', href: '#top', onClick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});} },
        React.createElement('span', null, 'Back to top'), React.createElement('span', null, '↑')
      )
    )
  );
}

// ============ VIEW SWITCHER ============
function ViewSwitch({ view, setView, go }) {
  return React.createElement('div', { className: 'view-switch' },
    React.createElement('button', { className: view==='home'?'active':'', 'data-hover':true, onClick:()=>setView('home') }, 'Home'),
    React.createElement('button', { className: view==='articles'?'active':'', 'data-hover':true, onClick:()=>setView('articles') }, 'Articles'),
    React.createElement('button', { className: view==='article'?'active':'', 'data-hover':true, onClick:()=>setView('article') }, 'Article'),
    React.createElement('button', { className: view==='my'?'active':'', 'data-hover':true, onClick:()=>setView('my') }, 'My'),
    React.createElement('button', { className: view==='editor'?'active':'', 'data-hover':true, onClick:()=>setView('editor') }, 'Editor'),
    React.createElement('button', { className: view==='search'?'active':'', 'data-hover':true, onClick:()=>setView('search') }, 'Search'),
    React.createElement('button', { className: view==='tag'?'active':'', 'data-hover':true, onClick:()=>go('tag','css') }, 'Tag'),
    React.createElement('button', { className: view==='author'?'active':'', 'data-hover':true, onClick:()=>go('author','yuanluca') }, 'Author'),
    React.createElement('button', { className: view==='settings'?'active':'', 'data-hover':true, onClick:()=>setView('settings') }, 'Settings'),
    React.createElement('button', { className: view==='404'?'active':'', 'data-hover':true, onClick:()=>setView('404') }, '404'),
    React.createElement('button', { className: view==='login'?'active':'', 'data-hover':true, onClick:()=>setView('login') }, 'Sign in'),
    React.createElement('button', { className: view==='register'?'active':'', 'data-hover':true, onClick:()=>setView('register') }, 'Register')
  );
}

// ============ TWEAKS PANEL ============
function TweaksPanel({ state, setState, hidden, onClose }) {
  const set = (k, v) => setState(s => ({ ...s, [k]: v }));
  return React.createElement('aside', { className: 'tw-panel '+(hidden?'hidden':'') },
    React.createElement('h4', null, 'Tweaks',
      React.createElement('button', { onClick: onClose, style:{fontSize:14,letterSpacing:0} }, '✕')
    ),
    React.createElement('div', { className: 'tw-group' },
      React.createElement('div', { className: 'label' }, 'Theme'),
      React.createElement('div', { className: 'tw-btns' },
        React.createElement('button', { className: state.theme==='light'?'active':'', onClick:()=>set('theme','light') }, 'Light'),
        React.createElement('button', { className: state.theme==='dark'?'active':'', onClick:()=>set('theme','dark') }, 'Dark')
      )
    ),
    React.createElement('div', { className: 'tw-group' },
      React.createElement('div', { className: 'label' }, 'Font pairing'),
      React.createElement('div', { className: 'tw-btns' },
        React.createElement('button', { className: state.font==='space'?'active':'', onClick:()=>set('font','space') }, 'Space'),
        React.createElement('button', { className: state.font==='inter'?'active':'', onClick:()=>set('font','inter') }, 'Inter'),
        React.createElement('button', { className: state.font==='geist'?'active':'', onClick:()=>set('font','geist') }, 'Geist')
      )
    ),
    React.createElement('div', { className: 'tw-group' },
      React.createElement('div', { className: 'label' }, 'Accent'),
      React.createElement('div', { className: 'tw-btns' },
        React.createElement('button', { className: state.accent==='on'?'active':'', onClick:()=>set('accent','on') }, 'On'),
        React.createElement('button', { className: state.accent==='off'?'active':'', onClick:()=>set('accent','off') }, 'Off')
      )
    ),
    state.accent==='on' && React.createElement('div', { className: 'tw-group' },
      React.createElement('div', { className: 'label' }, 'Accent color'),
      React.createElement('div', { className: 'tw-colors' },
        ['#5B8DEF','#FF8D28','#3B5BDB','#9B7BE0','#47B881'].map(c =>
          React.createElement('button', { key: c, style:{background:c}, className: state.accentColor===c?'active':'', onClick:()=>set('accentColor',c) })
        )
      )
    ),
    React.createElement('div', { className: 'tw-group' },
      React.createElement('div', { className: 'label' }, 'Cursor'),
      React.createElement('div', { className: 'tw-btns' },
        React.createElement('button', { className: state.cursor==='ring'?'active':'', onClick:()=>set('cursor','ring') }, 'Ring'),
        React.createElement('button', { className: state.cursor==='cross'?'active':'', onClick:()=>set('cursor','cross') }, 'Cross'),
        React.createElement('button', { className: state.cursor==='dot'?'active':'', onClick:()=>set('cursor','dot') }, 'Dot'),
        React.createElement('button', { className: state.cursor==='label'?'active':'', onClick:()=>set('cursor','label') }, 'Label'),
        React.createElement('button', { className: state.cursor==='off'?'active':'', onClick:()=>set('cursor','off') }, 'Off')
      )
    )
  );
}

// ============ APP ============
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "font": "space",
  "accent": "on",
  "accentColor": "#5B8DEF",
  "cursor": "ring"
}/*EDITMODE-END*/;

function App() {
  const VALID_VIEWS = ['home','articles','article','login','register','my','editor','search','tag','author','settings','404','500'];
  const [view, setView] = useState(() => {
    const v = localStorage.getItem('blog.view') || 'home';
    return VALID_VIEWS.includes(v) ? v : 'home';
  });
  const [uuid, setUuid] = useState(() => localStorage.getItem('blog.uuid') || 'a1');
  const go = (v, id) => {
    if (v === 'tag') { setUuid(id); setView('tag'); return; }
    if (v === 'author') { setUuid(id); setView('author'); return; }
    if (v === 'editor-new') { setView('editor'); setUuid('new'); return; }
    if (v === 'my-drafts') { setView('my'); return; }
    if (v === 'my-published') { setView('my'); return; }
    if (v === 'my-archived') { setView('my'); return; }
    if (v === 'stats') { setView('my'); return; }
    if (id) setUuid(id);
    setView(v);
  };
  useEffect(() => { localStorage.setItem('blog.uuid', uuid); }, [uuid]);
  const [state, setState] = useState(() => {
    try { return { ...TWEAK_DEFAULTS, ...JSON.parse(localStorage.getItem('blog.tweaks')||'{}') }; }
    catch { return TWEAK_DEFAULTS; }
  });
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { localStorage.setItem('blog.view', view); }, [view]);
  useEffect(() => { localStorage.setItem('blog.tweaks', JSON.stringify(state)); }, [state]);

  // ⌘K / Ctrl+K to open Search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setView('search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // apply state to html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.setAttribute('data-font', state.font);
    document.documentElement.setAttribute('data-accent', state.accent);
    document.documentElement.setAttribute('data-cursor', state.cursor || 'ring');
    if (state.accent === 'on') {
      document.documentElement.style.setProperty('--accent', state.accentColor);
    } else {
      document.documentElement.style.removeProperty('--accent');
    }
  }, [state]);

  // edit-mode protocol
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // scroll to top on view change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);

  const toggleTheme = () => setState(s => ({ ...s, theme: s.theme==='dark'?'light':'dark' }));

  return React.createElement(React.Fragment, null,
    React.createElement(Cursor),
    (view === 'home' || view === 'articles' || view === 'login' || view === 'register' || view === 'article' || view === 'search' || view === 'tag' || view === 'author')
      && React.createElement(Navbar, { view, setView, theme: state.theme, toggleTheme }),
    view === 'home' ? React.createElement(Home, { go })
    : (view === 'login' || view === 'register') ? React.createElement(Auth, { mode: view, setMode: setView })
    : view === 'my' ? React.createElement(window.BlogViews.MyArticles, { go })
    : view === 'editor' ? React.createElement(window.BlogViews.Editor, { uuid, go })
    : view === 'article' ? React.createElement(window.BlogViews.ArticleDetail, { uuid, go, fromEditor: false })
    : view === 'articles' ? React.createElement(window.ArticlesPage, { go, preFilter: uuid })
    : view === 'search' ? React.createElement(window.SearchView, { go, initialQuery: uuid && uuid.startsWith('q:') ? uuid.slice(2) : '' })
    : view === 'tag' ? React.createElement(window.BlogViews.TagDetail, { tag: uuid, go })
    : view === 'author' ? React.createElement(window.BlogViews.AuthorProfile, { handle: uuid, go })
    : view === 'settings' ? React.createElement(window.SettingsView, { go })
    : view === '404' ? React.createElement(ErrorPage, { code: 404, go })
    : view === '500' ? React.createElement(ErrorPage, { code: 500, go })
    : React.createElement(Home, { go }),
    React.createElement(ViewSwitch, { view, setView, go }),
    editMode && React.createElement(TweaksPanel, {
      state, setState,
      hidden: false,
      onClose: () => setEditMode(false),
    })
  );
}

// Always render panel (visible when edit mode on)
function RootApp() {
  return React.createElement(App);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(RootApp));
