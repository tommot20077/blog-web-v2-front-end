/* global React */
/* ============================================================
   AI-READABLE & SEO — JSON-LD, meta tags, llms.txt link,
   "View as Markdown" button, OG preview generator
   ============================================================ */
const { useEffect, useState, useRef } = React;

// Inject JSON-LD structured data into <head>
function StructuredData({ data }) {
  useEffect(() => {
    const id = 'jsonld-' + (data['@type'] || 'thing');
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data, null, 2);
    return () => { if (el && el.parentNode) el.parentNode.removeChild(el); };
  }, [JSON.stringify(data)]);
  return null;
}

// Inject SEO meta tags (title, description, OG, Twitter)
function SEO({ title, description, image, url, type, author, publishedAt, tags }) {
  useEffect(() => {
    if (title) document.title = title;
    const set = (selector, attr, val) => {
      if (!val) return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [_, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
        if (key && name) el.setAttribute(key, name);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    set('meta[name="description"]', 'content', description);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', description);
    set('meta[property="og:image"]', 'content', image);
    set('meta[property="og:url"]', 'content', url);
    set('meta[property="og:type"]', 'content', type || 'article');
    set('meta[name="twitter:card"]', 'content', 'summary_large_image');
    set('meta[name="twitter:title"]', 'content', title);
    set('meta[name="twitter:description"]', 'content', description);
    set('meta[name="twitter:image"]', 'content', image);
    set('meta[name="author"]', 'content', author);
    set('meta[property="article:published_time"]', 'content', publishedAt);
    if (tags && tags.length) set('meta[name="keywords"]', 'content', tags.join(', '));

    // Canonical
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link && url) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    if (link && url) link.href = url;
  }, [title, description, image, url, type, author, publishedAt, JSON.stringify(tags)]);
  return null;
}

// "View as Markdown" - shows raw Markdown in a modal so AI agents / readers can copy
function MarkdownView({ open, onClose, markdown, title }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={'mdv-overlay ' + (open ? 'open' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mdv-modal" role="dialog" aria-modal="true">
        <div className="mdv-head">
          <div>
            <div className="mdv-eyebrow">§ AI-readable · raw markdown</div>
            <h3>{title}</h3>
          </div>
          <div className="mdv-actions">
            <button className={'mdv-btn ' + (copied ? 'ok' : '')} onClick={copy}>{copied ? 'Copied ✓' : 'Copy all'}</button>
            <button className="mdv-btn" onClick={onClose}>Close</button>
          </div>
        </div>
        <pre className="mdv-pre"><code>{markdown}</code></pre>
        <div className="mdv-foot">
          <span>{markdown.length.toLocaleString()} chars</span>
          <span>UTF-8 · CommonMark</span>
          <a href="data:text/markdown;charset=utf-8,{encodeURIComponent(markdown)}" download={`${title}.md`} onClick={e => {
            e.preventDefault();
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title}.md`; a.click();
          }}>Download .md ↓</a>
        </div>
      </div>
    </div>
  );
}

// AI-friendly meta block visible on the page (link to .md, llms.txt, JSON-LD)
function AIReadableBlock({ markdownUrl, jsonLdInline, onOpenMd }) {
  return (
    <aside className="ai-block">
      <div className="ai-head">
        <span className="ai-pulse" />
        <div>
          <div className="ai-eyebrow">§ machine-readable</div>
          <h4>AI &amp; crawler endpoints</h4>
        </div>
      </div>
      <div className="ai-grid">
        <button className="ai-card" onClick={onOpenMd}>
          <div className="ai-mono">.md</div>
          <div className="ai-card-body">
            <b>View as Markdown</b>
            <span>純文字版本，方便餵給 LLM</span>
          </div>
          <span className="ai-arr">→</span>
        </button>
        <a className="ai-card" href="/llms.txt" onClick={e => e.preventDefault()}>
          <div className="ai-mono">/llms.txt</div>
          <div className="ai-card-body">
            <b>llms.txt</b>
            <span>站點地圖，給 AI 爬蟲讀</span>
          </div>
          <span className="ai-arr">→</span>
        </a>
        <a className="ai-card" href="/feed.xml" onClick={e => e.preventDefault()}>
          <div className="ai-mono">RSS</div>
          <div className="ai-card-body">
            <b>RSS / Atom Feed</b>
            <span>所有文章的 XML 訂閱</span>
          </div>
          <span className="ai-arr">→</span>
        </a>
        <a className="ai-card" href={markdownUrl || '#'} onClick={e => e.preventDefault()}>
          <div className="ai-mono">JSON-LD</div>
          <div className="ai-card-body">
            <b>Structured data</b>
            <span>schema.org/Article 已嵌入 head</span>
          </div>
          <span className="ai-arr">→</span>
        </a>
      </div>
    </aside>
  );
}

// OG Image Generator: render to canvas, download PNG
function OGImageGenerator({ title, subtitle, author, accent }) {
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);

  const draw = () => {
    const W = 1200, H = 630;
    const c = canvasRef.current; if (!c) return;
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(10,10,11,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Accent bar
    ctx.fillStyle = accent || '#5B8DEF';
    ctx.fillRect(72, 72, 4, 80);

    // Eyebrow
    ctx.fillStyle = '#6b6b70';
    ctx.font = '500 16px "IBM Plex Mono", monospace';
    ctx.fillText('§  MY BLOG WEB. — ' + (author || 'Yuan Luca'), 96, 110);

    // Title
    ctx.fillStyle = '#0a0a0b';
    ctx.font = '500 76px "Space Grotesk", sans-serif';
    const words = (title || 'Untitled').split('');
    let line = '', y = 200, lines = [];
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i];
      if (ctx.measureText(test).width > W - 180) { lines.push(line); line = words[i]; }
      else line = test;
    }
    lines.push(line);
    lines.slice(0, 4).forEach((L, i) => ctx.fillText(L, 96, y + i * 86));

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = '#2a2a2c';
      ctx.font = '300 28px "Space Grotesk", sans-serif';
      ctx.fillText(subtitle.slice(0, 60), 96, H - 130);
    }

    // Footer
    ctx.fillStyle = '#9a9aa0';
    ctx.font = '500 14px "IBM Plex Mono", monospace';
    ctx.fillText('myblogweb.com · 2026', 96, H - 72);

    // Mark
    ctx.fillStyle = '#0a0a0b';
    const mx = W - 140, my = H - 140;
    ctx.fillRect(mx, my, 60, 60);
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.arc(mx + 30, my + 30, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#f4f4f4';
    ctx.stroke();

    setGenerated(true);
  };

  const download = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `og-${(title || 'post').replace(/[^\w]+/g, '-').slice(0, 40)}.png`;
    a.click();
  };

  useEffect(() => { draw(); /* eslint-disable-line */ }, [title, subtitle, author, accent]);

  return (
    <div className="og-gen">
      <div className="og-canvas-wrap">
        <canvas ref={canvasRef} className="og-canvas" />
      </div>
      <div className="og-meta">
        <div className="og-row"><span>1200 × 630</span><span>OpenGraph · Twitter</span></div>
        <div className="og-row"><span>{title}</span></div>
        <button className="og-dl" onClick={download} disabled={!generated}>Download PNG ↓</button>
      </div>
    </div>
  );
}

Object.assign(window, { StructuredData, SEO, MarkdownView, AIReadableBlock, OGImageGenerator });
