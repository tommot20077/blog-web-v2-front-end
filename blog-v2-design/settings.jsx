/* global React */
// ============ SETTINGS VIEW ============
const { useState: sS, useEffect: sE, useRef: sR } = React;

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: '◎' },
  { id: 'account', label: 'Account', icon: '⊛' },
  { id: 'social', label: 'Social Links', icon: '↗' },
  { id: 'writing', label: 'Writing', icon: '≡' },
  { id: 'notifications', label: 'Notifications', icon: '◌' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠' },
];

function useSaveToast(delay = 1400) {
  const [status, setStatus] = sS('idle');
  const trigger = () => {
    setStatus('saving');
    setTimeout(() => setStatus('saved'), delay);
    setTimeout(() => setStatus('idle'), delay + 2000);
  };
  return [status, trigger];
}

function SaveToast({ status }) {
  if (status === 'idle') return null;
  return React.createElement('span', { className: 'st-toast '+(status) },
    status === 'saving'
      ? React.createElement(React.Fragment, null,
          React.createElement('span', { className: 'st-toast-dot saving' }),
          'Saving…'
        )
      : React.createElement(React.Fragment, null,
          React.createElement('span', { className: 'st-toast-dot saved' }),
          '✓ Saved'
        )
  );
}

function FieldGroup({ label, hint, children }) {
  return React.createElement('div', { className: 'st-field-group' },
    React.createElement('div', { className: 'st-field-label' }, label,
      hint && React.createElement('span', { className: 'st-field-hint' }, hint)
    ),
    React.createElement('div', { className: 'st-field-body' }, children)
  );
}

function TextInput({ value, onChange, placeholder, maxlen, mono }) {
  return React.createElement('div', { className: 'st-input-wrap' },
    React.createElement('input', {
      type: 'text', value, placeholder,
      maxLength: maxlen,
      onChange: e => onChange(e.target.value),
      className: 'st-input '+(mono?'st-mono':''),
    }),
    maxlen && React.createElement('span', { className: 'st-char-count', style:{opacity: value.length > maxlen*0.8 ? 1 : 0.4} },
      value.length + ' / ' + maxlen
    )
  );
}

function Toggle({ value, onChange, label }) {
  return React.createElement('label', { className: 'st-toggle' },
    React.createElement('span', { className: 'st-toggle-label' }, label),
    React.createElement('div', { className: 'st-toggle-track '+(value?'on':''), onClick: ()=>onChange(!value) },
      React.createElement('div', { className: 'st-toggle-thumb' })
    )
  );
}

