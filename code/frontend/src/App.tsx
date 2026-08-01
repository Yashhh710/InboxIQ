import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Live from './pages/Live'
import Messages from './pages/Messages'
import Analytics from './pages/Analytics'
import Business from './pages/Business'
import Command from './pages/Command'
import Inspector from './pages/Inspector'
import Settings from './pages/Settings'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

function AppContent() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check API connectivity
    const checkConnection = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/health`)
        setIsConnected(response.ok)
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Router>
      <Layout isConnected={isConnected}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<Live />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/business" element={<Business />} />
          <Route path="/command" element={<Command />} />
          <Route path="/Command" element={<Command />} />
          <Route path="/inspector" element={<Inspector />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
