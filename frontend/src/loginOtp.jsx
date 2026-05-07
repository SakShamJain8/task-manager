import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'
import { useAuth } from './components/AuthContext'
import { authApi } from './api'
import toast from 'react-hot-toast'
import './auth.css'

export default function LoginOtp() {
  const navigate = useNavigate()
  const { loginOtpUser } = useAuth()
  const [step, setStep] = useState(1) // 1: email, 2: otp
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(0)

  const handleEmailSubmit = async e => {
    e.preventDefault()
    const err = {}
    if (!email) err.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) err.email = 'Enter a valid email'

    if (Object.keys(err).length) {
      setErrors(err)
      return
    }

    setLoading(true)
    setServerError('')
    try {
      const response = await authApi.requestLoginOtp({ email, purpose: 'login' })
      setOtpExpiry(response.data.expiresIn)
      setStep(2)
      toast.success('OTP sent to your email!')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to request OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async e => {
    e.preventDefault()
    const err = {}
    if (!otp) err.otp = 'OTP is required'
    else if (!/^\d{6}$/.test(otp)) err.otp = 'OTP must be 6 digits'

    if (Object.keys(err).length) {
      setErrors(err)
      return
    }

    setLoading(true)
    setServerError('')
    try {
      const response = await authApi.loginWithOtp({ email, code: otp, purpose: 'login' })
      loginOtpUser(response.data)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (setter, field) => e => {
    setter(e.target.value)
    setErrors(err => ({ ...err, [field]: '' }))
    setServerError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark"><Zap size={20} /></div>
          <span className="auth-logo-text">Task Manager</span>
        </div>

        <h1 className="auth-title">
          {step === 1 ? 'Welcome back' : 'Verify OTP'}
        </h1>
        <p className="auth-subtitle">
          {step === 1 
            ? 'Sign in with a one-time password sent to your email'
            : `Enter the 6-digit code sent to ${email}`}
        </p>

        {/* Server error banner */}
        {serverError && (
          <div className="auth-error-banner">
            <AlertCircle size={15} />
            {serverError}
          </div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={handleChange(setEmail, 'email')}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <div className="form-error"><AlertCircle size={12} />{errors.email}</div>
              )}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <><div className="btn-spinner" />Sending OTP...</>
              ) : (
                <>
                  <Lock size={16} />
                  Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleOtpSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={handleChange(setOtp, 'otp')}
                maxLength="6"
                autoFocus
                inputMode="numeric"
              />
              {errors.otp && (
                <div className="form-error"><AlertCircle size={12} />{errors.otp}</div>
              )}
              {otpExpiry > 0 && (
                <div className="form-hint">Expires in {otpExpiry} seconds</div>
              )}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <><div className="btn-spinner" />Verifying...</>
              ) : 'Verify OTP'}
            </button>

            <button 
              type="button" 
              className="auth-link-btn"
              onClick={() => setStep(1)}
            >
              Use different email
            </button>
          </form>
        )}

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup-otp">Create one free</Link>
        </div>
      </div>
    </div>
  )
}
