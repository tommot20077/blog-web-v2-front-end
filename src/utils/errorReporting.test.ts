import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CanceledError } from 'axios'
import {
  reportError,
  markErrorHandled,
  isErrorHandled,
  isIgnorableError,
  getComponentName,
} from './errorReporting'

describe('errorReporting', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('reportError', () => {
    it('以 console.error 記錄錯誤，並帶上元件名稱與 info', () => {
      const err = new Error('boom')

      reportError(err, { componentName: 'ArticleCard', info: 'render function' })

      expect(errorSpy).toHaveBeenCalledTimes(1)
      const logged = errorSpy.mock.calls[0].map(String).join(' ')
      expect(logged).toContain('ArticleCard')
      expect(logged).toContain('render function')
      expect(errorSpy.mock.calls[0]).toContain(err)
    })

    it('沒有 context 時也能記錄', () => {
      reportError(new Error('x'))

      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('markErrorHandled / isErrorHandled', () => {
    it('標記後 isErrorHandled 為 true，並回傳同一個物件', () => {
      const err = new Error('api failed')
      expect(isErrorHandled(err)).toBe(false)

      const returned = markErrorHandled(err)

      expect(returned).toBe(err)
      expect(isErrorHandled(err)).toBe(true)
    })

    it('非物件值不會拋錯，isErrorHandled 為 false', () => {
      expect(markErrorHandled('string error')).toBe('string error')
      expect(isErrorHandled('string error')).toBe(false)
      expect(isErrorHandled(null)).toBe(false)
      expect(isErrorHandled(undefined)).toBe(false)
    })
  })

  describe('isIgnorableError', () => {
    it('AbortError（DOMException）視為可忽略', () => {
      expect(isIgnorableError(new DOMException('aborted', 'AbortError'))).toBe(true)
    })

    it('name 為 AbortError 的一般 Error 視為可忽略', () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      expect(isIgnorableError(err)).toBe(true)
    })

    it('axios CanceledError（取消請求）視為可忽略', () => {
      expect(isIgnorableError(new CanceledError('canceled'))).toBe(true)
    })

    it('code 為 ERR_CANCELED 的物件視為可忽略', () => {
      expect(isIgnorableError({ code: 'ERR_CANCELED' })).toBe(true)
    })

    it('一般 Error 不可忽略', () => {
      expect(isIgnorableError(new Error('real bug'))).toBe(false)
      expect(isIgnorableError(undefined)).toBe(false)
    })
  })

  describe('getComponentName', () => {
    it('優先使用 $options.name', () => {
      const instance = { $options: { name: 'NamedComp', __name: 'Other' } }
      expect(getComponentName(instance as never)).toBe('NamedComp')
    })

    it('其次使用 SFC 的 __name', () => {
      const instance = { $options: { __name: 'SfcComp' } }
      expect(getComponentName(instance as never)).toBe('SfcComp')
    })

    it('沒有名稱或沒有 instance 時回傳 Anonymous', () => {
      expect(getComponentName({ $options: {} } as never)).toBe('Anonymous')
      expect(getComponentName(null)).toBe('Anonymous')
    })
  })
})
