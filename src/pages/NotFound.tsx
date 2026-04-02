import { Link } from 'react-router-dom'
import { ROUTES } from '../core/config/routes'
import '../layout/Layout.css'
import './NotFound.css'

export function NotFound() {
  return (
    <main className="not-found" role="main">
      <div className="not-found__card">
        <p className="not-found__code" aria-hidden>
          404
        </p>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__text">
          The page you are looking for does not exist or was moved.
        </p>
        <Link to={ROUTES.HOME} className="not-found__btn btn btn--primary">
          Go home
        </Link>
      </div>
    </main>
  )
}
