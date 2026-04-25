import { createRouter, createMemoryHistory } from 'vue-router'

const StubComponent = { template: '<div></div>' }

export function createTestRouter(initialRoute = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/articles', name: 'articles', component: { template: '<div>Articles</div>' } },
      { path: '/articles/:uuid', name: 'article-detail', component: { template: '<div>Detail</div>' }, props: true },
      { path: '/login', name: 'login', component: StubComponent, meta: { guestOnly: true } },
      { path: '/register', name: 'register', component: StubComponent, meta: { guestOnly: true } },
      { path: '/forgot-password', name: 'forgot-password', component: StubComponent, meta: { guestOnly: true } },
      { path: '/reset-password', name: 'reset-password', component: StubComponent, meta: { guestOnly: true } },
      { path: '/verify-email', name: 'verify-email', component: StubComponent },
      { path: '/editor', name: 'editor-new', component: StubComponent },
      { path: '/editor/:uuid', name: 'editor-edit', component: StubComponent, props: true },
      { path: '/my-articles', name: 'my-articles', component: StubComponent },
      { path: '/admin/review', name: 'admin-review', component: StubComponent },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: StubComponent },
    ],
  })
  router.push(initialRoute)
  return router
}
