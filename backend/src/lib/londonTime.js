// Dates as people in Manchester read them. "Tonight" or "this weekend" means
// Europe/London whatever the server's time zone, and GMT or BST as the date needs

const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
});

// [year, month, day, hour, minute] on a London clock at that moment
function londonParts(date) {
    const found = parts.formatToParts(date);
    const part = (type) => Number(found.find((p) => p.type === type).value);
    return [part('year'), part('month'), part('day'), part('hour'), part('minute')];
}

// The moment a London clock shows that date and time. Date.UTC rolls a day past
// the month's end over, so callers can add days to `day`
export function londonInstant(year, month, day, hours = 0, minutes = 0) {
    const wallClock = Date.UTC(year, month - 1, day, hours, minutes);
    const offsetAt = (instant) => {
        const [y, m, d, h, min] = londonParts(new Date(instant));
        return Date.UTC(y, m - 1, d, h, min) - instant;
    };
    // Checked a second time in case the first guess sat across a clock change
    const first = wallClock - offsetAt(wallClock);
    return new Date(wallClock - offsetAt(first));
}

// `days` from today in London (0 = today) at that time
export function londonDay(now, days, hours = 0, minutes = 0) {
    const [year, month, day] = londonParts(now);
    return londonInstant(year, month, day + days, hours, minutes);
}

// Days from today to this weekend's Friday: the weekend in progress on a Saturday
// or Sunday, otherwise the next one (frontend lib/eventDates.js, weekendRange)
export function daysToFriday(now) {
    const [year, month, day] = londonParts(now);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return weekday === 6 || weekday === 0 ? -((weekday + 2) % 7) : (5 - weekday + 7) % 7;
}

// The start times each `when` filter allows, as [from, to): the same windows as
// the frontend's whenRules. Upcoming-only is checked separately
export function whenRange(when, now) {
    if (when === 'tonight') return [null, londonDay(now, 1)];
    if (when === 'week') return [null, londonDay(now, 8)];
    const friday = daysToFriday(now);
    return [londonDay(now, friday, 17), londonDay(now, friday + 3)];
}

// One London calendar day, 'YYYY-MM-DD', as [from, to)
export function dayRange(date) {
    const [year, month, day] = date.split('-').map(Number);
    return [londonInstant(year, month, day), londonInstant(year, month, day + 1)];
}
