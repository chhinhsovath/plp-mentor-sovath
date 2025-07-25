import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'

function App() {
  const { i18n } = useTranslation()

  return (
    <AuthProvider>
      <Box sx={{ direction: i18n.language === 'km' ? 'ltr' : 'ltr' }}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Box>
    </AuthProvider>
  )
}

export default App