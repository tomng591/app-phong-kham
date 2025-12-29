import { AppProvider } from './context/AppContext'
import { PageContainer } from './components/layout/PageContainer'

function App() {
  return (
    <AppProvider>
      <PageContainer />
    </AppProvider>
  )
}

export default App
