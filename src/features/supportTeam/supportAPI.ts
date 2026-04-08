import api from '../../core/api/axios'
import { ROLES } from '../../core/constants/roles'
import { canCreateSupportUserRole } from '../../core/constants/roles'
import type { Role } from '../../core/constants/roles'

export interface SupportAgent {
  id: string
  name: string
  email: string
  roleLabel: Role
  status: 'online' | 'offline'
  activity: string
  assignedTasks: { done: number; total: number }
}

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

export async function fetchSupportAgents(): Promise<SupportAgent[]> {
  // No dedicated list endpoint is documented for support users.
  // Keep UI roster populated with stable demo values until backend exposes a list route.
  await delay(180)
  return [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 's.chen@facepe.com',
      roleLabel: ROLES.SUPER_ADMIN,
      status: 'online',
      activity: 'Active now · reviewing queue',
      assignedTasks: { done: 12, total: 14 },
    },
    {
      id: '2',
      name: 'Marcus Lee',
      email: 'm.lee@facepe.com',
      roleLabel: ROLES.MERCHANT_ADMIN,
      status: 'online',
      activity: '2 min ago · kiosk sync',
      assignedTasks: { done: 18, total: 25 },
    },
    {
      id: '3',
      name: 'Priya Nair',
      email: 'p.nair@facepe.com',
      roleLabel: ROLES.USER_ADMIN,
      status: 'offline',
      activity: '1 hour ago · off duty',
      assignedTasks: { done: 6, total: 10 },
    },
    {
      id: '4',
      name: 'Jordan Blake',
      email: 'j.blake@facepe.com',
      roleLabel: ROLES.USER_SUPPORT,
      status: 'online',
      activity: 'Active now · onboarding',
      assignedTasks: { done: 4, total: 8 },
    },
  ]
}

export async function createSupportUser(
  actorRole: Role | undefined,
  payload: CreateSupportUserPayload
): Promise<SupportUserResponse> {
  if (!canCreateSupportUserRole(actorRole, payload.role)) {
    throw new Error('You are not allowed to create this support role.')
  }
  const response = await api.post<SupportUserResponse>('/support-users', payload)
  return response.data
}

export async function updateSupportUser(
  supportUserId: string,
  payload: UpdateSupportUserPayload
): Promise<SupportUserResponse> {
  const response = await api.patch<SupportUserResponse>(`/support-users/${supportUserId}`, payload)
  return response.data
}

export async function seedSuperAdmin(payload: {
  name: string
  email: string
  password: string
}): Promise<{ message: string; user: SupportUserResponse }> {
  const response = await api.post<{ message: string; user: SupportUserResponse }>(
    '/support-users/seed-super-admin',
    payload
  )
  return response.data
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
