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
    this.successMessage = page.getByTestId('auth-verify-success')
    this.failureMessage = page.getByTestId('auth-verify-failure')
    this.noTokenMessage = page.getByTestId('auth-verify-no-token')
    this.resendBtn = page.getByTestId('auth-verify-resend-link')
    this.loadingState = page.getByText('驗證中...')
  }

  async goto(token?: string) {
    const url = token ? `/verify-email?token=${token}` : '/verify-email'
    await this.page.goto(url)
  }
}
