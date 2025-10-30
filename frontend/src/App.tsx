import Register from './pages/Register'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PublicPaymentPage from './pages/Payment'
import TermsOfService from './pages/Terms'
import PrivacyPolicy from './pages/Privacy'
import { Seo } from './components/Seo'

function App() {
  return (
    <>
      <Seo />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payment/:slug" element={<PublicPaymentPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </>
  )
}

export default App
