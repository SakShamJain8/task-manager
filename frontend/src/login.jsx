import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from './api'
import toast from 'react-hot-toast'
import './auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: credentials, 2: otp verify
  const [form, setForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(0)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const err = {}
    if (!form.email) err.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Enter a valid email'
    if (!form.password) err.password = 'Password is required'
    return err
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    
    setLoading(true)
    setServerError('')
    try {
      // Step 1: Verify credentials and get OTP
      const response = await authApi.initiateLogin(form)
      setOtpExpiry(response.data.expiresIn)
      setStep(2)
      toast.success('OTP sent to your email!')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid email or password')
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
      // Step 2: Complete login with OTP verification
      const response = await authApi.completeLogin({
        email: form.email,
        otpCode: otp
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
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
          {step === 1 ? 'Welcome back' : 'Verify Login'}
        </h1>
        <p className="auth-subtitle">
          {step === 1 
            ? 'Sign in to your workspace and pick up where you left off'
            : `Enter the 6-digit code sent to ${form.email}`}
        </p>

        {/* Server error banner */}
        {serverError && (
          <div className="auth-error-banner">
            <AlertCircle size={15} />
            {serverError}
          </div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <div className="form-error"><AlertCircle size={12} />{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div className="form-error"><AlertCircle size={12} />{errors.password}</div>
              )}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <><div className="btn-spinner" />Sending code...</>
              ) : 'Continue to Verification'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleOtpSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={e => {
                  setOtp(e.target.value)
                  setErrors(err => ({ ...err, otp: '' }))
                  setServerError('')
                }}
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
              ) : 'Verify and Sign In'}
            </button>

            <button 
              type="button" 
              className="auth-link-btn"
              onClick={() => setStep(1)}
            >
              Use different credentials
            </button>
          </form>
        )}

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
        </div>
      </div>
    </div>
  )
}