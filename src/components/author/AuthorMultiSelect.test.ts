import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import { defineComponent, ref } from 'vue'
import AuthorMultiSelect from './AuthorMultiSelect.vue'
import { authorService } from '../../api/authorService'
import { MAX_VALUES_PER_FILTER } from '../../composables/useArticleFilters'
import type { AuthorSearchItem } from '../../api/authorService'

vi.mock('../../api/authorService', () => ({
  authorService: { searchAuthors: vi.fn() },
}))

const search = vi.mocked(authorService.searchAuthors)

const author = (uuid: string, nickname: string, n = 1): AuthorSearchItem =>
  ({ uuid, nickname, avatarUrl: null, publishedArticleCount: n })

const YUAN = author('u-yuan', 'Yuan', 9)
const HAN = author('u-han', 'Han', 3)

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

/** 以 v-model 驅動的測試外殼，暴露目前值與 labels */
function harness(initial: string[] = [], max?: number) {
  const value = ref<string[]>(initial)
  const labels = ref<Record<string, string>>({})
  const Host = defineComponent({
    components: { AuthorMultiSelect },
    setup: () => ({ value, labels, max }),
    template: '<AuthorMultiSelect v-model="value" :max="max" @update:labels="labels = $event" />',
  })
  return { ...render(Host), value, labels }
}

async function typeInto(input: HTMLElement, text: string) {
  await fireEvent.update(input, text)
}

async function flush() {
  await vi.advanceTimersByTimeAsync(0)
}

