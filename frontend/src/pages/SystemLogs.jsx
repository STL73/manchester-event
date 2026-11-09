import { Fragment, useMemo, useRef, useState } from "react";
import Button from "../components/UI/Button";
import FilterPills from "../components/UI/FilterPills";
import Pagination from "../components/UI/Pagination";
import SearchBar from "../components/events/SearchBar";
import LogEntry from "../components/dashboard/LogEntry";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import StatusMessage from "../components/UI/StatusMessage";
import { describeLog, logLookup } from "../lib/systemLogs";
import { useApi } from "../hooks/useApi";
import {
  logViews,
  systemLogsMessages,
  systemLogsPage,
  systemLogsSection,
} from "../data/systemLogsData";
import { formatShortDay } from "../lib/formatDates";
import { readPage, useUrlParams } from "../hooks/useUrlParams";

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// "Today", "Yesterday" or "Sun 27 Sept"
function dayLabel(value, now) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(value) === dayKey(now)) return systemLogsPage.days.today;
  if (dayKey(value) === dayKey(yesterday)) return systemLogsPage.days.yesterday;
  return formatShortDay(value);
}

// System Logs as an activity feed by day. The view, search and page are the
// server's, so every row is reachable
export default function SystemLogs() {
  const { searchParams, setParams, setPage } = useUrlParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const listRef = useRef(null);
  const now = useMemo(() => new Date(), []);
  const SectionIcon = systemLogsSection.icon;

  const viewParam = searchParams.get("view");
  const view = logViews.options.some((option) => option.value === viewParam) ? viewParam : "all";
  const q = (searchParams.get("q") ?? "").trim();
  const requestedPage = readPage(searchParams);

  const apiQuery = new URLSearchParams({ limit: String(systemLogsPage.pageSize) });
  if (view !== "all") apiQuery.set("view", view);
  if (q) apiQuery.set("q", q);
  if (requestedPage > 1) apiQuery.set("page", String(requestedPage));
  const { payload, error, loading, retry } = useApi(`/logs?${apiQuery}`);

  const entries = (payload?.data ?? []).map((log) => ({ log, description: describeLog(log, logLookup(log)) }));
  const counts = payload?.counts ?? {};
  const { page, totalPages: pageCount, total } = payload?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const firstIndex = (page - 1) * systemLogsPage.pageSize;
  // Nothing logged at all, rather than nothing matching
  const noLogs = payload && counts.all === 0 && !q;

  // Day groups from this page only, as Notifications does
  const days = entries.reduce((groups, entry) => {
    const key = dayKey(entry.log.createdAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.entries.push(entry);
    else groups.push({ key, label: dayLabel(entry.log.createdAt, now), entries: [entry] });
    return groups;
  }, []);

  const { summary } = systemLogsPage;

  return (
    <div className="dashboard-page">
      <section className="dashboard-section" aria-labelledby="system-logs-title">
        <DashboardPageHeading
          id="system-logs-title"
          icon={SectionIcon}
          title={systemLogsSection.title}
          summary={
            counts.all > 0 && (
              <>
                <strong>{counts.all}</strong> {summary.entries(counts.all)}
                {/* The newest only when this page starts with it */}
                {view === "all" && page === 1 && entries.length > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {summary.newest} {formatShortDay(entries[0].log.createdAt)}
                  </>
                )}
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

        {error ? (
          <StatusMessage variant="error">
            <p>{systemLogsMessages.loadError}</p>
            <Button type="button" variant="secondary" size="sm" onClick={retry} className="self-start">
              {systemLogsMessages.retry}
            </Button>
          </StatusMessage>
        ) : !payload ? null : noLogs ? (
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
             
              showFilters={false}
              placeholder={systemLogsPage.searchPlaceholder}
            />
            <div className="events-when-row">
              <FilterPills
                label={logViews.label}
                options={logViews.options.map((option) => ({ ...option, count: counts[option.value] }))}
                value={view}
                onChange={(next) => setParams({ view: next === "all" ? null : next, page: null })}
              />
            </div>

            {entries.length === 0 ? (
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
              <div className="flex w-full flex-col" ref={listRef} aria-busy={loading}>
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
                setPage(next);
                listRef.current?.scrollIntoView({ block: "start" });
              }}
              summary={systemLogsPage.paging(firstIndex + 1, firstIndex + entries.length, total)}
            />
          </>
        )}
      </section>
    </div>
  );
}
