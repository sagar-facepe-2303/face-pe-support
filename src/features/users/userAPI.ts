export interface PlatformUserRow {
  id: string
  name: string
  email: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  createdAt: string
  avatarUrl?: string
}

export interface PlatformUserDetail extends PlatformUserRow {
  userCode: string
  phone: string
  lastLogin: string
  totalSpent: number
  spentTrend: string
  failedTransactions: number
  totalTransactions: number
  supportRequestsOpen: number
}

export interface UserTransactionRow {
  reference: string
  merchant: string
  date: string
  amount: number
  status: 'SUCCESS' | 'FAILED'
}

export async function fetchUsers(): Promise<PlatformUserRow[]> {
  await delay(240)
  return [
    {
      id: 'u1',
      name: 'Marcus Holloway',
      email: 'marcus.h@email.com',
      status: 'ACTIVE',
      createdAt: '2023-08-02',
    },
    {
      id: 'u2',
      name: 'Elena Park',
      email: 'elena.park@email.com',
      status: 'PENDING',
      createdAt: '2024-03-11',
    },
    {
      id: 'u3',
      name: 'Devon Miles',
      email: 'devon@email.com',
      status: 'SUSPENDED',
      createdAt: '2022-11-30',
    },
  ]
}

export async function fetchUserById(id: string): Promise<{
  user: PlatformUserDetail
  transactions: UserTransactionRow[]
}> {
  await delay(230)
  const user: PlatformUserDetail = {
    id,
    name: 'Marcus Holloway',
    email: 'marcus.h@email.com',
    status: 'ACTIVE',
    createdAt: '2023-08-02',
    userCode: 'FP-8829-01',
    phone: '+1 (415) 555-0142',
    lastLogin: 'Today, 09:14',
    totalSpent: 14290.5,
    spentTrend: '+12%',
    failedTransactions: 3,
    totalTransactions: 128,
    supportRequestsOpen: 1,
  }
  const transactions: UserTransactionRow[] = [
    {
      reference: 'TX-88291',
      merchant: 'Skyline Cafe',
      date: '2024-03-28',
      amount: 24.5,
      status: 'SUCCESS',
    },
    {
      reference: 'TX-88288',
      merchant: 'Harbor Air',
      date: '2024-03-27',
      amount: 210,
      status: 'FAILED',
    },
  ]
  return { user, transactions }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
