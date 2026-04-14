import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import * as userAPI from './userAPI'
import type { PlatformUserDetail, PlatformUserRow, UserTransactionRow } from './userAPI'

export interface UserDetailRejected {
  message: string
  httpStatus?: number
}

interface UserState {
  list: PlatformUserRow[]
  current: PlatformUserDetail | null
  transactions: UserTransactionRow[]
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
  detailLoadHttpStatus: number | null
}

const initialState: UserState = {
  list: [],
  current: null,
  transactions: [],
  loadingList: false,
  loadingDetail: false,
  error: null,
  detailLoadHttpStatus: null,
}

export const loadUsers = createAsyncThunk('users/loadAll', async (_, { rejectWithValue }) => {
  try {
    return await userAPI.fetchUsers()
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed')
  }
})

export const loadUserDetail = createAsyncThunk(
  'users/loadDetail',
  async (arg: string | { id: string; otpToken?: string | null }, { rejectWithValue }) => {
    const id = typeof arg === 'string' ? arg : arg.id
    const otpToken = typeof arg === 'string' ? undefined : arg.otpToken
    try {
      return await userAPI.fetchUserProfile(id, otpToken)
    } catch (e) {
      return rejectWithValue({
        message: getApiErrorMessage(e),
        httpStatus: isAxiosError(e) ? e.response?.status : undefined,
      } satisfies UserDetailRejected)
    }
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserDetail(state) {
      state.current = null
      state.transactions = []
      state.detailLoadHttpStatus = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state) => {
        state.loadingList = true
        state.error = null
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.loadingList = false
        state.list = action.payload
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.loadingList = false
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(loadUserDetail.pending, (state) => {
        state.loadingDetail = true
        state.error = null
        state.detailLoadHttpStatus = null
      })
      .addCase(loadUserDetail.fulfilled, (state, action) => {
        state.loadingDetail = false
        state.current = action.payload.user
        state.transactions = action.payload.transactions
        state.detailLoadHttpStatus = null
      })
      .addCase(loadUserDetail.rejected, (state, action) => {
        state.loadingDetail = false
        state.current = null
        state.transactions = []
        const p = action.payload as UserDetailRejected | string | undefined
        if (p && typeof p === 'object' && 'message' in p) {
          state.error = p.message
          state.detailLoadHttpStatus = typeof p.httpStatus === 'number' ? p.httpStatus : null
        } else {
          state.error = typeof p === 'string' ? p : 'Error'
          state.detailLoadHttpStatus = null
        }
      })
  },
})

export const { clearUserDetail } = userSlice.actions
export default userSlice.reducer
