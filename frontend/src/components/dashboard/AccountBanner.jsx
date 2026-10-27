import { useState } from "react";
import { Link } from "react-router-dom";
import { MailWarning, Send, ShieldAlert } from "lucide-react";
import Button from "../UI/Button";
import { api } from "../../lib/api";
import { accountBanners } from "../../data/profileSettingsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Only when something limits the account: an unverified email or a
// suspension. Admins never get either. On Settings and on Home, so a new
// account sees the email reminder where it lands after signing up
export default function AccountBanner({ account, className = "" }) {
  // idle, sending, sent, or the error's message
  const [resend, setResend] = useState("idle");

  if (account.role === "admin") return null;

  async function resendLink() {
    setResend("sending");
    try {
      await api("/auth/resend-verification", { method: "POST" });
      setResend("sent");
    } catch (error) {
      setResend(error.message);
    }
  }

  if (account.accStatus === "suspended") {
    const { suspended } = accountBanners;
    const until = account.suspendedUntil && dateFormatter.format(new Date(account.suspendedUntil));
    return (
      <div className={`callout settings-banner tone-danger ${className}`.trim()} role="status">
        <ShieldAlert aria-hidden="true" />
        <div>
          <p className="settings-banner-title">{suspended.title(until)}</p>
          {account.suspensionReason && (
            <p>
              {suspended.reason} {account.suspensionReason}
            </p>
          )}
          <p>
            {suspended.text}{" "}
            <Link className="settings-link" to="/dashboard/contact">{suspended.contact}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!account.emailVerifiedAt) {
    const { unverified } = accountBanners;
    const failed = !["idle", "sending", "sent"].includes(resend);
    return (
      <div className={`callout settings-banner tone-warning ${className}`.trim()} role="status">
        <MailWarning aria-hidden="true" />
        <div>
          <p className="settings-banner-title">{unverified.title}</p>
          <p>{unverified.text[account.role] ?? unverified.text.user}</p>
          {resend === "sent" ? (
            <p className="settings-banner-done">{unverified.sent}</p>
          ) : (
            <>
              {failed && <p className="text-danger">{resend}</p>}
              <Button variant="secondary" size="sm" onClick={resendLink} disabled={resend === "sending"}>
                <Send aria-hidden="true" />
                {unverified.resend}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
