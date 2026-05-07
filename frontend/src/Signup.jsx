import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from './api'
import toast from 'react-hot-toast'
import './auth.css'

function getStrength(pwd) {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 6)  score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthClasses = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong']

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: details, 2: otp verify
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(0)
  const [otpMessage, setOtpMessage] = useState('')

  const strength = getStrength(form.password)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const err = {}
    if (!form.name || form.name.trim().length < 2)
      err.name = 'Name must be at least 2 characters'
    if (!form.email)
      err.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      err.email = 'Enter a valid email'
    if (!form.password || form.password.length < 6)
      err.password = 'Password must be at least 6 characters'
    return err
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    
    setLoading(true)
    setServerError('')
    try {
      // Step 1: Initiate signup and get OTP
      const response = await authApi.initiateSignup(form)
      setOtpExpiry(response.data.expiresIn)
      setOtpMessage(response.data.message)
      setStep(2)
      toast.success('OTP sent to your email!')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to initiate signup')
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
      // Step 2: Complete signup with OTP verification
      const response = await authApi.completeSignup({
        name: form.name,
        email: form.email,
        password: form.password,
        otpCode: otp
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to verify OTP')
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
          {step === 1 ? 'Create account' : 'Verify Email'}
        </h1>
        <p className="auth-subtitle">
          {step === 1 
            ? 'Start managing your team\'s tasks in minutes'
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
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
              {errors.name && (
                <div className="form-error"><AlertCircle size={12} />{errors.name}</div>
              )}
            </div>

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
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

              {/* Password strength indicator */}
              {form.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`strength-bar ${strength >= i ? strengthClasses[strength] : ''}`}
                      />
                    ))}
                  </div>
                  <span className="strength-label">{strengthLabels[strength]}</span>
                </div>
              )}

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
                <><div className="btn-spinner" />Creating account...</>
              ) : 'Create Account'}
            </button>

            <button 
              type="button" 
              className="auth-link-btn"
              onClick={() => setStep(1)}
            >
              Back to details
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}