import type { User, UserRole } from '../../types/auth';

export interface MockUser extends User {
  password: string;
}

const SEED_USERS: MockUser[] = [
  {
    uuid: 'user-uuid-1',
    email: 'admin@test.com',
    password: 'Password1',
    nickname: 'Admin',
    avatarUrl: null,
    role: 'ADMIN' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    uuid: 'user-uuid-2',
    email: 'user@test.com',
    password: 'Password1',
    nickname: 'Yuan',
    avatarUrl: null,
    role: 'AUTHOR' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

export let registeredUsers: MockUser[] = [...SEED_USERS];
export let currentLoggedInUserId: string | null = null;
export let refreshTokenValid = false;

export function setCurrentLoggedInUserId(userId: string | null): void {
  currentLoggedInUserId = userId;
}

export function setRefreshTokenValid(valid: boolean): void {
  refreshTokenValid = valid;
}

export function resetAuthMockState(): void {
  registeredUsers = [...SEED_USERS];
  currentLoggedInUserId = null;
  refreshTokenValid = false;
}
