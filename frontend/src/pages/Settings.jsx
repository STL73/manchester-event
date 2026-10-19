import { useState } from "react";
import { Link } from "react-router-dom";
import { MailWarning, Send, ShieldAlert, UserRoundCog } from "lucide-react";
import Button from "../components/UI/Button";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import SettingsSection from "../components/dashboard/SettingsSection";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import PasswordSettings from "../components/dashboard/PasswordSettings";
import EmailSettings from "../components/dashboard/EmailSettings";
import DeleteAccount from "../components/dashboard/DeleteAccount";
import {
  accountBanners,
  accountDetails,
  accountSummary,
  settingsSections,
} from "../data/profileSettingsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Only when something limits the account: an unverified email or a
// suspension. Admins never get either
function AccountBanner({ role, details }) {
  const [resent, setResent] = useState(false);

  if (role === "admin") return null;

  if (details.suspendedUntil !== null || details.suspensionReason) {
    const { suspended } = accountBanners;
    const until = details.suspendedUntil && dateFormatter.format(new Date(details.suspendedUntil));
    return (
      <div className="callout settings-banner tone-danger" role="status">
        <ShieldAlert aria-hidden="true" />
        <div>
          <p className="settings-banner-title">{suspended.title(until)}</p>
          {details.suspensionReason && (
            <p>
              {suspended.reason} {details.suspensionReason}
            </p>
          )}
          <p>
            {suspended.text}{" "}
            <Link className="settings-link" to="/contact">{suspended.contact}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!details.emailVerifiedAt) {
    const { unverified } = accountBanners;
    return (
      <div className="callout settings-banner tone-warning" role="status">
        <MailWarning aria-hidden="true" />
        <div>
          <p className="settings-banner-title">{unverified.title}</p>
          <p>{unverified.text[role] ?? unverified.text.user}</p>
          {resent ? (
            <p className="settings-banner-done">{unverified.sent}</p>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setResent(true)}>
              <Send aria-hidden="true" />
              {unverified.resend}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Four sections, each saving on its own. What a role sees differs in the
// email wording and in Delete: none for admins, a contact link for an
// organiser whose events have been public
export default function Settings({
  selectedUser,
  hasPublicEvents,
  onSaveProfile,
  onPasswordChanged,
  onEmailNotificationsChange,
  onDeleteAccount,
}) {
  const role = selectedUser.type;

  return (
    <div className="dashboard-page">
      <section className="dashboard-section" aria-labelledby="settings-title">
        <DashboardPageHeading
          id="settings-title"
          icon={UserRoundCog}
          title="Settings"
          summary={
            <>
              {accountSummary.memberSince}{" "}
              <time dateTime={accountDetails.createdAt}>
                {dateFormatter.format(new Date(accountDetails.createdAt))}
              </time>
            </>
          }
        />

        <div className="settings-layout">
          <AccountBanner role={role} details={accountDetails} />

          <SettingsSection id="settings-profile" section={settingsSections.profile}>
            <ProfileSettings
              selectedUser={selectedUser}
              emailVerified={Boolean(accountDetails.emailVerifiedAt)}
              onSave={onSaveProfile}
            />
          </SettingsSection>

          <SettingsSection id="settings-password" section={settingsSections.password}>
            <PasswordSettings email={selectedUser.email} onChange={onPasswordChanged} />
          </SettingsSection>

          <SettingsSection id="settings-emails" section={settingsSections.emails}>
            <EmailSettings
              role={role}
              enabled={selectedUser.emailNotifications ?? true}
              onChange={onEmailNotificationsChange}
            />
          </SettingsSection>

          {role !== "admin" && (
            <SettingsSection id="settings-delete" section={settingsSections.deleteAccount} danger>
              <DeleteAccount role={role} hasPublicEvents={hasPublicEvents} onDelete={onDeleteAccount} />
            </SettingsSection>
          )}
        </div>
      </section>
    </div>
  );
}
