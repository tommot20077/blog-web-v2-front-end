import { createRouter, createMemoryHistory } from 'vue-router'

export function createTestRouter(initialRoute = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/articles', name: 'articles', component: { template: '<div>Articles</div>' } },
      { path: '/articles/:uuid', name: 'article-detail', component: { template: '<div>Detail</div>' }, props: true },
    ],
  })
  router.push(initialRoute)
  return router
}
