/* global React */
/* ============================================================
   COMMAND PALETTE — ⌘K / Ctrl-K, fuzzy filter, sections, hotkeys
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

function fuzzyMatch(query, text) {
  if (!query) return { hit: true, score: 0 };
  const q = query.toLowerCase(); const t = text.toLowerCase();
  let qi = 0, score = 0, lastHit = -2;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (ti === lastHit + 1) score += 4; // streak bonus
      else if (ti === 0 || /\s|-|_|\//.test(t[ti - 1])) score += 3; // word-start
      else score += 1;
      lastHit = ti; qi++;
    }
  }
  return { hit: qi === q.length, score };
}

function CommandPalette({ open, onClose, items }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ(''); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter & sort
  const filtered = useMemo(() => {
    const flat = items.flatMap(s => s.items.map(it => ({ ...it, section: s.label })));
    const matches = flat.map(it => {
      const { hit, score } = fuzzyMatch(q, it.label + ' ' + (it.hint || ''));
      return { it, hit, score };
    }).filter(x => x.hit).sort((a, b) => b.score - a.score).map(x => x.it);
    // Group by section
    const grouped = {};
    matches.forEach(it => { (grouped[it.section] = grouped[it.section] || []).push(it); });
    return { flat: matches, grouped };
  }, [q, items]);

  useEffect(() => { setIdx(0); }, [q]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(filtered.flat.length - 1, i + 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'Enter') { e.preventDefault(); const it = filtered.flat[idx]; if (it) { it.run?.(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, idx, filtered, onClose]);

  // Scroll into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${idx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  if (!open) return null;

  let i = 0;
  return (
    <div className="cp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-modal" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cp-input-row">
          <span className="cp-prompt">⌘</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Type a command, page, or article…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <kbd className="cp-esc">esc</kbd>
        </div>
        <div className="cp-list" ref={listRef}>
          {filtered.flat.length === 0 && (
            <div className="cp-empty">
              <div className="cp-empty-art">∅</div>
              <div>沒有匹配項目。</div>
              <span>試試其他關鍵字，或按 esc 關閉。</span>
            </div>
          )}
          {Object.entries(filtered.grouped).map(([section, list]) => (
            <div key={section} className="cp-section">
              <div className="cp-section-head">{section}</div>
              {list.map(it => {
                const myIdx = i++;
                return (
                  <button
                    key={it.id}
                    data-i={myIdx}
                    className={'cp-item ' + (myIdx === idx ? 'active' : '')}
                    onMouseEnter={() => setIdx(myIdx)}
                    onClick={() => { it.run?.(); onClose(); }}
                  >
                    <span className="cp-icon">{it.icon || '·'}</span>
                    <span className="cp-label">
                      <b>{it.label}</b>
                      {it.hint && <span className="cp-hint">{it.hint}</span>}
                    </span>
                    {it.shortcut && <span className="cp-shortcut">{it.shortcut.split('+').map((k, j) => <kbd key={j}>{k}</kbd>)}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cp-foot">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
          <span className="cp-foot-r">{filtered.flat.length} results</span>
        </div>
      </div>
    </div>
  );
}

// Hotkeys help modal — bound to ?
function HotkeysHelp({ open, onClose, groups }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="hk-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hk-modal" role="dialog" aria-modal="true">
        <div className="hk-head">
          <div className="hk-eyebrow">§ keyboard shortcuts</div>
          <h3>所有快捷鍵</h3>
        </div>
        <div className="hk-grid">
          {groups.map(g => (
            <div key={g.label} className="hk-group">
              <div className="hk-group-head">{g.label}</div>
              {g.items.map(it => (
                <div key={it.label} className="hk-row">
                  <span>{it.label}</span>
                  <span className="hk-keys">{it.keys.split('+').map((k, j) => <kbd key={j}>{k}</kbd>)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button className="hk-close" onClick={onClose}>Close · esc</button>
      </div>
    </div>
  );
}

// Global hotkey hook — registers listeners, returns nothing
function useHotkeys(map) {
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      for (const [combo, fn] of Object.entries(map)) {
        const parts = combo.toLowerCase().split('+');
        const wantsMod = parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl');
        const key = parts[parts.length - 1];
        if (wantsMod !== mod) continue;
        if (e.key.toLowerCase() !== key) continue;
        if (key === '?' && inField) continue;
        if (key === '/' && inField) continue;
        e.preventDefault();
        fn(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map]);
}

Object.assign(window, { CommandPalette, HotkeysHelp, useHotkeys });
