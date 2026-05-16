import path from 'node:path'
import { test, expect } from '../fixtures/mock-app'

const imagePath = path.resolve('e2e/fixtures/test-image.png')

test.describe('Author journey', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  test('作者可建立草稿、上傳封面、再次編輯並送審', async ({ page, loginAs }) => {
    await loginAs('author')
    await page.goto('/editor')

    await page.getByTestId('editor-title-input').fill('Author journey 草稿')
    await page.locator('.cm-content').click()
    await page.locator('.cm-content').pressSequentially('Author journey content')
    await page.getByPlaceholder(/文章摘要/).fill('Author journey 摘要')

    const fileInput = page.getByTestId('cover-upload-input')
    await fileInput.setInputFiles(imagePath)
    await expect(page.getByTestId('cover-preview')).toBeVisible({ timeout: 8000 })

    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible({ timeout: 8000 })
    await expect(page).toHaveURL(/\/editor\/.+/)

    const editorUrl = page.url()
    const articleUuid = editorUrl.split('/').pop()!

    await page.goto('/my-articles')
    await expect(page.getByText('Author journey 草稿')).toBeVisible()
    await page.getByTestId(`my-row-action-edit-${articleUuid}`).click()
    await expect(page.getByTestId('editor-title-input')).toHaveValue('Author journey 草稿')

    await page.goto('/my-articles')
    await page.getByTestId(`my-row-${articleUuid}`).getByRole('button', { name: '送出審核' }).click()
    await expect(page.getByText('已送出審核')).toBeVisible()
    await expect(page.getByTestId(`my-row-${articleUuid}`)).toContainText('待審')
  })

  test('我的文章顯示 draft、pending、rejected、published 狀態與退回理由', async ({ page, loginAs }) => {
    await loginAs('author')
    await page.goto('/my-articles')

    await expect(page.getByText('Vue 3 Composition API 草稿')).toBeVisible()
    await expect(page.getByText('Pinia 狀態管理待審')).toBeVisible()
    await expect(page.getByText('Docker 入門退回文章')).toBeVisible()
    await expect(page.getByText('Vite 實戰發布文章')).toBeVisible()
    await expect(page.getByTestId('my-row-editor-draft-1').locator('td').nth(1)).toHaveText('草稿')
    await expect(page.getByTestId('my-row-editor-pending-1').locator('td').nth(1)).toHaveText('待審')
    await expect(page.getByTestId('my-row-editor-rejected-1').locator('td').nth(1)).toHaveText('被退回')
    await expect(page.getByTestId('my-row-editor-published-1').locator('td').nth(1)).toHaveText('已發布')
    await expect(page.getByText('內容需要補充實作步驟。')).toBeVisible()
  })

  test('儲存失敗時表單內容保留', async ({ page, loginAs, mockApiFailure }) => {
    await loginAs('author')
    await mockApiFailure('**/api/v1/articles*', { code: 'A0200', message: '儲存失敗', data: null }, 500)
    await page.goto('/editor')

    await page.getByTestId('editor-title-input').fill('失敗後仍保留')
    await page.locator('.cm-content').click()
    await page.locator('.cm-content').pressSequentially('不應消失的內容')
    await page.getByTestId('editor-save-btn').click()

    await expect(page.getByText('儲存失敗')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('editor-title-input')).toHaveValue('失敗後仍保留')
    await expect(page.locator('.cm-content')).toContainText('不應消失的內容')
  })

  test('USER 與未登入不可進 author-only route', async ({ page, loginAs, expectAuthRedirect }) => {
    await expectAuthRedirect('/editor')

    await loginAs('reader')
    await page.goto('/editor')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('toast-message').filter({ hasText: '權限不足' }).last()).toBeVisible()

    await page.goto('/my-stats')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('toast-message').filter({ hasText: '權限不足' }).last()).toBeVisible()
  })
})
