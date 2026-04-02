import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as userAPI from './userAPI'
import type { PlatformUserDetail, PlatformUserRow, UserTransactionRow } from './userAPI'

interface UserState {
  list: PlatformUserRow[]
  current: PlatformUserDetail | null
  transactions: UserTransactionRow[]
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
}

const initialState: UserState = {
  list: [],
  current: null,
  transactions: [],
  loadingList: false,
  loadingDetail: false,
  error: null,
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
  async (id: string, { rejectWithValue }) => {
    try {
      return await userAPI.fetchUserById(id)
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed')
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
      })
      .addCase(loadUserDetail.fulfilled, (state, action) => {
        state.loadingDetail = false
        state.current = action.payload.user
        state.transactions = action.payload.transactions
      })
      .addCase(loadUserDetail.rejected, (state, action) => {
        state.loadingDetail = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export const { clearUserDetail } = userSlice.actions
export default userSlice.reducer
