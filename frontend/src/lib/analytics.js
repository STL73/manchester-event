// Helpers that turn the app's lists into chart data, replacing the PHP
// GROUP BY queries and the groupData() function in app.js.
import { isUpcoming } from "./eventDates";

// Count items per value of `getKey`. With `order`, every listed value appears
// (zero counts included) in that order; otherwise values are sorted by count.
export function countBy(items, getKey, { order, getLabel = (key) => key } = {}) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (key != null) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const keys = order ?? [...counts.keys()];
  const rows = keys.map((key) => ({
    key,
    label: getLabel(key),
    count: counts.get(key) ?? 0,
  }));

  return order ? rows : rows.sort((a, b) => b.count - a.count);
}

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const shortMonth = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const fullMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

// ISO week: weeks start on Monday; week 1 contains the year's first Thursday
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7) };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// For each period: where a date's bucket starts, the next bucket, and its labels
const periods = {
  day: {
    start: startOfDay,
    next: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    labels: (d) => ({ label: shortDay.format(d), fullLabel: fullDay.format(d) }),
  },
  week: {
    start: (d) => {
      const day = startOfDay(d);
      day.setDate(day.getDate() - ((day.getDay() + 6) % 7)); // back to Monday
      return day;
    },
    next: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7),
    labels: (d) => {
      const { year, week } = isoWeek(d);
      return { label: `W${week} ${year}`, fullLabel: `Week ${week}, ${year}` };
    },
  },
  month: {
    start: (d) => new Date(d.getFullYear(), d.getMonth(), 1),
    next: (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
    labels: (d) => ({ label: shortMonth.format(d), fullLabel: fullMonth.format(d) }),
  },
  year: {
    start: (d) => new Date(d.getFullYear(), 0, 1),
    next: (d) => new Date(d.getFullYear() + 1, 0, 1),
    labels: (d) => ({ label: String(d.getFullYear()), fullLabel: String(d.getFullYear()) }),
  },
};

// The window a range option covers, as { from, to } (from inclusive, to
// exclusive), or null for All time. `days` / `months` count back from today;
// `around: true` also counts the same number of months forward, for charts
// that show what is scheduled as well as what has happened.
export function getRangeBounds(range, now = new Date()) {
  if (range.days) {
    const today = startOfDay(now);
    return {
      from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - range.days + 1),
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    };
  }
  if (range.months) {
    const back = range.around ? range.months : range.months - 1;
    const forward = range.around ? range.months + 1 : 1;
    return {
      from: new Date(now.getFullYear(), now.getMonth() - back, 1),
      to: new Date(now.getFullYear(), now.getMonth() + forward, 1),
    };
  }
  return null;
}

function inBounds(date, bounds) {
  return !bounds || (date >= bounds.from && date < bounds.to);
}

// Count items per day/week/month/year. With `bounds`, only items inside the
// window count and every bucket of the window is listed, so "Last 30 days"
// always shows 30 days. Without it, the buckets run from the first item to
// the last. Either way empty buckets are 0, so a line never skips quiet months.
// `getSeries(item)` splits each count into named parts (e.g. held/scheduled);
// `series` lists those names so every row has all of them.
export function countOverTime(items, getDate, period, { bounds, getSeries, series = [] } = {}) {
  const { start, next, labels } = periods[period] ?? periods.month;
  const dated = items
    .map((item) => ({ item, value: getDate(item) }))
    .filter(({ value }) => Boolean(value))
    .map(({ item, value }) => ({ item, date: new Date(value) }))
    .filter(({ date }) => inBounds(date, bounds));
  if (!bounds && dated.length === 0) return [];

  const buckets = new Map();
  dated.forEach(({ item, date }) => {
    const key = start(date).getTime();
    const bucket = buckets.get(key) ?? { count: 0 };
    bucket.count += 1;
    if (getSeries) {
      const part = getSeries(item);
      bucket[part] = (bucket[part] ?? 0) + 1;
    }
    buckets.set(key, bucket);
  });

  const times = dated.map(({ date }) => date.getTime());
  const first = start(bounds ? bounds.from : new Date(Math.min(...times)));
  const last = start(bounds ? new Date(bounds.to.getTime() - 1) : new Date(Math.max(...times)));
  const rows = [];
  for (let bucket = first; bucket <= last; bucket = next(bucket)) {
    const counts = buckets.get(bucket.getTime()) ?? { count: 0 };
    const parts = Object.fromEntries(series.map((name) => [name, counts[name] ?? 0]));
    rows.push({ key: bucket.getTime(), ...labels(bucket), ...parts, count: counts.count });
  }
  return rows;
}

