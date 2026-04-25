import { uploadFileMock, getFileMetadataMock, deleteFileMock, getUserFilesMock } from './fileMockService'

export const fileService = {
  uploadFile: uploadFileMock,
  getFileMetadata: getFileMetadataMock,
  deleteFile: deleteFileMock,
  getUserFiles: getUserFilesMock,
}
