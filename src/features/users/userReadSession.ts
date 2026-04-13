const STORAGE_KEY = 'facepe.userDirectory.readOtp.v1'

export interface UserReadOtpSessionPayload {
  userId: string
  /** Same string used in `GET /users/{user_phone}` (decoded path segment). */
  userPhone: string
  readOtpToken: string
}

function parseStored(raw: string): UserReadOtpSessionPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const userId = o.userId
    const userPhone = o.userPhone
    const readOtpToken = o.readOtpToken
    if (typeof userId !== 'string' || typeof userPhone !== 'string' || typeof readOtpToken !== 'string') {
      return null
    }
    const phone = userPhone.trim()
    const token = readOtpToken.trim()
    if (!userId || !phone || !token) return null
    return { userId, userPhone: phone, readOtpToken: token }
  } catch {
    return null
  }
}

/** Path / input may be encoded; compare using decoded trimmed phone. */
export function normalizeUserPhoneKey(phone: string): string {
  try {
    return decodeURIComponent(phone).trim()
  } catch {
    return phone.trim()
  }
}

export function saveUserReadOtp(userId: string, userPhone: string, readOtpToken: string): void {
  const phone = normalizeUserPhoneKey(userPhone)
  const token = readOtpToken.trim()
  if (!userId || !phone || !token) return
  try {
    const payload: UserReadOtpSessionPayload = { userId, userPhone: phone, readOtpToken: token }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function getUserReadOtp(userId: string, userPhone: string): string | null {
  const phone = normalizeUserPhoneKey(userPhone)
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = parseStored(raw)
    if (!data || data.userId !== userId || data.userPhone !== phone) return null
    return data.readOtpToken
  } catch {
    return null
  }
}

export function clearUserReadOtp(userId: string, userPhone: string): void {
  const phone = normalizeUserPhoneKey(userPhone)
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = parseStored(raw)
    if (data && data.userId === userId && data.userPhone === phone) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* noop */
  }
}
