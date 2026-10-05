import { Zap } from "lucide-react";
import Button from "../components/UI/Button";
import {
  logTableColumns,
  systemLogs,
  systemLogsActions,
  systemLogsMessages,
  systemLogsSection,
} from "../data/systemLogsData";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Admin page from system_logs.php: the newest 100 logged actions
export default function SystemLogs() {
  const SectionIcon = systemLogsSection.icon;

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
          {systemLogsActions.map(({ label, to, icon: Icon }) => (
            <Button key={label} to={to} variant="primary" size="md">
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="system-logs-title"
      >
        <h2 className="dashboard-title" id="system-logs-title">
          <SectionIcon className="dashboard-title-icon" aria-hidden="true" />
          {systemLogsSection.title}
        </h2>

        {systemLogs.length === 0 ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{systemLogsMessages.noLogs}</p>
          </div>
        ) : (
          <div
            className="table-wrapper"
            tabIndex="0"
            role="region"
            aria-labelledby="system-logs-title"
          >
            <table className="data-table">
              <thead>
                <tr>
                  {logTableColumns.map((column) => (
                    <th scope="col" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {systemLogs.map((log) => (
                  <tr key={log.logId}>
                    <td>
                      <time dateTime={log.createdAt}>
                        {dateFormatter.format(new Date(log.createdAt))}
                      </time>
                    </td>
                    <td>{log.username}</td>
                    <td className="tabular-nums">{log.userId ?? "—"}</td>
                    <td className="activity-action">{log.action}</td>
                    <td className="table-cell-wrap table-cell-details">
                      {log.details}
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
