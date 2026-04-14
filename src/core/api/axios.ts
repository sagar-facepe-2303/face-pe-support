import axios from 'axios'

export const api = axios.create({
  /**
   * Use relative /sp in local dev so Vite proxy avoids browser CORS issues.
   * Override in deployed environments with VITE_API_BASE_URL if needed.
   */
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/sp',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
