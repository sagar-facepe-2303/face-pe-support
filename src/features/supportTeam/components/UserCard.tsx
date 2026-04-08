import type { SupportAgent } from '../supportAPI'
import './UserCard.css'

interface UserCardProps {
  agent: SupportAgent
}

export function UserCard({ agent }: UserCardProps) {
  const pct = agent.assignedTasks.total
    ? Math.round((agent.assignedTasks.done / agent.assignedTasks.total) * 100)
    : 0
  const roleClass = agent.roleLabel.replaceAll('_', '-')
  const roleLabel = agent.roleLabel.replaceAll('_', ' ').toUpperCase()

  return (
    <article className="user-card">
      <div className="user-card__avatar" aria-hidden>
        {agent.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>
      <div className="user-card__body">
        <div className="user-card__row">
          <h3 className="user-card__name">{agent.name}</h3>
          <span className={`user-card__role user-card__role--${roleClass}`}>
            {roleLabel}
          </span>
        </div>
        <p className="user-card__email">{agent.email}</p>
        <div className="user-card__meta">
          <span
            className={`user-card__status user-card__status--${agent.status}`}
            aria-label={agent.status === 'online' ? 'Online' : 'Offline'}
          >
            <span className="user-card__dot" aria-hidden />
            {agent.status === 'online' ? 'Online' : 'Offline'}
          </span>
          <span className="user-card__activity">{agent.activity}</span>
        </div>
        <div className="user-card__tasks" aria-label="Assigned tasks progress">
          <div className="user-card__tasks-bar" role="presentation">
            <span className="user-card__tasks-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="user-card__tasks-label">
            {agent.assignedTasks.done}/{agent.assignedTasks.total}
          </span>
        </div>
      </div>
    </article>
  )
}
