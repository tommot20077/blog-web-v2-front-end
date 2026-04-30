import type { PageResult } from '../types/editor'

export interface BackendPageResult<T> {
  records: T[]
  current: number
  size: number
  pages: number
  total: number
}

export function mapPageResult<B, F>(
  raw: BackendPageResult<B>,
  mapper: (item: B) => F
): PageResult<F> {
  return {
    records: raw.records.map(mapper),
    total: raw.total,
    current: raw.current,
    size: raw.size,
    pages: raw.pages,
  }
}
