import { Provider } from 'react-redux'
import { store } from './app/store'
import { ThemeDocumentSync } from './features/theme/ThemeDocumentSync'
import { AppRoutes } from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <Provider store={store}>
      <ThemeDocumentSync />
      <AppRoutes />
    </Provider>
  )
}

export default App
