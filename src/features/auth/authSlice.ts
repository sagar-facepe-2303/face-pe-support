import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { clearMerchantReadSession } from '../merchants/merchantReadSession'
import * as authAPI from './authAPI'
import type { LoginPayload } from './authAPI'
import type { AuthState, AuthUser } from './types'

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  status: 'idle',
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      return await authAPI.loginRequest(payload)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed'
      return rejectWithValue(message)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const state = getState() as { auth: AuthState }
  await authAPI.logoutRequest(state.auth.refreshToken)
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateSession(
      state,
      action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string } | null>
    ) {
      if (action.payload) {
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken ?? null
      }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Sign in failed'
      })
      .addCase(logout.fulfilled, (state) => {
        clearMerchantReadSession()
        state.user = null
        state.token = null
        state.refreshToken = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { hydrateSession, clearError } = authSlice.actions
export default authSlice.reducer
