import { useState } from "react";
import { Users, Zap } from "lucide-react";
import Button from "../components/UI/Button";
import Tooltip from "../components/UI/Tooltip";
import {
  accountStatuses,
  manageUsersActions,
  manageUsersMessages,
  userActions,
  userTableColumns,
} from "../data/manageUsersData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const statusLabels = Object.fromEntries(
  accountStatuses.map(({ value, label }) => [value, label]),
);

export default function ManageUsers({ users, onDeleteUser }) {
  const [message, setMessage] = useState("");
  const EditIcon = userActions.edit.icon;
  const DeleteIcon = userActions.delete.icon;

  function handleDelete(user) {
    // Matches the PHP confirm() before delete_user.inc.php runs
    if (!window.confirm(manageUsersMessages.confirmDelete)) return;
    onDeleteUser(user.userId);
    setMessage(manageUsersMessages.userDeleted);
  }

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="quick-actions-title"
      >
        <h2 className="dashboard-title" id="quick-actions-title">
          <Zap className="dashboard-title-icon" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="dashboard-actions">
          {manageUsersActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="manage-users-title"
      >
        <h2 className="dashboard-title" id="manage-users-title">
          <Users className="dashboard-title-icon" aria-hidden="true" />
          Manage Users
        </h2>

        {message && (
          <div className="success-message table-message" role="status">
            <p>{message}</p>
          </div>
        )}

        {users.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{manageUsersMessages.noUsers}</p>
          </div>
        ) : (
          <div
            className="table-wrapper"
            tabIndex="0"
            role="region"
            aria-labelledby="manage-users-title"
          >
            <table className="data-table">
              <thead>
                <tr>
                  {userTableColumns.map((column) => (
                    <th scope="col" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>
                      <span className={`status-badge status-${user.accStatus}`}>
                        {statusLabels[user.accStatus] ?? user.accStatus}
                      </span>
                    </td>
                    <td>
                      <div className="table-cell-stack">
                        <span>
                          Created {dateFormatter.format(new Date(user.createdAt))}
                        </span>
                        <span className="table-cell-secondary">
                          Updated {dateFormatter.format(new Date(user.updatedAt))}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Tooltip text={userActions.edit.tooltip}>
                          <Button
                            to={`/dashboard/manage-users/${user.userId}/edit`}
                            variant="secondary"
                            size="icon"
                            aria-label={`${userActions.edit.tooltip}: ${user.username}`}
                          >
                            <EditIcon
                             
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                        <Tooltip text={userActions.delete.tooltip}>
                          <Button
                            type="button"
                            variant="danger"
                            size="icon"
                            aria-label={`${userActions.delete.tooltip}: ${user.username}`}
                            onClick={() => handleDelete(user)}
                          >
                            <DeleteIcon
                             
                              aria-hidden="true"
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

