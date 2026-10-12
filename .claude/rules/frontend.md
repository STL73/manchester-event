# Frontend Rules

The frontend is a React port of the old PHP portal. Comments that reference `.php` files or PHP
functions record behaviour being matched on purpose: keep that parity unless told otherwise.

## Stack constraints

- React 19, Vite 8, React Router 7 (`BrowserRouter` in `src/main.jsx`), plain JSX with no TypeScript
- Tailwind CSS v4 through `@tailwindcss/vite`. There is **no `tailwind.config.js`**: theme tokens
  live in the `@theme` block at the top of `src/App.css`
- Icons: **lucide-react first**. `react-icons` is used only for the brand icons lucide doesn't
  have (the footer's social links, `data/socialLinks.js`). Don't use it for anything else
- Charts: Recharts, **only** inside the analytics pages, which `App.jsx` lazy-loads so Recharts
  stays out of the main bundle. Keep any new chart page lazy too
- Data fetching: none yet. Every page runs on mock data (see below)

## Layout

```text
frontend/src/
├── App.jsx            routes + all shared app state (events, users, favourites, messages)
├── App.css            Tailwind import, @theme tokens, component classes via @apply
├── pages/             one file per route
├── components/
│   ├── UI/            shared primitives: Button, DashboardCard, Tooltip
│   ├── layout/        Navbar, Sidebar, MainNav, SecondaryNav, UserNav, Footer
│   ├── events/        EventCard, EventsBrowser, SearchBar
│   ├── charts/        Recharts wrappers
│   ├── dashboard/     greeting and weather bar
│   └── home/          public landing sections
├── data/              <name>Data.js mock data + helpers, one per page/feature
├── lib/               pure helpers (analytics.js: chart aggregation)
└── images/            event images
```

## Required patterns

- **One events list.** `initialEvents` in `data/eventsData.js` is the single source. `App.jsx`
  holds it in state and derives views (`publicEvents`, `organiserEvents`, `managedEvents`). Never
  add a second event array in another data file; derive from the one list
- **State that crosses pages lives in `App.jsx`** and goes down as props (users, favourites,
  contact messages). There is no context or store yet, so don't add one without discussing it
- **Page copy and config live in `data/`**, not inline in the page: titles, nav, form fields,
  action labels. The `navigationData.js` role model (`user`, `organiser`, `admin`) drives the sidebar
- **Extend shared components, don't wrap or copy them.** Need a variant of `EventCard`,
  `DashboardCard` or `Button`? Add an optional prop. `Button` already does links (`to`), six
  variants and four sizes. `destructive` (solid red, `danger` / `danger-hover` tokens) is only for
  the final step that can't be undone; the step before it uses the outlined `danger`
- **Styling:** use the theme colour tokens (`bg-card`, `text-muted`, `border-border`, `text-accent`,
  `bg-background`, `text-foreground`, `text-danger` for errors and destructive actions,
  `text-favourite` for the favourite heart), never raw hex. Tailwind's own palette appears only
  for status colours: one per status badge (green, yellow, orange, cyan, grey), green for the
  success message and a faint slate for past rows in tables.
  Repeated multi-utility patterns get a semantic class in `App.css` built with `@apply` (e.g.
  `.event-card`, `.status-badge`), which is how most components are styled
- **Corner radius:** panels that hold a page's content (forms, tables, chart cards, detail and
  activity panels) are 16px (`rounded-2xl`), public and dashboard alike. Cards in a grid, list
  items and small boxes are 12px (`rounded-xl`). The filter bar is 40px round its pill fields.
  Decided 2026-10-10
- **Selected vs action:** a selected option (navbar and sidebar links, date pills, range toggle,
  view switcher) gets the accent tint: `bg-accent/15`, an `accent/30` ring, bright text. Solid
  accent is only for buttons that do something (Search, Save, Submit)
- **Dashboard pages** open with a title row: the page's title (`DashboardPageHeading`; on Home the
  greeting), and beside it only the page's own actions, e.g. "Create event" on My Events and My
  Drafts, Go Back, Mark All as Read. **No navigation shortcuts:** the sidebar already links every
  page. The PHP pages had a Quick Actions block of links; removed 2026-10-10
- **Preferences is a honeycomb** (decided 2026-10-11): one hexagon per category
  (`components/dashboard/CategoryHoneycomb.jsx`, rows from `lib/honeycomb.js`: 3-4-5-4-3 for 19,
  interlocking rows for any other count or width, 1-2-1 on phones). Icons per slug in
  `preferencesData.js`, `Tag` for a category without one. "Your picks" sits beside it on wide
  screens at a fixed height (counts, next 3 events, Save; no interest chips, the hexagons show
  them) and becomes a bar pinned above it below 64rem
- **My Favourites** (decided 2026-10-11): upcoming favourites soonest first, then a "Past and
  cancelled" section of greyed cards (`EventCard`'s `muted` prop plus the status badge), heart
  kept so they can be removed. **Add to calendar** downloads an `.ics` from `lib/calendar.js`
  (Europe/London times, no invented end time), icon `CalendarArrowDown`. It sits on upcoming
  My Favourites cards (`onAddToCalendar`) and as a labelled button on Event details
