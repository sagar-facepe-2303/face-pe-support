import type { MerchantDetail, MerchantKioskRow } from './merchantAPI'

const STORAGE_KEY = 'facepe.merchantDirectory.readSession.v1'

export interface MerchantReadSessionPayload {
  userId: string
  merchantId: string
  /** OTP read token for `X-OTP-Token` when the API requires it; null if the last load did not need one. */
  otpToken: string | null
  result: {
    detail: MerchantDetail
    kiosks: MerchantKioskRow[]
  }
}

export function saveMerchantReadSession(payload: MerchantReadSessionPayload): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadMerchantReadSession(userId: string): MerchantReadSessionPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as MerchantReadSessionPayload
    if (data.userId !== userId) return null
    if (!data.merchantId || !data.result?.detail?.id) return null
    return data
  } catch {
    return null
  }
}

export function clearMerchantReadSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

/** OTP read token for `GET /merchants/{id}` when it matches the directory session merchant. */
export function getMerchantReadOtpForMerchant(
  userId: string,
  merchantId: string,
): string | null {
  const data = loadMerchantReadSession(userId)
  if (!data || data.merchantId !== merchantId) return null
  return data.otpToken
}
