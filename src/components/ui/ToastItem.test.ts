import { mount } from '@vue/test-utils';
import ToastItem from './ToastItem.vue';
import type { ToastMessage } from '../../composables/useToast';

function createToast(overrides: Partial<ToastMessage> = {}): ToastMessage {
  return {
    id: 'toast-1',
    message: '測試訊息',
    type: 'info',
    duration: 4000,
    ...overrides,
  };
}

describe('ToastItem', () => {
  it('渲染訊息文字', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ message: '操作成功' }) },
    });
    expect(wrapper.text()).toContain('操作成功');
  });

  it('點擊關閉按鈕觸發 close 事件', async () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast() },
    });
    await wrapper.find('[data-testid="toast-close"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')![0]).toEqual(['toast-1']);
  });

  it('success 類型顯示對應樣式', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'success' }) },
    });
    expect(wrapper.find('[data-testid="toast-indicator"]').classes()).toContain('bg-green-500');
  });

  it('error 類型顯示對應樣式', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'error' }) },
    });
    expect(wrapper.find('[data-testid="toast-indicator"]').classes()).toContain('bg-red-500');
  });

  it('warning 類型顯示對應樣式', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'warning' }) },
    });
    expect(wrapper.find('[data-testid="toast-indicator"]').classes()).toContain('bg-yellow-500');
  });

  it('info 類型顯示對應樣式', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'info' }) },
    });
    expect(wrapper.find('[data-testid="toast-indicator"]').classes()).toContain('bg-blue-500');
  });
});
