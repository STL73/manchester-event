import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import {
  accountStatuses,
  manageUsersMessages,
  userActions,
} from "../data/manageUsersData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function EditUser({ users, onUpdateUserStatus }) {
  const { userId } = useParams();
  const user = users.find((item) => String(item.userId) === userId);
  const [status, setStatus] = useState(user?.accStatus ?? "");
  const [message, setMessage] = useState("");
  const { edit, goBack, updateStatus } = userActions;

  function handleSubmit(event) {
    event.preventDefault();
    onUpdateUserStatus(user.userId, status);
    setMessage(manageUsersMessages.statusUpdated);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="edit-user-title"
      >
        <div className="section-heading-row">
          <h2 className="dashboard-title" id="edit-user-title">
            <edit.icon className="dashboard-title-icon" aria-hidden="true" />
            Edit User Status
          </h2>
          <Button to={goBack.to} variant="primary" size="sm">
            <goBack.icon aria-hidden="true" />
            {goBack.label}
          </Button>
        </div>

        {!user ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">
              {manageUsersMessages.userNotFound}
            </p>
          </div>
        ) : (
          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              {message && (
                <div className="success-message" role="status">
                  <p>{message}</p>
                </div>
              )}

              <div className="profile-form-grid">
                <div className="contact-field">
                  <label htmlFor="edit-username">Username</label>
                  <input
                    className="profile-readonly"
                    id="edit-username"
                    type="text"
                    value={user.username}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    className="profile-readonly"
                    id="edit-email"
                    type="email"
                    value={user.email}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-role">Role</label>
                  <input
                    className="profile-readonly capitalize"
                    id="edit-role"
                    type="text"
                    value={user.role}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-updated">Updated At</label>
                  <input
                    className="profile-readonly"
                    id="edit-updated"
                    type="text"
                    value={dateFormatter.format(new Date(user.updatedAt))}
                    readOnly
                  />
                </div>
                <div className="contact-field">
                  <label htmlFor="edit-status">Account Status</label>
                  <select
                    className="form-select"
                    id="edit-status"
                    name="acc_status"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setMessage("");
                    }}
                  >
                    {accountStatuses.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dashboard-flex">
                <Button type="submit" variant="primary" size="md">
                  <updateStatus.icon aria-hidden="true" />
                  {updateStatus.label}
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
