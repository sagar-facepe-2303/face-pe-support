import api from '../../core/api/axios'
import { parsePagedResponse, type Paged } from '../../core/api/pagination'
import { formatRelativeTime } from '../../core/utils/helpers'
import type { KioskApiResponse } from '../merchants/merchantAPI'

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
}

function deriveHealth(k: KioskApiResponse): { healthPct: number; healthLabel: KioskRow['healthLabel'] } {
  if (!k.is_online) return { healthPct: 0, healthLabel: 'Disconnected' }
  const cam = (k.camera_status ?? '').toLowerCase()
  const face = (k.face_status ?? '').toLowerCase()
  const camOk = cam.includes('ok') || cam.includes('clear') || cam.includes('good')
  const faceOk = face.includes('ok') || face.includes('good')
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

export async function fetchKiosksPaged(params: ListKiosksParams): Promise<Paged<KioskRow>> {
  const { page, pageSize, q, network } = params
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
}

export async function fetchKioskById(id: string): Promise<KioskDetail> {
  const response = await api.get<KioskApiResponse>(`/kiosks/${id}`)
  const k = response.data
  const row = mapKioskResponseToRow(k)
  const { healthPct, healthLabel } = deriveHealth(k)
  return {
    ...row,
    healthPct,
    healthLabel,
    title: `Kiosk ${k.serial_id}`,
    breadcrumb: `Kiosks · ${k.serial_id}`,
    placeName: k.serial_id,
    faceStatus: k.face_status,
    cameraStatus: k.camera_status,
    isOnline: k.is_online,
    cpuPct: k.is_online ? 24 : 0,
    memoryUsedGb: 4.2,
    memoryTotalGb: 8,
    cameraStatusLabel: k.camera_status,
    model: 'FacePe Terminal',
    serialNumber: k.serial_id,
    osVersion: '—',
    uptime: '—',
  }
}

export async function sendKioskHeartbeat(
  kioskId: string,
  payload: KioskHeartbeatRequest
): Promise<KioskHeartbeatResponse> {
  const response = await api.post<KioskHeartbeatResponse>(`/kiosks/${kioskId}/heartbeat`, payload)
  return response.data
}
