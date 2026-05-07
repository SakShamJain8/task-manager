import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './components/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './login'
import Signup from './Signup'
import LoginOtp from './loginOtp'
import SignupOtp from './signupOtp'
import Dashboard from './components/dashboard'
import ProjectList from './components/projects'
import ProjectDetail from './components/projectDetail'
import MyTasks from './components/myTasks'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const token = localStorage.getItem('token')
  if (loading) return <div className="auth-page"><div className="spinner" /></div>
  return user || token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-page"><div className="spinner" /></div>
  return !user ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/login-otp" element={<PublicRoute><LoginOtp /></PublicRoute>} />
      <Route path="/signup-otp" element={<PublicRoute><SignupOtp /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="my-tasks" element={<MyTasks />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d24',
              color: '#eef0f5',
              border: '1px solid #2a2f3a',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem'
            },
            success: { iconTheme: { primary: '#00e5c0', secondary: '#0d0e11' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}