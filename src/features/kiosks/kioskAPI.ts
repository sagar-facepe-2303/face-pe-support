import { isAxiosError } from 'axios'
import api from '../../core/api/axios'
import { parsePagedResponse, type Paged } from '../../core/api/pagination'
import { formatRelativeTime } from '../../core/utils/helpers'
import { fetchMerchantKiosks, fetchMerchantKiosksRaw } from '../merchants/merchantAPI'
import type { KioskApiResponse, MerchantKioskRow } from '../merchants/merchantAPI'

export interface KioskRow {
  id: string
  merchantId: string
  serialId: string
  location: string
  networkStatus: 'ONLINE' | 'OFFLINE'
  healthPct: number
  healthLabel: 'Optimal' | 'Slow Response' | 'Disconnected'
  lastSync: string
}

export interface KioskDetail extends KioskRow {
  title: string
  breadcrumb: string
  placeName: string
  faceStatus: string
  cameraStatus: string
  isOnline: boolean
  cpuPct: number
  memoryUsedGb: number
  memoryTotalGb: number
  cameraStatusLabel: string
  model: string
  serialNumber: string
  osVersion: string
  uptime: string
}

export interface KioskHeartbeatRequest {
  is_online: boolean
  face_status: string
  camera_status: string
}

export interface KioskHeartbeatResponse {
  acknowledged: boolean
  server_timestamp: string
}

export interface ListKiosksParams {
  page: number
  pageSize: number
  q?: string
  /** "online" | "offline" | "" */
  network?: string
  /**
   * When set (e.g. merchant_admin), load kiosks via GET /merchants/{id}/kiosks
   * instead of GET /kiosks (which may not exist).
   */
  merchantScopeId?: string
}

function deriveHealth(k: KioskApiResponse): { healthPct: number; healthLabel: KioskRow['healthLabel'] } {
  if (!k.is_online) return { healthPct: 0, healthLabel: 'Disconnected' }
  const camRaw = k.camera_status
  const faceRaw = k.face_status
  const camOk =
    camRaw === true ||
    String(camRaw).toLowerCase().includes('ok') ||
    String(camRaw).toLowerCase().includes('clear') ||
    String(camRaw).toLowerCase().includes('good')
  const faceOk =
    faceRaw === true ||
    String(faceRaw).toLowerCase().includes('ok') ||
    String(faceRaw).toLowerCase().includes('good')
  if (camOk && faceOk) return { healthPct: 100, healthLabel: 'Optimal' }
  return { healthPct: 68, healthLabel: 'Slow Response' }
}

function mapKioskResponseToRow(k: KioskApiResponse): KioskRow {
  const { healthPct, healthLabel } = deriveHealth(k)
  const ts = k.last_heartbeat_at ?? k.updated_at
  return {
    id: k.id,
    merchantId: k.merchant_id,
    serialId: k.serial_id,
    location: k.serial_id,
    networkStatus: k.is_online ? 'ONLINE' : 'OFFLINE',
    healthPct,
    healthLabel,
    lastSync: formatRelativeTime(ts),
  }
}

function paginateLocal<T>(items: T[], page: number, pageSize: number): Paged<T> {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return {
    items: slice,
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 1 : totalPages,
  }
}

function mapMerchantScopedKiosks(
  raw: KioskApiResponse[],
  merchantScopeId: string,
  q: string | undefined,
  network: ListKiosksParams['network']
): KioskRow[] {
  let rows = raw.map((x) => {
    const withMerchant: KioskApiResponse = {
      ...x,
      merchant_id: x.merchant_id || merchantScopeId,
    }
    return mapKioskResponseToRow(withMerchant)
  })

  const needle = q?.trim().toLowerCase()
  if (needle) {
    rows = rows.filter((r) => r.serialId.toLowerCase().includes(needle) || r.id.toLowerCase().includes(needle))
  }
  if (network === 'online') {
    rows = rows.filter((r) => r.networkStatus === 'ONLINE')
  }
  if (network === 'offline') {
    rows = rows.filter((r) => r.networkStatus === 'OFFLINE')
  }
  return rows
}

