import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUnsavedChangesGuard, UNSAVED_CHANGES_MESSAGE } from './useUnsavedChangesGuard'

/**
 * D5（FE-02）：編輯器有未儲存修改時，站內切頁要確認、關閉分頁 / 重新整理要 beforeunload 提示。
 * 用真的 vue-router（memory history）驗證 onBeforeRouteLeave 行為，不 mock 路由。
 */
// happy-dom 沒有實作 window.confirm，與 EditorMetaSidebar.test.ts 一樣以 stubGlobal 提供
function stubConfirm(answer = true) {
  const fn = vi.fn().mockReturnValue(answer)
  vi.stubGlobal('confirm', fn)
  return fn
}

const hasUnsaved = ref(false)

const Guarded = defineComponent({
  setup() {
    useUnsavedChangesGuard(hasUnsaved)
    return () => h('div', 'guarded')
  },
})
const Other = defineComponent({ render: () => h('div', 'other') })

async function setup() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/editor', component: Guarded },
      { path: '/other', component: Other },
    ],
  })
  router.push('/editor')
  await router.isReady()
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await nextTick()
  return { router, wrapper }
}

function fireBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
  window.dispatchEvent(event)
  return event
}

describe('useUnsavedChangesGuard', () => {
  let confirmSpy: ReturnType<typeof stubConfirm>

  beforeEach(() => {
    hasUnsaved.value = false
    confirmSpy = stubConfirm()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('站內切頁', () => {
    it('dirty 且使用者取消：留在原頁', async () => {
      confirmSpy.mockReturnValue(false)
      const { router, wrapper } = await setup()
      hasUnsaved.value = true

      await router.push('/other')

      expect(confirmSpy).toHaveBeenCalledWith(UNSAVED_CHANGES_MESSAGE)
      expect(router.currentRoute.value.path).toBe('/editor')
      wrapper.unmount()
    })

    it('dirty 且使用者確認：離開', async () => {
      confirmSpy.mockReturnValue(true)
      const { router, wrapper } = await setup()
      hasUnsaved.value = true

      await router.push('/other')

      expect(confirmSpy).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.path).toBe('/other')
      wrapper.unmount()
    })

    it('非 dirty：直接離開，不跳確認', async () => {
      const { router, wrapper } = await setup()

      await router.push('/other')

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/other')
      wrapper.unmount()
    })

    it('dirty 後又回到乾淨（例如存檔成功）：再離開不跳確認', async () => {
      const { router, wrapper } = await setup()
      hasUnsaved.value = true
      hasUnsaved.value = false

      await router.push('/other')

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/other')
      wrapper.unmount()
    })
  })

  describe('beforeunload（關閉分頁 / 重新整理）', () => {
    it('非 dirty：不 preventDefault', async () => {
      const { wrapper } = await setup()

      expect(fireBeforeUnload().defaultPrevented).toBe(false)
      wrapper.unmount()
    })

    it('dirty：preventDefault 觸發瀏覽器的離開提示', async () => {
      const { wrapper } = await setup()
      hasUnsaved.value = true
      await nextTick()

      expect(fireBeforeUnload().defaultPrevented).toBe(true)
      wrapper.unmount()
    })

    it('存檔後（回到乾淨）不再提示', async () => {
      const { wrapper } = await setup()
      hasUnsaved.value = true
      await nextTick()
      hasUnsaved.value = false
      await nextTick()

      expect(fireBeforeUnload().defaultPrevented).toBe(false)
      wrapper.unmount()
    })

    it('unmount 後移除監聽，即使仍 dirty 也不提示', async () => {
      const { wrapper } = await setup()
      hasUnsaved.value = true
      await nextTick()
      wrapper.unmount()

      expect(fireBeforeUnload().defaultPrevented).toBe(false)
    })

    it('只在 dirty 時才註冊 beforeunload 監聽', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const { wrapper } = await setup()
      expect(addSpy.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(0)

      hasUnsaved.value = true
      await nextTick()
      expect(addSpy.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(1)

      wrapper.unmount()
      addSpy.mockRestore()
    })
  })
})
