import axios from 'axios'

/**
 * Central Axios instance. Real HTTP is not used — callers use mock layer that returns Promises.
 * baseURL reserved for future backend integration.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
