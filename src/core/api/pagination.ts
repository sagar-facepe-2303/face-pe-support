/**
 * Normalizes list responses whether the backend returns a bare array or a paginated envelope
 * (same idea as audit logs: items + page + page_size + total_items).
 */
export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export function parsePagedResponse<T>(data: unknown, mapItem: (raw: unknown) => T): Paged<T> {
  if (Array.isArray(data)) {
    return {
      items: data.map(mapItem),
      page: 1,
      pageSize: data.length,
      totalItems: data.length,
      totalPages: 1,
    }
  }

  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const rawItems = (o.items ?? o.results ?? o.data) as unknown
    const items = Array.isArray(rawItems) ? rawItems.map(mapItem) : []
    const page = Math.max(1, Number(o.page ?? 1) || 1)
    const pageSize = Math.max(1, Number(o.page_size ?? o.pageSize ?? 20) || 20)
    const totalItems = Math.max(0, Number(o.total_items ?? o.total ?? items.length) || 0)
    const totalPages = Math.max(1, Number(o.total_pages) || Math.ceil(totalItems / pageSize) || 1)
    return { items, page, pageSize, totalItems, totalPages }
  }

  return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }
}
