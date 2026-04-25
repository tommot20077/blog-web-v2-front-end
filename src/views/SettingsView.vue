<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useSettings } from '../composables/useSettings'
import SettingToggle from '../components/settings/SettingToggle.vue'
import SettingFieldGroup from '../components/settings/SettingFieldGroup.vue'
import SettingSaveToast from '../components/settings/SettingSaveToast.vue'

const {
  activeSection, setSection,
  nickname, bio, location, website, avatarUrl, avatarFile, profileStatus, saveProfile,
  removeAvatar,
  email, pwCurrent, pwNew, pwConfirm, accountStatus, saveAccount,
  github, twitter, linkedin, socialStatus, saveSocial,
  editorMode, wordUnit, autosave, writingStatus, saveWriting,
  nComment, nLike, nReview, nFollow, nNewsletter, notifStatus, saveNotifications,
  deleteAccount,
  showToast,
} = useSettings()

const navItems = [
  { id: 'profile',       label: '個人資料',   icon: '👤' },
  { id: 'account',       label: '帳號安全',   icon: '🔐' },
  { id: 'social',        label: '社群連結',   icon: '🔗' },
  { id: 'writing',       label: '寫作偏好',   icon: '✍️' },
  { id: 'notifications', label: '通知設定',   icon: '🔔' },
  { id: 'danger',        label: '危險操作',   icon: '⚠️', danger: true },
]

// Avatar drag state
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function onAvatarClick() {
  fileInputRef.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file
    if (avatarUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl.value)
    avatarUrl.value = URL.createObjectURL(file)
  }
  // 清除 input value，確保重複選同一檔案也能觸發 change 事件
  input.value = ''
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file
    if (avatarUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl.value)
    avatarUrl.value = URL.createObjectURL(file)
  }
}

onUnmounted(() => {
  if (avatarUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl.value)
})

function getInitials(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '?'
}

async function handleDeleteAccount() {
  const confirmed = window.confirm('確定要刪除帳號？此操作無法復原，所有資料將永久刪除。')
  if (!confirmed) return
  const password = window.prompt('請輸入密碼確認:')
  if (!password) return
  try {
    await deleteAccount(password)
  } catch {
    // error handled by global toast
  }
}
</script>

