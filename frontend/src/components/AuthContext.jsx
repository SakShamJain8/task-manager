import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Set loading to false after a short delay to allow the user state from localStorage to be used
      const timer = setTimeout(() => setLoading(false), 100)
      
      // Validate token with backend, but don't clear state if it fails
      authApi.me()
        .then(res => setUser(res.data))
        .catch(() => {
          // Token might be expired, but don't clear it yet
          // Let the interceptor handle 401 errors
          console.warn('Token validation failed')
        })
      
      return () => clearTimeout(timer)
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials)
    const { token, ...userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const signup = useCallback(async (data) => {
    const res = await authApi.signup(data)
    const { token, ...userData } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const loginOtpUser = useCallback((response) => {
    const { token, ...userData } = response
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, loginOtpUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}