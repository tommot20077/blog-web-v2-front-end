import {
  loginMock,
  registerMock,
  refreshTokenMock,
  logoutMock,
  forgotPasswordMock,
  resetPasswordMock,
  verifyEmailMock,
  getMeMock,
  resendVerificationMock,
} from './authMockService'

export const authService = {
  login: loginMock,
  register: registerMock,
  refresh: refreshTokenMock,
  logout: logoutMock,
  forgotPassword: forgotPasswordMock,
  resetPassword: resetPasswordMock,
  verifyEmail: verifyEmailMock,
  getMe: getMeMock,
  resendVerification: (_email: string) => resendVerificationMock(),
}
