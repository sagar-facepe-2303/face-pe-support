import api from '../../core/api/axios'
import type { Role } from '../../core/constants/roles'
import type { AuthUser } from './types'

export interface LoginPayload {
  email: string
  password: string
  rememberDevice?: boolean
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
    merchant_id?: string
    merchant_name?: string
  }
  id?: string
  email?: string
  name?: string
  role?: Role
  is_active?: boolean
  merchant_id?: string
  merchant_name?: string
}

function normalizeUser(raw: LoginResponseShape['user'], root?: LoginResponseShape): AuthUser {
  if (!raw) {
    throw new Error('Login response missing user profile')
  }
  const merchantId = raw.merchant_id ?? root?.merchant_id
  const merchantName = raw.merchant_name ?? root?.merchant_name
  return {
    id: raw.id ?? raw.email,
    email: raw.email,
    name: raw.name ?? raw.email.split('@')[0],
    role: raw.role,
    ...(merchantId ? { merchantId } : {}),
    ...(merchantName ? { merchantName } : {}),
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
    user: normalizeUser(userPayload, body),
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

export async function logoutRequest(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return
  await api.post('/auth/logout', {
    refresh_token: refreshToken,
  })
}
