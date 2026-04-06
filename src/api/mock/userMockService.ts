import type { UpdateProfileRequest, ChangePasswordRequest, DeleteAccountRequest } from '../../types/user'

export function updateProfileMock(_data: UpdateProfileRequest): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function changePasswordMock(_data: ChangePasswordRequest): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function deleteAccountMock(_data: DeleteAccountRequest): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}
