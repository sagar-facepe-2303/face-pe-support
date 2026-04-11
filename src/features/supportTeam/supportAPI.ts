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

/**
 * Lists support portal operators when `GET /support-users` is available (array or `{ items }`).
 * Returns [] on 404/405 so the page can still show invite flows.
 */
export async function fetchSupportUsersList(): Promise<SupportUserResponse[]> {
  try {
    const response = await api.get<unknown>('/support-users')
    const data = response.data
    if (Array.isArray(data)) {
      return data.map(normalizeSupportUser)
    }
    if (data && typeof data === 'object' && 'items' in data) {
      const items = (data as { items: unknown }).items
      if (Array.isArray(items)) {
        return items.map(normalizeSupportUser)
      }
    }
    return []
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return []
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
    const response = await api.post<unknown>('/support-users', payload)
    return normalizeSupportUser(response.data)
  } catch (e) {
    throw new Error(getApiErrorMessage(e))
  }
}

/** Fetches a support portal operator by id (used for Profile when no “me” route exists). */
export async function fetchSupportUserById(supportUserId: string): Promise<SupportUserResponse> {
  const response = await api.get<unknown>(`/support-users/${supportUserId}`)
  return normalizeSupportUser(response.data)
}

export async function updateSupportUser(
  supportUserId: string,
  payload: UpdateSupportUserPayload
): Promise<SupportUserResponse> {
  try {
    const response = await api.patch<unknown>(`/support-users/${supportUserId}`, payload)
    return normalizeSupportUser(response.data)
  } catch (e) {
    throw new Error(getApiErrorMessage(e))
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
