import { useFormValidation } from './useFormValidation';

// 測試用表單型別
interface TestForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

describe('useFormValidation', () => {
  describe('required 規則', () => {
    it('空字串應驗證失敗並回傳預設錯誤訊息', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      const result = validateField('name', '');

      expect(result).toBe(false);
      expect(errors.name).toBe('此欄位為必填');
    });

    it('null 或 undefined 應驗證失敗', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      expect(validateField('name', null)).toBe(false);
      expect(errors.name).toBe('此欄位為必填');

      expect(validateField('name', undefined)).toBe(false);
      expect(errors.name).toBe('此欄位為必填');
    });

    it('非空字串應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      const result = validateField('name', 'Yuan');

      expect(result).toBe(true);
      expect(errors.name).toBeNull();
    });
  });

  describe('email 規則', () => {
    it('無效 email 格式應驗證失敗', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        email: [{ type: 'email' }],
      });

      expect(validateField('email', 'not-an-email')).toBe(false);
      expect(errors.email).toBe('請輸入有效的 Email');

      expect(validateField('email', 'missing@')).toBe(false);
      expect(errors.email).toBe('請輸入有效的 Email');

      expect(validateField('email', '@nodomain')).toBe(false);
      expect(errors.email).toBe('請輸入有效的 Email');
    });

    it('有效 email 格式應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        email: [{ type: 'email' }],
      });

      const result = validateField('email', 'yuan@example.com');

      expect(result).toBe(true);
      expect(errors.email).toBeNull();
    });
  });

  describe('minLength 規則', () => {
    it('字串長度小於 min 應驗證失敗', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        password: [{ type: 'minLength', params: { min: 8 } }],
      });

      const result = validateField('password', 'short');

      expect(result).toBe(false);
      expect(errors.password).toBe('最少需要 8 個字元');
    });

    it('字串長度等於 min 應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        password: [{ type: 'minLength', params: { min: 8 } }],
      });

      const result = validateField('password', 'exactly8');

      expect(result).toBe(true);
      expect(errors.password).toBeNull();
    });

    it('字串長度大於 min 應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        password: [{ type: 'minLength', params: { min: 8 } }],
      });

      const result = validateField('password', 'longer-than-eight');

      expect(result).toBe(true);
      expect(errors.password).toBeNull();
    });
  });

  describe('matchField 規則', () => {
    it('兩個欄位值不同應驗證失敗', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        confirmPassword: [{ type: 'matchField', params: { field: 'password' } }],
      });

      const formData: TestForm = {
        name: '',
        email: '',
        password: 'abc123',
        confirmPassword: 'different',
      };

      const result = validateField('confirmPassword', 'different', formData);

      expect(result).toBe(false);
      expect(errors.confirmPassword).toBe('兩次輸入不一致');
    });

    it('兩個欄位值相同應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        confirmPassword: [{ type: 'matchField', params: { field: 'password' } }],
      });

      const formData: TestForm = {
        name: '',
        email: '',
        password: 'abc123',
        confirmPassword: 'abc123',
      };

      const result = validateField('confirmPassword', 'abc123', formData);

      expect(result).toBe(true);
      expect(errors.confirmPassword).toBeNull();
    });
  });

  describe('custom 規則', () => {
    it('自訂 validator 回傳 false 應驗證失敗並顯示自訂訊息', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [
          {
            type: 'custom',
            message: '名稱不可包含特殊字元',
            validator: (value: unknown) => /^[a-zA-Z0-9]+$/.test(String(value)),
          },
        ],
      });

      const result = validateField('name', 'bad@name!');

      expect(result).toBe(false);
      expect(errors.name).toBe('名稱不可包含特殊字元');
    });

    it('自訂 validator 回傳 true 應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [
          {
            type: 'custom',
            message: '名稱不可包含特殊字元',
            validator: (value: unknown) => /^[a-zA-Z0-9]+$/.test(String(value)),
          },
        ],
      });

      const result = validateField('name', 'GoodName123');

      expect(result).toBe(true);
      expect(errors.name).toBeNull();
    });
  });

  describe('自訂錯誤訊息覆蓋', () => {
    it('規則提供 message 時應覆蓋預設訊息', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required', message: '請輸入您的姓名' }],
      });

      validateField('name', '');

      expect(errors.name).toBe('請輸入您的姓名');
    });
  });

  describe('多規則同欄位', () => {
    it('多規則失敗時只回傳第一個錯誤', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        email: [
          { type: 'required' },
          { type: 'email' },
        ],
      });

      const result = validateField('email', '');

      expect(result).toBe(false);
      expect(errors.email).toBe('此欄位為必填');
    });
  });

  describe('validateForm', () => {
    it('所有欄位都通過驗證時回傳 true', () => {
      const { validateForm, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
        email: [{ type: 'required' }, { type: 'email' }],
      });

      const formData: TestForm = {
        name: 'Yuan',
        email: 'yuan@example.com',
        password: '',
        confirmPassword: '',
      };

      const result = validateForm(formData);

      expect(result).toBe(true);
      expect(errors.name).toBeNull();
      expect(errors.email).toBeNull();
    });

    it('任一欄位失敗時回傳 false 並設定對應錯誤', () => {
      const { validateForm, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
        email: [{ type: 'required' }, { type: 'email' }],
      });

      const formData: TestForm = {
        name: '',
        email: 'invalid',
        password: '',
        confirmPassword: '',
      };

      const result = validateForm(formData);

      expect(result).toBe(false);
      expect(errors.name).toBe('此欄位為必填');
      expect(errors.email).toBe('請輸入有效的 Email');
    });
  });

  describe('clearErrors', () => {
    it('呼叫後所有 errors 重設為 null', () => {
      const { validateField, clearErrors, errors } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
        email: [{ type: 'email' }],
      });

      validateField('name', '');
      validateField('email', 'bad');

      expect(errors.name).toBe('此欄位為必填');
      expect(errors.email).toBe('請輸入有效的 Email');

      clearErrors();

      expect(errors.name).toBeNull();
      expect(errors.email).toBeNull();
    });
  });

  describe('isValid', () => {
    it('未執行任何驗證時 isValid 為 false', () => {
      const { isValid } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      expect(isValid.value).toBe(false);
    });

    it('驗證全部通過後 isValid 為 true', () => {
      const { validateForm, isValid } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
        email: [{ type: 'email' }],
      });

      validateForm({
        name: 'Yuan',
        email: 'yuan@example.com',
        password: '',
        confirmPassword: '',
      });

      expect(isValid.value).toBe(true);
    });

    it('驗證失敗後 isValid 為 false', () => {
      const { validateField, isValid } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      validateField('name', '');

      expect(isValid.value).toBe(false);
    });

    it('clearErrors 後 isValid 回到 false（因為尚未重新驗證）', () => {
      const { validateForm, clearErrors, isValid } = useFormValidation<TestForm>({
        name: [{ type: 'required' }],
      });

      validateForm({
        name: 'Yuan',
        email: '',
        password: '',
        confirmPassword: '',
      });
      expect(isValid.value).toBe(true);

      clearErrors();
      expect(isValid.value).toBe(false);
    });
  });

  describe('getPasswordStrength', () => {
    it('純數字回傳 weak', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('123456')).toBe('weak');
    });

    it('純小寫字母回傳 weak', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('abcdef')).toBe('weak');
    });

    it('字母加數字回傳 medium', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('abc123')).toBe('medium');
    });

    it('大寫字母加數字回傳 medium', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('ABC123')).toBe('medium');
    });

    it('大小寫字母加數字且長度 >= 8 回傳 strong', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('Abc12345')).toBe('strong');
    });

    it('大小寫字母加數字但長度 < 8 回傳 medium', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('Abc123')).toBe('medium');
    });

    it('空字串回傳 weak', () => {
      const { getPasswordStrength } = useFormValidation<TestForm>({});

      expect(getPasswordStrength('')).toBe('weak');
    });
  });

  describe('pattern 規則（4 類字元 + 長度 8-50）', () => {
    const POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,50}$/;
    const MSG = '密碼須為 8-50 字元，且須包含大小寫英文字母、數字與特殊字元（@$!%*?&#）';

    it('四類字元齊全且長度足夠應驗證通過', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        password: [{ type: 'pattern', params: { pattern: POLICY }, message: MSG }],
      });

      expect(validateField('password', 'Test123!')).toBe(true);
      expect(errors.password).toBeNull();
    });

    it('缺特殊字元應驗證失敗並回傳自訂訊息', () => {
      const { validateField, errors } = useFormValidation<TestForm>({
        password: [{ type: 'pattern', params: { pattern: POLICY }, message: MSG }],
      });

      expect(validateField('password', 'Password123')).toBe(false);
      expect(errors.password).toBe(MSG);
    });

    it('缺大寫 / 缺小寫 / 缺數字 / 長度不足皆應失敗', () => {
      const { validateField } = useFormValidation<TestForm>({
        password: [{ type: 'pattern', params: { pattern: POLICY }, message: MSG }],
      });

      expect(validateField('password', 'password1!')).toBe(false); // 缺大寫
      expect(validateField('password', 'PASSWORD1!')).toBe(false); // 缺小寫
      expect(validateField('password', 'Password!!')).toBe(false); // 缺數字
      expect(validateField('password', 'Te1!')).toBe(false); // 長度不足
    });

    it('未指定 pattern 應視為通過', () => {
      const { validateField } = useFormValidation<TestForm>({
        password: [{ type: 'pattern' }],
      });
      expect(validateField('password', 'anything')).toBe(true);
    });
  });

  describe('getPasswordRules helper（5 條規則）', () => {
    it('空字串五條規則皆 false', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('')).toEqual({
        length: false,
        lowercase: false,
        uppercase: false,
        digit: false,
        special: false,
      });
    });

    it('"abcdefgh"：length+lowercase true，其餘 false', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('abcdefgh')).toEqual({
        length: true,
        lowercase: true,
        uppercase: false,
        digit: false,
        special: false,
      });
    });

    it('"Test123!" 五條規則皆 true', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('Test123!')).toEqual({
        length: true,
        lowercase: true,
        uppercase: true,
        digit: true,
        special: true,
      });
    });

    it('"Password123"：缺特殊字元，special false 其餘 true', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('Password123')).toEqual({
        length: true,
        lowercase: true,
        uppercase: true,
        digit: true,
        special: false,
      });
    });

    it('"Te1!" 長度不足，length false 但四類字元齊全', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('Te1!')).toEqual({
        length: false,
        lowercase: true,
        uppercase: true,
        digit: true,
        special: true,
      });
    });

    it('長度邊界：50 字元合法、51 字元 length false', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      const len50 = 'Aa1!' + 'a'.repeat(46); // 50 字元
      const len51 = 'Aa1!' + 'a'.repeat(47); // 51 字元
      expect(len50).toHaveLength(50);
      expect(len51).toHaveLength(51);
      expect(getPasswordRules(len50).length).toBe(true);
      expect(getPasswordRules(len51).length).toBe(false);
    });

    it('特殊字元集合僅限 @$!%*?&#（其他符號不算 special）', () => {
      const { getPasswordRules } = useFormValidation<TestForm>({});
      expect(getPasswordRules('Test123#').special).toBe(true);
      expect(getPasswordRules('Test123^').special).toBe(false); // ^ 不在集合
    });
  });
});
