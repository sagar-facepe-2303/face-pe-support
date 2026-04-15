import { useEffect, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { createMerchantKiosk } from "../../merchants/merchantSlice";
import * as kioskAPI from "../kioskAPI";
import { buildCreateKioskPayload } from "../../merchants/merchantAPI";
import { ROLES, canManageKiosks } from "../../../core/constants/roles";
import { formatDisplayDate } from "../../../core/utils/helpers";
import { getApiErrorMessage } from "../../../core/api/parseApiError";
import "../../../layout/Layout.css";
import "../../merchants/pages/MerchantList.css";
import "./KioskList.css";

const SCOPE_STORAGE_KEY = "fp_kiosk_scope_merchant_id";

export function KioskList() {
  const dispatch = useAppDispatch();
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

  useEffect(() => {
    try {
      sessionStorage.setItem(SCOPE_STORAGE_KEY, scopeMerchantIdInput);
    } catch {
      /* ignore */
    }
  }, [scopeMerchantIdInput]);

  const [hbKioskId, setHbKioskId] = useState("");
  const [hbIsOnline, setHbIsOnline] = useState(true);
  const [hbFaceStatus, setHbFaceStatus] = useState(true);
  const [hbCameraStatus, setHbCameraStatus] = useState(true);
  const [hbSubmitting, setHbSubmitting] = useState(false);
  const [hbError, setHbError] = useState<string | null>(null);
  const [heartbeat, setHeartbeat] =
    useState<kioskAPI.KioskHeartbeatResponse | null>(null);

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

  async function handleSendHeartbeat(e: FormEvent) {
    e.preventDefault();
    const id = hbKioskId.trim();
    if (!id) {
      setHbError("Enter a kiosk id.");
      return;
    }
    setHbError(null);
    setHeartbeat(null);
    setHbSubmitting(true);
    try {
      const hb = await kioskAPI.sendKioskHeartbeat(id, {
        is_online: hbIsOnline,
        face_status: hbFaceStatus,
        camera_status: hbCameraStatus,
      });
      setHeartbeat(hb);
    } catch (err) {
      setHbError(getApiErrorMessage(err));
    } finally {
      setHbSubmitting(false);
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

  return (
    <div className="kiosk-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Fleet</p>
          <h1 className="page-title">Kiosk inventory</h1>
          <p className="page-desc">
            Send a quick update to keep your kiosk active. To add a new kiosk,
            use the merchant’s primary email address.
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
        onSubmit={handleSendHeartbeat}
        aria-label="Send kiosk heartbeat"
      >
        <label className="kiosk-list__search-label" htmlFor="hb-kiosk-id">
          Send heartbeat
        </label>
        <div className="kiosk-list__field">
          <input
            id="hb-kiosk-id"
            className="kiosk-list__search-input"
            type="text"
            placeholder="Kiosk UUID…"
            value={hbKioskId}
            onChange={(e) => setHbKioskId(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div
          className="kiosk-list__search-row"
          style={{ marginTop: "0.75rem" }}
        >
          <label className="kiosk-list__check">
            <input
              type="checkbox"
              checked={hbIsOnline}
              onChange={(e) => setHbIsOnline(e.target.checked)}
            />
            is_online
          </label>
          <label className="kiosk-list__check">
            <input
              type="checkbox"
              checked={hbFaceStatus}
              onChange={(e) => setHbFaceStatus(e.target.checked)}
            />
            face_status
          </label>
          <label className="kiosk-list__check">
            <input
              type="checkbox"
              checked={hbCameraStatus}
              onChange={(e) => setHbCameraStatus(e.target.checked)}
            />
            camera_status
          </label>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={hbSubmitting}
          >
            {hbSubmitting ? "Sending…" : "Send heartbeat"}
          </button>
        </div>
        <p className="kiosk-list__search-hint">
          Request body: <code>is_online</code>, <code>face_status</code>,{" "}
          <code>camera_status</code>.
        </p>
        {hbError ? (
          <p
            className="merchant-list__banner merchant-list__banner--error"
            role="alert"
          >
            {hbError}
          </p>
        ) : null}
        {heartbeat ? (
          <div className="kiosk-list__hb card-surface">
            <h3 className="kiosk-list__hb-title">Heartbeat response</h3>
            <dl className="kiosk-list__result-dl">
              <dt>Acknowledged</dt>
              <dd>{String(heartbeat.acknowledged ?? heartbeat.ack ?? "—")}</dd>
              {heartbeat.server_timestamp ?? heartbeat.timestamp ? (
                <>
                  <dt>Server time</dt>
                  <dd>
                    <time
                      dateTime={
                        heartbeat.server_timestamp ?? heartbeat.timestamp
                      }
                    >
                      {formatDisplayDate(
                        heartbeat.server_timestamp ?? heartbeat.timestamp ?? "",
                      )}
                    </time>
                  </dd>
                </>
              ) : null}
            </dl>
          </div>
        ) : null}
      </form>

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
