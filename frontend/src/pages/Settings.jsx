import { UserRoundCog } from "lucide-react";
import AccountBanner from "../components/dashboard/AccountBanner";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import SettingsSection from "../components/dashboard/SettingsSection";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import PasswordSettings from "../components/dashboard/PasswordSettings";
import EmailSettings from "../components/dashboard/EmailSettings";
import DeleteAccount from "../components/dashboard/DeleteAccount";
import { accountSummary, settingsSections } from "../data/profileSettingsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Four sections, each saving on its own. What a role sees differs in the
// email wording and in Delete: none for admins, a contact link for an
// organiser whose events have been public
export default function Settings({
  selectedUser,
  account,
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
              <time dateTime={account.createdAt}>
                {dateFormatter.format(new Date(account.createdAt))}
              </time>
            </>
          }
        />

        <div className="w-full max-w-245 self-start flex flex-col gap-10">
          <AccountBanner account={account} />

          <SettingsSection id="settings-profile" section={settingsSections.profile}>
            <ProfileSettings
              selectedUser={selectedUser}
              emailVerified={Boolean(account.emailVerifiedAt)}
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
