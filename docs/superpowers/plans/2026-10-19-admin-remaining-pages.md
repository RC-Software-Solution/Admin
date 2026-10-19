# Admin Remaining Pages and Accessibility (Plan 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Notices, Delivery Areas, Sessions, Food Items, Delivery Persons, Admins, Reports, Settings, Audit Logs, sign-in and password reset onto the approved visual identity (matching `docs/superpowers/mockups/png/`), add the `Switch` and `Tabs` kit pieces, finish the accessibility pass, and clear the leftovers plans 1-3 parked.

**Architecture:** Plans 1-3 shipped the tokens, the UI kit in `src/components/ui` and the shell; Orders, Dashboard and Users are the reference pages. This plan adds the few generic kit pieces these pages need (`Switch`, `Tabs`, `Mark`, `Who`, two badge tones, a quiet-danger button, a `DataTable` footer slot, small CSS helpers), then rebuilds each page on the kit, deleting each legacy stylesheet in the task that migrates its last consumer. Hooks change only to add a `loaded` flag (and one `clearError`). Page-specific pieces live next to their page; only generic pieces go in the kit.

**Tech Stack:** React 19, TypeScript 5.9 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 7, react-router-dom 7, react-icons 5.5 (`react-icons/lu`). No test framework: verification is `npx tsc -b`, `npx eslint`, and headless-browser checks against stubbed API responses.

**Spec:** `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md` (palette, type, shape, "Data the mockups imply that the app does not have yet"). Visual reference: `docs/superpowers/mockups/admin-ui-mockups.html` and `docs/superpowers/mockups/png/` (`notices-desktop.png`, `areas-desktop.png`, `areas-delete-desktop.png`, `sessions-desktop.png`, `sessions-mobile.png`, `food-desktop.png`, `food-add-desktop.png`, `food-mobile.png`, `persons-desktop.png`, `admins-desktop.png`, `admins-add-desktop.png`, `reports-desktop.png`, `settings-desktop.png`, `settings-mobile.png`, `audit-desktop.png`, `login-desktop.png`, `login-mobile.png`, `login-forgot-desktop.png`, `components-desktop.png`). Earlier plans: `docs/superpowers/plans/2026-10-19-admin-dashboard-users.md` (executed; the pattern to follow), `docs/superpowers/plans/2026-10-18-admin-visual-identity.md`.

**Scope note:** the pages listed in the goal, the kit additions, and the leftovers in Task 3. Orders, Dashboard and Users keep their look; only the Users and Dashboard code named in Tasks 3 and 12 changes.

## Global Constraints

- Admin repo root is `C:\Users\budglk\RC\Admin`; run every command from there (Git Bash: `cd /c/Users/budglk/RC/Admin`). Work on branch `feat/identity-remaining-pages` (already created from `main` at `a2ae0c0`).
- No new npm dependencies and **never run `npm install`** in the repo (the working tree has an unrelated uncommitted `package-lock.json` change that must stay untouched).
- No hex colours (`#rgb`/`#rrggbb`) in any file this plan creates or rewrites, except `src/styles/variables.css`. Everything else uses `var(--token)`. Fixtures under `docs/` contain none either.
- Kit class names all start with `ui-`; page-local classes use the page prefix: `nt-` (notices), `sess-` (sessions), `food-` (food items), `set-` (settings), `auth-` (sign-in and reset).
- Palette (values copied from the spec): Tea `#123524`, Leaf `#16803c`, Paper `#f3f5f0`, Ink `#18241d`, Mist `#5c6b61`, Turmeric `#e0a100` (text on it `#6b4b00`), Brick `#b3362a`, Mint `#8fd0a8`.
- Type: Bricolage Grotesque (headings, big numbers) and IBM Plex Sans (everything else); sentence-case labels, no all-caps labels.
- Radii: 4px badges, 6px controls, 10px floating things and panels, 999px chips and the user pill (use `--radius-sm|md|lg|full`).
- Breakpoints are 640px (phone) and 1024px (drawer); write the literals in media queries. Sidebar width is 244px.
- **Box sizing:** the kit's `box-sizing: border-box` rule only matches elements that carry a `ui-` class. Any CSS rule that sets a width, height or min-height together with padding or a border on a bare `input`, `select`, `textarea` or any non-`ui-` element must set `box-sizing: border-box` itself. (Plans 1-3 shipped this bug four times.)
- Do not put data the app does not have into the UI: no order counts on the Sessions "View orders" button, no customer counts the API does not return (spec, "Data the mockups imply that the app does not have yet"). Copy that states a fact (for example how long a reset link lasts) must be verified against the code first.
- Every form control has an accessible name: a visible `<label>` through the kit `Field`, or an `aria-label` for filter controls and table checkboxes. No placeholder-only fields.
- TypeScript rules: `import type` for type-only imports, no enums or parameter properties, no unused locals or parameters. Lint rule `react-refresh/only-export-components`: a `.tsx` file exports components (and types) only.
- Imports are case-sensitive: the page directories are `src/Pages/Dashboard`, `src/Pages/Users`, `src/Pages/Auth`, `src/Pages/UiKit` (capitalised) and `src/Pages/orders`, `admins`, `auditlogs`, `deliveryareas`, `deliverypersons`, `fooditems`, `notices`, `reports`, `sessions`, `settings` (lowercase). Files are CRLF on Windows; ignore line-ending warnings.
- Commit one task at a time, staging only the files the task names by explicit path (never `git add -A`). End every commit message with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never commit `package-lock.json`, `.env`, `.superpowers/`, or the untracked `docs/superpowers/ui-baseline/after/` folder.
- Before claiming a task done: `npx tsc -b` prints nothing and `npx eslint <touched paths>` prints nothing.

## Verification tooling (read once)

The Vite dev server must be running at `http://localhost:5173` (`npm run dev`; if `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` is not `200`, start it in the background). The backend is not running, so browser checks use stubs, run in this order: `docs/superpowers/ui-baseline/setup.js` (a fake `super_admin` session plus stubbed answers), `docs/superpowers/ui-baseline/setup-dashboard-users.js` (dashboard and customers), and from Task 1 on `docs/superpowers/ui-baseline/setup-remaining.js` (notices, areas with metrics, sessions with items, food items, delivery persons, admins, audit logs and the three reports). A later script's route handler runs first and calls `route.fallback()` for anything it does not own.

Run browser scripts with the standalone headless runner (uses the installed Microsoft Edge; never close or kill another Edge process). Runner: `C:/Users/budglk/AppData/Local/Temp/claude/c--Users-budglk-RC-Admin/c8df9c45-d895-4918-82ed-3fe9da9176e5/scratchpad/pw/run.mjs`. If that folder is gone, recreate it:

```bash
mkdir -p "$SCRATCH/pw" && cd "$SCRATCH/pw" && npm init -y >/dev/null && npm install playwright-core --silent
```

where `$SCRATCH` is your scratchpad directory (that `npm install` runs outside the repo and is allowed). Save this as `$SCRATCH/pw/run.mjs`:

```js
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
let failed = false;
for (const file of process.argv.slice(2)) {
  try {
    const fn = (0, eval)(readFileSync(file, "utf8"));
    console.log(file.split(/[\\/]/).pop(), "=>", JSON.stringify(await fn(page)));
  } catch (e) {
    failed = true;
    console.error(file, "FAILED:", e.message);
    break;
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
```

Usage (`RUN` is the runner path above):

```bash
SCRATCH="$SCRATCH" node "$RUN" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js docs/superpowers/ui-baseline/setup-remaining.js "$SCRATCH/my-check.js"
```

Each script file contains `async (page) => { ... }`; scripts run in order on one page, so list the stubs first. Write throwaway check scripts in `$SCRATCH`, never in the repo. A typical screenshot script (ES module context: use `await import`, there is no `require`):

```js
async (page) => {
  const { mkdirSync } = await import("node:fs");
  const dir = `${process.env.SCRATCH}/shots`;
  mkdirSync(dir, { recursive: true });
  for (const [name, path] of [["notices", "/notices"]]) {
    for (const [tag, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`http://localhost:5173${path}`);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${dir}/${name}-${tag}.png` });
    }
  }
  return "shot";
}
```

Lessons from plans 1-3 that apply to every browser check:

- The app shell scrolls inside `main.main`, so `fullPage: true` screenshots do not show page content. Take viewport screenshots; to see a tall page, first call `page.setViewportSize({ width, height: 2600 })` (the layout uses `100dvh`, so the whole page then fits the viewport).
- The kit `Menu` closes on any scroll, and Playwright auto-scrolls before a click; scroll the trigger into view and wait first.
- If Vite serves a stale or empty CSS/TS file right after you create or edit it, `touch` the file or restart the dev server, then re-measure.
- Look at every screenshot with the Read tool and compare it with the named mockup before claiming a visual match. Compare at 1440px and 390px.
- Native `<dialog>` content renders only while open (the kit's `Modal` mounts children only when `open`), so a dialog is checked by clicking its trigger first.

## File structure

Create:
- `docs/superpowers/ui-baseline/setup-remaining.js`
- `src/components/ui/Switch.tsx`, `Tabs.tsx`, `Mark.tsx`, `Who.tsx`
- `src/Pages/fooditems/food.css`, `src/Pages/settings/settings.css`, `src/Pages/Auth/AuthShell.tsx`, `src/Pages/Auth/auth.css`

Rewrite (whole file): `src/Pages/notices/Notices.tsx`, `src/Pages/notices/notices.css`, `src/Pages/deliveryareas/DeliveryAreas.tsx`, `src/Pages/fooditems/FoodItems.tsx`, `src/Pages/deliverypersons/DeliveryPersons.tsx`, `src/Pages/admins/Admins.tsx`, `src/Pages/sessions/Sessions.tsx`, `src/Pages/sessions/sessions.css`, `src/Pages/sessions/SessionDeliveryDialog.tsx`, `src/Pages/reports/Reports.tsx`, `src/Pages/settings/Settings.tsx`, `src/Pages/auditlogs/AuditLogs.tsx`, `src/Pages/Auth/Login.tsx`, `src/Pages/Auth/PasswordReset.tsx`.

Modify (small edits): `src/components/ui/ui.css` (appends), `Badge.tsx`, `Button.tsx`, `Field.tsx`, `DataTable.tsx`, `index.ts`, `src/Pages/UiKit/UiKit.tsx`, `src/hooks/useDashboard.ts`, `src/hooks/useUsers.ts`, `src/Pages/Users/Users.tsx`, `src/hooks/useDeliveryAreas.ts`, `useFoodItems.ts`, `useDeliveryPersons.ts`, `useAdmins.ts`, `src/components/common/Modal.tsx`, `src/components/common/modal.css`, `src/styles/variables.css`, `src/Pages/Dashboard/Dashboard.tsx` (one import line), `docs/ADMIN-PLAN.md`.

Delete (each in the task named): `src/Pages/deliveryareas/deliveryareas.css` (Task 5), `src/Pages/admins/admins.css` (Task 9), `src/Pages/Dashboard/dashboard.css` (Task 12), `src/styles/login.css` (Task 13), `src/components/common/Icons.tsx` and `src/styles/cards.css` (Task 14, only if unused).

## Decisions the brief and the mockups left open

Recorded here so reviewers do not re-litigate them. Each is a `Ruling:` line.

1. Ruling: the stubs for the three reports live in the committed fixture `setup-remaining.js`, not a scratch file — later tasks and reviewers need them and the file has no hex colours — costs nothing if wrong (delete the file).
2. Ruling: `dashboard.css` is deleted whole in Task 12 instead of pruned rule by rule — its last consumers (Reports, Settings, Audit Logs) are rebuilt on the kit in this plan, so every rule becomes dead at once — costs a missed rule if some unmigrated markup still used a global class (Task 12 greps for that and checks the shell at 800px and 390px).
3. Ruling: Reports gets the mockup's underline `Tabs`, not the old pill look the leftover list mentions — the mockup (`reports-desktop.png`) is the approved appearance — costs a restyle if the pill look was wanted.
4. Ruling: on Delivery Areas the customers count is a link to `/users?area=<id>` when above zero, and the standalone "Users" button goes — the mockup shows plain numbers, but the link keeps the existing way into the filtered Users list — costs one underlined number.
5. Ruling: on Sessions, "Change quantity" opens a small dialog and replaces the inline number input that saved on blur; "View orders" carries no count — the mockup shows the button, the unlabelled blur-saving input was an accessibility defect, and the order count is not in the session payload — costs one extra click per quantity edit.
6. Ruling: Notices replaces `window.confirm` with the kit `ConfirmDialog` and reports the push result with a toast — plan 1 conventions say confirms use `ConfirmDialog` and success feedback uses `useToast` — costs nothing.
7. Ruling: links are underlined (`.ui-link`), unlike the mockup's plain green text — WCAG 1.4.1 asks for more than colour to tell a link from text — costs a slightly busier sign-in page.
8. Ruling: after a dialog started from the profile drawer closes, focus returns to that customer's "View" button, or to the search box when the customer left the current tab (for example after Approve) — the row can disappear, so a fixed target would fail — costs nothing.
9. Ruling: Users is not refactored onto the new `Who` component — it works and is outside this plan's scope — costs one duplicated avatar-and-text cell.
10. Ruling: only the `.modal__btn*` classes and the four `--*-color` aliases are removed from `modal.css` and `variables.css`; the `.modal__form` input and label rules stay — removing them risks dialogs the migrated pages share with Orders and Users, and nobody asked for it — costs a few dead lines.
11. Ruling: an admin with status `inactive` is labelled "Suspended" (the mockup), a delivery person "Inactive" — the mockups label them differently and the existing buttons already say Suspend and Disable — costs a label change.
12. Ruling: the `Switch` off state gets a 1px Mist inset border — Mist `#5c6b61` on Paper is 5.0:1 while the mockup's off track (Line strong on Paper) is about 1.6:1, below the 3:1 WCAG 1.4.11 asks of a control boundary — costs nothing visible beyond a thin outline.
13. Ruling: the forgot-password art copy says the link "works for one hour" because `Backend/apps/user-service/src/services/passwordResetService.js` sets the emailed link to expire in 1 hour — verified, not copied blindly — costs a copy edit if the backend changes.
14. Ruling: four list hooks (`useDeliveryAreas`, `useFoodItems`, `useDeliveryPersons`, `useAdmins`) gain a `loaded` flag like `useUsers` has, so `DataTable` shows a spinner instead of "Nothing to show" during the first load — the kit's `loading` prop needs it — costs one state variable each.
15. Ruling: Task 14 treats "labels on every form" as an audit of every visible control (a script walks all routes and the dialogs) rather than a rewrite of pages already on `Field` — the pages migrated in Tasks 4-13 are built on `Field` already — costs a second look at Orders, Dashboard and Users if the audit finds something.

---

### Task 1: Fixtures for the remaining pages

**Files:**
- Create: `docs/superpowers/ui-baseline/setup-remaining.js`

**Interfaces:**
- Consumes: the response shapes in `src/Pages/*/*.service.ts` and `src/types/*.ts` (notices `{ notices }`, areas as a plain array, `/analytics/area-metrics` as `{ data }`, sessions `{ data: { mealSessions } }`, food items `{ data: { foodItems } }`, delivery persons `{ deliveryPersons }`, admins `{ admins }`, audit logs `{ rows, total, page_size }`, reports `{ range, data }`).
- Produces: a runner script `async (page) => {...}` that stubs those GETs. Today's sessions carry ids 11 (lunch, open all day) and 12 (dinner); breakfast is absent on purpose (shows the empty panel). Later tasks rely on these names: areas "Colombo 03", "Nugegoda", "Dehiwala", "Mount Lavinia" (inactive, 0 customers); food items "Chicken fried rice", "Vegetable kottu", "Egg hoppers (3)", "Fish ambul thiyal" (inactive), "Rice and curry (veg)"; persons "Sampath Kumara", "Rohan Dias", "Mahesh Wijesekara" (inactive); admins "Buddhi Gayan" (super admin), "Nadeesha Perera", "Lakmal Jayawardena" (inactive).

