import { Provider } from 'react-redux'
import { store } from './app/store'
import { AppRoutes } from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  )
}

export default App
