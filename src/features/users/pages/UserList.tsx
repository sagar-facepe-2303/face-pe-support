import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAppSelector } from "../../../app/hooks";
import * as userAPI from "../userAPI";
import type { PlatformUserDetail } from "../userAPI";
import { hrefUserProfileByPhone } from "../../../core/config/routes";
import { canMutateUsers } from "../../../core/constants/roles";
import { formatDisplayDate } from "../../../core/utils/helpers";
import { getApiErrorMessage } from "../../../core/api/parseApiError";
import { clearUserReadOtp, saveUserReadOtp } from "../userReadSession";
import "../../../layout/Layout.css";
import "../../merchants/pages/MerchantList.css";
import "./UserList.css";

export function UserList() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const canCreate = canMutateUsers(user?.role);

  const [userPhoneInput, setUserPhoneInput] = useState("");
  /** Phone string used in the last successful `GET /users/{user_phone}` (for deep links). */
  const [profileLookupKey, setProfileLookupKey] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<PlatformUserDetail | null>(null);

  const [otpHint, setOtpHint] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpLocalError, setOtpLocalError] = useState<string | null>(null);
  const [otpSendMeta, setOtpSendMeta] = useState<{
    masked?: string;
    expires?: string;
  } | null>(null);
  /** Cached read_user OTP for the current phone (avoids GET without X-OTP-Token and skips re-verify on repeat Search). */
  const [readOtpToken, setReadOtpToken] = useState<string | null>(null);
  const [readOtpPhone, setReadOtpPhone] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [seedUserId, setSeedUserId] = useState("");
  const [seedUserName, setSeedUserName] = useState("");
  const [seedUserEmail, setSeedUserEmail] = useState("");
  const [seedUserPhone, setSeedUserPhone] = useState("");
  const [seedSubmitting, setSeedSubmitting] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] =
    useState<userAPI.SeedCustomerUserResponse | null>(null);
  const [mutationPurpose, setMutationPurpose] = useState<
    "update_user" | "delete_user" | null
  >(null);
  const [mutationSessionId, setMutationSessionId] = useState<string | null>(null);
  const [mutationCode, setMutationCode] = useState("");
  const [mutationSending, setMutationSending] = useState(false);
  const [mutationSubmitting, setMutationSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  async function loadProfile(otpTokenOverride?: string | null) {
    const phone = userPhoneInput.trim();
    if (!phone) {
      setSearchError("Enter the customer mobile number (user_phone).");
      return;
    }

    const token =
      otpTokenOverride !== undefined &&
      otpTokenOverride !== null &&
      String(otpTokenOverride).trim() !== ""
        ? String(otpTokenOverride).trim()
        : readOtpPhone === phone && readOtpToken
        ? readOtpToken
        : null;

    if (!token) {
      setSearchError(null);
      setOtpLocalError(null);
      setOtpHint(true);
      setResult(null);
      setProfileLookupKey(null);
      return;
    }

    setSearchError(null);
    setOtpLocalError(null);
    setSearchLoading(true);
    try {
      const { user: u } = await userAPI.fetchUserProfile(phone, token);
      setResult(u);
      setProfileLookupKey(phone);
      setReadOtpToken(token);
      setReadOtpPhone(phone);
      if (user?.id) {
        saveUserReadOtp(user.id, phone, token);
      }
      setOtpHint(false);
      setOtpSessionId(null);
      setOtpCode("");
    } catch (e) {
      setResult(null);
      setProfileLookupKey(null);
      const st = isAxiosError(e) ? e.response?.status : undefined;
      if (st === 403 || st === 401) {
        setReadOtpToken(null);
        setReadOtpPhone(null);
        if (user?.id) {
          clearUserReadOtp(user.id, phone);
        }
        setOtpHint(true);
        setSearchError(
          "Could not load this profile (login or read_user OTP invalid/expired). Send a new code and verify again.",
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
    void loadProfile();
  }

  async function handleSendOtp() {
    const phone = userPhoneInput.trim();
    if (!phone) {
      setOtpLocalError(
        "Enter the customer phone number above first (same as in the URL path).",
      );
      return;
    }
    setOtpSending(true);
    setOtpLocalError(null);
    try {
      const r = await userAPI.sendUserOtp("read_user", phone);
      setOtpSessionId(r.session_id);
      setOtpSendMeta({
        masked: r.masked_recipient,
        expires: r.expires_at ?? r.expiry,
      });
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
      const token = await userAPI.verifyUserOtpAndGetToken(otpSessionId, code);
      if (!token) {
        setOtpLocalError("Verification did not return a token. Try again.");
        return;
      }
      await loadProfile(token);
    } catch (err) {
      setOtpLocalError(getApiErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  }

  async function handleSeedCustomer(e: FormEvent) {
    e.preventDefault();
    setSeedError(null);
    const user_id = seedUserId.trim();
    const user_name = seedUserName.trim();
    const user_email = seedUserEmail.trim();
    const user_phone = seedUserPhone.trim();
    if (!user_id || !user_name || !user_email || !user_phone) {
      setSeedError("All fields are required.");
      return;
    }
    setSeedSubmitting(true);
    try {
      const created = await userAPI.seedCustomerUser({
        user_id,
        user_name,
        user_email,
        user_phone,
      });
      setSeedSuccess(created);
      setCreateOpen(false);
      setSeedUserId("");
      setSeedUserName("");
      setSeedUserEmail("");
      setSeedUserPhone("");
      setUserPhoneInput(created.user_phone);
      setReadOtpToken(null);
      setReadOtpPhone(null);
    } catch (err) {
      setSeedError(getApiErrorMessage(err));
    } finally {
      setSeedSubmitting(false);
    }
  }

  async function startMutationOtp(purpose: "update_user" | "delete_user") {
    const phone = profileLookupKey ?? userPhoneInput.trim();
    if (!phone) {
      setMutationError("Search and load a profile first.");
      return;
    }
    setMutationSending(true);
    setMutationError(null);
    setMutationSuccess(null);
    try {
      const r = await userAPI.sendUserOtp(purpose, phone);
      setMutationPurpose(purpose);
      setMutationSessionId(r.session_id);
      setMutationCode("");
    } catch (err) {
      setMutationError(getApiErrorMessage(err));
    } finally {
      setMutationSending(false);
    }
  }

  async function handleUpdateUser() {
    if (!mutationSessionId || mutationPurpose !== "update_user") {
      setMutationError("Send an update OTP code first.");
      return;
    }
    const lookupPhone = profileLookupKey ?? userPhoneInput.trim();
    if (!lookupPhone) {
      setMutationError("Missing user phone for update.");
      return;
    }
    const code = mutationCode.trim();
    if (!code) {
      setMutationError("Enter the OTP code for update.");
      return;
    }
    const payload: userAPI.UpdateUserRequest = {};
    if (editName.trim() && editName.trim() !== (result?.name ?? "")) {
      payload.user_name = editName.trim();
    }
    if (editEmail.trim() && editEmail.trim() !== (result?.email ?? "")) {
      payload.user_email = editEmail.trim();
    }
    if (editPhone.trim() && editPhone.trim() !== (result?.phone ?? "")) {
      payload.user_phone = editPhone.trim();
    }
    if (!payload.user_name && !payload.user_email && !payload.user_phone) {
      setMutationError("Change at least one field before updating.");
      return;
    }

    setMutationSubmitting(true);
    setMutationError(null);
    try {
      const otpToken = await userAPI.verifyUserOtpAndGetToken(mutationSessionId, code);
      if (!otpToken) {
        setMutationError("OTP verification did not return a token.");
        return;
      }
      const updated = await userAPI.updateUserById(lookupPhone, payload, otpToken);
      const mapped = userAPI.mapUserResponseToDetail(updated);
      setResult(mapped);
      const nextPhone = mapped.phone !== "—" ? mapped.phone : lookupPhone;
      setProfileLookupKey(nextPhone);
      setUserPhoneInput(nextPhone);
      setReadOtpToken(null);
      setReadOtpPhone(null);
      setMutationSessionId(null);
      setMutationCode("");
      setMutationPurpose(null);
      setMutationSuccess("User profile updated successfully.");
    } catch (err) {
      setMutationError(getApiErrorMessage(err));
    } finally {
      setMutationSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!mutationSessionId || mutationPurpose !== "delete_user") {
      setMutationError("Send a delete OTP code first.");
      return;
    }
    const lookupPhone = profileLookupKey ?? userPhoneInput.trim();
    if (!lookupPhone) {
      setMutationError("Missing user phone for delete.");
      return;
    }
    const code = mutationCode.trim();
    if (!code) {
      setMutationError("Enter the OTP code for delete.");
      return;
    }
    setMutationSubmitting(true);
    setMutationError(null);
    try {
      const otpToken = await userAPI.verifyUserOtpAndGetToken(mutationSessionId, code);
      if (!otpToken) {
        setMutationError("OTP verification did not return a token.");
        return;
      }
      await userAPI.deleteUserById(lookupPhone, otpToken);
      setResult(null);
      setProfileLookupKey(null);
      setReadOtpToken(null);
      setReadOtpPhone(null);
      setMutationSessionId(null);
      setMutationCode("");
      setMutationPurpose(null);
      setMutationSuccess("User deleted successfully.");
    } catch (err) {
      setMutationError(getApiErrorMessage(err));
    } finally {
      setMutationSubmitting(false);
    }
  }

  const d = result;

  return (
    <div className="user-list page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">End customers</p>
          <h1 className="page-title">User directory</h1>
          <p className="page-desc">
            Look up an end-customer by <strong>mobile number</strong>.
          </p>
        </div>
        <div className="user-list__actions">
          {canCreate ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setSeedError(null);
                setSeedSuccess(null);
                setCreateOpen(true);
              }}
            >
              + Create end customer
            </button>
          ) : null}
        </div>
      </header>

      {seedSuccess ? (
        <div
          className="merchant-list__banner merchant-list__banner--success card-surface"
          role="status"
          style={{ marginBottom: "1rem" }}
        >
          <p className="merchant-list__success-title">
            <strong>Customer created.</strong> Row id{" "}
            <code>{seedSuccess.id}</code> · user_id{" "}
            <code>{seedSuccess.user_id}</code>
          </p>
          <p className="merchant-list__field-hint" style={{ margin: 0 }}>
            {seedSuccess.user_name} · {seedSuccess.user_email} ·{" "}
            {seedSuccess.user_phone}
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSeedSuccess(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form
        className="user-list__search card-surface"
        aria-label="Search user"
        onSubmit={handleSearchSubmit}
      >
        <label className="user-list__search-label" htmlFor="user-phone-search">
          Search by mobile (user_phone)
        </label>
        <div className="user-list__search-row">
          <input
            id="user-phone-search"
            className="user-list__search-input"
            type="search"
            placeholder="+919123456712"
            value={userPhoneInput}
            onChange={(e) => {
              setUserPhoneInput(e.target.value);
              setProfileLookupKey(null);
              setReadOtpToken(null);
              setReadOtpPhone(null);
              setOtpSessionId(null);
              setOtpSendMeta(null);
              setOtpHint(false);
              setSearchError(null);
              setResult(null);
              setMutationPurpose(null);
              setMutationSessionId(null);
              setMutationCode("");
              setMutationError(null);
              setMutationSuccess(null);
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
        <p className="user-list__search-hint">
          OTP verification is required to access the user profile. Your verified
          session will remain active until it expires..
        </p>
        {otpHint && !searchError && !result ? (
          <p
            className="user-list__search-hint"
            role="status"
            style={{ marginTop: "0.35rem" }}
          >
            No profile request sent yet. Use <strong>Send code</strong> (uses{" "}
            <code>target_user_phone</code>), enter the code, then{" "}
            <strong>Verify & load</strong>.
          </p>
        ) : null}
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
            <p className="merchant-list__otp-title">Verify OTP</p>

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
                Code sent
                {otpSendMeta?.masked ? ` to ${otpSendMeta.masked}` : ""}. Enter
                the code above.
                {otpSendMeta?.expires ? (
                  <>
                    {" "}
                    Session expires:{" "}
                    <time dateTime={otpSendMeta.expires}>
                      {otpSendMeta.expires}
                    </time>
                  </>
                ) : null}
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
      {mutationSuccess ? (
        <p className="merchant-list__banner merchant-list__banner--success" role="status">
          {mutationSuccess}
        </p>
      ) : null}

      {d ? (
        <section
          className="user-list__result card-surface"
          aria-labelledby="user-search-result-title"
        >
          <header className="user-list__result-head">
            <h2
              id="user-search-result-title"
              className="user-list__result-title"
            >
              {d.name}
            </h2>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                const phone = profileLookupKey ?? userPhoneInput.trim();
                if (phone) navigate(hrefUserProfileByPhone(phone));
              }}
            >
              Open full profile
            </button>
          </header>
          <dl className="user-list__result-dl">
            <dt>Lookup (user_phone)</dt>
            <dd>
              <code>{profileLookupKey ?? userPhoneInput.trim()}</code>
            </dd>
            <dt>Portal record id</dt>
            <dd>
              <code>{d.id}</code>
            </dd>
            <dt>Email</dt>
            <dd>{d.email}</dd>
            <dt>Phone</dt>
            <dd>{d.phone}</dd>
            <dt>Status</dt>
            <dd>
              <span
                className={`user-list__status-pill user-list__status-pill--${d.status.toLowerCase()}`}
              >
                {d.status}
              </span>
            </dd>
            <dt>Registered</dt>
            <dd>
              <time dateTime={d.createdAt}>
                {formatDisplayDate(d.createdAt)}
              </time>
            </dd>
          </dl>
          {canCreate ? (
            <div className="user-list__mutations">
              <p className="user-list__search-hint" style={{ marginTop: 0 }}>
                Update/Delete require OTP validation with scope{" "}
                <code>update_user</code> or <code>delete_user</code>.
              </p>
              <div className="user-list__search-row">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={mutationSending || mutationSubmitting}
                  onClick={() => {
                    setEditName(d.name === "—" ? "" : d.name);
                    setEditEmail(d.email === "—" ? "" : d.email);
                    setEditPhone(d.phone === "—" ? "" : d.phone);
                    void startMutationOtp("update_user");
                  }}
                >
                  {mutationSending && mutationPurpose === "update_user"
                    ? "Sending update OTP…"
                    : "Send update OTP"}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={mutationSending || mutationSubmitting}
                  onClick={() => void startMutationOtp("delete_user")}
                >
                  {mutationSending && mutationPurpose === "delete_user"
                    ? "Sending delete OTP…"
                    : "Send delete OTP"}
                </button>
              </div>

              {mutationPurpose === "update_user" ? (
                <div className="user-list__mutate-card">
                  <label className="merchant-list__field">
                    <span className="merchant-list__field-label">user_name</span>
                    <input
                      className="merchant-list__input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  <label className="merchant-list__field">
                    <span className="merchant-list__field-label">user_email</span>
                    <input
                      className="merchant-list__input"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </label>
                  <label className="merchant-list__field">
                    <span className="merchant-list__field-label">user_phone</span>
                    <input
                      className="merchant-list__input"
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              {mutationPurpose ? (
                <div className="user-list__search-row">
                  <input
                    className="merchant-list__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="OTP code"
                    value={mutationCode}
                    onChange={(e) => setMutationCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={mutationSubmitting}
                    onClick={() =>
                      mutationPurpose === "update_user"
                        ? void handleUpdateUser()
                        : void handleDeleteUser()
                    }
                  >
                    {mutationSubmitting
                      ? "Submitting…"
                      : mutationPurpose === "update_user"
                      ? "Verify & update"
                      : "Verify & delete"}
                  </button>
                </div>
              ) : null}

              {mutationError ? (
                <p className="merchant-list__banner merchant-list__banner--error" role="alert">
                  {mutationError}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {createOpen && canCreate ? (
        <div className="merchant-list__modal-root" role="presentation">
          <button
            type="button"
            className="merchant-list__modal-backdrop"
            aria-label="Close dialog"
            onClick={() => !seedSubmitting && setCreateOpen(false)}
          />
          <div
            className="merchant-list__modal card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-seed-create-title"
          >
            <h2
              id="user-seed-create-title"
              className="merchant-list__modal-title"
            >
              Create end customer
            </h2>
            <p className="merchant-list__field-hint" style={{ marginTop: 0 }}>
              Calls <code>POST /sp/test/seed-user</code> with the payload below
              (authenticated).
            </p>
            <form
              className="merchant-list__modal-form"
              onSubmit={handleSeedCustomer}
            >
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">
                  user_id (UUID)
                </span>
                <div className="user-list__search-row">
                  <input
                    className="merchant-list__input"
                    required
                    value={seedUserId}
                    onChange={(e) => setSeedUserId(e.target.value)}
                    placeholder="550e8400-e29b-41d4-a716-446655440001"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => setSeedUserId(crypto.randomUUID())}
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_name</span>
                <input
                  className="merchant-list__input"
                  required
                  value={seedUserName}
                  onChange={(e) => setSeedUserName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_email</span>
                <input
                  className="merchant-list__input"
                  type="email"
                  required
                  value={seedUserEmail}
                  onChange={(e) => setSeedUserEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="merchant-list__field">
                <span className="merchant-list__field-label">user_phone</span>
                <input
                  className="merchant-list__input"
                  type="tel"
                  required
                  value={seedUserPhone}
                  onChange={(e) => setSeedUserPhone(e.target.value)}
                  placeholder="+919876543210"
                  autoComplete="tel"
                />
              </label>
              {seedError ? (
                <p
                  className="merchant-list__banner merchant-list__banner--error"
                  role="alert"
                >
                  {seedError}
                </p>
              ) : null}
              <div className="merchant-list__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={seedSubmitting}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={seedSubmitting}
                >
                  {seedSubmitting ? "Creating…" : "Create customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
