import { UserRoundCog } from "lucide-react";
import AccountBanner from "../components/dashboard/AccountBanner";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import SettingsSection from "../components/dashboard/SettingsSection";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import PasswordSettings from "../components/dashboard/PasswordSettings";
import EmailSettings from "../components/dashboard/EmailSettings";
import DeleteAccount from "../components/dashboard/DeleteAccount";
import { accountSummary, settingsSections } from "../data/profileSettingsData";
import { formatDate } from "../lib/formatDates";

// Four sections, each saving on its own. What a role sees differs in the
// email wording and in Delete: none for admins, and the server refuses an
// organiser whose events have been public. Everything comes from `account`,
// the server's; `defaultAvatar` is the role's icon for an account with no picture
export default function Settings({
  account,
  defaultAvatar,
  onSaveProfile,
  onChangePassword,
  onEmailNotificationsChange,
  onDeleteAccount,
}) {
  const role = account.role;

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
                {formatDate(account.createdAt)}
              </time>
            </>
          }
        />

        <div className="w-full max-w-245 self-start flex flex-col gap-10">
          <AccountBanner account={account} />

          <SettingsSection id="settings-profile" section={settingsSections.profile}>
            <ProfileSettings account={account} defaultAvatar={defaultAvatar} onSave={onSaveProfile} />
          </SettingsSection>

          <SettingsSection id="settings-password" section={settingsSections.password}>
            <PasswordSettings email={account.email} onChange={onChangePassword} />
          </SettingsSection>

          <SettingsSection id="settings-emails" section={settingsSections.emails}>
            <EmailSettings
              role={role}
              enabled={account.emailNotifications ?? true}
              onChange={onEmailNotificationsChange}
            />
          </SettingsSection>

          {role !== "admin" && (
            <SettingsSection id="settings-delete" section={settingsSections.deleteAccount} danger>
              <DeleteAccount role={role} onDelete={onDeleteAccount} />
            </SettingsSection>
          )}
        </div>
      </section>
    </div>
  );
}