- [ ] **Step 1: Create `docs/superpowers/ui-baseline/setup-remaining.js`**

```js
async (page) => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();

  const AREAS = [
    { area_id: 1, area_name: "Colombo 03", code: "COL-03", status: "active", notes: "Lunch cut-off 10:30", assigned_users: 118 },
    { area_id: 2, area_name: "Nugegoda", code: "NUG", status: "active", notes: "Deliveries by 1:00 PM", assigned_users: 41 },
    { area_id: 3, area_name: "Dehiwala", code: "DEH", status: "active", notes: null, assigned_users: 36 },
    { area_id: 4, area_name: "Mount Lavinia", code: "MTL", status: "inactive", notes: "Not serving yet", assigned_users: 0 },
  ];
  const METRICS = [[1, 512, 612300], [2, 388, 441800], [3, 242, 230400], [4, 0, 0]].map(([area_id, orderCount, totalRevenue]) => ({ area_id, orderCount, totalRevenue }));

  const NOTICES = [
    { id: 3, title: "Lunch delayed in Nugegoda", body: "Heavy rain is slowing deliveries. Expect lunch about 30 minutes late.", area_id: 2, createdAt: ago(2) },
    { id: 2, title: "Poya day schedule", body: "No deliveries on Monday. Orders reopen on Tuesday at 6:00 AM.", area_id: null, createdAt: ago(120) },
    { id: 1, title: "New: egg hoppers at breakfast", body: "Order three hoppers with sambol from 6:00 AM, Colombo 03 and Dehiwala.", area_id: 1, createdAt: ago(240) },
  ];

  const food = (id, name, description, price, meal_type, category, dietary_tags, is_active = true) => ({
    id, name, description, price: price.toFixed(2), meal_type, image_url: null, is_active, category, dietary_tags,
  });
  const FOOD = [
    food(1, "Chicken fried rice", "Wok-fried rice with egg and leeks", 450, "non-veg", "Rice", null),
    food(2, "Vegetable kottu", "Chopped roti with seasonal vegetables", 450, "veg", "Kottu", "vegan option"),
    food(3, "Egg hoppers (3)", "Three hoppers with seeni sambol", 300, "veg", "Breakfast", null),
    food(4, "Fish ambul thiyal", "Sour fish curry with rice", 700, "non-veg", "Rice", "gluten-free", false),
    food(5, "Rice and curry (veg)", "Rice with three vegetable curries", 500, "veg", "Rice", null),
  ];
  const sItem = (id, f, available_quantity) => ({ id, food_item_id: f.id, available_quantity, foodItem: f });
  const SESSIONS = [
    { id: 11, date: today, meal_time: "lunch", start_time: "00:00:00", end_time: "23:59:00", notes: "Use the side gate on Galle Road.", sessionItems: [sItem(101, FOOD[0], null), sItem(102, FOOD[1], 60), sItem(103, FOOD[4], 40)] },
    { id: 12, date: today, meal_time: "dinner", start_time: "18:00:00", end_time: "21:00:00", notes: null, sessionItems: [sItem(104, FOOD[0], null), sItem(105, FOOD[3], 12)] },
  ];
  const PRICE_HISTORY = [
    { id: 2, old_price: "450.00", new_price: "480.00", changed_at: ago(72) },
    { id: 1, old_price: null, new_price: "450.00", changed_at: ago(900) },
  ];

  const PERSONS = [
    { id: "d0000001-0000-0000-0000-000000000000", full_name: "Sampath Kumara", email: "sampath.k@rc.lk", phone: "077 650 1180", nic: "881234567V", vehicle_type: "Motorbike", status: "active", created_at: ago(900) },
    { id: "d0000002-0000-0000-0000-000000000000", full_name: "Rohan Dias", email: "rohan.d@rc.lk", phone: "071 340 7722", nic: "902345678V", vehicle_type: "Three-wheeler", status: "active", created_at: ago(800) },
    { id: "d0000003-0000-0000-0000-000000000000", full_name: "Mahesh Wijesekara", email: "mahesh.w@rc.lk", phone: "076 118 4409", nic: null, vehicle_type: "Motorbike", status: "inactive", created_at: ago(700) },
  ];
  const ADMINS = [
    { id: "a0000001-0000-0000-0000-000000000000", full_name: "Buddhi Gayan", email: "buddhi.gayan@ifs.com", phone: null, role: "super_admin", status: "active", created_at: "2026-09-02T04:00:00Z" },
    { id: "a0000002-0000-0000-0000-000000000000", full_name: "Nadeesha Perera", email: "nadeesha.p@rc.lk", phone: null, role: "admin", status: "active", created_at: "2026-09-14T04:00:00Z" },
    { id: "a0000003-0000-0000-0000-000000000000", full_name: "Lakmal Jayawardena", email: "lakmal.j@rc.lk", phone: null, role: "admin", status: "inactive", created_at: "2026-09-20T04:00:00Z" },
  ];

  const AUDIT = [
    ["Buddhi Gayan", "super_admin", "order.payment", "order", "ORD-20261018-0034", { payment_status: "paid" }, 1],
    ["Nadeesha Perera", "admin", "order.status", "order", "ORD-20261018-0038", { status: "delivery_failed", reason: "customer not at address" }, 2],
    ["Buddhi Gayan", "super_admin", "settings.update", "settings", null, { auto_block_unpaid_threshold: 3 }, 20],
    ["Buddhi Gayan", "super_admin", "admin.suspend", "admin", "Lakmal Jayawardena", null, 24],
    ["Nadeesha Perera", "admin", "notice.create", "notice", "Poya day schedule", { area: "everyone" }, 48],
  ].map(([actor_name, actor_role, action, target_type, target_id, details, h], i) => ({ id: i + 1, actor_id: null, actor_name, actor_role, action, target_type, target_id, details, created_at: ago(h) }));

  const days = (from, to) => {
    const out = [];
    for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
    return out;
  };

  await page.route(/localhost:400\d\/api/, (route) => {
    const req = route.request();
    if (req.method() !== "GET") return route.fallback();
    const url = new URL(req.url());
    const p = url.pathname;
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (p.endsWith("/analytics/area-metrics")) return json({ data: METRICS });
    if (p.endsWith("/areas")) return json(AREAS);
    if (p.endsWith("/users/notices")) return json({ notices: NOTICES });
    if (/\/meal-sessions\/\d+\/delivery$/.test(p)) return json({ data: { assignments: [{ area_id: 1, user_id: PERSONS[0].id }] } });
    if (p.endsWith("/meal-sessions")) return json({ data: { mealSessions: url.searchParams.get("date") === today ? SESSIONS : [] } });
    if (/\/food-items\/\d+\/price-history$/.test(p)) return json({ data: PRICE_HISTORY });
    if (p.endsWith("/food-items")) return json({ data: { foodItems: FOOD } });
    if (p.endsWith("/users/delivery-persons")) return json({ deliveryPersons: PERSONS });
    if (p.endsWith("/users/admins")) return json({ admins: ADMINS });
    if (p.endsWith("/users/audit-logs")) return json({ rows: AUDIT, total: 86, page_size: 25 });

    const report = p.match(/\/analytics\/reports\/(sales|items|areas)$/);
    if (report) {
      const from = url.searchParams.get("from") ?? today;
      const to = url.searchParams.get("to") ?? today;
      const range = { from, to, areaId: null, session: null };
      if (report[1] === "sales") {
        return json({ range, data: days(from, to).map((date, i) => { const orderCount = 110 + ((i * 37) % 80); return { date, orderCount, totalRevenue: orderCount * 1100 }; }) });
      }
      if (report[1] === "items") {
        return json({ range, data: FOOD.map((f, i) => ({ food_name: f.name, total_quantity: 420 - i * 70, total_revenue: (420 - i * 70) * Number(f.price) })) });
      }
      return json({ range, data: AREAS.map((a, i) => ({ area_id: a.area_id, area_name: a.area_name, orderCount: METRICS[i].orderCount, totalRevenue: METRICS[i].totalRevenue, completedCount: Math.round(METRICS[i].orderCount * 0.9) })) });
    }
    return route.fallback();
  });
  return "stubbed remaining pages";
}
```

- [ ] **Step 2: Check that every stub reaches the app**

Write `$SCRATCH/check-fixtures.js`:

```js
async (page) => {
  const want = [
    ["/notices", "Poya day schedule"],
    ["/delivery-areas", "Mount Lavinia"],
    ["/sessions", "Chicken fried rice"],
    ["/food-items", "Fish ambul thiyal"],
    ["/delivery-persons", "Sampath Kumara"],
    ["/admins", "Nadeesha Perera"],
    ["/audit-logs", "ORD-20261018-0034"],
    ["/reports", "Oct"],
  ];
  const res = {};
  for (const [path, text] of want) {
    await page.goto(`http://localhost:5173${path}`);
    await page.waitForLoadState("networkidle");
    res[path] = (await page.locator("main").innerText()).includes(text);
  }
  return res;
}
```

Run: `SCRATCH="$SCRATCH" node "$RUN" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js docs/superpowers/ui-baseline/setup-remaining.js "$SCRATCH/check-fixtures.js"`
Expected: every value `true`. (The pages still have their old look at this point; only the data is checked. If `/reports` is `false` because the dates render as `2026-10-..`, look for `2026-` instead and note it in your report.)

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/ui-baseline/setup-remaining.js
git commit -m "test(ui): add stubs for the pages still on the old look"
```

(End the message with the `Co-Authored-By` line from Global Constraints.)

---

### Task 2: Kit additions: Switch, Tabs, Mark, Who, tones, footer slot, helpers

**Files:**
- Create: `src/components/ui/Switch.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/Mark.tsx`, `src/components/ui/Who.tsx`
- Modify: `src/components/ui/Badge.tsx`, `Button.tsx`, `Field.tsx`, `DataTable.tsx`, `index.ts`, `ui.css` (append), `src/Pages/UiKit/UiKit.tsx`

**Interfaces:**
- Consumes: tokens from `src/styles/variables.css`; `Avatar` from `src/components/ui/Avatar.tsx`.
- Produces (exact):
  - `Switch({ label: string, checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean, showState?: boolean })`: a `<button role="switch">`; `label` is its accessible name; `showState` adds a visible "On"/"Off" next to it.
  - `Tabs<T extends string>({ label: string, value: T, tabs: { value: T; label: string }[], onChange: (v: T) => void, children: ReactNode })`: a tablist plus a `tabpanel` wrapping `children`; arrow keys, Home and End move and activate the tab.
  - `Mark({ tone: "leaf" | "turmeric" | "brick" | "mist" | "ring", children: ReactNode })`: a dot and a word.
  - `Who({ name: string, meta?: ReactNode, square?: boolean, src?: string | null, tone?: Avatar's tone, size?: "sm" | "md" })`: avatar plus bold name plus muted meta line.
  - `BadgeTone` gains `"dark"` (Tea fill, white text) and `"outline"` (no fill, Mist text, Line-strong border).
  - `Button` `variant` gains `"danger-ghost"` (no fill, Brick text, brick wash on hover).
  - `Field` gains `optional?: boolean`, which appends a quiet "(optional)" to the label.
  - `Column.footer?: ReactNode` on `DataTable`: when any column has one, a `<tfoot>` row renders under the last row.
  - CSS helpers: `.ui-link`, `.ui-dim`, `.ui-tag`, `.ui-form-row`, `.ui-filterbar__note--end`, and `.ui-card__header` wraps on narrow widths.

- [ ] **Step 1: Create `src/components/ui/Switch.tsx`**

```tsx
interface SwitchProps {
  label: string; // names the switch for screen readers; make it unique per row
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showState?: boolean; // a visible "On" / "Off" beside it
}

/** An on/off setting that takes effect at once (a food item's availability). Use a checkbox when the choice waits for a Save button. */
export function Switch({ label, checked, onChange, disabled, showState = false }: SwitchProps) {
  return (
    <span className="ui-switchwrap">
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="ui-switch" onClick={() => onChange(!checked)} />
      {showState && (
        <span className="ui-switchwrap__state" aria-hidden="true">
          {checked ? "On" : "Off"}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Tabs.tsx`**

