import {
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Check,
  Heart,
  HeartOff,
  ImageUp,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

// Turns one system_logs row into a sentence for the feed: who did what to
// which event or account, with links (System Logs and Admin Home's Recent
// Admin Actions share it). `kind` drives the filter pills; `tone` colours
// the icon. The action names are the fixed ones from log_system_action()

const eventPath = (eventId) => `/dashboard/events/${eventId}`;
const userPath = (userId) => `/dashboard/manage-users?open=${userId}`;

// The event's current name, or the one copied into the log, or its number
function eventTarget(details, lookup) {
  const name = lookup.eventName(details.eventId) ?? details.name ?? `event #${details.eventId}`;
  return lookup.eventName(details.eventId) ? { label: name, to: eventPath(details.eventId) } : { label: name };
}

function userTarget(details, lookup) {
  const name = lookup.userName(details.userId) ?? details.username ?? `user #${details.userId}`;
  return lookup.userName(details.userId) ? { label: name, to: userPath(details.userId) } : { label: name };
}

const describers = {
  "Event Status Changed": (details, lookup) => ({
    kind: "events",
    tone: details.status === "approved" ? "good" : details.status === "rejected" ? "bad" : "",
    icon: details.status === "approved" ? Check : details.status === "rejected" ? X : CalendarCheck,
    verb: details.status === "approved" ? "approved" : details.status === "rejected" ? "rejected" : `set to ${details.status}`,
    target: eventTarget(details, lookup),
    sub: details.reason ? `“${details.reason}”` : "",
  }),
  "Event Created": (details, lookup) => ({
    kind: "events",
    icon: CalendarPlus,
    verb: "created",
    target: eventTarget(details, lookup),
    after: details.status === "draft" ? "as a draft" : "and sent it for approval",
  }),
  "Event Updated": (details, lookup) => ({ kind: "events", icon: Pencil, verb: "edited", target: eventTarget(details, lookup) }),
  "Event Cancelled": (details, lookup) => ({ kind: "events", tone: "bad", icon: CalendarX, verb: "cancelled", target: eventTarget(details, lookup) }),
  "Event Deleted": (details, lookup) => ({ kind: "events", icon: Trash2, verb: "deleted", target: eventTarget(details, lookup) }),
  "Draft Submitted": (details, lookup) => ({
    kind: "events",
    icon: Send,
    verb: "sent",
    target: eventTarget(details, lookup),
    after: "for approval",
  }),
  "Favourite Added": (details, lookup) => ({ kind: "events", icon: Heart, verb: "saved", target: eventTarget(details, lookup) }),
  "Favourite Removed": (details, lookup) => ({ kind: "events", icon: HeartOff, verb: "unsaved", target: eventTarget(details, lookup) }),
  "User Registered": (details) => ({
    kind: "accounts",
    tone: "good",
    icon: UserPlus,
    verb: `signed up as ${details.role === "organiser" ? "an organiser" : "a user"}`,
    sub: details.email,
  }),
  "User Status Changed": (details, lookup) => ({
    kind: "accounts",
    tone: details.status === "suspended" ? "bad" : "",
    icon: UserCog,
    verb: details.status === "suspended" ? "suspended" : "reactivated",
    target: userTarget(details, lookup),
    sub: details.reason ? `“${details.reason}”` : "",
  }),
  "User Deleted": (details, lookup) => ({ kind: "accounts", tone: "bad", icon: UserMinus, verb: "deleted the account", target: userTarget(details, lookup) }),
  "Password Changed": () => ({ kind: "accounts", icon: KeyRound, verb: "changed their password" }),
  "Avatar Updated": () => ({ kind: "accounts", icon: ImageUp, verb: "changed their picture" }),
  "Preferences Updated": (details) => ({
    kind: "accounts",
    icon: SlidersHorizontal,
    verb: "updated their interests",
    sub: details.categories?.length ? `${details.categories.length} categories` : "",
  }),
  "User Login": () => ({ kind: "signins", tone: "quiet", icon: LogIn, verb: "signed in" }),
  "User Logout": () => ({ kind: "signins", tone: "quiet", icon: LogOut, verb: "signed out" }),
  // The actor is the account someone tried; the sentence starts with what happened
  "User Login Failed": (details) => ({
    kind: "failed",
    tone: "bad",
    icon: ShieldAlert,
    failed: true,
    sub: [details.reason, details.ip && `from ${details.ip}`].filter(Boolean).join(" · "),
  }),
};

export function describeLog(log, lookup) {
  const describe = describers[log.action];
  const base = describe ? describe(log.details ?? {}, lookup) : { kind: "accounts", icon: Pencil, verb: log.action };
  return {
    tone: "",
    after: "",
    sub: "",
    ...base,
    actor: lookup.userName(log.userId)
      ? { label: log.username, to: userPath(log.userId) }
      : { label: log.username ?? "Someone" },
    role: log.role,
  };
}

// Builds the lookups describeLog() needs from the shared state
export function logLookup(events, users) {
  return {
    eventName: (eventId) => events.find((event) => event.eventId === eventId)?.name ?? null,
    userName: (userId) => users.find((user) => user.userId === userId)?.username ?? null,
  };
}

export function matchesLogView(log, description, view) {
  if (view === "all") return true;
  if (view === "admin") return log.role === "admin";
  if (view === "signins") return description.kind === "signins" || description.kind === "failed";
  return description.kind === view;
}
