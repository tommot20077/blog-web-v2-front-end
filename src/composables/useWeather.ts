import { ref, onMounted, onScopeDispose } from 'vue';

export function useWeather() {
  const temperature = ref('--');
  const condition = ref('載入中');
  const isLoading = ref(true);

  // unmount / scope 停止後，await 回來不再寫 state
  let disposed = false;
  onScopeDispose(() => { disposed = true; });

  // 模擬呼叫天氣 API (未來可以替換成真實 API 例如 OpenWeatherMap)
  const fetchWeather = async () => {
    isLoading.value = true;
    try {
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (disposed) return;

      // 假資料
      temperature.value = '26';
      condition.value = 'Sunny';
    } catch (error) {
      if (disposed) return;
      console.error('取得天氣失敗', error);
      condition.value = '讀取失敗';
    } finally {
      if (!disposed) isLoading.value = false;
    }
  };

  onMounted(() => {
    fetchWeather();
  });

  return {
    temperature,
    condition,
    isLoading
  };
}
