import api from '../../core/api/axios'
import { parsePagedResponse, type Paged } from '../../core/api/pagination'
import { formatRelativeTime } from '../../core/utils/helpers'

/** Shapes returned by GET /merchants and GET /merchants/{id} (Pydantic-friendly). */
export interface MerchantResponse {
  id: string
  merchant_name: string
  merchant_code: string
  contact_email: string
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
  merchant_code: string
  contact_email: string
  contact_phone?: string
  status?: string
}

export interface UpdateMerchantRequest {
  merchant_name?: string
  contact_email?: string
  contact_phone?: string
  status?: string
  is_active?: boolean
}

export interface CreateKioskRequest {
  serial_id: string
  is_online: boolean
  face_status: string
  camera_status: string
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
  face_status: string
  camera_status: string
  is_active?: boolean | null
  updated_at?: string | null
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

function mapMerchantResponseToRow(m: MerchantResponse): MerchantRow {
  const registeredAt = m.created_at ?? m.updated_at ?? new Date().toISOString()
  return {
    id: m.id,
    name: m.merchant_name,
    category: m.merchant_code,
    location: m.contact_phone?.trim() ? m.contact_phone : '—',
    email: m.contact_email,
    status: mapMerchantStatus(m),
    registeredAt,
  }
}

export function mapMerchantToDetail(m: MerchantResponse): MerchantDetail {
  const row = mapMerchantResponseToRow(m)
  return {
    ...row,
    legalEntity: m.merchant_name,
    registrationNumber: m.merchant_code,
    contactName: m.contact_phone?.trim() ? 'Primary contact' : '—',
    headquarters: '—',
    phone: m.contact_phone ?? '—',
    settlementMethod: '—',
    apiUptime: '—',
    riskLevel: m.is_active === false ? 'HIGH' : 'LOW',
    growth: '—',
  }
}

function mapKioskToMerchantRow(k: KioskApiResponse): MerchantKioskRow {
  const ts = k.last_heartbeat_at ?? k.updated_at
  const batteryPct = k.is_online ? 100 : 0
  const isActive = k.is_active !== false && k.is_active !== null
  return {
    id: k.id,
    kioskId: k.id,
    serialId: k.serial_id,
    locationName: k.serial_id,
    isOnline: k.is_online,
    faceStatus: k.face_status,
    cameraStatus: k.camera_status,
    isActive,
    lastSync: formatRelativeTime(ts),
    batteryPct,
    batteryLow: !k.is_online,
  }
}

export async function fetchMerchantsPaged(params: ListMerchantsParams): Promise<Paged<MerchantRow>> {
  const { page, pageSize, q, status } = params
  const response = await api.get<unknown>('/merchants', {
    params: {
      page,
      page_size: pageSize,
      ...(q?.trim() ? { q: q.trim() } : {}),
      ...(status?.trim() ? { status: status.trim() } : {}),
    },
  })
  return parsePagedResponse(response.data, (raw) => mapMerchantResponseToRow(raw as MerchantResponse))
}

export async function fetchMerchantById(id: string): Promise<MerchantDetail> {
  const response = await api.get<MerchantResponse>(`/merchants/${id}`)
  return mapMerchantToDetail(response.data)
}

export async function fetchMerchantKiosks(merchantId: string): Promise<MerchantKioskRow[]> {
  const response = await api.get<unknown>(`/merchants/${merchantId}/kiosks`)
  const data = response.data
  if (Array.isArray(data)) {
    return data.map((x) => mapKioskToMerchantRow(x as KioskApiResponse))
  }
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items: unknown }).items
    if (Array.isArray(items)) {
      return items.map((x) => mapKioskToMerchantRow(x as KioskApiResponse))
    }
  }
  return []
}

export async function createMerchant(payload: CreateMerchantRequest): Promise<MerchantResponse> {
  const response = await api.post<MerchantResponse>('/merchants', payload)
  return response.data
}

export async function updateMerchant(merchantId: string, payload: UpdateMerchantRequest): Promise<MerchantResponse> {
  const response = await api.put<MerchantResponse>(`/merchants/${merchantId}`, payload)
  return response.data
}

export async function deleteMerchant(merchantId: string): Promise<void> {
  await api.delete(`/merchants/${merchantId}`)
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
