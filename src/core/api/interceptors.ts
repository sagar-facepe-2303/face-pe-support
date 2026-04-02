import type { AxiosInstance } from 'axios'
import type { Store } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

/**
 * Attach interceptors after the store exists to avoid circular imports with slices.
 */
export function attachInterceptors(store: Store<RootState>, instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = store.getState().auth.token
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        // Reserved for global session handling when backend is wired
      }
      return Promise.reject(error)
    }
  )
}
