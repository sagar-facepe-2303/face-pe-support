import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loadAuditLogs } from '../auditSlice'
import { AuditTable } from '../components/AuditTable'
import '../../../layout/Layout.css'
import './AuditLogs.css'

export function AuditLogs() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((s) => s.auditLogs.items)
  const loading = useAppSelector((s) => s.auditLogs.loading)

  useEffect(() => {
    dispatch(loadAuditLogs())
  }, [dispatch])

  return (
    <div className="audit-logs page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Compliance</p>
          <h1 className="page-title">Audit logs</h1>
          <p className="page-desc">
            Immutable record of administrative actions across the workspace.
          </p>
        </div>
        <button type="button" className="btn btn--secondary btn--sm">
          Export CSV
        </button>
      </header>

      <section className="audit-logs__card card-surface" aria-live="polite">
        {loading ? (
          <p className="audit-logs__loading" role="status">
            Loading audit logs…
          </p>
        ) : (
          <AuditTable rows={items} />
        )}
      </section>
    </div>
  )
}