describe('AuthorMultiSelect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    search.mockReset()
    search.mockResolvedValue([YUAN, HAN])
  })
  afterEach(() => { vi.useRealTimers() })

  describe('ARIA', () => {
    it('輸入框是 combobox，aria-expanded／aria-controls／aria-autocomplete 正確', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox')
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(input.getAttribute('aria-autocomplete')).toBe('list')
      await fireEvent.focus(input)
      await flush()
      expect(input.getAttribute('aria-expanded')).toBe('true')
      const listbox = getByRole('listbox')
      expect(input.getAttribute('aria-controls')).toBe(listbox.id)
      expect(listbox.getAttribute('aria-multiselectable')).toBe('true')
    })

    it('選項是 role=option，aria-selected 反映是否已選；aria-activedescendant 指向作用中選項', async () => {
      const { getByRole, getAllByRole } = harness(['u-han'])
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      const options = getAllByRole('option')
      expect(options.map(o => o.getAttribute('aria-selected'))).toEqual(['false', 'true'])
      expect(input.getAttribute('aria-activedescendant')).toBeNull()
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id)
      expect(options[0].id).not.toBe('')
    })

    it('輸入框有可存取名稱', () => {
      const { getByRole } = harness()
      expect(getByRole('combobox').getAttribute('aria-label')).toBeTruthy()
    })
  })

  describe('搜尋：debounce 與舊回應', () => {
    it('連續輸入只在停手 300ms 後送 1 次請求', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      search.mockClear()

      await typeInto(input, 'y')
      await vi.advanceTimersByTimeAsync(100)
      await typeInto(input, 'yu')
      await vi.advanceTimersByTimeAsync(100)
      await typeInto(input, 'yua')
      await vi.advanceTimersByTimeAsync(299)
      expect(search).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(search).toHaveBeenCalledTimes(1)
      expect(search).toHaveBeenCalledWith('yua')
    })

    it('keyword 先 trim 再送出', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      search.mockClear()
      await typeInto(input, '  yuan  ')
      await vi.advanceTimersByTimeAsync(300)
      expect(search).toHaveBeenCalledWith('yuan')
    })

    it('舊回應較晚抵達時被丟棄，畫面只顯示最新一次的結果', async () => {
      const slow = deferred<AuthorSearchItem[]>()
      const fast = deferred<AuthorSearchItem[]>()
      const { getByRole, queryByText, getByText } = harness()
      const input = getByRole('combobox')
      search.mockReset()
      search.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)

      await typeInto(input, 'a')
      await vi.advanceTimersByTimeAsync(300)
      await typeInto(input, 'ab')
      await vi.advanceTimersByTimeAsync(300)
      expect(search).toHaveBeenCalledTimes(2)

      fast.resolve([HAN])
      await flush()
      slow.resolve([YUAN])
      await flush()

      expect(getByText('Han')).toBeTruthy()
      expect(queryByText('Yuan')).toBeNull()
    })

    it('舊請求失敗不會蓋掉新結果的狀態', async () => {
      const slow = deferred<AuthorSearchItem[]>()
      const fast = deferred<AuthorSearchItem[]>()
      const { getByRole, queryByRole, getByText } = harness()
      const input = getByRole('combobox')
      search.mockReset()
      search.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)
      await typeInto(input, 'a')
      await vi.advanceTimersByTimeAsync(300)
      await typeInto(input, 'ab')
      await vi.advanceTimersByTimeAsync(300)
      fast.resolve([HAN])
      await flush()
      slow.reject(new Error('late failure'))
      await flush()
      expect(queryByRole('alert')).toBeNull()
      expect(getByText('Han')).toBeTruthy()
    })

    it('首次聚焦立即載入（keyword 為空），不等 debounce', async () => {
      const { getByRole } = harness()
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      expect(search).toHaveBeenCalledTimes(1)
      expect(search).toHaveBeenCalledWith('')
    })

    it('輸入框限制 50 字（對齊後端 keyword 上限）', () => {
      const { getByRole } = harness()
      expect(getByRole('combobox').getAttribute('maxlength')).toBe('50')
    })
  })

  describe('無結果與錯誤', () => {
    it('沒有符合的作者 → 顯示「找不到符合的作者」，且沒有 option', async () => {
      search.mockResolvedValue([])
      const { getByRole, getByText, queryAllByRole } = harness()
      const input = getByRole('combobox')
      await typeInto(input, 'zzz')
      await vi.advanceTimersByTimeAsync(300)
      expect(getByText('找不到符合的作者')).toBeTruthy()
      expect(queryAllByRole('option', { hidden: true })).toHaveLength(0)
    })

    it('搜尋失敗 → role=alert 提示，與「無結果」區分', async () => {
      search.mockRejectedValue(new Error('boom'))
      const { getByRole, queryByText } = harness()
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      expect(getByRole('alert').textContent).toContain('搜尋失敗')
      expect(queryByText('找不到符合的作者')).toBeNull()
    })

    it('載入中顯示「搜尋中…」', async () => {
      const d = deferred<AuthorSearchItem[]>()
      search.mockReturnValue(d.promise)
      const { getByRole, getByText } = harness()
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      expect(getByText('搜尋中…')).toBeTruthy()
      d.resolve([])
      await flush()
    })
  })

  describe('選取與 chip', () => {
    it('點選項 → v-model 加入 uuid，chip 顯示 nickname；再點一次取消', async () => {
      const { getByRole, getAllByRole, value, labels } = harness()
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      expect(value.value).toEqual(['u-yuan'])
      expect(labels.value).toMatchObject({ 'u-yuan': 'Yuan' })
      expect(getByRole('button', { name: '移除 Yuan' })).toBeTruthy()
      await fireEvent.click(getAllByRole('option')[0])
      expect(value.value).toEqual([])
    })

    it('點 chip 的移除鈕 → 從 v-model 移除', async () => {
      const { getByRole, getAllByRole, value } = harness()
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      await fireEvent.click(getAllByRole('option')[1])
      expect(value.value).toEqual(['u-yuan', 'u-han'])
      await fireEvent.click(getByRole('button', { name: '移除 Yuan' }))
      expect(value.value).toEqual(['u-han'])
    })

    it('搜尋結果換了之後，已選作者的 chip 仍顯示 nickname（自行保存 uuid→nickname）', async () => {
      const { getByRole, getAllByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      search.mockResolvedValue([HAN])
      await typeInto(input, 'han')
      await vi.advanceTimersByTimeAsync(300)
      expect(getByRole('button', { name: '移除 Yuan' })).toBeTruthy()
    })

    it('初始值含不認得的 uuid（例如來自網址）→ chip 仍可移除，不顯示 uuid', () => {
      const { getByRole, queryByText } = harness(['mystery-uuid'])
      expect(queryByText('mystery-uuid')).toBeNull()
      expect(getByRole('button', { name: /移除/ })).toBeTruthy()
    })
  })

  describe('上限', () => {
    const many = Array.from({ length: MAX_VALUES_PER_FILTER }, (_, i) => `sel-${i}`)

    it('已選達上限（沿用 MAX_VALUES_PER_FILTER = 20）→ 未選的選項 aria-disabled 且點了不加入', async () => {
      expect(MAX_VALUES_PER_FILTER).toBe(20)
      const { getByRole, getAllByRole, value } = harness(many)
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      const options = getAllByRole('option')
      expect(options.every(o => o.getAttribute('aria-disabled') === 'true')).toBe(true)
      await fireEvent.click(options[0])
      expect(value.value).toHaveLength(MAX_VALUES_PER_FILTER)
    })

    it('達上限時仍可取消已選項', async () => {
      search.mockResolvedValue([author('sel-3', 'Three')])
      const { getByRole, getAllByRole, value } = harness(many)
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      const option = getAllByRole('option')[0]
      expect(option.getAttribute('aria-selected')).toBe('true')
      expect(option.getAttribute('aria-disabled')).not.toBe('true')
      await fireEvent.click(option)
      expect(value.value).toHaveLength(MAX_VALUES_PER_FILTER - 1)
    })

    it('第 19 個之後還能選第 20 個，並顯示已達上限提示', async () => {
      const nineteen = many.slice(0, 19)
      const { getByRole, getAllByRole, value, getByText } = harness(nineteen)
      await fireEvent.focus(getByRole('combobox'))
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      expect(value.value).toHaveLength(20)
      expect(getByText(/最多/)).toBeTruthy()
    })
  })

  describe('鍵盤', () => {
    it('ArrowDown／ArrowUp 移動作用中選項（循環）', async () => {
      const { getByRole, getAllByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      const opts = getAllByRole('option')
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(input.getAttribute('aria-activedescendant')).toBe(opts[0].id)
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(input.getAttribute('aria-activedescendant')).toBe(opts[1].id)
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(input.getAttribute('aria-activedescendant')).toBe(opts[0].id)
      await fireEvent.keyDown(input, { key: 'ArrowUp' })
      expect(input.getAttribute('aria-activedescendant')).toBe(opts[1].id)
    })

    it('列表關閉時按 ArrowDown 會開啟列表', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      await flush()
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    it('Enter 選取作用中選項（列表保持開啟，可連續選）', async () => {
      const { getByRole, value } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      await fireEvent.keyDown(input, { key: 'Enter' })
      expect(value.value).toEqual(['u-yuan'])
      expect(input.getAttribute('aria-expanded')).toBe('true')
      await fireEvent.keyDown(input, { key: 'ArrowDown' })
      await fireEvent.keyDown(input, { key: 'Enter' })
      expect(value.value).toEqual(['u-yuan', 'u-han'])
    })

    it('沒有作用中選項時 Enter 不選取任何東西', async () => {
      const { getByRole, value } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      await fireEvent.keyDown(input, { key: 'Enter' })
      expect(value.value).toEqual([])
    })

    it('Escape 關閉列表；列表已關時再按 Escape 清空輸入文字', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox') as HTMLInputElement
      await typeInto(input, 'yu')
      await vi.advanceTimersByTimeAsync(300)
      expect(input.getAttribute('aria-expanded')).toBe('true')
      await fireEvent.keyDown(input, { key: 'Escape' })
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(input.value).toBe('yu')
      await fireEvent.keyDown(input, { key: 'Escape' })
      expect(input.value).toBe('')
    })

    it('(a) 載入中（debounce 或請求在途）按 Enter 不選到舊清單的項目', async () => {
      const { getByRole, value } = harness()
      const input = getByRole('combobox') as HTMLInputElement
      await fireEvent.focus(input)
      await flush()
      await fireEvent.keyDown(input, { key: 'ArrowDown' }) // 作用中 = 舊清單第 0 項
      await typeInto(input, 'han') // 進入 debounce／loading
      await fireEvent.keyDown(input, { key: 'Enter' })
      expect(value.value).toEqual([])
    })

    it('(b) 連按兩次 Esc 不會卡在 loading，之後 open() 重新載入', async () => {
      const { getByRole, queryByText } = harness()
      const input = getByRole('combobox') as HTMLInputElement
      await typeInto(input, 'yu')
      await vi.advanceTimersByTimeAsync(300)
      await fireEvent.keyDown(input, { key: 'Escape' })
      await typeInto(input, 'yuan') // loading + timer 進行中
      await fireEvent.keyDown(input, { key: 'Escape' }) // 第一次關閉
      await fireEvent.keyDown(input, { key: 'Escape' }) // 第二次清空
      expect(input.value).toBe('')
      search.mockClear()
      await fireEvent.focus(input)
      await fireEvent.click(input)
      await flush()
      expect(queryByText('搜尋中…')).toBeNull()
      expect(search).toHaveBeenCalledTimes(1)
      expect(search).toHaveBeenLastCalledWith('')
    })

    it('(c) 清空輸入後才回來的在途舊回應被丟棄', async () => {
      const d = deferred<AuthorSearchItem[]>()
      search.mockReset()
      search.mockReturnValueOnce(d.promise)
      const { getByRole, queryAllByRole } = harness()
      const input = getByRole('combobox') as HTMLInputElement
      await typeInto(input, 'yu')
      await vi.advanceTimersByTimeAsync(300) // 請求在途
      await fireEvent.keyDown(input, { key: 'Escape' })
      await fireEvent.keyDown(input, { key: 'Escape' }) // 清空
      d.resolve([YUAN])
      await flush()
      expect(queryAllByRole('option', { hidden: true })).toHaveLength(0)
    })

    it('輸入框為空時 Backspace 刪除最後一個已選作者', async () => {
      const { getByRole, getAllByRole, value } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      await fireEvent.click(getAllByRole('option')[1])
      await fireEvent.keyDown(input, { key: 'Backspace' })
      expect(value.value).toEqual(['u-yuan'])
    })

    it('輸入框有文字時 Backspace 不刪除已選作者', async () => {
      const { getByRole, getAllByRole, value } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      await fireEvent.click(getAllByRole('option')[0])
      await typeInto(input, 'x')
      await fireEvent.keyDown(input, { key: 'Backspace' })
      expect(value.value).toEqual(['u-yuan'])
    })

    it('Tab 不被攔截（不呼叫 preventDefault），焦點可離開', async () => {
      const { getByRole } = harness()
      const input = getByRole('combobox')
      await fireEvent.focus(input)
      await flush()
      const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    })
  })
})
