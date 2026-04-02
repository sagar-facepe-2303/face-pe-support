import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import * as authAPI from './authAPI'
import type { LoginPayload, RegisterPayload } from './authAPI'
import type { AuthState, AuthUser } from './types'

const initialState: AuthState = {
  user: null,
  token: null,
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

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await authAPI.registerRequest(payload)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed'
      return rejectWithValue(message)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  await authAPI.logoutRequest()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateSession(state, action: PayloadAction<{ user: AuthUser; token: string } | null>) {
      if (action.payload) {
        state.user = action.payload.user
        state.token = action.payload.token
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
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Sign in failed'
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Registration failed'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { hydrateSession, clearError } = authSlice.actions
export default authSlice.reducer
