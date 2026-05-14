import { createRouter, createWebHistory } from 'vue-router'
import type { Router } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { hasRequiredRole } from '../types/auth'
import type { UserRole } from '../types/auth'

// RouteMeta 型別擴充
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiredRole?: UserRole
    guestOnly?: boolean
    layout?: 'default' | 'shell' | 'full'
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/articles',
      name: 'articles',
      component: () => import('../views/ArticleList.vue')
    },
    {
      path: '/articles/:uuid',
      name: 'article-detail',
      component: () => import('../views/ArticleDetail.vue'),
      props: true
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue')
      // no auth required — public page
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/check-email',
      name: 'check-email',
      component: () => import('../views/CheckEmailView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/VerifyEmailView.vue')
    },
    {
      path: '/editor',
      name: 'editor-new',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true, requiredRole: 'AUTHOR' as UserRole, layout: 'full' as const }
    },
    {
      path: '/editor/:uuid',
      name: 'editor-edit',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true, requiredRole: 'AUTHOR' as UserRole, layout: 'full' as const },
      props: true
    },
    {
      path: '/my-articles',
      name: 'my-articles',
      component: () => import('../views/MyArticlesView.vue'),
      meta: { requiresAuth: true, layout: 'shell' as const }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, layout: 'shell' as const }
    },
    {
      path: '/admin/review',
      name: 'admin-review',
      component: () => import('../views/AdminReviewView.vue'),
      meta: { requiresAuth: true, requiredRole: 'ADMIN' as UserRole }
    },
    {
      path: '/tags',
      name: 'tags-index',
      component: () => import('../views/TagsIndexView.vue')
    },
    {
      path: '/tags/:slug',
      name: 'tag',
      component: () => import('../views/TagView.vue'),
      props: true
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue')
    },
    {
      path: '/500',
      name: 'server-error',
      component: () => import('../views/ServerErrorView.vue')
    },
    {
      path: '/my-stats',
      name: 'my-stats',
      component: () => import('../views/StatsView.vue'),
      meta: { requiresAuth: true, requiredRole: 'AUTHOR' as UserRole, layout: 'shell' as const }
    },
    {
      path: '/author/:handle',
      name: 'author',
      component: () => import('../views/AuthorView.vue'),
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
});

/**
 * 設定全域導航守衛
 *
 * 規則順序：
 * 1. requiresAuth + 未登入 → 記錄 returnUrl → 重導 /login
 * 2. requiredRole + 角色不符 → 重導 / + toast 提示
 * 3. guestOnly + 已登入 → 重導 /
 * 4. 其餘 → 正常通過
 */
export function setupGuards(targetRouter: Router) {
  targetRouter.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const { showToast } = useToast()

    // 等待初始 refresh token 嘗試完成，防止 hard reload 時 accessToken 尚未還原就被踢出
    await authStore.initialize()

    // 需要認證但未登入
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      authStore.setReturnUrl(to.fullPath)
      return { name: 'login' }
    }

    // 需要特定角色但角色不符（含層級繼承：ADMIN 可通過所有角色要求）
    if (to.meta.requiredRole && !hasRequiredRole(authStore.userRole, to.meta.requiredRole)) {
      showToast('權限不足', 'error')
      return { name: 'home' }
    }

    // 僅訪客可見但已登入
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: 'home' }
    }

    // 正常通過
    return true
  })
}

setupGuards(router)

export default router
