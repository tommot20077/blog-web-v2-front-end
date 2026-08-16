<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettings } from '../composables/useSettings'
import SettingToggle from '../components/settings/SettingToggle.vue'
import SettingFieldGroup from '../components/settings/SettingFieldGroup.vue'
import SettingSaveToast from '../components/settings/SettingSaveToast.vue'
import PasswordRulesChecklist from '../components/auth/PasswordRulesChecklist.vue'
import ShellRail from '../components/layout/ShellRail.vue'

const {
  nickname, bio, location, website, avatarUrl, avatarFile, profileStatus, saveProfile,
  removeAvatar,
  email, pwCurrent, pwNew, pwConfirm, accountStatus, saveAccount,
  github, twitter, linkedin, socialStatus, saveSocial,
  editorMode, wordUnit, autosave, writingStatus, saveWriting,
  nComment, nLike, nReview, nFollow, nNewsletter, notifStatus, saveNotifications,
  deleteAccount,
  showToast,
} = useSettings()

interface SettingsNavItem {
  id: string
  label: string
  danger?: boolean
}

const navItems: SettingsNavItem[] = [
  { id: 'profile',       label: '個人資料' },
  { id: 'account',       label: '帳號安全' },
  { id: 'social',        label: '社群連結' },
  { id: 'writing',       label: '寫作偏好' },
  { id: 'notifications', label: '通知設定' },
  { id: 'danger',        label: '危險操作',   danger: true },
]
const SECTION_IDS = navItems.map((item) => item.id)

/*
 * 區塊狀態改由網址 query param 掌握（deep-link，Yuan 2026-07-19 定案）：
 * - 不再用元件內部 ref／localStorage 記錄目前區塊，改讀 route.query.section，
 *   讓重整、瀏覽器上一頁/下一頁、分享連結都能還原到正確區塊。
 * - 無值或不合法值一律落回 'profile'，不拋錯、不顯示空白。
 */
const route = useRoute()
const router = useRouter()

const activeSection = computed(() => {
  const raw = route.query.section
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && SECTION_IDS.includes(value) ? value : 'profile'
})

function selectSection(id: string) {
  if (id === activeSection.value) return
  // push（而非 replace）：讓「上一頁」可以在區塊間逐步回退——這正是
  // Yuan 提出併樹需求時點名的痛點（目前上一頁無法在區塊間回退）。
  router.push({ query: { ...route.query, section: id } })
}

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
  <div class="settings-shell">
    <ShellRail
      active="settings"
      :settings-children="navItems"
      :active-child-id="activeSection"
      @select-child="selectSection"
    />

    <div class="st-page">
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
          <PasswordRulesChecklist :password="pwNew" />
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
            <input class="st-input" data-testid="social-github-input" v-model="github" placeholder="your-username" />
          </div>
        </SettingFieldGroup>

        <SettingFieldGroup label="Twitter / X">
          <div class="st-prefix-input">
            <span class="st-prefix">@</span>
            <input class="st-input" data-testid="social-twitter-input" v-model="twitter" placeholder="your-handle" />
          </div>
        </SettingFieldGroup>

        <SettingFieldGroup label="LinkedIn">
          <div class="st-prefix-input">
            <span class="st-prefix">linkedin.com/in/</span>
            <input class="st-input" data-testid="social-linkedin-input" v-model="linkedin" placeholder="your-profile" />
          </div>
        </SettingFieldGroup>

        <div class="st-footer-row">
          <SettingSaveToast :status="socialStatus" />
          <button type="button" class="st-btn-primary" data-testid="social-save-btn" @click="saveSocial">儲存連結</button>
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
          <button type="button" class="st-btn-danger" data-testid="delete-account-btn" @click="handleDeleteAccount">刪除帳號</button>
        </div>
      </section>

    </main>
    </div>
  </div>
</template>

<style scoped>
/*
 * SettingsView 原本沒有 shell-rail（Yuan 回報：從 /bookmarks、/my-articles 進來後
 * 沒有任何返回入口），後續併入共用 ShellRail。
 *
 * 樹狀併欄（2026-07-19）：原本並排的 .st-rail（區塊分頁）已移除，區塊切換改由
 * ShellRail「設定」項目底下的樹狀子項驅動（見上方 settings-children prop）。
 * .st-page 的 grid-template-columns 原本是 design source（settings.css）
 * 定義的 `240px 1fr` 兩欄（240px 留給已移除的 .st-rail）。design source 不可
 * 編輯，這裡以 scoped selector（天生帶 data-v 屬性，specificity 高於
 * design css 的單一 class selector）覆寫成單欄，讓 .st-main 收回原本
 * 留給 .st-rail 的欄寬。
 */
.settings-shell {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
}
.settings-shell :deep(.shell-rail) {
  width: 220px;
  flex: 0 0 220px;
}
.settings-shell .st-page {
  flex: 1;
  min-width: 0;
  grid-template-columns: 1fr;
}
@media (max-width: 768px) {
  .settings-shell {
    flex-direction: column;
  }
  /*
   * flex-direction 改 column 後，主軸變成垂直方向：flex-basis（來自上面
   * `flex: 0 0 220px`）會被 flex 排版演算法優先當成「主軸尺寸」使用，
   * 直接蓋過 height，導致 rail 高度被錯誤鎖死在 220px（實測踩過這個坑）。
   * 這裡明確把 flex-basis 歸零、改用 width:100% + height:auto，讓 rail
   * 在手機版變成自然高度的水平區塊，堆疊在 .st-page 上方。
   */
  .settings-shell :deep(.shell-rail) {
    flex: 0 1 auto;
    width: 100%;
    height: auto;
  }
}
</style>
