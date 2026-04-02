import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as supportAPI from './supportAPI'
import type { DashboardMetrics, SupportAgent } from './supportAPI'

interface SupportState {
  metrics: DashboardMetrics | null
  agents: SupportAgent[]
  loadingMetrics: boolean
  loadingAgents: boolean
  error: string | null
}

const initialState: SupportState = {
  metrics: null,
  agents: [],
  loadingMetrics: false,
  loadingAgents: false,
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

export const loadSupportAgents = createAsyncThunk(
  'support/loadSupportAgents',
  async (_, { rejectWithValue }) => {
    try {
      return await supportAPI.fetchSupportAgents()
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load team')
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
      .addCase(loadSupportAgents.pending, (state) => {
        state.loadingAgents = true
      })
      .addCase(loadSupportAgents.fulfilled, (state, action) => {
        state.loadingAgents = false
        state.agents = action.payload
      })
      .addCase(loadSupportAgents.rejected, (state, action) => {
        state.loadingAgents = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export default supportSlice.reducer
