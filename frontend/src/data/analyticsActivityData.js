import { initialEvents } from "./eventsData";
import { mockUsers } from "./manageUsersData";
import { initialFavouriteIds } from "./myFavouritesData";

// Stand-ins for the rows the analytics pages read that no other page keeps
// (decided 2026-10-20): every user's saves (the favourites table; App only
// holds the signed-in user's), category follows, and two weeks of sign-in
// rows from system_logs. They are made up but fixed: a seeded generator gives
// the same rows on every load, dated back from today so "the last 30 days"
// always has something in it. The API replaces all of this.

// The signed-in test user (user@email.com in navigationData). Their saves
// and follows come live from App state instead, so a heart clicked on
// Explore Events shows up in the figures
export const signedInUserId = 7;

const DAY = 86400000;

// mulberry32: a tiny seeded random number generator, so the rows never change
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const today = new Date();
const savers = mockUsers.filter(
  (user) => user.role === "user" && user.userId !== signedInUserId,
);
// Only events people could see could be saved
const savable = initialEvents.filter((event) =>
  ["approved", "past", "cancelled"].includes(event.status),
);

// A save falls between the event going public and its start (or today, if
// sooner), no more than 200 days back. Half of them move to the Friday to
// Sunday after, when people plan their week out, so the busiest day is real
function saveDate(event, random) {
  const published = new Date(event.adminUpdatedAt ?? event.createdAt).getTime();
  const from = Math.max(published, today.getTime() - 200 * DAY);
  const to = Math.min(today.getTime(), new Date(event.startDatetime).getTime());
  if (from >= to) return null;
  let time = from + random() * (to - from);
  if (random() < 0.5) {
    const weekday = new Date(time).getDay();
    const toWeekend = weekday === 0 ? 0 : 5 - weekday + Math.floor(random() * 2);
    if (toWeekend > 0 && time + toWeekend * DAY < to) time += toWeekend * DAY;
  }
  return new Date(time).toISOString();
}

function makeSaves() {
  const random = seeded(2026);
  const rows = [];
  savable.forEach((event) => {
    const popularity = 0.15 + random() * 0.6;
    savers.forEach((user) => {
      if (random() >= popularity) return;
      const createdAt = saveDate(event, random);
      if (createdAt) rows.push({ userId: user.userId, eventId: event.eventId, createdAt });
    });
  });
  return rows;
}

// Mock of the favourites table without the signed-in user's rows
export const otherUsersSaves = makeSaves();

// The signed-in user's favourites have no saved date in App state, so the
// ones they start with get a fixed one and any added since count as today
const startingSaveDates = (() => {
  const random = seeded(7);
  return new Map(
    initialFavouriteIds.map((eventId) => {
      const event = initialEvents.find((item) => item.eventId === eventId);
      return [eventId, (event && saveDate(event, random)) ?? today.toISOString()];
    }),
  );
})();

// Every user's saves: the generated rows plus the signed-in user's live ones
export function allSaves(favouriteIds) {
  const own = favouriteIds.map((eventId) => ({
    userId: signedInUserId,
    eventId,
    createdAt: startingSaveDates.get(eventId) ?? new Date().toISOString(),
  }));
  return [...otherUsersSaves, ...own];
}

// Mock of category_follows without the signed-in user's rows: each person
// follows the categories they save most in, plus one or two of their own
function makeFollows() {
  const random = seeded(73);
  const categoryOf = new Map(initialEvents.map((event) => [event.eventId, event.categoryId]));
  const allCategories = [...new Set(initialEvents.map((event) => event.categoryId))];
  return savers.flatMap((user) => {
    const saved = otherUsersSaves
      .filter((save) => save.userId === user.userId)
      .map((save) => categoryOf.get(save.eventId));
    const picks = new Set(saved.filter((categoryId, index) => saved.indexOf(categoryId) !== index));
    const extra = 1 + Math.floor(random() * 2);
    for (let i = 0; i < extra; i++) {
      picks.add(allCategories[Math.floor(random() * allCategories.length)]);
    }
    return [...picks].map((categoryId) => ({ userId: user.userId, categoryId }));
  });
}

export const otherUsersFollows = makeFollows();

// Every follow: the generated rows plus the signed-in user's Preferences
export function allFollows(interestIds) {
  return [
    ...otherUsersFollows,
    ...interestIds.map((categoryId) => ({ userId: signedInUserId, categoryId })),
  ];
}

// Two weeks of sign-in rows in system_logs' shape. Failed ones are a few a
// day, with one burst against a single account six days ago: what the
// Failed sign-ins chart is there to catch
function makeSignIns() {
  const random = seeded(19);
  const active = mockUsers.filter((user) => user.accStatus === "active");
  const rows = [];
  let logId = 1000;
  const row = (user, action, details, time) => ({
    logId: logId++,
    userId: user.userId,
    username: user.username,
    role: user.role,
    action,
    details,
    createdAt: new Date(time).toISOString(),
  });
  for (let daysBack = 13; daysBack >= 0; daysBack--) {
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack);
    const time = () => dayStart.getTime() + (7 + random() * 16) * 3600000;
    const logins = 3 + Math.floor(random() * 6);
    for (let i = 0; i < logins; i++) {
      rows.push(row(active[Math.floor(random() * active.length)], "User Login", null, time()));
    }
    const failed = daysBack === 6 ? 14 : Math.floor(random() * 3);
    const target = daysBack === 6 ? active[0] : null;
    for (let i = 0; i < failed; i++) {
      const user = target ?? active[Math.floor(random() * active.length)];
      rows.push(row(user, "User Login Failed", { reason: "Incorrect password" }, time()));
    }
  }
  // Clipped to now, so today only has what has happened so far
  return rows.filter((log) => new Date(log.createdAt) <= today);
}

export const signInLogs = makeSignIns();
