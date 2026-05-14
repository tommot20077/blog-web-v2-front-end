import { mount } from '@vue/test-utils';
import PasswordRulesChecklist from './PasswordRulesChecklist.vue';

describe('PasswordRulesChecklist', () => {
  it('空密碼三條規則皆顯示未滿足 (✗)', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: '' } });

    const rules = wrapper.findAll('[data-testid^="rule-"]');
    expect(rules).toHaveLength(3);
    rules.forEach(r => {
      expect(r.attributes('data-met')).toBe('false');
    });
  });

  it('"abcdefgh" 顯示 length ✓、letter ✓、digit ✗', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'abcdefgh' } });

    expect(wrapper.find('[data-testid="rule-length"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-letter"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-digit"]').attributes('data-met')).toBe('false');
  });

  it('"Test1234" 三條規則皆滿足 (✓)', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'Test1234' } });

    const rules = wrapper.findAll('[data-testid^="rule-"]');
    rules.forEach(r => {
      expect(r.attributes('data-met')).toBe('true');
    });
  });

  it('顯示三條規則的中文文案', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: '' } });
    const text = wrapper.text();
    expect(text).toContain('長度');
    expect(text).toContain('包含英文字母');
    expect(text).toContain('包含數字');
  });
});
