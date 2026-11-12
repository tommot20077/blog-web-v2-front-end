import type { User, UserRole } from '../../types/auth';

export interface MockUser extends User {
  password: string;
}

const SEED_USERS: MockUser[] = [
  {
    uuid: 'user-uuid-admin',
    email: 'admin@test.com',
    password: 'Password1',
    nickname: 'Admin',
    avatarUrl: null,
    role: 'ADMIN' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    uuid: 'user-uuid-author',
    email: 'author@test.com',
    password: 'Password1',
    nickname: 'Yuan Author',
    avatarUrl: null,
    role: 'AUTHOR' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    uuid: 'user-uuid-reader',
    email: 'reader@test.com',
    password: 'Password1',
    nickname: 'Yuan Reader',
    avatarUrl: null,
    role: 'USER' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    uuid: 'user-uuid-legacy-author',
    email: 'user@test.com',
    password: 'Password1',
    nickname: 'Yuan',
    avatarUrl: null,
    role: 'AUTHOR' as UserRole,
    emailVerified: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

function cloneSeedUsers(): MockUser[] {
  return SEED_USERS.map(user => ({ ...user }));
}

export let registeredUsers: MockUser[] = cloneSeedUsers();
export let currentLoggedInUserId: string | null = null;
export let refreshTokenValid = false;

export function setCurrentLoggedInUserId(userId: string | null): void {
  currentLoggedInUserId = userId;
}

export function setRefreshTokenValid(valid: boolean): void {
  refreshTokenValid = valid;
}

export function resetAuthMockState(): void {
  registeredUsers = cloneSeedUsers();
  currentLoggedInUserId = null;
  refreshTokenValid = false;
}
