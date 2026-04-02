import { createRouter, createWebHistory } from 'vue-router'
import type { Router } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import type { UserRole } from '../types/auth'

// RouteMeta 型別擴充
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiredRole?: UserRole
    guestOnly?: boolean
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
  targetRouter.beforeEach((to) => {
    const authStore = useAuthStore()
    const { showToast } = useToast()

    // 需要認證但未登入
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      authStore.setReturnUrl(to.fullPath)
      return { name: 'login' }
    }

    // 需要特定角色但角色不符
    if (to.meta.requiredRole && authStore.userRole !== to.meta.requiredRole) {
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