export async function fetchKiosksPaged(params: ListKiosksParams): Promise<Paged<KioskRow>> {
  const { page, pageSize, q, network, merchantScopeId } = params

  if (merchantScopeId) {
    const raw = await fetchMerchantKiosksRaw(merchantScopeId)
    const mapped = mapMerchantScopedKiosks(raw, merchantScopeId, q, network)
    return paginateLocal(mapped, page, pageSize)
  }

  try {
    const response = await api.get<unknown>('/kiosks', {
      params: {
        page,
        page_size: pageSize,
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(network === 'online' ? { is_online: true } : {}),
        ...(network === 'offline' ? { is_online: false } : {}),
      },
    })
    return parsePagedResponse(response.data, (raw) => mapKioskResponseToRow(raw as KioskApiResponse))
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0)) {
      return {
        items: [],
        page: 1,
        pageSize,
        totalItems: 0,
        totalPages: 0,
      }
    }
    throw e
  }
}

function merchantKioskRowToDetail(m: MerchantKioskRow, merchantId: string): KioskDetail {
  const synthetic: KioskApiResponse = {
    id: m.id,
    merchant_id: merchantId,
    serial_id: m.serialId,
    is_online: m.isOnline,
    face_status: m.faceStatus,
    camera_status: m.cameraStatus,
    is_active: m.isActive,
    updated_at: null,
    last_heartbeat_at: null,
  }
  const row = mapKioskResponseToRow(synthetic)
  const { healthPct, healthLabel } = deriveHealth(synthetic)
  const faceStr = typeof synthetic.face_status === 'boolean' ? (synthetic.face_status ? 'ok' : 'fail') : String(synthetic.face_status)
  const camStr =
    typeof synthetic.camera_status === 'boolean' ? (synthetic.camera_status ? 'ok' : 'fail') : String(synthetic.camera_status)
  return {
    ...row,
    lastSync: m.lastSync,
    healthPct,
    healthLabel,
    title: `Kiosk ${m.serialId}`,
    breadcrumb: `Kiosks · ${m.serialId}`,
    placeName: m.serialId,
    faceStatus: faceStr,
    cameraStatus: camStr,
    isOnline: m.isOnline,
    cpuPct: m.isOnline ? 24 : 0,
    memoryUsedGb: 4.2,
    memoryTotalGb: 8,
    cameraStatusLabel: camStr,
    model: 'FacePe Terminal',
    serialNumber: m.serialId,
    osVersion: '—',
    uptime: '—',
  }
}

export async function fetchKioskById(id: string, merchantScopeId?: string | null): Promise<KioskDetail> {
  try {
    const response = await api.get<KioskApiResponse>(`/kiosks/${id}`)
    const k = response.data
    const row = mapKioskResponseToRow(k)
    const { healthPct, healthLabel } = deriveHealth(k)
    const faceStr =
      typeof k.face_status === 'boolean' ? (k.face_status ? 'ok' : 'fail') : String(k.face_status ?? '')
    const camStr =
      typeof k.camera_status === 'boolean' ? (k.camera_status ? 'ok' : 'fail') : String(k.camera_status ?? '')
    return {
      ...row,
      healthPct,
      healthLabel,
      title: `Kiosk ${k.serial_id}`,
      breadcrumb: `Kiosks · ${k.serial_id}`,
      placeName: k.serial_id,
      faceStatus: faceStr,
      cameraStatus: camStr,
      isOnline: k.is_online,
      cpuPct: k.is_online ? 24 : 0,
      memoryUsedGb: 4.2,
      memoryTotalGb: 8,
      cameraStatusLabel: camStr,
      model: 'FacePe Terminal',
      serialNumber: k.serial_id,
      osVersion: '—',
      uptime: '—',
    }
  } catch (e) {
    if (isAxiosError(e) && [404, 405].includes(e.response?.status ?? 0) && merchantScopeId) {
      const rows = await fetchMerchantKiosks(merchantScopeId)
      const found = rows.find((r) => r.id === id)
      if (found) {
        return merchantKioskRowToDetail(found, merchantScopeId)
      }
    }
    throw e
  }
}

export async function sendKioskHeartbeat(
  kioskId: string,
  payload: KioskHeartbeatRequest
): Promise<KioskHeartbeatResponse> {
  const response = await api.post<KioskHeartbeatResponse>(`/kiosks/${kioskId}/heartbeat`, payload)
  return response.data
}
