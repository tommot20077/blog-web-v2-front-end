import { test, expect } from '@playwright/test'

/**
 * TDD RED 階段：釘住 Yuan 於 2026-07-19 手動測試 /register 與全站 toast 時
 * 回報的 5 個 UI 缺陷（T1-T5）。此檔案只寫測試，不修任何 src/ 底下的實作。
 *
 * 撰寫原則（設計方案尚未定案，禁止寫死具體設計值）：
 * - 一律斷言「缺陷消失」的不變量（相異 / 可見 / 有背景 / 右欄不得寬於左欄……），
 *   不 toBe() 任何具體顏色、px 數值或比例。
 * - 每個斷言都附上可讀的失敗訊息，紅燈時能一眼看出對應哪個缺陷與實測數值。
 */

test.describe('Auth UI 回歸測試（T1-T5 缺陷釘選）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await page.waitForURL(/\/register/, { timeout: 5000 })
  })

  test('T1: auth-shell 底緣與 footer 頂緣間距不應有大片空白', async ({ page }) => {
    const shell = page.locator('.auth-shell')
    const footer = page.getByTestId('footer-root')
    await expect(shell).toBeVisible()

    // footer 可能在 viewport 外，先捲動確保取得的是真實 layout 位置
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()

    const shellBox = await shell.boundingBox()
    const footerBox = await footer.boundingBox()
    expect(shellBox, 'auth-shell 應有可量測的 bounding box').not.toBeNull()
    expect(footerBox, 'footer-root 應有可量測的 bounding box').not.toBeNull()

    const gap = footerBox!.y - (shellBox!.y + shellBox!.height)

    // 實測現況（1280x720 viewport, chromium）：
    // .auth-shell { min-height: 100vh } 疊加 .footer { margin-top: 120px }，
    // 兩者垂直間距約落在 100~130px 之間，形成一大塊無內容空白。
    // 上限訂 24px（footer 與內容之間合理的呼吸空間）。
    expect(
      gap,
      `auth-shell 底緣到 footer 頂緣的間距為 ${gap}px，超過合理上限 24px（預期現況會落在 ~120px 附近）`,
    ).toBeLessThanOrEqual(24)
  })

  test('T2: 左側 hero 寬度不應小於右側表單欄寬度', async ({ page }) => {
    const hero = page.locator('.auth-hero')
    const formCol = page.locator('.auth-form-col')
    await expect(hero).toBeVisible()
    await expect(formCol).toBeVisible()

    const heroBox = await hero.boundingBox()
    const formColBox = await formCol.boundingBox()
    expect(heroBox, 'auth-hero 應有可量測的 bounding box').not.toBeNull()
    expect(formColBox, 'auth-form-col 應有可量測的 bounding box').not.toBeNull()

    // 實測現況：.auth-hero { flex: 0 0 42% }、.auth-form-col { flex: 1 1 0% }（佔剩餘 58%），
    // 但表單內層 .auth-form-col__inner 有 max-width:420px，右欄產生大片死白 ——
    // 亦即容器層級的右欄（58%）目前就比左欄（42%）寬，與期望相反。
    expect(
      heroBox!.width,
      `auth-hero 寬度 ${heroBox!.width}px 應 ≥ auth-form-col 寬度 ${formColBox!.width}px（右欄不得比左欄寬）`,
    ).toBeGreaterThanOrEqual(formColBox!.width)
  })

  test('T3: 密碼規則已達成與未達成項目視覺上應可區分', async ({ page }) => {
    // abcdefg1 滿足 length/lowercase/digit，不滿足 uppercase/special
    await page.getByTestId('auth-register-field-password').fill('abcdefg1')

    const metRule = page.getByTestId('rule-length')
    const unmetRule = page.getByTestId('rule-uppercase')
    await expect(metRule).toHaveAttribute('data-met', 'true')
    await expect(unmetRule).toHaveAttribute('data-met', 'false')

    const readStyle = async (locator: typeof metRule) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el)
        // icon 是 li 內第一個 span
        const icon = el.querySelector('span')
        const iconCs = icon ? getComputedStyle(icon) : null
        return {
          color: cs.color,
          opacity: cs.opacity,
          textDecorationLine: cs.textDecorationLine,
          iconBackground: iconCs?.backgroundColor ?? null,
        }
      })

    const metStyle = await readStyle(metRule)
    const unmetStyle = await readStyle(unmetRule)

    const anyDifferent =
      metStyle.color !== unmetStyle.color ||
      metStyle.opacity !== unmetStyle.opacity ||
      metStyle.textDecorationLine !== unmetStyle.textDecorationLine ||
      metStyle.iconBackground !== unmetStyle.iconBackground

    expect(
      anyDifferent,
      `已達成項與未達成項視覺屬性完全相同（無法區分）：` +
        `met=${JSON.stringify(metStyle)} unmet=${JSON.stringify(unmetStyle)}`,
    ).toBe(true)
  })

  test('T4: 輸入密碼後強度條必須可見（有高度且背景非透明）', async ({ page }) => {
    await page.getByTestId('auth-register-field-password').fill('abcdefg1')

    const strengthBar = page.getByTestId('strength-bar')
    await expect(strengthBar).toBeAttached()

    const { height, bgAlpha, background } = await strengthBar.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const bg = cs.backgroundColor
      const match = bg.match(/rgba?\(([^)]+)\)/)
      let alpha = 1
      if (match) {
        const parts = match[1].split(',').map((p) => parseFloat(p.trim()))
        alpha = parts.length === 4 ? parts[3] : 1
      }
      return { height: rect.height, bgAlpha: alpha, background: bg }
    })

    // 實測現況：strength-bar computed height 為 0px、background 為 rgba(0,0,0,0)（透明），
    // 導致強度條完全不可見。
    expect(height, `strength-bar computed height 為 ${height}px，應 > 0`).toBeGreaterThan(0)
    expect(
      bgAlpha,
      `strength-bar 背景為 ${background}（alpha=${bgAlpha}），應為非透明（alpha > 0）`,
    ).toBeGreaterThan(0)
  })

  test('T5: toast 定位與樣式不應貼齊左上角、且需有非透明卡片背景', async ({ page }) => {
    // 以已存在的 seed email 觸發「該信箱已被註冊」錯誤 toast（global-setup 保證此帳號存在）
    await page.getByTestId('auth-register-field-email').fill('admin@test.local')
    await page.getByTestId('auth-register-field-username').fill(`dup_user_${Date.now()}`)
    await page.getByTestId('auth-register-field-nickname').fill('Dup Test')
    await page.getByTestId('auth-register-field-password').fill('Test1234!')
    await page.getByTestId('auth-register-submit').click()

    const toastMessage = page.getByTestId('toast-message').first()
    await expect(toastMessage).toBeVisible({ timeout: 10000 })

    // 往上找出實際負責定位（fixed/absolute）與提供卡片背景的祖先元素，
    // 不依賴任何具體 class 名稱 —— 只檢查 computed style 的不變量。
    const result = await toastMessage.evaluate((el) => {
      let positionedAncestor: HTMLElement | null = null
      let node: HTMLElement | null = el.parentElement
      while (node) {
        const cs = getComputedStyle(node)
        if (cs.position === 'fixed' || cs.position === 'absolute') {
          positionedAncestor = node
          break
        }
        node = node.parentElement
      }

      // 卡片背景：從 toast-message 本身往上找第一個有非透明背景色的祖先（含自己），
      // 在抵達 positionedAncestor 或 body 前停止。
      let cardBg = 'rgba(0, 0, 0, 0)'
      let cardNode: HTMLElement | null = el
      while (cardNode && cardNode !== document.body) {
        const bg = getComputedStyle(cardNode).backgroundColor
        const m = bg.match(/rgba?\(([^)]+)\)/)
        const alpha = m ? (m[1].split(',').map((p) => parseFloat(p.trim()))[3] ?? 1) : 1
        if (alpha > 0) {
          cardBg = bg
          break
        }
        if (cardNode === positionedAncestor) break
        cardNode = cardNode.parentElement
      }

      const rect = (positionedAncestor ?? el).getBoundingClientRect()
      return {
        hasPositionedAncestor: !!positionedAncestor,
        position: positionedAncestor ? getComputedStyle(positionedAncestor).position : null,
        x: rect.x,
        y: rect.y,
        cardBackground: cardBg,
      }
    })

    expect(
      result.hasPositionedAncestor,
      'toast 應存在一個 position:fixed 或 absolute 的定位祖先元素',
    ).toBe(true)

    // 實測現況：toast 目前貼齊 viewport 左上角（x/y 幾乎為 0）。
    const distanceFromTopLeftCorner = Math.hypot(result.x, result.y)
    expect(
      distanceFromTopLeftCorner,
      `toast 定位祖先(position=${result.position}) bounding box 為 (x=${result.x}, y=${result.y})，` +
        `距離 viewport 左上角過近（應 > 8px）`,
    ).toBeGreaterThan(8)

    const cardMatch = result.cardBackground.match(/rgba?\(([^)]+)\)/)
    const cardAlpha = cardMatch
      ? (cardMatch[1].split(',').map((p) => parseFloat(p.trim()))[3] ?? 1)
      : 1
    expect(
      cardAlpha,
      `toast 卡片背景為 ${result.cardBackground}（alpha=${cardAlpha}），應非透明（alpha > 0），即需有卡片樣式`,
    ).toBeGreaterThan(0)
  })
})
