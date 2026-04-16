const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function resolveApiBaseUrl(): string {
  if (!rawApiBaseUrl) {
    return '/sp'
  }

  const looksRelativeApiPath = rawApiBaseUrl.startsWith('/')
  if (looksRelativeApiPath || isAbsoluteHttpUrl(rawApiBaseUrl)) {
    return rawApiBaseUrl
  }

  throw new Error(
    'Invalid VITE_API_BASE_URL. Use a relative path (example: /sp) or absolute URL (example: https://api.example.com/sp).',
  )
}

export const appEnv = {
  apiBaseUrl: resolveApiBaseUrl(),
} as const