```tsx
import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

interface TabsProps<T extends string> {
  label: string; // names the tab list for screen readers
  value: T;
  tabs: { value: T; label: string }[];
  onChange: (v: T) => void;
  children: ReactNode; // the panel for the selected tab
}

/** Switches between views of the same data (the three reports). Chips filter a list; Segmented picks a range; Tabs change the view. */
export function Tabs<T extends string>({ label, value, tabs, onChange, children }: TabsProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(tabs[to].value);
    refs.current[to]?.focus();
  };

  return (
    <>
      <div className="ui-tabs" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${t.value}`}
            type="button"
            role="tab"
            className="ui-tab"
            aria-selected={t.value === value}
            aria-controls={`${id}-panel`}
            tabIndex={t.value === value ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => move(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0}>
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/Mark.tsx` and `src/components/ui/Who.tsx`**

`Mark.tsx`:

```tsx
import type { ReactNode } from "react";

interface MarkProps {
  tone: "leaf" | "turmeric" | "brick" | "mist" | "ring"; // leaf = fine, turmeric = needs a human, brick = wrong, mist = off, ring = waiting
  children: ReactNode;
}

/** A state as a dot and a word (Active, Veg). The word always carries the meaning; the dot is decoration. */
export function Mark({ tone, children }: MarkProps) {
  return (
    <span className="ui-mark">
      <i className={`ui-mark__dot ui-mark__dot--${tone}`} aria-hidden="true" />
      {children}
    </span>
  );
}
```

`Who.tsx`:

```tsx
import type { ComponentProps, ReactNode } from "react";
import { Avatar } from "./Avatar";

interface WhoProps {
  name: string;
  meta?: ReactNode; // email, description, a badge
  square?: boolean; // items and areas are rounded squares, people are circles
  src?: string | null;
  tone?: ComponentProps<typeof Avatar>["tone"];
  size?: "sm" | "md";
}

/** The first cell of a people or items list: avatar, bold name, muted detail line. */
export function Who({ name, meta, square, src, tone = "leaf", size }: WhoProps) {
  return (
    <div className="ui-who">
      <Avatar name={name} square={square} src={src} tone={tone} size={size} />
      <div className="ui-who__text">
        <b className="ui-cell__title">{name}</b>
        {meta && <div className="ui-cell__meta">{meta}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Edit `Badge.tsx`, `Button.tsx`, `Field.tsx`**

In `src/components/ui/Badge.tsx` replace the `BadgeTone` line with:

```ts
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "dark" | "outline";
```

In `src/components/ui/Button.tsx` replace the `variant` line with:

```ts
  variant?: "primary" | "secondary" | "danger" | "ghost" | "danger-ghost";
```

In `src/components/ui/Field.tsx` replace the `FieldProps` interface and the label line. The interface becomes:

```tsx
interface FieldProps {
  label: string;
  optional?: boolean; // appends a quiet "(optional)" to the label
  hint?: string;
  error?: string;
  children: ReactElement; // one input, select or textarea
}
```

The function signature becomes `export function Field({ label, optional, hint, error, children }: FieldProps) {` and the label line becomes:

```tsx
      <label htmlFor={id} className="ui-field__label">
        {label}
        {optional && <span className="ui-field__opt"> (optional)</span>}
      </label>
```

- [ ] **Step 5: Edit `DataTable.tsx` (footer slot)**

In the `Column<T>` interface add after the `nowrap?: boolean;` line:

```ts
  footer?: ReactNode; // a total or summary shown under the last row; any column with one turns on the footer row
```

Replace the closing of the `<tbody>` so the table body is followed by the footer. The block

```tsx
            </tbody>
          </table>
```

becomes

```tsx
            </tbody>
            {columns.some((c) => c.footer !== undefined) && (
              <tfoot role="rowgroup">
                <tr role="row">
                  {columns.map((c) => (
                    <td key={c.key} role="cell" data-label={c.label} data-slot={c.mobile} className={cls(c.nowrap && "ui-nowrap", c.align === "right" && "ui-right")}>
                      {c.footer}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
```

- [ ] **Step 6: Append to `src/components/ui/ui.css`**

```css

/* ===== Plan 4 additions: switch, tabs, mark, who, tones, footer row, helpers ===== */
.ui-link { color: var(--color-primary-text); text-decoration: underline; text-underline-offset: 3px; }
.ui-link:hover { color: var(--color-primary-solid-hover); }
.ui-dim { opacity: 0.55; transition: opacity 0.15s; }
.ui-tag { display: inline-block; margin: 2px 4px 2px 0; padding: 1px 8px; border-radius: var(--radius-full); background: var(--gray-100); color: var(--gray-700); font-size: var(--text-xs); }
.ui-badge--dark { background: var(--tea); color: var(--white); border-color: var(--tea); }
.ui-badge--outline { background: none; color: var(--gray-500); border-color: var(--gray-300); }
.ui-btn--danger-ghost { background: transparent; color: var(--color-danger-text); }
.ui-btn--danger-ghost:hover:not(:disabled) { background: var(--color-danger-bg); }
.ui-card__header { flex-wrap: wrap; }
.ui-field__opt { font-weight: 400; color: var(--gray-500); }
.ui-field textarea { resize: vertical; }
.ui-form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.ui-filterbar__note--end { margin-left: auto; }

/* Mark: a state as a dot and a word */
.ui-mark { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 500; white-space: nowrap; }
.ui-mark__dot { width: 8px; height: 8px; flex: none; border-radius: var(--radius-full); }
.ui-mark__dot--leaf { background: var(--color-primary); }
.ui-mark__dot--turmeric { background: var(--color-warning); }
.ui-mark__dot--brick { background: var(--color-danger); }
.ui-mark__dot--mist { background: var(--gray-300); }
.ui-mark__dot--ring { background: none; border: 2px solid var(--gray-300); }

/* Who: avatar, name, detail line */
.ui-who { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.ui-who__text { min-width: 0; }
.ui-who__text .ui-cell__meta { overflow-wrap: anywhere; }

/* Switch: takes effect at once. The off state carries a Mist outline so the control reads at 3:1 on Paper. */
.ui-switchwrap { display: inline-flex; align-items: center; gap: var(--space-2); }
.ui-switchwrap__state { color: var(--gray-500); font-size: var(--text-sm); }
.ui-switch {
  position: relative;
  flex: none;
  width: 38px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--gray-300);
  box-shadow: inset 0 0 0 1px var(--gray-500);
  cursor: pointer;
  transition: background-color 0.15s;
}
.ui-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 0 0 1px var(--gray-500);
  transition: transform 0.15s;
}
.ui-switch[aria-checked="true"] { background: var(--color-primary-solid); box-shadow: none; }
.ui-switch[aria-checked="true"]::after { transform: translateX(16px); box-shadow: none; }
.ui-switch:disabled { opacity: 0.45; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) {
  .ui-switch, .ui-switch::after { transition: none; }
}
@media (max-width: 640px) {
  .ui-switch { width: 46px; height: 26px; }
  .ui-switch::after { top: 3px; left: 3px; width: 20px; height: 20px; }
  .ui-switch[aria-checked="true"]::after { transform: translateX(20px); }
}

/* Tabs: views of the same data, underlined */
.ui-tabs { display: flex; gap: 22px; margin-bottom: var(--space-4); overflow-x: auto; border-bottom: 1px solid var(--gray-200); }
.ui-tab {
  flex: none;
  padding: 10px 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--gray-500);
  font: inherit;
  font-size: var(--text-base);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.ui-tab:hover { color: var(--ink); }
.ui-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--color-primary); font-weight: 600; }
.ui-tab:focus-visible { outline-offset: -2px; }
@media (max-width: 640px) {
  .ui-tab { min-height: 44px; }
}

/* DataTable footer row (a total) */
.ui-table tfoot td { padding: 14px var(--space-3); border-top: 2px solid var(--ink); border-bottom: 1px solid var(--gray-200); font-weight: 700; }
@media (max-width: 640px) {
  .ui-table tfoot { display: block; }
  .ui-table tfoot tr { border-top: 2px solid var(--ink); }
  .ui-table tfoot td { padding: 0; border: 0; }
  .ui-form-row { grid-template-columns: minmax(0, 1fr); }
}
```

- [ ] **Step 7: Edit `src/components/ui/index.ts`**

Append:

```ts
export { Switch } from "./Switch";
export { Tabs } from "./Tabs";
export { Mark } from "./Mark";
export { Who } from "./Who";
```

- [ ] **Step 8: Show the new pieces in `src/Pages/UiKit/UiKit.tsx`**

Read the file first. Add `Mark, Switch, Tabs, Who` to the kit import, keep its `Section` helper and style, and append these sections before the closing tag of the page (use `useState` for the switch and tab, which the component already imports):

- "Switch": two switches, one on one off, each with `showState` and a `label` such as `Available to customers`; one disabled.
- "Tabs": `Tabs` with three tabs (`sales`, `items`, `areas`) and a short paragraph as the panel.
- "Mark and Who": one `Mark` per tone, and two `Who` rows (a person with an email meta, a square item with `tone="auto"` and `size="md"`).
- "Badges and buttons": a `Badge` per tone including `dark` and `outline`, and a `Button variant="danger-ghost"` next to a secondary one.
- "Footer row": a `DataTable` of three rows with a `footer` on the first two columns (`"Total"` and a number).
- "Optional field": a `Field label="Description" optional` with a textarea, and a two-column `ui-form-row` with a price and a type field.

- [ ] **Step 9: Verify**

Run `npx tsc -b` and `npx eslint src/components/ui src/Pages/UiKit` (both must print nothing).

Write `$SCRATCH/kit-check.js`: go to `/ui-kit`, screenshot at 1440 and 390 (see the template in "Verification tooling"), then drive the tabs by keyboard:

```js
async (page) => {
  await page.goto("http://localhost:5173/ui-kit");
  await page.waitForLoadState("networkidle");
  const first = page.getByRole("tab").first();
  await first.focus();
  await page.keyboard.press("ArrowRight");
  const selected = await page.getByRole("tab", { selected: true }).innerText();
  const sw = page.getByRole("switch").first();
  const before = await sw.getAttribute("aria-checked");
  await sw.click();
  const after = await sw.getAttribute("aria-checked");
  return { selected, before, after };
}
```

Expected: `selected` is the second tab's label, and `before`/`after` differ. Read both screenshots; the switch, tabs, marks, badges and footer row must match `docs/superpowers/mockups/png/components-desktop.png`. Check the phone footer row has a heavy rule above it and no per-cell borders.

- [ ] **Step 10: Commit**

```bash
git add src/components/ui/Switch.tsx src/components/ui/Tabs.tsx src/components/ui/Mark.tsx src/components/ui/Who.tsx src/components/ui/Badge.tsx src/components/ui/Button.tsx src/components/ui/Field.tsx src/components/ui/DataTable.tsx src/components/ui/index.ts src/components/ui/ui.css src/Pages/UiKit/UiKit.tsx
git commit -m "feat(ui): add switch, tabs, mark, who, footer row and quiet-danger button"
```

---

### Task 3: Leftovers: dashboard hook, stale dialog error, focus after a drawer action

**Files:**
- Modify: `src/hooks/useDashboard.ts`, `src/hooks/useUsers.ts`, `src/Pages/Users/Users.tsx`

**Interfaces:**
- Consumes: the current `useDashboard`, `useUsers`, `UsersPage`, `CustomerDrawer` (its `onAction` prop is unchanged).
- Produces: `useUsers()` also returns `clearError: () => void`. The Users search box has `id="cust-search"` and each row's View button has `id="cust-view-<customer id>"` (Task 14's audit and this task's check use them).

- [ ] **Step 1: Remove the unused tab state from `useDashboard`**

In `src/hooks/useDashboard.ts` delete the import `import { useState } from "react";`, the import `import type { MealType } from "../types/dashboard";`, the line `const [activeTab, setActiveTab] = useState<MealType>("breakfast");`, and the line `activeTab, setActiveTab, tabs: ["breakfast", "lunch", "dinner"] as MealType[],` from the returned object. Run `grep -rn "activeTab\|\.tabs" src/Pages/Dashboard src/components` first and confirm nothing reads them (the only hits should be `dashboard.css`'s `.tabs` rule and `dashboard.logic.ts`'s unrelated `MealType`).

- [ ] **Step 2: Add `clearError` to `useUsers`**

In `src/hooks/useUsers.ts` add `clearError: () => setError(""),` to the returned object, next to `error, loaded,`.

- [ ] **Step 3: Clear the stale error when a dialog opens, and return focus after a drawer-started dialog closes**

In `src/Pages/Users/Users.tsx`:

1. Add `useRef` to the React import: `import { useRef, useState } from "react";`.
2. After `const [reason, setReason] = useState("");` add:

```tsx
  // Set when a dialog was started from the profile drawer. The drawer closes first, so closing the dialog would otherwise drop focus on the page.
  const returnTo = useRef<string | null>(null);
```

3. Replace `const close = () => setDialog(null);` with:

```tsx
  const close = () => {
    setDialog(null);
    const id = returnTo.current;
    returnTo.current = null;
    // The customer may have left this tab (Approve moves them), so fall back to the search box
    if (id) requestAnimationFrame(() => (document.getElementById(`cust-view-${id}`) ?? document.getElementById("cust-search"))?.focus());
  };
```

4. Replace the `open` function with:

```tsx
  const open = (d: NonNullable<Dialog>) => {
    u.clearError(); // an error from an earlier action must not show inside this dialog
    setAreaId(String(d.user.area_id ?? ""));
    setReason("");
    setDialog(d);
  };
```

5. On the row's View button add `id={`cust-view-${c.id}`}`: the button becomes `<Button id={`cust-view-${c.id}`} size="sm" variant="ghost" aria-label={`View ${c.full_name}`} onClick={() => u.openProfile(c.id)}>`.
6. On the `SearchField` add `id="cust-search"`.
7. In the `CustomerDrawer` `onAction` handler replace the body with:

```tsx
        onAction={(kind) => {
          // close the drawer first so the profile is never stale behind the confirmation dialog
          if (u.profile) {
            returnTo.current = u.profile.id;
            open({ kind, user: u.profile });
          }
          u.closeProfile();
        }}
```

- [ ] **Step 4: Verify**

`npx tsc -b` and `npx eslint src/hooks src/Pages/Users` print nothing.

Browser check (fixtures: setup.js, setup-dashboard-users.js). Write `$SCRATCH/users-focus.js`:

```js
async (page) => {
  await page.goto("http://localhost:5173/users");
  await page.waitForLoadState("networkidle");
  const active = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  const res = {};
  // 1. Cancel from the drawer returns focus to the row's View button
  await page.getByRole("button", { name: /^View Amaya/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(300);
  res.afterCancel = await active();
  // 2. Approve from the drawer: the customer leaves the Pending tab, focus falls back to the search box
  await page.getByRole("button", { name: /^View Amaya/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await page.getByRole("dialog").locator("select").selectOption("1");
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await page.waitForTimeout(500);
  res.afterApprove = await active();
  return res;
}
```

Expected: `afterCancel` starts with `cust-view-`; `afterApprove` is `cust-search` or a `cust-view-` id (the stub does not move the customer, so either is acceptable; report which). For the stale error, in a second script force an error: `await page.route(/\/approve$/, r => r.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ message: "Boom" }) }))` (register it after the stubs), click Approve on one customer, submit, see "Boom" in the dialog, Cancel, then open Reject on another customer and confirm the dialog contains no "Boom".

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDashboard.ts src/hooks/useUsers.ts src/Pages/Users/Users.tsx
git commit -m "fix(users): clear stale dialog errors, return focus after a drawer action; drop unused dashboard tab state"
```

---

### Task 4: Notices

**Files:**
- Rewrite: `src/Pages/notices/Notices.tsx`, `src/Pages/notices/notices.css`

**Interfaces:**
- Consumes: `notices.service.ts` (`Notice`, `Area`, `listNotices`, `listAreas`, `createNotice`, `deleteNotice`), kit `Alert, Badge, Button, Card, EmptyState, Field, PageHeader, useToast`, `ConfirmDialog`, `formatDateTime`.
- Produces: the page; no new exports.

Mockup: `notices-desktop.png`. Two columns on desktop: a "New notice" panel on the left, "Sent notices" as ruled rows on the right (each with an outline badge for the audience, the time, and a quiet Delete). One column below 900px.

- [ ] **Step 1: Replace `src/Pages/notices/notices.css`**

```css
.nt-layout { display: grid; grid-template-columns: minmax(0, 480px) minmax(0, 1fr); gap: var(--space-8); align-items: start; }
.nt-form { display: grid; gap: var(--space-4); }
.nt-form__send { justify-self: end; }
.nt-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--gray-300); }
.nt-item { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding: var(--space-3); border-bottom: 1px solid var(--gray-200); }
.nt-item__title { display: block; font-size: 14.5px; font-weight: 600; }
.nt-item__body { margin: 2px 0 var(--space-2); white-space: pre-wrap; overflow-wrap: anywhere; }
.nt-item__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); color: var(--gray-500); font-size: var(--text-sm); }
@media (max-width: 900px) {
  .nt-layout { grid-template-columns: minmax(0, 1fr); }
}
```

- [ ] **Step 2: Replace `src/Pages/notices/Notices.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";
import "./notices.css";
import { createNotice, deleteNotice, listAreas, listNotices } from "./notices.service";
import type { Area, Notice } from "./notices.service";
import { Alert, Badge, Button, Card, EmptyState, Field, PageHeader, useToast } from "../../components/ui";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";

