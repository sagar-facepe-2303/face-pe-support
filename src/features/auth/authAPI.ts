import api from '../../core/api/axios'
import { ROLES } from '../../core/constants/roles'
import type { Role } from '../../core/constants/roles'
import type { AuthUser } from './types'

export interface LoginPayload {
  email: string
  password: string
  rememberDevice?: boolean
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  accountType: 'merchant' | 'kiosk_operator'
}

interface LoginResponseShape {
  access_token: string
  refresh_token: string
  user?: {
    id?: string
    email: string
    name?: string
    role: Role
    is_active?: boolean
  }
  id?: string
  email?: string
  name?: string
  role?: Role
  is_active?: boolean
}

function normalizeUser(raw: LoginResponseShape['user']): AuthUser {
  if (!raw) {
    throw new Error('Login response missing user profile')
  }
  return {
    id: raw.id ?? raw.email,
    email: raw.email,
    name: raw.name ?? raw.email.split('@')[0],
    role: raw.role,
  }
}

export async function loginRequest(payload: LoginPayload): Promise<{
  user: AuthUser
  token: string
  refreshToken: string
}> {
  const response = await api.post<LoginResponseShape>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
  const body = response.data
  const userPayload =
    body.user ??
    (body.email && body.role
      ? {
          id: body.id ?? body.email,
          email: body.email,
          name: body.name,
          role: body.role,
          is_active: body.is_active,
        }
      : undefined)

  return {
    user: normalizeUser(userPayload),
    token: body.access_token,
    refreshToken: body.refresh_token,
  }
}

export async function refreshRequest(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
  const response = await api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  return {
    token: response.data.access_token,
    refreshToken: response.data.refresh_token,
  }
}

/**
 * Backend has no public register endpoint for support portal.
 * This keeps the current Register page usable by calling the bootstrap helper.
 */
export async function registerRequest(payload: RegisterPayload): Promise<{
  user: AuthUser
  token: string
  refreshToken: string
}> {
  await api.post('/support-users/seed-super-admin', {
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    email: payload.email,
    password: payload.password,
  })

  const login = await loginRequest({ email: payload.email, password: payload.password })
  const user: AuthUser = {
    id: login.user.id,
    email: payload.email,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    role: payload.accountType === 'kiosk_operator' ? ROLES.MERCHANT_SUPPORT : ROLES.MERCHANT_ADMIN,
  }
  return { user, token: login.token, refreshToken: login.refreshToken }
}

export async function logoutRequest(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return
  await api.post('/auth/logout', {
    refresh_token: refreshToken,
  })
}