<template>
  <div class="st-page">
    <!-- Left rail sidebar -->
    <aside class="st-rail">
      <div class="st-rail-brand">
        <div class="st-nav-head">設定</div>
      </div>
      <nav class="st-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="st-nav-item"
          :class="{ active: activeSection === item.id, danger: item.danger }"
          @click="setSection(item.id)"
        >
          <span class="st-nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="st-main">

      <!-- ── Profile ── -->
      <section v-if="activeSection === 'profile'" class="st-section">
        <div class="st-section-head">
          <h2>個人資料</h2>
          <p>管理你的公開個人資訊，讓其他讀者認識你。</p>
        </div>

        <!-- Avatar -->
        <SettingFieldGroup label="大頭貼" hint="建議使用 1:1 比例的圖片">
          <div class="st-avatar-wrap">
            <div
              class="st-avatar-box"
              :class="{ drag: isDragging }"
              @click="onAvatarClick"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onDrop"
            >
              <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
              <div v-else class="st-avatar-placeholder">
                <span class="st-avatar-init">{{ getInitials(nickname) }}</span>
                <span class="st-avatar-hint">拖曳或點擊<br>上傳圖片</span>
              </div>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onFileChange"
            />
            <button v-if="avatarUrl" type="button" class="st-avatar-remove" @click="removeAvatar">
              移除圖片
            </button>
          </div>
        </SettingFieldGroup>

        <!-- Nickname -->
        <SettingFieldGroup label="顯示名稱" hint="最多 32 個字元">
          <input class="st-input" v-model="nickname" maxlength="32" placeholder="輸入你的顯示名稱" />
        </SettingFieldGroup>

        <!-- Bio -->
        <SettingFieldGroup label="個人簡介" hint="最多 200 個字元">
          <div class="st-textarea-wrap">
            <textarea class="st-textarea" v-model="bio" maxlength="200" rows="4" placeholder="介紹一下你自己…" />
            <span class="st-char-count">{{ (bio || '').length }} / 200</span>
          </div>
        </SettingFieldGroup>

        <!-- Location -->
        <SettingFieldGroup label="所在地">
          <input class="st-input" v-model="location" placeholder="例如：台灣 台北" />
        </SettingFieldGroup>

        <!-- Website -->
        <SettingFieldGroup label="個人網站">
          <input class="st-input" v-model="website" placeholder="https://yoursite.com" />
        </SettingFieldGroup>

        <div class="st-footer-row">
          <SettingSaveToast :status="profileStatus" />
          <button type="button" class="st-btn-primary" @click="saveProfile">儲存變更</button>
        </div>
      </section>

      <!-- ── Account ── -->
      <section v-else-if="activeSection === 'account'" class="st-section">
        <div class="st-section-head">
          <h2>帳號安全</h2>
          <p>管理你的電子信箱與密碼。</p>
        </div>

        <SettingFieldGroup label="電子信箱" hint="目前無法更改電子信箱">
          <input class="st-input" :value="email" readonly />
        </SettingFieldGroup>

        <SettingFieldGroup label="目前密碼">
          <input class="st-input" type="password" v-model="pwCurrent" placeholder="輸入目前密碼" autocomplete="current-password" />
        </SettingFieldGroup>

        <SettingFieldGroup label="新密碼">
          <input class="st-input" type="password" v-model="pwNew" placeholder="輸入新密碼" autocomplete="new-password" />
        </SettingFieldGroup>

        <SettingFieldGroup label="確認新密碼">
          <input class="st-input" type="password" v-model="pwConfirm" placeholder="再次輸入新密碼" autocomplete="new-password" />
        </SettingFieldGroup>

        <div class="st-footer-row">
          <SettingSaveToast :status="accountStatus" />
          <button type="button" class="st-btn-primary" @click="saveAccount">更新密碼</button>
        </div>
      </section>

      <!-- ── Social ── -->
      <section v-else-if="activeSection === 'social'" class="st-section">
        <div class="st-section-head">
          <h2>社群連結</h2>
          <p>在個人頁面展示你的社群媒體連結。</p>
        </div>

        <SettingFieldGroup label="GitHub">
          <div class="st-prefix-input">
            <span class="st-prefix">github.com/</span>
            <input class="st-input" v-model="github" placeholder="your-username" />
          </div>
        </SettingFieldGroup>

        <SettingFieldGroup label="Twitter / X">
          <div class="st-prefix-input">
            <span class="st-prefix">@</span>
            <input class="st-input" v-model="twitter" placeholder="your-handle" />
          </div>
        </SettingFieldGroup>

        <SettingFieldGroup label="LinkedIn">
          <div class="st-prefix-input">
            <span class="st-prefix">linkedin.com/in/</span>
            <input class="st-input" v-model="linkedin" placeholder="your-profile" />
          </div>
        </SettingFieldGroup>

        <div class="st-footer-row">
          <SettingSaveToast :status="socialStatus" />
          <button type="button" class="st-btn-primary" @click="saveSocial">儲存連結</button>
        </div>
      </section>

      <!-- ── Writing ── -->
      <section v-else-if="activeSection === 'writing'" class="st-section">
        <div class="st-section-head">
          <h2>寫作偏好</h2>
          <p>自訂編輯器行為與顯示設定。</p>
        </div>

        <SettingFieldGroup label="編輯器模式" hint="預設的編輯器版面配置">
          <div class="st-seg">
            <button
              type="button"
              class="st-seg-btn"
              :class="{ active: editorMode === 'split' }"
              @click="editorMode = 'split'"
            >分割</button>
            <button
              type="button"
              class="st-seg-btn"
              :class="{ active: editorMode === 'write' }"
              @click="editorMode = 'write'"
            >純寫作</button>
            <button
              type="button"
              class="st-seg-btn"
              :class="{ active: editorMode === 'preview' }"
              @click="editorMode = 'preview'"
            >預覽</button>
          </div>
        </SettingFieldGroup>

        <SettingFieldGroup label="字數計算" hint="選擇字數統計方式">
          <div class="st-seg">
            <button
              type="button"
              class="st-seg-btn"
              :class="{ active: wordUnit === 'characters' }"
              @click="wordUnit = 'characters'"
            >字元</button>
            <button
              type="button"
              class="st-seg-btn"
              :class="{ active: wordUnit === 'words' }"
              @click="wordUnit = 'words'"
            >單詞</button>
          </div>
        </SettingFieldGroup>

        <div class="st-toggle-list">
          <SettingToggle v-model="autosave" label="自動儲存" hint="每隔一段時間自動儲存草稿" />
        </div>

        <div class="st-footer-row">
          <SettingSaveToast :status="writingStatus" />
          <button type="button" class="st-btn-primary" @click="saveWriting">儲存偏好</button>
        </div>
      </section>

      <!-- ── Notifications ── -->
      <section v-else-if="activeSection === 'notifications'" class="st-section">
        <div class="st-section-head">
          <h2>通知設定</h2>
          <p>選擇你想要接收的通知類型。</p>
        </div>

        <div class="st-toggle-list">
          <SettingToggle v-model="nComment" label="留言通知" hint="有人在你的文章留言時通知你" />
          <SettingToggle v-model="nLike" label="按讚通知" hint="有人按讚你的文章時通知你" />
          <SettingToggle v-model="nReview" label="審核通知" hint="文章審核結果通知" />
          <SettingToggle v-model="nFollow" label="追蹤通知" hint="有人追蹤你時通知你" />
          <SettingToggle v-model="nNewsletter" label="電子報" hint="接收部落格最新消息與精選文章" />
        </div>

        <div class="st-footer-row">
          <SettingSaveToast :status="notifStatus" />
          <button type="button" class="st-btn-primary" @click="saveNotifications">儲存設定</button>
        </div>
      </section>

      <!-- ── Danger ── -->
      <section v-else-if="activeSection === 'danger'" class="st-section">
        <div class="st-section-head">
          <h2>危險操作</h2>
          <p>這些操作不可逆，請謹慎執行。</p>
        </div>

        <div class="st-danger-card">
          <div>
            <div class="st-danger-title">匯出資料</div>
            <div class="st-danger-desc">下載你的所有文章、留言與個人資料的備份檔案。</div>
          </div>
          <button type="button" class="st-btn-ghost" @click="showToast('資料匯出功能即將推出', 'info')">匯出資料</button>
        </div>

        <div class="st-danger-card danger">
          <div>
            <div class="st-danger-title">刪除帳號</div>
            <div class="st-danger-desc">永久刪除你的帳號及所有相關資料，此操作無法復原。</div>
          </div>
          <button type="button" class="st-btn-danger" @click="handleDeleteAccount">刪除帳號</button>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
