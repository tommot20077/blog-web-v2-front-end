import { mount } from '@vue/test-utils';
import FormField from './FormField.vue';

describe('FormField', () => {
  it('渲染 label 文字', () => {
    const wrapper = mount(FormField, {
      props: { label: '電子郵件', modelValue: '' },
    });
    expect(wrapper.find('label').text()).toBe('電子郵件');
  });

  it('渲染 input 並帶入正確的 modelValue', () => {
    const wrapper = mount(FormField, {
      props: { label: '帳號', modelValue: 'hello@test.com' },
    });
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('hello@test.com');
  });

  it('當 error prop 有值時顯示錯誤訊息', () => {
    const wrapper = mount(FormField, {
      props: { label: '帳號', modelValue: '', error: '此欄位為必填' },
    });
    const errorEl = wrapper.find('[data-testid="form-field-error"]');
    expect(errorEl.exists()).toBe(true);
    expect(errorEl.text()).toBe('此欄位為必填');
  });

  it('當 error 為 null 時不顯示錯誤訊息', () => {
    const wrapper = mount(FormField, {
      props: { label: '帳號', modelValue: '', error: null },
    });
    expect(wrapper.find('[data-testid="form-field-error"]').exists()).toBe(false);
  });

  it('type 為 password 時顯示密碼切換按鈕', () => {
    const wrapper = mount(FormField, {
      props: { label: '密碼', modelValue: '', type: 'password' },
    });
    expect(wrapper.find('[data-testid="password-toggle"]').exists()).toBe(true);
  });

  it('點擊密碼切換按鈕改變 input type', async () => {
    const wrapper = mount(FormField, {
      props: { label: '密碼', modelValue: '', type: 'password' },
    });
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).type).toBe('password');

    await wrapper.find('[data-testid="password-toggle"]').trigger('click');
    expect((input.element as HTMLInputElement).type).toBe('text');
  });

  it('輸入時觸發 update:modelValue 事件', async () => {
    const wrapper = mount(FormField, {
      props: { label: '帳號', modelValue: '' },
    });
    const input = wrapper.find('input');
    await input.setValue('new-value');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new-value']);
  });
});
