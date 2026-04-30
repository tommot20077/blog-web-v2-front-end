import { getHotTagsMock, getTagBySlugMock, followTagMock, unfollowTagMock } from './tagMockService'

export const tagService = {
  getHotTags: getHotTagsMock,
  getTagBySlug: getTagBySlugMock,
  followTag: followTagMock,
  unfollowTag: unfollowTagMock,
}
