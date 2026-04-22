import { updateProfileMock, changePasswordMock, deleteAccountMock } from './userMockService'

export const userService = {
  updateProfile: updateProfileMock,
  changePassword: changePasswordMock,
  deleteAccount: deleteAccountMock,
}
