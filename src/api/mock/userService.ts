import {
  updateProfileMock,
  updateNotificationsMock,
  changePasswordMock,
  deleteAccountMock,
} from './userMockService'

export const userService = {
  updateProfile: updateProfileMock,
  updateNotifications: updateNotificationsMock,
  changePassword: changePasswordMock,
  deleteAccount: deleteAccountMock,
}
