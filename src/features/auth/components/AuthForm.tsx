import type { FormEvent, ReactNode } from 'react'
import './AuthForm.css'

interface AuthFormProps {
  title: string
  subtitle: string
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  footer?: ReactNode
  'aria-labelledby'?: string
}

export function AuthForm({
  title,
  subtitle,
  onSubmit,
  children,
  footer,
  'aria-labelledby': ariaLabelledBy,
}: AuthFormProps) {
  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <h2 className="auth-form__title" id={ariaLabelledBy}>
          {title}
        </h2>
        <p className="auth-form__subtitle">{subtitle}</p>
      </div>
      <form className="auth-form__body" onSubmit={onSubmit} noValidate>
        {children}
      </form>
      {footer ? <div className="auth-form__footer">{footer}</div> : null}
    </div>
  )
}
