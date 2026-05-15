<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppearance } from '../../composables/useAppearance'
import { useNavScroll } from '../../composables/useNavScroll'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useAppearance()
const { show } = useNavScroll()

async function handleLogout() {
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

      <!-- Logged-in user menu -->
      <div v-if="authStore.isAuthenticated" class="nav-user" data-testid="navbar-user-menu">
        <span class="nav-user__name" data-testid="navbar-user-greeting">
          你好, {{ authStore.user?.nickname }}!
        </span>
        <RouterLink to="/bookmarks" class="nav-link" active-class="active" data-testid="navbar-link-bookmarks">
          收藏
        </RouterLink>
        <RouterLink to="/settings" class="nav-link" active-class="active" data-testid="navbar-link-settings">
          設定
        </RouterLink>
        <button class="nav-link" data-testid="navbar-logout-btn" @click="handleLogout">登出</button>
      </div>

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
