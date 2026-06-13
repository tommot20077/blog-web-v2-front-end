import type { FileUsageType } from './editor'

// ── 用戶操作 requests ──────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  nickname: string;
  bio?: string;
  website?: string;
  socialLinks?: string;
  avatarUrl?: string;
  location?: string;
}

// 對應後端 NotificationPreferencesRequest（5 個必填布林，每次提交完整偏好狀態）
export interface NotificationPreferencesRequest {
  comment: boolean;
  like: boolean;
  review: boolean;
  follow: boolean;
  newsletter: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}

// ── 檔案元資料 ─────────────────────────────────────────────────────────────────

export interface FileMetadata {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  usageType: FileUsageType;
  hasThumbnail: boolean;
  uploaderId: string;
  createdAt: string;
}

export interface FileListParams {
  page?: number;
  size?: number;
  sort?: string;
}