// How many items fall in the part of the window up to today, against the
// same length of time just before it. Null for All time: nothing to compare.
export function countTrend(items, getDate, bounds, now = new Date()) {
  if (!bounds) return null;
  const end = Math.min(now.getTime(), bounds.to.getTime());
  const length = end - bounds.from.getTime();
  const previousFrom = bounds.from.getTime() - length;
  let current = 0;
  let previous = 0;
  items.forEach((item) => {
    const value = getDate(item);
    if (!value) return;
    const time = new Date(value).getTime();
    if (time >= bounds.from.getTime() && time <= end) current += 1;
    else if (time >= previousFrom && time < bounds.from.getTime()) previous += 1;
  });
  return { current, previous };
}

// A stat card's trend line: countTrend over the card's fixed window, with the
// wording from `config` (see cardTrend in analyticsData.js)
export function getCardTrend(items, getDate, config, now = new Date()) {
  const trend = countTrend(items, getDate, getRangeBounds(config.range, now), now);
  return { ...trend, label: config.label(trend.current), note: config.note(trend.previous) };
}

// The four site-wide totals (get_total_events(), get_pending_events(),
// get_total_users() and get_pending_users()), shared by the admin home,
// Site Analytics and the dashboard greeting so they always agree
export function getSiteTotals(users, events) {
  return {
    events: events.length,
    pendingEvents: events.filter((event) => event.status === "pending").length,
    users: users.length,
    // Not get_pending_users(): the schema has no pending account status;
    // an unverified email is something only the user can fix
    unverifiedUsers: users.filter((user) => !user.emailVerifiedAt).length,
  };
}

// ---------------------------------------------------------------------------
// Analytics round (2026-10-20): the figures behind the new panels. Each takes
// the lists and `now`, so the pages stay plain and the API can return the
// same shapes later.

const HOUR = 3600000;
const DAY = 24 * HOUR;

// Events that have been public at some point: approved, ended or called off
// (only a public event can be cancelled; one that never was is deleted)
const WENT_PUBLIC = ["approved", "past", "cancelled"];

