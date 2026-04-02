import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as merchantAPI from './merchantAPI'
import type { MerchantDetail, MerchantKioskRow, MerchantRow } from './merchantAPI'

interface MerchantState {
  list: MerchantRow[]
  current: MerchantDetail | null
  kiosks: MerchantKioskRow[]
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
}

const initialState: MerchantState = {
  list: [],
  current: null,
  kiosks: [],
  loadingList: false,
  loadingDetail: false,
  error: null,
}

export const loadMerchants = createAsyncThunk('merchants/loadAll', async (_, { rejectWithValue }) => {
  try {
    return await merchantAPI.fetchMerchants()
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Failed')
  }
})

export const loadMerchantDetail = createAsyncThunk(
  'merchants/loadDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const [detail, kiosks] = await Promise.all([
        merchantAPI.fetchMerchantById(id),
        merchantAPI.fetchMerchantKiosks(id),
      ])
      return { detail, kiosks }
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed')
    }
  }
)

const merchantSlice = createSlice({
  name: 'merchants',
  initialState,
  reducers: {
    clearMerchantDetail(state) {
      state.current = null
      state.kiosks = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMerchants.pending, (state) => {
        state.loadingList = true
        state.error = null
      })
      .addCase(loadMerchants.fulfilled, (state, action) => {
        state.loadingList = false
        state.list = action.payload
      })
      .addCase(loadMerchants.rejected, (state, action) => {
        state.loadingList = false
        state.error = (action.payload as string) ?? 'Error'
      })
      .addCase(loadMerchantDetail.pending, (state) => {
        state.loadingDetail = true
        state.error = null
      })
      .addCase(loadMerchantDetail.fulfilled, (state, action) => {
        state.loadingDetail = false
        state.current = action.payload.detail
        state.kiosks = action.payload.kiosks
      })
      .addCase(loadMerchantDetail.rejected, (state, action) => {
        state.loadingDetail = false
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export const { clearMerchantDetail } = merchantSlice.actions
export default merchantSlice.reducer
