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

  it('FE-04：常駐兩個 live region（polite、assertive），在任何 toast 出現前就已存在', () => {
    const wrapper = mount(ToastContainer);
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);
    expect(wrapper.find('[aria-live="assertive"]').exists()).toBe(true);
  });

  it('FE-04：error toast 放進 assertive 區域，其他類型放進 polite 區域；不使用 role=alert 以免重複朗讀', () => {
    const { showToast } = useToast();
    showToast('壞了', 'error');
    showToast('好了', 'success');

    const wrapper = mount(ToastContainer);
    const assertive = wrapper.get('[aria-live="assertive"]');
    const polite = wrapper.get('[aria-live="polite"]');
    expect(assertive.text()).toContain('壞了');
    expect(assertive.text()).not.toContain('好了');
    expect(polite.text()).toContain('好了');
    expect(polite.text()).not.toContain('壞了');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
