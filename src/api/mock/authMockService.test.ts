import { resetAuthMockState } from './authMockData';
import {
  loginMock,
  registerMock,
  refreshTokenMock,
  logoutMock,
  forgotPasswordMock,
  resetPasswordMock,
  verifyEmailMock,
  getMeMock,
  resendVerificationMock,
} from './authMockService';

describe('authMockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAuthMockState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- loginMock ---
  describe('loginMock', () => {
    it('正確帳密登入 → 回傳 AuthTokens', async () => {
      const promise = loginMock({ identifier: 'admin@test.com', password: 'Password1' });
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.expiresIn).toBe('number');
    });

    it('錯誤密碼登入 → 拋出錯誤', async () => {
      const promise = loginMock({ identifier: 'admin@test.com', password: 'WrongPass' });
      const assertion = expect(promise).rejects.toThrow('帳號或密碼錯誤');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });

    it('不存在的 email 登入 → 拋出錯誤', async () => {
      const promise = loginMock({ identifier: 'unknown@test.com', password: 'Password1' });
      const assertion = expect(promise).rejects.toThrow('帳號或密碼錯誤');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });

    it('以 nickname 作為 identifier 登入 → 回傳 AuthTokens', async () => {
      const promise = loginMock({ identifier: 'Yuan', password: 'Password1' });
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result.accessToken).toBeTruthy();
      expect(result.expiresIn).toBeGreaterThan(0);
    });
  });

  // --- registerMock ---
  describe('registerMock', () => {
    it('註冊新帳號 → resolve void', async () => {
      const promise = registerMock({
        email: 'new@test.com',
        password: 'Password1',
        username: 'new_user',
        nickname: 'NewUser',
      });
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toBeUndefined();
    });

    it('註冊重複 email → 拋出錯誤', async () => {
      const promise = registerMock({
        email: 'admin@test.com',
        password: 'Password1',
        nickname: 'Dup',
      });
      const assertion = expect(promise).rejects.toThrow('此 Email 已被註冊');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });
  });

  // --- refreshTokenMock ---
  describe('refreshTokenMock', () => {
    it('登入後 refresh → 回傳新 AuthTokens', async () => {
      const loginPromise = loginMock({ identifier: 'admin@test.com', password: 'Password1' });
      await vi.advanceTimersByTimeAsync(500);
      await loginPromise;

      const refreshPromise = refreshTokenMock();
      await vi.advanceTimersByTimeAsync(500);
      const result = await refreshPromise;

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
      expect(result).toHaveProperty('expiresIn');
    });

    it('未登入直接 refresh → 拋出錯誤', async () => {
      const promise = refreshTokenMock();
      const assertion = expect(promise).rejects.toThrow('Refresh token 無效或已過期');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });
  });

  // --- logoutMock ---
  describe('logoutMock', () => {
    it('登入後登出 → refreshToken 失效、getMe 拋出錯誤', async () => {
      const loginPromise = loginMock({ identifier: 'admin@test.com', password: 'Password1' });
      await vi.advanceTimersByTimeAsync(500);
      await loginPromise;

      const logoutPromise = logoutMock();
      await vi.advanceTimersByTimeAsync(500);
      await logoutPromise;

      // refreshToken 應失效
      const refreshPromise = refreshTokenMock();
      const refreshAssertion = expect(refreshPromise).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(500);
      await refreshAssertion;

      // getMe 應失敗
      const getMePromise = getMeMock();
      const getMeAssertion = expect(getMePromise).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(500);
      await getMeAssertion;
    });
  });

  // --- forgotPasswordMock ---
  describe('forgotPasswordMock', () => {
    it('任意 email 呼叫 → 成功不拋錯', async () => {
      const promise = forgotPasswordMock('any@test.com');
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.not.toThrow();
    });
  });

  // --- resetPasswordMock ---
  describe('resetPasswordMock', () => {
    it("token='mock-reset-token' → 成功", async () => {
      const promise = resetPasswordMock('mock-reset-token', 'NewPassword1');
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.not.toThrow();
    });

    it('錯誤 token → 拋出錯誤', async () => {
      const promise = resetPasswordMock('wrong-token', 'NewPassword1');
      const assertion = expect(promise).rejects.toThrow('無效的重設密碼 token');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });
  });

  // --- verifyEmailMock ---
  describe('verifyEmailMock', () => {
    it("token='mock-verify-token' → 成功", async () => {
      const promise = verifyEmailMock('mock-verify-token');
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.not.toThrow();
    });

    it('錯誤 token → 拋出錯誤', async () => {
      const promise = verifyEmailMock('wrong-token');
      const assertion = expect(promise).rejects.toThrow('無效的信箱驗證 token');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });
  });

  // --- getMeMock ---
  describe('getMeMock', () => {
    it('已登入 → 回傳 User 物件', async () => {
      const loginPromise = loginMock({ identifier: 'user@test.com', password: 'Password1' });
      await vi.advanceTimersByTimeAsync(500);
      await loginPromise;

      const getMePromise = getMeMock();
      await vi.advanceTimersByTimeAsync(500);
      const user = await getMePromise;

      expect(user).toHaveProperty('uuid');
      expect(user.email).toBe('user@test.com');
      expect(user.nickname).toBe('Yuan');
      expect(user.role).toBe('AUTHOR');
      expect(user).toHaveProperty('avatarUrl');
      expect(user).toHaveProperty('emailVerified');
      expect(user).toHaveProperty('createdAt');
    });

    it('未登入 → 拋出錯誤', async () => {
      const promise = getMeMock();
      const assertion = expect(promise).rejects.toThrow('未登入');
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    });
  });

  // --- resendVerificationMock ---
  describe('resendVerificationMock', () => {
    it('呼叫 → 成功不拋錯', async () => {
      const promise = resendVerificationMock();
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.not.toThrow();
    });
  });
});
