import { Save } from "lucide-react";

export const profileSettingsForm = {
  title: "Account Details",
  description:
    "Update your profile picture or change your password. Your username and email cannot be changed.",
  avatarLabel: "Profile Picture",
  passwordLabel: "Change Password",
  submit: { label: "Save Changes", icon: Save },
};

export const passwordFields = [
  { id: "old_password", label: "Old password", placeholder: "Old Password" },
  { id: "new_password", label: "New password", placeholder: "New Password" },
  {
    id: "confirm_password",
    label: "Confirm new password",
    placeholder: "Confirm New Password",
  },
];

// Matches the file types allowed by handle_avatar_upload()
export const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Messages from validate_profile_settings() and profile_settings.inc.php
export const profileMessages = {
  oldPasswordRequired: "Old password is required.",
  newPasswordRequired: "New password is required.",
  confirmPasswordRequired: "Please confirm your new password.",
  passwordsDoNotMatch: "New passwords do not match.",
  invalidImage: "Invalid image format.",
  avatarUpdated: "Avatar updated successfully.",
  passwordUpdated: "Password updated successfully.",
  nothingToSave: "There are no changes to save.",
};

// The line under the page title: "Member since 14 Mar 2026 · last updated 15 Sept 2026"
export const accountSummary = {
  memberSince: "Member since",
  lastUpdated: "last updated",
};

// Mock of the users table columns not held in navigationData
export const accountDetails = {
  status: "active",
  createdAt: "2026-03-14T10:22:00",
  updatedAt: "2026-09-15T21:12:00",
};
