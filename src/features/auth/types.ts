import type { Role } from '../../core/constants/roles'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl?: string
  /** Portal merchant row UUID; required for merchant_admin–scoped API calls */
  merchantId?: string
  merchantName?: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}
