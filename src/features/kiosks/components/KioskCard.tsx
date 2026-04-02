import type { KioskRow } from '../kioskAPI'
import './KioskCard.css'

interface KioskCardProps {
  kiosk: KioskRow
  onOpen?: (id: string) => void
}

export function KioskCard({ kiosk, onOpen }: KioskCardProps) {
  return (
    <article className="kiosk-card">
      <div className="kiosk-card__row">
        <button
          type="button"
          className="kiosk-card__serial"
          onClick={() => onOpen?.(kiosk.id)}
        >
          {kiosk.serialId}
        </button>
        <span
          className={`kiosk-card__net kiosk-card__net--${kiosk.networkStatus.toLowerCase()}`}
        >
          {kiosk.networkStatus}
        </span>
      </div>
      <p className="kiosk-card__loc">📍 {kiosk.location}</p>
      <div className="kiosk-card__health">
        <span className="kiosk-card__health-pct">{kiosk.healthPct}%</span>
        <span className="kiosk-card__health-label">{kiosk.healthLabel}</span>
      </div>
      <p className="kiosk-card__sync">Last sync: {kiosk.lastSync}</p>
      <button
        type="button"
        className="kiosk-card__more"
        aria-label={`More actions for ${kiosk.serialId}`}
      >
        ⋮
      </button>
    </article>
  )
}