- **Event details** (decided 2026-10-12): layout A, shared by the public page and the dashboard.
  Photo (21:8, at most 320px), then the name and "About this event" beside a panel with when
  (start to end), where (area, address, Open in Google Maps), organiser and the actions; below
  52rem the panel moves under the name. Users and guests get Tickets and info, Add to calendar
  and Save (guests a log-in line instead) while the event is to come; an ended or cancelled
  favourite keeps only its heart. Organisers and admins check rather than attend: a status badge
  and the ticket link as a fact, no buttons. One banner at most, in the status colour: cancelled,
  ended, pending, rejected, draft. `canViewEvent` (in `eventsData.js`) decides who may open
  what; anything else reads as not found. The map stays a link until the backend has the venue's
  coordinates
- **Notifications** (decided 2026-10-11): read state lives in `App.jsx` (`readAt`), so Home's
  unread card agrees. Rows grouped Today / Earlier this week / Earlier, collapsed to type icon,
  subject and time (64px); opening one shows the message and marks it read, one open at a time,
  with View event only when there is an `eventId` (cancelled events open too). The envelope shows
  state: closed while unread (opens on hover, marks read), faint open once read. 10 per page:
  fits a desktop or tablet screen, a laptop scrolls about 3 rows. Below 24rem the type icon hides
  so the subject gets two lines. An All / Unread (n) switch (`PeriodSwitcher`, `?show=unread`)
  sits above the list; rows read while Unread is showing stay until the view or page changes. No
  type filter or search for now. Contact Messages still uses the old `.notification-card` styles
- **Settings** (decided 2026-10-11): four sections (`SettingsSection`), each with its title and
  explanation in a 240px column beside its panel, above it below 44rem, and each saving on its
  own: Profile (picture up to 5 MB with Remove, editable display name, locked email with a
  Verified chip), Password (`UI/PasswordInput` eye, 8-character and match rules, adds a Password
  changed notification), Email notifications (one `UI/Switch`, wording per role, saves at once),
  Delete account (confirmed in the page with the password; organisers whose events have been
  public get a contact link; no section for admins). Banners only for an unverified email or a
  suspension, never for admins. Name, picture and the switch live in App (`profileChanges`) so
  the sidebar and greeting follow
- **Hexagons in the dashboard** (decided 2026-10-11, extended 2026-10-12): each frames something
  that is already there, so the logo shows without overusing it. Every page title's icon sits in
  the logo's cell (`DashboardPageHeading`, 36 x 40); on Home the greeting's picture does
  (`DashboardGreeting`, 58 x 64, the default icon without a picture, above the text below 28rem).
  Every stat card's icon sits in a small cell (`DashboardCard`, 30 x 33, accent icon), on Home and
  the analytics pages alike. Every "nothing here" box is `UI/EmptyState` (a three-cell honeycomb
  with the page's icon, the message, an optional action). No corner watermarks, hexagon
  section-heading icons, honeycomb dividers between dashboard sections or hexagon pagination:
  the sidebar pattern and Preferences already carry the rest
- **Pagination:** `components/UI/Pagination.jsx`, page number in the URL (`?page=`), back to page 1
  when a filter changes. Explore Events shows 12 per page (whole rows in every view)
- **Dashboard headings** (decided 2026-10-10): the page title is the page's only `<h1>`, 24px white
  with its icon (`DashboardPageHeading`, or the greeting on Home); the sidebar's "… Dashboard" is
  plain text. Section headings are `<h2>` `.dashboard-title`, 20px muted. Panel titles inside the
  dashboard (`.contact-form-title`) are 20px; the public Contact form keeps 24px. Page-specific
  buttons (Go Back, Mark All as Read) go in the title row as `DashboardPageHeading`'s children
- **Dashboard spacing:** 32px under the title row, 48px between sections, 16px from a heading to
  its content (`.dashboard-home` / `.dashboard-section` gaps, see the comment in `App.css`)
- **Stat cards only on the three Home pages.** Each card answers "what needs me, what's coming, or
  how am I doing", and always has one context line (`trend`, `action` or `detail` in
  `DashboardCard`); no bare figures. Inner pages get a one-line summary under the title instead
  (`DashboardPageHeading`'s `summary`, figures in `<strong>`), with its own wording when empty.
  Cards have a 5% white top gradient, never a hue. Decided 2026-10-10
- **Responsive layout inside the dashboard** uses container queries (`@container (max-width: …)`
  in `App.css`), not window breakpoints: `.dashboard-content` is the container, so a page responds
  to the space beside the sidebar. `<main>` is a container too, so the parts shared with public pages
  (filter bar, event grid) follow the same rules on both. Window `@media` rules stay for the page
  frame: navbar, sidebar rail, outer margins
- Dates use `Intl.DateTimeFormat("en-GB", …)`
- Respect `motion-reduce:` and visible `focus-visible:` states, as `Button` does

## Naming

- Components and pages: PascalCase `.jsx`, default export
- Data files: camelCase ending in `Data.js` (`userDashboardData.js`)
- CSS classes: kebab-case, prefixed by component (`event-card-media`)

## Protected files

- `src/App.css` `@theme` block: the palette and font for the whole app. Change it only on request
- `src/components/UI/Button.jsx`: size/variant maps are tuned so every variant is the same height.
  Buttons are pills, like the site's other controls (things you click are pills; form fields have
  8px corners). Search and filter bars are the exception the other way: their fields are pills
  too, on Home, Explore Events and My Events, since they read as one control rather than a form.
  `type` defaults to `"button"`, so pass `type="submit"` on form buttons
- `src/data/eventsData.js`: single source of truth for events (see above)

## Commands

Run from `frontend/`: `npm run dev`, `npm run build`, `npm run lint`.
