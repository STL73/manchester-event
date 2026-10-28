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
- **Dashboard routes are role-guarded** (2026-10-12): each role's pages sit inside
  `<Route element={<RoleOnly allow="…" />}>` in `App.jsx`, the same pages its sidebar lists;
  another role typing the address goes to its Home. Home, Event details, Notifications and
  Settings are everyone's. A new role-only page goes inside its role's group
- **Dashboard pages are lazy** (2026-10-12): `App.jsx` `lazy()`-imports the dashboard frame and
  every page only the dashboard uses, and `Dashboard` wraps its `<Outlet>` in `Suspense` with
  `UI/PageLoading`. A new dashboard page is lazy too. Explore Events and Event details stay eager:
  the public site uses them
- Data fetching: through `lib/api.js` (`api(path, { method, body })`, throws `ApiError`), with the
  Vite proxy sending `/api` to the backend. Used so far by auth (Phases 1 and 2): `App.jsx` (`/auth/me`,
  logout, and Settings' handlers), `Auth.jsx` (log in, sign up, forgot and reset password, one
  `AuthForm` driven by `authPageData`), `VerifyEmail.jsx` and `AccountBanner`'s Resend. Public
  events (Phase 3): reads go through `lib/useApi.js` (`useApi(path)`: `payload`, `error`,
  `loading`, `retry`; the last answer stays while the next loads) and `lib/publicEvents.js`
  (`toEvent()` turns an API event into the shape `EventCard` and Event details read;
  `eventsPath()` builds the query). `EventsBrowser` (Explore, public and dashboard), Home
  (`/events/summary` + What's on), About's figure, Preferences (`/categories` + next 3) and
  Event details for guests and users. Favourites and interests (Phase 4): `App.jsx` loads
  `/users/me/favourites` and `/users/me/follows` when a user-role account logs in and keeps them
  with that account's id, so the next account never sees them. A heart changes at once
  (`favouriteIds`) and changes back if the server refuses, with the reason in
  `events/FavouriteError` floating over the page; `favouriteEvents` (each as the public sees
  it) feed My Favourites, Home's cards and the greeting. Preferences awaits the save and shows
  a refusal. Event details has no Save for an event the lists don't show (`listed`), unless it
  is already saved. User Home's "New in your interests" and the analytics pages' saves and
  follows stay mock until Phases 7 and 10, and organiser and admin pages read App's mock
  events until their phase
- **Event photos live in `public/images/events/`** (2026-10-27) and are referenced by path
  (`/images/events/<file>`), the same path the database's `image_url` stores; NULL shows
  `defaultEventImage`. There is no `imagePosition`: photos crop centred

## Layout

```text
frontend/src/
├── App.jsx            routes + all shared app state (events, users, favourites, messages)
├── App.css            font and Tailwind imports, @theme tokens, then imports styles/
├── styles/            component classes via @apply, by where they are used:
│                      base (utilities: hex-cell, focus-ring, selected, tone-*;
│                      element defaults, keyframes), shared (the shared classes
│                      at the top, then what public site and dashboard share),
│                      public, dashboard, admin
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
└── images/            site photos (event photos are in public/images/events)
```

## Styling

Tailwind v4 with no config file: tokens in the `@theme` block of `src/App.css`, component
classes in `styles/` built with `@apply`. The structure below was set on 2026-10-19.

### Colours and tones

- Theme tokens only, never raw hex: `bg-background`, `bg-card`, `border-border`,
  `text-foreground`, `text-muted`, `text-accent` / `accent-hover`, `text-danger` for errors and
  destructive actions, `text-favourite` for the favourite heart
- **Status colours are tokens:** `success` (approved, active, done), `warning` (pending, needs
  attention), `danger` (rejected, errors), `cancelled`, `draft`, `past`. Tailwind's palette is
  only for colours with no status meaning
- **Tones** (`styles/base.css`): `tone-success`, `tone-warning`, `tone-danger`,
  `tone-cancelled`, `tone-draft`, `tone-past`, plus `tone-accent` (a plain label) and
  `tone-muted` (no status, e.g. a sign-in). A tone only sets three variables: `--tone` (borders,
  fills, icons), `--tone-text` (text in the colour) and `--tone-soft` (body text on a tinted box,
  the palette's lighter shade). Each component reads them its own way, so one class colours a
  badge, a callout, a sidebar count, a stat card's figure or a log icon
- `.status-*` (in `styles/shared.css`) maps each event and account status to its tone, so a
  banner or badge is `status-${state}`. Data says `tone: "warning"`, never a class name. All
  tones are always generated (`@source inline` in `base.css`), since components build some
  names at runtime
- **Strengths:** badges and callouts 40% border / 10% fill; small fills (log icons, avatars,
  sidebar counts) 15%; a danger border on a panel 40%

### Shared classes

An element takes the shared class for what it is, plus a component class only for what differs:
`className="panel contact-aside"`. The component class overrides (padding, gap, size) and never
repeats the shared utilities. The shared classes sit at the top of `styles/shared.css`:

| Class | For |
| --- | --- |
| `.page` | a public page's centred column, as wide as the navbar |
| `.dashboard-page`, `.dashboard-section` | a dashboard page and each section in it |
| `.panel` | what holds a page's content: forms, tables, charts, detail panels (16px corners, full border, `p-6`) |
| `.card` | one of many in a grid: event and stat cards (12px, faint border, top highlight) |
| `.list-panel`, `.list-row` | `panel list-panel` holds rows edge to edge, a 60% line between them; each list sets its own hover |
| `.heading-page`, `.heading-section`, `.heading-panel` | the page title (24px white); a public section heading; a title inside a panel |
| `.group-label`, `.eyebrow` | a small uppercase label over a group; the public accent label (heroes, footer) |
| `.field`, `.field-label`, `.field-hint`, `.field-error` | every form field (`UI/FormField` or by hand). `.field` styles its label, input, select and textarea, so controls take no class |
| `.icon-button` | a round icon-only button, 34px; a component sets another size to match its neighbours |
| `.pill` | a 32px option in a row: filters, sort, Previous / Next |
| `.badge` | a label that states something, coloured by a tone or `.status-*` |
| `.callout`, `.callout-compact` | a message box with its icon on the left: banners, notes, saved / error messages; compact inside panels and cards |
| `.hex-frame`, `.hex-fill` | an outlined hexagon (35% accent ring) round an icon or picture; a filled one at 15% of its tone. The icon or picture inside a `.hex-frame` needs `relative`, or the frame's `::before` fill paints over it and the hexagon shows empty |

The utilities in `styles/base.css` are `hex-cell` (the logo's cell as a mask), the focus rings,
`selected` and the tones.

### Writing classes

- A wrapper that only lays out its children and is used in one component takes inline
  utilities (`className="flex flex-col gap-4"`). A class is for a look, or a layout shared
  between components
- Inline utilities beat every component class (Tailwind's utilities layer), so an inline
  utility next to a component class that sets the same property always wins
- **Canonical Tailwind:** write what Tailwind suggests, scale values over arbitrary ones
  (`size-4.5` not `size-[18px]`, `-ml-1.25`, `grayscale-85`, `right-(--x,11px)`). Arbitrary
  values only where the scale has nothing (`text-[13px]`, grid templates, `transition-[…]`,
  `content-['']`). The editor's yellow hints flag any that slip in
- Before naming a class, check Tailwind has no utility by that name: a class called `overline`
  also gets Tailwind's line over the text

### Look

- **Corner radius** (2026-10-10): panels that hold a page's content (forms, tables, chart
  cards, detail and activity panels) are 16px (`rounded-2xl`), public and dashboard alike.
  Cards in a grid, list items and small boxes are 12px (`rounded-xl`). The filter bar is 40px
  round its pill fields
- **Selected vs action:** a selected option (navbar links, date pills, range toggle, view
  switcher, page number) gets the `selected` utility: `bg-accent/15`, an `accent/30` ring,
  bright text. Sidebar links keep the tint but swap the ring for a 3px accent bar
  (2026-10-18); the bordered date and status pills tint their border. Solid accent is only for
  buttons that do something (Search, Save, Submit)
- **Focus and motion:** respect `motion-reduce:`, and give everything clickable a visible
  keyboard focus ring: `focus-ring` (2px accent, 2px out), `focus-ring-wide` (4px out: logos,
  footer links), `focus-ring-inset` (4px in: photo tiles) or `focus-ring-flush` (no offset:
  rows and boxes). `Button` keeps its own, the same ring
- **Responsive layout inside the dashboard** uses container queries (`@container (max-width:
  …)` in the `styles/` files), not window breakpoints: `.dashboard-content` is the container,
  so a page responds to the space beside the sidebar. `<main>` is a container too, so the parts
  shared with public pages (filter bar, event grid) follow the same rules on both. Window
  `@media` rules stay for the page frame: navbar, sidebar rail, outer margins

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
- **Dashboard pages** open with a title row: the page's title (`DashboardPageHeading`; on Home the
  greeting), and beside it only the page's own actions, e.g. "Create event" on My Events and My
  Drafts, Go Back, Mark All as Read. **No navigation shortcuts:** the sidebar already links every
  page. The PHP pages had a Quick Actions block of links; removed 2026-10-10
- **Preferences is a honeycomb** (decided 2026-10-11): one hexagon per category
  (`components/dashboard/CategoryHoneycomb.jsx`, rows from `lib/honeycomb.js`: 3-4-5-4-3 for 19,
  interlocking rows for any other count or width, 1-2-1 on phones; where the last row would be two
  or more cells short, a hill that fills every row without adding one, 12 at four across being
  2-3-4-3, decided 2-3-4-3 over 3-4-3-2 on 2026-10-25). Icons per slug in
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
- **My Events** (decided 2026-10-12): submitted events only; drafts live on My Drafts and the
  summary links to them ("6 live · 2 waiting for approval · 1 rejected · 3 drafts"). The search
  bar is Explore's (keywords, category, location, Search), and the row under it holds status
  pills with counts in Explore's date-pill style (`?status=`, values are `eventState()`, so an
  approved event that has ended counts as past) and, on the right where Explore has its view
  switcher, a Pick a date pill (any day, past too, `?date=`, with an x to clear) and a sort
  dropdown. All of them apply at once. 12 per page. Organisers see "approved" as
  "live" (`organiserStatusLabels`, `EventCard`'s `statusLabel`, Event details); admins keep
  "approved". Card buttons follow `organiserCardActions`: Delete only
  before an event has been public (draft, pending, rejected), Edit until it is over, past and
  cancelled are View only and greyed. Delete asks inside the card (`EventCard`, "Keep it" /
  "Delete permanently"), never `window.confirm`; Organiser Home's cards follow the same rules
- **My Drafts** (decided 2026-10-12): the same `EventCard` grid as My Events (the PHP had a
  table), titled like the sidebar link, summary "3 drafts · last edited 27 Sept", most recently
  edited first. Each card adds a "Last edited" line (`note`) and Submit for approval as its
  labelled, full-width main action (`primaryAction`), with View, Edit and Delete under it. Submit
  applies at once (a pending event can still be edited) and the message links to My Events'
  Pending view. A draft whose date has passed gets a notice in Submit's place (`notice`), so an
  admin is never asked to approve an event that is already over
- **Create / Edit Event** (decided 2026-10-12, layout A): one form in five numbered groups
  (The basics, When, Where, Tickets, Photo; numbers in the logo's cell) and, beside it, a sticky
  column with the live card (`EventCard`'s `preview`), a "3 of 6 needed to submit" checklist and
  the buttons; below 56rem only the buttons show, pinned to the bottom of the screen. Labels
  carry no ":" or "*"; the one optional field says "Optional". The area is picked from
  `eventLocations` (Explore's filter uses it). The end must be after the start; Submit refuses
  a start that has passed (a draft may keep one). The photo is a drop box (JPG, PNG, WebP, GIF,
  5 MB) with Replace and Remove. Edit opens with a banner saying what saving does and ends with
  a danger zone asked in the page: Cancel for an event that has been public (`hasBeenPublic`),
  Delete for one that never was. Saving leads on: Submit to My Events' Pending view, a new
  draft to My Drafts, Save draft on an existing draft stays. Editing a live event keeps its
  last approved version public with its favourites (`approvedSnapshot`, `publicVersion`, the
  schema's option b) until an admin approves the edit
- **Manage Events / Manage Users** (decided 2026-10-12, layout A): Explore's search bar
  (keywords alone on Users, `SearchBar`'s `showFilters`), `UI/FilterPills` with counts and
  `UI/SortSelect` under it (My Events uses the same two), 15 per page, then a list of rows
  (`.admin-list`; the name button is stretched over the row) that become cards below 52rem.
  A row opens `UI/SidePanel` (a `<dialog>`; the open item is `?open=` in the URL, so links and
  the old `/:id/edit` addresses open it). Events open on "Needs review", oldest waiting first;
  the panel shows the whole event, what changed since approval for an edit of a live event,
  and Approve / Reject, a reason required (`rejectionReason`, shown to the organiser on Edit
  Event and Event details). Users: only Active / Suspended can be set (`emailVerifiedAt` NULL is
  a read-only "Unverified" label, never a status); suspending asks how long (`suspendedUntil`,
  NULL = until lifted) and why; a suspended organiser's events leave the public lists; Delete
  only where the schema allows (not admins, not yourself, not an organiser whose events have
  been public), asked in the panel
- **Notifications** (decided 2026-10-11): read state lives in `App.jsx` (`readAt`), so Home's
  unread card agrees. Rows grouped Today / Earlier this week / Earlier, collapsed to type icon,
  subject and time (64px); opening one shows the message and marks it read, one open at a time,
  with View event only when there is an `eventId` (cancelled events open too). The envelope shows
  state: closed while unread (opens on hover, marks read), faint open once read. 10 per page:
  fits a desktop or tablet screen, a laptop scrolls about 3 rows. Below 24rem the type icon hides
  so the subject gets two lines. An All / Unread (n) switch (`PeriodSwitcher`, `?show=unread`)
  sits above the list; rows read while Unread is showing stay until the view or page changes. No
  type filter or search for now
- **Contact Messages** (decided 2026-10-12, layout A): the admin list and `UI/SidePanel`, like
  Manage Events and Users. Opening a message reads it (`readAt`, once per opening, so Admin
  Home's unread card agrees); the panel replies in the page (`replyBody`, `repliedAt`,
  `repliedBy`; the email itself is the backend's job) or marks it unread. Pills: All, Unread,
  Replied, From guests; the sender links to their account in Manage Users
- **System Logs** (decided 2026-10-12, layout A): an activity feed under day headings, 25 per
  page. `lib/systemLogs.js` `describeLog()` turns a row (`details` is an object, like the
  schema's jsonb; `role` is the copied column) into a sentence with links to the event or
  account it names; `components/dashboard/LogEntry` draws it, and Admin Home's Recent Admin
  Actions uses the same entries. Pills: Events, Accounts, Sign-ins, Failed sign-ins (red, the
  `danger` tone on `FilterPills`), Admins only
- **Event Analytics / Site Analytics** (decided 2026-10-20, layout B, from a preview Slav chose
  panel by panel): four stat cards (the one exception to "stat cards only on Home"), then
  `UI/FilterPills` as section tabs (`?tab=`, the first one keeps a clean address), one section
  shown at a time. Organiser: Live Events, Saves, Approval Rate, Audience Reach; tabs Overview,
  Audience, Approval, What and where. Admin: Users, Events, Saves, Review Time (not Admin Home's
  `siteTotalsCards`); tabs Growth, Moderation, Engagement, Safety and support. Every figure is one
  function in `lib/analytics.js`, copy in `eventAnalyticsData.js` / `siteAnalyticsData.js`, shared
  tones and copy in `analyticsData.js`; saves, follows and sign-in rows come from
  `analyticsActivityData.js` until the API exists. Every panel is a `ChartCard` with its data
  table (`table={false}` only for lists and facts). Charts: Recharts for lines and columns
  (`TrendChart`, `TimelineChart`, `DecisionChart`, `CountBarChart`), CSS for the rest
  (`StatusDonut`, `ShareBar`, `ReachHoneycomb`, `WeekTimeGrid`, `FunnelSteps`,
  `FollowersHoneycomb`). Followers and events per category is a honeycomb with a card that
  lists every category and shows one when its cell is selected (`ChartCard`'s `interactive`
  keeps its buttons reachable); bars for it were turned down as too tall.
  Saves show a % change only when the 30 days before had at least 10 (`savesTrend`). A sentence
  read from data ("Most start on …") is left out on a tie. Organisers see "Live". Rejected in
  the preview, don't offer again: a year calendar of saves, weekly save columns, hexagons in the
  top-5 list, pink
- **Settings** (decided 2026-10-11): four sections (`SettingsSection`), each with its title and
  explanation in a 240px column beside its panel, above it below 44rem, and each saving on its
  own: Profile (picture up to 5 MB with Remove, editable display name, locked email with a
  Verified badge), Password (`UI/PasswordInput` eye, 8-character and match rules, adds a Password
  changed notification), Email notifications (one `UI/Switch`, wording per role, saves at once),
  Delete account (confirmed in the page with the password; organisers whose events have been
  public get a contact link; no section for admins). Banners only for an unverified email or a
  suspension, never for admins: `dashboard/AccountBanner`, read from the real account, also shown
  on Home under the greeting (2026-10-27) so a new account sees the email reminder where sign-up
  lands. The name, the switch, the password and Delete are real (Phase 2): each section awaits
  its App handler and shows the server's refusal, under its field when it names one. Delete
  learns from the server's 409 that an organiser has had public events (their events are mock
  until Phase 5). Only the picture is still pretend, held in App's `profileChanges` until Phase 6
  stores it, and the Password changed notification stays mock until Phase 7
- **Hexagons in the dashboard** (decided 2026-10-11, extended 2026-10-12): each frames something
  that is already there, so the logo shows without overusing it. Every page title's icon sits in
  the logo's cell (`DashboardPageHeading`, 36 x 40); on Home the greeting's picture does
  (`DashboardGreeting`, 58 x 64, the default icon without a picture, above the text below 28rem).
  Every stat card's icon sits in a small cell (`DashboardCard`, 30 x 33, accent icon), on Home and
  the analytics pages alike. Every "nothing here" box is `UI/EmptyState` (a three-cell honeycomb
  with the page's icon, the message, an optional action). No corner watermarks, hexagon
  section-heading icons, honeycomb dividers between dashboard sections or hexagon pagination:
  the sidebar pattern and Preferences already carry the rest
- **Sidebar** (decided 2026-10-18): wide screens collapse it to a 64px icon rail (each link's
  label becomes its tooltip and stays its accessible name; remembered in `localStorage`), never
  to nothing. At 768px and below it is a drawer over the page opened by the weather bar's menu
  button (`NARROW_QUERY` in `Dashboard.jsx`, the same width as the `@media` rule): X, Escape, the
  backdrop or any link shuts it, the page behind is `inert`, focus goes in and comes back. The
  dashboard hides the public navbar and footer, so the sidebar carries the public pages a
  signed-in person needs: a **Help** row beside Notifications and Settings that opens a small
  panel (`HelpMenu`; FAQs and Contact us, plus How approval works for organisers; none for
  admins, `helpNav` per role), and About · Privacy · Terms under the user (`legalNav`). Help is
  one row, not a group, so every role fits a 650px-tall laptop window. Short screens scroll the
  whole sidebar, never the links in a box of their own. Look (layout B, 2026-10-18): the role
  sits under the brand ("Organiser dashboard"), no title line; small uppercase section labels
  (`section` in `navigationData.js`: Events for users, Events / Insights, Moderation /
  Insights; Home unlabelled above them, the user label added 2026-10-26)
  and one faint 1px line instead of thick dividers; 14px pill rows, icons `text-muted/70` until
  hovered or current; the current page is the accent tint plus a 3px accent bar on the inner
  edge, no ring; the user is a soft card. Badges (`badge` per link, counts from `navCounts` in
  `App.jsx`, the Home cards' own filters so the two agree) only where something needs you:
  unread notifications, organisers' drafts and rejected events (red), admins' events to review
  (yellow) and unread messages; on the rail they sit on the icon's corner. The honeycomb sits faint
  behind the page links (2026-10-26), not only in the space under them: on a 1366x650 laptop
  window organisers and admins had no space left, so they never saw it
- **Public pages inside the dashboard** (decided 2026-10-26): FAQs, Contact, About, Privacy and
  Terms also open beside the sidebar at `/dashboard/<page>` (About, Privacy, Terms for every role;
  FAQs and Contact for user and organiser, as the Help menu). Each page takes `inDashboard`, and
  `UI/PageFrame` swaps the public hero for `DashboardPageHeading` (hero intro as the summary);
  section headings become `.dashboard-title`. About drops its photo hero and closing pitch. Contact
  shows the account's name and email locked. Links between them, and from the sidebar and
  Settings, use the `/dashboard/` addresses (`dashboardTo` in the data); the public navbar and
  footer keep the public ones. Their layouts use container variants (`@2xl:`, `@3xl:`, `@5xl:`)
- **Scroll position:** `ScrollToTop` resets the window on a new path, and `Dashboard` resets
  `.dashboard-container`, the dashboard's only scroller (the page itself never scrolls there, so
  `html:has(.dashboard-container)` drops the reserved scrollbar strip). Only the path counts:
  `?page=`, `?tab=` and filters keep their place
- **Pagination:** `components/UI/Pagination.jsx`, page number in the URL (`?page=`), back to page 1
  when a filter changes. Explore Events shows 12 per page (whole rows in every view)
- **Dashboard headings** (decided 2026-10-10): the page title is the page's only `<h1>`, 24px white
  with its icon (`DashboardPageHeading`, or the greeting on Home); the sidebar's "… Dashboard" is
  plain text. Section headings are `<h2>` `.dashboard-title`, 20px muted. Panel titles inside the
  dashboard (`.contact-form-title`) are 20px; the public Contact form keeps 24px. Page-specific
  buttons (Go Back, Mark All as Read) go in the title row as `DashboardPageHeading`'s children
- **Dashboard spacing:** 32px under the title row, 48px between sections, 16px from a heading to
  its content (`.dashboard-page` / `.dashboard-section` gaps, see the comment in `styles/shared.css`)
- **Stat cards only on the three Home pages.** Each card answers "what needs me, what's coming, or
  how am I doing", and always has one context line (`trend`, `action` or `detail` in
  `DashboardCard`); no bare figures. Inner pages get a one-line summary under the title instead
  (`DashboardPageHeading`'s `summary`, figures in `<strong>`), with its own wording when empty.
  Cards have a 5% white top gradient, never a hue. Decided 2026-10-10
- Dates use `Intl.DateTimeFormat("en-GB", …)`

## Naming

- Components and pages: PascalCase `.jsx`, default export
- Data files: camelCase ending in `Data.js` (`userDashboardData.js`)
- CSS classes: kebab-case, prefixed by component (`event-card-image`); the shared classes
  (see Styling) have no prefix

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
