import {
  loginMock,
  registerMock,
  refreshTokenMock,
  logoutMock,
  forgotPasswordMock,
  resetPasswordMock,
  verifyEmailCodeMock,
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
  verifyEmailCode: verifyEmailCodeMock,
  getMe: getMeMock,
  resendVerification: (_email: string) => resendVerificationMock(),
}
