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
  `DashboardCard` or `Button`? Add an optional prop. `Button` already does links (`to`), five
  variants and four sizes
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
- **Dashboard pages** open with a title row: the page's title, with its shortcuts as small
  secondary buttons beside it (`DashboardShortcuts`, no visible "Quick actions" label). Inner pages
  use `DashboardPageHeading`; on Home the greeting is the title. The PHP pages put a Quick Actions
  block above the title; changed 2026-10-10
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
