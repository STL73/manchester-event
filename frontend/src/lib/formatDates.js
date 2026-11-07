// The site's date and time formats, in one place so every page writes a date
// the same way. Each takes a Date, an ISO string or a timestamp.

export const DAY = 24 * 60 * 60 * 1000;

function formatter(options) {
  const format = new Intl.DateTimeFormat("en-GB", options);
  return (value) => format.format(new Date(value));
}

// "19:30"
export const formatTime = formatter({ hour: "2-digit", minute: "2-digit" });

// "7 Nov"
export const formatDayMonth = formatter({ day: "numeric", month: "short" });

// "7 Nov 2026"
export const formatDate = formatter({ day: "numeric", month: "short", year: "numeric" });

// "7 Nov 2026, 19:30"
export const formatDateTime = formatter({
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// "Sat 7 Nov"
export const formatShortDay = formatter({ weekday: "short", day: "numeric", month: "short" });

// "Sat 7 Nov, 19:30"
export const formatShortDayTime = formatter({
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// "Saturday 7 November 2026"
export const formatLongDay = formatter({
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "7", the figure on a date tile
export const formatDayNumber = formatter({ day: "numeric" });

// "Nov", the label on a date tile
export const formatMonthShort = formatter({ month: "short" });

// "November"
export const formatMonthLong = formatter({ month: "long" });

// An event's times: "19:30 – 23:00", the end's day too when it finishes on
// another one, or the start alone when it has no end
export function formatTimeRange({ startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  if (!endDatetime) return formatTime(start);
  const end = new Date(endDatetime);
  const sameDay = start.toDateString() === end.toDateString();
  return `${formatTime(start)} – ${(sameDay ? formatTime : formatShortDayTime)(end)}`;
}

// Midnight at the start of the date's day, on this device's clock
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole days from `value` to `now`; never below 0, so a clock a little ahead
// of the server's doesn't show "-1 days"
export function daysSince(value, now) {
  return Math.max(0, Math.floor((now - new Date(value)) / DAY));
}
