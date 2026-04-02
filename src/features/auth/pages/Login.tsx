import { type FormEvent, useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearError, login } from '../authSlice'
import { ROUTES } from '../../../core/config/routes'
import { ThemeToggle } from '../../../layout/ThemeToggle'
import { AuthForm } from '../components/AuthForm'
import './Login.css'

export function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const formTitleId = useId()
  const token = useAppSelector((s) => s.auth.token)
  const status = useAppSelector((s) => s.auth.status)
  const error = useAppSelector((s) => s.auth.error)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? ROUTES.HOME

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true })
    }
  }, [token, from, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = await dispatch(login({ email, password, rememberDevice: remember }))
    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__theme">
        <ThemeToggle />
      </div>
      <div className="login-page__hero">
        <div className="login-page__brand">
          <span className="login-page__logo" aria-hidden />
          <div>
            <div className="login-page__brand-title">FacePe Support</div>
            <p className="login-page__brand-tag">
              The orchestrated workspace for administrators
            </p>
          </div>
        </div>
      </div>

      <div className="login-page__panel">
        <AuthForm
          aria-labelledby={formTitleId}
          title="Welcome back"
          subtitle="Please enter your credentials to access the workspace."
          onSubmit={handleSubmit}
          footer={
            <>
              Authorized access only. Unauthorized attempts are logged. Need help?{' '}
              <a href="#security">Contact Security Team</a>
            </>
          }
        >
          <div className="login-page__field">
            <label htmlFor="login-email" className="login-page__label">
              Work Email
            </label>
            <div className="login-page__input-wrap">
              <span className="login-page__input-icon" aria-hidden>
                ✉
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                className="login-page__input"
                placeholder="agent@facepe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-page__field">
            <div className="login-page__label-row">
              <label htmlFor="login-password" className="login-page__label">
                Password
              </label>
              <button type="button" className="login-page__link-btn">
                Forgot password?
              </button>
            </div>
            <div className="login-page__input-wrap">
              <span className="login-page__input-icon" aria-hidden>
                🔒
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="login-page__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-page__eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                👁
              </button>
            </div>
          </div>

          <label className="login-page__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember this device</span>
          </label>

          {error ? (
            <p className="login-page__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="login-page__submit btn btn--primary"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign In to Workspace'} →
          </button>

          <p className="login-page__switch">
            New to FacePe? <Link to={ROUTES.REGISTER}>Create workspace</Link>
          </p>
        </AuthForm>
      </div>

      <div className="login-page__status-bar" role="status" aria-live="polite">
        <span>
          <span className="login-page__dot" aria-hidden /> MAINNET LIVE
        </span>
        <span>🔒 END-TO-END ENCRYPTED</span>
        <span>V4.2.0-STABLE</span>
      </div>
    </div>
  )
}
