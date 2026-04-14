import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { parseKioskDisplayToBool } from "../../merchants/merchantAPI";
import { updateMerchantKiosk } from "../../merchants/merchantSlice";
import { clearKioskDetail, loadKioskDetail } from "../kioskSlice";
import { ROUTES, hrefMerchantDetail } from "../../../core/config/routes";
import { canManageKiosks } from "../../../core/constants/roles";
import "../../../layout/Layout.css";
import "./KioskDetails.css";

const POLL_MS = 20_000;

export function KioskDetails() {
  const { kioskId } = useParams<{ kioskId: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const canMutate = canManageKiosks(user?.role);

  const k = useAppSelector((s) => s.kiosks.current);
  const loading = useAppSelector((s) => s.kiosks.loadingDetail);
  const error = useAppSelector((s) => s.kiosks.error);

  const [editOpen, setEditOpen] = useState(false);
  const [ekSubmitting, setEkSubmitting] = useState(false);
  const [ekError, setEkError] = useState<string | null>(null);
  const [kOnline, setKOnline] = useState(true);
  const [kFaceOk, setKFaceOk] = useState(true);
  const [kCamOk, setKCamOk] = useState(true);
  const [kActive, setKActive] = useState(true);

  useEffect(() => {
    if (kioskId) {
      dispatch(loadKioskDetail(kioskId));
    }
    return () => {
      dispatch(clearKioskDetail());
    };
  }, [dispatch, kioskId]);

  useEffect(() => {
    if (!kioskId) return;
    const t = window.setInterval(() => {
      dispatch(loadKioskDetail(kioskId));
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [dispatch, kioskId]);

  useEffect(() => {
    if (k && editOpen) {
      setKOnline(k.isOnline);
      setKFaceOk(parseKioskDisplayToBool(k.faceStatus));
      setKCamOk(parseKioskDisplayToBool(k.cameraStatusLabel || k.cameraStatus));
      setKActive(true);
    }
  }, [k, editOpen]);

  if (!kioskId) {
    return <p role="alert">Missing kiosk identifier.</p>;
  }

  if (loading && !k) {
    return (
      <div className="kiosk-details page-shell">
        <p role="status">Loading kiosk…</p>
      </div>
    );
  }

  if (error && !k) {
    return (
      <div className="kiosk-details page-shell">
        <p role="alert">{error}</p>
        <p>
          <Link to={ROUTES.KIOSKS}>Back to kiosks</Link>
        </p>
      </div>
    );
  }

  if (!k) {
    return null;
  }

  async function onEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!kioskId || !k) return;
    setEkError(null);
    setEkSubmitting(true);
    try {
      await dispatch(
        updateMerchantKiosk({
          merchantId: k.merchantId,
          kioskId,
          payload: {
            is_online: kOnline,
            face_status: kFaceOk,
            camera_status: kCamOk,
            is_active: kActive,
          },
        }),
      ).unwrap();
      setEditOpen(false);
    } catch (err) {
      setEkError(typeof err === "string" ? err : "Update failed.");
    } finally {
      setEkSubmitting(false);
    }
  }

  return (
    <div className="kiosk-details page-shell">
      <nav className="kiosk-details__crumb" aria-label="Breadcrumb">
        <Link to={ROUTES.KIOSKS}>Kiosks</Link> · <span>{k.serialId}</span>
      </nav>
      {error ? (
        <p className="kiosk-details__banner" role="alert">
          {error}
        </p>
      ) : null}
      <header className="kiosk-details__head page-header">
        <div>
          <h1 className="page-title">{k.title}</h1>
          <div className="kiosk-details__badges">
            <span
              className={
                k.isOnline
                  ? "kiosk-details__online"
                  : "kiosk-details__offline-badge"
              }
            >
              <span className="kiosk-details__dot" aria-hidden />
              {k.isOnline ? "Online" : "Offline"}
            </span>
            <span className="kiosk-details__place">Face · {k.faceStatus}</span>
            <span className="kiosk-details__place">
              Camera · {k.cameraStatus}
            </span>
          </div>
          <p className="kiosk-details__sync-line">Last sync: {k.lastSync}</p>
        </div>
        <div className="kiosk-details__actions">
          <Link
            className="btn btn--secondary btn--sm"
            to={hrefMerchantDetail(k.merchantId)}
          >
            View merchant
          </Link>
          {canMutate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setEditOpen(true)}
            >
              Edit kiosk
            </button>
          ) : null}
        </div>
      </header>

      <section
        className="kiosk-details__health card-surface"
        aria-labelledby="hw-monitor"
      >
        <div className="kiosk-details__health-head">
          <h2 id="hw-monitor" className="kiosk-details__section-title">
            Device status (API)
          </h2>
          <span className="kiosk-details__live-tag">
            Refreshes every {POLL_MS / 1000}s
          </span>
        </div>
        <div className="kiosk-details__health-grid">
          <div>
            <p className="kiosk-details__metric-label">Network</p>
            <p className="kiosk-details__metric-value">{k.networkStatus}</p>
            <p className="kiosk-details__metric-hint">
              Derived from is_online.
            </p>
          </div>
          <div>
            <p className="kiosk-details__metric-label">Face status</p>
            <p className="kiosk-details__metric-value kiosk-details__metric-value--ok">
              {k.faceStatus}
            </p>
            <p className="kiosk-details__metric-hint">
              Reported by kiosk / heartbeat.
            </p>
          </div>
          <div>
            <p className="kiosk-details__metric-label">Camera status</p>
            <p className="kiosk-details__metric-value kiosk-details__metric-value--ok">
              {k.cameraStatusLabel}
            </p>
            <p className="kiosk-details__metric-hint">
              Mapped from camera_status.
            </p>
          </div>
          <div>
            <p className="kiosk-details__metric-label">Health score</p>
            <p className="kiosk-details__metric-value">{k.healthPct}%</p>
            <div className="kiosk-details__bar">
              <span style={{ width: `${k.healthPct}%` }} />
            </div>
            <p className="kiosk-details__metric-hint">{k.healthLabel}</p>
          </div>
        </div>
      </section>

      <section
        className="kiosk-details__spec card-surface"
        aria-label="Device specifications"
      >
        <h2 className="kiosk-details__section-title">Identifiers</h2>
        <dl className="kiosk-details__spec-dl">
          <div>
            <dt>Kiosk ID</dt>
            <dd>{k.id}</dd>
          </div>
          <div>
            <dt>Serial</dt>
            <dd>{k.serialNumber}</dd>
          </div>
          <div>
            <dt>Merchant</dt>
            <dd>
              <Link to={hrefMerchantDetail(k.merchantId)}>{k.merchantId}</Link>
            </dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{k.model}</dd>
          </div>
        </dl>
      </section>

      <p className="kiosk-details__note">
        Devices report liveness with{" "}
        <code>POST /kiosks/{"{kiosk_id}"}/heartbeat</code> (no auth; body:{" "}
        <code>is_online</code>, <code>face_status</code>,{" "}
        <code>camera_status</code>). This admin UI loads data via authenticated
        merchant/kiosk routes. Charts and transaction history are not part of
        the current API handoff.
      </p>

      {editOpen ? (
        <div className="kiosk-details__modal-root">
          <button
            type="button"
            className="kiosk-details__backdrop"
            aria-label="Close"
            onClick={() => !ekSubmitting && setEditOpen(false)}
          />
          <div
            className="kiosk-details__modal card-surface"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="kiosk-details__modal-title">Edit kiosk</h2>
            <form onSubmit={onEditSubmit} className="kiosk-details__modal-form">
              <label className="kiosk-details__check">
                <input
                  type="checkbox"
                  checked={kOnline}
                  onChange={(e) => setKOnline(e.target.checked)}
                />
                Online
              </label>
              <label className="kiosk-details__check">
                <input
                  type="checkbox"
                  checked={kFaceOk}
                  onChange={(e) => setKFaceOk(e.target.checked)}
                />
                Face OK
              </label>
              <label className="kiosk-details__check">
                <input
                  type="checkbox"
                  checked={kCamOk}
                  onChange={(e) => setKCamOk(e.target.checked)}
                />
                Camera OK
              </label>
              <label className="kiosk-details__check">
                <input
                  type="checkbox"
                  checked={kActive}
                  onChange={(e) => setKActive(e.target.checked)}
                />
                Active
              </label>
              {ekError ? (
                <p className="kiosk-details__err" role="alert">
                  {ekError}
                </p>
              ) : null}
              <div className="kiosk-details__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={ekSubmitting}
                >
                  {ekSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
