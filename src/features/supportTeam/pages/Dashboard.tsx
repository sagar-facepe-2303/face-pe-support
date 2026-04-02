import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { loadDashboardMetrics } from "../supportSlice";
import { formatCompactNumber } from "../../../core/utils/helpers";
import "../../../layout/Layout.css";
import "./Dashboard.css";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const metrics = useAppSelector((s) => s.support.metrics);
  const loading = useAppSelector((s) => s.support.loadingMetrics);

  useEffect(() => {
    dispatch(loadDashboardMetrics());
  }, [dispatch]);

  return (
    <div className="dashboard page-shell">
      <section className="dashboard__summary" aria-label="Workspace summary">
        <article className="dashboard__stat card-surface">
          <h2 className="dashboard__stat-label">Total merchants</h2>
          <p className="dashboard__stat-value" aria-live="polite">
            {loading || !metrics
              ? "—"
              : formatCompactNumber(metrics.totalMerchants)}
          </p>
          <span className="dashboard__badge dashboard__badge--success">
            {metrics?.merchantTrend}
          </span>
          <p className="dashboard__stat-hint">New this week</p>
        </article>
        <article className="dashboard__stat card-surface">
          <h2 className="dashboard__stat-label">Active kiosks</h2>
          <p className="dashboard__stat-value" aria-live="polite">
            {loading || !metrics
              ? "—"
              : formatCompactNumber(metrics.activeKiosks)}
          </p>
          <span className="dashboard__badge dashboard__badge--warn">
            {metrics ? `${metrics.offlineKiosks} Offline` : "—"}
          </span>
          <p className="dashboard__stat-hint">
            Network uptime: <strong>{metrics?.networkUptime ?? "—"}</strong>
          </p>
          <div className="dashboard__progress" role="presentation">
            <span
              className="dashboard__progress-fill"
              style={{ width: metrics?.networkUptime ?? "0%" }}
            />
          </div>
        </article>
        <article className="dashboard__stat card-surface">
          <h2 className="dashboard__stat-label">Total users</h2>
          <p className="dashboard__stat-value" aria-live="polite">
            {loading || !metrics
              ? "—"
              : formatCompactNumber(metrics.totalUsers)}
          </p>
          <span className="dashboard__badge dashboard__badge--primary">
            {metrics?.userTrend}
          </span>
          <div className="dashboard__split">
            <span className="dashboard__split--ok">
              {metrics?.activeUsersLabel}
            </span>
            <span className="dashboard__split--muted">
              {metrics?.inactiveUsersLabel}
            </span>
          </div>
        </article>
      </section>

      <div className="dashboard__grid">
        <section
          className="dashboard__panel dashboard__panel--map card-surface"
          aria-label="Live feed"
        >
          <header className="dashboard__panel-head">
            <span className="dashboard__live">Live feed</span>
            <button type="button" className="btn btn--primary btn--sm">
              + Report
            </button>
          </header>
          <div
            className="dashboard__map"
            role="img"
            aria-label="Regional activity map placeholder"
          />
          <footer className="dashboard__map-foot">
            Peak performance in New Delhi · <strong>Load 72%</strong>
          </footer>
        </section>

        <aside className="dashboard__aside" aria-label="Action center">
          <article className="dashboard__task dashboard__task--critical card-surface">
            <h3 className="dashboard__task-title">Critical</h3>
            <p className="dashboard__task-body">
              Merchant payout failed · assigned to Sagar JAdhav
            </p>
          </article>
          <article className="dashboard__task dashboard__task--pending card-surface">
            <h3 className="dashboard__task-title">Pending</h3>
            <p className="dashboard__task-body">New kiosk approval</p>
          </article>
          <article
            className="dashboard__efficiency"
            aria-label="Global efficiency"
          >
            <div className="dashboard__efficiency-inner">
              <p className="dashboard__efficiency-label">Global efficiency</p>
              <p className="dashboard__efficiency-value">98.4%</p>
              <p className="dashboard__efficiency-sub">
                AI optimization active
              </p>
            </div>
          </article>
        </aside>
      </div>

      <section
        className="dashboard__table-wrap card-surface"
        aria-labelledby="recent-activity-heading"
      >
        <header className="dashboard__table-head">
          <h2 id="recent-activity-heading" className="dashboard__table-title">
            Recent merchant activity
          </h2>
        </header>
        <div className="dashboard__table-scroll">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th scope="col">Merchant</th>
                <th scope="col">Kiosk ID</th>
                <th scope="col">Status</th>
                <th scope="col">Volume</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Glow Lifestyle · Retail</td>
                <td>KSK-8801</td>
                <td>
                  <span className="dashboard__pill dashboard__pill--ok">
                    Active
                  </span>
                </td>
                <td>$12,400</td>
              </tr>
              <tr>
                <td>Harbor Air · Travel</td>
                <td>KSK-7710</td>
                <td>
                  <span className="dashboard__pill dashboard__pill--warn">
                    Warning
                  </span>
                </td>
                <td>$8,210</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="dashboard__footer">
        <span>© 2026 FacePe Support</span>
        <span className="dashboard__footer-dot" aria-hidden />
        <span>API v2.4.1 Online</span>
        <nav className="dashboard__footer-nav" aria-label="Footer links">
          <a href="#architecture">System architecture</a>
          <a href="#security">Security protocols</a>
          <a href="#gdpr">GDPR compliance</a>
        </nav>
      </footer>

      <button
        type="button"
        className="dashboard__fab"
        aria-label="Create quick task"
      >
        +
      </button>
    </div>
  );
}
