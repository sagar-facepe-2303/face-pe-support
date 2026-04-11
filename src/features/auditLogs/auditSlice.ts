import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import * as auditAPI from './auditAPI'
import type { AuditLogRow } from './auditAPI'

interface AuditState {
  items: AuditLogRow[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  loading: boolean
  error: string | null
}

const initialState: AuditState = {
  items: [],
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  loading: false,
  error: null,
}

export const loadAuditLogs = createAsyncThunk(
  'auditLogs/load',
  async (params: { page?: number; pageSize?: number } | undefined, { rejectWithValue }) => {
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? 20
      return await auditAPI.fetchAuditLogsPaged(page, pageSize)
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

const auditSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadAuditLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadAuditLogs.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.totalItems = action.payload.totalItems
        state.totalPages = action.payload.totalPages
      })
      .addCase(loadAuditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export default auditSlice.reducer
