import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import { ROLES, type Role } from '../../core/constants/roles'
import * as supportAPI from './supportAPI'
import type {
  CreateSupportUserPayload,
  DashboardMetrics,
  SupportUserResponse,
  UpdateSupportUserPayload,
} from './supportAPI'

interface SupportListBucket {
  items: SupportUserResponse[]
  total: number
  limit: number
  offset: number
  loading: boolean
  error: string | null
  /** Mirrors `is_active` query when status filter is not “all”. */
  lastIsActive: boolean | undefined
}

function emptyBucket(): SupportListBucket {
  return {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    loading: false,
    error: null,
    lastIsActive: undefined,
  }
}

export type SupportListRole = typeof ROLES.MERCHANT_SUPPORT | typeof ROLES.USER_SUPPORT

interface SupportState {
  metrics: DashboardMetrics | null
  merchantSupport: SupportListBucket
  userSupport: SupportListBucket
  loadingMetrics: boolean
  error: string | null
}

const initialState: SupportState = {
  metrics: null,
  merchantSupport: emptyBucket(),
  userSupport: emptyBucket(),
  loadingMetrics: false,
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

export interface LoadSupportUsersForRoleArg {
  role: SupportListRole
  limit?: number
  offset?: number
  is_active?: boolean
}

function bucketKeyForListRole(role: SupportListRole): 'merchantSupport' | 'userSupport' {
  return role === ROLES.MERCHANT_SUPPORT ? 'merchantSupport' : 'userSupport'
}

export const loadSupportUsersForRole = createAsyncThunk(
  'support/loadForRole',
  async (arg: LoadSupportUsersForRoleArg, { rejectWithValue }) => {
    const { role, limit, offset, is_active } = arg
    try {
      const result = await supportAPI.fetchSupportUsersList({
        role,
        limit,
        offset,
        is_active,
      })
      return { role, ...result, requestedIsActive: is_active }
    } catch (e) {
      return rejectWithValue({
        role,
        message: getApiErrorMessage(e),
      })
    }
  }
)

export const inviteSupportUser = createAsyncThunk(
  'support/invite',
  async (payload: CreateSupportUserPayload, { dispatch, getState, rejectWithValue }) => {
    try {
      const actorRole = (getState() as RootState).auth.user?.role as Role | undefined
      await supportAPI.createSupportUser(actorRole, payload)
      if (
        payload.role === ROLES.MERCHANT_SUPPORT ||
        payload.role === ROLES.USER_SUPPORT
      ) {
        const state = getState() as RootState
        const key = bucketKeyForListRole(payload.role)
        const b = state.support[key]
        await dispatch(
          loadSupportUsersForRole({
            role: payload.role,
            limit: b.limit,
            offset: 0,
            is_active: b.lastIsActive,
          })
        ).unwrap()
      }
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : getApiErrorMessage(e))
    }
  }
)

export const patchSupportUser = createAsyncThunk(
  'support/patch',
  async (
    { email, payload }: { email: string; payload: UpdateSupportUserPayload },
    { rejectWithValue }
  ) => {
    try {
      return await supportAPI.updateSupportUser(email, payload)
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
      .addCase(loadSupportUsersForRole.pending, (state, action) => {
        const key = bucketKeyForListRole(action.meta.arg.role)
        state[key].loading = true
        state[key].error = null
      })
      .addCase(loadSupportUsersForRole.fulfilled, (state, action) => {
        const { role, items, total, limit, offset, requestedIsActive } = action.payload
        const key = bucketKeyForListRole(role)
        const bucket = state[key]
        bucket.loading = false
        bucket.items = items
        bucket.total = total
        bucket.limit = limit
        bucket.offset = offset
        bucket.error = null
        bucket.lastIsActive = requestedIsActive
      })
      .addCase(loadSupportUsersForRole.rejected, (state, action) => {
        const payload = action.payload as { role: SupportListRole; message: string } | undefined
        if (!payload) return
        const key = bucketKeyForListRole(payload.role)
        state[key].loading = false
        state[key].error = payload.message
      })
      .addCase(inviteSupportUser.pending, (state) => {
        state.error = null
      })
      .addCase(inviteSupportUser.fulfilled, (state) => {
        state.error = null
      })
      .addCase(patchSupportUser.fulfilled, (state, action) => {
        const updated = action.payload
        for (const key of ['merchantSupport', 'userSupport'] as const) {
          const bucket = state[key]
          const i = bucket.items.findIndex((u) => u.id === updated.id)
          if (i >= 0) {
            bucket.items[i] = updated
          }
        }
      })
  },
})

export default supportSlice.reducer
