import type { AuthUser } from './types'
import { ROLES } from '../../core/constants/roles'

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

/** Mock JWT — not a real token */
function mockToken(email: string): string {
  return `mock.${btoa(email)}.${Date.now()}`
}

/**
 * Mock login — does not perform network I/O.
 */
export async function loginRequest(payload: LoginPayload): Promise<{ user: AuthUser; token: string }> {
  await delay(400)
  if (!payload.email || !payload.password) {
    throw new Error('Email and password are required')
  }
  const user: AuthUser = {
    id: 'usr-admin-1',
    email: payload.email,
    name: 'Admin User',
    role: ROLES.SUPER_ADMIN,
    avatarUrl: undefined,
  }
  return { user, token: mockToken(payload.email) }
}

export async function registerRequest(payload: RegisterPayload): Promise<{ user: AuthUser; token: string }> {
  await delay(500)
  const user: AuthUser = {
    id: 'usr-new-1',
    email: payload.email,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    role: payload.accountType === 'kiosk_operator' ? ROLES.SUPPORT : ROLES.ADMIN,
  }
  return { user, token: mockToken(payload.email) }
}

export async function logoutRequest(): Promise<void> {
  await delay(150)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
