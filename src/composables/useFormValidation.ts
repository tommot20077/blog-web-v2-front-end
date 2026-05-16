import { reactive, computed, ref } from 'vue';

// 驗證規則類型（使用 as const object 取代 enum）
const VALIDATION_RULE_TYPE = {
  REQUIRED: 'required',
  EMAIL: 'email',
  MIN_LENGTH: 'minLength',
  MATCH_FIELD: 'matchField',
  CUSTOM: 'custom',
  PATTERN: 'pattern',
} as const;

type ValidationRuleType = (typeof VALIDATION_RULE_TYPE)[keyof typeof VALIDATION_RULE_TYPE];

// 密碼強度等級
const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
} as const;

type PasswordStrength = (typeof PASSWORD_STRENGTH)[keyof typeof PASSWORD_STRENGTH];

export type PasswordRules = {
  length: boolean;
  letter: boolean;
  digit: boolean;
};

interface ValidationRule {
  type: ValidationRuleType;
  message?: string;
  params?: Record<string, unknown>;
  validator?: (value: unknown) => boolean;
}

// 預設錯誤訊息
const DEFAULT_MESSAGES: Record<string, string> = {
  required: '此欄位為必填',
  email: '請輸入有效的 Email',
  minLength: '最少需要 {min} 個字元',
  matchField: '兩次輸入不一致',
  custom: '驗證失敗',
  pattern: '格式不正確',
};

/**
 * 通用表單驗證 composable
 *
 * @param rules - 欄位驗證規則定義
 * @returns errors（響應式錯誤物件）、isValid、validateField、validateForm、clearErrors、getPasswordStrength
 */
export function useFormValidation<T extends object>(
  rules: Partial<Record<keyof T, ValidationRule[]>>,
) {
  // 初始化 errors 物件，每個有規則的欄位初始值為 null
  const errorEntries = Object.keys(rules).map(key => [key, null]);
  const errors = reactive(Object.fromEntries(errorEntries)) as Record<keyof T, string | null>;

  // 追蹤是否已執行過至少一次驗證
  const hasValidated = ref(false);

  // isValid：所有 errors 為 null 且至少驗證過一次
  const isValid = computed(() => {
    if (!hasValidated.value) return false;

    const keys = Object.keys(rules) as Array<keyof T>;
    return keys.every(key => errors[key] === null);
  });

  /**
   * 驗證單一欄位
   */
  const validateField = (field: keyof T, value: unknown, formData?: T): boolean => {
    hasValidated.value = true;

    const fieldRules = rules[field];
    if (!fieldRules) {
      errors[field] = null;
      return true;
    }

    for (const rule of fieldRules) {
      const valid = runRule(rule, value, formData);
      if (!valid) {
        errors[field] = getErrorMessage(rule);
        return false;
      }
    }

    errors[field] = null;
    return true;
  };

  /**
   * 驗證整個表單
   */
  const validateForm = (formData: T): boolean => {
    let allValid = true;

    for (const field of Object.keys(rules) as Array<keyof T>) {
      const fieldValid = validateField(field, formData[field], formData);
      if (!fieldValid) {
        allValid = false;
      }
    }

    return allValid;
  };

  /**
   * 清除所有錯誤
   */
  const clearErrors = () => {
    hasValidated.value = false;
    for (const key of Object.keys(rules)) {
      (errors as Record<string, string | null>)[key] = null;
    }
  };

  /**
   * 計算密碼強度
   */
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return PASSWORD_STRENGTH.WEAK;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const isLongEnough = password.length >= 8;

    // strong: 大小寫 + 數字 + 長度 >= 8
    if (hasUppercase && hasLowercase && hasNumbers && isLongEnough) {
      return PASSWORD_STRENGTH.STRONG;
    }

    // medium: 有字母 + 有數字
    if ((hasUppercase || hasLowercase) && hasNumbers) {
      return PASSWORD_STRENGTH.MEDIUM;
    }

    // weak: 其他情況（純數字、純小寫等）
    return PASSWORD_STRENGTH.WEAK;
  };

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    getPasswordStrength,
    getPasswordRules,
  };
}

/**
 * 取得密碼是否符合三條規則：長度 8-50、含英文字母、含數字
 *
 * <p>純函式不依賴 reactive state，可獨立 import 不需建空的 useFormValidation。</p>
 */
export function getPasswordRules(password: string): PasswordRules {
  return {
    length: password.length >= 8 && password.length <= 50,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
  };
}

/**
 * 執行單一規則驗證
 */
function runRule<T extends object>(
  rule: ValidationRule,
  value: unknown,
  formData?: T,
): boolean {
  switch (rule.type) {
    case 'required':
      return value !== null && value !== undefined && String(value).trim() !== '';

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

    case 'minLength': {
      const min = Number(rule.params?.min ?? 0);
      return String(value).length >= min;
    }

    case 'matchField': {
      if (!formData || !rule.params?.field) return false;
      const targetField = rule.params.field as string;
      return value === (formData as Record<string, unknown>)[targetField];
    }

    case 'pattern': {
      const pattern = rule.params?.pattern;
      if (!pattern) return true;
      const regex = pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
      return regex.test(String(value));
    }

    case 'custom':
      return rule.validator ? rule.validator(value) : true;

    default:
      return true;
  }
}

/**
 * 取得錯誤訊息（支援自訂覆蓋與參數替換）
 */
function getErrorMessage(rule: ValidationRule): string {
  const message = rule.message ?? DEFAULT_MESSAGES[rule.type] ?? '驗證失敗';

  // 替換參數佔位符，例如 {min}
  if (rule.params) {
    return Object.entries(rule.params).reduce(
      (msg, [key, val]) => msg.replace(`{${key}}`, String(val)),
      message,
    );
  }

  return message;
}

export { VALIDATION_RULE_TYPE, PASSWORD_STRENGTH };
export type { ValidationRule, ValidationRuleType, PasswordStrength };