// When an event was last sent for review: the organiser's last change. The
// backend will take it from the "Draft Submitted" log instead
function submittedAt(event) {
  return new Date(event.orgUpdatedAt ?? event.createdAt);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

// A wait in the unit a person would say: "19 h", "1.6 days"
export function formatWait(ms) {
  if (ms == null) return "–";
  const hours = ms / HOUR;
  if (hours < 48) return `${Math.max(1, Math.round(hours))} h`;
  const days = hours / 24;
  return `${days.toFixed(days < 10 ? 1 : 0)} days`;
}

// Sunday-first index (Date.getDay) to "Saturday"
const weekdayName = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
export function formatWeekday(index) {
  return weekdayName.format(new Date(2026, 0, 4 + index)); // 4 Jan 2026 was a Sunday
}

// Saves: the last 30 days against the 30 before, all time, and the day of
// the week people save on most
export function getSavesSummary(saves, now = new Date()) {
  const trend = countTrend(saves, (save) => save.createdAt, getRangeBounds({ days: 30 }, now), now);
  const byWeekday = Array(7).fill(0);
  saves.forEach((save) => {
    byWeekday[new Date(save.createdAt).getDay()] += 1;
  });
  const busiest = byWeekday.indexOf(Math.max(...byWeekday));
  return {
    last30: trend.current,
    previous30: trend.previous,
    change: trend.previous
      ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
      : null,
    allTime: saves.length,
    busiestDay: saves.length ? busiest : null,
    busiestShare: saves.length ? byWeekday[busiest] / saves.length : 0,
  };
}

// Saves per event, most saved first, joined to the events they belong to
export function rankBySaves(saves, events, limit = 5) {
  const byId = new Map(events.map((event) => [event.eventId, event]));
  return countBy(saves, (save) => save.eventId)
    .filter((row) => byId.has(row.key))
    .slice(0, limit)
    .map((row) => ({ event: byId.get(row.key), saves: row.count }));
}

// How submitted events got through review: approval rate, the average wait
// from submit to decision, what is waiting now and the latest reasons given
export function getApprovalRecord(events, now = new Date()) {
  const approved = events.filter((event) => WENT_PUBLIC.includes(event.status));
  const rejected = events.filter((event) => event.status === "rejected");
  const pending = events.filter((event) => event.status === "pending");
  const decided = approved.length + rejected.length;
  const waits = [...approved, ...rejected]
    .map((event) => new Date(event.adminUpdatedAt) - submittedAt(event))
    .filter((ms) => ms > 0);
  const pendingWaits = pending.map((event) => now - submittedAt(event));
  return {
    approved: approved.length,
    rejected: rejected.length,
    decided,
    rate: decided ? approved.length / decided : null,
    averageWait: average(waits),
    pending: pending.length,
    oldestWait: pendingWaits.length ? Math.max(...pendingWaits) : null,
    latestRejections: rejected
      .filter((event) => event.rejectionReason)
      .sort((a, b) => new Date(b.adminUpdatedAt) - new Date(a.adminUpdatedAt))
      .slice(0, 3),
  };
}

// Pending events, the longest waiting first, with how long each has waited
export function getWaitingLongest(events, now = new Date(), limit = 5) {
  return events
    .filter((event) => event.status === "pending")
    .map((event) => ({ event, wait: now - submittedAt(event) }))
    .sort((a, b) => b.wait - a.wait)
    .slice(0, limit);
}

// Review decisions per period: approved and rejected (by decision date),
// the share rejected and the average hours from submit to decision
export function getDecisionRows(events, period, bounds) {
  const decided = events.filter(
    (event) =>
      event.adminUpdatedAt &&
      (WENT_PUBLIC.includes(event.status) || event.status === "rejected"),
  );
  const rows = countOverTime(decided, (event) => event.adminUpdatedAt, period, {
    bounds,
    series: ["approved", "rejected"],
    getSeries: (event) => (event.status === "rejected" ? "rejected" : "approved"),
  });
  return rows.map((row, index) => {
    const end = rows[index + 1]?.key ?? bounds?.to.getTime() ?? Infinity;
    const waits = decided
      .filter((event) => {
        const time = new Date(event.adminUpdatedAt).getTime();
        return time >= row.key && time < end;
      })
      .map((event) => new Date(event.adminUpdatedAt) - submittedAt(event))
      .filter((ms) => ms > 0);
    const wait = average(waits);
    return {
      ...row,
      rejectedShare: row.count ? Math.round((row.rejected / row.count) * 100) : 0,
      averageHours: wait == null ? null : Math.round(wait / HOUR),
    };
  });
}

// Everyone who registered, how many verified their email, and how many of
// those are active (not suspended)
export function getSignUpFunnel(users) {
  const verified = users.filter((user) => user.emailVerifiedAt);
  return {
    registered: users.length,
    verified: verified.length,
    active: verified.filter((user) => user.accStatus === "active").length,
  };
}

// The three ways of splitting accounts on the Accounts panel. Unverified is
// a label, not a status; a suspended account counts as suspended either way.
// Unverified (grey) sits between Active and Suspended, so the green and red
// that are hardest to tell apart are never side by side
export function getAccountShares(users) {
  const count = (test) => users.filter(test).length;
  return {
    roles: [
      { key: "user", count: count((user) => user.role === "user") },
      { key: "organiser", count: count((user) => user.role === "organiser") },
      { key: "admin", count: count((user) => user.role === "admin") },
    ],
    statuses: [
      { key: "active", count: count((user) => user.accStatus === "active" && user.emailVerifiedAt) },
      { key: "unverified", count: count((user) => user.accStatus === "active" && !user.emailVerifiedAt) },
      { key: "suspended", count: count((user) => user.accStatus === "suspended") },
    ],
    // Not set = the schema's default, on
    emails: [
      { key: "on", count: count((user) => user.emailNotifications !== false) },
      { key: "off", count: count((user) => user.emailNotifications === false) },
    ],
  };
}

// Organisers who submitted or changed an event in the last 30 days, and the
// organisers with the most live events
export function getOrganiserActivity(users, events, now = new Date(), limit = 4) {
  const since = now.getTime() - 30 * DAY;
  const organisers = users.filter((user) => user.role === "organiser");
  const rows = organisers.map((user) => {
    const own = events.filter((event) => event.organiserId === user.userId);
    return {
      user,
      live: own.filter((event) => event.status === "approved" && isUpcoming(event, now)).length,
      lastSubmitted: own.length
        ? Math.max(...own.map((event) => submittedAt(event).getTime()))
        : null,
    };
  });
  return {
    organisers: organisers.length,
    active: rows.filter((row) => row.lastSubmitted >= since).length,
    top: rows
      .filter((row) => row.live > 0)
      .sort((a, b) => b.live - a.live || b.lastSubmitted - a.lastSubmitted)
      .slice(0, limit),
  };
}

// Per category: people following it, the public events coming up in it and
// followers per event (how big an audience each of those events can reach;
// null when nothing is coming up). A fact, not a judgement: nobody on the
// page creates events (decided 2026-10-20)
export function getSupplyAndDemand(follows, events, categories, now = new Date()) {
  return categories
    .map((category) => {
      const followers = follows.filter((follow) => follow.categoryId === category.id).length;
      const upcoming = events.filter(
        (event) =>
          event.categoryId === category.id &&
          event.status === "approved" &&
          isUpcoming(event, now),
      ).length;
      return {
        key: category.id,
        label: category.name,
        followers,
        upcoming,
        perEvent: upcoming ? followers / upcoming : null,
      };
    })
    .filter((row) => row.followers > 0 || row.upcoming > 0)
    .sort((a, b) => b.followers - a.followers || b.upcoming - a.upcoming);
}

// Followers of each of `categoryIds`, most followed first
export function getCategoryReach(follows, categoryIds) {
  return categoryIds
    .map((categoryId) => ({
      key: categoryId,
      count: follows.filter((follow) => follow.categoryId === categoryId).length,
    }))
    .sort((a, b) => b.count - a.count);
}

// Start times by day of the week (Monday first) and time of day: morning
// 05:00-12:00, afternoon to 17:00, evening to 22:00, night after that
export const timeSlots = ["morning", "afternoon", "evening", "night"];

export function getWeekTimeGrid(events) {
  const grid = Array.from({ length: 7 }, () => [0, 0, 0, 0]);
  events.forEach((event) => {
    const start = new Date(event.startDatetime);
    const hour = start.getHours();
    let slot = 3;
    if (hour >= 5 && hour < 12) slot = 0;
    else if (hour >= 12 && hour < 17) slot = 1;
    else if (hour >= 17 && hour < 22) slot = 2;
    grid[(start.getDay() + 6) % 7][slot] += 1;
  });
  return grid;
}

// The grid's fullest cell (Monday-first day, time slot). Null when it is
// empty or two cells share the top count: "most start on…" would be untrue
export function getBusiestSlot(grid) {
  const cells = grid.flatMap((counts, day) => counts.map((count, slot) => ({ day, slot, count })));
  const [best, next] = cells.sort((a, b) => b.count - a.count);
  return best.count > 0 && best.count > next.count ? best : null;
}

// Contact messages: average time to a reply, how quickly each was answered,
// what is unread and what has waited over three days with no reply
export function getSupportSummary(messages, now = new Date()) {
  const replyTimes = messages
    .filter((message) => message.repliedAt)
    .map((message) => new Date(message.repliedAt) - new Date(message.sentAt));
  return {
    averageReply: average(replyTimes),
    unread: messages.filter((message) => !message.readAt).length,
    overdue: messages.filter(
      (message) => !message.repliedAt && now - new Date(message.sentAt) > 3 * DAY,
    ).length,
    replySpeed: [
      { key: "day", count: replyTimes.filter((ms) => ms < DAY).length },
      { key: "days", count: replyTimes.filter((ms) => ms >= DAY && ms <= 3 * DAY).length },
      { key: "late", count: replyTimes.filter((ms) => ms > 3 * DAY).length },
    ],
  };
}

// Suspended accounts, and the ones whose suspension ends in the next week
export function getSuspensions(users, now = new Date()) {
  const suspended = users.filter((user) => user.accStatus === "suspended");
  const weekAhead = now.getTime() + 7 * DAY;
  return {
    total: suspended.length,
    indefinite: suspended.filter((user) => !user.suspendedUntil).length,
    endingSoon: suspended
      .filter(
        (user) =>
          user.suspendedUntil && new Date(user.suspendedUntil).getTime() <= weekAhead,
      )
      .sort((a, b) => new Date(a.suspendedUntil) - new Date(b.suspendedUntil)),
  };
}
