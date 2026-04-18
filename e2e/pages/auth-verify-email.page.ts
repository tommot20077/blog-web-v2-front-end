import type { Page, Locator } from '@playwright/test'

export class AuthVerifyEmailPage {
  readonly page: Page
  readonly successMessage: Locator
  readonly failureMessage: Locator
  readonly noTokenMessage: Locator
  readonly resendBtn: Locator
  readonly loadingState: Locator

  constructor(page: Page) {
    this.page = page
    this.successMessage = page.getByText('信箱驗證成功！')
    this.failureMessage = page.getByText('驗證失敗')
    this.noTokenMessage = page.getByText('無效的驗證連結')
    this.resendBtn = page.getByTestId('auth-verify-resend-btn')
    this.loadingState = page.getByText('驗證中...')
  }

  async goto(token?: string) {
    const url = token ? `/verify-email?token=${token}` : '/verify-email'
    await this.page.goto(url)
  }
}
