import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

describe('useWeather', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 用 wrapper component 觸發 onMounted lifecycle
  const mountWithWeather = async () => {
    const { useWeather } = await import('./useWeather')
    let result: ReturnType<typeof useWeather>

    const Wrapper = defineComponent({
      setup() {
        result = useWeather()
        return {}
      },
      template: '<div></div>',
    })

    const wrapper = mount(Wrapper)
    return { result: result!, wrapper }
  }

  it('初始狀態為載入中', async () => {
    vi.resetModules()
    const { result } = await mountWithWeather()

    expect(result.temperature.value).toBe('--')
    expect(result.condition.value).toBe('載入中')
    expect(result.isLoading.value).toBe(true)
  })

  it('載入完成後回傳天氣資料', async () => {
    vi.resetModules()
    const { result } = await mountWithWeather()

    // 跳過 1000ms setTimeout
    await vi.advanceTimersByTimeAsync(1000)

    expect(result.temperature.value).toBe('26')
    expect(result.condition.value).toBe('Sunny')
    expect(result.isLoading.value).toBe(false)
  })
})
