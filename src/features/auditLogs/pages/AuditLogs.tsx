import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { loadAuditLogs } from "../auditSlice";
import { AuditTable } from "../components/AuditTable";
import "../../../layout/Layout.css";
import "./AuditLogs.css";

const PAGE_SIZE = 20;

export function AuditLogs() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.auditLogs.items);
  const loading = useAppSelector((s) => s.auditLogs.loading);
  const error = useAppSelector((s) => s.auditLogs.error);
  const page = useAppSelector((s) => s.auditLogs.page);
  const totalPages = useAppSelector((s) => s.auditLogs.totalPages);
  const totalItems = useAppSelector((s) => s.auditLogs.totalItems);
  const pageSize = useAppSelector((s) => s.auditLogs.pageSize);

  const [curPage, setCurPage] = useState(1);

  useEffect(() => {
    void dispatch(loadAuditLogs({ page: curPage, pageSize: PAGE_SIZE }));
  }, [dispatch, curPage]);

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="audit-logs page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Compliance</p>
          <h1 className="page-title">Audit logs</h1>
          <p className="page-desc">
            View a list of user activities, including actions, who performed
            them, and when they occurred.
          </p>
        </div>
      </header>

      {error ? (
        <p className="audit-logs__err-banner" role="alert">
          {error}
        </p>
      ) : null}

      <section className="audit-logs__card card-surface" aria-live="polite">
        {loading ? (
          <p className="audit-logs__loading" role="status">
            Loading audit logs…
          </p>
        ) : (
          <>
            <AuditTable rows={items} />
            <footer className="audit-logs__footer">
              <span className="audit-logs__meta">
                Showing {start}–{end} of {totalItems.toLocaleString()} entries
              </span>
              <nav className="audit-logs__pager" aria-label="Pagination">
                <button
                  type="button"
                  className="audit-logs__page-btn"
                  disabled={curPage <= 1 || loading}
                  aria-label="Previous page"
                  onClick={() => setCurPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                <span className="audit-logs__page-current" aria-current="page">
                  {curPage} / {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  className="audit-logs__page-btn"
                  disabled={
                    curPage >= totalPages || loading || totalPages === 0
                  }
                  aria-label="Next page"
                  onClick={() => setCurPage((p) => p + 1)}
                >
                  ›
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
