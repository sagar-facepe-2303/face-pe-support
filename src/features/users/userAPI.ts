import api from '../../core/api/axios'

export interface PlatformUserRow {
  id: string
  name: string
  email: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  createdAt: string
  avatarUrl?: string
}

export interface PlatformUserDetail extends PlatformUserRow {
  userCode: string
  phone: string
  lastLogin: string
  totalSpent: number
  spentTrend: string
  failedTransactions: number
  totalTransactions: number
  supportRequestsOpen: number
}

export interface UserTransactionRow {
  reference: string
  merchant: string
  date: string
  amount: number
  status: 'SUCCESS' | 'FAILED'
}

/** Shape from `GET /users/{user_id}` (see `USER_API_GUIDE.md`). */
export interface UserResponse {
  id: string
  user_name?: string | null
  user_email?: string | null
  user_phone?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type OtpPurpose = 'read_user' | 'update_user' | 'delete_user'

export interface SendOtpRequest {
  purpose: OtpPurpose
  target_user_id: string
}

export interface SendOtpResponse {
  session_id: string
  expires_at: string
  delivery_method?: string
  masked_recipient?: string
}

export interface VerifyOtpRequest {
  session_id: string
  code: string
}

export interface VerifyOtpResponse {
  token?: string
  otp_token?: string
  token_type?: string
  expires_at?: string
  target_type?: string
  target_id?: string
}

export interface UpdateUserRequest {
  user_name?: string
  user_email?: string
  user_phone?: string
}

/** `POST /test/seed-user` — create an end-customer record (dev/test helper; Bearer auth). */
export interface SeedCustomerUserRequest {
  user_id: string
  user_name: string
  user_email: string
  user_phone: string
}

export interface SeedCustomerUserResponse {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_phone: string
  created_at: string
  updated_at: string
}

export async function seedCustomerUser(payload: SeedCustomerUserRequest): Promise<SeedCustomerUserResponse> {
  const response = await api.post<SeedCustomerUserResponse>('/test/seed-user', payload)
  return response.data
}

function mapUserStatus(s: string | null | undefined): PlatformUserDetail['status'] {
  const lower = (s ?? '').toLowerCase()
  if (lower.includes('suspend')) return 'SUSPENDED'
  if (lower.includes('pend')) return 'PENDING'
  return 'ACTIVE'
}

export function mapUserResponseToDetail(r: UserResponse): PlatformUserDetail {
  const name = r.user_name?.trim() || '—'
  const email = r.user_email?.trim() || '—'
  const phone = r.user_phone?.trim() || '—'
  const createdAt = r.created_at ?? r.updated_at ?? new Date().toISOString()
  return {
    id: r.id,
    name,
    email,
    status: mapUserStatus(r.status),
    createdAt,
    userCode: `FP-${r.id.replace(/-/g, '').slice(0, 8)}`,
    phone,
    lastLogin: '—',
    totalSpent: 0,
    spentTrend: '—',
    failedTransactions: 0,
    totalTransactions: 0,
    supportRequestsOpen: 0,
  }
}

export async function fetchUsers(): Promise<PlatformUserRow[]> {
  // User list is not wired to `GET /users` in the current contract; grid uses local data.
  await delay(240)
  return [
    {
      id: 'u1',
      name: 'Marcus Holloway',
      email: 'marcus.h@email.com',
      status: 'ACTIVE',
      createdAt: '2023-08-02',
    },
    {
      id: 'u2',
      name: 'Elena Park',
      email: 'elena.park@email.com',
      status: 'PENDING',
      createdAt: '2024-03-11',
    },
    {
      id: 'u3',
      name: 'Devon Miles',
      email: 'devon@email.com',
      status: 'SUSPENDED',
      createdAt: '2022-11-30',
    },
  ]
}

/**
 * `GET /users/{user_id}` — requires `Authorization` and `X-OTP-Token` with `read_user` scope per API guide.
 */
export async function fetchUserProfile(
  userId: string,
  otpToken?: string | null
): Promise<{ user: PlatformUserDetail; transactions: UserTransactionRow[] }> {
  const response = await api.get<UserResponse>(`/users/${userId}`, {
    ...(otpToken ? { headers: { 'X-OTP-Token': otpToken } } : {}),
  })
  const user = mapUserResponseToDetail(response.data)
  return { user, transactions: [] }
}

/** @deprecated Use `fetchUserProfile` */
export async function getUserById(userId: string, otpToken: string): Promise<UserResponse> {
  const response = await api.get<UserResponse>(`/users/${userId}`, {
    headers: { 'X-OTP-Token': otpToken },
  })
  return response.data
}

/** `PUT /users/{user_id}` — OTP scope `update_user`. */
export async function updateUserById(
  userId: string,
  payload: UpdateUserRequest,
  otpToken: string
): Promise<UserResponse> {
  const response = await api.put<UserResponse>(`/users/${userId}`, payload, {
    headers: { 'X-OTP-Token': otpToken },
  })
  return response.data
}

/** `DELETE /users/{user_id}` — OTP scope `delete_user`; API returns 204. */
export async function deleteUserById(userId: string, otpToken: string): Promise<void> {
  await api.delete(`/users/${userId}`, {
    headers: { 'X-OTP-Token': otpToken },
  })
}

export async function sendOtp(payload: SendOtpRequest): Promise<SendOtpResponse> {
  const response = await api.post<SendOtpResponse>('/otp/send', payload)
  return response.data
}

/** `POST /otp/send` with a user `purpose` and `target_user_id`. */
export async function sendUserOtp(purpose: OtpPurpose, targetUserId: string): Promise<SendOtpResponse> {
  return sendOtp({ purpose, target_user_id: targetUserId })
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>('/otp/verify', payload)
  return response.data
}

/** Returns the scoped token for `X-OTP-Token` (accepts `token` or legacy `otp_token`). */
export async function verifyUserOtpAndGetToken(sessionId: string, code: string): Promise<string> {
  const d = await verifyOtp({ session_id: sessionId, code })
  return (d.token ?? d.otp_token ?? '').trim()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
