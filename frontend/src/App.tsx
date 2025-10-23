import Register from './pages/Register'
import { Routes, Route } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Dashboard from './pages/Dashboard'
import PublicPaymentPage from './pages/Payment'

function App() {
  return (
    <>
		<ParticleBackground />
		<Routes>
			<Route path="/" element={<Register />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/payment/:slug" element={<PublicPaymentPage />} />
		</Routes>
    </>
  )
}

export default App
