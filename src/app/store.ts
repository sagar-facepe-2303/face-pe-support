import { configureStore } from '@reduxjs/toolkit'
import authReducer, { authInitialState } from '../features/auth/authSlice'
import {
  clearPersistedAuth,
  loadPersistedAuth,
  savePersistedAuth,
} from '../features/auth/authPersistence'
import supportReducer from '../features/supportTeam/supportSlice'
import merchantReducer from '../features/merchants/merchantSlice'
import kioskReducer from '../features/kiosks/kioskSlice'
import userReducer from '../features/users/userSlice'
import auditReducer from '../features/auditLogs/auditSlice'
import themeReducer from '../features/theme/themeSlice'

function buildPreloadedState() {
  if (typeof window === 'undefined') return undefined
  const persisted = loadPersistedAuth()
  if (!persisted) return undefined
  return {
    auth: {
      ...authInitialState,
      user: persisted.user,
      token: persisted.token,
      refreshToken: persisted.refreshToken,
      status: 'succeeded' as const,
      error: null,
    },
  }
}

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    support: supportReducer,
    merchants: merchantReducer,
    kiosks: kioskReducer,
    users: userReducer,
    auditLogs: auditReducer,
  },
  preloadedState: buildPreloadedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
})

let lastAuthPersistSig = ''
store.subscribe(() => {
  const a = store.getState().auth
  if (a.token && a.user) {
    const sig = `${a.token}\0${a.refreshToken ?? ''}\0${a.user.id}`
    if (sig !== lastAuthPersistSig) {
      lastAuthPersistSig = sig
      savePersistedAuth({ user: a.user, token: a.token, refreshToken: a.refreshToken })
    }
  } else if (!a.token && !a.user) {
    if (lastAuthPersistSig !== '') {
      lastAuthPersistSig = ''
      clearPersistedAuth()
    }
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
