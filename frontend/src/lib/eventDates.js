// Date rules for public event lists, shared by Explore Events and Home.

// An event is over once COALESCE(end_datetime, start_datetime) has gone by:
// the same rule the database uses instead of storing a "past" status
export function isUpcoming(event, now) {
  return new Date(event.endDatetime ?? event.startDatetime) >= now;
}

export function bySoonest(a, b) {
  return new Date(a.startDatetime) - new Date(b.startDatetime);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// The weekend runs from Friday 5pm to the end of Sunday. On a Saturday or
// Sunday it's the one in progress, not next week's.
function weekendRange(now) {
  const today = startOfDay(now);
  const daysToFriday = (5 - today.getDay() + 7) % 7;
  const inProgress = today.getDay() === 6 || today.getDay() === 0;
  const friday = addDays(today, inProgress ? -((today.getDay() + 2) % 7) : daysToFriday);

  return {
    from: new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 17),
    to: addDays(friday, 3),
  };
}

// Upcoming events only: callers filter with isUpcoming first
const whenRules = {
  tonight: (start, now) => start < addDays(startOfDay(now), 1),
  weekend: (start, now) => {
    const { from, to } = weekendRange(now);
    return start < to && start >= from;
  },
  week: (start, now) => start < addDays(startOfDay(now), 8),
};

// `when` is one of the keys above, or "" for any date
export function matchesWhen(event, when, now) {
  const rule = whenRules[when];
  return !rule || rule(new Date(event.startDatetime), now);
}
