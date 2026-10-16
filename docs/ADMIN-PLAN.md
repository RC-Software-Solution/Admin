# Admin console: plan for completing every menu entry

Written for Claude agents. Each agent takes **one section** (or the foundation task), reads "Conventions" first, and stays inside the files its section names. Requirements source: `../Backend/Admin - Requirements.md`. Launch scope source: `../GO-LIVE-PLAYBOOK.md`.

## Priority

| Tier | Entries | Why |
|---|---|---|
| Done | Login / Forgot / Reset password, Dashboard, Notices | Wired to the real backend |
| **P0 (launch)** | Users, Admins (finish), Delivery Areas (finish), Orders (minimal) | The playbook's launch scope |
| P1 | Sessions, Food Items, Delivery Persons | In the requirements, not in the launch scope |
| P2 (deferred) | Reports, Settings, Audit Logs | No backend, and the requirements are unclear or absent |

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

## P0

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

### Dashboard (leftovers, low priority)
Done and polling. Remaining from the requirements: filters (date range, area, session type), previous-period trend badges, item images in Top Items (needs `menu-service` data). `analytics-service` has no previous-period data yet.

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

## P2 (deferred, don't start without a product decision)

- **Reports:** the requirements mark it "not sure". Sales, orders, item and area reports could be built on `analytics-service` with date and area filters, plus CSV export. Needs a scoping decision.
- **Settings:** not in the requirements. Candidates: ordering-window rules, auto-block threshold (currently 2 unpaid orders, hardcoded). Needs a decision on what is configurable.
- **Audit Logs:** `UserStatusLog` records customer status changes only. A log page needs a list endpoint plus a wider log (admin actions, order status changes). Do this when a compliance need is stated.

## P1 status (built 2026-10-16) and later tasks

Sessions, Food Items and Delivery Persons are built and tested on the real backend. Sessions show a derived upcoming/open/closed state (there is no status column; "cancel" is delete, and the unique date + meal time rule already prevents overlap) and an Orders view per session (`GET /orders?target_date=&meal_time=`). Delivery persons carry NIC and vehicle type (`scripts/sql/2026-10-16-delivery-person-details.sql`). Later (none of it launch scope):

- **S3 image upload for Food Items.** Storage is already decided: the menu-images S3 bucket behind CloudFront (`../AWS-INFRASTRUCTURE-PLAYBOOK.md` section 8). Needs the bucket first. Then add a presigned-PUT endpoint to `menu-service` and an upload button with preview that fills the existing `image_url` with the CloudFront URL. No schema change.
- **Done 2026-10-17:** Food Items category, dietary tags, active/inactive (hidden from customers on every menu query, blocked from new sessions), price history and CSV export.
- **Delivery assignment is per meal session, not per driver (changed 2026-10-17).** Drivers have no fixed area. In Sessions, the Delivery button assigns one active driver per area for that session (`session_delivery_assignments`, `/api/meal-sessions/:id/delivery`). The driver app lists today's sessions the driver is assigned to, with My areas, Unassigned (tap to take) and Covered by others; a driver can release areas (keeping one) and take any area nobody active holds in that session (`/api/meal-sessions/delivery/mine`, `PUT /:id/delivery/me`). Session Notes are free text, shown on the session card and to drivers. Not enforced: `delivery-service` still returns orders for any area a driver asks for. A driver with no assignment today sees "not assigned" in the app and cannot work, by design.
- **Delivery-person on-time rate:** skipped by decision. Orders record no delivering driver or delivery time, so it would need `delivered_by` and `delivered_at` on orders plus an agreed on-time rule.
- **Fixed (2026-10-17):** editing or cancelling an order that contains an item deactivated afterwards. Before, dropping it did not return its stock, and keeping it corrupted the order (line became "Unknown", total 0, stock over-decremented). order-service now reads session items with `include_inactive` (honoured only with the internal key), may keep or drop such an item but not add one (409), and placing a new order still rejects inactive items.

## Known backend issues agents may hit

- `GET /api/users/:userId` was internal-key protected, but the internal key defaults to `internal-dev-key`; this must not ship to production.
- The auto-block job (`customerBlockingService`) exists but is never scheduled, so "blocked" only comes from manual action today.
- No automated tests anywhere in `apps/`. Add a small test with any new backend logic that has branches.
- Access tokens last 7 days; there is no refresh flow in Admin.