export default function NoticesPage() {
  const toast = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [areaId, setAreaId] = useState(""); // "" = everyone
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [toDelete, setToDelete] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([listNotices(), listAreas()]);
      setNotices(n);
      setAreas(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notices");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const areaName = (id: Notice["area_id"]) =>
    id === null ? "Everyone" : (areas.find((a) => a.area_id === Number(id))?.area_name ?? `Area ${id}`);

  const send = async () => {
    setConfirmSend(false);
    setSending(true);
    setError("");
    try {
      const { push } = await createNotice({ title: title.trim(), body: body.trim(), area_id: areaId ? Number(areaId) : null });
      toast.show(`Sent to ${push.sent} device${push.sent === 1 ? "" : "s"}${push.failed ? `, ${push.failed} failed` : ""}`);
      setTitle("");
      setBody("");
      setAreaId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notice");
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    const n = toDelete;
    setToDelete(null);
    if (!n) return;
    try {
      await deleteNotice(n.id);
      toast.show("Notice deleted");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the notice");
    }
  };

  return (
    <div>
      <PageHeader title="Notices" subtitle="Announcements go to customers' phones and appear in the app." />
      {error && <Alert>{error}</Alert>}

      <div className="nt-layout">
        <Card title="New notice">
          <form
            className="nt-form"
            onSubmit={(e) => {
              e.preventDefault();
              // A push can't be recalled once sent, so the admin confirms the audience first
              setConfirmSend(true);
            }}
          >
            <Field label="Title" hint="Up to 150 characters">
              <input maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Message">
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>
            <Field label="Send to">
              <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Everyone</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" variant="primary" className="nt-form__send" loading={sending} disabled={!title.trim() || !body.trim()}>
              Send notice
            </Button>
          </form>
        </Card>

        <section aria-labelledby="nt-sent">
          <h2 id="nt-sent" className="ui-section ui-section--first">
            Sent notices
          </h2>
          {notices.length === 0 ? (
            <EmptyState title="No notices yet" hint="Notices you send show up here." />
          ) : (
            <ul className="nt-list">
              {notices.map((n) => (
                <li className="nt-item" key={n.id}>
                  <div>
                    <b className="nt-item__title">{n.title}</b>
                    <p className="nt-item__body">{n.body}</p>
                    <div className="nt-item__meta">
                      <Badge tone="outline">{areaName(n.area_id)}</Badge>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="danger-ghost" aria-label={`Delete ${n.title}`} onClick={() => setToDelete(n)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmSend}
        title="Send this notice?"
        message={`Send "${title.trim()}" to ${areaId ? areaName(Number(areaId)) : "all customers"}? A push can't be recalled once it is sent.`}
        confirmLabel="Send"
        tone="primary"
        onCancel={() => setConfirmSend(false)}
        onConfirm={send}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete notice"
        message={`Delete "${toDelete?.title}"? Customers will no longer see it in the app.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

`npx tsc -b` and `npx eslint src/Pages/notices` print nothing; `grep -n "#[0-9a-fA-F]\{3,6\}\b" src/Pages/notices/notices.css` prints nothing.

Browser check (all three stub scripts): screenshot `/notices` at 1440 and 390 and compare with `notices-desktop.png`; then type a title and message, click "Send notice", confirm the dialog shows `Send "<title>" to all customers? ...` and Cancel closes it without sending; click a row's Delete and confirm the `Delete notice` dialog names the notice. Confirm there is no console error (the runner prints `PAGEERROR` lines).

- [ ] **Step 4: Commit**

```bash
git add src/Pages/notices/Notices.tsx src/Pages/notices/notices.css
git commit -m "feat(notices): panel form, ruled sent list and kit confirmations on the new identity"
```

---

### Task 5: Delivery Areas

**Files:**
- Rewrite: `src/Pages/deliveryareas/DeliveryAreas.tsx`
- Modify: `src/hooks/useDeliveryAreas.ts`
- Delete: `src/Pages/deliveryareas/deliveryareas.css`

**Interfaces:**
- Consumes: `useDeliveryAreas` (`areas, error, metricsAvailable, metricOf, onSave, onDelete`), kit `Alert, Button, DataTable, Field, Mark, PageHeader`, `Modal`, `ConfirmDialog`, `formatMoney`, `AreaForm`, `DeliveryArea`.
- Produces: `useDeliveryAreas()` also returns `loaded: boolean` (false until the first area list arrives).

Mockups: `areas-desktop.png` (a ruled table, not cards) and `areas-delete-desktop.png` (the "can't be deleted yet" dialog).

- [ ] **Step 1: Add `loaded` to `useDeliveryAreas`**

In `src/hooks/useDeliveryAreas.ts` add `const [loaded, setLoaded] = useState(false); // false until the first area list arrives` after the `error` state, change the `load` definition to

```ts
    const load = useCallback(
        () => Promise.all([listAreas().then((a) => { setAreas(a); setLoaded(true); }), getAreaMetrics().then(setMetrics, () => setMetrics(null))]),
        [],
    );
```

and return `loaded` in the object: `areas, error, loaded, metricsAvailable, metricOf,`.

- [ ] **Step 2: Replace `src/Pages/deliveryareas/DeliveryAreas.tsx`**

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { Alert, Button, DataTable, Field, Mark, PageHeader } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import type { AreaForm, DeliveryArea } from "../../types/deliveryAreas";

const EMPTY: AreaForm = { area_name: "", code: "", status: "active", notes: "" };

export default function DeliveryAreasPage() {
  const { areas, error, loaded, metricsAvailable, metricOf, onSave, onDelete } = useDeliveryAreas();
  const navigate = useNavigate();
  // `form`: null = closed, {} = adding, {area} = editing
  const [form, setForm] = useState<{ area?: DeliveryArea } | null>(null);
  const [values, setValues] = useState<AreaForm>(EMPTY);
  const [toDelete, setToDelete] = useState<DeliveryArea | null>(null);

  const openForm = (area?: DeliveryArea) => {
    setValues(area ? { area_name: area.area_name, code: area.code ?? "", status: area.status, notes: area.notes ?? "" } : EMPTY);
    setForm({ area });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && (await onSave(form.area, values))) setForm(null);
  };

  const assigned = toDelete?.assigned_users ?? 0;
  const plural = assigned === 1 ? "" : "s";

  const columns: Column<DeliveryArea>[] = [
    {
      key: "area",
      label: "Area",
      mobile: "title",
      cell: (a) => (
        <div>
          <b className="ui-cell__title">
            {a.area_name} {a.code && <span className="ui-cell__meta">{a.code}</span>}
          </b>
          {a.notes && <div className="ui-cell__meta">{a.notes}</div>}
        </div>
      ),
    },
    { key: "status", label: "Status", mobile: "inline", cell: (a) => <Mark tone={a.status === "active" ? "leaf" : "mist"}>{a.status === "active" ? "Active" : "Inactive"}</Mark> },
    {
      key: "customers",
      label: "Customers",
      align: "right",
      cell: (a) =>
        a.assigned_users ? (
          <Link className="ui-link" to={`/users?area=${a.area_id}`}>
            {a.assigned_users}
          </Link>
        ) : (
          (a.assigned_users ?? "—")
        ),
    },
    { key: "orders", label: "Orders", align: "right", cell: (a) => (metricsAvailable ? (metricOf(a)?.orderCount ?? 0) : "—") },
    { key: "revenue", label: "Revenue", align: "right", mobile: "amount", cell: (a) => <strong>{formatMoney(metricsAvailable ? (metricOf(a)?.totalRevenue ?? 0) : null)}</strong> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (a) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${a.area_name}`} onClick={() => openForm(a)}>
            Edit
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Delete ${a.area_name}`} onClick={() => setToDelete(a)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Areas"
        subtitle="Where you deliver, and how each area is doing"
        actions={
          <Button variant="primary" onClick={() => openForm()}>
            <LuPlus aria-hidden="true" /> Add area
          </Button>
        }
      />

      <DataTable columns={columns} rows={areas} rowKey={(a) => String(a.area_id)} loading={!loaded && !error} error={form || toDelete ? null : error} emptyTitle="No delivery areas yet" />
      {areas.length > 0 && <p className="ui-hint">{metricsAvailable ? "Orders and revenue cover all time." : "Order figures are unavailable right now."}</p>}

      <Modal open={!!form} title={form?.area ? "Edit area" : "New area"} onClose={() => setForm(null)}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Area name">
            <input autoFocus value={values.area_name} onChange={(e) => setValues({ ...values, area_name: e.target.value })} required />
          </Field>
          <Field label="Code" optional hint="Short code, for example KDY">
            <input maxLength={20} value={values.code ?? ""} onChange={(e) => setValues({ ...values, code: e.target.value })} />
          </Field>
          <Field label="Status">
            <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as AreaForm["status"] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Schedule notes" optional>
            <textarea rows={3} value={values.notes ?? ""} onChange={(e) => setValues({ ...values, notes: e.target.value })} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setForm(null)}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save area
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete && assigned > 0} title={`${toDelete?.area_name} can't be deleted yet`} onClose={() => setToDelete(null)}>
        <p className="modal__body">
          {assigned} customer{plural} {assigned === 1 ? "is" : "are"} still assigned to this area. Move them to another area first, then delete it.
        </p>
        <div className="modal__actions">
          <Button onClick={() => setToDelete(null)}>Close</Button>
          <Button variant="primary" onClick={() => navigate(`/users?area=${toDelete?.area_id}`)}>
            View the {assigned} customer{plural}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete && assigned === 0}
        title="Delete area"
        message={`Delete "${toDelete?.area_name}"? This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await onDelete(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Delete the old stylesheet**

`git rm src/Pages/deliveryareas/deliveryareas.css`, then `grep -rn "deliveryareas.css\|da-" src` must print nothing.

- [ ] **Step 4: Verify**

`npx tsc -b` and `npx eslint src/Pages/deliveryareas src/hooks/useDeliveryAreas.ts` print nothing.

Browser check (all three stubs): screenshot `/delivery-areas` at 1440 and 390 and compare with `areas-desktop.png` (four ruled rows, status dots, numbers right-aligned, "Orders and revenue cover all time." under the table). Click Delete on Nugegoda: the dialog reads "Nugegoda can't be deleted yet", says "41 customers are still assigned", and its primary button "View the 41 customers" navigates to `/users?area=2`. Click Delete on Mount Lavinia: the plain "Delete area" confirmation shows. Click "Add area": every field has a visible label. Screenshot the blocked dialog and compare with `areas-delete-desktop.png`.

- [ ] **Step 5: Commit**

```bash
git add src/Pages/deliveryareas/DeliveryAreas.tsx src/hooks/useDeliveryAreas.ts
git commit -m "feat(areas): ruled area table with status marks, customer links and a blocked-delete dialog"
```

(`git rm` already staged the deleted stylesheet.)

---

### Task 6: Food Items

**Files:**
- Create: `src/Pages/fooditems/food.css`
- Rewrite: `src/Pages/fooditems/FoodItems.tsx`
- Modify: `src/hooks/useFoodItems.ts`

**Interfaces:**
- Consumes: `useFoodItems` (`rows, error, clearError, add, edit, setActive, remove, history, viewHistory, closeHistory`), kit `Alert, Badge?, Button, DataTable, Field, FilterBar, Mark, PageHeader, SearchField, Switch, Who, useToast`, `Modal`, `ConfirmDialog`, `formatMoney`, `formatDateTime`, types `FoodItem, FoodItemForm, MealType, PriceChange`.
- Produces: `useFoodItems()` also returns `loaded: boolean`.

Mockups: `food-desktop.png`, `food-mobile.png`, `food-add-desktop.png`. The status column becomes an "Available" `Switch` with an On/Off word; delete is a quiet × button.

- [ ] **Step 1: Add `loaded` to `useFoodItems`**

In `src/hooks/useFoodItems.ts` add `const [loaded, setLoaded] = useState(false); // false until the first list arrives`, change `load` to `useCallback(() => listFoodItems().then((r) => { setRows(r); setLoaded(true); }), [])`, and return `rows, loaded, error, clearError: ...`.

- [ ] **Step 2: Create `src/Pages/fooditems/food.css`**

```css
.food-export { margin-left: auto; }
.food-tags { display: block; }
```

- [ ] **Step 3: Replace `src/Pages/fooditems/FoodItems.tsx`**

```tsx
import { useState } from "react";
import { LuDownload, LuPlus, LuX } from "react-icons/lu";
import "./food.css";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { FoodItem, FoodItemForm, MealType, PriceChange } from "../../types/menu";
import { Alert, Button, DataTable, Field, FilterBar, Mark, PageHeader, SearchField, Switch, Who, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateTime } from "../../utils/formatDate";

type Dialog = { kind: "add" } | { kind: "edit" | "delete"; item: FoodItem } | null;
const EMPTY: FoodItemForm = { name: "", description: "", price: "", meal_type: "veg", image_url: "", category: "", dietary_tags: "" };
const TYPE_MARK = { veg: { tone: "leaf", label: "Veg" }, "non-veg": { tone: "brick", label: "Non-veg" }, other: { tone: "mist", label: "Other" } } as const;

const csvCell = (v: string | number | boolean | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const tagsOf = (s: string | null) => (s ?? "").split(",").map((t) => t.trim()).filter(Boolean);

export default function FoodItemsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, remove, history, viewHistory, closeHistory } = useFoodItems();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | MealType>("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState<number[]>([]); // items with an availability change in flight
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...d.item, price: String(d.item.price) } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "add" ? await add(form) : dialog?.kind === "edit" && (await edit(dialog.item.id, form))) close();
  };

  const confirmDelete = async () => {
    if (dialog?.kind === "delete") await remove(dialog.item.id);
    close();
  };

  // A second click while the change is in flight would flip it back, so ignore it
  const toggle = async (r: FoodItem, active: boolean) => {
    if (busy.includes(r.id)) return;
    setBusy((b) => [...b, r.id]);
    try {
      if (await setActive(r.id, active)) toast.show(active ? `${r.name} is available again` : `${r.name} is hidden from customers`);
    } finally {
      setBusy((b) => b.filter((id) => id !== r.id));
    }
  };

  const categories = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort();
  const shown = rows.filter(
    (r) => (!type || r.meal_type === type) && (!category || r.category === category) && r.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit";
  const set = (k: keyof FoodItemForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // Exports what the filters currently show, so staff can export "inactive vegan items" and the like.
  const exportCsv = () => {
    const head = ["Name", "Description", "Price (LKR)", "Type", "Category", "Dietary tags", "Active"];
    const lines = shown.map((r) => [r.name, r.description, Number(r.price), r.meal_type, r.category, r.dietary_tags, r.is_active ? "yes" : "no"].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "food-items.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<FoodItem>[] = [
    { key: "item", label: "Item", mobile: "title", cell: (r) => <Who name={r.name} meta={r.description} square tone="auto" size="md" src={r.image_url} /> },
    { key: "price", label: "Price", align: "right", mobile: "amount", cell: (r) => <strong>{formatMoney(Number(r.price))}</strong> },
    { key: "type", label: "Type", mobile: "hide", cell: (r) => <Mark tone={TYPE_MARK[r.meal_type].tone}>{TYPE_MARK[r.meal_type].label}</Mark> },
    {
      key: "category",
      label: "Category",
      mobile: "hide",
      cell: (r) => (
        <div>
          {r.category ?? "—"}
          {tagsOf(r.dietary_tags).length > 0 && (
            <span className="food-tags">
              {tagsOf(r.dietary_tags).map((t) => (
                <span key={t} className="ui-tag">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "available",
      label: "Available",
      mobile: "inline",
      cell: (r) => <Switch label={`${r.name} available to customers`} checked={r.is_active} disabled={busy.includes(r.id)} showState onChange={(v) => toggle(r, v)} />,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (r) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${r.name}`} onClick={() => open({ kind: "edit", item: r })}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" aria-label={`Price history for ${r.name}`} onClick={() => viewHistory(r.id)}>
            Price history
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Delete ${r.name}`} onClick={() => open({ kind: "delete", item: r })}>
            <LuX aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns: Column<PriceChange>[] = [
    { key: "changed", label: "Changed", mobile: "title", nowrap: true, cell: (h) => formatDateTime(h.changed_at) },
    { key: "from", label: "From", align: "right", cell: (h) => (h.old_price === null ? "Starting price" : formatMoney(Number(h.old_price))) },
    { key: "to", label: "To", align: "right", cell: (h) => <strong>{formatMoney(Number(h.new_price))}</strong> },
  ];

  return (
    <div>
      <PageHeader
        title="Food Items"
        subtitle="The catalogue that sessions pick from"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add item
          </Button>
        }
      />

      <FilterBar label="Food item filters">
        <SearchField label="Search food items" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as "" | MealType)}>
          <option value="">All types</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-veg</option>
          <option value="other">Other</option>
        </select>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button className="food-export" onClick={exportCsv} disabled={!shown.length}>
          <LuDownload aria-hidden="true" /> Export CSV
        </Button>
      </FilterBar>

      <DataTable columns={columns} rows={shown} rowKey={(r) => String(r.id)} loading={!loaded && !error} error={formOpen ? null : error} emptyTitle="No food items" />

      <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.item.name}` : "Add food item"} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Name">
            <input value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Description" optional>
            <textarea rows={2} value={form.description ?? ""} onChange={set("description")} />
          </Field>
          <div className="ui-form-row">
            <Field label="Price (LKR)">
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={set("price")} required />
            </Field>
            <Field label="Type">
              <select value={form.meal_type} onChange={set("meal_type")}>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-veg</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Category" optional>
            <input list="food-categories" maxLength={50} placeholder="Rice, Snacks…" value={form.category ?? ""} onChange={set("category")} />
          </Field>
          <datalist id="food-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Field label="Dietary tags" optional hint="Separate with commas">
            <input maxLength={255} placeholder="vegan, gluten-free" value={form.dietary_tags ?? ""} onChange={set("dietary_tags")} />
          </Field>
          <Field label="Image URL" optional>
            <input type="url" value={form.image_url ?? ""} onChange={set("image_url")} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save item
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={history !== null} title="Price history" onClose={closeHistory}>
        <DataTable columns={historyColumns} rows={history ?? []} rowKey={(h) => String(h.id)} emptyTitle="No price history" />
        <div className="modal__actions">
          <Button onClick={closeHistory}>Close</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title="Delete food item"
        message={dialog?.kind === "delete" ? `Delete ${dialog.item.name}? It is also removed from any session that uses it. To just hide it from customers, switch it off instead.` : ""}
        confirmLabel="Delete"
        onCancel={close}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

`npx tsc -b` and `npx eslint src/Pages/fooditems src/hooks/useFoodItems.ts` print nothing.

Browser check (all three stubs), **against the real fixture rows** (this is the "never compared with real rows" leftover): screenshot `/food-items` at 1440 and 390 and compare with `food-desktop.png` and `food-mobile.png`. Check: five rows with square tinted avatars, prices right-aligned, Veg/Non-veg dots, "vegan option" and "gluten-free" as tags, a Switch per row with On/Off, the Fish ambul thiyal row off, Edit / Price history / × aligned at the right edge. On the phone: the type and category cells are hidden, the switch sits under the name line. Confirm the search box is not squeezed or clipped inside the filter bar (it must be the same height and padding as in the mockup) at both widths. Click "Add item" and compare with `food-add-desktop.png`; click "Price history" on the first row and confirm two rows appear. Flip a switch and confirm a toast appears and the switch is disabled while the PUT is in flight (the stub answers `{}`, so the row will not change; that is expected).

- [ ] **Step 5: Commit**

```bash
git add src/Pages/fooditems/FoodItems.tsx src/Pages/fooditems/food.css src/hooks/useFoodItems.ts
git commit -m "feat(food): ruled item table with availability switches, tags and labelled form on the new identity"
```

---

### Task 7: Delivery Persons

**Files:**
- Rewrite: `src/Pages/deliverypersons/DeliveryPersons.tsx`
- Modify: `src/hooks/useDeliveryPersons.ts`

**Interfaces:**
- Consumes: `useDeliveryPersons` (`rows, error, clearError, add, edit, setActive, resetPassword`), `DriverForm` from `deliverypersons.service`, kit `Alert, Button, DataTable, Field, Mark, PageHeader, Who`, `Modal`, `ConfirmDialog`, `DeliveryPerson`.
- Produces: `useDeliveryPersons()` also returns `loaded: boolean`.

Mockup: `persons-desktop.png`. Disable is a quiet red button, Enable a secondary one.

- [ ] **Step 1: Add `loaded` to `useDeliveryPersons`**

In `src/hooks/useDeliveryPersons.ts` add `const [loaded, setLoaded] = useState(false);`, change `load` to `useCallback(() => listDeliveryPersons().then((r) => { setRows(r); setLoaded(true); }), [])`, and return `rows, loaded, error, clearError: ...`.

- [ ] **Step 2: Replace `src/Pages/deliverypersons/DeliveryPersons.tsx`**

```tsx
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { useDeliveryPersons } from "../../hooks/useDeliveryPersons";
import type { DriverForm } from "./deliverypersons.service";
import type { DeliveryPerson } from "../../types/deliveryPersons";
import { Alert, Button, DataTable, Field, Mark, PageHeader, Who } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; person: DeliveryPerson } | null;
const EMPTY: DriverForm = { full_name: "", email: "", password: "", phone: "", nic: "", vehicle_type: "" };

export default function DeliveryPersonsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, resetPassword } = useDeliveryPersons();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...EMPTY, full_name: d.person.full_name, phone: d.person.phone ?? "", nic: d.person.nic ?? "", vehicle_type: d.person.vehicle_type ?? "" } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const ok =
      dialog.kind === "add" ? await add(form)
      : dialog.kind === "edit" ? await edit(dialog.person.id, { full_name: form.full_name, phone: form.phone, nic: form.nic, vehicle_type: form.vehicle_type })
      : dialog.kind === "reset" ? await resetPassword(dialog.person.id, form.password)
      : true;
    if (ok) close();
  };

  const toggle = async () => {
    if (dialog?.kind === "toggle") await setActive(dialog.person.id, dialog.person.status !== "active");
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit" || dialog?.kind === "reset";
  const target = dialog && dialog.kind !== "add" ? dialog.person : null;
  const title = dialog?.kind === "add" ? "Add delivery person" : dialog?.kind === "edit" ? `Edit ${target?.full_name}` : `Reset password for ${target?.full_name}`;
  const showProfile = dialog?.kind === "add" || dialog?.kind === "edit";
  const showPassword = dialog?.kind === "add" || dialog?.kind === "reset";
  const set = (k: keyof DriverForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const columns: Column<DeliveryPerson>[] = [
    { key: "driver", label: "Driver", mobile: "title", cell: (p) => <Who name={p.full_name} meta={p.email} /> },
    { key: "phone", label: "Phone", mobile: "hide", nowrap: true, cell: (p) => p.phone ?? "—" },
    { key: "nic", label: "NIC", mobile: "hide", nowrap: true, cell: (p) => p.nic ?? "—" },
    { key: "vehicle", label: "Vehicle", mobile: "hide", cell: (p) => p.vehicle_type ?? "—" },
    { key: "status", label: "Status", mobile: "inline", cell: (p) => <Mark tone={p.status === "active" ? "leaf" : "mist"}>{p.status === "active" ? "Active" : "Inactive"}</Mark> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (p) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${p.full_name}`} onClick={() => open({ kind: "edit", person: p })}>
            Edit
          </Button>
          <Button size="sm" aria-label={`Reset password for ${p.full_name}`} onClick={() => open({ kind: "reset", person: p })}>
            Reset password
          </Button>
          <Button size="sm" variant={p.status === "active" ? "danger-ghost" : "secondary"} aria-label={`${p.status === "active" ? "Disable" : "Enable"} ${p.full_name}`} onClick={() => open({ kind: "toggle", person: p })}>
            {p.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Persons"
        subtitle="Drivers who take orders to customers"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add delivery person
          </Button>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} loading={!loaded && !error} error={dialog ? null : error} emptyTitle="No delivery persons yet" />

      <Modal open={formOpen} title={title} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          {showProfile && (
            <Field label="Full name">
              <input value={form.full_name} onChange={set("full_name")} required />
            </Field>
          )}
          {dialog?.kind === "add" && (
            <Field label="Email">
              <input type="email" value={form.email} onChange={set("email")} required />
            </Field>
          )}
          {showProfile && (
            <Field label="Phone" optional>
              <input type="tel" value={form.phone} onChange={set("phone")} />
            </Field>
          )}
          {showProfile && (
            <Field label="NIC" optional>
              <input maxLength={20} value={form.nic} onChange={set("nic")} />
            </Field>
          )}
          {showProfile && (
            <Field label="Vehicle type" optional>
              <input maxLength={50} value={form.vehicle_type} onChange={set("vehicle_type")} />
            </Field>
          )}
          {showPassword && (
            <Field label={dialog?.kind === "add" ? "Initial password" : "New password"} hint="At least 8 characters">
              <input type="password" minLength={8} value={form.password} onChange={set("password")} required />
            </Field>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "toggle"}
        title={target?.status === "active" ? "Disable driver" : "Enable driver"}
        message={target?.status === "active" ? `${target.full_name} will be signed out and unable to log in.` : `${target?.full_name} will be able to log in again.`}
        confirmLabel={target?.status === "active" ? "Disable" : "Enable"}
        tone={target?.status === "active" ? "danger" : "primary"}
        onCancel={close}
        onConfirm={toggle}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

`npx tsc -b` and `npx eslint src/Pages/deliverypersons src/hooks/useDeliveryPersons.ts` print nothing.

Browser check (all three stubs), **against the real fixture rows**: screenshot `/delivery-persons` at 1440 and 390 and compare with `persons-desktop.png` (initials avatars, email under the name, phone / NIC / vehicle columns, status dots, actions at the right edge; Mahesh Wijesekara shows "—" for NIC and an Enable button). On the phone only the name, status and actions show. Open "Add delivery person", "Edit" and "Reset password" for one row: every control has a visible label, the password hint reads "At least 8 characters".

- [ ] **Step 4: Commit**

```bash
git add src/Pages/deliverypersons/DeliveryPersons.tsx src/hooks/useDeliveryPersons.ts
git commit -m "feat(drivers): ruled driver table with status marks and labelled dialogs on the new identity"
```

---

### Task 8: Admins

**Files:**
- Rewrite: `src/Pages/admins/Admins.tsx`
- Modify: `src/hooks/useAdmins.ts`

**Interfaces:**
- Consumes: `useAdmins` (`rows, error, clearError, add, edit, setActive, resetPassword`), kit `Alert, Badge, Button, DataTable, Field, Mark, PageHeader, Who`, `Modal`, `ConfirmDialog`, `formatDate`, types `Admin, AdminRole`.
- Produces: `useAdmins()` also returns `loaded: boolean`. `admins.css` is left in place (Sessions, still on it, is migrated in Task 9, which deletes it).

Mockups: `admins-desktop.png`, `admins-add-desktop.png`. A super admin is a dark "Super admin" badge, an admin a neutral "Admin" badge; an inactive admin is labelled "Suspended".

- [ ] **Step 1: Add `loaded` to `useAdmins`**

In `src/hooks/useAdmins.ts` add `const [loaded, setLoaded] = useState(false); // false until the first list arrives` after the `error` state, change `load` to `useCallback(() => listAdmins().then((r) => { setRows(r); setLoaded(true); }), [])`, and return `rows, loaded, error, clearError: ...`.

- [ ] **Step 2: Replace `src/Pages/admins/Admins.tsx`**

```tsx
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { useAdmins } from "../../hooks/useAdmins";
import type { Admin, AdminRole } from "../../types/admins";
import { Alert, Badge, Button, DataTable, Field, Mark, PageHeader, Who } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/formatDate";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; admin: Admin } | null;
const EMPTY = { full_name: "", email: "", password: "", role: "admin" as AdminRole };

export default function AdminsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, resetPassword } = useAdmins();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...EMPTY, full_name: d.admin.full_name, role: d.admin.role } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const ok =
      dialog.kind === "add" ? await add(form)
      : dialog.kind === "edit" ? await edit(dialog.admin.id, { full_name: form.full_name, role: form.role })
      : dialog.kind === "reset" ? await resetPassword(dialog.admin.id, form.password)
      : true;
    if (ok) close();
  };

  const toggle = async () => {
    if (dialog?.kind === "toggle") await setActive(dialog.admin.id, dialog.admin.status !== "active");
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit" || dialog?.kind === "reset";
  const target = dialog && dialog.kind !== "add" ? dialog.admin : null;
  const title = dialog?.kind === "add" ? "Add admin" : dialog?.kind === "edit" ? `Edit ${target?.full_name}` : `Reset password for ${target?.full_name}`;
  const showName = dialog?.kind === "add" || dialog?.kind === "edit";
  const showPassword = dialog?.kind === "add" || dialog?.kind === "reset";

  const columns: Column<Admin>[] = [
    { key: "admin", label: "Admin", mobile: "title", cell: (a) => <Who name={a.full_name} meta={a.email} /> },
    { key: "role", label: "Role", mobile: "inline", cell: (a) => (a.role === "super_admin" ? <Badge tone="dark">Super admin</Badge> : <Badge>Admin</Badge>) },
    { key: "status", label: "Status", mobile: "inline", cell: (a) => <Mark tone={a.status === "active" ? "leaf" : "mist"}>{a.status === "active" ? "Active" : "Suspended"}</Mark> },
    { key: "added", label: "Added", mobile: "hide", nowrap: true, cell: (a) => <span className="ui-cell__meta">{formatDate(a.created_at)}</span> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (a) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${a.full_name}`} onClick={() => open({ kind: "edit", admin: a })}>
            Edit
          </Button>
          <Button size="sm" aria-label={`Reset password for ${a.full_name}`} onClick={() => open({ kind: "reset", admin: a })}>
            Reset password
          </Button>
          <Button size="sm" variant={a.status === "active" ? "danger-ghost" : "secondary"} aria-label={`${a.status === "active" ? "Suspend" : "Enable"} ${a.full_name}`} onClick={() => open({ kind: "toggle", admin: a })}>
            {a.status === "active" ? "Suspend" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admins"
        subtitle="Who can sign in to this panel"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add admin
          </Button>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={!loaded && !error} error={dialog ? null : error} emptyTitle="No admins yet" />

      <Modal open={formOpen} title={title} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          {showName && (
            <Field label="Full name">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </Field>
          )}
          {dialog?.kind === "add" && (
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
          )}
          {showPassword && (
            <Field label={dialog?.kind === "add" ? "Initial password" : "New password"} hint="At least 8 characters">
              <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
          )}
          {showName && (
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </Field>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "toggle"}
        title={target?.status === "active" ? "Suspend admin" : "Enable admin"}
        message={target?.status === "active" ? `${target.full_name} will be signed out and unable to log in.` : `${target?.full_name} will be able to log in again.`}
        confirmLabel={target?.status === "active" ? "Suspend" : "Enable"}
        tone={target?.status === "active" ? "danger" : "primary"}
        onCancel={close}
        onConfirm={toggle}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

`npx tsc -b` and `npx eslint src/Pages/admins src/hooks/useAdmins.ts` print nothing.

Browser check (all three stubs): screenshot `/admins` at 1440 and 390 and compare with `admins-desktop.png` (a dark "Super admin" badge on Buddhi Gayan, neutral "Admin" badges, Lakmal "Suspended" with an Enable button, dates in the app's day-first style). Open "Add admin" and compare with `admins-add-desktop.png`. Confirm "Suspend" opens a danger confirmation and "Enable" a primary one.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/admins/Admins.tsx src/hooks/useAdmins.ts
git commit -m "feat(admins): ruled admin table with role badges and status marks on the new identity"
```

---

### Task 9: Sessions

**Files:**
- Rewrite: `src/Pages/sessions/Sessions.tsx`, `src/Pages/sessions/sessions.css`, `src/Pages/sessions/SessionDeliveryDialog.tsx`
- Modify: `src/components/common/Modal.tsx`, `src/components/common/modal.css`
- Delete: `src/Pages/admins/admins.css`

**Interfaces:**
- Consumes: `useSessions` (`date, setDate, rows, error, orders, viewOrders, closeOrders, clearError, add, edit, remove, attach, setQuantity, detach`), `useFoodItems` (`rows`), `useSessionDelivery`, kit `Alert, Badge, Button, Card, DataTable, Field, OrderTrack, PageHeader, PaymentMark, Who`, `Modal`, `ConfirmDialog`, `addDays` and `formatDateTime` from `src/utils/formatDate.ts`, `formatMoney`, types `MealSession, MealTime, SessionForm, SessionItem`, `Order`.
- Produces: `Modal` gains `wide?: boolean` (a 920px dialog for tables). No other new exports. After this task nothing imports `admins.css`.

Mockups: `sessions-desktop.png`, `sessions-mobile.png`. The page always shows three panels (breakfast, lunch, dinner); a meal without a session shows "No session for this date yet" and an "Add <meal> session" button.

- [ ] **Step 1: Add `wide` to `Modal`**

In `src/components/common/Modal.tsx` add `wide?: boolean;` to `ModalProps`, add `wide = false` to the destructured props, and change `className="modal"` to ``className={`modal${wide ? " modal--wide" : ""}`}``. In `src/components/common/modal.css` add, directly after the `.modal::backdrop { ... }` line (before the phone media block, so the phone rule still wins):

```css
.modal--wide { width: min(920px, 94vw); }
```

- [ ] **Step 2: Replace `src/Pages/sessions/sessions.css`**

```css
.sess-date { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
.sess-date input {
  box-sizing: border-box;
  min-height: 38px;
  padding: 0 var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.sess-date input:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: var(--focus-ring); }
.sess-title { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.sess-time { color: var(--gray-500); font-size: var(--text-base); font-weight: 400; }
.sess-notes { margin: 0; padding: var(--space-3) var(--space-4); color: var(--gray-700); white-space: pre-wrap; }
.sess-add { padding: var(--space-3) var(--space-4); }
.sess-empty { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.sess-empty p { margin: 0; color: var(--gray-500); }
.sess-picker { display: grid; gap: var(--space-3); max-height: 320px; margin-bottom: var(--space-4); overflow-y: auto; }
.sess-pick { display: flex; align-items: center; gap: var(--space-3); min-height: 38px; }
.sess-pick__name { flex: 1; min-width: 0; }
.sess-pick input[type="number"] {
  box-sizing: border-box;
  width: 110px;
  min-height: 36px;
  padding: 0 var(--space-2);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font: inherit;
}
@media (max-width: 640px) {
  .sess-date input { flex: 1; min-width: 0; min-height: 44px; font-size: 16px; }
}
```

- [ ] **Step 3: Replace `src/Pages/sessions/Sessions.tsx`**

```tsx
import { useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from "react-icons/lu";
import "./sessions.css";
import { useSessions } from "../../hooks/useSessions";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { MealSession, MealTime, SessionForm, SessionItem } from "../../types/menu";
import type { Order } from "../../types/orders";
import { Alert, Badge, Button, Card, DataTable, Field, OrderTrack, PageHeader, PaymentMark, Who } from "../../components/ui";
import type { BadgeTone, Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import { addDays, formatDateTime } from "../../utils/formatDate";
import SessionDeliveryDialog from "./SessionDeliveryDialog";

type Dialog =
  | { kind: "add"; meal?: MealTime }
  | { kind: "edit" | "delete" | "items" | "delivery"; session: MealSession }
  | { kind: "qty"; item: SessionItem }
  | null;
const MEALS: MealTime[] = ["breakfast", "lunch", "dinner"];
// Suggested windows; the admin can change them.
const DEFAULT_TIMES: Record<MealTime, [string, string]> = { breakfast: ["06:00", "09:00"], lunch: ["11:00", "14:00"], dinner: ["18:00", "21:00"] };
const hhmm = (t: string) => t.slice(0, 5);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** upcoming / open / closed, from the Sri Lanka window (UTC+5:30, no DST). A window that ends at or before its start runs past midnight. */
function stateOf(s: MealSession, now = Date.now()): "upcoming" | "open" | "closed" {
  const start = new Date(`${s.date}T${s.start_time}+05:30`).getTime();
  let end = new Date(`${s.date}T${s.end_time}+05:30`).getTime();
  if (end <= start) end += 24 * 3600 * 1000;
  return now < start ? "upcoming" : now < end ? "open" : "closed";
}
const STATE: Record<ReturnType<typeof stateOf>, { tone: BadgeTone; label: string }> = {
  upcoming: { tone: "outline", label: "Upcoming" },
  open: { tone: "success", label: "Open now" },
  closed: { tone: "neutral", label: "Closed" },
};

export default function SessionsPage() {
  const { date, setDate, rows, error, orders, viewOrders, closeOrders, clearError, add, edit, remove, attach, setQuantity, detach } = useSessions();
  const { rows: catalog } = useFoodItems();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<SessionForm>({ date, meal_time: "lunch", start_time: "11:00", end_time: "14:00", notes: "" });
  const [picked, setPicked] = useState<Record<number, string>>({}); // food_item_id -> quantity text ("" = unlimited)
  const [qtyText, setQtyText] = useState(""); // "" = unlimited
  const [ordersFor, setOrdersFor] = useState<MealSession | null>(null);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setPicked({});
    if (d.kind === "edit") setForm({ date: d.session.date, meal_time: d.session.meal_time, start_time: hhmm(d.session.start_time), end_time: hhmm(d.session.end_time), notes: d.session.notes ?? "" });
    if (d.kind === "add") {
      const free = d.meal ?? MEALS.find((m) => !rows.some((r) => r.meal_time === m)) ?? "lunch";
      setForm({ date, meal_time: free, start_time: DEFAULT_TIMES[free][0], end_time: DEFAULT_TIMES[free][1], notes: "" });
    }
    if (d.kind === "qty") setQtyText(d.item.available_quantity == null ? "" : String(d.item.available_quantity));
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "add" ? await add(form) : dialog?.kind === "edit" && (await edit(dialog.session.id, form))) close();
  };

  const submitQty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "qty" && (await setQuantity(dialog.item.id, qtyText === "" ? null : Number(qtyText)))) close();
  };

  const attachPicked = async () => {
    if (dialog?.kind !== "items") return;
    const items = Object.entries(picked).map(([id, q]) => ({ food_item_id: Number(id), available_quantity: q ? Number(q) : null }));
    if (!items.length || (await attach(dialog.session.id, items))) close();
  };

  const confirmDelete = async () => {
    if (dialog?.kind === "delete") await remove(dialog.session.id);
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit";
  const taken = dialog?.kind === "items" ? new Set(dialog.session.sessionItems.map((i) => i.food_item_id)) : new Set<number>();
  const pickable = catalog.filter((f) => f.is_active && !taken.has(f.id));
  const inForm = formOpen || dialog?.kind === "items" || dialog?.kind === "qty";

  const itemColumns = (s: MealSession): Column<SessionItem>[] => [
    {
      key: "item",
      label: "Item",
      mobile: "title",
      cell: (i) => <Who name={i.foodItem.name} meta={i.foodItem.is_active ? undefined : <Badge>Inactive</Badge>} square tone="auto" size="md" src={i.foodItem.image_url} />,
    },
    { key: "price", label: "Price", align: "right", mobile: "amount", cell: (i) => <strong>{formatMoney(Number(i.foodItem.price))}</strong> },
    { key: "available", label: "Available", mobile: "inline", cell: (i) => (i.available_quantity == null ? "Unlimited" : `${i.available_quantity} left`) },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (i) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Change quantity of ${i.foodItem.name} for ${s.meal_time}`} onClick={() => open({ kind: "qty", item: i })}>
            Change quantity
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Remove ${i.foodItem.name} from ${s.meal_time}`} onClick={() => detach(i.id)}>
            <LuX aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const orderColumns: Column<Order>[] = [
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (o) => (
        <div>
          <b className="ui-cell__title">{o.customer_name ?? "—"}</b>
          <div className="ui-cell__meta">{o.id} · {formatDateTime(o.created_at)}</div>
        </div>
      ),
    },
    { key: "items", label: "Items", cell: (o) => o.order_items.map((i) => `${i.quantity}x ${i.food_name}`).join(", ") },
    { key: "total", label: "Total", align: "right", mobile: "amount", cell: (o) => <strong>{formatMoney(Number(o.total_price))}</strong> },
    { key: "progress", label: "Progress", mobile: "inline", cell: (o) => <OrderTrack status={o.status} /> },
    { key: "payment", label: "Payment", mobile: "inline", cell: (o) => <PaymentMark status={o.payment_status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="What customers can order, and when"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> New session
          </Button>
        }
      />

      <div className="sess-date">
        <Button aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
          <LuChevronLeft aria-hidden="true" />
        </Button>
        <input type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Button aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
          <LuChevronRight aria-hidden="true" />
        </Button>
      </div>

      {!inForm && error && <Alert>{error}</Alert>}

      {MEALS.map((meal) => {
        const s = rows.find((r) => r.meal_time === meal);
        if (!s) {
          return (
            <Card key={meal} title={cap(meal)}>
              <div className="sess-empty">
                <p>No session for this date yet</p>
                <Button onClick={() => open({ kind: "add", meal })}>Add {meal} session</Button>
              </div>
            </Card>
          );
        }
        const state = STATE[stateOf(s)];
        return (
          <Card
            key={s.id}
            flush
            title={
              <span className="sess-title">
                {cap(s.meal_time)}
                <span className="sess-time">
                  {hhmm(s.start_time)} to {hhmm(s.end_time)}
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
              </span>
            }
            actions={
              <div className="ui-actions">
                <Button
                  size="sm"
                  onClick={() => {
                    setOrdersFor(s);
                    viewOrders(s);
                  }}
                >
                  View orders
                </Button>
                <Button size="sm" onClick={() => open({ kind: "delivery", session: s })}>
                  Assign deliveries
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Edit ${s.meal_time}`} onClick={() => open({ kind: "edit", session: s })}>
                  Edit
                </Button>
                <Button size="sm" variant="danger-ghost" aria-label={`Delete ${s.meal_time}`} onClick={() => open({ kind: "delete", session: s })}>
                  Delete
                </Button>
              </div>
            }
          >
            {s.notes && <p className="sess-notes">Note for drivers: {s.notes}</p>}
            <DataTable columns={itemColumns(s)} rows={s.sessionItems} rowKey={(i) => String(i.id)} emptyTitle="No items yet" />
            <div className="sess-add">
              <Button size="sm" onClick={() => open({ kind: "items", session: s })}>
                <LuPlus aria-hidden="true" /> Add items
              </Button>
            </div>
          </Card>
        );
      })}

      <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.session.meal_time}` : "New session"} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Meal">
            <select value={form.meal_time} onChange={(e) => setForm({ ...form, meal_time: e.target.value as MealTime })}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </Field>
          <div className="ui-form-row">
            <Field label="Opens">
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </Field>
            <Field label="Closes">
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            </Field>
          </div>
          <Field label="Notes for the team and drivers" optional>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save session
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "qty"} title="Change quantity" onClose={close}>
        <form className="modal__form" onSubmit={submitQty}>
          {dialog?.kind === "qty" && <p className="modal__body">{dialog.item.foodItem.name}</p>}
          <Field label="Available quantity" hint="Leave empty for unlimited">
            <input type="number" min="0" step="1" placeholder="Unlimited" value={qtyText} onChange={(e) => setQtyText(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save quantity
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "items"} title="Add items" onClose={close}>
        <div className="sess-picker">
          {pickable.map((f) => (
            <div key={f.id} className="sess-pick">
              <label className="sess-pick__name">
                <input
                  type="checkbox"
                  checked={f.id in picked}
                  onChange={(e) =>
                    setPicked((p) => {
                      const n = { ...p };
                      if (e.target.checked) n[f.id] = "";
                      else delete n[f.id];
                      return n;
                    })
                  }
                />{" "}
                {f.name} <span className="ui-cell__meta">{formatMoney(Number(f.price))}</span>
              </label>
              {f.id in picked && (
                <input type="number" min="1" placeholder="Unlimited" aria-label={`Quantity for ${f.name}`} value={picked[f.id]} onChange={(e) => setPicked({ ...picked, [f.id]: e.target.value })} />
              )}
            </div>
          ))}
          {!pickable.length && <p className="ui-hint">Every catalogue item is already in this session.</p>}
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="modal__actions">
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={attachPicked}>
            Add selected
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title="Delete session"
        message={dialog?.kind === "delete" ? `Delete the ${dialog.session.meal_time} session on ${dialog.session.date}? Its items are removed too.` : ""}
        confirmLabel="Delete"
        onCancel={close}
        onConfirm={confirmDelete}
      />

      <Modal open={orders !== null} title={ordersFor ? `${cap(ordersFor.meal_time)} orders` : "Orders"} onClose={closeOrders} wide>
        <DataTable columns={orderColumns} rows={orders ?? []} rowKey={(o) => o.id} emptyTitle="No orders for this session" />
        <div className="modal__actions">
          <Button onClick={closeOrders}>Close</Button>
        </div>
      </Modal>

      {dialog?.kind === "delivery" && <SessionDeliveryDialog session={dialog.session} onClose={close} />}
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/Pages/sessions/SessionDeliveryDialog.tsx`**

```tsx
import "./sessions.css";
import Modal from "../../components/common/Modal";
import { Alert, Button, Field, Spinner } from "../../components/ui";
import { useSessionDelivery } from "../../hooks/useSessionDelivery";
import type { MealSession } from "../../types/menu";

interface Props {
  session: MealSession;
  onClose: () => void;
}

// Mounted only while open, so the data is fetched fresh each time the dialog is opened.
export default function SessionDeliveryDialog({ session, onClose }: Props) {
  const { areas, drivers, choice, loading, error, save, assign } = useSessionDelivery(session.id);
  const assignedCount = Object.values(choice).filter(Boolean).length;

  return (
    <Modal open title={`Delivery: ${session.meal_time} on ${session.date}`} onClose={onClose}>
      <p className="modal__body">Pick who delivers to each area in this session. Drivers can also take unassigned areas from their app.</p>
      {loading ? (
        <Spinner label="Loading" />
      ) : (
        <div className="sess-picker">
          {areas.map((a) => (
            <Field key={a.area_id} label={a.area_name}>
              <select value={choice[Number(a.area_id)] ?? ""} onChange={(e) => assign(Number(a.area_id), e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          {!areas.length && <p className="ui-hint">No delivery areas yet.</p>}
          {!drivers.length && <p className="ui-hint">No active delivery persons. Add one on the Delivery Persons page.</p>}
        </div>
      )}
      {error && <Alert>{error}</Alert>}
      <div className="modal__actions">
        <span className="ui-hint">
          {assignedCount} of {areas.length} areas assigned
        </span>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={loading} onClick={async () => (await save()) && onClose()}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
```

Check `Spinner`'s props in `src/components/ui/Spinner.tsx` before relying on `label` (Dashboard uses `<Spinner label="Loading" />`, so it exists). The footer's `ui-hint` has a bottom margin; the `modal__actions` row aligns items to the end, so also add `style` nothing: if the hint text crowds the buttons on a phone, the phone rule already stacks the actions.

- [ ] **Step 5: Delete `admins.css`**

Confirm nothing else imports it: `grep -rn "admins.css" src` must print only the import lines you have since removed (it must print nothing now). Then `git rm src/Pages/admins/admins.css`. Also `grep -rn "admins-page\|admins-card\|admins-table\|modal__btn\|cell-muted\|cell-strong\|pill " src --include=*.tsx` must print nothing from the migrated pages; `modal__btn` may still appear in `src/components/common/modal.css` itself (Task 14 removes it).

- [ ] **Step 6: Verify**

`npx tsc -b` and `npx eslint src/Pages/sessions src/components/common` print nothing.

Browser check (all three stubs): screenshot `/sessions` at 1440 and 390 and compare with `sessions-desktop.png` and `sessions-mobile.png`. Check: three panels (an empty Breakfast with "Add breakfast session", Lunch with an "Open now" badge, Dinner), the notes line "Note for drivers: ...", items with square avatars, prices right-aligned, "Unlimited" / "60 left", Change quantity and ×; "Add items" under each table; the prev/next day buttons and the date input are one row at 390px. Click "Change quantity" on the second lunch item: the dialog opens with 60 prefilled; clear it and the hint says "Leave empty for unlimited". Click "View orders" on Lunch: a wide dialog lists orders from the stub with an order track and payment mark. Click "Assign deliveries": each area is a labelled select, and "1 of 4 areas assigned" shows (Colombo 03 is preassigned by the fixture). Click "New session" and "Add items" and confirm every control has a visible label or aria-label.

- [ ] **Step 7: Commit**

```bash
git add src/Pages/sessions/Sessions.tsx src/Pages/sessions/sessions.css src/Pages/sessions/SessionDeliveryDialog.tsx src/components/common/Modal.tsx src/components/common/modal.css
git commit -m "feat(sessions): meal panels with item tables, quantity dialog and wide orders dialog on the new identity; retire admins.css"
```

(`git rm` already staged the deleted stylesheet.)

---

### Task 10: Reports

**Files:**
- Rewrite: `src/Pages/reports/Reports.tsx`

**Interfaces:**
- Consumes: `useReports` (`type, setType, report, error, loading, refresh, range, ...filters`), `RangeFilters`, `downloadCsv`, `formatMoney`, kit `Alert, Button, DataTable, PageHeader, Tabs`, types `AreaRow, ItemRow, ReportType, SalesDayRow`.
- Produces: the page; no new exports. `dashboard.css` is no longer imported here.

Mockup: `reports-desktop.png`. The three reports are underline `Tabs`; the totals row is a heavy rule above a bold "Total" row (the `DataTable` footer slot from Task 2); "Download CSV" sits in the page header.

- [ ] **Step 1: Replace `src/Pages/reports/Reports.tsx`**

Replace the whole file with:

```tsx
import { LuDownload } from "react-icons/lu";
import RangeFilters from "../../components/common/RangeFilters";
import { Alert, Button, DataTable, PageHeader, Tabs } from "../../components/ui";
import type { Column } from "../../components/ui";
import { useReports } from "../../hooks/useReports";
import { formatMoney } from "../../utils/formatMoney";
import { downloadCsv } from "./reports.service";
import type { AreaRow, ItemRow, ReportType, SalesDayRow } from "../../types/reports";

const TABS: { value: ReportType; label: string }[] = [
  { value: "sales", label: "Sales by day" },
  { value: "items", label: "Items" },
  { value: "areas", label: "Areas" },
];

const avg = (revenue: number, orders: number) => (orders > 0 ? Math.round(revenue / orders) : 0);
const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

interface Table {
  header: string[];
  rows: (string | number)[][]; // raw numbers: the CSV gets these as-is
  total?: (string | number)[];
  money: number[]; // column indexes shown as LKR on screen
}

/** One report's rows as a table description; the page renders it and the CSV export reuses it. */
function toTable(type: ReportType, data: unknown[]): Table {
  if (type === "sales") {
    const rows = (data as SalesDayRow[]).map((r) => [r.date, r.orderCount, r.totalRevenue, avg(r.totalRevenue, r.orderCount)]);
    const orders = rows.reduce((n, r) => n + (r[1] as number), 0);
    const revenue = rows.reduce((n, r) => n + (r[2] as number), 0);
    return { header: ["Date", "Orders", "Revenue", "Avg order"], rows, total: ["Total", orders, revenue, avg(revenue, orders)], money: [2, 3] };
  }
  if (type === "items") {
    const rows = (data as ItemRow[]).map((r) => [r.food_name, r.total_quantity, r.total_revenue]);
    return { header: ["Item", "Sold", "Revenue"], rows, total: ["Total", rows.reduce((n, r) => n + (r[1] as number), 0), rows.reduce((n, r) => n + (r[2] as number), 0)], money: [2] };
  }
  const list = data as AreaRow[];
  const rows = list.map((r) => [r.area_name, r.orderCount, r.totalRevenue, pct(r.completedCount, r.orderCount)]);
  const orders = list.reduce((n, r) => n + r.orderCount, 0);
  return {
    header: ["Area", "Orders", "Revenue", "Completed %"],
    rows,
    total: ["Total", orders, list.reduce((n, r) => n + r.totalRevenue, 0), pct(list.reduce((n, r) => n + r.completedCount, 0), orders)],
    money: [2],
  };
}

export default function Reports() {
  const r = useReports();
  const table = r.report ? toTable(r.type, r.report.data) : null;
  const show = (t: Table, row: (string | number)[], i: number) =>
    t.money.includes(i) ? formatMoney(row[i] as number) : r.type === "areas" && i === 3 ? `${row[i]}%` : row[i];

  const columns: Column<(string | number)[]>[] = table
    ? table.header.map((h, i): Column<(string | number)[]> => ({
        key: h,
        label: h,
        align: i > 0 ? "right" : undefined,
        mobile: i === 0 ? "title" : undefined,
        cell: (row) => show(table, row, i),
        footer: table.total ? show(table, table.total, i) : undefined,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Revenue is the total value of orders in the range, whatever their payment status."
        actions={
          <Button disabled={!table || table.rows.length === 0} onClick={() => table && downloadCsv(`${r.type}-${r.range.from}_${r.range.to}.csv`, table.header, table.rows)}>
            <LuDownload aria-hidden="true" /> Download CSV
          </Button>
        }
      />

      <RangeFilters f={r} />

      <Tabs label="Report" value={r.type} tabs={TABS} onChange={r.setType}>
        {r.error && table && (
          <Alert tone="warning">
            Showing the last loaded data (refresh failed: {r.error}){" "}
            <Button size="sm" onClick={r.refresh}>
              Retry
            </Button>
          </Alert>
        )}
        <div className={r.loading ? "ui-dim" : undefined}>
          <DataTable columns={columns} rows={table?.rows ?? []} rowKey={(row) => String(row[0])} loading={!table && !r.error} error={!table && r.error ? `Couldn't load the report: ${r.error}` : null} emptyTitle="No orders in this range" />
        </div>
        {!table && r.error && <Button onClick={r.refresh}>Retry</Button>}
      </Tabs>
    </div>
  );
}
```

`toTable` is the current file's function unchanged (it sits at lines 486-506 today); `show` is unchanged too. `useReports`' `range` is the object already used for the CSV file name.

Note the empty state: `DataTable` shows "No orders in this range" only when `rows` is empty, there is no error and `loading` is false. While a report for the new filters loads, `table` is `null` for a changed tab (the hook returns `null` rather than another tab's data), so the spinner shows.

- [ ] **Step 2: Verify**

`npx tsc -b` and `npx eslint src/Pages/reports` print nothing; `grep -n "dashboard.css" src/Pages/reports/Reports.tsx` prints nothing.

Browser check (all three stubs): screenshot `/reports` at 1440 and 390 and compare with `reports-desktop.png`: underline tabs with a leaf underline on the selected one, the range control and selects above, ruled rows with right-aligned numbers, and a heavy rule above a bold "Total" row. Press ArrowRight on the focused "Sales by day" tab and confirm it switches to "Items" (columns Item, Sold, Revenue) and ArrowRight again to "Areas" (the Completed % column shows `%`). At 390px the footer row must show "Total" and labelled figures with a heavy rule above it and no per-cell borders. Confirm "Download CSV" is enabled when rows exist.

- [ ] **Step 3: Commit**

```bash
git add src/Pages/reports/Reports.tsx
git commit -m "feat(reports): underline tabs, ruled report tables with a total row on the new identity"
```

---

### Task 11: Settings

**Files:**
- Create: `src/Pages/settings/settings.css`
- Rewrite: `src/Pages/settings/Settings.tsx`

**Interfaces:**
- Consumes: `useSettings` (`settings, error, notice, saving, save`), kit `Alert, Button, Card, Field, PageHeader, Spinner`.
- Produces: the page; no new exports. `dashboard.css` is no longer imported here.

Mockups: `settings-desktop.png`, `settings-mobile.png`. One panel; the left column explains the rule, the right column holds the labelled number field, a hint, a warning alert, and "Save changes" with "Currently N".

- [ ] **Step 1: Create `src/Pages/settings/settings.css`**

```css
.set-page { max-width: 780px; }
.set-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: var(--space-8); }
.set-card__title { margin: 0 0 var(--space-2); font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.set-card__text { margin: 0; color: var(--gray-500); }
.set-card__form { display: grid; gap: var(--space-4); align-content: start; }
.set-card__form .ui-alert { margin-bottom: 0; }
.set-card__form .ui-field input { box-sizing: border-box; width: 120px; max-width: 100%; }
.set-card__save { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.set-card__current { color: var(--gray-500); font-size: var(--text-sm); }
@media (max-width: 900px) {
  .set-card { grid-template-columns: minmax(0, 1fr); gap: var(--space-4); }
}
```

- [ ] **Step 2: Replace `src/Pages/settings/Settings.tsx`**

```tsx
import { useState } from "react";
import "./settings.css";
import { useSettings } from "../../hooks/useSettings";
import { Alert, Button, Card, Field, PageHeader, Spinner } from "../../components/ui";

export default function Settings() {
  const { settings, error, notice, saving, save } = useSettings();
  // Text the admin is typing; null until they touch the field, so it shows the saved value without an effect
  const [draft, setDraft] = useState<string | null>(null);

  if (!settings) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Rules that apply to every customer" />
        {error ? <Alert>Couldn&apos;t load settings: {error}</Alert> : <Spinner label="Loading" />}
      </div>
    );
  }

  const value = draft ?? String(settings.auto_block_unpaid_threshold);
  const n = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= settings.max_threshold;
  const dirty = valid && n !== settings.auto_block_unpaid_threshold;
  const rule = `Whole number from 0 to ${settings.max_threshold}. Use 0 to turn blocking off.`;

  return (
    <div className="set-page">
      <PageHeader title="Settings" subtitle="Rules that apply to every customer" />

      <Card>
        <form
          className="set-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (dirty && (await save(n))) setDraft(null);
          }}
        >
          <div>
            <h2 className="set-card__title">Block customers who don&apos;t pay</h2>
            <p className="set-card__text">
              When an order is marked unpaid and the customer has this many unpaid orders, their account is blocked. You can unlock them from Users.
            </p>
          </div>
          <div className="set-card__form">
            <Field label="Block at this many unpaid orders" hint={rule} error={valid ? undefined : rule}>
              <input type="number" min={0} max={settings.max_threshold} step={1} value={value} onChange={(e) => setDraft(e.target.value)} />
            </Field>
            <Alert tone="warning">Saving a stricter limit also blocks customers who are already over it.</Alert>
            {error && <Alert>{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}
            <div className="set-card__save">
              <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
              <span className="set-card__current">{settings.auto_block_unpaid_threshold === 0 ? "Auto-blocking is off" : `Currently ${settings.auto_block_unpaid_threshold}`}</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

`npx tsc -b` and `npx eslint src/Pages/settings` print nothing; `grep -n "dashboard.css" src/Pages/settings/Settings.tsx` prints nothing; no hex in `settings.css`.

Browser check (all three stubs): screenshot `/settings` at 1440 and 390 and compare with `settings-desktop.png` and `settings-mobile.png`. Then type `25` into the field (max is 20 in the stub): the hint turns into a red error and Save stays disabled; type `4`: Save enables. Confirm the field has a visible label "Block at this many unpaid orders".

- [ ] **Step 4: Commit**

```bash
git add src/Pages/settings/Settings.tsx src/Pages/settings/settings.css
git commit -m "feat(settings): panel with a labelled threshold field and warning on the new identity"
```

---

### Task 12: Audit Logs, and retire dashboard.css

**Files:**
- Rewrite: `src/Pages/auditlogs/AuditLogs.tsx`
- Modify: `src/Pages/Dashboard/Dashboard.tsx` (delete two lines)
- Delete: `src/Pages/Dashboard/dashboard.css`

**Interfaces:**
- Consumes: `useAuditLogs` (`filters, data, page, setPage, setFilter, error, loading`), kit `Alert, Button, DataTable, FilterBar, PageHeader`, `formatDateTime`, `AUDIT_GROUPS`, `AuditRow`.
- Produces: the page. After this task no file imports `dashboard.css`.

Mockup: `audit-desktop.png`. From/To labelled dates, an action select, the entry count at the right end, a ruled table, and Previous / Next.

- [ ] **Step 1: Replace `src/Pages/auditlogs/AuditLogs.tsx`**

```tsx
import { Alert, Button, DataTable, FilterBar, PageHeader } from "../../components/ui";
import type { Column } from "../../components/ui";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { formatDateTime } from "../../utils/formatDate";
import { AUDIT_GROUPS } from "../../types/auditLogs";
import type { AuditRow } from "../../types/auditLogs";

const words = (s: string) => s.replace(/[._]/g, " ");
// UUIDs are shortened; order ids (ORD-...) and numeric ids are shown whole because their first characters don't tell records apart
const shortId = (id: string) => (id.length === 36 ? id.slice(0, 8) : id);
const show = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : String(v));

export default function AuditLogs() {
  const a = useAuditLogs();
  const { filters, data } = a;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const columns: Column<AuditRow>[] = [
    { key: "when", label: "When", nowrap: true, mobile: "inline", cell: (r) => <span className="ui-cell__meta">{formatDateTime(r.created_at)}</span> },
    {
      key: "who",
      label: "Who",
      mobile: "title",
      cell: (r) => (
        <>
          <b>{r.actor_name ?? "Unknown"}</b>
          {r.actor_role && <span className="ui-cell__meta"> {words(r.actor_role)}</span>}
        </>
      ),
    },
    { key: "action", label: "Action", cell: (r) => words(r.action) },
    { key: "target", label: "Target", cell: (r) => `${words(r.target_type)}${r.target_id ? ` ${shortId(r.target_id)}` : ""}` },
    {
      key: "details",
      label: "Details",
      cell: (r) => <span className="ui-cell__meta">{r.details ? Object.entries(r.details).map(([k, v]) => `${words(k)}: ${show(v)}`).join(", ") : "—"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Who changed what. Customer approvals and blocks are in each customer profile." />

      <FilterBar label="Audit log filters">
        <label>
          From <input type="date" value={filters.from} max={filters.to} onChange={(e) => e.target.value && a.setFilter({ from: e.target.value })} />
        </label>
        <label>
          To <input type="date" value={filters.to} min={filters.from} onChange={(e) => e.target.value && a.setFilter({ to: e.target.value })} />
        </label>
        <select aria-label="Type" value={filters.group} onChange={(e) => a.setFilter({ group: e.target.value })}>
          <option value="">All actions</option>
          {AUDIT_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        {data && (
          <span className="ui-filterbar__note ui-filterbar__note--end">
            {data.total} {data.total === 1 ? "entry" : "entries"}
          </span>
        )}
      </FilterBar>

      {a.error && data && <Alert tone="warning">Showing the last loaded page (refresh failed: {a.error})</Alert>}

      <div className={a.loading ? "ui-dim" : undefined}>
        <DataTable columns={columns} rows={data?.rows ?? []} rowKey={(r) => String(r.id)} loading={!data && !a.error} error={!data && a.error ? `Couldn't load the audit log: ${a.error}` : null} emptyTitle="Nothing recorded in this range" />
      </div>

      {data && pages > 1 && (
        <div className="ui-pager">
          <span>
            Page {a.page} of {pages}
          </span>
          <Button size="sm" disabled={a.page <= 1} onClick={() => a.setPage(a.page - 1)}>
            Previous
          </Button>
          <Button size="sm" disabled={a.page >= pages} onClick={() => a.setPage(a.page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Retire `dashboard.css`**

1. In `src/Pages/Dashboard/Dashboard.tsx` delete the first two lines (the comment `// kept first only for CSS cascade order ...` and `import "./dashboard.css";`).
2. `grep -rn "dashboard.css" src` must now print nothing; then `git rm src/Pages/Dashboard/dashboard.css`.
3. Look for markup that still relied on a class that only that file defined. Run:

```bash
grep -rnE 'className="[^"]*\b(content|pageTitle|pageSub|statsGrid|statCard|card|card__header|card__title|tabs|tab|tab--active|sessionsGrid|sessionRow|pill|topList|topItem|tableWrap|table|rate|liveBar|sectionNote|filters|filters__range|dim)\b' src --include=*.tsx
```

It must print nothing (the kit's `ui-card`, `ui-tabs`, `ui-table`, `ui-dim` do not match because the pattern needs the whole word between a quote or space and the next boundary: if a `ui-` class shows up, it is a false positive; anything else is a real leftover to migrate). Also `grep -rn "\.sidebar\|\.searchWrap" src/components src/layouts --include=*.css` and confirm `dashboard.css` only ever contributed `@media` rules for `.sidebar` and `.searchWrap` that `sidebar.css` and `topbar.css` already override by source order.

- [ ] **Step 3: Verify**

`npx tsc -b` and `npx eslint src/Pages/auditlogs src/Pages/Dashboard` print nothing.

Browser check (all three stubs). Screenshot `/audit-logs` at 1440 and 390 and compare with `audit-desktop.png`: labelled From / To dates, the action select, "86 entries" at the right end, ruled rows with the actor in bold and the role beside it in muted text, "Page 1 of 4" with Previous (disabled) and Next. Because deleting `dashboard.css` could change shared chrome, take shell screenshots of `/dashboard` at 1440, 800 and 390 widths **at the end of Step 1, before Step 2**, and again after Step 2, and confirm the sidebar, the drawer behaviour below 1024px, and the top-bar search width are identical. Also screenshot `/dashboard`, `/orders` and `/users` at 1440 and confirm they are unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/auditlogs/AuditLogs.tsx src/Pages/Dashboard/Dashboard.tsx
git commit -m "feat(audit): filter bar and ruled log table on the new identity; retire dashboard.css"
```

---

### Task 13: Sign-in and password reset

**Files:**
- Create: `src/Pages/Auth/AuthShell.tsx`, `src/Pages/Auth/auth.css`
- Rewrite: `src/Pages/Auth/Login.tsx`, `src/Pages/Auth/PasswordReset.tsx`
- Delete: `src/styles/login.css`

**Interfaces:**
- Consumes: `useLogin(setIsLoggedIn)` (`email, password, error, loading, setEmail, setPassword, handleLogin`), `forgotPassword`, `resetPassword` from `auth.service`, kit `Alert, Button, Field`, `LoginProps` from `src/types/auth`.
- Produces: `AuthShell({ headline: string, lede: string, bars?: boolean, title: string, intro: string, children: ReactNode })` default export.

Mockups: `login-desktop.png`, `login-mobile.png`, `login-forgot-desktop.png`. A split screen: a Tea panel with the brand, a headline and a short line on the left; Paper with the form on the right. On phones the Tea panel is a short banner above the form.

- [ ] **Step 1: Create `src/Pages/Auth/auth.css`**

Look at `src/components/Sidebar/sidebar.css` (`.sidebar__brand`, `.sidebar__mark`) and reuse its values for the brand mark.

```css
.auth { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); min-height: 100vh; min-height: 100dvh; background: var(--paper); }
.auth__art { display: flex; flex-direction: column; justify-content: space-between; gap: var(--space-8); padding: 48px; background: var(--tea); color: var(--white); }
.auth__art :focus-visible { outline-color: var(--mint); }
.auth__brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-size: 21px; font-weight: 700; line-height: 1; letter-spacing: -0.01em; }
.auth__mark { position: relative; width: 22px; height: 22px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--mint), var(--color-primary)); }
.auth__mark::after { content: ""; position: absolute; inset: 6px; border-radius: 2px; background: var(--tea); }
.auth__bars { display: flex; gap: 6px; margin-bottom: var(--space-5); }
.auth__bars i { width: 54px; height: 8px; border-radius: 4px; background: var(--mint); }
.auth__bars i:last-child { background: var(--on-dark-active); }
.auth__headline { max-width: 12ch; margin: 0; font-family: var(--font-head); font-size: 46px; font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; }
.auth__lede { max-width: 34ch; margin: var(--space-4) 0 0; color: var(--rail-text); font-size: var(--text-md); }
.auth__foot { margin: 0; color: var(--rail-muted); font-size: var(--text-xs); }
.auth__form { display: grid; place-items: center; padding: var(--space-8); }
.auth__box { display: grid; gap: 18px; width: min(380px, 100%); }
.auth__box h1 { margin: 0; font-size: 30px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.auth__intro { margin: -10px 0 0; color: var(--gray-500); }
.auth__box form { display: grid; gap: 18px; }
.auth__box .ui-alert { margin-bottom: 0; }
.auth__forgot { justify-self: end; margin-top: -10px; font-size: var(--text-sm); }
.auth__submit { width: 100%; min-height: 44px; }
.auth__back { justify-self: center; font-size: var(--text-sm); }
@media (max-width: 900px) {
  .auth { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .auth__art { min-height: 220px; padding: 28px; gap: var(--space-5); }
  .auth__headline { font-size: 32px; }
}
```

- [ ] **Step 2: Create `src/Pages/Auth/AuthShell.tsx`**

```tsx
import type { ReactNode } from "react";
import "./auth.css";

interface AuthShellProps {
  headline: string;
  lede: string;
  bars?: boolean; // the four-segment motif, shown on sign-in only
  title: string; // the page's h1
  intro: string;
  children: ReactNode;
}

/** The split screen shared by sign-in, forgot password and reset password. */
export default function AuthShell({ headline, lede, bars = false, title, intro, children }: AuthShellProps) {
  return (
    <div className="auth">
      <section className="auth__art">
        <div className="auth__brand">
          <i className="auth__mark" aria-hidden="true" />
          Admin Panel
        </div>
        <div>
          {bars && (
            <div className="auth__bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
          <p className="auth__headline">{headline}</p>
          <p className="auth__lede">{lede}</p>
        </div>
        <p className="auth__foot">Staff access only</p>
      </section>
      <main className="auth__form">
        <div className="auth__box">
          <h1>{title}</h1>
          <p className="auth__intro">{intro}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/Pages/Auth/Login.tsx`**

```tsx
import React from "react";
import { Link } from "react-router-dom";
import type { LoginProps } from "../../types/auth";
import { useLogin } from "../../hooks/useAuth";
import { Alert, Button, Field } from "../../components/ui";
import AuthShell from "./AuthShell";

const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
  const { email, password, error, loading, setEmail, setPassword, handleLogin } = useLogin(setIsLoggedIn);

  return (
    <AuthShell
      bars
      headline="Every lunch order, in one place."
      lede="Approve customers, move orders along and chase payments without leaving the page."
      title="Sign in"
      intro="Use your admin email and password."
    >
      <form onSubmit={handleLogin}>
        <Field label="Email">
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Link className="ui-link auth__forgot" to="/forgot-password">
          Forgot password?
        </Link>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="auth__submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
```

- [ ] **Step 4: Replace `src/Pages/Auth/PasswordReset.tsx`**

```tsx
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/auth.service";
import { Alert, Button, Field } from "../../components/ui";
import AuthShell from "./AuthShell";

// Shared shell: one input flow that ends in a message instead of a redirect
function Form({ headline, lede, title, intro, submitLabel, onSubmit, children }: {
  headline: string;
  lede: string;
  title: string;
  intro: string;
  submitLabel: string;
  onSubmit: () => Promise<string>;
  children: React.ReactNode;
}) {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setDone(await onSubmit());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <AuthShell headline={headline} lede={lede} title={title} intro={intro}>
      <form onSubmit={submit}>
        {done ? (
          <Alert tone="success">{done}</Alert>
        ) : (
          <>
            {children}
            {error && <Alert>{error}</Alert>}
            <Button type="submit" variant="primary" className="auth__submit" loading={loading}>
              {submitLabel}
            </Button>
          </>
        )}
        <Link className="ui-link auth__back" to="/login">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return (
    <Form
      headline="Locked out? It happens."
      lede="We will email a reset link that works for one hour."
      title="Reset your password"
      intro="Enter your admin email and we will send you a reset link."
      submitLabel="Send reset link"
      onSubmit={async () => (await forgotPassword(email)).message}
    >
      <Field label="Email">
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
    </Form>
  );
}

// Opened from the emailed link: /reset-password?token=...
export function ResetPassword() {
  const token = useSearchParams()[0].get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <Form
      headline="Choose a new password."
      lede="You will use it the next time you sign in."
      title="Set a new password"
      intro="Use at least 6 characters."
      submitLabel="Reset password"
      onSubmit={async () => {
        if (!token) throw new Error("This reset link is missing its token");
        if (password !== confirm) throw new Error("Passwords don't match");
        return (await resetPassword(token, password)).message;
      }}
    >
      <Field label="New password">
        <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Field label="Confirm password">
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </Field>
    </Form>
  );
}
```

The "works for one hour" copy was verified against `Backend/apps/user-service/src/services/passwordResetService.js` (`resetTokenExpiry.setHours(... + 1)`); see Decision 13.

- [ ] **Step 5: Delete the old stylesheet**

`git rm src/styles/login.css`; `grep -rn "login.css\|loginPage\|loginForm\|loginBtn" src` must print nothing.

- [ ] **Step 6: Verify**

`npx tsc -b` and `npx eslint src/Pages/Auth` print nothing; no hex in `auth.css`.

Browser check (**signed out**: use only `docs/superpowers/ui-baseline/setup.js`'s route stubs, not its token. Write a small script that calls `page.addInitScript(() => localStorage.clear())` before `page.goto`, because `setup.js` installs a token): screenshot `/login`, `/forgot-password` and `/reset-password?token=abc` at 1440 and 390. Compare `/login` with `login-desktop.png` and `login-mobile.png` (the four bars, the headline, "Staff access only", "Forgot password?" right-aligned above the button) and `/forgot-password` with `login-forgot-desktop.png`. Submit the forgot form with the stubbed API (it answers `{}`, so `message` is undefined; the success Alert may be empty: if so stub `/forgot-password` in the script to return `{ "message": "If that email belongs to an admin, a reset link is on its way." }` and confirm the green alert replaces the form and "Back to sign in" stays). Confirm each input has a visible label, the page has exactly one `h1`, and the Tab order goes email, password, "Forgot password?", Sign in.

- [ ] **Step 7: Commit**

```bash
git add src/Pages/Auth/AuthShell.tsx src/Pages/Auth/auth.css src/Pages/Auth/Login.tsx src/Pages/Auth/PasswordReset.tsx
git commit -m "feat(auth): split-screen sign-in and password reset on the new identity; retire login.css"
```

---

### Task 14: Accessibility pass, legacy removal and docs

**Files:**
- Modify: `src/components/common/Modal.tsx`, `src/components/common/modal.css`, `src/styles/variables.css`, `docs/ADMIN-PLAN.md`, plus whatever the audit finds
- Delete: `src/components/common/Icons.tsx`, `src/styles/cards.css` (each only if nothing imports it)

**Interfaces:**
- Consumes: every migrated page. Element ids from Task 3 (`cust-search`, `cust-view-<id>`).
- Produces: a clean tree with no `.modal__btn*` classes, no `--*-color` aliases, no dead stylesheets, and every visible form control named.

- [ ] **Step 1: Name every dialog for screen readers**

In `src/components/common/Modal.tsx` import `useId` (`import { useEffect, useId, useRef } from "react";`), add `const titleId = useId();` inside the component, add `aria-labelledby={titleId}` to the `<dialog>`, and give the title `<h2 id={titleId} className="modal__title">`.

- [ ] **Step 2: Audit every visible control on every route and dialog**

Write `$SCRATCH/a11y-audit.js`:

```js
async (page) => {
  const unlabeled = () =>
    page.evaluate(() => {
      const out = [];
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      for (const el of document.querySelectorAll("input:not([type=hidden]), select, textarea")) {
        if (!visible(el)) continue;
        const labelledby = el.getAttribute("aria-labelledby");
        const byFor = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        const name =
          el.getAttribute("aria-label")?.trim() ||
          (labelledby && document.getElementById(labelledby)?.textContent?.trim()) ||
          byFor?.textContent?.trim() ||
          el.closest("label")?.textContent?.trim() ||
          el.getAttribute("title");
        if (!name) out.push(`${el.tagName.toLowerCase()}[type=${el.getAttribute("type") ?? ""}] placeholder="${el.getAttribute("placeholder") ?? ""}"`);
      }
      return out;
    });
  const routes = {
    "/dashboard": [],
    "/users": ["Approve", "Reject"],
    "/orders": [],
    "/notices": [],
    "/delivery-areas": ["Add area", "Edit"],
    "/sessions": ["New session", "Add items", "Change quantity", "Assign deliveries"],
    "/food-items": ["Add item", "Edit"],
    "/delivery-persons": ["Add delivery person", "Reset password"],
    "/reports": [],
    "/admins": ["Add admin", "Edit"],
    "/settings": [],
    "/audit-logs": [],
  };
  const res = {};
  for (const [path, triggers] of Object.entries(routes)) {
    await page.goto(`http://localhost:5173${path}`);
    await page.waitForLoadState("networkidle");
    res[path] = { h1: await page.locator("h1").count(), page: await unlabeled() };
    for (const t of triggers) {
      await page.getByRole("button", { name: t }).first().click();
      await page.waitForTimeout(300);
      res[path][t] = await unlabeled();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    }
  }
  return res;
}
```

Run it with all three stub scripts. Expected: every `h1` count is `1` and every list is `[]`. Fix each finding at its source (a visible `Field` label for form controls, an `aria-label` for filter or table controls), then re-run until clean. Report any page with more or fewer than one `h1`. Also run it with only `setup.js` signed out for `/login`, `/forgot-password`, `/reset-password` (clear localStorage first as in Task 13).

- [ ] **Step 3: Remove the legacy classes and aliases**

1. `grep -rn "modal__btn" src` must show only `src/components/common/modal.css`. Delete the comment line `/* Legacy button classes, still used by pages that have not moved to the ui kit */` and the three rules `.modal__btn`, `.modal__btn--primary`, `.modal__btn--danger` from `modal.css`. Re-run the grep: it must print nothing.
2. `grep -rn "primary-color\|danger-color\|warning-color\|neutral-color" src` must show only `src/styles/variables.css`. Delete the comment line `/* Legacy names, still used by notices.css; remove when the Notices page migrates. */` and the four alias declarations from `variables.css`. Re-run the grep: it must print nothing.
3. Leave the `.modal__form` input, textarea and label rules alone (Decision 10).

- [ ] **Step 4: Delete dead files**

For each of `src/components/common/Icons.tsx` and `src/styles/cards.css`: grep `src` for its import (`grep -rn "common/Icons\|cards.css" src`). If nothing imports it, `git rm` it; if something still does, leave it and say which file in your report.

- [ ] **Step 5: Update `docs/ADMIN-PLAN.md`**

In the "**UI kit.**" paragraph of Conventions: add `Switch, Tabs, Mark, Who` to the import list; add one sentence each saying a setting that takes effect at once is a `Switch` (a checkbox when it waits for a Save button), views of the same data are `Tabs`, a state shown as a dot and a word is a `Mark`, and the avatar-plus-name cell of a people or items list is `Who`; mention `Badge` tones `dark` and `outline`, `Button variant="danger-ghost"` for quiet destructive actions and the `DataTable` `footer` slot for totals; mention that dialog forms use `Field` (with `optional` for optional fields) and never a placeholder as a label. Replace the final sentence ("Pages not yet migrated still use their own CSS (and `src/Pages/Dashboard/dashboard.css`, which Reports, Audit Logs and Settings import) until their plan lands.") with: "Every page is on the kit; there are no legacy page stylesheets left."

- [ ] **Step 6: Final checks**

```bash
npx tsc -b
npx eslint src
grep -rnE "#[0-9a-fA-F]{3,6}\b" src --include=*.css --include=*.tsx | grep -v "src/styles/variables.css"
npm run build
```

`tsc` and `eslint` print nothing; the hex grep prints nothing except any pre-existing hit in a file this plan did not touch (list it, do not fix files outside scope); `npm run build` succeeds (it writes the git-ignored `dist/`). Re-run the Task 12 grep for leftover global class names. Take the full set of desktop and phone screenshots for all twelve routes plus sign-in and compare each against its mockup one last time; list any visible difference.

- [ ] **Step 7: Commit**

```bash
git add src/components/common/Modal.tsx src/components/common/modal.css src/styles/variables.css docs/ADMIN-PLAN.md
git commit -m "chore(ui): name dialogs for screen readers, drop legacy modal buttons and colour aliases, update the plan conventions"
```

Add every other file the audit made you edit (by explicit path) to the same commit. Files removed with `git rm` are already staged.
