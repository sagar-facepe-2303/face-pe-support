export interface KioskRow {
  id: string
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
  cpuPct: number
  memoryUsedGb: number
  memoryTotalGb: number
  cameraStatus: string
  model: string
  serialNumber: string
  osVersion: string
  uptime: string
}

export async function fetchKiosks(): Promise<KioskRow[]> {
  await delay(260)
  return [
    {
      id: 'k1',
      serialId: 'FP-K-90210',
      location: 'Dubai Mall, G-Floor',
      networkStatus: 'ONLINE',
      healthPct: 100,
      healthLabel: 'Optimal',
      lastSync: '2 mins ago',
    },
    {
      id: 'k2',
      serialId: 'FP-K-77102',
      location: 'Changi Airport, T4',
      networkStatus: 'OFFLINE',
      healthPct: 42,
      healthLabel: 'Disconnected',
      lastSync: '14 mins ago',
    },
  ]
}

export async function fetchKioskById(id: string): Promise<KioskDetail> {
  await delay(220)
  return {
    id,
    serialId: 'KSK-9920-ALPHA',
    location: 'Changi Airport, Singapore',
    networkStatus: 'ONLINE',
    healthPct: 98,
    healthLabel: 'Optimal',
    lastSync: 'Just now',
    title: 'Alpha Hub - Terminal 4',
    breadcrumb: 'KIOSKS > KSK-9920-ALPHA',
    placeName: 'Changi Airport, Singapore',
    cpuPct: 24,
    memoryUsedGb: 4.2,
    memoryTotalGb: 8,
    cameraStatus: 'Clear',
    model: 'FacePe Terminal X1',
    serialNumber: 'SN-ALPHA-9920',
    osVersion: 'FacePe OS 4.2',
    uptime: '18d 4h',
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
