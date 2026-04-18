import type { Page, Locator } from '@playwright/test'

export class AuthResetPasswordPage {
  readonly page: Page
  readonly passwordField: Locator
  readonly confirmField: Locator
  readonly submitBtn: Locator
  readonly invalidTokenMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.passwordField = page.getByTestId('auth-reset-field-password')
    this.confirmField = page.getByTestId('auth-reset-field-confirm')
    this.submitBtn = page.getByTestId('auth-reset-submit')
    this.invalidTokenMessage = page.getByText('無效的重設連結')
  }

  async goto(token?: string) {
    const url = token ? `/reset-password?token=${token}` : '/reset-password'
    await this.page.goto(url)
  }

  async reset(password: string, confirm: string) {
    await this.passwordField.fill(password)
    await this.confirmField.fill(confirm)
    await this.submitBtn.click()
  }
}
