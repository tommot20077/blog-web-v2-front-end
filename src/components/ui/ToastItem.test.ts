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

  it('提供 sub 時渲染副標', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ message: '主標', sub: '副標說明' }) },
    });
    expect(wrapper.text()).toContain('副標說明');
  });

  it('未提供 sub 時不渲染副標 span', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ message: '主標' }) },
    });
    expect(wrapper.find('[data-testid="toast-sub"]').exists()).toBe(false);
  });

  it('點擊關閉按鈕觸發 close 事件', async () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast() },
    });
    await wrapper.find('[data-testid="toast-close"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')![0]).toEqual(['toast-1']);
  });

  it('root 套用 .toast 與類型 class（success）', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'success' }) },
    });
    const classes = wrapper.classes();
    expect(classes).toContain('toast');
    expect(classes).toContain('success');
  });

  it('root 套用 .toast 與類型 class（error）', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'error' }) },
    });
    expect(wrapper.classes()).toContain('error');
  });

  it('root 套用 .toast 與類型 class（warning）', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'warning' }) },
    });
    expect(wrapper.classes()).toContain('warning');
  });

  it('root 套用 .toast 與類型 class（info）', () => {
    const wrapper = mount(ToastItem, {
      props: { toast: createToast({ type: 'info' }) },
    });
    expect(wrapper.classes()).toContain('info');
  });

  it('圖示對應類型顯示對應符號', () => {
    const success = mount(ToastItem, { props: { toast: createToast({ type: 'success' }) } });
    expect(success.find('[data-testid="toast-indicator"]').text()).toBe('✓');

    const error = mount(ToastItem, { props: { toast: createToast({ type: 'error' }) } });
    expect(error.find('[data-testid="toast-indicator"]').text()).toBe('!');

    const warning = mount(ToastItem, { props: { toast: createToast({ type: 'warning' }) } });
    expect(warning.find('[data-testid="toast-indicator"]').text()).toBe('!');

    const info = mount(ToastItem, { props: { toast: createToast({ type: 'info' }) } });
    expect(info.find('[data-testid="toast-indicator"]').text()).toBe('i');
  });
});
