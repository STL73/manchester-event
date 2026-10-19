import { Link } from "react-router-dom";
import { systemLogsPage } from "../../data/systemLogsData";

const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function Target({ target }) {
  if (!target) return null;
  return target.to ? (
    <Link className="log-entry-link" to={target.to}>
      {target.label}
    </Link>
  ) : (
    <span className="log-entry-name">{target.label}</span>
  );
}

// One system log as a sentence (see describeLog in lib/systemLogs.js): the
// action's icon in the logo's cell, who did what to which event or account,
// a line of detail, and the time. System Logs and Admin Home share it
export default function LogEntry({ log, description, time }) {
  const { icon: Icon, tone, actor, role, verb, target, after, sub, failed } = description;

  return (
    <li className={`list-row log-entry ${failed ? "is-failed" : ""}`}>
      <span className={`hex-fill tone-${tone || "accent"} log-entry-icon`} aria-hidden="true">
        <Icon />
      </span>
      <p className="log-entry-text">
        {failed ? (
          <>
            <span className="log-entry-failed">{systemLogsPage.failedSignIn}</span> {systemLogsPage.failedFor}{" "}
            <Target target={actor} />
          </>
        ) : (
          <>
            <Target target={actor} />
            {role && <span className="log-entry-role">{role}</span>} {verb} <Target target={target} />
            {after && ` ${after}`}
          </>
        )}
        {sub && <span className="log-entry-sub">{sub}</span>}
      </p>
      <time className="log-entry-time" dateTime={log.createdAt}>
        {time ?? timeFormatter.format(new Date(log.createdAt))}
      </time>
    </li>
  );
}
