// 角色定義（使用 as const + union type，禁止 enum）
export const USER_ROLE = {
  USER: 'USER',
  AUTHOR: 'AUTHOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// 角色層級：數值越高權限越大（ADMIN > AUTHOR > USER）
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  AUTHOR: 1,
  ADMIN: 2,
} as const;

/** 判斷 userRole 是否滿足 requiredRole（含層級繼承，ADMIN 滿足所有要求） */
export function hasRequiredRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

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
  identifier: string;
  password: string;
}

// 註冊請求
export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  nickname: string;
}

// 認證 Token 回應
export interface AuthTokens {
  accessToken: string;
  expiresIn?: number;
}

// API 通用回應包裝
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T | null;
}
