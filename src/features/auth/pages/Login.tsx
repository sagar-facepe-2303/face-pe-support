import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { clearError, login } from "../authSlice";
import { ROUTES } from "../../../core/config/routes";
import facepeLogoMark from "../../../assets/images/facepe-logo.png";
import "./Login.css";

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector((s) => s.auth.token);
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? ROUTES.HOME;

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, from, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(
      login({ email, password, rememberDevice: remember }),
    );
    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__brand" aria-hidden>
        <img src={facepeLogoMark} alt="" className="login-page__logo-image" />
        <p className="login-page__brand-title">FacePe</p>
      </div>

      <section className="login-page__panel" aria-label="Login form">
        <h1 className="login-page__title">Welcome Back</h1>
        <p className="login-page__subtitle">
          Enter your credentials to access your account
        </p>
        <form className="login-page__form" onSubmit={handleSubmit} noValidate>
          <fieldset className="login-page__fieldset">
            <legend className="login-page__legend">E-mail</legend>
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </fieldset>

          <fieldset className="login-page__fieldset">
            <legend className="login-page__legend">Password</legend>
            <div className="login-page__input-wrap">
              <span className="login-page__input-icon" aria-hidden>
                🔒
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="login-page__input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-page__eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                👁
              </button>
            </div>
          </fieldset>

          <label className="login-page__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          {error ? (
            <p className="login-page__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="login-page__submit btn--primary"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </section>
    </div>
  );
}
