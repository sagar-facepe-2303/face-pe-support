import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { createMerchant } from "../merchantSlice";
import * as merchantAPI from "../merchantAPI";
import type { MerchantDetail, MerchantKioskRow } from "../merchantAPI";
import {
  clearMerchantReadSession,
  loadMerchantReadSession,
  saveMerchantReadSession,
} from "../merchantReadSession";
import { ROUTES } from "../../../core/config/routes";
import { canManageMerchants } from "../../../core/constants/roles";
import { formatDisplayDate } from "../../../core/utils/helpers";
import { getApiErrorMessage } from "../../../core/api/parseApiError";
import "../../../layout/Layout.css";
import "./MerchantList.css";

export function MerchantList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const canMutate = canManageMerchants(user?.role);

  const [merchantIdInput, setMerchantIdInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    detail: MerchantDetail;
    kiosks: MerchantKioskRow[];
  } | null>(null);

  /** OTP read token for `X-OTP-Token`, scoped to `tokenMerchantId`. */
  const [otpReadToken, setOtpReadToken] = useState<string | null>(null);
  const [tokenMerchantId, setTokenMerchantId] = useState<string | null>(null);

  const [otpHint, setOtpHint] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpLocalError, setOtpLocalError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMerchantId, setFormMerchantId] = useState("");
  const [createdPortalMerchantId, setCreatedPortalMerchantId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!user?.id) return;
    const saved = loadMerchantReadSession(user.id);
    if (!saved) return;
    setMerchantIdInput(saved.merchantId);
    setResult(saved.result);
    setOtpReadToken(saved.otpToken);
    setTokenMerchantId(saved.merchantId);
    setOtpHint(false);
    setOtpSessionId(null);
    setOtpCode("");
    setSearchError(null);
  }, [user?.id]);

  async function loadMerchant(explicitOtpToken?: string | null) {
    const id = merchantIdInput.trim();
    if (!id) {
      setSearchError("Enter a merchant id.");
      return;
    }
    const tokenToUse =
      explicitOtpToken !== undefined && explicitOtpToken !== null
        ? explicitOtpToken
        : tokenMerchantId === id
          ? otpReadToken
          : null;
    const hadToken = !!tokenToUse;

    setSearchError(null);
    setOtpLocalError(null);
    setSearchLoading(true);
    try {
      const { detail, kiosks } = await merchantAPI.fetchMerchantById(
        id,
        tokenToUse,
      );
      const kiosksFinal =
        kiosks.length > 0
          ? kiosks
          : await merchantAPI
              .fetchMerchantKiosks(id, tokenToUse)
              .catch(() => []);
      setResult({ detail, kiosks: kiosksFinal });
      setOtpHint(false);
      setOtpSessionId(null);
      setOtpCode("");
      setOtpReadToken(tokenToUse ?? null);
      setTokenMerchantId(id);
      if (user?.id) {
        saveMerchantReadSession({
          userId: user.id,
          merchantId: id,
          otpToken: tokenToUse ?? null,
          result: { detail, kiosks: kiosksFinal },
        });
      }
    } catch (e) {
      setResult(null);
      const st = isAxiosError(e) ? e.response?.status : undefined;
      if (st === 403 || st === 401) {
        if (hadToken) {
          clearMerchantReadSession();
          setOtpReadToken(null);
          setTokenMerchantId(null);
        }
        setOtpHint(true);
        setSearchError(
          hadToken
            ? "Merchant access could not be refreshed. Send a new code and verify again."
            : "Reading this merchant requires email verification (in addition to your login). Send a code, then enter it below.",
        );
      } else {
        setSearchError(getApiErrorMessage(e));
      }
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    void loadMerchant();
  }

  async function handleSendOtp() {
    const id = merchantIdInput.trim();
    if (!id) {
      setOtpLocalError("Enter a merchant id above first.");
      return;
    }
    setOtpSending(true);
    setOtpLocalError(null);
    try {
      const r = await merchantAPI.sendMerchantReadOtp(id);
      setOtpSessionId(r.session_id);
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err));
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyAndLoad() {
    if (!otpSessionId) {
      setOtpLocalError("Send a verification code first.");
      return;
    }
    const code = otpCode.trim();
    if (!code) {
      setOtpLocalError("Enter the code from your email.");
      return;
    }
    setOtpVerifying(true);
    setOtpLocalError(null);
    try {
      const token = await merchantAPI.verifyOtpAndGetToken(otpSessionId, code);
      if (!token) {
        setOtpLocalError("Verification did not return a token. Try again.");
        return;
      }
      await loadMerchant(token);
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  }

  function openDetailPage(portalId: string) {
    navigate(ROUTES.MERCHANT_DETAIL.replace(":merchantId", portalId));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const created = await dispatch(
        createMerchant({
          merchant_name: formName.trim(),
          merchant_email: formEmail.trim(),
          ...(formPhone.trim() ? { merchant_phone: formPhone.trim() } : {}),
          ...(formMerchantId.trim()
            ? { merchant_id: formMerchantId.trim() }
            : {}),
        }),
      ).unwrap();
      if (created?.id) {
        setCreatedPortalMerchantId(created.id);
      }
      setCreateOpen(false);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormMerchantId("");
    } catch (err) {
      setCreateError(
        typeof err === "string" ? err : "Could not create merchant.",
      );
    } finally {
      setCreateSubmitting(false);
    }
  }

  const d = result?.detail;

  return (
    <div className="merchant-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Management</p>
          <h1 className="page-title">Merchant directory</h1>
          <p className="page-desc">
            Look up a merchant by Support Portal id. If the API requires it,
            verify with a one-time code. After a successful verification, that
            merchant stays available here until you sign out (stored for this
            browser tab). Open <strong>Open full page</strong> to edit merchant
            details or manage kiosks (admin API:{" "}
            <code>PUT /merchants/{"{id}"}</code>,{" "}
            <code>POST /merchants/{"{id}"}/kiosks</code>,{" "}
            <code>PUT …/kiosks/{"{kiosk_id}"}</code>).
          </p>
        </div>
        <div className="merchant-list__actions">
          {canMutate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              + Onboard merchant
            </button>
          ) : null}
        </div>
      </header>

      {createdPortalMerchantId ? (
        <div
          className="merchant-list__banner merchant-list__banner--success card-surface"
          role="status"
        >
          <p className="merchant-list__success-title">
            <strong>Merchant saved.</strong> Register kiosks with this Support
            Portal merchant <strong>id</strong> (the value in{" "}
            <code>POST /merchants/{"{this id}"}/kiosks</code>):
          </p>
          <div className="merchant-list__portal-id-row">
            <code className="merchant-list__portal-id">
              {createdPortalMerchantId}
            </code>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                void navigator.clipboard.writeText(createdPortalMerchantId);
              }}
            >
              Copy id
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setCreatedPortalMerchantId(null)}
            >
              Dismiss
            </button>
          </div>
          <p className="merchant-list__field-hint">
            If kiosk registration says &quot;Merchant not found&quot;, the id in
            the form does not match any merchant row in this environment—use the
            id above, or create the merchant here first.
          </p>
        </div>
      ) : null}

      <form
        className="merchant-list__search-hero card-surface"
        aria-label="Search merchant"
        onSubmit={handleSearchSubmit}
      >
        <label
          className="merchant-list__search-hero-label"
          htmlFor="merchant-id-search"
        >
          Search merchant
        </label>
        <div className="merchant-list__search-row">
          <input
            id="merchant-id-search"
            className="merchant-list__search-hero-input"
            type="search"
            placeholder="Support Portal merchant id (UUID)…"
            value={merchantIdInput}
            onChange={(e) => {
              const v = e.target.value;
              setMerchantIdInput(v);
              setOtpSessionId(null);
              setOtpHint(false);
              const tid = v.trim();
              if (result && (!tid || tid !== result.detail.id)) {
                setResult(null);
                setOtpReadToken(null);
                setTokenMerchantId(null);
                clearMerchantReadSession();
              }
            }}
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
        <p className="merchant-list__search-hero-hint">
          Use the Support Portal merchant <strong>id</strong> from{" "}
          <code>POST /merchants</code> (same id used in{" "}
          <code>/merchants/{"{id}"}/kiosks</code>). If the API returns 401,
          complete email verification below—this is separate from super admin /
          merchant admin login.
        </p>
        {searchError ? (
          <p
            className="merchant-list__banner merchant-list__banner--error"
            role="alert"
          >
            {searchError}
          </p>
        ) : null}

        {otpHint ? (
          <div className="merchant-list__otp card-surface">
            <p className="merchant-list__otp-title">Verify access</p>
            <div className="merchant-list__otp-actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={otpSending}
                onClick={() => void handleSendOtp()}
              >
                {otpSending ? "Sending…" : "Send code"}
              </button>
              <input
                className="merchant-list__input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={otpVerifying}
                onClick={() => void handleVerifyAndLoad()}
              >
                {otpVerifying ? "Verifying…" : "Verify & load"}
              </button>
            </div>
            {otpSessionId ? (
              <p className="merchant-list__field-hint">
                Code sent. Check your email and enter the code above.
              </p>
            ) : null}
            {otpLocalError ? (
              <p
                className="merchant-list__banner merchant-list__banner--error"
                role="alert"
              >
                {otpLocalError}
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

      {d ? (
        <section
          className="merchant-list__detail card-surface"
          aria-labelledby="merchant-detail-title"
        >
          <header className="merchant-list__detail-head">
            <h2
              id="merchant-detail-title"
              className="merchant-list__detail-title"
            >
              {d.name}
            </h2>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => openDetailPage(d.id)}
            >
              Open full page
            </button>
          </header>
          <dl className="merchant-list__detail-grid">
            <dt>Merchant id</dt>
            <dd>
              <code>{d.id}</code>
            </dd>
            <dt>Reference</dt>
            <dd>{d.registrationNumber}</dd>
            <dt>Email</dt>
            <dd>{d.email}</dd>
            <dt>Phone</dt>
            <dd>{d.phone}</dd>
            <dt>Status</dt>
            <dd>
              <span
                className={`merchant-list__pill merchant-list__pill--${d.status.toLowerCase()}`}
              >
                {d.status}
              </span>
            </dd>
            <dt>Registered</dt>
            <dd>
              <time dateTime={d.registeredAt}>
                {formatDisplayDate(d.registeredAt)}
              </time>
            </dd>
          </dl>

          {result && result.kiosks.length > 0 ? (
            <div className="merchant-list__kiosks-wrap">
              <h3 className="merchant-list__kiosks-title">
                Kiosks ({result.kiosks.length})
              </h3>
              <div className="merchant-list__scroll">
                <table className="merchant-list__table">
                  <thead>
                    <tr>
                      <th scope="col">Serial</th>
                      <th scope="col">Online</th>
                      <th scope="col">Face</th>
                      <th scope="col">Camera</th>
                      <th scope="col">Last sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.kiosks.map((k) => (
                      <tr key={k.id}>
                        <td>
                          <code>{k.serialId}</code>
                        </td>
                        <td>{k.isOnline ? "Yes" : "No"}</td>
                        <td>{k.faceStatus}</td>
                        <td>{k.cameraStatus}</td>
                        <td>{k.lastSync}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {createOpen ? (
        <div className="merchant-list__modal-root" role="presentation">
          <button
            type="button"
            className="merchant-list__modal-backdrop"
            aria-label="Close dialog"
            onClick={() => !createSubmitting && setCreateOpen(false)}
          />
          <div
            className="merchant-list__modal card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-create-title"
          >
            <h2
              id="merchant-create-title"
              className="merchant-list__modal-title"
            >
              Onboard merchant
            </h2>
            <form className="merchant-list__modal-form" onSubmit={handleCreate}>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">
                  Merchant name
                </span>
                <input
                  className="merchant-list__input"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">
                  Merchant email
                </span>
                <input
                  className="merchant-list__input"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">
                  Merchant phone*
                </span>
                <input
                  className="merchant-list__input"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">
                  Merchant ID *
                </span>
                <input
                  className="merchant-list__input"
                  value={formMerchantId}
                  onChange={(e) => setFormMerchantId(e.target.value)}
                  placeholder="Plain UUID, urn:uuid:…, code, or any string your API accepts"
                  autoComplete="off"
                />
              </label>
              <p className="merchant-list__field-hint">
                Sent as <code>merchant_id</code> only if filled. Use whatever
                format your backend expects.
              </p>
              {createError ? (
                <p
                  className="merchant-list__banner merchant-list__banner--error"
                  role="alert"
                >
                  {createError}
                </p>
              ) : null}
              <div className="merchant-list__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={createSubmitting}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
