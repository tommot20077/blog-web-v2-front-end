import { searchSearchMock, searchSuggestMock, getSearchHistoryMock, clearSearchHistoryMock } from './searchMockService'

export const searchService = {
  search: searchSearchMock,
  suggest: searchSuggestMock,
  getHistory: getSearchHistoryMock,
  clearHistory: clearSearchHistoryMock,
}
