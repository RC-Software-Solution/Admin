# Admin console: plan for completing every menu entry

Written for Claude agents. Each agent takes **one section** (or the foundation task), reads "Conventions" first, and stays inside the files its section names. Requirements source: `../Backend/Admin - Requirements.md`. Launch scope source: `../GO-LIVE-PLAYBOOK.md`.

## Priority

| Tier | Entries | Why |
|---|---|---|
| Done | Login / Forgot / Reset password, Dashboard, Notices | Wired to the real backend |
| P0 (launch), built | Users, Admins, Delivery Areas, Orders (minimal) | The playbook's launch scope |
| P1 | Sessions, Food Items, Delivery Persons | In the requirements, not in the launch scope |
| P2, built | Reports, Settings, Audit Logs | Built 2026-10-17 |

Until a page is built, **hide its sidebar entry**. Today every unbuilt entry just redirects to the dashboard (see foundation task F1).

## Conventions (all agents)

**Repos.** Admin: `C:\Users\budglk\RC\Admin` (React 19 + Vite + TypeScript, branch `feat/notices`). Backend: `C:\Users\budglk\RC\Backend` (Nx monorepo of plain Express + Sequelize services, **branch `dev`, not `main`**).

**Admin page pattern** (copy `Pages/deliveryareas` and `Pages/notices`):
- `Pages/<name>/<name>.service.ts` holds the API calls and uses `api()` from `src/services/apiClient.ts`. Base URLs come from `USER_API`, `LOCATIONS_API`, `ANALYTICS_API`. For a new service, add `X_API = import.meta.env.VITE_X_API ?? "http://localhost:<port>/api"` there.
- `hooks/use<Name>.ts` holds state, loading and error handling. It exposes data plus action callbacks. Pages stay presentational.
- Types live in `src/types/<name>.ts` and mirror the **real backend response**, not a mock.
- **Delete the mock** (`src/data/*`) when you wire a page. No `alert()` stubs left behind.
- Errors: `api()` throws `Error(message)`. Show it on the page, and keep the last good data visible.
- Live data uses `hooks/usePolling.ts` (30s, pauses when the tab is hidden). Only use it where freshness matters (Orders). Static lists load on mount and after each mutation.

