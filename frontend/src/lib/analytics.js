// Helpers that turn the app's lists into chart data, replacing the PHP
// GROUP BY queries and the groupData() function in app.js.

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
    pendingUsers: users.filter((user) => user.accStatus === "pending").length,
  };
}
