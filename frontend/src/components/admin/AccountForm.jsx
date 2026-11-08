import FieldError from "../UI/FieldError";
import PeriodSwitcher from "../UI/PeriodSwitcher";
import { statusLabel } from "../../lib/eventStatus";
import { accountStatuses, suspensionLengths, suspensionText, userPanel } from "../../data/manageUsersData";

// An account's status as badges: Active or Suspended, and Unverified while
// the email isn't (a label, never a status). Manage Users' rows and panel
export function StatusBadges({ user }) {
  return (
    <>
      <span className={`badge status-${user.accStatus}`}>{statusLabel(user.accStatus)}</span>
      {!user.emailVerifiedAt && <span className="badge status-unverified">Unverified</span>}
    </>
  );
}

// The panel's form: status, and for a suspension how long and why. Your own
// account and other admins' aren't changed here (decided 2026-11-03)
export default function AccountForm({ user, isSelf, form, onChange, reasonError }) {
  if (isSelf) return <p className="callout callout-compact admin-note">{userPanel.self}</p>;
  if (user.role === "admin") return <p className="callout callout-compact admin-note">{userPanel.adminTarget}</p>;
  const suspended = form.accStatus === "suspended";
  const lengthOptions = [
    // An existing suspension can be kept as it is
    ...(user.accStatus === "suspended" ? [{ value: "keep", label: `Keep: ${suspensionText(user).toLowerCase()}` }] : []),
    ...suspensionLengths,
  ];

  return (
    <div className="admin-decision">
      <div className="field">
        <span className="field-label" id="account-status-label">
          {userPanel.statusLabel}
        </span>
        <PeriodSwitcher
          label={userPanel.statusLabel}
          options={accountStatuses}
          value={form.accStatus}
          onChange={(accStatus) => onChange({ accStatus })}
        />
      </div>
      {suspended && (
        <>
          <div className="field">
            <label htmlFor="suspend-length">{userPanel.lengthLabel}</label>
            <select
              id="suspend-length"
              value={form.length}
              onChange={(changeEvent) => onChange({ length: changeEvent.target.value })}
            >
              {lengthOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="suspend-reason">
              {userPanel.reasonLabel} <span className="field-hint">({userPanel.reasonHint})</span>
            </label>
            <textarea
              id="suspend-reason"
              rows="3"
              placeholder={userPanel.reasonPlaceholder}
              value={form.reason}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? "suspend-reason-error" : undefined}
              onChange={(changeEvent) => onChange({ reason: changeEvent.target.value })}
            />
            {reasonError && <FieldError id="suspend-reason-error">{reasonError}</FieldError>}
          </div>
          <p className="callout callout-compact admin-note">{userPanel.suspendedNote[user.role === "organiser" ? "organiser" : "user"]}</p>
        </>
      )}
    </div>
  );
}
