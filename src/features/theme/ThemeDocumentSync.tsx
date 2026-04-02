import { useEffect } from 'react'
import { useAppSelector } from '../../app/hooks'
import { THEME_STORAGE_KEY } from './themeSlice'

/** Applies Redux theme to `document.documentElement` and persists to localStorage */
export function ThemeDocumentSync() {
  const mode = useAppSelector((s) => s.theme.mode)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  return null
}
