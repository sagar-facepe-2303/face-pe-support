import api from '../../core/api/axios'

export interface AuditLogRow {
  id: string
  actor: string
  action: string
  resource: string
  at: string
  severity: 'info' | 'warning' | 'critical'
}

export interface PaginatedAuditLogResponse {
  items: Array<{
    id: string
    actor_name?: string
    actor_role?: string
    action_type: string
    target_entity?: string
    created_at: string
    severity?: 'info' | 'warning' | 'critical'
  }>
  page: number
  page_size: number
  total_pages: number
  total_items: number
}

export async function fetchAuditLogs(page = 1, pageSize = 20): Promise<AuditLogRow[]> {
  const response = await api.get<PaginatedAuditLogResponse>('/audit-logs', {
    params: {
      page,
      page_size: pageSize,
    },
  })
  return response.data.items.map((item) => ({
    id: item.id,
    actor: item.actor_name ?? item.actor_role ?? 'System',
    action: item.action_type,
    resource: item.target_entity ?? '—',
    at: item.created_at,
    severity: item.severity ?? 'info',
  }))
}