function Settings({ go }) {
  const [active, setActive] = sS(() => localStorage.getItem('blog.settings.section') || 'profile');
  sE(() => { localStorage.setItem('blog.settings.section', active); }, [active]);

  // Profile state
  const [displayName, setDisplayName] = sS('Yuan Luca');
  const [handle, setHandle] = sS('yuanluca');
  const [bio, setBio] = sS('寫 Vue 3、設計系統、以及那些花很長時間才想清楚的事。Frontend @ Taipei。');
  const [location, setLocation] = sS('Taipei, Taiwan');
  const [website, setWebsite] = sS('https://yuanluca.dev');
  const [avatarDrop, setAvatarDrop] = sS(false);
  const [avatarUrl, setAvatarUrl] = sS(null);
  const [pSave, pTrigger] = useSaveToast();

  // Account
  const [email, setEmail] = sS('yuan@example.com');
  const [pwCur, setPwCur] = sS('');
  const [pwNew, setPwNew] = sS('');
  const [pwConf, setPwConf] = sS('');
  const [twofa, setTwofa] = sS(false);
  const [aSave, aTrigger] = useSaveToast();

  // Social
  const [github, setGithub] = sS('yuanluca');
  const [twitter, setTwitter] = sS('yuanluca_dev');
  const [linkedin, setLinkedin] = sS('');
  const [rss, setRss] = sS('https://yuanluca.dev/rss');
  const [sSave, sTrigger] = useSaveToast();

  // Writing
  const [defaultCat, setDefaultCat] = sS('c2');
  const [editorMode, setEditorMode] = sS('split');
  const [wordUnit, setWordUnit] = sS('chars');
  const [autosave, setAutosave] = sS(true);
  const [wSave, wTrigger] = useSaveToast();

  // Notifications
  const [nComment, setNComment] = sS(true);
  const [nLike, setNLike] = sS(false);
  const [nReview, setNReview] = sS(true);
  const [nFollow, setNFollow] = sS(true);
  const [nNewsletter, setNNewsletter] = sS(false);
  const [nSave, nTrigger] = useSaveToast();

  const fileRef = sR(null);
  const onAvatarFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setAvatarUrl(URL.createObjectURL(f));
  };

  const sections = {
    profile: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', null, 'Profile'),
        React.createElement('p', null, '這是讀者在你的作者頁面看到的公開資料。')
      ),

      React.createElement(FieldGroup, { label: 'Avatar · 頭像', hint: '建議 400×400px，最大 2MB' },
        React.createElement('div', { className: 'st-avatar-wrap' },
          React.createElement('div', {
            className: 'st-avatar-box '+(avatarDrop?'drag':''),
            onClick: () => fileRef.current?.click(),
            onDragOver: e => { e.preventDefault(); setAvatarDrop(true); },
            onDragLeave: () => setAvatarDrop(false),
            onDrop: e => { e.preventDefault(); setAvatarDrop(false); onAvatarFile(e.dataTransfer.files[0]); },
          },
            avatarUrl
              ? React.createElement('img', { src: avatarUrl, alt: 'avatar' })
              : React.createElement('div', { className: 'st-avatar-placeholder' },
                  React.createElement('span', { className: 'st-avatar-init' }, 'YL'),
                  React.createElement('span', { className: 'st-avatar-hint' }, '點擊或拖曳上傳')
                )
          ),
          React.createElement('input', { ref: fileRef, type: 'file', accept: 'image/*', style: {display:'none'}, onChange: e=>onAvatarFile(e.target.files[0]) }),
          avatarUrl && React.createElement('button', { className: 'st-avatar-remove', 'data-hover':true, onClick:()=>setAvatarUrl(null) }, '移除')
        )
      ),

      React.createElement(FieldGroup, { label: 'Display name · 顯示名稱', hint: '最多 40 字' },
        React.createElement(TextInput, { value: displayName, onChange: setDisplayName, placeholder: 'Your name', maxlen: 40 })
      ),

      React.createElement(FieldGroup, { label: 'Handle · 帳號名稱', hint: '只能英數字和底線，用於 /author/:handle' },
        React.createElement(TextInput, { value: handle, onChange: setHandle, placeholder: 'handle', maxlen: 30, mono: true })
      ),

      React.createElement(FieldGroup, { label: 'Bio · 簡介', hint: '最多 200 字，顯示在作者頁' },
        React.createElement('div', { className: 'st-textarea-wrap' },
          React.createElement('textarea', {
            value: bio, onChange: e=>setBio(e.target.value), maxLength: 200,
            className: 'st-textarea', rows: 4, placeholder: '一句話介紹自己…'
          }),
          React.createElement('span', { className: 'st-char-count', style:{opacity: bio.length>160?1:0.4} }, bio.length + ' / 200')
        )
      ),

      React.createElement(FieldGroup, { label: 'Location · 地點' },
        React.createElement(TextInput, { value: location, onChange: setLocation, placeholder: 'City, Country', maxlen: 60 })
      ),

      React.createElement(FieldGroup, { label: 'Website · 個人網站' },
        React.createElement(TextInput, { value: website, onChange: setWebsite, placeholder: 'https://', maxlen: 200 })
      ),

      React.createElement('div', { className: 'st-footer-row' },
        React.createElement(SaveToast, { status: pSave }),
        React.createElement('button', { className: 'st-btn-primary', 'data-hover':true, onClick: pTrigger }, 'Save changes')
      )
    ),

    account: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', null, 'Account'),
        React.createElement('p', null, '登入資訊與安全性設定。')
      ),

      React.createElement(FieldGroup, { label: 'Email', hint: '修改後需要重新驗證' },
        React.createElement(TextInput, { value: email, onChange: setEmail, placeholder: 'you@example.com', maxlen: 200 })
      ),

      React.createElement('div', { className: 'st-divider' }),

      React.createElement('div', { className: 'st-section-sub' }, '修改密碼'),
      React.createElement(FieldGroup, { label: '現有密碼' },
        React.createElement('input', { type:'password', value:pwCur, onChange:e=>setPwCur(e.target.value), className:'st-input', placeholder:'••••••••' })
      ),
      React.createElement(FieldGroup, { label: '新密碼', hint: '至少 8 個字元' },
        React.createElement('input', { type:'password', value:pwNew, onChange:e=>setPwNew(e.target.value), className:'st-input', placeholder:'••••••••' })
      ),
      React.createElement(FieldGroup, { label: '確認新密碼' },
        React.createElement('input', { type:'password', value:pwConf, onChange:e=>setPwConf(e.target.value), className:'st-input', placeholder:'••••••••' })
      ),

      React.createElement('div', { className: 'st-divider' }),

      React.createElement('div', { className: 'st-section-sub' }, '雙重驗證 (2FA)'),
      React.createElement(Toggle, { value: twofa, onChange: setTwofa, label: '啟用 TOTP 驗證器（Google Authenticator / 1Password）' }),

      React.createElement('div', { className: 'st-footer-row' },
        React.createElement(SaveToast, { status: aSave }),
        React.createElement('button', { className: 'st-btn-primary', 'data-hover':true, onClick: aTrigger }, 'Save changes')
      )
    ),

    social: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', null, 'Social Links'),
        React.createElement('p', null, '顯示在作者頁面和文章頁尾。')
      ),

      React.createElement(FieldGroup, { label: 'GitHub' },
        React.createElement('div', { className: 'st-prefix-input' },
          React.createElement('span', { className: 'st-prefix' }, 'github.com/'),
          React.createElement('input', { type:'text', value:github, onChange:e=>setGithub(e.target.value), className:'st-input', placeholder:'username' })
        )
      ),

      React.createElement(FieldGroup, { label: 'X / Twitter' },
        React.createElement('div', { className: 'st-prefix-input' },
          React.createElement('span', { className: 'st-prefix' }, '@'),
          React.createElement('input', { type:'text', value:twitter, onChange:e=>setTwitter(e.target.value), className:'st-input', placeholder:'handle' })
        )
      ),

      React.createElement(FieldGroup, { label: 'LinkedIn' },
        React.createElement('div', { className: 'st-prefix-input' },
          React.createElement('span', { className: 'st-prefix' }, 'linkedin.com/in/'),
          React.createElement('input', { type:'text', value:linkedin, onChange:e=>setLinkedin(e.target.value), className:'st-input', placeholder:'profile-url' })
        )
      ),

      React.createElement(FieldGroup, { label: 'RSS Feed URL' },
        React.createElement(TextInput, { value: rss, onChange: setRss, placeholder: 'https://…/rss', maxlen: 200 })
      ),

      React.createElement('div', { className: 'st-footer-row' },
        React.createElement(SaveToast, { status: sSave }),
        React.createElement('button', { className: 'st-btn-primary', 'data-hover':true, onClick: sTrigger }, 'Save changes')
      )
    ),

    writing: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', null, 'Writing Preferences'),
        React.createElement('p', null, '編輯器的預設行為。')
      ),

      React.createElement(FieldGroup, { label: '預設分類' },
        React.createElement('div', { className: 'st-seg' },
          [['c1','Engineering'],['c2','Essay'],['c3','Notes'],['c4','Design']].map(([id,label]) =>
            React.createElement('button', { key:id, 'data-hover':true, className:'st-seg-btn '+(defaultCat===id?'active':''), onClick:()=>setDefaultCat(id) }, label)
          )
        )
      ),

      React.createElement(FieldGroup, { label: '編輯器預設模式' },
        React.createElement('div', { className: 'st-seg' },
          [['write','Write'],['split','Split'],['preview','Preview']].map(([id,label]) =>
            React.createElement('button', { key:id, 'data-hover':true, className:'st-seg-btn '+(editorMode===id?'active':''), onClick:()=>setEditorMode(id) }, label)
          )
        )
      ),

      React.createElement(FieldGroup, { label: '字數統計單位', hint: '影響編輯器底部顯示' },
        React.createElement('div', { className: 'st-seg' },
          [['chars','字元（含空白）'],['words','詞數（英文）'],['cjk','中文字數']].map(([id,label]) =>
            React.createElement('button', { key:id, 'data-hover':true, className:'st-seg-btn '+(wordUnit===id?'active':''), onClick:()=>setWordUnit(id) }, label)
          )
        )
      ),

      React.createElement(Toggle, { value: autosave, onChange: setAutosave, label: '啟用自動儲存（每 30 秒）' }),

      React.createElement('div', { className: 'st-footer-row' },
        React.createElement(SaveToast, { status: wSave }),
        React.createElement('button', { className: 'st-btn-primary', 'data-hover':true, onClick: wTrigger }, 'Save changes')
      )
    ),

    notifications: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', null, 'Notifications'),
        React.createElement('p', null, '選擇哪些事件要 Email 通知你。')
      ),

      React.createElement('div', { className: 'st-toggle-list' },
        React.createElement(Toggle, { value: nComment, onChange: setNComment, label: '有人留言在我的文章' }),
        React.createElement(Toggle, { value: nLike, onChange: setNLike, label: '有人按讚我的文章' }),
        React.createElement(Toggle, { value: nReview, onChange: setNReview, label: '審稿結果（通過 / 退回）' }),
        React.createElement(Toggle, { value: nFollow, onChange: setNFollow, label: '有人追蹤了我' }),
        React.createElement(Toggle, { value: nNewsletter, onChange: setNNewsletter, label: 'MY BLOG WEB. 的平台公告' })
      ),

      React.createElement('div', { className: 'st-footer-row' },
        React.createElement(SaveToast, { status: nSave }),
        React.createElement('button', { className: 'st-btn-primary', 'data-hover':true, onClick: nTrigger }, 'Save changes')
      )
    ),

    danger: React.createElement('div', { className: 'st-section' },
      React.createElement('div', { className: 'st-section-head' },
        React.createElement('h2', { style:{color:'#c54235'} }, 'Danger Zone'),
        React.createElement('p', null, '以下操作無法復原，請謹慎操作。')
      ),

      React.createElement('div', { className: 'st-danger-card' },
        React.createElement('div', null,
          React.createElement('div', { className: 'st-danger-title' }, 'Export all data · 匯出所有資料'),
          React.createElement('div', { className: 'st-danger-desc' }, '匯出你所有的文章、留言、設定為 JSON 格式。')
        ),
        React.createElement('button', { className: 'st-btn-ghost', 'data-hover':true }, 'Export →')
      ),

      React.createElement('div', { className: 'st-danger-card' },
        React.createElement('div', null,
          React.createElement('div', { className: 'st-danger-title' }, 'Archive account · 封存帳號'),
          React.createElement('div', { className: 'st-danger-desc' }, '暫停帳號，所有文章設為未公開，可隨時恢復。')
        ),
        React.createElement('button', { className: 'st-btn-ghost', 'data-hover':true }, 'Archive')
      ),

      React.createElement('div', { className: 'st-danger-card danger' },
        React.createElement('div', null,
          React.createElement('div', { className: 'st-danger-title' }, 'Delete account · 刪除帳號'),
          React.createElement('div', { className: 'st-danger-desc' }, '永久刪除帳號與所有內容，此操作無法復原。')
        ),
        React.createElement('button', { className: 'st-btn-danger', 'data-hover':true }, 'Delete account')
      )
    ),
  };

  return React.createElement('div', { className: 'st-page' },
    React.createElement('aside', { className: 'st-rail' },
      React.createElement('div', { className: 'st-rail-brand' },
        React.createElement('a', {
          href:'#', className:'td-back-link', 'data-hover':true,
          onClick:e=>{e.preventDefault();go('my');}
        }, '← 我的文章')
      ),
      React.createElement('nav', { className: 'st-nav' },
        React.createElement('div', { className: 'st-nav-head' }, 'Settings'),
        SETTINGS_SECTIONS.map(s =>
          React.createElement('button', {
            key: s.id,
            className: 'st-nav-item '+(active===s.id?'active':'')+(s.id==='danger'?' danger':''),
            'data-hover':true,
            onClick: ()=>setActive(s.id)
          },
            React.createElement('span', { className: 'st-nav-icon' }, s.icon),
            s.label
          )
        )
      )
    ),
    React.createElement('main', { className: 'st-main' },
      sections[active] || sections.profile
    )
  );
}

window.SettingsView = Settings;
