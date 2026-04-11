import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import type { Role } from '../../core/constants/roles'
import * as supportAPI from './supportAPI'
import type {
  CreateSupportUserPayload,
  DashboardMetrics,
  SupportUserResponse,
  UpdateSupportUserPayload,
} from './supportAPI'

interface SupportState {
  metrics: DashboardMetrics | null
  supportUsers: SupportUserResponse[]
  loadingMetrics: boolean
  loadingList: boolean
  error: string | null
}

const initialState: SupportState = {
  metrics: null,
  supportUsers: [],
  loadingMetrics: false,
  loadingList: false,
  error: null,
}

export const loadDashboardMetrics = createAsyncThunk(
  'support/loadDashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await supportAPI.fetchDashboardMetrics()
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load metrics')
    }
  }
)

export const loadSupportUsers = createAsyncThunk(
  'support/loadSupportUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await supportAPI.fetchSupportUsersList()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const inviteSupportUser = createAsyncThunk(
  'support/invite',
  async (payload: CreateSupportUserPayload, { dispatch, getState, rejectWithValue }) => {
    try {
      const actorRole = (getState() as RootState).auth.user?.role as Role | undefined
      await supportAPI.createSupportUser(actorRole, payload)
      await dispatch(loadSupportUsers()).unwrap()
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : getApiErrorMessage(e))
    }
  }
)

export const patchSupportUser = createAsyncThunk(
  'support/patch',
  async (
    { id, payload }: { id: string; payload: UpdateSupportUserPayload },
    { rejectWithValue }
  ) => {
    try {
      return await supportAPI.updateSupportUser(id, payload)
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : getApiErrorMessage(e))
    }
  }
)

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboardMetrics.pending, (state) => {
        state.loadingMetrics = true
        state.error = null
      })
      .addCase(loadDashboardMetrics.fulfilled, (state, action) => {
        state.loadingMetrics = false
        state.metrics = action.payload
      })
      .addCase(loadDashboardMetrics.rejected, (state, action) => {
        state.loadingMetrics = false
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(loadSupportUsers.pending, (state) => {
        state.loadingList = true
        state.error = null
      })
      .addCase(loadSupportUsers.fulfilled, (state, action) => {
        state.loadingList = false
        state.supportUsers = action.payload
      })
      .addCase(loadSupportUsers.rejected, (state, action) => {
        state.loadingList = false
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(inviteSupportUser.pending, (state) => {
        state.error = null
      })
      .addCase(inviteSupportUser.fulfilled, (state) => {
        state.error = null
      })
      .addCase(inviteSupportUser.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(patchSupportUser.fulfilled, (state, action) => {
        state.error = null
        const updated = action.payload
        const i = state.supportUsers.findIndex((u) => u.id === updated.id)
        if (i >= 0) {
          state.supportUsers[i] = updated
        }
      })
      .addCase(patchSupportUser.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export default supportSlice.reducer
