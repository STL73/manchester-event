import { Fragment, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/UI/Button";
import FilterPills from "../components/UI/FilterPills";
import Pagination from "../components/UI/Pagination";
import SearchBar from "../components/events/SearchBar";
import LogEntry from "../components/dashboard/LogEntry";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import { describeLog, logLookup, matchesLogView } from "../lib/systemLogs";
import {
  logViews,
  systemLogs,
  systemLogsMessages,
  systemLogsPage,
  systemLogsSection,
} from "../data/systemLogsData";

const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// "Today", "Yesterday" or "Sun 27 Sept"
function dayLabel(value, now) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(value) === dayKey(now)) return systemLogsPage.days.today;
  if (dayKey(value) === dayKey(yesterday)) return systemLogsPage.days.yesterday;
  return dayFormatter.format(new Date(value));
}

// Admin page from system_logs.php (the newest 100 logged actions), as an
// activity feed by day (decided 2026-10-12, layout A): each entry a sentence
// with links to the event or account it names, filtered by kind
export default function SystemLogs({ events, users }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const listRef = useRef(null);
  const now = useMemo(() => new Date(), []);
  const SectionIcon = systemLogsSection.icon;

  const entries = useMemo(() => {
    const lookup = logLookup(events, users);
    return systemLogs.map((log) => ({ log, description: describeLog(log, lookup) }));
  }, [events, users]);

  const viewParam = searchParams.get("view");
  const view = logViews.options.some((option) => option.value === viewParam) ? viewParam : "all";

  const counts = Object.fromEntries(
    logViews.options.map((option) => [
      option.value,
      entries.filter(({ log, description }) => matchesLogView(log, description, option.value)).length,
    ]),
  );

  const filtered = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    return entries.filter(({ log, description }) => {
      const text = [log.username, log.action, description.verb, description.target?.label, description.sub]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesLogView(log, description, view) && (!q || text.includes(q));
    });
  }, [entries, searchParams, view]);

  const { pageSize } = systemLogsPage;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
  const firstIndex = (page - 1) * pageSize;
  const pageEntries = filtered.slice(firstIndex, firstIndex + pageSize);

  // Day groups from this page only, as Notifications does
  const days = pageEntries.reduce((groups, entry) => {
    const key = dayKey(entry.log.createdAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.entries.push(entry);
    else groups.push({ key, label: dayLabel(entry.log.createdAt, now), entries: [entry] });
    return groups;
  }, []);

  function setParams(changes) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  }

  const { summary } = systemLogsPage;

  return (
    <div className="dashboard-page">
      <section className="dashboard-section" aria-labelledby="system-logs-title">
        <DashboardPageHeading
          id="system-logs-title"
          icon={SectionIcon}
          title={systemLogsSection.title}
          summary={
            entries.length > 0 && (
              <>
                <strong>{entries.length}</strong> {summary.entries(entries.length)}
                <span aria-hidden="true"> · </span>
                {summary.newest} {dayFormatter.format(new Date(entries[0].log.createdAt))}
                {counts.failed > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <strong className="log-summary-failed">{counts.failed}</strong> {summary.failed(counts.failed)}
                  </>
                )}
              </>
            )
          }
        />

        {entries.length === 0 ? (
          <EmptyState icon={SectionIcon} text={systemLogsMessages.noLogs} />
        ) : (
          <>
            <SearchBar
              filters={{ q: query }}
              onChange={(changeEvent) => setQuery(changeEvent.target.value)}
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                setParams({ q: query.trim(), page: null });
              }}
              showDate={false}
              showFilters={false}
              placeholder={systemLogsPage.searchPlaceholder}
              className="events-search-keywords-only"
            />
            <div className="events-when-row">
              <FilterPills
                label={logViews.label}
                options={logViews.options.map((option) => ({ ...option, count: counts[option.value] }))}
                value={view}
                onChange={(next) => setParams({ view: next === "all" ? null : next, page: null })}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={SectionIcon} text={systemLogsMessages.noMatches}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setParams({ q: null, view: null, page: null });
                  }}
                >
                  {systemLogsMessages.clear}
                </Button>
              </EmptyState>
            ) : (
              <div className="flex w-full flex-col" ref={listRef}>
                {days.map((day) => (
                  <Fragment key={day.key}>
                    <h2 className="group-label log-day">{day.label}</h2>
                    <ul className="panel list-panel log-list">
                      {day.entries.map(({ log, description }) => (
                        <LogEntry key={log.logId} log={log} description={description} />
                      ))}
                    </ul>
                  </Fragment>
                ))}
              </div>
            )}

            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={(next) => {
                setParams({ page: next > 1 ? String(next) : null });
                listRef.current?.scrollIntoView({ block: "start" });
              }}
              summary={systemLogsPage.paging(firstIndex + 1, firstIndex + pageEntries.length, filtered.length)}
            />
          </>
        )}
      </section>
    </div>
  );
}
