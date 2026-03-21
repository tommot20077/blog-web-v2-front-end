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
});
