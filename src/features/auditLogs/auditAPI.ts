import api from '../../core/api/axios'
import { parsePagedResponse, type Paged } from '../../core/api/pagination'

export interface AuditLogRow {
  id: string
  actor: string
  action: string
  resource: string
  at: string
  severity: 'info' | 'warning' | 'critical'
}

function mapAuditRaw(raw: unknown): AuditLogRow {
  const item = raw as {
    id: string
    actor_name?: string
    actor_role?: string
    action_type: string
    target_entity?: string
    created_at: string
    severity?: 'info' | 'warning' | 'critical'
  }
  return {
    id: item.id,
    actor: item.actor_name ?? item.actor_role ?? 'System',
    action: item.action_type,
    resource: item.target_entity ?? '—',
    at: item.created_at,
    severity: item.severity ?? 'info',
  }
}

/** `GET /audit-logs` — `page` ≥ 1, `page_size` 1–100 per API reference. */
export async function fetchAuditLogsPaged(page: number, pageSize: number): Promise<Paged<AuditLogRow>> {
  const response = await api.get<unknown>('/audit-logs', {
    params: {
      page,
      page_size: Math.min(100, Math.max(1, pageSize)),
    },
  })
  return parsePagedResponse(response.data, mapAuditRaw)
}
