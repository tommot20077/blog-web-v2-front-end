/* global React */
/* ============================================================
   ARTICLE EXTRAS — auto TOC, reading time, footnotes,
   code block (highlight + copy + line numbers), image lightbox
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

function readingTime(text, wpm) {
  const words = text.trim().length / 2; // CJK approx 2 chars per word
  const en = (text.match(/\b\w+\b/g) || []).length;
  const total = Math.max(words, en);
  const mins = Math.max(1, Math.round(total / (wpm || 220)));
  return mins;
}

// Auto TOC from real DOM headings
function useAutoTOC(rootSelector) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const heads = root.querySelectorAll('h2, h3');
    const arr = [];
    heads.forEach(h => {
      if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
      arr.push({ id: h.id, label: h.textContent.trim(), level: parseInt(h.tagName[1]) });
    });
    setItems(arr);

    const onScroll = () => {
      let cur = arr[0]?.id;
      arr.forEach(it => {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top < 120) cur = it.id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [rootSelector]);

  return { items, active };
}

// Article meta strip: reading time, word count, last updated
function ArticleMeta({ minutes, words, updated, tags }) {
  return (
    <div className="art-meta">
      <span className="art-meta-item"><span className="dot" />{minutes} min read</span>
      <span className="art-meta-item">{words.toLocaleString()} words</span>
      <span className="art-meta-item">Updated {updated}</span>
      {tags && tags.length > 0 && (
        <span className="art-meta-tags">
          {tags.map(t => <a key={t} href={'#tag-' + t} onClick={e => e.preventDefault()}>#{t}</a>)}
        </span>
      )}
    </div>
  );
}

// Footnote with hover popover
function Footnote({ n, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={'fn ' + (open ? 'open' : '')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
      tabIndex={0}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <sup>[{n}]</sup>
      <span className="fn-pop" role="tooltip">{children}</span>
    </span>
  );
}

// Code block with copy + line numbers + (very basic) syntax highlight
function CodeBlock({ lang, children, filename }) {
  const code = String(children).replace(/^\n/, '').replace(/\n$/, '');
  const lines = code.split('\n');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <figure className="code-fig">
      <div className="code-head">
        <span className="code-name">
          {filename && <span className="code-file">{filename}</span>}
          <span className="code-lang">{lang || 'text'}</span>
        </span>
        <button className={'code-copy ' + (copied ? 'ok' : '')} onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
      <pre className="code-pre"><code>
        {lines.map((ln, i) => (
          <span className="code-line" key={i}>
            <span className="code-ln">{i + 1}</span>
            <span className="code-content" dangerouslySetInnerHTML={{ __html: highlightLine(ln, lang) }} />
          </span>
        ))}
      </code></pre>
    </figure>
  );
}

function highlightLine(line, lang) {
  // Very lightweight token highlighter — escapes HTML first
  const esc = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (!lang) return esc;
  let s = esc;
  // strings
  s = s.replace(/(['"`])(.*?)\1/g, '<span class="t-str">$1$2$1</span>');
  // comments
  s = s.replace(/(\/\/[^<]*)/g, '<span class="t-cm">$1</span>');
  s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="t-cm">$1</span>');
  // keywords
  const kw = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|await|async|in|of|typeof|true|false|null|undefined)\b/g;
  s = s.replace(kw, '<span class="t-kw">$1</span>');
  // numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="t-num">$1</span>');
  return s;
}

// Lightbox for images — click to open, arrow keys, esc
function LightboxProvider({ children }) {
  const [state, setState] = useState({ open: false, src: null, alt: '' });
  useEffect(() => {
    const onKey = (e) => {
      if (state.open && e.key === 'Escape') setState({ open: false, src: null, alt: '' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open]);

  // Auto-attach to all .lightboxable images inside article
  useEffect(() => {
    const onClick = (e) => {
      const img = e.target.closest && e.target.closest('img.lb');
      if (img) {
        e.preventDefault();
        setState({ open: true, src: img.src, alt: img.alt });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      {children}
      <div className={'lb-overlay ' + (state.open ? 'open' : '')} onClick={() => setState({ open: false })}>
        {state.src && <img src={state.src} alt={state.alt} className="lb-img" />}
        {state.open && <button className="lb-close" aria-label="Close">✕ esc</button>}
      </div>
    </>
  );
}

Object.assign(window, { useAutoTOC, ArticleMeta, Footnote, CodeBlock, LightboxProvider, readingTime });
