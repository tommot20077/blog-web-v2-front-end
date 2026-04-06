import { test as base } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { ArticleListPage } from '../pages/article-list.page'
import { ArticleDetailPage } from '../pages/article-detail.page'
import { NavigationBarPO } from '../pages/components/navigation-bar.po'
import { FilterBarPO } from '../pages/components/filter-bar.po'
import { ThemeSwitcherPO } from '../pages/components/theme-switcher.po'

type Fixtures = {
  homePage: HomePage
  articleListPage: ArticleListPage
  articleDetailPage: ArticleDetailPage
  navigationBar: NavigationBarPO
  filterBar: FilterBarPO
  themeSwitcher: ThemeSwitcherPO
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  articleListPage: async ({ page }, use) => {
    await use(new ArticleListPage(page))
  },
  articleDetailPage: async ({ page }, use) => {
    await use(new ArticleDetailPage(page))
  },
  navigationBar: async ({ page }, use) => {
    await use(new NavigationBarPO(page))
  },
  filterBar: async ({ page }, use) => {
    await use(new FilterBarPO(page))
  },
  themeSwitcher: async ({ page }, use) => {
    await use(new ThemeSwitcherPO(page))
  },
})

export { expect } from '@playwright/test'
