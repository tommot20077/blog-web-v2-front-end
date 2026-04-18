<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useTheme } from '../../composables/useTheme';

const router = useRouter();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();

async function handleLogout() {
  await authStore.logout();
  router.push('/');
}
</script>

<template>
  <!-- Fixed pill navbar — pointer-events-none on wrapper so it doesn't block scroll -->
  <nav
    class="nav"
    data-testid="navbar-root"
  >
    <!-- Logo -->
    <RouterLink to="/" class="nav-logo" data-testid="navbar-logo">
      <span class="mark" />
      <span class="name">MY BLOG WEB.</span>
    </RouterLink>

    <!-- Pill navigation links -->
    <RouterLink
      to="/"
      class="nav-link"
      active-class=""
      exact-active-class="active"
      data-testid="navbar-link-home"
    >
      首頁
    </RouterLink>
    <RouterLink
      to="/articles"
      class="nav-link"
      active-class="active"
      exact-active-class="active"
      data-testid="navbar-link-articles"
    >
      文章
    </RouterLink>

    <!-- Right cluster -->
    <!-- Theme toggle -->
    <button
      class="theme-toggle"
      aria-label="切換深淺色模式"
      data-testid="navbar-theme-toggle"
      @click="toggleTheme"
    >
      <!-- Sun icon (light mode) -->
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <!-- Moon icon (dark mode) -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>

    <!-- User menu (logged in) -->
    <div v-if="authStore.isAuthenticated" class="nav-user" data-testid="navbar-user-menu">
      <span class="nav-user__name">{{ authStore.user?.nickname }}</span>
      <button class="nav-link" data-testid="navbar-logout-btn" @click="handleLogout">登出</button>
    </div>

    <!-- Login button (guest) -->
    <RouterLink
      v-else
      to="/login"
      class="nav-link"
      data-testid="navbar-login-btn"
    >
      <span class="dot" />
      登入
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 18px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px 8px 8px 18px;
  max-width: fit-content;
  margin: 0 auto;
  border-radius: 999px;
  background: var(--glass);
  backdrop-filter: saturate(1.8) blur(22px);
  -webkit-backdrop-filter: saturate(1.8) blur(22px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
  pointer-events: auto;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 0;
  border-right: 1px solid var(--divider);
  margin-right: 6px;
  text-decoration: none;
}

.nav-logo .mark {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--ink);
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.nav-logo .mark::after {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--bg);
}

.nav-logo .name {
  font-family: var(--f-display);
  font-weight: 500;
  font-style: italic;
  font-size: 14.5px;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.nav-link {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--ink);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.nav-link:hover {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  background: var(--ink);
  color: var(--bg);
}

.nav-link .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  display: inline-block;
}

.theme-toggle {
  margin-left: 4px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  transition: background 0.2s;
  background: none;
  cursor: pointer;
  color: var(--ink);
}

.theme-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .theme-toggle:hover {
  background: rgba(255, 255, 255, 0.06);
}

.theme-toggle svg {
  width: 15px;
  height: 15px;
}

.nav-user {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-left: 4px;
  border-left: 1px solid var(--divider);
  margin-left: 4px;
}

.nav-user__name {
  font-size: 13px;
  color: var(--muted);
  padding: 0 8px;
}
</style>
