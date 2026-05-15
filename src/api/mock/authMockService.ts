import type { LoginPayload, RegisterPayload, AuthTokens, User } from '../../types/auth';
import {
  registeredUsers,
  currentLoggedInUserId,
  refreshTokenValid,
  setCurrentLoggedInUserId,
  setRefreshTokenValid,
  type MockUser,
} from './authMockData';

function generateTokens(): AuthTokens {
  return {
    accessToken: `mock-access-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    expiresIn: 3600,
  };
}

function mockDelay<T>(fn: () => T, delay = 400): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

export function loginMock(payload: LoginPayload): Promise<AuthTokens> {
  return mockDelay(() => {
    const user = registeredUsers.find(
      (u) => (u.email === payload.identifier || u.nickname === payload.identifier) && u.password === payload.password,
    );
    if (!user) {
      throw new Error('帳號或密碼錯誤');
    }
    setCurrentLoggedInUserId(user.uuid);
    setRefreshTokenValid(true);
    return generateTokens();
  });
}

export function registerMock(payload: RegisterPayload): Promise<void> {
  return mockDelay(() => {
    const exists = registeredUsers.some((u) => u.email === payload.email);
    if (exists) {
      throw new Error('此 Email 已被註冊');
    }
    const newUser: MockUser = {
      uuid: `user-uuid-${Date.now()}`,
      email: payload.email,
      password: payload.password,
      nickname: payload.nickname,
      avatarUrl: null,
      role: 'USER',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    registeredUsers.push(newUser);
  });
}

export function refreshTokenMock(): Promise<AuthTokens> {
  return mockDelay(() => {
    if (!refreshTokenValid) {
      throw new Error('Refresh token 無效或已過期');
    }
    return generateTokens();
  });
}

export function logoutMock(): Promise<void> {
  return mockDelay(() => {
    setCurrentLoggedInUserId(null);
    setRefreshTokenValid(false);
  });
}

export function forgotPasswordMock(email: string): Promise<void> {
  return mockDelay(() => {
    console.log(`[Mock] 密碼重設連結已寄送至: ${email}`);
  });
}

export function resetPasswordMock(token: string, password: string): Promise<void> {
  return mockDelay(() => {
    if (token !== 'mock-reset-token') {
      throw new Error('無效的重設密碼 token');
    }
    console.log(`[Mock] 密碼已重設為: ${password}`);
  });
}

export function verifyEmailMock(token: string): Promise<void> {
  return mockDelay(() => {
    if (token !== 'mock-verify-token') {
      throw new Error('無效的信箱驗證 token');
    }
    console.log('[Mock] 信箱已驗證');
  });
}

export function verifyEmailCodeMock(email: string, code: string): Promise<void> {
  return mockDelay(() => {
    const user = registeredUsers.find((u) => u.email === email);
    if (!user || code !== '123456') {
      throw new Error('無效的信箱驗證碼');
    }
    user.emailVerified = true;
  });
}

export function getMeMock(): Promise<User> {
  return mockDelay(() => {
    if (!currentLoggedInUserId) {
      throw new Error('未登入');
    }
    const user = registeredUsers.find((u) => u.uuid === currentLoggedInUserId);
    if (!user) {
      throw new Error('使用者不存在');
    }
    // 回傳 User（不含 password）
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

export function resendVerificationMock(): Promise<void> {
  return mockDelay(() => {
    console.log('[Mock] 驗證信已重新寄送');
  });
}
