import api from '../../core/api/axios'

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
  kioskId: string
  locationName: string
  dailyTraffic: string
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

export async function fetchMerchants(): Promise<MerchantRow[]> {
  // List endpoint is not part of current backend contract in handoff doc.
  // Keep existing curated data for directory screen.
  await delay(250)
  return [
    {
      id: 'm1',
      name: 'Glow Lifestyle',
      category: 'Retail',
      location: 'London, UK',
      email: 'ops@glowlifestyle.com',
      status: 'ACTIVE',
      registeredAt: '2023-10-12',
    },
    {
      id: 'm2',
      name: 'Northwind Traders',
      category: 'Wholesale',
      location: 'Toronto, CA',
      email: 'support@northwind.io',
      status: 'PENDING',
      registeredAt: '2024-01-04',
    },
    {
      id: 'm3',
      name: 'Global Retail Group',
      category: 'Enterprise',
      location: 'New York, US',
      email: 'm.thorne@globalretail.com',
      status: 'ACTIVE',
      registeredAt: '2022-06-18',
    },
  ]
}

export async function fetchMerchantById(id: string): Promise<MerchantDetail> {
  // Detail endpoint is not part of current backend contract in handoff doc.
  await delay(200)
  return {
    id,
    name: 'Global Retail Group',
    category: 'Enterprise',
    location: 'New York, US',
    email: 'm.thorne@globalretail.com',
    status: 'ACTIVE',
    registeredAt: '2022-06-18',
    legalEntity: 'Global Retail Solutions LLC',
    registrationNumber: 'REG-882190-USA',
    contactName: 'Marcus Thorne',
    headquarters: 'One World Trade Center, Suite 85, NY',
    phone: '+1 (212) 555-0198',
    settlementMethod: 'Direct Bank Transfer (Weekly)',
    apiUptime: '99.9%',
    riskLevel: 'LOW',
    growth: '+14%',
  }
}

export async function fetchMerchantKiosks(_merchantId: string): Promise<MerchantKioskRow[]> {
  // Kiosk listing endpoint is not part of current backend contract in handoff doc.
  await delay(200)
  return [
    {
      kioskId: 'KSK-8801',
      locationName: 'Manhattan Plaza - Gate 4',
      dailyTraffic: '1,420 users',
      lastSync: '2 mins ago',
      batteryPct: 98,
      batteryLow: false,
    },
    {
      kioskId: 'KSK-8802',
      locationName: 'Queens Central Terminal',
      dailyTraffic: '890 users',
      lastSync: '1 hour ago',
      batteryPct: 12,
      batteryLow: true,
    },
    {
      kioskId: 'KSK-8805',
      locationName: 'Brooklyn Heights North',
      dailyTraffic: '2,110 users',
      lastSync: 'Just now',
      batteryPct: 82,
      batteryLow: false,
    },
  ]
}

export async function createMerchant(payload: CreateMerchantRequest): Promise<unknown> {
  const response = await api.post('/merchants', payload)
  return response.data
}

export async function updateMerchant(merchantId: string, payload: UpdateMerchantRequest): Promise<unknown> {
  const response = await api.put(`/merchants/${merchantId}`, payload)
  return response.data
}

export async function createMerchantKiosk(
  merchantId: string,
  payload: CreateKioskRequest
): Promise<unknown> {
  const response = await api.post(`/merchants/${merchantId}/kiosks`, payload)
  return response.data
}

export async function updateMerchantKiosk(
  merchantId: string,
  kioskId: string,
  payload: UpdateKioskRequest
): Promise<unknown> {
  const response = await api.put(`/merchants/${merchantId}/kiosks/${kioskId}`, payload)
  return response.data
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
