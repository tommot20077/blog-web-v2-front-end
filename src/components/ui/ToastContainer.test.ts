import { mount } from '@vue/test-utils';
import ToastContainer from './ToastContainer.vue';
import { useToast } from '../../composables/useToast';

describe('ToastContainer', () => {
  beforeEach(() => {
    // 清空 toasts
    const { toasts, removeToast } = useToast();
    toasts.value.forEach(t => removeToast(t.id));
  });

  it('無 toast 時不渲染任何內容', () => {
    const wrapper = mount(ToastContainer);
    expect(wrapper.findAll('[data-testid="toast-indicator"]')).toHaveLength(0);
  });

  it('有 toast 時渲染對應數量的 ToastItem', () => {
    const { showToast } = useToast();
    showToast('訊息1', 'info');
    showToast('訊息2', 'error');

    const wrapper = mount(ToastContainer);
    expect(wrapper.findAll('[data-testid="toast-indicator"]')).toHaveLength(2);
  });

  it('具備 fixed 定位', () => {
    const wrapper = mount(ToastContainer);
    expect(wrapper.classes()).toContain('fixed');
  });

  it('FE-04：容器是常駐的 aria-live 區域（polite），在任何 toast 出現前就存在', () => {
    const wrapper = mount(ToastContainer);
    expect(wrapper.attributes('aria-live')).toBe('polite');
  });

  it('FE-04：error toast 的 role 為 alert，其他類型不是', () => {
    const { showToast } = useToast();
    showToast('壞了', 'error');
    showToast('好了', 'success');

    const wrapper = mount(ToastContainer);
    const alerts = wrapper.findAll('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.text()).toContain('壞了');
  });
});
