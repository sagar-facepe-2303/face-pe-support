import { WORKSPACE_ROLES, type Role } from '../../core/constants/roles'
import type { AuthUser } from './types'

const STORAGE_KEY = 'facepe.auth.session.v1'

interface PersistedPayload {
  user: AuthUser
  token: string
  refreshToken: string | null
}

function isRole(value: string): value is Role {
  return (WORKSPACE_ROLES as readonly string[]).includes(value)
}

function parseUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const email = o.email
  const role = o.role
  const name = o.name
  if (typeof email !== 'string' || !email.trim()) return null
  if (typeof role !== 'string' || !isRole(role)) return null
  const id = typeof o.id === 'string' && o.id.trim() ? o.id : email
  const out: AuthUser = {
    id,
    email: email.trim(),
    name: typeof name === 'string' && name.trim() ? name : email.split('@')[0] ?? email,
    role,
  }
  if (typeof o.avatarUrl === 'string' && o.avatarUrl) {
    out.avatarUrl = o.avatarUrl
  }
  if (typeof o.merchantId === 'string' && o.merchantId) {
    out.merchantId = o.merchantId
  }
  if (typeof o.merchantName === 'string' && o.merchantName) {
    out.merchantName = o.merchantName
  }
  return out
}

/** Read persisted session (e.g. after full page reload). */
export function loadPersistedAuth(): PersistedPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw?.trim()) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    const token = typeof o.token === 'string' && o.token.trim() ? o.token.trim() : null
    if (!token) return null
    const user = parseUser(o.user)
    if (!user) return null
    const refreshToken =
      typeof o.refreshToken === 'string' && o.refreshToken.trim()
        ? o.refreshToken.trim()
        : null
    return { user, token, refreshToken }
  } catch {
    return null
  }
}

export function savePersistedAuth(payload: PersistedPayload): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedAuth(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
