import { mount } from '@vue/test-utils';
import PasswordRulesChecklist from './PasswordRulesChecklist.vue';

describe('PasswordRulesChecklist', () => {
  it('空密碼五條規則皆顯示未滿足 (✗)', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: '' } });

    const rules = wrapper.findAll('[data-testid^="rule-"]');
    expect(rules).toHaveLength(5);
    rules.forEach(r => {
      expect(r.attributes('data-met')).toBe('false');
    });
  });

  it('"abcdefgh" 僅 length 與 lowercase 滿足', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'abcdefgh' } });

    expect(wrapper.find('[data-testid="rule-length"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-lowercase"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-uppercase"]').attributes('data-met')).toBe('false');
    expect(wrapper.find('[data-testid="rule-digit"]').attributes('data-met')).toBe('false');
    expect(wrapper.find('[data-testid="rule-special"]').attributes('data-met')).toBe('false');
  });

  it('"Password123" 缺特殊字元，special 未滿足其餘滿足', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'Password123' } });

    expect(wrapper.find('[data-testid="rule-length"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-lowercase"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-uppercase"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-digit"]').attributes('data-met')).toBe('true');
    expect(wrapper.find('[data-testid="rule-special"]').attributes('data-met')).toBe('false');
  });

  it('"Test123!" 五條規則皆滿足 (✓)', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'Test123!' } });

    const rules = wrapper.findAll('[data-testid^="rule-"]');
    expect(rules).toHaveLength(5);
    rules.forEach(r => {
      expect(r.attributes('data-met')).toBe('true');
    });
  });

  it('顯示五條規則的中文文案', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: '' } });
    const text = wrapper.text();
    expect(text).toContain('長度 8-50');
    expect(text).toContain('小寫');
    expect(text).toContain('大寫');
    expect(text).toContain('數字');
    expect(text).toContain('特殊字元');
  });

  // B2「完成即淡出」：已達成規則須帶有 met class 作為降級樣式的掛鉤
  // （淡出/縮小/刪除線/圓點變色全部靠 CSS `.met` selector 觸發）
  it('B2：已達成規則的 <li> 應帶有 met class', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: 'Test123!' } });
    const rules = wrapper.findAll('[data-testid^="rule-"]');
    expect(rules).toHaveLength(5);
    rules.forEach(r => {
      expect(r.classes()).toContain('met');
    });
  });

  it('B2：未達成規則的 <li> 不應帶有 met class', () => {
    const wrapper = mount(PasswordRulesChecklist, { props: { password: '' } });
    const rules = wrapper.findAll('[data-testid^="rule-"]');
    rules.forEach(r => {
      expect(r.classes()).not.toContain('met');
    });
  });
});
