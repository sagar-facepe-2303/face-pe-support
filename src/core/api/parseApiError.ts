import { isAxiosError } from 'axios'

/**
 * Turns FastAPI-style JSON errors (`detail` string or ValidationError[]) into a readable message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Something went wrong.'
  }

  const data = error.response?.data
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
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
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  if (error.response?.status === 422) {
    return 'Request could not be processed. Check the form and try again.'
  }

  return error.message || 'Request failed.'
}
