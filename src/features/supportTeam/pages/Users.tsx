import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  inviteSupportUser,
  loadSupportUsersForRole,
  patchSupportUser,
  type LoadSupportUsersForRoleArg,
} from "../supportSlice";
import {
  ROLES,
  getAssignableSupportRoles,
} from "../../../core/constants/roles";
import type { Role } from "../../../core/constants/roles";
import type { SupportUserResponse } from "../supportAPI";
import { ROUTES } from "../../../core/config/routes";
import { formatDisplayDate } from "../../../core/utils/helpers";
import "../../../layout/Layout.css";
import "./Users.css";

const MIN_PASSWORD_LENGTH = 8;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const roleLabel: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super admin",
  [ROLES.MERCHANT_ADMIN]: "Merchant admin",
  [ROLES.USER_ADMIN]: "User admin",
  [ROLES.MERCHANT_SUPPORT]: "Merchant support",
  [ROLES.USER_SUPPORT]: "User support",
};

type StatusFilter = "all" | "active" | "inactive";

type ListBucket = {
  items: SupportUserResponse[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
};

function statusToApi(
  s: StatusFilter,
): Pick<LoadSupportUsersForRoleArg, "is_active"> {
  if (s === "all") return {};
  return { is_active: s === "active" };
}

interface SupportUsersSectionProps {
  title: string;
  subtitle: string;
  listRole: typeof ROLES.MERCHANT_SUPPORT | typeof ROLES.USER_SUPPORT;
  bucket: ListBucket;
  showRoleColumn: boolean;
  /** Increment after a successful invite for this list role so pagination resets to page 1. */
  inviteEpoch: number;
}

function SupportUsersSection({
  title,
  subtitle,
  listRole,
  bucket,
  showRoleColumn,
  inviteEpoch,
}: SupportUsersSectionProps) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const offset = (page - 1) * pageSize;
  const totalPages = Math.max(1, Math.ceil(bucket.total / pageSize));

  const load = useCallback(() => {
    void dispatch(
      loadSupportUsersForRole({
        role: listRole,
        limit: pageSize,
        offset,
        ...statusToApi(statusFilter),
      }),
    );
  }, [dispatch, listRole, pageSize, offset, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [inviteEpoch]);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bucket.items;
    return bucket.items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (roleLabel[u.role] ?? u.role).toLowerCase().includes(q),
    );
  }, [bucket.items, search]);

  const rangeStart =
    bucket.total === 0 ? 0 : Math.min(offset + 1, bucket.total);
  const rangeEnd = Math.min(offset + bucket.items.length, bucket.total);

  return (
    <section
      className="support-team-api__table-card card-surface"
      aria-labelledby={`heading-${listRole}`}
    >
      <header className="support-team-api__table-head">
        <h2 id={`heading-${listRole}`} className="support-team-api__h2">
          {title}
        </h2>
        <p className="support-team-api__sub">{subtitle}</p>
      </header>

      {bucket.error ? (
        <p
          className="support-team-api__banner support-team-api__banner--error support-team-api__banner--inset"
          role="alert"
        >
          {bucket.error}
        </p>
      ) : null}

      <div className="support-team-api__filters">
        <label className="support-team-api__filter">
          <span className="support-team-api__filter-label">Search</span>
          <input
            className="support-team-api__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email"
            aria-label="Search on this page"
          />
        </label>
        <label className="support-team-api__filter">
          <span className="support-team-api__filter-label">Status</span>
          <select
            className="support-team-api__input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="support-team-api__filter">
          <span className="support-team-api__filter-label">Per page</span>
          <select
            className="support-team-api__input"
            value={pageSize}
            onChange={(e) => {
              setPageSize(
                Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
              );
              setPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="support-team-api__hint support-team-api__hint--inset">
        Search applies to the current page of results. Status uses the list API
        (<code>is_active</code>).
      </p>

      {bucket.loading ? (
        <p className="support-team-api__loading" role="status">
          Loading…
        </p>
      ) : bucket.total === 0 ? (
        <p className="support-team-api__empty">No users match the filters.</p>
      ) : filteredItems.length === 0 ? (
        <p className="support-team-api__empty">
          No users match your search on this page.
        </p>
      ) : (
        <>
          <div className="support-team-api__scroll">
            <table className="support-team-api__table support-team-api__table--responsive">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  {showRoleColumn ? <th scope="col">Role</th> : null}
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Name">
                      <span className="support-team-api__td-value">
                        {u.name}
                      </span>
                    </td>
                    <td data-label="Email">
                      <span className="support-team-api__td-value">
                        {u.email}
                      </span>
                    </td>
                    {showRoleColumn ? (
                      <td data-label="Role">
                        <span className="support-team-api__td-value">
                          <span className="support-team-api__role">
                            {roleLabel[u.role] ?? u.role}
                          </span>
                        </span>
                      </td>
                    ) : null}
                    <td data-label="Status">
                      <span className="support-team-api__td-value">
                        <span
                          className={
                            u.is_active
                              ? "support-team-api__status support-team-api__status--on"
                              : "support-team-api__status support-team-api__status--off"
                          }
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>
                    <td data-label="Created">
                      <span className="support-team-api__td-value">
                        {u.created_at ? (
                          <time dateTime={u.created_at}>
                            {formatDisplayDate(u.created_at)}
                          </time>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                    <td
                      data-label="Actions"
                      className="support-team-api__td--actions"
                    >
                      <span className="support-team-api__td-value support-team-api__td-value--actions">
                        <EditSupportUserButton user={u} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="support-team-page__pager">
            <span>
              Showing {rangeStart}–{rangeEnd} of {bucket.total}
            </span>
            <div className="support-team-page__pager-btns">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={page <= 1 || bucket.loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={page >= totalPages || bucket.loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function EditSupportUserButton({ user }: { user: SupportUserResponse }) {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editActive, setEditActive] = useState(user.is_active);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditName(user.name);
      setEditActive(user.is_active);
      setEditError(null);
    }
  }, [open, user]);

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    const name = editName.trim();
    if (!name) {
      setEditError("Name is required.");
      return;
    }
    if (user.id === currentUserId && user.is_active && !editActive) {
      setEditError("You cannot deactivate your own account.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await dispatch(
        patchSupportUser({
          email: user.email,
          payload: { name, is_active: editActive },
        }),
      ).unwrap();
      setOpen(false);
    } catch (err) {
      setEditError(typeof err === "string" ? err : "Update failed.");
    } finally {
      setEditSubmitting(false);
    }
  }

  function onToggleEditActive(next: boolean) {
    if (user.id === currentUserId && user.is_active && !next) {
      return;
    }
    setEditActive(next);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>
      {open ? (
        <div className="support-team-api__modal-root" role="presentation">
          <button
            type="button"
            className="support-team-api__backdrop"
            aria-label="Close"
            onClick={() => !editSubmitting && setOpen(false)}
          />
          <div
            className="support-team-api__modal card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dialog-title"
          >
            <h2
              id="edit-dialog-title"
              className="support-team-api__modal-title"
            >
              Edit support user
            </h2>
            <p className="support-team-api__modal-email">{user.email}</p>
            <form
              onSubmit={onSaveEdit}
              className="support-team-api__form support-team-api__form--modal"
            >
              <label className="support-team-api__field">
                <span>Name</span>
                <input
                  className="support-team-api__input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>
              <div className="support-team-api__toggle">
                <span
                  id="edit-active-label"
                  className="support-team-api__toggle-text"
                >
                  Active status
                </span>
                <button
                  type="button"
                  className={`support-team-api__switch${
                    editActive ? " support-team-api__switch--on" : ""
                  }`}
                  role="switch"
                  aria-checked={editActive}
                  aria-labelledby="edit-active-label"
                  onClick={() => onToggleEditActive(!editActive)}
                >
                  <span className="visually-hidden">
                    {editActive ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>
              {user.id === currentUserId && user.is_active ? (
                <p className="support-team-api__hint">
                  You cannot deactivate your own account.
                </p>
              ) : null}
              {editError ? (
                <p className="support-team-api__err" role="alert">
                  {editError}
                </p>
              ) : null}
              <div className="support-team-api__modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={editSubmitting}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Users() {
  const dispatch = useAppDispatch();
  const sliceError = useAppSelector((s) => s.support.error);
  const actorRole = useAppSelector((s) => s.auth.user?.role);
  const merchantBucket = useAppSelector((s) => s.support.merchantSupport);
  const userBucket = useAppSelector((s) => s.support.userSupport);

  const assignableRoles = useMemo(
    () => getAssignableSupportRoles(actorRole),
    [actorRole],
  );
  const canInvite = assignableRoles.length > 0;
  const isSuperAdmin = actorRole === ROLES.SUPER_ADMIN;

  const showMerchantList =
    actorRole === ROLES.SUPER_ADMIN || actorRole === ROLES.MERCHANT_ADMIN;
  const showUserList =
    actorRole === ROLES.SUPER_ADMIN || actorRole === ROLES.USER_ADMIN;

  const signedInAsLabel = actorRole
    ? roleLabel[actorRole] ?? actorRole.replaceAll("_", " ")
    : "—";

  const pageIntroByRole = useMemo(() => {
    switch (actorRole) {
      case ROLES.SUPER_ADMIN:
        return (
          <>
            As a super admin, you can create merchant users, edit merchants,
            create merchant admins, create user admins, create user support
            users, and edit user support details. On this page, add portal
            operators and manage merchant support and user support staff below.
          </>
        );
      case ROLES.MERCHANT_ADMIN:
        return (
          <>
            You can add merchant support staff and edit their details. This list
            shows merchant support accounts only.
          </>
        );
      case ROLES.USER_ADMIN:
        return (
          <>
            You can add user support staff and edit their details. This list
            shows user support accounts only.
          </>
        );
      default:
        return <>Manage support portal operators for your organization.</>;
    }
  }, [actorRole]);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>(
    assignableRoles[0] ?? ROLES.USER_SUPPORT,
  );
  /** New accounts default to active; turn off to create an inactive user. */
  const [inviteActive, setInviteActive] = useState(true);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [merchantInviteEpoch, setMerchantInviteEpoch] = useState(0);
  const [userInviteEpoch, setUserInviteEpoch] = useState(0);

  useEffect(() => {
    if (assignableRoles.length && !assignableRoles.includes(inviteRole)) {
      setInviteRole(assignableRoles[0]);
    }
  }, [assignableRoles, inviteRole]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    const name = inviteName.trim();
    const email = inviteEmail.trim();
    if (!name || !email || !invitePassword) {
      setInviteError("Name, email, and password are required.");
      return;
    }
    if (invitePassword.length < MIN_PASSWORD_LENGTH) {
      setInviteError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }
    setInviteSubmitting(true);
    const startActive = inviteActive;
    try {
      await dispatch(
        inviteSupportUser({
          name,
          email,
          password: invitePassword,
          role: inviteRole,
          is_active: startActive,
        }),
      ).unwrap();
      setInviteSuccess(
        `${email} was added as ${roleLabel[inviteRole] ?? inviteRole}${
          startActive ? "" : " (inactive)"
        }.`,
      );
      if (inviteRole === ROLES.MERCHANT_SUPPORT) {
        setMerchantInviteEpoch((n) => n + 1);
      } else if (inviteRole === ROLES.USER_SUPPORT) {
        setUserInviteEpoch((n) => n + 1);
      }
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteActive(true);
    } catch (err) {
      setInviteError(
        typeof err === "string" ? err : "Could not create support user.",
      );
    } finally {
      setInviteSubmitting(false);
    }
  }

  return (
    <div className="support-team-page page-shell">
      <header className="page-header">
        <div>
          <p className="page-kicker">Operations</p>
          <h1 className="page-title">Support team</h1>
          <p className="page-desc">
            <span className="page-desc__lead">
              Signed in as {signedInAsLabel}.
            </span>{" "}
            {pageIntroByRole}
          </p>
        </div>
        <div className="support-team-page__actions">
          {isSuperAdmin ? (
            <Link
              to={ROUTES.SUPPORT_TEAM_CREATE_ADMIN}
              className="btn btn--primary btn--sm"
            >
              Create Users (full page)
            </Link>
          ) : null}
        </div>
      </header>

      {sliceError ? (
        <p
          className="support-team-api__banner support-team-api__banner--error"
          role="alert"
        >
          {sliceError}
        </p>
      ) : null}

      {canInvite ? (
        <section
          className="support-team-api__invite card-surface"
          aria-labelledby="invite-heading"
        >
          <h2 id="invite-heading" className="support-team-api__h2">
            Add new member
          </h2>
          <form className="support-team-api__form" onSubmit={onInvite}>
            <label className="support-team-api__field">
              <span>Name</span>
              <input
                className="support-team-api__input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Email</span>
              <input
                className="support-team-api__input"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Password</span>
              <input
                className="support-team-api__input"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="support-team-api__field">
              <span>Role</span>
              <select
                className="support-team-api__input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r] ?? r}
                  </option>
                ))}
              </select>
            </label>
            <div className="support-team-api__toggle">
              <span
                id="invite-active-label"
                className="support-team-api__toggle-text"
              >
                Account status
              </span>
              <button
                type="button"
                className={`support-team-api__switch${
                  inviteActive ? " support-team-api__switch--on" : ""
                }`}
                role="switch"
                aria-checked={inviteActive}
                aria-labelledby="invite-active-label"
                onClick={() => setInviteActive((v) => !v)}
              >
                <span className="visually-hidden">
                  {inviteActive ? "Active" : "Inactive"}
                </span>
              </button>
            </div>
            <p className="support-team-api__hint">
              {inviteActive
                ? "New user can sign in."
                : "Creates the account as inactive; you can activate later from the list."}
            </p>
            {inviteError ? (
              <p className="support-team-api__err" role="alert">
                {inviteError}
              </p>
            ) : null}
            {inviteSuccess ? (
              <p className="support-team-api__ok" role="status">
                {inviteSuccess}
              </p>
            ) : null}
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={inviteSubmitting}
            >
              {inviteSubmitting ? "Submitting…" : "Add member"}
            </button>
          </form>
        </section>
      ) : (
        <p className="support-team-api__note card-surface" role="note">
          Your role cannot create support users via this API.
        </p>
      )}

      <div className="support-team-page__widgets">
        {showMerchantList ? (
          <SupportUsersSection
            title="Merchant support"
            subtitle="Support staff for merchant-related issues (role merchant_support)."
            listRole={ROLES.MERCHANT_SUPPORT}
            bucket={merchantBucket}
            showRoleColumn={false}
            inviteEpoch={merchantInviteEpoch}
          />
        ) : null}
        {showUserList ? (
          <SupportUsersSection
            title="User support"
            subtitle="Support staff for end-user issues (role user_support)."
            listRole={ROLES.USER_SUPPORT}
            bucket={userBucket}
            showRoleColumn={false}
            inviteEpoch={userInviteEpoch}
          />
        ) : null}
      </div>
    </div>
  );
}