/* ============ SETTINGS VIEW ============ */
.st-page { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr; background: var(--bg); padding-top: 80px; }

/* Rail */
.st-rail { position: sticky; top: 80px; height: calc(100vh - 80px); overflow-y: auto; padding: 32px 16px 32px 32px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 24px; background: var(--bg); }
.st-rail-brand { padding-bottom: 20px; border-bottom: 1px solid var(--divider); }
.st-nav { display: flex; flex-direction: column; gap: 2px; }
.st-nav-head { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted-2); padding: 4px 10px 10px; }
.st-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; font-size: 13.5px; color: var(--ink-2); transition: background 0.15s, color 0.15s; text-align: left; width: 100%; background: none; border: none; cursor: pointer; }
.st-nav-item:hover { background: var(--bg-sub); color: var(--ink); }
.st-nav-item.active { background: var(--ink); color: var(--bg); }
.st-nav-item.danger { color: #c54235; }
.st-nav-item.danger:hover { background: color-mix(in oklch, #c54235 10%, transparent); }
.st-nav-item.danger.active { background: #c54235; color: #fff; }
.st-nav-icon { font-size: 14px; opacity: 0.7; width: 18px; }

/* Main */
.st-main { padding: 40px 56px 96px; max-width: 720px; }

/* Section */
.st-section { display: flex; flex-direction: column; gap: 32px; }
.st-section-head { padding-bottom: 24px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; position: relative; }
.st-section-head h2 { font-family: var(--f-display); font-size: 32px; font-weight: 500; letter-spacing: -0.018em; margin: 0; }
.st-section-head p { font-size: 14px; color: var(--muted); line-height: 1.65; margin: 0; }
.st-section-sub { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); padding: 4px 0; }
.st-divider { height: 1px; background: var(--divider); margin: 8px 0; }

/* Field group */
.st-field-group { display: grid; grid-template-columns: 200px 1fr; gap: 20px 32px; align-items: start; }
.st-field-label { font-family: var(--f-body); font-size: 13.5px; font-weight: 500; color: var(--ink); padding-top: 10px; }
.st-field-hint { display: block; font-size: 12px; color: var(--muted); font-weight: 400; margin-top: 3px; line-height: 1.5; }
.st-field-body { display: flex; flex-direction: column; gap: 8px; }

/* Inputs */
.st-input-wrap { position: relative; }
.st-input { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--ink); font-family: var(--f-body); font-size: 14px; transition: border-color 0.18s; outline: none; cursor: text; }
.st-input:focus { border-color: var(--accent); }
.st-input.st-mono { font-family: var(--f-mono); font-size: 13px; }
.st-char-count { position: absolute; right: 10px; bottom: -20px; font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.08em; color: var(--muted-2); pointer-events: none; transition: opacity 0.2s; }

.st-textarea-wrap { position: relative; }
.st-textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--ink); font-family: var(--f-body); font-size: 14px; line-height: 1.7; resize: vertical; outline: none; transition: border-color 0.18s; cursor: text; }
.st-textarea:focus { border-color: var(--accent); }
.st-textarea-wrap .st-char-count { position: absolute; right: 10px; bottom: 10px; }

