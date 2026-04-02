import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as auditAPI from './auditAPI'
import type { AuditLogRow } from './auditAPI'

interface AuditState {
  items: AuditLogRow[]
  loading: boolean
  error: string | null
}

const initialState: AuditState = {
  items: [],
  loading: false,
  error: null,
}

export const loadAuditLogs = createAsyncThunk('auditLogs/loadAll', async (_, { rejectWithValue }) => {
  try {
    return await auditAPI.fetchAuditLogs()
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed')
  }
})

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
        state.items = action.payload
      })
      .addCase(loadAuditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export default auditSlice.reducer
