import { useState } from "react";
import { UserRoundCog } from "lucide-react";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import StatusMessage from "../components/UI/StatusMessage";
import {
  accountDetails,
  accountSummary,
  allowedAvatarTypes,
  passwordFields,
  profileMessages,
  profileSettingsForm,
} from "../data/profileSettingsData";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const emptyPasswords = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

// Mirrors validate_profile_settings(): only checked when a password field is filled
function validatePasswords(passwords) {
  const errors = {};
  const isChangingPassword = Object.values(passwords).some(Boolean);

  if (!isChangingPassword) return errors;
  if (!passwords.old_password)
    errors.old_password = profileMessages.oldPasswordRequired;
  if (!passwords.new_password)
    errors.new_password = profileMessages.newPasswordRequired;
  if (!passwords.confirm_password) {
    errors.confirm_password = profileMessages.confirmPasswordRequired;
  } else if (
    passwords.new_password &&
    passwords.new_password !== passwords.confirm_password
  ) {
    errors.confirm_password = profileMessages.passwordsDoNotMatch;
  }

  return errors;
}

export default function Settings({ selectedUser }) {
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savedAvatar, setSavedAvatar] = useState("");
  const [errors, setErrors] = useState({});
  const [messages, setMessages] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(accountDetails.updatedAt);
  const DefaultAvatar = selectedUser?.avatar;
  const SubmitIcon = profileSettingsForm.submit.icon;
  const shownAvatar = avatarPreview || savedAvatar;

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  }

  function handleAvatarChange(event) {
    const [file] = event.target.files;
    setMessages([]);

    if (!file) return;
    // Free the previous unsaved preview before replacing it
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    if (!allowedAvatarTypes.includes(file.type)) {
      setAvatarFile(null);
      setAvatarPreview("");
      setErrors((current) => ({
        ...current,
        avatar: profileMessages.invalidImage,
      }));
      event.target.value = "";
      return;
    }

    setErrors((current) => ({ ...current, avatar: undefined }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const passwordErrors = validatePasswords(passwords);
    const nextMessages = [];

    setErrors(passwordErrors);
    if (Object.keys(passwordErrors).length > 0) {
      setMessages([]);
      return;
    }

    if (avatarFile) {
      if (savedAvatar) URL.revokeObjectURL(savedAvatar);
      setSavedAvatar(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview("");
      event.target.elements.avatar.value = "";
      nextMessages.push(profileMessages.avatarUpdated);
    }
    if (passwords.old_password) {
      setPasswords(emptyPasswords);
      nextMessages.push(profileMessages.passwordUpdated);
    }

    if (nextMessages.length > 0) {
      setUpdatedAt(new Date().toISOString());
      setMessages(nextMessages);
    } else {
      setMessages([profileMessages.nothingToSave]);
    }
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="profile-settings-title"
      >
        <DashboardPageHeading
          id="profile-settings-title"
          icon={UserRoundCog}
          title="Profile Settings"
          summary={
            <>
              {accountSummary.memberSince}{" "}
              <time dateTime={accountDetails.createdAt}>
                {dateFormatter.format(new Date(accountDetails.createdAt))}
              </time>
              <span aria-hidden="true"> · </span>
              {accountSummary.lastUpdated}{" "}
              <time dateTime={updatedAt}>
                {dateFormatter.format(new Date(updatedAt))}
              </time>
            </>
          }
        />

        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <h3 className="contact-form-title">{profileSettingsForm.title}</h3>
            <p className="content-p">{profileSettingsForm.description}</p>

            {messages.length > 0 && (
              <StatusMessage>
                {messages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </StatusMessage>
            )}

            <div className="profile-form-grid">
              <div className="profile-form-column">
                <div className="contact-field">
                  <label htmlFor="username">Username:</label>
                  <input
                    className="profile-readonly"
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={selectedUser?.user ?? ""}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="email">Email:</label>
                  <input
                    className="profile-readonly"
                    id="email"
                    type="email"
                    value={selectedUser?.email ?? ""}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="avatar">
                    {profileSettingsForm.avatarLabel}:
                  </label>
                  <input
                    className="profile-file-input"
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept={allowedAvatarTypes.join(",")}
                    aria-describedby={errors.avatar ? "avatar-error" : undefined}
                    aria-invalid={Boolean(errors.avatar)}
                    onChange={handleAvatarChange}
                  />
                  {errors.avatar && (
                    <FieldError id="avatar-error">{errors.avatar}</FieldError>
                  )}
                  <div className="profile-avatar">
                    {shownAvatar ? (
                      <img
                        className="profile-avatar-image"
                        src={shownAvatar}
                        alt="Profile picture preview"
                      />
                    ) : (
                      DefaultAvatar && (
                        <DefaultAvatar
                          className="profile-avatar-icon"
                          aria-hidden="true"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-form-column">
                <div className="contact-field">
                  <label htmlFor="account-status">Account Status:</label>
                  <input
                    className="profile-readonly capitalize"
                    id="account-status"
                    type="text"
                    value={accountDetails.status}
                    readOnly
                  />
                </div>
                <fieldset className="contact-field">
                  <legend className="profile-legend">
                    {profileSettingsForm.passwordLabel}:
                  </legend>
                  {passwordFields.map((field) => (
                    <div className="profile-password-field" key={field.id}>
                      <label className="sr-only" htmlFor={field.id}>
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        name={field.id}
                        type="password"
                        autoComplete={
                          field.id === "old_password"
                            ? "current-password"
                            : "new-password"
                        }
                        placeholder={field.placeholder}
                        value={passwords[field.id]}
                        aria-describedby={
                          errors[field.id] ? `${field.id}-error` : undefined
                        }
                        aria-invalid={Boolean(errors[field.id])}
                        onChange={handlePasswordChange}
                      />
                      {errors[field.id] && (
                        <FieldError id={`${field.id}-error`}>{errors[field.id]}</FieldError>
                      )}
                    </div>
                  ))}
                </fieldset>
              </div>
            </div>

            <div className="dashboard-flex">
              <Button type="submit" variant="primary" size="md">
                <SubmitIcon aria-hidden="true" />
                {profileSettingsForm.submit.label}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
