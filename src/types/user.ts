import type { FileUsageType } from './editor'

// ── 用戶操作 requests ──────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  nickname: string;
  bio?: string;
  website?: string;
  socialLinks?: string;
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
