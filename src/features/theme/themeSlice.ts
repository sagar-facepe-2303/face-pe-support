import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export const THEME_STORAGE_KEY = 'facepe-theme'

export type ThemeMode = 'light' | 'dark'

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

interface ThemeState {
  mode: ThemeMode
}

const initialState: ThemeState = {
  mode: readStoredTheme(),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload
    },
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },
    hydrateTheme(state, action: PayloadAction<ThemeMode | undefined>) {
      if (action.payload === 'dark' || action.payload === 'light') {
        state.mode = action.payload
      } else {
        state.mode = readStoredTheme()
      }
    },
  },
})

export const { setTheme, toggleTheme, hydrateTheme } = themeSlice.actions
export default themeSlice.reducer
