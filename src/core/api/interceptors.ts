import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { Store } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { clearSession, updateTokens } from '../../features/auth/authSlice'

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

/**
 * Attach interceptors after the store exists to avoid circular imports with slices.
 */
export function attachInterceptors(store: Store<RootState>, instance: AxiosInstance): void {
  let refreshPromise: Promise<string | null> | null = null

  instance.interceptors.request.use((config) => {
    if (config.url?.includes('/auth/refresh')) {
      return config
    }

    const token = store.getState().auth.token
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config as RetriableRequest | undefined
      const status = error?.response?.status
      const requestUrl = originalRequest?.url ?? ''

      if (!originalRequest || status !== 401 || originalRequest._retry || requestUrl.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      const refreshToken = store.getState().auth.refreshToken
      if (!refreshToken) {
        store.dispatch(clearSession())
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = instance
          .post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
            refresh_token: refreshToken,
          })
          .then((response) => {
            const nextToken = response.data.access_token
            const nextRefreshToken = response.data.refresh_token
            store.dispatch(updateTokens({ token: nextToken, refreshToken: nextRefreshToken }))
            return nextToken
          })
          .catch((refreshError) => {
            store.dispatch(clearSession())
            return Promise.reject(refreshError)
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const nextToken = await refreshPromise
        if (!nextToken) {
          return Promise.reject(error)
        }
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.set('Authorization', `Bearer ${nextToken}`)
        return instance(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }
  )
}
