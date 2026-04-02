export interface SupportAgent {
  id: string
  name: string
  email: string
  roleLabel: string
  status: 'online' | 'offline'
  activity: string
  assignedTasks: { done: number; total: number }
}

export interface DashboardMetrics {
  totalMerchants: number
  merchantTrend: string
  activeKiosks: number
  offlineKiosks: number
  networkUptime: string
  totalUsers: number
  userTrend: string
  activeUsersLabel: string
  inactiveUsersLabel: string
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await delay(300)
  return {
    totalMerchants: 2842,
    merchantTrend: '+12.5%',
    activeKiosks: 856,
    offlineKiosks: 3,
    networkUptime: '99.8%',
    totalUsers: 142902,
    userTrend: '+2.4k',
    activeUsersLabel: '82k Active',
    inactiveUsersLabel: '60k Inactive',
  }
}

export async function fetchSupportAgents(): Promise<SupportAgent[]> {
  await delay(280)
  return [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 's.chen@facepe.com',
      roleLabel: 'SUPER ADMIN',
      status: 'online',
      activity: 'Active now · reviewing queue',
      assignedTasks: { done: 12, total: 14 },
    },
    {
      id: '2',
      name: 'Marcus Lee',
      email: 'm.lee@facepe.com',
      roleLabel: 'ADMIN',
      status: 'online',
      activity: '2 min ago · kiosk sync',
      assignedTasks: { done: 18, total: 25 },
    },
    {
      id: '3',
      name: 'Priya Nair',
      email: 'p.nair@facepe.com',
      roleLabel: 'USER ADMIN',
      status: 'offline',
      activity: '1 hour ago · off duty',
      assignedTasks: { done: 6, total: 10 },
    },
    {
      id: '4',
      name: 'Jordan Blake',
      email: 'j.blake@facepe.com',
      roleLabel: 'SUPPORT',
      status: 'online',
      activity: 'Active now · onboarding',
      assignedTasks: { done: 4, total: 8 },
    },
  ]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
