import { KeyRound, Mail, Save, Trash2, TriangleAlert, UserRound } from "lucide-react";

// Settings' four sections, each with its own Save. Admins have no Delete: their
// accounts come from the seed
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

// The one email switch, worded per role for what the email job sends it; new
// sign-ups stay in the admin's inbox
export const emailSettings = {
  byRole: {
    user: {
      title: "Event emails",
      text: "Reminders a week and a day before your favourite events, changes or cancellations, and new events in your interests",
    },
    organiser: {
      title: "Emails about your events",
      text: "When an event you submitted is approved, not approved or cancelled by an admin, with the reason",
    },
    admin: {
      title: "Admin emails",
      text: "Events waiting for review and events cancelled by their organiser",
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

// The picture types allowed, 5 MB like event photos
export const allowedAvatarTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const maxAvatarBytes = 5 * 1024 * 1024;

export const profileMessages = {
  invalidImage: "Choose a JPG, PNG, WebP or GIF image.",
  imageTooLarge: "That image is over 5 MB. Choose a smaller one.",
  nameRequired: "Enter a display name.",
};

// The line under the page title
export const accountSummary = {
  memberSince: "Member since",
};
