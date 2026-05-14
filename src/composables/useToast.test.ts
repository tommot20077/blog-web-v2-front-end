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

  it('showToast 接受可選 sub 副標題', () => {
    const { toasts, showToast } = useToast();
    showToast('主標題', 'error', 4000, '副標說明');

    expect(toasts.value[0].message).toBe('主標題');
    expect(toasts.value[0].sub).toBe('副標說明');
  });

  it('未提供 sub 時欄位為 undefined', () => {
    const { toasts, showToast } = useToast();
    showToast('只有主標', 'info');

    expect(toasts.value[0].sub).toBeUndefined();
  });
});