**UI kit.** New and migrated pages use `src/components/ui` (`import { Button, Chip, Chips, Segmented, SearchField, Avatar, Drawer, OrderTrack, PaymentMark, Menu, SelectionBar, Badge, Card, PageHeader, FilterBar, Field, DataTable, Alert, EmptyState, Spinner, Switch, Tabs, Mark, Who, useToast } from "../../components/ui"`). Colours, spacing, type and radii come from the tokens in `src/styles/variables.css`; never write a hex value in a page stylesheet. The look (Tea sidebar, Paper ground, Leaf actions, Turmeric for "needs a human", Brick for failures, Bricolage Grotesque headings, IBM Plex Sans body, ruled rows instead of cards) is specified in `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md` with mockups in `docs/superpowers/mockups/`. Lists use `DataTable` (ruled rows, stacked cards on phones; `rowTone` for the coloured edge; a column's `mobile` slot places it on a phone card or `hide`s it); a filter that is one click is a `Chip`; a date range is a `Segmented`; a search box is a `SearchField`; people and items get an `Avatar`; a profile or detail view is a `Drawer`; row actions are one primary `Button` plus a `Menu`; errors use `Alert`; success feedback uses `useToast`; confirms use `ConfirmDialog` (`tone="primary"` for non-destructive ones, `danger` otherwise). A setting that takes effect at once is a `Switch` (a checkbox when it waits for a Save button); views of the same data are `Tabs`; a state shown as a dot and a word is a `Mark`; the avatar-plus-name cell of a people or items list is `Who`. `Badge` has the tones `dark` and `outline`, quiet destructive actions use `Button variant="danger-ghost"`, and `DataTable` has a `footer` slot for totals. Dialog forms use `Field` (with `optional` for optional fields) and never a placeholder as a label. The kit's `box-sizing: border-box` only reaches elements with a `ui-` class, so any rule that sizes a bare `input`, `select` or `textarea` (width, min-height, padding, border) must set `box-sizing: border-box` itself. Look at `src/Pages/orders/Orders.tsx`, `src/Pages/Dashboard/Dashboard.tsx` and `src/Pages/Users/Users.tsx` for reference pages and at `/ui-kit` in `npm run dev` for every component. Every page is on the kit; there are no legacy page stylesheets left.

**Auth and roles.** `getSession()` reads role and expiry from the JWT. UI gating is only UX; the backend `checkRole` is the real enforcement. Super-admin-only actions: approve/reject customers, manage admins. Everything else is `admin` or `super_admin`.

**Formatting.** Money is LKR via `utils/formatMoney.ts`. Business time is **Sri Lanka (UTC+5:30)**. Never compute "today" from the browser or server clock in local time.

**Backend pattern** (copy `user-service` `notice.*` and `admin.*`): a controller in `src/controllers`, a route file with `authMiddleware` + `checkRole([...])`, mounted in `index.js`. **Mount specific routes before `/:userId`-style routes** or they get swallowed. A pre-commit hook regenerates `docs/API.md`, so commit what it produces. Add an `OVERRIDES` entry for new endpoints if the hook asks.

**Verify before claiming done.** (1) `npx tsc -b` and `npx eslint <touched paths>` are clean. (2) Run the page in a browser through the Playwright MCP (it uses Edge via `PLAYWRIGHT_MCP_BROWSER=msedge`), or against a stub server if the backend isn't up. (3) Check the console for errors. A stale Vite module cache can serve an empty file: `touch` the file or restart the dev server.

**Gotchas.** Imports are case-sensitive on Linux (`Pages/`, not `pages/`). Files are CRLF on Windows; ignore the warnings. Don't commit `.env`. Commit per page with `feat(<page>): ...`.

**Parallelism.** Pages are independent except through these shared files: `app/routes.tsx`, `components/Sidebar/Sidebar.tsx`, `services/apiClient.ts`. Agents working in parallel should add their line to those files and rebase carefully; use separate git worktrees.

---

**Deposits is out of scope** (removed from the menu and the codebase by product decision). Ignore "deposits reconciliation" in the requirements doc.

## F1. Foundation (do first, one agent)

1. **Shared dialogs.** `components/common/Modal.tsx` and `ConfirmDialog.tsx`. Replace the `window.prompt`/`confirm` calls in `useDeliveryAreas` and the inline form on Admins. Every later page needs confirm and form modals (reject reason, assign area, disable).
2. **Sidebar.** Show only the entries that have a route. Add each entry back when its page lands. Fix the existing lint error (`setState` in an effect) by deriving the active item from the path.
3. **Cleanup.** Delete the dead `src/App.tsx`, `src/main.tsx` pair if unused, the stub `.ts`/`.tsx` files of unbuilt pages (leave folders you are about to fill), and `src/services/sales.service.ts` if unused.

---

## P0 (built; checked against the code 2026-10-17)

All four are built and committed. Users: list, approve with area, reject with reason, disable/enable/unlock, profile with status log, CSV export. Admins: edit, suspend/enable, reset password with the self-lockout safeguards. Delivery Areas: code, status, notes, metrics, assigned-user count, delete blocked with 409 when users are assigned. Orders: polled list, filters, unpaid quick filter, status and payment updates, customer names. Not re-verified here: that the SQL files in `Backend/scripts/sql/` have been run on every environment (there is no migration tooling, so each one is a manual step). Deferred by design: order detail with items, audit timeline, delivery-person field.

### Users (customers)
**Backend is ready** (`user-service`, `/api/users/customers`, admin or super_admin): `GET ?status=pending|accepted|rejected|disabled|blocked`, `GET /:id/profile` (includes order history), `POST /:id/approve`, `POST /:id/reject`, `PUT /:id/assign-area`, `PUT /:id/disable`, `PUT /:id/enable`, `PUT /:id/unlock`, `GET /export`. Status changes are written to `UserStatusLog`.
**Do:** replace `useUsers` mock data with these calls. Keep the five tabs and the counts (fetch per tab, or fetch all once and count). Approve opens a modal that **requires** an area (`LOCATIONS_API /areas`); reject requires a reason. Add a profile drawer showing order history, unpaid summary and status log. Add search by name or email on the client, and CSV export through `/export`. Gate approve, reject, disable and unlock to `super_admin` in the UI, matching the requirements.
**Gaps:** the profile response may not include the status log. Check the controller, and add it there if not. List filtering by area and date is client-side for now.
**Done when:** a pending customer can be approved with an area, then shows under Accepted; blocked customers can be unlocked; actions are hidden from plain admins.

### Admins (finish)
**Backend has** `POST` and `GET /api/users/admins` (super_admin). **Missing:** edit name and role, disable/enable, admin password reset by a super admin.
**Do (backend first):** `PUT /api/users/admins/:id` (full_name, role), `PUT /:id/disable` and `/enable` (set `status` inactive/active, and null `refresh_token` on disable so the session ends), `POST /:id/reset-password` (super admin sets a new password, clears `refresh_token`). Block a super admin from disabling or demoting **themselves**, and from removing the last active super admin. Then add Edit, Suspend/Enable and Reset-password actions to `Pages/admins`.
**Done when:** a super admin can edit, disable, re-enable and reset an admin, and cannot lock themselves out.

### Delivery Areas (finish)
**Backend has** only `area_id` and `area_name` (CRUD, `locations-service`).
**Requirements add:** code, status Active/Inactive, schedule notes, per-area metrics (orders, revenue, assigned users), delete warning when users are assigned.
**Do:** add `code` (nullable), `status` (enum, default active) and `notes` columns with a manual SQL migration (there is no migration tooling; follow `scripts/sql/`). Extend create and update. Metrics: reuse `GET /analytics/area-metrics` for orders and revenue. Add an assigned-user count to `analytics-service` (a count of customers per `area_id` from `user-service` internal analytics). On delete, check for assigned users and return 409 with the count; show it in the confirm dialog. Show a "Users" action that links to Users filtered by area.
**Done when:** the card shows real code, status and metrics, and deleting an area with users is blocked or warned.

### Orders (minimal for launch)
**Backend has** `GET /api/orders?type=...` (admins may filter by `status`, `area_id`, `customer_id`, `payment_status`, `start_date`, `end_date`, `meal_type`, `limit`, `offset`; the `type` param is required, so read the controller for its values), `PUT /:order_id/status`, `PUT /:order_id/payment`.
**Do:** a polled list (30s) with filters for status, payment status, area and date range, and columns Order ID, customer, items count, total, status, payment status, created date. Row action: update status and mark paid or unpaid. Add an unpaid quick filter. Show customer names (the list only has `customer_id`; add the name server-side or batch-resolve through `user-service`).
**Gaps (backend):** order detail with items, an audit timeline, and a delivery-person field do not exist. Defer them unless asked; they are not launch scope.
**Done when:** staff can find an order by filter, change its status, and mark it paid.

### Dashboard (done)
Polling every 30s, now with filters and trends (built 2026-10-17): presets Today / Last 7 / Last 30 days or a custom range, an area filter and a session filter (`GET /analytics/dashboard?from=&to=&area_id=&session=`, Sri Lanka days, default last 7 days, at most 366 days). Sales and Orders show the percent change against the previous range of equal length. Top Items show the item's picture, matched by name because order lines store no food id (a renamed item loses its picture). Blocked Users and Unpaid Orders are "right now" counts and ignore the filters. The area filter narrows the area table to one row; the session filter does not change the three Session Performance tabs.

---

## P1

### Sessions (meal sessions)
**Backend has** full CRUD in `menu-service`: `/api/meal-sessions` (`date`, `meal_time` breakfast/lunch/dinner, `start_time`, `end_time`), `POST /:id/items` to attach items, and `/api/meal-session-items` (`PUT`/`DELETE` per item, `available_quantity`).
**Do:** list sessions by date with type tabs; create/edit modal; cancel; attach items from the food catalog with quantities. Detail view with Items and Orders tabs (orders via the Orders filter by session). The Delivery tab and Notes are deferred.
**Backend gaps:** overlap prevention for the same type and time window (requirements, "configurable"), and a cancelled or completed state. Check the model before assuming a status column exists.
**Done when:** an admin can create a day's sessions, attach items with quantities, and the customer app sees them.

### Food Items
**Backend has** CRUD at `/api/food-items` with `name`, `description`, `price`, `meal_type`, `image_url`.
**Gaps:** the requirements list category, dietary tags, active/inactive, price history, and **image upload**. The backend takes only an `image_url` string. Decide storage before building upload: on AWS this is S3 with presigned URLs (`../AWS-INFRASTRUCTURE-PLAYBOOK.md`). Until then accept a URL.
**Do:** table/grid with thumbnail, name, price, meal type; add/edit/delete with confirm; search and filter. Add dietary tag and active columns on the backend if wanted.
**Done when:** items can be created and edited with an image URL and appear in the session picker.

### Delivery Persons
**Backend has** the `delivery_person` role in `User`, area assignment through `area_id`, and nothing to create or manage them (public signup is customers only).
**Do (backend first):** a super_admin or admin endpoint family under `/api/users/delivery-persons` (create with name, email, password, phone, area; list; edit; enable/disable). Copy `admin.controller.js`, and reuse the same safeguards. Then the page: list with name, contact, status, area; add/edit; enable/disable. The NIC and vehicle fields from the requirements need new columns.
**Done when:** an admin can create a driver who can log in to Frontend-Delivery and sees their area's orders.

---

## P2 (built 2026-10-17)

- **Reports (built 2026-10-17):** one page with three tabs, Sales by day, Items and Areas, sharing the Dashboard's range, area and session filters (`GET /analytics/reports/:type?from=&to=&area_id=&session=`, type = sales | items | areas, same Sri Lanka day rules and 366-day cap) and a client-side CSV download. Revenue is the total value of orders in the range regardless of payment status (same as the Dashboard's session and area tables, unlike the Dashboard's paid-only Sales card). Items is capped at 100 rows by order-service. Not built: Unpaid customers report (the Orders unpaid filter covers it until staff say otherwise), PDF export, order-level drill-down (needs order detail in the backend).
- **Settings (built):** super_admin only. One setting, the auto-block threshold (whole number 0 to 20, default 2, 0 = off), stored in `app_settings` (`scripts/sql/2026-10-17-app-settings.sql`, run it first; the default applies when the row is missing). The rule now actually runs: after order-service marks an order unpaid it calls user-service (`POST /api/internal/customers/:id/check-block`, internal key), which blocks the customer at the threshold and writes the usual status-log row. Saving a stricter limit also sweeps existing customers once. Ordering windows are not a setting: each meal session already carries its own start and end time.
- **Audit Logs (built):** super_admin only. `audit_logs` table (`scripts/sql/2026-10-17-audit-logs.sql`, run it first). The `audit()` middleware (`src/middlewares/audit.js`, one identical copy per service, guarded by `tests/audit.test.js`) sits on the route and writes one row after a successful admin write; only the body fields named on the route are stored, so passwords never reach the log. Covered: admin and delivery-person account changes, settings, notices, delivery areas, food items, sessions and session items, order status and payment changes (including those made by drivers). `GET /api/users/audit-logs?from=&to=&group=&actor_id=&page=` pages 50 newest-first. Customer approve/reject/disable/unlock stays in the customer status log. Limits: a failed log write is only logged to the console and never blocks the action; order status changes record the new value, not the old one; reads, logins, retention and CSV export are not covered.

## P1 status (built 2026-10-16) and later tasks

Sessions, Food Items and Delivery Persons are built and tested on the real backend. Sessions show a derived upcoming/open/closed state (there is no status column; "cancel" is delete, and the unique date + meal time rule already prevents overlap) and an Orders view per session (`GET /orders?target_date=&meal_time=`). Delivery persons carry NIC and vehicle type (`scripts/sql/2026-10-16-delivery-person-details.sql`). Later (none of it launch scope):

- **S3 image upload for Food Items.** Storage is already decided: the menu-images S3 bucket behind CloudFront (`../AWS-INFRASTRUCTURE-PLAYBOOK.md` section 8). Needs the bucket first. Then add a presigned-PUT endpoint to `menu-service` and an upload button with preview that fills the existing `image_url` with the CloudFront URL. No schema change.
- **Done 2026-10-17:** Food Items category, dietary tags, active/inactive (hidden from customers on every menu query, blocked from new sessions), price history and CSV export.
- **Delivery assignment is per meal session, not per driver (changed 2026-10-17).** Drivers have no fixed area. In Sessions, the Delivery button assigns one active driver per area for that session (`session_delivery_assignments`, `/api/meal-sessions/:id/delivery`). The driver app lists today's sessions the driver is assigned to, with My areas, Unassigned (tap to take) and Covered by others; a driver can release areas (keeping one) and take any area nobody active holds in that session (`/api/meal-sessions/delivery/mine`, `PUT /:id/delivery/me`). Session Notes are free text, shown on the session card and to drivers. Not enforced: `delivery-service` still returns orders for any area a driver asks for. A driver with no assignment today sees "not assigned" in the app and cannot work, by design.
- **Delivery-person on-time rate:** skipped by decision. Orders record no delivering driver or delivery time, so it would need `delivered_by` and `delivered_at` on orders plus an agreed on-time rule.
- **Fixed (2026-10-17):** editing or cancelling an order that contains an item deactivated afterwards. Before, dropping it did not return its stock, and keeping it corrupted the order (line became "Unknown", total 0, stock over-decremented). order-service now reads session items with `include_inactive` (honoured only with the internal key), may keep or drop such an item but not add one (409), and placing a new order still rejects inactive items.

## Top bar: bell and search (built 2026-10-18)

The bell and search box in the top bar used to be placeholders (a hardcoded "3" and a dead input).

- **Bell:** live counts of what needs action, polled every 30s: customers awaiting approval, unpaid orders, failed deliveries (`delivery_failed`) and blocked customers. The badge adds the first three (blocked is a state, not a to-do) and hides at 0. Each row links to the page that handles it (`/users?tab=pending`, `/orders?payment_status=unpaid`, `/orders?status=delivery_failed`, `/users?tab=blocked`). Backend: `GET /api/analytics/attention`, built from internal count endpoints in user-service (`pending-customers-count`) and order-service (`failed-deliveries-count`); a count is null if its service is down. It is a live view, not an inbox: there is no read/unread state and no per-event history.
- **Search:** find a customer (name, email or phone, filtered in the browser from the customer list fetched on first use) or an order (id prefix, `q` filter on `GET /api/orders`, admins only, wildcards taken literally). Needs 2+ characters; shows up to 5 of each; a result opens Users or Orders with the match applied. The Orders page also gained an order id box. Not searched: food items, areas, sessions, notices.
- **Deep links:** Users reads `?tab=` and `?q=` (and `?area=`); Orders reads `?status=`, `?payment_status=` and `?q=`.
- **Bulk payment reminder (built):** on Orders with the Unpaid filter on, tick customers (ticking a row ticks all of that customer's rows) and press Notify. `POST /api/users/customers/notify-unpaid` (admin, super_admin) sends each customer one push: "You have N unpaid order(s) totalling LKR X. Please pay on your next delivery." The count and total are read from order-service at send time (`unpaid-by-customer`), not from the screen. Result line: sent / no device registered / nothing unpaid by then / failed. Audit-logged as `customer.notify_unpaid`. Deliberately no repeat guard (an admin can send the same reminder twice). Max 200 customers per send, one page of rows at a time.
- **Not built:** an event inbox with read/unread state.

## To-Do (as of 2026-10-18)

Everything in this plan is built and committed. What remains is checks, environment steps, hardening and optional extras, roughly in priority order.

### Needs a device or a person

- [ ] **Test a real push notification end to end.** Notices and payment reminders send pushes through Firebase (`notificationService.js`). Verified 2026-10-18: the backend's service-account key authenticates and reaches Firebase (a deliberately fake token was rejected as "not a valid FCM registration token", not as an auth error). Still untested: an actual delivery, because no customer has registered a device (only an empty token exists). The customer app already has its own `google-services.json` for the same Firebase project and requests the correct native FCM token, so nothing needs copying from the backend key (which is a server secret and must never go in an app). To finish: run Frontend-Customer as a dev build (not Expo Go) on an Android emulator with Google Play services or a real phone, sign in as an accepted customer so the token registers, then send a notice to that customer's area and a reminder from Orders. Check the device receives both, and that the page counts match. Also check an area with no registered devices (expects "Sent to 0").
- [ ] **Check the panel as a plain `admin`.** Only a super admin has been used in testing. Sign in as a plain admin and confirm Admins, Settings and Audit Logs are hidden from the sidebar, that their URLs redirect to the dashboard, and that the calls behind them return 403 (the backend `checkRole` is the real enforcement; the UI hiding is only convenience).
- [ ] **Run the SQL migrations on every other environment.** There is no migration tool, so each file in `Backend/scripts/sql/` is a manual step. The local Docker database already has them all. In order: `2026-09-26-notices`, `2026-09-26-order-delivery-failed`, `2026-10-15-area-details`, `2026-10-16-delivery-person-areas`, `2026-10-16-delivery-person-details`, `2026-10-16-food-item-details`, `2026-10-17-session-delivery`, `2026-10-17-drop-driver-fixed-areas`, `2026-10-17-app-settings`, `2026-10-17-audit-logs`. Do NOT run `2026-09-27-seed-test-data.sql` anywhere real (test data only). An earlier session also prepared a cleanup SQL for test data that is not in the repo; confirm whether it is still needed.
- [ ] **Driver app (Frontend-Delivery).** Needs a device or emulator test. Server-side enforcement is also missing: `delivery-service` still returns orders for any area a driver asks for instead of only the areas assigned to them for that session.
- [ ] **Browser-test the audited routes not yet exercised.** Tested so far: settings, order payment, notices, areas, food items, admin disable/enable, customer reminders. Not yet: delivery-person create/edit/disable/reset, sessions, session items, session delivery assignment, admin create/edit/reset.

### Before production (security)

- [ ] **A real SMTP app password is stored in plain text in `Backend/docker/docker-compose.yml`**, which is tracked in git and has a GitHub remote (`RC-Software-Solution/Backend`). Treat it as exposed: rotate the password, move it to an untracked env file or a secret store, and check whether the old value was already pushed (if so it stays in history until the history is cleaned). Check the other compose files and `.env` files for the same.
- [ ] **Internal API key.** It defaults to `internal-dev-key` in the compose file and in code. Set a strong `INTERNAL_API_KEY` for every deployed service. Also re-check that `GET /api/users/:userId` (internal-key protected) cannot be reached without it.
- [ ] **Admin sessions.** Access tokens last 7 days and Admin has no refresh flow, so an admin is signed out when the token expires. Add a refresh flow or shorten the lifetime together with one. See the open decisions below.
- [ ] **Production-readiness plan.** Full scope, threat analysis (Node/NGINX/PHP advisories, dependency audits) and 15 tasks are in `docs/superpowers/plans/2026-10-24-admin-production-readiness.md`. Three decisions are still OPEN and block some tasks there (section 1.4 of that plan):
  - **D1 Session model** (blocks Tasks 5, 11). Recommended: 8-hour admin access token plus 30-minute idle logout, token stays in `localStorage`. Reason: a refresh token kept in `localStorage` would live 30 days, which is worse than a short access token. Revisit: httpOnly-cookie refresh flow (needs backend cookie and CSRF design) when MFA is added or if the CSP check in Task 6 finds a script-injection path.
  - **D2 Login rate limiting at the edge** (blocks Task 14). Recommended: CloudFront with WAF in front of the API. Reason: the current limiter needs Redis, which the AWS playbook does not provision, so on AWS it does nothing, and `/login` has no throttle at all. WAF attaches to CloudFront and REST APIs; it is not listed as supported for API Gateway HTTP APIs (the playbook's choice). Search results and a re:Post answer agree, but there is no explicit statement in the official docs, so confirm in the current AWS docs before building. Cost: about $10/month, against the client-facing "$1-8/mo Year 1" estimate, so raise it with the client. Fallback: API Gateway throttling plus a database-backed lockout (needs a migration).
  - **D3 Admin-to-API layout** (blocks Task 14 step 3, sets `CORS_ORIGINS` in Task 12). Recommended: one domain serving the app at `/*` and the API at `/api/*` through one CloudFront. Reason: no CORS, one WAF, `connect-src 'self'`. Mobile apps keep `api.<domain>`.
  - Deferred, no date set yet: MFA for `super_admin`, 12-character staff password minimum (currently 6), sanitising the 500 error body on login.

### Releasing the work

- [ ] **Push and open PRs.** Nothing from this work is pushed: Admin `feat/notices` and Backend `dev` are local commits only.
- [ ] **Uncommitted files that predate this work:** `Backend/scripts/sql/2026-09-27-seed-test-data.sql` (untracked test data) and `Admin/package-lock.json` (modified). Decide whether to commit or discard each.
- [ ] **CI for the route-access test.** `tests/routes-access.test.js` needs a service's `node_modules` on `NODE_PATH` to run from the repo root (e.g. `NODE_PATH=apps/menu-service/node_modules:apps/user-service/node_modules`). Make that part of the CI job.

### Optional features (none required for launch)

- [ ] **S3 image upload for Food Items.** Blocked until the menu-images bucket exists (see Food Items above).
- [ ] **Order detail** with items, an audit timeline and a delivery-person field. The delivery-person on-time rate needs the same data (`delivered_by`, `delivered_at` on orders) and was skipped by decision.
- [ ] **Reports:** an Unpaid-customers report, PDF export, and drill-down into single orders.
- [ ] **Audit logs:** record the old value for order status changes (today only the new one), alert on a failed log write instead of only printing it, and add retention and CSV export.
- [ ] **Notifications:** an inbox with read/unread state per admin (today the bell shows live counts only).
- [ ] **Notices:** edit support, and replace the two `window.confirm` calls (send, delete) with `ConfirmDialog`.
- [ ] **Settings:** only the auto-block limit exists. Add more only when someone names a rule that needs to change.

## Known backend issues agents may hit

- `GET /api/users/:userId` was internal-key protected, but the internal key defaults to `internal-dev-key`; this must not ship to production.
- Auto-blocking now runs when an order is marked unpaid (see Settings). Orders that become unpaid some other way, or customers already over the limit before the setting existed, are only caught by saving a stricter threshold or running `node src/jobs/runCustomerBlockingJob.js`.
- Several services now have small `node --test` suites (user, order, analytics) and the repo root has `tests/`. Keep adding a small test with any new backend logic that has branches.
- Access tokens last 7 days; there is no refresh flow in Admin.
