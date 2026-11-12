import { getHotTagsMock, getAllTagsMock, getTagBySlugMock, followTagMock, unfollowTagMock } from './tagMockService'

export const tagService = {
  getHotTags: getHotTagsMock,
  getAllTags: getAllTagsMock,
  getTagBySlug: getTagBySlugMock,
  followTag: followTagMock,
  unfollowTag: unfollowTagMock,
}