.st-prefix-input { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); overflow: hidden; transition: border-color 0.18s; }
.st-prefix-input:focus-within { border-color: var(--accent); }
.st-prefix { font-family: var(--f-mono); font-size: 12px; color: var(--muted); padding: 10px 12px; background: var(--bg-sub); border-right: 1px solid var(--divider); white-space: nowrap; }
.st-prefix-input .st-input { border: none; border-radius: 0; background: transparent; }
.st-prefix-input .st-input:focus { border: none; }

/* Avatar */
.st-avatar-wrap { display: flex; flex-direction: column; gap: 10px; }
.st-avatar-box { width: 120px; height: 120px; border-radius: 50%; border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.18s, background 0.18s; overflow: hidden; position: relative; }
.st-avatar-box:hover, .st-avatar-box.drag { border-color: var(--accent); background: color-mix(in oklch, var(--accent) 8%, transparent); }
.st-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
.st-avatar-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.st-avatar-init { font-family: var(--f-display); font-size: 32px; font-weight: 500; color: var(--muted); }
.st-avatar-hint { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted-2); text-align: center; line-height: 1.5; }
.st-avatar-remove { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted-2); width: fit-content; background: none; border: none; cursor: pointer; padding: 0; }
.st-avatar-remove:hover { color: #c54235; }

/* Seg buttons */
.st-seg { display: flex; gap: 4px; padding: 4px; background: var(--bg-sub); border-radius: 10px; width: fit-content; flex-wrap: wrap; }
.st-seg-btn { padding: 7px 14px; border-radius: 7px; font-size: 13px; color: var(--muted); transition: all 0.15s; background: none; border: none; cursor: pointer; font-family: var(--f-body); }
.st-seg-btn.active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
[data-theme="dark"] .st-seg-btn.active { background: var(--ink); color: var(--bg); }

/* Toggle */
.st-toggle { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; cursor: pointer; border-bottom: 1px solid var(--divider); }
.st-toggle:last-child { border: none; }
.st-toggle-label { font-size: 14px; color: var(--ink-2); }
.st-toggle-track { width: 40px; height: 22px; border-radius: 999px; background: var(--border); position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; border: none; }
.st-toggle-track.on { background: var(--accent); }
.st-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--bg); transition: transform 0.2s var(--ease), background 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.st-toggle-track.on .st-toggle-thumb { transform: translateX(18px); }
.st-toggle-list { display: flex; flex-direction: column; border: 1px solid var(--divider); border-radius: 10px; overflow: hidden; padding: 0 16px; }

/* Footer row */
.st-footer-row { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--divider); margin-top: 8px; }
.st-btn-primary { padding: 10px 20px; background: var(--ink); color: var(--bg); border-radius: 8px; font-size: 13.5px; font-weight: 500; font-family: var(--f-body); transition: transform 0.15s, background 0.15s; border: none; cursor: pointer; }
.st-btn-primary:hover { transform: translateY(-1px); }
.st-btn-ghost { padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--ink-2); transition: all 0.15s; background: none; cursor: pointer; font-family: var(--f-body); }
.st-btn-ghost:hover { border-color: var(--ink); color: var(--ink); }
.st-btn-danger { padding: 8px 16px; border: 1px solid #c54235; border-radius: 8px; font-size: 13px; color: #c54235; transition: all 0.15s; background: none; cursor: pointer; font-family: var(--f-body); }
.st-btn-danger:hover { background: #c54235; color: #fff; }

/* Danger cards */
.st-danger-card { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border: 1px solid var(--divider); border-radius: 10px; gap: 24px; }
.st-danger-card.danger { border-color: color-mix(in oklch, #c54235 30%, var(--border)); }
.st-danger-title { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 4px; }
.st-danger-desc { font-size: 12.5px; color: var(--muted); line-height: 1.55; }

@media (max-width: 900px) {
  .st-page { grid-template-columns: 1fr; padding-top: 64px; }
  .st-rail { position: static; height: auto; flex-direction: row; overflow-x: auto; padding: 16px 20px; border-right: none; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 8px; }
  .st-nav { flex-direction: row; flex-wrap: wrap; }
  .st-nav-head { display: none; }
  .st-main { padding: 28px 20px 80px; }
  .st-field-group { grid-template-columns: 1fr; gap: 8px 0; }
  .st-field-label { padding-top: 0; }
}
</style>
