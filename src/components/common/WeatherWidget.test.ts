import { render } from '@testing-library/vue'
import WeatherWidget from './WeatherWidget.vue'

describe('WeatherWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Loading 狀態 — on mount, shows "讀取中..."', () => {
    const { getByText } = render(WeatherWidget)
    expect(getByText('讀取中...')).toBeInTheDocument()
  })

  it('載入完成 — after fetchWeather resolves, shows temperature and condition', async () => {
    const { getByText } = render(WeatherWidget)

    // 推進 setTimeout 的 1000ms 延遲
    await vi.advanceTimersByTimeAsync(1000)

    expect(getByText('26°C')).toBeInTheDocument()
    expect(getByText('Sunny')).toBeInTheDocument()
  })
})
