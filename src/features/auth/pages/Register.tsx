import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { clearError, register } from '../authSlice'
import { ROUTES } from '../../../core/config/routes'
import './Register.css'

type AccountType = 'merchant' | 'kiosk_operator'

export function Register() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const token = useAppSelector((s) => s.auth.token)
  const status = useAppSelector((s) => s.auth.status)
  const error = useAppSelector((s) => s.auth.error)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('merchant')

  useEffect(() => {
    if (token) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }, [token, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      return
    }
    const result = await dispatch(
      register({ firstName, lastName, email, password, accountType })
    )
    if (register.fulfilled.match(result)) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }

  return (
    <div className="register-page">
      <aside className="register-page__aside" aria-label="Product overview">
        <div className="register-page__aside-inner">
          <div className="register-page__aside-logo">FacePe</div>
          <h1 className="register-page__headline">
            Empower your <span className="register-page__accent">commerce</span> journey.
          </h1>
          <p className="register-page__lede">
            Join the next generation of merchant orchestration. Access real-time support, kiosk
            analytics, and user management in one unified workspace.
          </p>
          <div className="register-page__feature-row">
            <div className="register-page__feature-card">
              <span className="register-page__feature-icon" aria-hidden />
              <div>
                <div className="register-page__feature-title">Merchant Portal</div>
                <div className="register-page__feature-desc">Operations &amp; settlements</div>
              </div>
            </div>
            <div className="register-page__feature-card">
              <span className="register-page__feature-icon register-page__feature-icon--kiosk" aria-hidden />
              <div>
                <div className="register-page__feature-title">Kiosk Control</div>
                <div className="register-page__feature-desc">Health &amp; remote actions</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="register-page__form-col">
        <div className="register-page__form-card card-surface">
          <header className="register-page__form-head">
            <h2 className="register-page__form-title">Merchant Registration</h2>
            <p className="register-page__form-sub">
              Fill in the details to start your administrative workspace.
            </p>
          </header>

          <form className="register-page__form" onSubmit={handleSubmit} noValidate>
            <section className="register-page__section" aria-labelledby="reg-identity">
              <h3 id="reg-identity" className="register-page__section-title">
                <span className="register-page__section-bar" aria-hidden />
                Identity details
              </h3>
              <div className="register-page__grid-2">
                <div className="register-page__field">
                  <label htmlFor="reg-first" className="register-page__label">
                    First name
                  </label>
                  <input
                    id="reg-first"
                    className="register-page__input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="register-page__field">
                  <label htmlFor="reg-last" className="register-page__label">
                    Last name
                  </label>
                  <input
                    id="reg-last"
                    className="register-page__input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="register-page__field">
                <label htmlFor="reg-email" className="register-page__label">
                  Business email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="register-page__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </section>

            <section className="register-page__section" aria-labelledby="reg-account">
              <h3 id="reg-account" className="register-page__section-title">
                <span className="register-page__section-bar" aria-hidden />
                Account type
              </h3>
              <div className="register-page__account-grid" role="listbox" aria-label="Account type">
                <button
                  type="button"
                  role="option"
                  aria-selected={accountType === 'merchant'}
                  className={`register-page__account-card${accountType === 'merchant' ? ' register-page__account-card--selected' : ''}`}
                  onClick={() => setAccountType('merchant')}
                >
                  <span className="register-page__account-icon" aria-hidden />
                  <div>
                    <div className="register-page__account-name">Merchant</div>
                    <div className="register-page__account-hint">Store owner / manager</div>
                  </div>
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={accountType === 'kiosk_operator'}
                  className={`register-page__account-card${accountType === 'kiosk_operator' ? ' register-page__account-card--selected' : ''}`}
                  onClick={() => setAccountType('kiosk_operator')}
                >
                  <span
                    className="register-page__account-icon register-page__account-icon--kiosk"
                    aria-hidden
                  />
                  <div>
                    <div className="register-page__account-name">Kiosk Operator</div>
                    <div className="register-page__account-hint">Technical manager</div>
                  </div>
                </button>
              </div>
            </section>

            <section className="register-page__section" aria-labelledby="reg-security">
              <h3 id="reg-security" className="register-page__section-title">
                <span className="register-page__section-bar" aria-hidden />
                Security
              </h3>
              <div className="register-page__grid-2">
                <div className="register-page__field">
                  <label htmlFor="reg-pass" className="register-page__label">
                    Password
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    className="register-page__input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="register-page__field">
                  <label htmlFor="reg-confirm" className="register-page__label">
                    Confirm password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    className="register-page__input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {password && confirm && password !== confirm ? (
                <p className="register-page__error" role="alert">
                  Passwords must match.
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="register-page__error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="register-page__submit btn btn--primary"
              disabled={status === 'loading' || password !== confirm}
            >
              {status === 'loading' ? 'Initializing…' : 'Initialize Workspace →'}
            </button>

            <p className="register-page__switch">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="register-page__switch-link">
                Sign In to FacePe
              </Link>
            </p>

            <nav className="register-page__legal" aria-label="Legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#support">Support Center</a>
            </nav>
          </form>
        </div>
      </div>
    </div>
  )
}
