import { isAxiosError } from 'axios'
import api from '../../core/api/axios'
import { parsePagedResponse, type Paged } from '../../core/api/pagination'
import { formatRelativeTime } from '../../core/utils/helpers'

/** Shapes returned by GET /merchants and GET /merchants/{id} (Pydantic-friendly). */
export interface MerchantResponse {
  id: string
  /** External / business merchant id (may differ from row `id`) */
  merchant_id?: string
  merchant_name: string
  /** Legacy; omit from create payloads — API may omit */
  merchant_code?: string
  /** Primary email field from API */
  merchant_email?: string
  contact_email?: string
  merchant_phone?: string | null
  contact_phone?: string | null
  status?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface MerchantRow {
  id: string
  name: string
  category: string
  location: string
  email: string
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  registeredAt: string
}

export interface MerchantDetail extends MerchantRow {
  legalEntity: string
  registrationNumber: string
  contactName: string
  headquarters: string
  phone: string
  settlementMethod: string
  apiUptime: string
  riskLevel: string
  growth: string
}

export interface MerchantKioskRow {
  id: string
  kioskId: string
  serialId: string
  locationName: string
  isOnline: boolean
  faceStatus: string
  cameraStatus: string
  isActive: boolean
  lastSync: string
  batteryPct: number
  batteryLow: boolean
}

export interface CreateMerchantRequest {
  merchant_name: string
  merchant_email: string
  merchant_phone?: string
  status?: string
  /** Any string the API accepts (uuid, urn:uuid:…, code, etc.) */
  merchant_id?: string
}

export interface UpdateMerchantRequest {
  merchant_name?: string
  merchant_email?: string
  merchant_phone?: string
  status?: string
  is_active?: boolean
}

export interface CreateKioskRequest {
  serial_id: string
  is_online: boolean
  face_status: string | boolean
  camera_status: string | boolean
}

/** Maps UI strings/checkbox-style input to API payload (supports boolean columns). */
export function buildCreateKioskPayload(
  serial_id: string,
  is_online: boolean,
  faceInput: string,
  cameraInput: string
): CreateKioskRequest {
  return {
    serial_id,
    is_online,
    face_status: normalizeKioskFlag(faceInput),
    camera_status: normalizeKioskFlag(cameraInput),
  }
}

function normalizeKioskFlag(input: string): boolean {
  const s = input.trim().toLowerCase()
  return s === 'ok' || s === 'true' || s === '1' || s === 'yes' || s === 'good'
}

export interface UpdateKioskRequest {
  is_online?: boolean
  face_status?: string
  camera_status?: string
  is_active?: boolean
}

export interface KioskApiResponse {
  id: string
  merchant_id: string
  serial_id: string
  is_online: boolean
  /** API may return strings or booleans (DB uses booleans). */
  face_status: string | boolean
  camera_status: string | boolean
  is_active?: boolean | null
  updated_at?: string | null
  /** API guide field name */
  last_heartbeat?: string | null
  /** Alternate name seen in some responses */
  last_heartbeat_at?: string | null
}

export interface ListMerchantsParams {
  page: number
  pageSize: number
  q?: string
  /** Raw status string sent to API (e.g. active/pending) */
  status?: string
}

function mapMerchantStatus(m: MerchantResponse): MerchantRow['status'] {
  if (m.is_active === false) return 'SUSPENDED'
  const s = (m.status ?? '').toLowerCase()
  if (s.includes('pend')) return 'PENDING'
  if (s.includes('suspend') || s === 'inactive') return 'SUSPENDED'
  return 'ACTIVE'
}

function merchantSubtitle(m: MerchantResponse): string {
  const ref = m.merchant_id?.trim() || m.merchant_code?.trim()
  if (ref) return ref.length > 28 ? `${ref.slice(0, 26)}…` : ref
  return m.id.length > 12 ? `${m.id.slice(0, 8)}…` : m.id
}

function mapMerchantResponseToRow(m: MerchantResponse): MerchantRow {
  const registeredAt = m.created_at ?? m.updated_at ?? new Date().toISOString()
  const phone = m.merchant_phone ?? m.contact_phone
  return {
    id: m.id,
    name: m.merchant_name,
    category: merchantSubtitle(m),
    location: phone?.trim() ? String(phone) : '—',
    email: m.merchant_email ?? m.contact_email ?? '—',
    status: mapMerchantStatus(m),
    registeredAt,
  }
}

export function mapMerchantToDetail(m: MerchantResponse): MerchantDetail {
  const row = mapMerchantResponseToRow(m)
  const phone = m.merchant_phone ?? m.contact_phone
  return {
    ...row,
    legalEntity: m.merchant_name,
    registrationNumber: m.merchant_id ?? m.merchant_code ?? m.id,
    contactName: phone?.trim() ? 'Primary contact' : '—',
    headquarters: '—',
    phone: phone ?? '—',
    settlementMethod: '—',
    apiUptime: '—',
    riskLevel: m.is_active === false ? 'HIGH' : 'LOW',
    growth: '—',
  }
}

function kioskStatusToLabel(v: string | boolean): string {
  if (typeof v === 'boolean') return v ? 'ok' : 'fail'
  return String(v ?? '')
}

function mapKioskToMerchantRow(k: KioskApiResponse): MerchantKioskRow {
  const ts = k.last_heartbeat ?? k.last_heartbeat_at ?? k.updated_at
  const batteryPct = k.is_online ? 100 : 0
  const isActive = k.is_active !== false && k.is_active !== null
  return {
    id: k.id,
    kioskId: k.id,
    serialId: k.serial_id,
    locationName: k.serial_id,
    isOnline: k.is_online,
    faceStatus: kioskStatusToLabel(k.face_status),
    cameraStatus: kioskStatusToLabel(k.camera_status),
    isActive,
    lastSync: formatRelativeTime(ts),
    batteryPct,
    batteryLow: !k.is_online,
  }
}

export async function fetchMerchantsPaged(params: ListMerchantsParams): Promise<Paged<MerchantRow>> {
  const { page, pageSize, q, status } = params
  try {
    const response = await api.get<unknown>('/merchants', {
      params: {
        page,
        page_size: pageSize,
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(status?.trim() ? { status: status.trim() } : {}),
      },
    })
    return parsePagedResponse(response.data, (raw) => mapMerchantResponseToRow(raw as MerchantResponse))
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return {
        items: [],
        page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
      }
    }
    throw e
  }
}

