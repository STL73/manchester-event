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
- Dates use `Intl.DateTimeFormat("en-GB", …)`
- Respect `motion-reduce:` and visible `focus-visible:` states, as `Button` does

## Naming

- Components and pages: PascalCase `.jsx`, default export
- Data files: camelCase ending in `Data.js` (`userDashboardData.js`)
- CSS classes: kebab-case, prefixed by component (`event-card-media`)

## Protected files

- `src/App.css` `@theme` block: the palette and font for the whole app. Change it only on request
- `src/components/UI/Button.jsx`: size/variant maps are tuned so every variant is the same height.
  Buttons are pills, like the site's other controls; the two search buttons keep `rounded-lg!` to
  match their inputs. `type` defaults to `"button"`, so pass `type="submit"` on form buttons
- `src/data/eventsData.js`: single source of truth for events (see above)

## Commands

Run from `frontend/`: `npm run dev`, `npm run build`, `npm run lint`.
