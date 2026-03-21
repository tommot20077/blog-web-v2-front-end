import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

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
    }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
});

export default router
