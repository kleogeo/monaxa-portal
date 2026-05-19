import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TeamView from './pages/TeamView'
import Tasks from './pages/Tasks'
import Cases from './pages/Cases'
import Calendar from './pages/Calendar'
import Admin from './pages/Admin'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Layout><TeamView /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><Layout><Cases /></Layout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
