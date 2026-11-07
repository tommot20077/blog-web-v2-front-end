import { describe, it, expect } from 'vitest'
import {
  ARTICLE_CONCURRENT_UPDATE_CODE,
  getApiErrorCode,
  getFileTooLargeMessage,
  getFriendlyErrorMessage,
  isConcurrentUpdateError,
} from './apiErrors'

describe('getApiErrorCode', () => {
  it('讀取 apiClient 附在 Error 上的 code', () => {
    expect(getApiErrorCode(Object.assign(new Error('x'), { code: 'A0208' }))).toBe('A0208')
  })

  it('讀取 axios 風格 response.data.code（mock 模式的失敗物件）', () => {
    const err = Object.assign(new Error('x'), { response: { status: 409, data: { code: 'A0208' } } })
    expect(getApiErrorCode(err)).toBe('A0208')
  })

  it('非物件或沒有 code 時回傳 undefined', () => {
    expect(getApiErrorCode(null)).toBeUndefined()
    expect(getApiErrorCode('A0208')).toBeUndefined()
    expect(getApiErrorCode(new Error('x'))).toBeUndefined()
  })
})

describe('isConcurrentUpdateError（B2：A0208 文章已被其他人修改）', () => {
  it('錯誤碼常數為 A0208', () => {
    expect(ARTICLE_CONCURRENT_UPDATE_CODE).toBe('A0208')
  })

  it('apiClient 形狀（status 409 + code A0208）為 true', () => {
    expect(isConcurrentUpdateError(Object.assign(new Error('x'), { status: 409, code: 'A0208' }))).toBe(true)
  })

  it('response.data.code 形狀為 true', () => {
    const err = Object.assign(new Error('x'), { response: { status: 409, data: { code: 'A0208' } } })
    expect(isConcurrentUpdateError(err)).toBe(true)
  })

  it('其他錯誤碼（含全域 409 樂觀鎖 OPTIMISTIC_LOCK_CONFLICT）為 false', () => {
    expect(isConcurrentUpdateError(Object.assign(new Error('x'), { status: 409, code: 'A0999' }))).toBe(false)
    expect(isConcurrentUpdateError(Object.assign(new Error('x'), { status: 500, code: 'A0200' }))).toBe(false)
    expect(isConcurrentUpdateError(new Error('網路錯誤'))).toBe(false)
    expect(isConcurrentUpdateError(undefined)).toBe(false)
  })
})

describe('getFriendlyErrorMessage（A6／A6b 上傳相關錯誤碼）', () => {
  it('A0402 FILE_TOO_LARGE（後端回來、拿不到上傳情境）：保留通用文案，說明兩種上限', () => {
    expect(getFriendlyErrorMessage('A0402')).toBe('檔案太大（文章圖片上限 20MB，頭像上限 5MB）')
  })

  it('A0406 INVALID_IMAGE_DIMENSIONS', () => {
    expect(getFriendlyErrorMessage('A0406')).toBe('圖片尺寸過大（總像素需小於 1 億）')
  })

  it('A0407 INVALID_AVATAR_FILE', () => {
    expect(getFriendlyErrorMessage('A0407')).toBe('頭像檔案無效，請重新上傳')
  })

  it('其他錯誤碼或 undefined 回傳 undefined（沿用後端 message）', () => {
    expect(getFriendlyErrorMessage('A0200')).toBeUndefined()
    expect(getFriendlyErrorMessage(undefined)).toBeUndefined()
  })
})

describe('getFileTooLargeMessage（前端預檢：依上傳情境只顯示對應上限）', () => {
  it('內文圖片顯示 20MB', () => {
    expect(getFileTooLargeMessage('ARTICLE_CONTENT')).toBe('檔案太大（文章圖片上限 20MB）')
  })

  it('封面顯示 20MB', () => {
    expect(getFileTooLargeMessage('ARTICLE_COVER')).toBe('檔案太大（文章圖片上限 20MB）')
  })

  it('頭像顯示 5MB', () => {
    expect(getFileTooLargeMessage('AVATAR')).toBe('檔案太大（頭像上限 5MB）')
  })
})
