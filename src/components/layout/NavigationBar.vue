<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppearance } from '../../composables/useAppearance'
import { useNavScroll } from '../../composables/useNavScroll'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useAppearance()
const { show } = useNavScroll()

// ── 頭像下拉選單狀態 ──────────────────────────────────────
const isMenuOpen = ref(false)
const menuHostRef = ref<HTMLElement | null>(null)
const avatarRef = ref<HTMLButtonElement | null>(null)

const avatarInitial = computed(() => {
  const nickname = authStore.user?.nickname ?? ''
  return nickname ? nickname.charAt(0).toUpperCase() : '?'
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (!isMenuOpen.value) return
  const target = e.target as Node | null
  if (menuHostRef.value && target && !menuHostRef.value.contains(target)) {
    closeMenu()
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isMenuOpen.value) {
    closeMenu()
    avatarRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})

async function handleLogout() {
  closeMenu()
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav
    class="nav-wrap"
    data-testid="navbar-root"
    aria-label="主導覽"
    :style="{
      transform: show ? 'translateY(0)' : 'translateY(-120%)',
      transition: 'transform 0.35s cubic-bezier(.22,1,.36,1)',
    }"
  >
    <div class="nav-inner">
      <!-- Logo -->
      <RouterLink to="/" class="nav-logo" data-testid="navbar-logo">
        <span class="mark" />
        <span class="name">MY BLOG WEB.</span>
      </RouterLink>

      <!-- Nav links -->
      <RouterLink
        to="/"
        class="nav-link"
        active-class=""
        exact-active-class="active"
        data-testid="navbar-link-home"
      >
        Writing
      </RouterLink>
      <RouterLink
        to="/articles"
        class="nav-link"
        active-class="active"
        exact-active-class="active"
        data-testid="navbar-link-articles"
      >
        Articles
      </RouterLink>
      <RouterLink
        to="/search"
        class="nav-link"
        active-class="active"
        data-testid="navbar-link-search"
      >
        Search
      </RouterLink>
      <RouterLink
        to="/#about"
        class="nav-link"
        data-testid="navbar-link-about"
      >
        About
      </RouterLink>

      <!-- Theme toggle -->
      <button
        class="theme-toggle"
        aria-label="切換深淺色模式"
        data-testid="navbar-theme-toggle"
        @click="toggleTheme"
      >
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>

      <!-- Logged-in avatar menu -->
      <template v-if="authStore.isAuthenticated">
        <span class="nav-sep" aria-hidden="true" />
        <div ref="menuHostRef" class="menu-host" data-testid="navbar-user-menu">
          <button
            ref="avatarRef"
            type="button"
            class="avatar"
            data-testid="navbar-avatar"
            aria-haspopup="menu"
            :aria-expanded="isMenuOpen"
            aria-label="開啟使用者選單"
            @click="toggleMenu"
          >
            {{ avatarInitial }}
          </button>

          <div
            v-show="isMenuOpen"
            class="menu"
            :class="{ open: isMenuOpen }"
            role="menu"
            aria-label="使用者選單"
          >
            <div class="menu__head">
              <div class="menu__who" data-testid="navbar-user-greeting">
                你好，{{ authStore.user?.nickname }}
              </div>
              <div class="menu__mail">{{ authStore.user?.email }}</div>
            </div>

            <RouterLink
              v-if="authStore.isAuthor"
              to="/editor"
              class="menu__item"
              role="menuitem"
              data-testid="navbar-link-editor"
              @click="closeMenu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              寫文章
            </RouterLink>

            <RouterLink
              to="/bookmarks"
              class="menu__item"
              role="menuitem"
              data-testid="navbar-link-bookmarks"
              @click="closeMenu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              收藏
            </RouterLink>

            <RouterLink
              to="/settings"
              class="menu__item"
              role="menuitem"
              data-testid="navbar-link-settings"
              @click="closeMenu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10.6 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16.11 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              設定
            </RouterLink>

            <RouterLink
              v-if="authStore.isAdmin"
              to="/admin/review"
              class="menu__item"
              role="menuitem"
              data-testid="navbar-link-admin-review"
              @click="closeMenu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              審核
            </RouterLink>

            <div class="menu__sep" />

            <button
              type="button"
              class="menu__item danger"
              role="menuitem"
              data-testid="navbar-logout-btn"
              @click="handleLogout"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              登出
            </button>
          </div>
        </div>
      </template>

      <!-- Guest sign-in -->
      <RouterLink
        v-else
        to="/login"
        class="nav-link"
        data-testid="navbar-login-btn"
      >
        <span class="dot" />
        Sign in
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
/* ── 分隔線 + 頭像選單（移植自 design-proposals.html § 01 A1） ── */
.nav-sep {
  width: 1px;
  height: 22px;
  background: var(--divider);
  margin: 0 8px;
  flex: none;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  display: grid;
  place-items: center;
  font-family: var(--f-display);
  font-weight: 600;
  font-size: 13px;
  flex: none;
  border: 1px solid transparent;
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}
.avatar:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.menu-host {
  position: relative;
}

.menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 210px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  padding: 7px;
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  transform-origin: top right;
  transition: opacity 0.22s var(--ease), transform 0.28s var(--ease);
  z-index: 50;
}
.menu.open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.menu__head {
  padding: 11px 12px 12px;
  border-bottom: 1px solid var(--divider);
  margin-bottom: 6px;
}
.menu__who {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
}
.menu__mail {
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
  margin-top: 3px;
  line-height: 1.4;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 13.5px;
  text-align: left;
  color: var(--ink);
  transition: background 0.16s;
}
.menu__item:hover {
  background: var(--bg-sub);
}
.menu__item svg {
  width: 15px;
  height: 15px;
  color: var(--muted);
  flex: none;
}
.menu__sep {
  height: 1px;
  background: var(--divider);
  margin: 6px 4px;
}
.menu__item.danger {
  color: #b4453c;
}
[data-theme="dark"] .menu__item.danger {
  color: #e0736a;
}
.menu__item.danger svg {
  color: currentColor;
}
</style>
