import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 清空 toasts（重置模組狀態）
    const { toasts, removeToast } = useToast();
    toasts.value.forEach(t => removeToast(t.id));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showToast 添加 toast 到列表', () => {
    const { toasts, showToast } = useToast();
    showToast('測試訊息', 'info');

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0].message).toBe('測試訊息');
    expect(toasts.value[0].type).toBe('info');
  });

  it('帶 key 的 toast：同 key 只保留一則，新的取代舊的文字並重新計時', () => {
    const { toasts, showToast } = useToast();
    showToast('請 30 秒後再試', 'warning', 4000, undefined, 'rate-limit');
    vi.advanceTimersByTime(3000);
    showToast('請 20 秒後再試', 'warning', 4000, undefined, 'rate-limit');

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0].message).toBe('請 20 秒後再試');

    // 舊的計時器已被取消：距第一次顯示 4 秒時，新的那則仍在
    vi.advanceTimersByTime(2000);
    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(2100);
    expect(toasts.value).toHaveLength(0);
  });

  it('不同 key 或沒有 key 的 toast 互不影響', () => {
    const { toasts, showToast } = useToast();
    showToast('A', 'info', 4000, undefined, 'k1');
    showToast('B', 'info', 4000, undefined, 'k2');
    showToast('C', 'info');
    showToast('D', 'info');

    expect(toasts.value.map(t => t.message)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('removeToast 移除指定 toast', () => {
    const { toasts, showToast, removeToast } = useToast();
    showToast('訊息1', 'info');
    showToast('訊息2', 'error');

    const idToRemove = toasts.value[0].id;
    removeToast(idToRemove);

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0].message).toBe('訊息2');
  });

  it('toast 在指定時間後自動消失', () => {
    const { toasts, showToast } = useToast();
    showToast('會消失的訊息', 'info', 3000);

    expect(toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(3000);

    expect(toasts.value).toHaveLength(0);
  });

  it('預設自動消失時間為 4000ms', () => {
    const { toasts, showToast } = useToast();
    showToast('預設時間', 'success');

    vi.advanceTimersByTime(3999);
    expect(toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(toasts.value).toHaveLength(0);
  });

  it('超過 5 個時自動移除最舊的', () => {
    const { toasts, showToast } = useToast();

    for (let i = 0; i < 6; i++) {
      showToast(`訊息 ${i}`, 'info');
    }

    expect(toasts.value).toHaveLength(5);
    expect(toasts.value[0].message).toBe('訊息 1');
  });

  it('每個 toast 有唯一 id', () => {
    const { toasts, showToast } = useToast();
    showToast('A', 'info');
    showToast('B', 'error');

    const ids = toasts.value.map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('支援 success/error/warning/info 四種類型', () => {
    const { toasts, showToast } = useToast();
    showToast('成功', 'success');
    showToast('錯誤', 'error');
    showToast('警告', 'warning');
    showToast('資訊', 'info');

    expect(toasts.value.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info']);
  });
  it('showToast 可附帶 action（label + onClick）', () => {
    const { toasts, showToast } = useToast();
    const onClick = vi.fn();
    showToast('網站已更新', 'warning', 60000, { label: '重新整理', onClick });

    expect(toasts.value[0].action?.label).toBe('重新整理');
    toasts.value[0].action?.onClick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
