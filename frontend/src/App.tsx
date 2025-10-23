import Register from './pages/Register'
import { Routes, Route } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <>
		<ParticleBackground />
		<Routes>
			<Route path="/" element={<Register />} />
			<Route path="/dashboard" element={<Dashboard />} />
		</Routes>
    </>
  )
}

export default App
