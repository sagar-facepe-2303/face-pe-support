import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { createMerchantKiosk } from "../../merchants/merchantSlice";
import * as kioskAPI from "../kioskAPI";
import type { KioskDetail, KioskHeartbeatResponse } from "../kioskAPI";
import { buildCreateKioskPayload } from "../../merchants/merchantAPI";
import { ROUTES } from "../../../core/config/routes";
import { ROLES, canManageKiosks } from "../../../core/constants/roles";
import { formatDisplayDate } from "../../../core/utils/helpers";
import { getApiErrorMessage } from "../../../core/api/parseApiError";
import "../../../layout/Layout.css";
import "../../merchants/pages/MerchantList.css";
import "./KioskList.css";

const SCOPE_STORAGE_KEY = "fp_kiosk_scope_merchant_id";

export function KioskList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const canMutate = canManageKiosks(user?.role);
  const isMerchantAdmin = user?.role === ROLES.MERCHANT_ADMIN;

  const [scopeMerchantIdInput, setScopeMerchantIdInput] = useState(() => {
    try {
      return sessionStorage.getItem(SCOPE_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const scopedListId = isMerchantAdmin
    ? user?.merchantId?.trim() || scopeMerchantIdInput.trim() || undefined
    : undefined;

  useEffect(() => {
    try {
      sessionStorage.setItem(SCOPE_STORAGE_KEY, scopeMerchantIdInput);
    } catch {
      /* ignore */
    }
  }, [scopeMerchantIdInput]);

  const [kioskIdInput, setKioskIdInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detail, setDetail] = useState<KioskDetail | null>(null);
  const [heartbeat, setHeartbeat] = useState<KioskHeartbeatResponse | null>(
    null,
  );
  const [heartbeatError, setHeartbeatError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [kioskMerchantId, setKioskMerchantId] = useState("");
  const [kSerial, setKSerial] = useState("");
  const [kOnline, setKOnline] = useState(true);
  const [kFace, setKFace] = useState("ok");
  const [kCam, setKCam] = useState("ok");

  useEffect(() => {
    if (!addOpen) return;
    const initial =
      user?.merchantId?.trim() ||
      scopeMerchantIdInput.trim() ||
      kioskMerchantId.trim() ||
      "";
    setKioskMerchantId(initial);
  }, [addOpen, user?.merchantId, scopeMerchantIdInput]);

  async function runSearch(e?: FormEvent) {
    e?.preventDefault();
    const id = kioskIdInput.trim();
    if (!id) {
      setSearchError("Enter a kiosk id (UUID).");
      return;
    }
    if (isMerchantAdmin && !scopedListId) {
      setSearchError(
        "Set your merchant email below so kiosk lookup can fall back if needed.",
      );
      return;
    }
    setSearchError(null);
    setHeartbeatError(null);
    setHeartbeat(null);
    setDetail(null);
    setSearchLoading(true);
    try {
      const k = await kioskAPI.fetchKioskById(id, scopedListId ?? null);
      setDetail(k);
      try {
        const hb = await kioskAPI.sendKioskHeartbeat(id, {
          is_online: k.isOnline,
          face_status: k.faceStatus,
          camera_status: k.cameraStatusLabel || k.cameraStatus,
        });
        setHeartbeat(hb);
      } catch (he) {
        setHeartbeatError(getApiErrorMessage(he));
      }
    } catch (err) {
      setSearchError(getApiErrorMessage(err));
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleAddKiosk(ev: FormEvent) {
    ev.preventDefault();
    const targetMerchantId = kioskMerchantId.trim();
    if (!targetMerchantId) {
      setAddError("Enter the merchant email (see hint below).");
      return;
    }
    if (!kSerial.trim()) {
      setAddError("Enter a serial ID.");
      return;
    }
    setAddError(null);
    setAddSubmitting(true);
    try {
      await dispatch(
        createMerchantKiosk({
          merchantId: targetMerchantId,
          payload: buildCreateKioskPayload(
            kSerial.trim(),
            kOnline,
            kFace,
            kCam,
          ),
        }),
      ).unwrap();
      setAddOpen(false);
      setKSerial("");
      setKOnline(true);
      setKFace("ok");
      setKCam("ok");
    } catch (err) {
      setAddError(typeof err === "string" ? err : "Could not register kiosk.");
    } finally {
      setAddSubmitting(false);
    }
  }

  const hbTime = heartbeat?.server_timestamp ?? heartbeat?.timestamp;
  const hbAck = heartbeat?.acknowledged ?? heartbeat?.ack;

  return (
    <div className="kiosk-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Fleet</p>
          <h1 className="page-title">Kiosk inventory</h1>
          <p className="page-desc">
            Search using a Kiosk ID to view device details and its latest
            activity status. To register a new kiosk, use the merchant’s primary
            email.
          </p>
        </div>
        <div className="kiosk-list__actions">
          {canMutate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setAddOpen(true)}
            >
              + Register kiosk
            </button>
          ) : null}
        </div>
      </header>

      {isMerchantAdmin && !user?.merchantId ? (
        <section
          className="kiosk-list__scope-compact card-surface"
          aria-label="Merchant scope"
        >
          <label className="kiosk-list__scope-label">
            <span className="kiosk-list__field-label">
              Merchant email (for lookup fallback)
            </span>
            <input
              className="kiosk-list__input"
              type="text"
              value={scopeMerchantIdInput}
              onChange={(e) => setScopeMerchantIdInput(e.target.value)}
              placeholder="Same email used in GET /merchants/{email}/kiosks"
              autoComplete="off"
            />
          </label>
          <p className="kiosk-list__scope-hint">
            Needed when <code>GET /kiosks/{"{id}"}</code> is unavailable and the
            app resolves the device via{" "}
            <code>GET /merchants/{"{email}"}/kiosks</code>.
          </p>
        </section>
      ) : null}

      <form
        className="kiosk-list__search card-surface"
        onSubmit={runSearch}
        aria-label="Search kiosk"
      >
        <label className="kiosk-list__search-label" htmlFor="kiosk-id-search">
          Search kiosk
        </label>
        <div className="kiosk-list__search-row">
          <input
            id="kiosk-id-search"
            className="kiosk-list__search-input"
            type="search"
            placeholder="Kiosk UUID…"
            value={kioskIdInput}
            onChange={(e) => setKioskIdInput(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={searchLoading}
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="kiosk-list__search-hint">
          Uses <code>GET /kiosks/{"{kiosk_id}"}</code>, then sends a heartbeat
          with the loaded status values.
        </p>
        {searchError ? (
          <p
            className="merchant-list__banner merchant-list__banner--error"
            role="alert"
          >
            {searchError}
          </p>
        ) : null}
      </form>

      {detail ? (
        <section
          className="kiosk-list__result card-surface"
          aria-labelledby="kiosk-result-title"
        >
          <header className="kiosk-list__result-head">
            <h2 id="kiosk-result-title" className="kiosk-list__result-title">
              {detail.title}
            </h2>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() =>
                navigate(ROUTES.KIOSK_DETAIL.replace(":kioskId", detail.id))
              }
            >
              Open full page
            </button>
          </header>
          <dl className="kiosk-list__result-dl">
            <dt>Kiosk id</dt>
            <dd>
              <code>{detail.id}</code>
            </dd>
            <dt>Merchant</dt>
            <dd>
              <code>{detail.merchantId}</code>
            </dd>
            <dt>Serial</dt>
            <dd>{detail.serialId}</dd>
            <dt>Network</dt>
            <dd>
              <span
                className={`kiosk-list__pill kiosk-list__pill--${detail.networkStatus.toLowerCase()}`}
              >
                {detail.networkStatus}
              </span>
            </dd>
            <dt>Face</dt>
            <dd>{detail.faceStatus}</dd>
            <dt>Camera</dt>
            <dd>{detail.cameraStatusLabel}</dd>
            <dt>Health</dt>
            <dd>
              {detail.healthPct}% · {detail.healthLabel}
            </dd>
            <dt>Last sync</dt>
            <dd>{detail.lastSync}</dd>
          </dl>

          <div className="kiosk-list__hb card-surface">
            <h3 className="kiosk-list__hb-title">Heartbeat response</h3>
            <p className="kiosk-list__hb-sub">
              <code>POST /kiosks/{"{kiosk_id}"}/heartbeat</code> (no auth) —
              body mirrors current device fields.
            </p>
            {heartbeatError ? (
              <p
                className="merchant-list__banner merchant-list__banner--error"
                role="alert"
              >
                {heartbeatError}
              </p>
            ) : heartbeat ? (
              <dl className="kiosk-list__result-dl">
                <dt>Acknowledged</dt>
                <dd>{hbAck === undefined ? "—" : String(hbAck)}</dd>
                {hbTime ? (
                  <>
                    <dt>Server time</dt>
                    <dd>
                      <time dateTime={hbTime}>{formatDisplayDate(hbTime)}</time>
                    </dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </div>
        </section>
      ) : null}

      {addOpen ? (
        <div className="kiosk-list__modal-root">
          <button
            type="button"
            className="kiosk-list__backdrop"
            aria-label="Close"
            onClick={() => !addSubmitting && setAddOpen(false)}
          />
          <div
            className="kiosk-list__modal card-surface"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="kiosk-list__modal-title">Register kiosk</h2>
            <form onSubmit={handleAddKiosk} className="kiosk-list__modal-form">
              <label className="kiosk-list__label">
                Merchant email
                <input
                  className="kiosk-list__input"
                  required
                  value={kioskMerchantId}
                  onChange={(e) => setKioskMerchantId(e.target.value)}
                  placeholder="e.g. merchant@example.com"
                  autoComplete="off"
                />
              </label>
              <p className="kiosk-list__modal-hint">
                Path is <code>POST /merchants/{"{email}"}/kiosks</code> using
                the merchant&apos;s primary email (same as{" "}
                <code>GET /merchants/{"{email}"}</code>).
              </p>
              <label className="kiosk-list__label">
                Serial ID
                <input
                  className="kiosk-list__input"
                  required
                  value={kSerial}
                  onChange={(e) => setKSerial(e.target.value)}
                />
              </label>
              <label className="kiosk-list__check">
                <input
                  type="checkbox"
                  checked={kOnline}
                  onChange={(e) => setKOnline(e.target.checked)}
                />
                Online
              </label>
              <label className="kiosk-list__label">
                Face status
                <input
                  className="kiosk-list__input"
                  value={kFace}
                  onChange={(e) => setKFace(e.target.value)}
                />
              </label>
              <label className="kiosk-list__label">
                Camera status
                <input
                  className="kiosk-list__input"
                  value={kCam}
                  onChange={(e) => setKCam(e.target.value)}
                />
              </label>
              {addError ? (
                <p className="kiosk-list__err" role="alert">
                  {addError}
                </p>
              ) : null}
              <div className="kiosk-list__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={addSubmitting}
                >
                  {addSubmitting ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
