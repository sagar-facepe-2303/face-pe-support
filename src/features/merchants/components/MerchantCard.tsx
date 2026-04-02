import type { MerchantRow } from '../merchantAPI'
import { formatDisplayDate } from '../../../core/utils/helpers'
import './MerchantCard.css'

interface MerchantCardProps {
  merchant: MerchantRow
  onOpen?: (id: string) => void
}

export function MerchantCard({ merchant, onOpen }: MerchantCardProps) {
  const initials = merchant.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="merchant-card">
      <div className="merchant-card__identity">
        <div className="merchant-card__avatar" aria-hidden>
          {initials}
        </div>
        <div>
          <h3 className="merchant-card__name">{merchant.name}</h3>
          <p className="merchant-card__meta">
            {merchant.category} · {merchant.location}
          </p>
        </div>
      </div>
      <p className="merchant-card__email">{merchant.email}</p>
      <span className={`merchant-card__status merchant-card__status--${merchant.status.toLowerCase()}`}>
        {merchant.status}
      </span>
      <time className="merchant-card__date" dateTime={merchant.registeredAt}>
        {formatDisplayDate(merchant.registeredAt)}
      </time>
      {onOpen ? (
        <button
          type="button"
          className="merchant-card__kebab"
          aria-label={`Open actions for ${merchant.name}`}
          onClick={() => onOpen(merchant.id)}
        >
          ⋮
        </button>
      ) : null}
    </article>
  )
}
