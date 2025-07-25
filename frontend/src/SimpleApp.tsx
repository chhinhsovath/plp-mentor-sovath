import { Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import './index.css'

function SimpleApp() {
  return (
    <ConfigProvider>
      <div>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </ConfigProvider>
  )
}

export default SimpleApp