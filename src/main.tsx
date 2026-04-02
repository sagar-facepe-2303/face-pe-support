import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { store } from './app/store'
import { attachInterceptors } from './core/api/interceptors'
import api from './core/api/axios'
import './index.css'
import App from './App.tsx'

attachInterceptors(store, api)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
