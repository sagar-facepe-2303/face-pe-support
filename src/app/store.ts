import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import supportReducer from '../features/supportTeam/supportSlice'
import merchantReducer from '../features/merchants/merchantSlice'
import kioskReducer from '../features/kiosks/kioskSlice'
import userReducer from '../features/users/userSlice'
import auditReducer from '../features/auditLogs/auditSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    support: supportReducer,
    merchants: merchantReducer,
    kiosks: kioskReducer,
    users: userReducer,
    auditLogs: auditReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
