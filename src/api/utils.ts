import type { PageResult } from '../types/editor'

export interface BackendPageResult<T> {
  list: T[]
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
}

export function mapPageResult<B, F>(
  raw: BackendPageResult<B>,
  mapper: (item: B) => F
): PageResult<F> {
  return {
    records: raw.list.map(mapper),
    total: raw.total,
    current: raw.pageNum,
    size: raw.pageSize,
    pages: raw.totalPage,
  }
}
