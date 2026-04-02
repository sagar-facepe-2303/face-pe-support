import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as kioskAPI from './kioskAPI'
import type { KioskDetail, KioskRow } from './kioskAPI'

interface KioskState {
  list: KioskRow[]
  current: KioskDetail | null
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
}

const initialState: KioskState = {
  list: [],
  current: null,
  loadingList: false,
  loadingDetail: false,
  error: null,
}

export const loadKiosks = createAsyncThunk('kiosks/loadAll', async (_, { rejectWithValue }) => {
  try {
    return await kioskAPI.fetchKiosks()
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed')
  }
})

export const loadKioskDetail = createAsyncThunk(
  'kiosks/loadDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      return await kioskAPI.fetchKioskById(id)
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed')
    }
  }
)

const kioskSlice = createSlice({
  name: 'kiosks',
  initialState,
  reducers: {
    clearKioskDetail(state) {
      state.current = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadKiosks.pending, (state) => {
        state.loadingList = true
        state.error = null
      })
      .addCase(loadKiosks.fulfilled, (state, action) => {
        state.loadingList = false
        state.list = action.payload
      })
      .addCase(loadKiosks.rejected, (state, action) => {
        state.loadingList = false
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(loadKioskDetail.pending, (state) => {
        state.loadingDetail = true
        state.error = null
      })
      .addCase(loadKioskDetail.fulfilled, (state, action) => {
        state.loadingDetail = false
        state.current = action.payload
      })
      .addCase(loadKioskDetail.rejected, (state, action) => {
        state.loadingDetail = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export const { clearKioskDetail } = kioskSlice.actions
export default kioskSlice.reducer
