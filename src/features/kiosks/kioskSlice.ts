import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import type { Paged } from '../../core/api/pagination'
import * as kioskAPI from './kioskAPI'
import type { KioskDetail, KioskRow, ListKiosksParams } from './kioskAPI'
import * as merchantAPI from '../merchants/merchantAPI'

export interface KioskListMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface KioskState {
  list: KioskRow[]
  listMeta: KioskListMeta
  lastListParams: ListKiosksParams
  current: KioskDetail | null
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
}

const defaultListParams: ListKiosksParams = {
  page: 1,
  pageSize: 20,
  q: '',
  network: '',
}

const initialState: KioskState = {
  list: [],
  listMeta: {
    page: 1,
    pageSize: defaultListParams.pageSize,
    totalItems: 0,
    totalPages: 0,
  },
  lastListParams: defaultListParams,
  current: null,
  loadingList: false,
  loadingDetail: false,
  error: null,
}

export const loadKiosks = createAsyncThunk<Paged<KioskRow>, ListKiosksParams | undefined>(
  'kiosks/loadAll',
  async (params, { rejectWithValue }) => {
    try {
      const p = params ?? defaultListParams
      return await kioskAPI.fetchKiosksPaged(p)
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const loadKioskDetail = createAsyncThunk(
  'kiosks/loadDetail',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const merchantScopeId = (getState() as RootState).auth.user?.merchantId
      return await kioskAPI.fetchKioskById(id, merchantScopeId ?? null)
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const removeKiosk = createAsyncThunk(
  'kiosks/delete',
  async (
    { merchantId, kioskId }: { merchantId: string; kioskId: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      await merchantAPI.deleteMerchantKiosk(merchantId, kioskId)
      const { lastListParams } = (getState() as RootState).kiosks
      await dispatch(loadKiosks(lastListParams)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
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
        const arg = action.meta.arg ?? state.lastListParams
        state.lastListParams = arg
        state.list = action.payload.items
        state.listMeta = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          totalItems: action.payload.totalItems,
          totalPages: action.payload.totalPages,
        }
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
        state.current = null
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export const { clearKioskDetail } = kioskSlice.actions
export default kioskSlice.reducer
