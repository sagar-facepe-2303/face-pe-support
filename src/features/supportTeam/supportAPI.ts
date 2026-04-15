import { isAxiosError } from 'axios'
import api from '../../core/api/axios'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import { canCreateSupportUserRole } from '../../core/constants/roles'
import type { Role } from '../../core/constants/roles'

export interface DashboardMetrics {
  totalMerchants: number
  merchantTrend: string
  activeKiosks: number
  offlineKiosks: number
  networkUptime: string
  totalUsers: number
  userTrend: string
  activeUsersLabel: string
  inactiveUsersLabel: string
}

export interface CreateSupportUserPayload {
  name: string
  email: string
  password: string
  role: Role
  /** When false, the account is created then set inactive if the API requires a follow-up PATCH. */
  is_active?: boolean
}

export interface UpdateSupportUserPayload {
  name?: string
  is_active?: boolean
}

export interface SupportUserResponse {
  id: string
  name: string
  email: string
  role: Role
  is_active: boolean
  created_at?: string
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await delay(300)
  return {
    totalMerchants: 2842,
    merchantTrend: '+12.5%',
    activeKiosks: 856,
    offlineKiosks: 3,
    networkUptime: '99.8%',
    totalUsers: 142902,
    userTrend: '+2.4k',
    activeUsersLabel: '82k Active',
    inactiveUsersLabel: '60k Inactive',
  }
}

function normalizeSupportUser(raw: unknown): SupportUserResponse {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    email: String(r.email ?? ''),
    role: r.role as Role,
    is_active: r.is_active !== false && r.is_active !== null,
    created_at: r.created_at != null ? String(r.created_at) : undefined,
  }
}

export interface SupportUsersListParams {
  /** Min 1, max 100 */
  limit?: number
  /** Min 0 */
  offset?: number
  role?: Role
  is_active?: boolean
}

export interface SupportUsersListResult {
  items: SupportUserResponse[]
  total: number
  limit: number
  offset: number
}

function clampLimit(raw: number | undefined): number {
  const n = raw ?? 50
  return Math.min(100, Math.max(1, n))
}

function clampOffset(raw: number | undefined): number {
  return Math.max(0, raw ?? 0)
}

/**
 * Lists support portal operators via `GET /support-users` (paginated `{ items, total, limit, offset }`
 * or legacy array). Returns empty result on 404/405 so invite flows still work when the route is absent.
 */
export async function fetchSupportUsersList(
  params: SupportUsersListParams = {}
): Promise<SupportUsersListResult> {
  const limit = clampLimit(params.limit)
  const offset = clampOffset(params.offset)
  const query: Record<string, string | number | boolean> = { limit, offset }
  if (params.role) query.role = params.role
  if (params.is_active !== undefined) query.is_active = params.is_active

  try {
    const response = await api.get<unknown>('/support-users', { params: query })
    const data = response.data
    if (Array.isArray(data)) {
      const items = data.map(normalizeSupportUser)
      return {
        items,
        total: items.length,
        limit,
        offset,
      }
    }
    if (data && typeof data === 'object' && 'items' in data) {
      const d = data as {
        items: unknown
        total?: unknown
        limit?: unknown
        offset?: unknown
      }
      const rawItems = d.items
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeSupportUser) : []
      return {
        items,
        total: typeof d.total === 'number' ? d.total : items.length,
        limit: typeof d.limit === 'number' ? d.limit : limit,
        offset: typeof d.offset === 'number' ? d.offset : offset,
      }
    }
    return { items: [], total: 0, limit, offset }
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return { items: [], total: 0, limit, offset }
    }
    throw e
  }
}

export async function createSupportUser(
  actorRole: Role | undefined,
  payload: CreateSupportUserPayload
): Promise<SupportUserResponse> {
  if (!canCreateSupportUserRole(actorRole, payload.role)) {
    throw new Error('You are not allowed to create this support role.')
  }
  try {
    const { is_active: desiredActive, ...createBody } = payload
    const response = await api.post<unknown>('/support-users', {
      ...createBody,
      ...(desiredActive !== undefined ? { is_active: desiredActive } : {}),
    })
    let user = normalizeSupportUser(response.data)
    if (
      desiredActive !== undefined &&
      user.is_active !== desiredActive &&
      user.email
    ) {
      user = await updateSupportUser(user.email, { is_active: desiredActive })
    }
    return user
  } catch (e) {
    throw new Error(getApiErrorMessage(e))
  }
}

/** Fetches a support portal operator by id (used for Profile when no “me” route exists). */
export async function fetchSupportUserById(supportUserId: string): Promise<SupportUserResponse> {
  const response = await api.get<unknown>(`/support-users/${supportUserId}`)
  return normalizeSupportUser(response.data)
}

/**
 * `PATCH /support-users/{email}` — path segment is the operator's email (not UUID).
 */
export async function updateSupportUser(
  supportUserEmail: string,
  payload: UpdateSupportUserPayload
): Promise<SupportUserResponse> {
  const seg = encodeURIComponent(supportUserEmail.trim())
  try {
    const response = await api.patch<unknown>(`/support-users/${seg}`, payload)
    return normalizeSupportUser(response.data)
  } catch (e) {
    throw new Error(getApiErrorMessage(e))
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
