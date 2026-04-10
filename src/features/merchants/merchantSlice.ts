import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getApiErrorMessage } from '../../core/api/parseApiError'
import * as merchantAPI from './merchantAPI'
import type {
  CreateKioskRequest,
  CreateMerchantRequest,
  ListMerchantsParams,
  MerchantDetail,
  MerchantKioskRow,
  MerchantRow,
  UpdateKioskRequest,
  UpdateMerchantRequest,
} from './merchantAPI'
import type { Paged } from '../../core/api/pagination'

export interface MerchantListMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface MerchantState {
  list: MerchantRow[]
  listMeta: MerchantListMeta
  lastListParams: ListMerchantsParams
  current: MerchantDetail | null
  kiosks: MerchantKioskRow[]
  loadingList: boolean
  loadingDetail: boolean
  error: string | null
}

const defaultListParams: ListMerchantsParams = {
  page: 1,
  pageSize: 20,
  q: '',
  status: '',
}

const initialState: MerchantState = {
  list: [],
  listMeta: {
    page: 1,
    pageSize: defaultListParams.pageSize,
    totalItems: 0,
    totalPages: 0,
  },
  lastListParams: defaultListParams,
  current: null,
  kiosks: [],
  loadingList: false,
  loadingDetail: false,
  error: null,
}

export const loadMerchants = createAsyncThunk<Paged<MerchantRow>, ListMerchantsParams | undefined>(
  'merchants/loadAll',
  async (params, { rejectWithValue }) => {
    try {
      const p = params ?? defaultListParams
      return await merchantAPI.fetchMerchantsPaged(p)
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

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
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const createMerchant = createAsyncThunk(
  'merchants/create',
  async (payload: CreateMerchantRequest, { dispatch, getState, rejectWithValue }) => {
    try {
      const created = await merchantAPI.createMerchant(payload)
      const { lastListParams } = (getState() as RootState).merchants
      await dispatch(loadMerchants(lastListParams)).unwrap()
      return created
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const updateMerchantRecord = createAsyncThunk(
  'merchants/update',
  async (
    { merchantId, payload }: { merchantId: string; payload: UpdateMerchantRequest },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      await merchantAPI.updateMerchant(merchantId, payload)
      const { lastListParams } = (getState() as RootState).merchants
      await dispatch(loadMerchants(lastListParams)).unwrap()
      await dispatch(loadMerchantDetail(merchantId)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const removeMerchant = createAsyncThunk(
  'merchants/delete',
  async (merchantId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      await merchantAPI.deleteMerchant(merchantId)
      const { lastListParams } = (getState() as RootState).merchants
      await dispatch(loadMerchants(lastListParams)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const createMerchantKiosk = createAsyncThunk(
  'merchants/createKiosk',
  async (
    { merchantId, payload }: { merchantId: string; payload: CreateKioskRequest },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await merchantAPI.createMerchantKiosk(merchantId, payload)
      await dispatch(loadMerchantDetail(merchantId)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const updateMerchantKiosk = createAsyncThunk(
  'merchants/updateKiosk',
  async (
    {
      merchantId,
      kioskId,
      payload,
    }: { merchantId: string; kioskId: string; payload: UpdateKioskRequest },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await merchantAPI.updateMerchantKiosk(merchantId, kioskId, payload)
      await dispatch(loadMerchantDetail(merchantId)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
    }
  }
)

export const deleteMerchantKiosk = createAsyncThunk(
  'merchants/deleteKiosk',
  async (
    { merchantId, kioskId }: { merchantId: string; kioskId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await merchantAPI.deleteMerchantKiosk(merchantId, kioskId)
      await dispatch(loadMerchantDetail(merchantId)).unwrap()
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e))
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
        state.current = null
        state.kiosks = []
        state.error = (action.payload as string) ?? 'Error'
      })
  },
})

export const { clearMerchantDetail } = merchantSlice.actions
export default merchantSlice.reducer
