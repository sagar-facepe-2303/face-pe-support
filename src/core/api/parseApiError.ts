import { isAxiosError } from 'axios'

const MAX_PLAIN_TEXT = 400

function tryParseJsonObject(raw: string): Record<string, unknown> | null {
  const t = raw.trim()
  if (!t.startsWith('{') && !t.startsWith('[')) return null
  try {
    const v = JSON.parse(t) as unknown
    return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Pull a human-readable message from common API error JSON shapes (FastAPI, custom wrappers, plain text).
 */
function messageFromResponseBody(data: unknown): string | null {
  if (data == null) {
    return null
  }

  if (typeof data === 'string') {
    const t = data.trim()
    if (!t) return null
    const parsed = tryParseJsonObject(t)
    if (parsed) {
      const nested = messageFromResponseBody(parsed)
      if (nested) return nested
    }
    return t.length > MAX_PLAIN_TEXT ? `${t.slice(0, MAX_PLAIN_TEXT)}…` : t
  }

  if (typeof data !== 'object') {
    return null
  }

  const o = data as Record<string, unknown>

  if ('detail' in o) {
    const detail = o.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim()
    }
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            const loc = 'loc' in item && Array.isArray((item as { loc: unknown[] }).loc)
              ? (item as { loc: (string | number)[] }).loc
                  .filter((x) => typeof x === 'string')
                  .join('.')
              : ''
            const msg = String((item as { msg: string }).msg)
            return loc ? `${loc}: ${msg}` : msg
          }
          return typeof item === 'string' ? item : null
        })
        .filter((x): x is string => Boolean(x))
      if (msgs.length) return msgs.join(' ')
    }
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      const d = detail as { message?: unknown; error?: unknown; msg?: unknown }
      if (typeof d.message === 'string' && d.message.trim()) {
        if (typeof d.error === 'string' && d.error.trim()) {
          return `${d.error}: ${d.message}`
        }
        return d.message
      }
      if (typeof d.msg === 'string' && d.msg.trim()) {
        return d.msg
      }
    }
  }

  if (typeof o.message === 'string' && o.message.trim()) {
    if (typeof o.error === 'string' && o.error.trim()) {
      return `${o.error}: ${o.message}`
    }
    return o.message
  }

  if (typeof o.error === 'string' && o.error.trim()) {
    return o.error
  }

  return null
}

/**
 * Turns FastAPI-style JSON errors (`detail` string or ValidationError[]) into a readable message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Something went wrong.'
  }

  const status = error.response?.status
  const fromBody = messageFromResponseBody(error.response?.data)
  if (fromBody) {
    return fromBody
  }

  if (status === 422) {
    return 'Request could not be processed. Check the form and try again.'
  }

  if (status != null && status >= 500) {
    const hint =
      'This is a server error — OTP email/SMS delivery or backend configuration may be failing. Check API logs for the full traceback.'
    return `Server error (${status}). ${hint}`
  }

  const fallback = error.message?.trim()
  if (fallback) {
    return fallback
  }

  return 'Request failed.'
}
