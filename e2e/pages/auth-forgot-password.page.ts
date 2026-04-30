import type { Page, Locator } from '@playwright/test'

export class AuthForgotPasswordPage {
  readonly page: Page
  readonly emailField: Locator
  readonly submitBtn: Locator
  readonly successMessage: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailField = page.getByTestId('auth-forgot-field-email')
    this.submitBtn = page.getByTestId('auth-forgot-submit')
    this.successMessage = page.getByTestId('auth-forgot-success')
    this.loginLink = page.getByTestId('auth-forgot-alt-link')
  }

  async goto() {
    await this.page.goto('/forgot-password')
  }

  async submit(email: string) {
    await this.emailField.fill(email)
    await this.submitBtn.click()
  }
}
