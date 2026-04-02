import type { PlatformUserDetail } from '../userAPI'
import { formatCurrency, formatDisplayDate } from '../../../core/utils/helpers'
import './UserInfo.css'

interface UserInfoProps {
  user: PlatformUserDetail
}

export function UserInfo({ user }: UserInfoProps) {
  return (
    <section className="user-info card-surface" aria-labelledby="user-info-heading">
      <h2 id="user-info-heading" className="visually-hidden">
        Profile details
      </h2>
      <div className="user-info__profile">
        <div className="user-info__avatar-wrap">
          <div className="user-info__avatar" aria-hidden>
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="user-info__online" aria-label="Account active" />
        </div>
        <p className="user-info__code">{user.userCode}</p>
        <div className="user-info__badges">
          <span className="user-info__badge user-info__badge--premium">Premium member</span>
          <span className="user-info__badge user-info__badge--verified">Verified</span>
        </div>
      </div>
      <dl className="user-info__dl">
        <div className="user-info__row">
          <dt>Email address</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="user-info__row">
          <dt>Phone number</dt>
          <dd>{user.phone}</dd>
        </div>
        <div className="user-info__row">
          <dt>Registered date</dt>
          <dd>
            <time dateTime={user.createdAt}>{formatDisplayDate(user.createdAt)}</time>
          </dd>
        </div>
        <div className="user-info__row">
          <dt>Last login</dt>
          <dd>{user.lastLogin}</dd>
        </div>
      </dl>
      <div className="user-info__metrics" aria-label="Spend summary">
        <div>
          <p className="user-info__metric-label">Total spent</p>
          <p className="user-info__metric-value">{formatCurrency(user.totalSpent)}</p>
          <span className="user-info__trend">{user.spentTrend}</span>
        </div>
        <div>
          <p className="user-info__metric-label">Failed trans.</p>
          <p className="user-info__metric-value">{user.failedTransactions}</p>
          <span className="user-info__hint">Across {user.totalTransactions} total</span>
        </div>
        <div>
          <p className="user-info__metric-label">Support requests</p>
          <p className="user-info__metric-value">{user.supportRequestsOpen}</p>
          <span className="user-info__active">Active</span>
        </div>
      </div>
    </section>
  )
}
