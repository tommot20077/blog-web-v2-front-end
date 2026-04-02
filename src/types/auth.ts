// 角色定義（使用 as const + union type，禁止 enum）
export const USER_ROLE = {
  USER: 'USER',
  AUTHOR: 'AUTHOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// 使用者資料
export interface User {
  uuid: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

// 登入請求
export interface LoginPayload {
  email: string;
  password: string;
}

// 註冊請求
export interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
}

// 認證 Token 回應
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

// API 通用回應包裝
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}
