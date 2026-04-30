import { render, fireEvent } from '@testing-library/vue'
import FilterBar from './FilterBar.vue'

describe('FilterBar', () => {
  it('渲染 6 個分類按鈕', () => {
    const { getByText } = render(FilterBar)

    const expectedCategories = ['全部', 'Frontend', 'Backend', 'DevOps', 'UI/UX', 'Life']
    for (const cat of expectedCategories) {
      expect(getByText(cat)).toBeTruthy()
    }
  })

  it('點擊分類按鈕 → 發出 filter 事件且 category 正確', async () => {
    const { getByText, emitted } = render(FilterBar)

    await fireEvent.click(getByText('Frontend'))

    const filterEvents = emitted<[string, string, string]>('filter')
    expect(filterEvents).toHaveLength(1)
    expect(filterEvents[0][0]).toBe('Frontend')
  })

  it('搜尋框輸入關鍵字並按 Enter → 發出 filter 事件且包含 keyword', async () => {
    const { getByPlaceholderText, emitted } = render(FilterBar)

    const input = getByPlaceholderText('搜尋文章...')
    await fireEvent.update(input, 'Vue 教學')
    await fireEvent.keyUp(input, { key: 'Enter' })

    const filterEvents = emitted<[string, string, string]>('filter')
    expect(filterEvents.length).toBeGreaterThanOrEqual(1)

    const lastEvent = filterEvents[filterEvents.length - 1]
    expect(lastEvent[1]).toBe('Vue 教學')
  })

  it('點擊清單模式按鈕 → 發出 filter 事件且 mode 為 list', async () => {
    const { getByTitle, emitted } = render(FilterBar)

    await fireEvent.click(getByTitle('無限捲動清單模式'))

    const filterEvents = emitted<[string, string, string]>('filter')
    expect(filterEvents).toHaveLength(1)
    expect(filterEvents[0][2]).toBe('list')
  })

  it('搜尋框存在且 placeholder 為「搜尋文章...」', () => {
    const { getByPlaceholderText } = render(FilterBar)

    const input = getByPlaceholderText('搜尋文章...')
    expect(input).toBeTruthy()
    expect(input.tagName.toLowerCase()).toBe('input')
  })
})
