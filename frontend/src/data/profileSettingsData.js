import { KeyRound, Mail, Save, Trash2, TriangleAlert, UserRound } from "lucide-react";

// Settings is four sections, each with its own Save (decided 2026-10-11):
// a title and line of explanation beside each panel on wide screens, above
// it on narrow ones. Admins have no Delete section: the schema doesn't let an
// admin delete their own account (admins come from the seed)
export const settingsSections = {
  profile: {
    title: "Profile",
    icon: UserRound,
    description: "Your picture and the name other people see on the site.",
  },
  password: {
    title: "Password",
    icon: KeyRound,
    description: "Use at least 8 characters. You'll get a notification when it changes.",
  },
  emails: {
    title: "Email notifications",
    icon: Mail,
    description: "Choose whether these also reach your inbox. They always appear under Notifications.",
  },
  deleteAccount: {
    title: "Delete account",
    icon: TriangleAlert,
    description: "Permanently remove your account and your data.",
  },
};

export const profileForm = {
  upload: "Upload picture",
  change: "Change picture",
  remove: "Remove",
  pictureHint: "JPG, PNG, WebP or GIF, up to 5 MB",
  nameLabel: "Display name",
  emailLabel: "Email",
  emailHint: "You sign in with this. It can't be changed yet.",
  verified: "Verified",
  notVerified: "Not verified",
  submit: { label: "Save profile", icon: Save },
  saved: "Profile saved",
};

// users.username is varchar(50) and not unique: it is only a display name
export const displayNameMaxLength = 50;

export const passwordForm = {
  current: "Current password",
  next: "New password",
  confirm: "Confirm new password",
  minLength: 8,
  lengthRule: "At least 8 characters",
  matchRule: "Passwords match",
  show: "Show password",
  hide: "Hide password",
  submit: { label: "Change password", icon: KeyRound },
  saved: "Password changed",
};

// The schema has one email_notifications switch per account; what it
// covers depends on the role (organisers and admins have no favourites)
export const emailSettings = {
  byRole: {
    user: {
      title: "Event emails",
      text: "Reminders before your favourite events, changes to them, and new events in your interests",
    },
    organiser: {
      title: "Emails about your events",
      text: "When an event you submitted is approved or not approved, with the reason",
    },
    admin: {
      title: "Admin emails",
      text: "Events waiting for review, new sign-ups, and events cancelled by their organiser",
    },
  },
  always: "Security emails, such as a password change or an account status change, are always sent.",
  saved: (title, on) => `Saved: ${title.toLowerCase()} ${on ? "on" : "off"}`,
};

export const deleteAccountCopy = {
  button: { label: "Delete account", icon: Trash2 },
  confirmTitle: "Delete your account?",
  removes: {
    user: ["Your favourites, interests and notifications are removed"],
    organiser: [
      "Your drafts and any events that were never public are deleted",
      "Your notifications are removed",
    ],
  },
  permanent: "This can't be undone",
  passwordLabel: "Enter your password to confirm",
  cancel: "Cancel",
  confirm: "Delete permanently",
  // Organisers with events that have been public: people may have them saved
  blocked: "You have events that have been public, so your account can't be deleted here: people may have them saved.",
  contact: "Contact us and we'll help.",
};

// Shown above the sections. Admins never see them: they are created verified
// and suspending an admin isn't defined
export const accountBanners = {
  unverified: {
    title: "Verify your email address",
    text: {
      user: "We sent a link to your email. Until it's verified you can browse and save favourites, but not receive emails.",
      organiser: "We sent a link to your email. Until it's verified you can write drafts, but not submit events or receive emails.",
    },
    resend: "Resend link",
    sent: "Link sent. Check your inbox.",
  },
  suspended: {
    title: (until) => (until ? `Your account is suspended until ${until}` : "Your account is suspended"),
    reason: "Reason:",
    text: "You can still sign in and look around, but you can't make changes.",
    contact: "Contact us",
  },
};

// Matches the file types allowed by handle_avatar_upload(); 5 MB like event images
export const allowedAvatarTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const maxAvatarBytes = 5 * 1024 * 1024;

export const profileMessages = {
  invalidImage: "Choose a JPG, PNG, WebP or GIF image.",
  imageTooLarge: "That image is over 5 MB. Choose a smaller one.",
  nameRequired: "Enter a display name.",
};

// Added to Notifications when the password changes (password_changed)
export const passwordChangedNotification = {
  subject: "Password Changed",
  body: "Your password was just changed. If this wasn't you, contact us straight away.",
};

// The line under the page title
export const accountSummary = {
  memberSince: "Member since",
};

// Mock of the users table columns not held in navigationData
// (email_verified_at, suspended_until, suspension_reason as in the schema)
export const accountDetails = {
  createdAt: "2026-03-14T10:22:00",
  emailVerifiedAt: "2026-03-14T10:31:00",
  suspendedUntil: null,
  suspensionReason: null,
};
