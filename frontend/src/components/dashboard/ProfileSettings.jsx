import { useRef, useState } from "react";
import { BadgeCheck, Camera, CircleAlert, CircleCheck, Lock, Trash2 } from "lucide-react";
import Button from "../UI/Button";
import FieldError from "../UI/FieldError";
import {
  allowedAvatarTypes,
  displayNameMaxLength,
  maxAvatarBytes,
  profileForm,
  profileMessages,
} from "../../data/profileSettingsData";

// Picture and display name, saved together; the email is shown locked.
// Save stays off until something differs from what is saved
export default function ProfileSettings({ selectedUser, emailVerified, onSave }) {
  const savedAvatar = selectedUser.avatarUrl ?? null;
  const [name, setName] = useState(selectedUser.user);
  const [avatarUrl, setAvatarUrl] = useState(savedAvatar);
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const DefaultAvatar = selectedUser.avatar;
  const SubmitIcon = profileForm.submit.icon;

  const trimmedName = name.trim();
  const changed = trimmedName !== selectedUser.user || avatarUrl !== savedAvatar;

  // An unsaved preview is only ours, so it can be freed when replaced
  function dropDraftAvatar() {
    if (avatarUrl && avatarUrl !== savedAvatar) URL.revokeObjectURL(avatarUrl);
  }

  function handleFile(event) {
    const [file] = event.target.files;
    event.target.value = "";
    if (!file) return;

    if (!allowedAvatarTypes.includes(file.type)) {
      setAvatarError(profileMessages.invalidImage);
      return;
    }
    if (file.size > maxAvatarBytes) {
      setAvatarError(profileMessages.imageTooLarge);
      return;
    }
    dropDraftAvatar();
    setAvatarError("");
    setSaved(false);
    setAvatarUrl(URL.createObjectURL(file));
  }

  function removeAvatar() {
    dropDraftAvatar();
    setAvatarError("");
    setSaved(false);
    setAvatarUrl(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!changed || !trimmedName) return;
    // The picture being replaced was saved before, so nothing shows it now
    if (savedAvatar && savedAvatar !== avatarUrl) URL.revokeObjectURL(savedAvatar);
    onSave({ user: trimmedName, avatarUrl });
    setName(trimmedName);
    setSaved(true);
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit} noValidate>
      <div className="settings-avatar-row">
        <div className="settings-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your profile picture" />
          ) : (
            DefaultAvatar && <DefaultAvatar aria-hidden="true" />
          )}
        </div>
        <div className="settings-avatar-actions">
          <div className="settings-avatar-buttons">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              aria-describedby={avatarError ? "avatar-error" : "avatar-hint"}
            >
              <Camera aria-hidden="true" />
              {avatarUrl ? profileForm.change : profileForm.upload}
            </Button>
            {avatarUrl && (
              <Button variant="ghost" size="sm" onClick={removeAvatar}>
                <Trash2 aria-hidden="true" />
                {profileForm.remove}
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={allowedAvatarTypes.join(",")}
            onChange={handleFile}
            hidden
          />
          {avatarError ? (
            <FieldError id="avatar-error">{avatarError}</FieldError>
          ) : (
            <p className="field-hint settings-hint" id="avatar-hint">{profileForm.pictureHint}</p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="display-name">{profileForm.nameLabel}</label>
        <input
          id="display-name"
          type="text"
          autoComplete="nickname"
          maxLength={displayNameMaxLength}
          value={name}
          aria-invalid={!trimmedName}
          aria-describedby={trimmedName ? "display-name-count" : "display-name-error"}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
        {trimmedName ? (
          <p className="field-hint settings-counter" id="display-name-count">
            {name.length}/{displayNameMaxLength}
          </p>
        ) : (
          <FieldError id="display-name-error">{profileMessages.nameRequired}</FieldError>
        )}
      </div>

      <div className="field">
        <span className="field-label">{profileForm.emailLabel}</span>
        <p className="settings-locked">
          <Lock aria-hidden="true" />
          <span className="settings-locked-value">{selectedUser.email}</span>
          {emailVerified ? (
            <span className="settings-chip is-verified">
              <BadgeCheck aria-hidden="true" />
              {profileForm.verified}
            </span>
          ) : (
            <span className="settings-chip is-unverified">
              <CircleAlert aria-hidden="true" />
              {profileForm.notVerified}
            </span>
          )}
        </p>
        <p className="field-hint settings-hint">{profileForm.emailHint}</p>
      </div>

      <div className="settings-foot">
        {saved && !changed && (
          <p className="settings-saved" role="status">
            <CircleCheck aria-hidden="true" />
            {profileForm.saved}
          </p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={!changed || !trimmedName}>
          <SubmitIcon aria-hidden="true" />
          {profileForm.submit.label}
        </Button>
      </div>
    </form>
  );
}
