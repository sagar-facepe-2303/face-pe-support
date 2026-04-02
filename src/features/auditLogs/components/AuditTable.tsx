import type { AuditLogRow } from '../auditAPI'
import { formatDisplayDate } from '../../../core/utils/helpers'
import './AuditTable.css'

interface AuditTableProps {
  rows: AuditLogRow[]
}

export function AuditTable({ rows }: AuditTableProps) {
  return (
    <div className="audit-table-wrap">
      <table className="audit-table">
        <caption className="visually-hidden">Audit log entries</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Actor</th>
            <th scope="col">Action</th>
            <th scope="col">Resource</th>
            <th scope="col">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <time dateTime={r.at}>{formatDisplayDate(r.at)}</time>
              </td>
              <td>{r.actor}</td>
              <td>{r.action}</td>
              <td>{r.resource}</td>
              <td>
                <span className={`audit-table__sev audit-table__sev--${r.severity}`}>
                  {r.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