export async function fetchMerchantById(
  id: string,
  otpToken?: string | null
): Promise<{ detail: MerchantDetail; kiosks: MerchantKioskRow[] }> {
  const response = await api.get<MerchantResponse & { kiosks?: KioskApiResponse[] }>(`/merchants/${id}`, {
    ...(otpToken ? { headers: { 'X-OTP-Token': otpToken } } : {}),
  })
  const data = response.data
  const detail = mapMerchantToDetail(data)
  const kiosks = Array.isArray(data.kiosks) ? data.kiosks.map((k) => mapKioskToMerchantRow(k)) : []
  return { detail, kiosks }
}

/** Merchant OTP purposes from API guide (`MERCHANT_API_GUIDE.md`). */
export type MerchantOtpPurpose = 'read_merchant' | 'update_merchant'

export interface SendMerchantOtpResponse {
  session_id: string
  expires_at: string
  delivery_method?: string
  masked_recipient?: string
}

/** `POST /otp/send` for merchant targets — use `read_merchant` or `update_merchant`. */
export async function sendMerchantOtp(
  purpose: MerchantOtpPurpose,
  targetMerchantId: string
): Promise<SendMerchantOtpResponse> {
  const response = await api.post<SendMerchantOtpResponse>('/otp/send', {
    purpose,
    target_merchant_id: targetMerchantId,
  })
  return response.data
}

/** Convenience: `purpose: read_merchant` (see Merchant API Guide). */
export async function sendMerchantReadOtp(targetMerchantId: string): Promise<SendMerchantOtpResponse> {
  return sendMerchantOtp('read_merchant', targetMerchantId)
}

export interface VerifyOtpResponse {
  token?: string
  otp_token?: string
  token_type?: string
  expires_at?: string
  target_type?: string
  target_id?: string
}

/** `POST /otp/verify` — returns JWT-like OTP token for `X-OTP-Token`. */
export async function verifyOtpAndGetToken(sessionId: string, code: string): Promise<string> {
  const response = await api.post<VerifyOtpResponse>('/otp/verify', {
    session_id: sessionId,
    code,
  })
  const d = response.data
  return (d.token ?? d.otp_token ?? '').trim()
}

function parseKioskListPayload(data: unknown): KioskApiResponse[] {
  if (Array.isArray(data)) {
    return data as KioskApiResponse[]
  }
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items: unknown }).items
    if (Array.isArray(items)) {
      return items as KioskApiResponse[]
    }
  }
  return []
}

export async function fetchMerchantKiosks(
  merchantId: string,
  otpToken?: string | null
): Promise<MerchantKioskRow[]> {
  try {
    const response = await api.get<unknown>(`/merchants/${merchantId}/kiosks`, {
      ...(otpToken ? { headers: { 'X-OTP-Token': otpToken } } : {}),
    })
    return parseKioskListPayload(response.data).map((x) => mapKioskToMerchantRow(x))
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return []
    }
    throw e
  }
}

/** Raw kiosk rows for fleet mapping (same endpoint as fetchMerchantKiosks). */
export async function fetchMerchantKiosksRaw(merchantId: string): Promise<KioskApiResponse[]> {
  try {
    const response = await api.get<unknown>(`/merchants/${merchantId}/kiosks`)
    return parseKioskListPayload(response.data)
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return []
    }
    throw e
  }
}

export async function createMerchant(payload: CreateMerchantRequest): Promise<MerchantResponse> {
  const response = await api.post<MerchantResponse>('/merchants', payload)
  return response.data
}

export async function updateMerchant(
  merchantId: string,
  payload: UpdateMerchantRequest,
  otpToken?: string | null
): Promise<MerchantResponse> {
  const response = await api.put<MerchantResponse>(`/merchants/${merchantId}`, payload, {
    ...(otpToken ? { headers: { 'X-OTP-Token': otpToken } } : {}),
  })
  return response.data
}

export async function deleteMerchant(merchantId: string, otpToken?: string | null): Promise<void> {
  await api.delete(`/merchants/${merchantId}`, {
    ...(otpToken ? { headers: { 'X-OTP-Token': otpToken } } : {}),
  })
}

export async function createMerchantKiosk(
  merchantId: string,
  payload: CreateKioskRequest
): Promise<KioskApiResponse> {
  const response = await api.post<KioskApiResponse>(`/merchants/${merchantId}/kiosks`, payload)
  return response.data
}

export async function updateMerchantKiosk(
  merchantId: string,
  kioskId: string,
  payload: UpdateKioskRequest
): Promise<KioskApiResponse> {
  const response = await api.put<KioskApiResponse>(`/merchants/${merchantId}/kiosks/${kioskId}`, payload)
  return response.data
}

export async function deleteMerchantKiosk(merchantId: string, kioskId: string): Promise<void> {
  await api.delete(`/merchants/${merchantId}/kiosks/${kioskId}`)
}
