import type { Page, Locator } from '@playwright/test'

export class AuthRegisterPage {
  readonly page: Page
  readonly emailField: Locator
  readonly usernameField: Locator
  readonly nicknameField: Locator
  readonly passwordField: Locator
  readonly submitBtn: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailField = page.getByTestId('auth-register-field-email')
    this.usernameField = page.getByTestId('auth-register-field-username')
    this.nicknameField = page.getByTestId('auth-register-field-nickname')
    this.passwordField = page.getByTestId('auth-register-field-password')
    this.submitBtn = page.getByTestId('auth-register-submit')
    this.loginLink = page.getByTestId('auth-register-alt-link')
  }

  async goto() {
    await this.page.goto('/register')
  }

  async register(email: string, username: string, nickname: string, password: string) {
    await this.emailField.fill(email)
    await this.usernameField.fill(username)
    await this.nicknameField.fill(nickname)
    await this.passwordField.fill(password)
    await this.submitBtn.click()
  }
}
