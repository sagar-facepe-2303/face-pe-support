import type { MerchantDetail, MerchantKioskRow } from './merchantAPI'

const STORAGE_KEY = 'facepe.merchantDirectory.readSession.v2'

export interface MerchantReadSessionPayload {
  userId: string
  /** Merchant email used in `/merchants/{email}` and OTP `target_merchant_email`. */
  merchantEmail: string
  /** OTP read token for `X-OTP-Token` when the API requires it; null if the last load did not need one. */
  otpToken: string | null
  result: {
    detail: MerchantDetail
    kiosks: MerchantKioskRow[]
  }
}

function parseStored(raw: string): MerchantReadSessionPayload | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    const userId = data.userId
    const merchantEmail = (data.merchantEmail ?? data.merchantId) as string | undefined
    const otpToken = data.otpToken as string | null | undefined
    const result = data.result as MerchantReadSessionPayload['result'] | undefined
    const detail = result?.detail
    const resolvedEmail =
      merchantEmail?.trim() ||
      detail?.pathKey ||
      (detail?.email && detail.email !== '—' ? detail.email : '') ||
      detail?.id
    if (typeof userId !== 'string' || !detail || !resolvedEmail) {
      return null
    }
    return {
      userId,
      merchantEmail: resolvedEmail.trim(),
      otpToken: otpToken ?? null,
      result,
    }
  } catch {
    return null
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
    const data = parseStored(raw)
    if (!data || data.userId !== userId) return null
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

/** OTP read token for `GET /merchants/{merchant_email}` when it matches the directory session merchant. */
export function getMerchantReadOtpForMerchant(userId: string, merchantEmail: string): string | null {
  const data = loadMerchantReadSession(userId)
  if (!data || data.merchantEmail !== merchantEmail) return null
  return data.otpToken
}
