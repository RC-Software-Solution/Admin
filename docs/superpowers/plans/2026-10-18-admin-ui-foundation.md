# Admin UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the design tokens, the shared UI kit and the responsive app shell, and prove them by migrating the Orders page.

**Architecture:** Design tokens live in `src/styles/variables.css`. A small kit in `src/components/ui/` (plain CSS, `ui-` class prefix, one `ui.css`) is built on those tokens. The shell (sidebar, topbar, layout) is rewritten on the same tokens with a drawer below 1024px. Orders, the most complex page, is migrated onto the kit as the pilot; the other pages keep their old CSS untouched until the follow-up plan.

**Tech Stack:** React 19, TypeScript 5.9 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 7, react-router-dom 7, react-icons. No new dependencies. There is no test framework in this repo, so verification is `npx tsc -b`, `npx eslint`, and Playwright screenshots/assertions against stubbed API responses.

**Spec:** `docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md`

**Scope note:** The spec covers 13 pages. This plan is Phases 0, 1, 2 plus the Orders pilot from Phase 3. Plan 2 (written after this one lands) migrates Users, Dashboard, Delivery Areas, Sessions, Food Items, Notices, Delivery Persons, Admins, Reports, Audit Logs, Settings and Login, then does the Phase 4 pass. Reason: the kit API will likely adjust after the first real page uses it, and writing eleven page migrations against an unproven API is the likeliest source of rework.

## Global Constraints

- Admin repo root is `C:\Users\budglk\RC\Admin`; run every command from there (Git Bash: `cd /c/Users/budglk/RC/Admin`). Branch `feat/notices`.
- No new dependencies. Plain CSS with custom properties; the kit's class names all start with `ui-`.
- No hex colours outside `src/styles/variables.css` in any file this plan creates or rewrites.
- Keep the green brand `#16a34a` (`--color-primary`) for accents, icons and focus. Filled buttons and green text use `--color-primary-solid` (`#15803d`) because `#16a34a` is only 3.3:1 against white, below WCAG AA for text.
- Breakpoints are 640px (phone) and 1024px (drawer). Media queries cannot use custom properties, so write the literals.
- TypeScript rules in force: `import type` for type-only imports, no enums or parameter properties, no unused locals or parameters.
- Lint rule `react-refresh/only-export-components`: a `.tsx` file exports components only; hooks and contexts go in separate `.ts` files.
- Imports are case-sensitive: `Pages/`, not `pages/`. Files are CRLF on Windows; ignore the line-ending warnings.
- Commit one task at a time. End every commit message with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never commit `package-lock.json` (it has an unrelated local change) or `.env`.
- Verification before claiming a task done: `npx tsc -b` prints nothing, and `npx eslint <touched paths>` prints nothing.

## Deviations from the spec (decided while planning)

| Spec | This plan | Why |
|---|---|---|
| Primary button `#16a34a` | Filled buttons use `#15803d`; `#16a34a` stays for accents | `#16a34a` with white text is 3.3:1; AA needs 4.5:1 |
| `Skeleton` component | Not built; `Spinner` only | Nothing needs a skeleton yet; add when a page does |
| `Tabs` component | Deferred to plan 2 | First consumer is the Users page; build it with the consumer |
| Added: `Alert` component | Built in Task 2 | `DataTable` and pages need one error/notice surface to replace `.sectionNote` and bare `<p role="alert">` |
| Search "collapses to an icon" on mobile | Search shrinks to the available width | Fewer parts; it fits at 390px |
| User menu "arrow keys" | Disclosure pattern (button + panel, Escape and outside click close) | The menu has one item (Log out), so arrow-key navigation is moot |

## File structure

Create:
- `src/components/ui/ui.css` (all kit styles, appended section by section)
- `src/components/ui/index.ts` (barrel)
- `src/components/ui/Button.tsx`, `Badge.tsx`, `Spinner.tsx`, `Alert.tsx`, `EmptyState.tsx`, `Card.tsx`, `PageHeader.tsx`, `FilterBar.tsx`, `Field.tsx`, `DataTable.tsx`
- `src/components/ui/ToastContext.ts`, `ToastProvider.tsx`, `useToast.ts`
- `src/hooks/useDismiss.ts`
- `src/components/Header/UserMenu.tsx`
- `src/Pages/UiKit/UiKit.tsx` (dev-only gallery at `/ui-kit`)
- `docs/superpowers/ui-baseline/setup.js`, `shots.js`, `before/*.png`

Rewrite: `src/styles/variables.css`, `src/styles/global.css`, `src/layouts/layout.css`, `src/layouts/AdminLayout.tsx`, `src/components/Sidebar/Sidebar.tsx`, `src/components/Sidebar/sidebar.css`, `src/components/Header/Topbar.tsx`, `src/components/Header/topbar.css`, `src/components/common/modal.css`, `src/Pages/orders/Orders.tsx`.

Modify: `src/index.css`, `src/app/App.tsx`, `src/app/routes.tsx`, `src/components/common/ConfirmDialog.tsx`, `src/components/Header/Bell.tsx`, `src/components/Header/GlobalSearch.tsx`, `src/hooks/useOrders.ts`, `docs/ADMIN-PLAN.md`, the spec (amendments).

Delete: `src/Pages/orders/orders.css`.

---

### Task 0: Visual baseline tooling and "before" screenshots

**Files:**
- Create: `docs/superpowers/ui-baseline/setup.js`
- Create: `docs/superpowers/ui-baseline/shots.js`
- Create: `docs/superpowers/ui-baseline/before/*.png` (24 images)

**Interfaces:**
- Produces: `setup.js` (run once per browser session: fake `super_admin` session plus stubbed API) and `shots.js` (screenshots 12 pages at 1440 and 390 into `OUT`). Later tasks reuse both.

- [ ] **Step 1: Make sure the dev server is up**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173`
Expected: `200`. If not, run `npm run dev` with `run_in_background: true` and re-check.

- [ ] **Step 2: Write `docs/superpowers/ui-baseline/setup.js`**

This file is passed to the Playwright MCP tool `browser_run_code_unsafe` through its `filename` parameter. It fakes a `super_admin` session (the app only reads the JWT payload, and the backend is not running) and answers every API call locally.

```js
async (page) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const jwt = `${b64({ alg: "none" })}.${b64({ role: "super_admin", exp: Math.floor(Date.now() / 1000) + 86400 })}.x`;
  await page.addInitScript((t) => {
    localStorage.setItem("access_token", t);
    localStorage.setItem("user", JSON.stringify({ name: "Buddhi Gayan" }));
  }, jwt);

  const STATUSES = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
  const PAYMENTS = ["pending", "paid", "unpaid", "ignored"];
  const NAMES = ["Nimal Perera", "Kumari Silva", "Ruwan Fernando", "Dilani Jayasinghe", "Chaminda Wickramasinghe", "Sanduni Rajapaksa", "Tharindu Bandara"];
  const orders = Array.from({ length: 30 }, (_, i) => ({
    id: `ORD-20261018-${String(i + 1).padStart(4, "0")}`,
    customer_id: `c${i % 7}000000-0000-0000-0000-000000000000`,
    customer_name: NAMES[i % 7],
    area_id: (i % 3) + 1,
    status: STATUSES[i % 7],
    payment_status: PAYMENTS[i % 4],
    total_price: String(450 + i * 35),
    meal_time: "lunch",
    created_at: new Date(Date.UTC(2026, 9, 18, 3, 0) - i * 3600e3).toISOString(),
    order_items: [{ id: `i${i}`, quantity: (i % 3) + 1, food_name: "Rice and curry" }],
  }));
  const areas = [1, 2, 3].map((n) => ({ area_id: n, area_name: ["Colombo 03", "Nugegoda", "Dehiwala"][n - 1] }));

  // [path suffix, response body]; first match wins, anything else gets {}
  const FIXED = [
    ["/areas", areas],
    ["/analytics/attention", { pendingApprovals: 3, unpaidOrders: 5, failedDeliveries: 1, blockedUsers: 2 }],
    ["/users/admins", { admins: [] }],
    ["/users/customers", []],
    ["/users/notices", { notices: [] }],
    ["/users/audit-logs", { rows: [], total: 0, page_size: 25 }],
    ["/users/settings", { auto_block_unpaid_threshold: 3, max_threshold: 20 }],
    ["/food-items", { data: { foodItems: [] } }],
    ["/meal-sessions", { data: { mealSessions: [] } }],
  ];

  await page.route(/localhost:400\d\/api/, (route) => {
    const url = new URL(route.request().url());
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (route.request().method() !== "GET") return json({});
    if (url.pathname.endsWith("/orders")) {
      const limit = Number(url.searchParams.get("limit") ?? 26);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const pay = url.searchParams.get("payment_status");
      const rows = pay ? orders.filter((o) => o.payment_status === pay) : orders;
      return json({ orders: rows.slice(offset, offset + limit) });
    }
    if (url.pathname.includes("delivery-persons")) return json({ deliveryPersons: [] });
    const hit = FIXED.find(([suffix]) => url.pathname.endsWith(suffix));
    return json(hit ? hit[1] : {});
  });
  return "stubbed";
}
```

- [ ] **Step 3: Write `docs/superpowers/ui-baseline/shots.js`**

```js
async (page) => {
  const OUT = "C:/Users/budglk/RC/Admin/docs/superpowers/ui-baseline/before"; // use .../after for the final comparison
  const PAGES = ["dashboard", "users", "admins", "delivery-areas", "notices", "orders", "sessions", "food-items", "delivery-persons", "reports", "settings", "audit-logs"];
  const SIZES = [["desktop", 1440, 900], ["mobile", 390, 800]];
  const done = [];
  for (const [name, w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    for (const p of PAGES) {
      await page.goto(`http://localhost:5173/${p}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${p}-${name}.png` });
      done.push(`${p}-${name}`);
    }
  }
  return done;
}
```

- [ ] **Step 4: Run setup, then shots**

Run: `mkdir -p docs/superpowers/ui-baseline/before`

Call `browser_run_code_unsafe` with `filename: "docs/superpowers/ui-baseline/setup.js"`. Expected: `"stubbed"`.

If it fails with "Browser is already in use for ...ms-playwright-mcp...", another Edge instance holds the Playwright profile. List it with PowerShell: `Get-CimInstance Win32_Process -Filter "name='msedge.exe'" | Where-Object CommandLine -like '*ms-playwright-mcp*' | Select-Object ProcessId`. **Ask the user before stopping it**; do not kill it unprompted. If the user declines, stop here and report that visual verification is unavailable.

Call `browser_run_code_unsafe` with `filename: "docs/superpowers/ui-baseline/shots.js"`. Expected: an array of 24 names.

- [ ] **Step 5: Look at three of the images**

Read `docs/superpowers/ui-baseline/before/orders-desktop.png`, `orders-mobile.png` and `dashboard-desktop.png`. Expected: the shell with sidebar and topbar is visible; Orders shows a table of 25 rows; the mobile Orders shows a squeezed or overflowing layout (that is the baseline). Dashboard may render an error or loading state because its stub is empty; that is acceptable.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/ui-baseline
git commit -m "$(cat <<'EOF'
docs: add UI baseline screenshots and Playwright stub scripts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1: Tokens, global base and the `ui.css` entry point

**Files:**
- Rewrite: `src/styles/variables.css`
- Rewrite: `src/styles/global.css`
- Modify: `src/index.css`
- Create: `src/components/ui/ui.css`

**Interfaces:**
- Produces: every CSS custom property named below. Later tasks use these names verbatim: `--color-primary`, `--color-primary-solid`, `--color-primary-solid-hover`, `--color-primary-bg`, `--color-primary-border`, `--color-primary-text`, the same five suffixes for `danger`, `warning` and `info` (danger also has `--color-danger-hover`), `--white`, `--gray-50` … `--gray-900`, `--font-sans`, `--font-mono`, `--text-xs/sm/base/md/lg/xl`, `--space-1/2/3/4/5/6/8`, `--radius-sm/md/lg/full`, `--shadow-sm/md/lg`, `--overlay`, `--focus-ring`, `--z-drawer/dropdown/toast`.

- [ ] **Step 1: Replace `src/styles/variables.css`**

```css
:root {
  /* Brand and status colours. Each has a solid colour plus bg / border / text for soft surfaces (badges, alerts). */
  --color-primary: #16a34a; /* brand green: accents, icons, focus */
  --color-primary-solid: #15803d; /* filled buttons and green text; #16a34a is only 3.3:1 against white */
  --color-primary-solid-hover: #166534;
  --color-primary-bg: #f0fdf4;
  --color-primary-border: #bbf7d0;
  --color-primary-text: #166534;

  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;
  --color-danger-bg: #fee2e2;
  --color-danger-border: #fecaca;
  --color-danger-text: #991b1b;

  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;
  --color-warning-text: #b45309;

  --color-info: #2563eb;
  --color-info-bg: #dbeafe;
  --color-info-border: #bfdbfe;
  --color-info-text: #1e40af;

  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  --font-sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 24px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 8px 16px rgba(15, 23, 42, 0.1);
  --shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.25);
  --overlay: rgba(15, 23, 42, 0.5);
  --focus-ring: 0 0 0 3px rgba(22, 163, 74, 0.35);

  --z-drawer: 100;
  --z-dropdown: 1000;
  --z-toast: 3000;

  /* Breakpoints (media queries cannot read custom properties, so write the literals): 640px phone, 1024px drawer */

  /* Legacy names, still used by two old rules; remove when the Users page migrates. */
  --primary-color: var(--color-primary);
  --danger-color: var(--color-danger);
  --warning-color: var(--color-warning);
  --neutral-color: var(--gray-500);
}
```

- [ ] **Step 2: Replace `src/styles/global.css`**

```css
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-sans);
  background: var(--white);
  color: var(--gray-900);
}

/* One visible focus ring for keyboard users everywhere. Component rules with more specificity may override it. */
:focus-visible {
  outline: 2px solid var(--color-primary-solid);
  outline-offset: 2px;
}

/* Below 16px, iOS Safari zooms the page when a field is focused. */
@media (max-width: 640px) {
  input,
  select,
  textarea {
    font-size: 16px;
  }
}
```

- [ ] **Step 3: Replace `src/index.css`**

The `overflow: hidden` on `html, body` is removed on purpose: the layout (Task 7) makes `.main` the scroll container.

```css
@import "./styles/variables.css";
@import "./styles/global.css";
@import "./components/ui/ui.css";

html, body {
  margin: 0;
  height: 100%;
}
```

- [ ] **Step 4: Create `src/components/ui/ui.css` with the base section**

```css
/* UI kit styles. Every class starts with ui-. Tokens come from styles/variables.css. */

:where([class^="ui-"], [class*=" ui-"]) {
  box-sizing: border-box;
}

.ui-mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}
.ui-nowrap {
  white-space: nowrap;
}
.ui-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
```

- [ ] **Step 5: Verify nothing regressed**

Run: `npx tsc -b`
Expected: no output.

Call `browser_navigate` to `http://localhost:5173/users`, then `browser_take_screenshot`. Expected: the Users page looks the same as `before/users-desktop.png` apart from the body now scrolling inside `.main` as before (the sidebar and topbar still render; `.appContainer` is still `100vh`).

- [ ] **Step 6: Commit**

```bash
git add src/styles/variables.css src/styles/global.css src/index.css src/components/ui/ui.css
git commit -m "$(cat <<'EOF'
feat(ui): add design tokens and global base styles

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Primitives (Button, Badge, Spinner, Alert, EmptyState) and the dev gallery

**Files:**
- Create: `src/components/ui/Button.tsx`, `Badge.tsx`, `Spinner.tsx`, `Alert.tsx`, `EmptyState.tsx`, `index.ts`
- Modify: `src/components/ui/ui.css` (append)
- Create: `src/Pages/UiKit/UiKit.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Produces:
  - `Button({ variant?: "primary" | "secondary" | "danger" | "ghost", size?: "sm" | "md", loading?: boolean, ...ButtonHTMLAttributes })`; `type` defaults to `"button"`, default variant `"secondary"`, default size `"md"`.
  - `Badge({ tone?: BadgeTone, children })` and `type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info"`.
  - `Spinner({ size?: "sm" | "md", label?: string })` (decorative when `label` is omitted).
  - `Alert({ tone?: "danger" | "warning" | "success" | "info", children })`; default tone `"danger"`.
  - `EmptyState({ title: string, hint?: ReactNode, action?: ReactNode })`.
  - Barrel `src/components/ui/index.ts` that later tasks append to.
  - Route `/ui-kit` (dev builds only).

- [ ] **Step 1: Create `Spinner.tsx`**

```tsx
interface SpinnerProps {
  size?: "sm" | "md";
  label?: string; // omit when the spinner sits inside a control that already says what is loading
}

export function Spinner({ size = "md", label }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ui-spinner--${size}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
```

- [ ] **Step 2: Create `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({ variant = "secondary", size = "md", loading = false, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create `Badge.tsx`, `Alert.tsx`, `EmptyState.tsx`**

`Badge.tsx`:

```tsx
import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}
```

`Alert.tsx`:

```tsx
import type { ReactNode } from "react";

interface AlertProps {
  tone?: "danger" | "warning" | "success" | "info";
  children: ReactNode;
}

export function Alert({ tone = "danger", children }: AlertProps) {
  return (
    <div className={`ui-alert ui-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}
```

`EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <p className="ui-empty__title">{title}</p>
      {hint && <p className="ui-empty__hint">{hint}</p>}
      {action}
    </div>
  );
}
```

- [ ] **Step 4: Create the barrel `src/components/ui/index.ts`**

```ts
export { Alert } from "./Alert";
export { Badge } from "./Badge";
export type { BadgeTone } from "./Badge";
export { Button } from "./Button";
export { EmptyState } from "./EmptyState";
export { Spinner } from "./Spinner";
```

- [ ] **Step 5: Append the primitives' CSS to `src/components/ui/ui.css`**

```css

/* ===== Button ===== */
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font: inherit;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s;
}
.ui-btn--md {
  min-height: 36px;
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}
.ui-btn--sm {
  min-height: 30px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}
.ui-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ui-btn--primary {
  background: var(--color-primary-solid);
  color: var(--white);
}
.ui-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-solid-hover);
}
.ui-btn--secondary {
  background: var(--white);
  color: var(--gray-800);
  border-color: var(--gray-300);
}
.ui-btn--secondary:hover:not(:disabled) {
  background: var(--gray-50);
}
.ui-btn--secondary[aria-pressed="true"] {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
}
.ui-btn--danger {
  background: var(--color-danger);
  color: var(--white);
}
.ui-btn--danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}
.ui-btn--ghost {
  background: transparent;
  color: var(--gray-700);
}
.ui-btn--ghost:hover:not(:disabled) {
  background: var(--gray-100);
}
@media (max-width: 640px) {
  /* Touch targets */
  .ui-btn--md { min-height: 44px; }
  .ui-btn--sm { min-height: 36px; }
}

/* ===== Spinner ===== */
.ui-spinner {
  display: inline-block;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: ui-spin 0.7s linear infinite;
}
.ui-spinner--sm { width: 14px; height: 14px; }
.ui-spinner--md { width: 24px; height: 24px; border-width: 3px; }
@keyframes ui-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-spinner { animation-duration: 2s; }
}

/* ===== Badge ===== */
.ui-badge {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.5;
  text-transform: lowercase;
  white-space: nowrap;
}
.ui-badge--neutral { background: var(--gray-100); color: var(--gray-700); border-color: var(--gray-200); }
.ui-badge--success { background: var(--color-primary-bg); color: var(--color-primary-text); border-color: var(--color-primary-border); }
.ui-badge--warning { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.ui-badge--danger { background: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.ui-badge--info { background: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }

/* ===== Alert ===== */
.ui-alert {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}
.ui-alert--danger { background: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.ui-alert--warning { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.ui-alert--success { background: var(--color-primary-bg); color: var(--color-primary-text); border-color: var(--color-primary-border); }
.ui-alert--info { background: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }

/* ===== EmptyState ===== */
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--gray-500);
}
.ui-empty__title { margin: 0; font-weight: 600; color: var(--gray-700); }
.ui-empty__hint { margin: 0; font-size: var(--text-sm); }
```

- [ ] **Step 6: Create the dev gallery `src/Pages/UiKit/UiKit.tsx`**

```tsx
import type { ReactNode } from "react";
import { Alert, Badge, Button, EmptyState, Spinner } from "../../components/ui";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
    <h2 style={{ margin: 0, fontSize: "var(--text-md)" }}>{title}</h2>
    {children}
  </section>
);

/** Dev-only gallery (route /ui-kit) so every kit component can be checked at desktop and phone width. */
export default function UiKit() {
  return (
    <div>
      <Section title="Button">
        <div className="ui-actions">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
        </div>
      </Section>
      <Section title="Badge">
        <div className="ui-actions">
          <Badge>neutral</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="info">info</Badge>
        </div>
      </Section>
      <Section title="Alert, Spinner, EmptyState">
        <Alert>Couldn&apos;t load orders: Request failed (500)</Alert>
        <Alert tone="warning">Pick both dates to filter by date.</Alert>
        <Alert tone="success">Reminder sent to 3 customers.</Alert>
        <Alert tone="info">Refreshes every 30s.</Alert>
        <Spinner label="Loading" />
        <EmptyState title="No orders found" hint="Try clearing the filters." action={<Button>Clear filters</Button>} />
      </Section>
      {/* gallery:end */}
    </div>
  );
}
```

- [ ] **Step 7: Register the dev-only route in `src/app/routes.tsx`**

Add this import directly after the `AuditLogs` import line:

```tsx
import UiKit from "../Pages/UiKit/UiKit";
```

Replace the line `        <Route path="*" element={<Navigate to="/dashboard" />} />` with:

```tsx
        {import.meta.env.DEV && <Route path="/ui-kit" element={<UiKit />} />}
        <Route path="*" element={<Navigate to="/dashboard" />} />
```

- [ ] **Step 8: Verify**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit src/app/routes.tsx`
Expected: no output from either.

Call `browser_run_code_unsafe` with `filename: "docs/superpowers/ui-baseline/setup.js"` (once per browser session; skip if already run), then `browser_resize` to 1440×900, `browser_navigate` to `http://localhost:5173/ui-kit`, `browser_take_screenshot`. Expected: three sections render; primary buttons are green, danger red, badges tinted, alerts coloured; the loading button shows a spinning ring. Then `browser_resize` to 390×800 and screenshot again: buttons wrap onto several lines and are taller (44px).

- [ ] **Step 9: Commit**

```bash
git add src/components/ui src/Pages/UiKit src/app/routes.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add Button, Badge, Spinner, Alert, EmptyState and a dev gallery

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Layout primitives (Card, PageHeader, FilterBar, Field)

**Files:**
- Create: `src/components/ui/Card.tsx`, `PageHeader.tsx`, `FilterBar.tsx`, `Field.tsx`
- Modify: `src/components/ui/index.ts`, `src/components/ui/ui.css` (append), `src/Pages/UiKit/UiKit.tsx`

**Interfaces:**
- Consumes: Task 2's `Button`.
- Produces:
  - `Card({ title?: ReactNode, actions?: ReactNode, flush?: boolean, children })`
  - `PageHeader({ title: string, subtitle?: ReactNode, actions?: ReactNode })`
  - `FilterBar({ label?: string, children })`; controls (`input`, `select`) inside are styled by it.
  - `Field({ label: string, hint?: string, error?: string, children: ReactElement })`; wires `id`, `aria-describedby` and `aria-invalid` onto the single child control.

- [ ] **Step 1: Create the four components**

`Card.tsx`:

```tsx
import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  flush?: boolean; // no body padding, for tables that run edge to edge
  children: ReactNode;
}

export function Card({ title, actions, flush = false, children }: CardProps) {
  return (
    <section className="ui-card">
      {(title || actions) && (
        <div className="ui-card__header">
          <h2 className="ui-card__title">{title}</h2>
          {actions}
        </div>
      )}
      <div className={flush ? undefined : "ui-card__body"}>{children}</div>
    </section>
  );
}
```

`PageHeader.tsx`:

```tsx
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="ui-pageheader">
      <div>
        <h1 className="ui-pageheader__title">{title}</h1>
        {subtitle && <p className="ui-pageheader__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ui-actions">{actions}</div>}
    </header>
  );
}
```

`FilterBar.tsx`:

```tsx
import type { ReactNode } from "react";

export function FilterBar({ label = "Filters", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="ui-filterbar" role="group" aria-label={label}>
      {children}
    </div>
  );
}
```

`Field.tsx`:

```tsx
import { cloneElement, useId } from "react";
import type { ReactElement } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement; // one input, select or textarea
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className="ui-field">
      <label htmlFor={id} className="ui-field__label">{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": note ? noteId : undefined,
        "aria-invalid": error ? true : undefined,
      } as Record<string, unknown>)}
      {note && <p id={noteId} className={error ? "ui-field__error" : "ui-field__hint"}>{note}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Append to the barrel `src/components/ui/index.ts`**

```ts
export { Card } from "./Card";
export { Field } from "./Field";
export { FilterBar } from "./FilterBar";
export { PageHeader } from "./PageHeader";
```

- [ ] **Step 3: Append the CSS to `src/components/ui/ui.css`**

```css

/* ===== Card ===== */
.ui-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
}
.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--gray-200);
}
.ui-card__title { margin: 0; font-size: var(--text-md); }
.ui-card__body { padding: var(--space-4); }

/* ===== PageHeader ===== */
.ui-pageheader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.ui-pageheader__title { margin: 0; font-size: var(--text-xl); line-height: 1.2; }
.ui-pageheader__subtitle { margin: var(--space-1) 0 0; color: var(--gray-500); font-size: var(--text-sm); }

/* ===== FilterBar ===== */
.ui-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.ui-filterbar :is(input, select) {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.ui-filterbar label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--gray-600);
}
@media (max-width: 640px) {
  .ui-filterbar > * { flex: 1 1 140px; }
  .ui-filterbar :is(input, select) { min-height: 44px; min-width: 0; flex: 1; }
}

/* ===== Field ===== */
.ui-field { display: flex; flex-direction: column; gap: var(--space-1); }
.ui-field__label { font-size: var(--text-sm); font-weight: 600; color: var(--gray-700); }
.ui-field :is(input, select, textarea) {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.ui-field :is(input, select, textarea)[aria-invalid="true"] { border-color: var(--color-danger); }
.ui-field__hint, .ui-field__error { margin: 0; font-size: var(--text-xs); }
.ui-field__hint { color: var(--gray-500); }
.ui-field__error { color: var(--color-danger-text); }
```

- [ ] **Step 4: Extend the gallery**

In `src/Pages/UiKit/UiKit.tsx` replace the import line

```tsx
import { Alert, Badge, Button, EmptyState, Spinner } from "../../components/ui";
```

with

```tsx
import { Alert, Badge, Button, Card, EmptyState, Field, FilterBar, PageHeader, Spinner } from "../../components/ui";
```

and replace `      {/* gallery:end */}` with

```tsx
      <Section title="PageHeader, FilterBar, Card, Field">
        <PageHeader title="Orders" subtitle="Refreshes every 30s" actions={<Button variant="primary">Add</Button>} />
        <FilterBar>
          <select aria-label="Status"><option>All statuses</option></select>
          <input type="search" placeholder="Order id…" aria-label="Order id" />
          <label>From <input type="date" /></label>
          <Button aria-pressed="true">Unpaid only</Button>
        </FilterBar>
        <Card title="Card title" actions={<Button size="sm">Action</Button>}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <Field label="Name" hint="As shown to customers"><input /></Field>
            <Field label="Price" error="Enter a positive number"><input defaultValue="-1" /></Field>
          </div>
        </Card>
      </Section>
      {/* gallery:end */}
```

- [ ] **Step 5: Verify**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit`
Expected: no output.

Screenshot `/ui-kit` at 1440×900 and at 390×800. Expected at 1440: the header has the title on the left and the green Add button on the right; the filter row sits on one line; the price field has a red border and red message. At 390: the filter controls stretch to fill rows and are 44px tall; no horizontal scrollbar. Check with `browser_evaluate`: `() => document.documentElement.scrollWidth <= window.innerWidth` → `true`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui src/Pages/UiKit
git commit -m "$(cat <<'EOF'
feat(ui): add Card, PageHeader, FilterBar and Field

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Toast

**Files:**
- Create: `src/components/ui/ToastContext.ts`, `ToastProvider.tsx`, `useToast.ts`
- Modify: `src/components/ui/index.ts`, `src/components/ui/ui.css` (append), `src/app/App.tsx`, `src/Pages/UiKit/UiKit.tsx`

**Interfaces:**
- Produces: `ToastProvider({ children })` (mounted once in `App.tsx`), and `useToast(): { show(message: string, tone?: "success" | "danger" | "info"): void }`; default tone `"success"`; toasts disappear after 5 seconds.

- [ ] **Step 1: Create the three files**

`src/components/ui/ToastContext.ts`:

```ts
import { createContext } from "react";

export type ToastTone = "success" | "danger" | "info";

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
```

`src/components/ui/ToastProvider.tsx`:

```tsx
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./ToastContext";
import type { ToastTone } from "./ToastContext";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const LIFETIME_MS = 5000;
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId++;
      setToasts((t) => [...t, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), LIFETIME_MS);
    },
    [dismiss],
  );
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast--${t.tone}`} role={t.tone === "danger" ? "alert" : "status"}>
            <span>{t.message}</span>
            <button type="button" className="ui-toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

`src/components/ui/useToast.ts`:

```ts
import { useContext } from "react";
import { ToastContext } from "./ToastContext";

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
```

- [ ] **Step 2: Append to the barrel `src/components/ui/index.ts`**

```ts
export { ToastProvider } from "./ToastProvider";
export { useToast } from "./useToast";
```

- [ ] **Step 3: Append the CSS to `src/components/ui/ui.css`**

```css

/* ===== Toast ===== */
.ui-toasts {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: min(360px, calc(100vw - 2 * var(--space-4)));
}
.ui-toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--text-base);
}
.ui-toast--success { background: var(--color-primary-bg); color: var(--color-primary-text); border-color: var(--color-primary-border); }
.ui-toast--danger { background: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.ui-toast--info { background: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }
.ui-toast__close {
  flex-shrink: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
}
@media (max-width: 640px) {
  .ui-toasts { left: var(--space-4); max-width: none; bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px)); }
}
```

- [ ] **Step 4: Mount the provider in `src/app/App.tsx`**

Replace the whole file with:

```tsx
import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./routes";
import { getSession } from "../services/apiClient";
import { ToastProvider } from "../components/ui";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getSession() !== null);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
```

- [ ] **Step 5: Extend the gallery**

In `src/Pages/UiKit/UiKit.tsx`:

Replace `import { Alert, Badge, Button, Card, EmptyState, Field, FilterBar, PageHeader, Spinner } from "../../components/ui";` with
`import { Alert, Badge, Button, Card, EmptyState, Field, FilterBar, PageHeader, Spinner, useToast } from "../../components/ui";`

Replace `export default function UiKit() {\n  return (` with
```tsx
export default function UiKit() {
  const toast = useToast();
  return (
```
(that is, insert `  const toast = useToast();` as the first line of the function body).

Replace `      {/* gallery:end */}` with
```tsx
      <Section title="Toast">
        <div className="ui-actions">
          <Button onClick={() => toast.show("Marked paid")}>Success toast</Button>
          <Button onClick={() => toast.show("Could not save", "danger")}>Error toast</Button>
          <Button onClick={() => toast.show("Refreshing…", "info")}>Info toast</Button>
        </div>
      </Section>
      {/* gallery:end */}
```

- [ ] **Step 6: Verify**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit src/app/App.tsx`
Expected: no output.

On `/ui-kit` at 1440×900 click "Success toast" (use `browser_find` or `browser_snapshot` to get the ref, then `browser_click`) and take a screenshot. Expected: a green toast bottom-right with a × button; it disappears after about 5 seconds; clicking × dismisses it at once. At 390×800 the toast spans the width at the bottom.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui src/Pages/UiKit src/app/App.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add toast notifications

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: DataTable (desktop table, stacked cards on phones)

**Files:**
- Create: `src/components/ui/DataTable.tsx`
- Modify: `src/components/ui/index.ts`, `src/components/ui/ui.css` (append), `src/Pages/UiKit/UiKit.tsx`

**Interfaces:**
- Consumes: Task 2's `Alert`, `EmptyState`, `Spinner`.
- Produces:
  - `interface Column<T> { key: string; label: string; cell: (row: T) => ReactNode; header?: ReactNode; mobile?: "title" | "select" | "actions"; nowrap?: boolean }`
  - `DataTable<T>({ columns: Column<T>[], rows: T[], rowKey: (row: T) => string, loading?: boolean, error?: string | null, emptyTitle?: string })`
  - Behaviour: while `loading` with no rows it shows a spinner; with an `error` it shows an `Alert` above the table and keeps any rows already loaded; with no rows, no error and not loading it shows the `emptyTitle` empty state. `label` is the desktop header text and the mobile card label; `header` overrides the desktop header cell only (for a select-all checkbox). On phones (≤640px) each row becomes a card: the `"title"` column is the card heading, the `"select"` column sits top-right, the `"actions"` column is the bottom row, the rest are label/value pairs.

- [ ] **Step 1: Create `src/components/ui/DataTable.tsx`**

```tsx
import type { ReactNode } from "react";
import { Alert } from "./Alert";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";

export interface Column<T> {
  key: string;
  label: string; // desktop header text and the label on a phone card
  cell: (row: T) => ReactNode;
  header?: ReactNode; // replaces the label in the desktop header (e.g. a select-all checkbox)
  mobile?: "title" | "select" | "actions"; // special slot on phones; omit for a label/value pair
  nowrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean; // true until the first load finishes
  error?: string | null;
  emptyTitle?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading = false, error, emptyTitle = "Nothing to show" }: DataTableProps<T>) {
  const waiting = loading && rows.length === 0;
  return (
    <div className="ui-datatable">
      {error && <Alert>{error}</Alert>}
      {waiting && (
        <div className="ui-datatable__state">
          <Spinner label="Loading" />
        </div>
      )}
      {!waiting && rows.length === 0 && !error && <EmptyState title={emptyTitle} />}
      {rows.length > 0 && (
        <div className="ui-datatable__scroll">
          {/* explicit roles keep table semantics when the phone layout turns cells into blocks */}
          <table className="ui-table" role="table">
            <thead role="rowgroup">
              <tr role="row">
                {columns.map((c) => (
                  <th key={c.key} role="columnheader" scope="col" className={c.nowrap ? "ui-nowrap" : undefined}>
                    {c.header ?? c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => (
                <tr key={rowKey(r)} role="row">
                  {columns.map((c) => (
                    <td key={c.key} role="cell" data-label={c.label} data-slot={c.mobile} className={c.nowrap ? "ui-nowrap" : undefined}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Append to the barrel `src/components/ui/index.ts`**

```ts
export { DataTable } from "./DataTable";
export type { Column } from "./DataTable";
```

- [ ] **Step 3: Append the CSS to `src/components/ui/ui.css`**

```css

/* ===== DataTable ===== */
.ui-datatable { padding: var(--space-2); }
.ui-datatable > .ui-alert { margin: var(--space-2); }
.ui-datatable__state { display: flex; justify-content: center; padding: var(--space-8); color: var(--gray-500); }
.ui-datatable__scroll { overflow-x: auto; }
.ui-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.ui-table th {
  padding: var(--space-3);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-600);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}
.ui-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}
.ui-table tbody tr:hover { background: var(--gray-50); }

/* Phones: every row becomes a card. Title top-left, select top-right, label/value pairs, actions last. */
@media (max-width: 640px) {
  .ui-datatable { padding: 0; }
  .ui-table, .ui-table tbody { display: block; }
  .ui-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .ui-table tr {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--gray-200);
  }
  .ui-table td {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    grid-column: 1 / -1;
    padding: 0;
    border: 0;
    text-align: right;
  }
  .ui-table td::before {
    content: attr(data-label);
    flex-shrink: 0;
    color: var(--gray-500);
    font-size: var(--text-xs);
    text-align: left;
  }
  .ui-table td[data-slot] { text-align: left; }
  .ui-table td[data-slot]::before { content: none; }
  .ui-table td[data-slot="title"] { grid-column: 1; grid-row: 1; font-weight: 600; }
  .ui-table td[data-slot="select"] { grid-column: 2; grid-row: 1; }
  .ui-table td[data-slot="actions"] { flex-wrap: wrap; justify-content: flex-start; padding-top: var(--space-1); }
  .ui-nowrap { white-space: normal; }
}
```

- [ ] **Step 4: Extend the gallery**

In `src/Pages/UiKit/UiKit.tsx`:

Replace `import { Alert, Badge, Button, Card, EmptyState, Field, FilterBar, PageHeader, Spinner, useToast } from "../../components/ui";` with
```tsx
import { Alert, Badge, Button, Card, DataTable, EmptyState, Field, FilterBar, PageHeader, Spinner, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";
```

Insert this above `const Section` (after the imports):

```tsx
interface Row { id: string; customer: string; total: string; status: "paid" | "unpaid" }
const ROWS: Row[] = [
  { id: "ORD-20261018-0001", customer: "Nimal Perera", total: "LKR 450.00", status: "paid" },
  { id: "ORD-20261018-0002", customer: "Kumari Silva", total: "LKR 485.00", status: "unpaid" },
];
const COLUMNS: Column<Row>[] = [
  { key: "select", label: "Select", mobile: "select", header: <input type="checkbox" aria-label="Select all" />, cell: (r) => <input type="checkbox" aria-label={`Select ${r.customer}`} /> },
  { key: "id", label: "Order", mobile: "title", cell: (r) => <span className="ui-mono">{r.id}</span> },
  { key: "customer", label: "Customer", cell: (r) => r.customer },
  { key: "total", label: "Total", cell: (r) => r.total },
  { key: "status", label: "Payment", cell: (r) => <Badge tone={r.status === "paid" ? "success" : "danger"}>{r.status}</Badge> },
  { key: "actions", label: "Actions", mobile: "actions", cell: () => <div className="ui-actions"><Button size="sm">Edit</Button><Button size="sm" variant="primary">Mark paid</Button></div> },
];
```

Replace `      {/* gallery:end */}` with
```tsx
      <Section title="DataTable">
        <Card flush><DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} emptyTitle="No orders found" /></Card>
        <Card flush><DataTable columns={COLUMNS} rows={ROWS.slice(0, 1)} rowKey={(r) => r.id} error="Refresh failed: Request failed (500)" /></Card>
      </Section>
      {/* gallery:end */}
```

- [ ] **Step 5: Verify**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit`
Expected: no output.

At 1440×900 screenshot `/ui-kit`. Expected: a normal table with a header row; the second table shows a spinner; the third shows "No orders found"; the fourth shows a red alert above one retained row.

At 390×800 screenshot again. Expected: the header row is gone; each order is a card with the order id as the heading and the checkbox top-right, then Customer / Total / Payment as label-and-value rows, then the Edit and Mark paid buttons at the bottom. Check `browser_evaluate`: `() => document.documentElement.scrollWidth <= window.innerWidth` → `true`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui src/Pages/UiKit
git commit -m "$(cat <<'EOF'
feat(ui): add DataTable with stacked-card layout on phones

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Restyle Modal and ConfirmDialog

**Files:**
- Rewrite: `src/components/common/modal.css`
- Modify: `src/components/common/ConfirmDialog.tsx`

**Interfaces:**
- Consumes: `Button` from `src/components/ui`.
- Produces: `ConfirmDialog` gains `tone?: "danger" | "primary"` (default `"danger"`). `Modal` keeps its API. The legacy `.modal__btn`, `.modal__btn--primary`, `.modal__btn--danger`, `.modal__form` and `.modal__actions` classes keep working because ten other pages still use them; they now take their colours from tokens, so every modal's primary button turns green at once.

- [ ] **Step 1: Replace `src/components/common/modal.css`**

```css
.modal {
  border: 0;
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  width: min(440px, 92vw);
  box-shadow: var(--shadow-lg);
  color: var(--gray-900);
}
.modal::backdrop { background: var(--overlay); }
.modal__title { margin: 0 0 var(--space-3); font-size: 18px; }
.modal__body { margin: 0 0 var(--space-5); color: var(--gray-600); }
.modal__form { display: flex; flex-direction: column; gap: var(--space-3); }
.modal__form input, .modal__form select, .modal__form textarea {
  padding: var(--space-2) 10px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font: inherit;
}
.modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

/* Legacy button classes, still used by pages that have not moved to the ui kit */
.modal__btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-300);
  background: var(--white);
  cursor: pointer;
  font: inherit;
}
.modal__btn--primary { background: var(--color-primary-solid); border-color: var(--color-primary-solid); color: var(--white); }
.modal__btn--danger { background: var(--color-danger); border-color: var(--color-danger); color: var(--white); }

/* Phones: modals become bottom sheets */
@media (max-width: 640px) {
  .modal {
    width: 100%;
    max-width: 100%;
    max-height: 90dvh;
    margin: auto 0 0;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
  }
  .modal__actions { flex-direction: column-reverse; }
  .modal__actions > * { width: 100%; }
}
```

- [ ] **Step 2: Replace `src/components/common/ConfirmDialog.tsx`**

```tsx
import Modal from "./Modal";
import { Button } from "../ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary"; // danger for destructive actions, primary for ordinary confirmations
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="modal__body">{message}</p>
      <div className="modal__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc -b` then `npx eslint src/components/common`
Expected: no output.

Open `/food-items` (an old page that uses `Modal` and `ConfirmDialog`) at 1440×900. The stub returns no food items, so click "Add Item" (use `browser_snapshot` to get the ref, then `browser_click`) and take a screenshot. Expected: the modal's Save button is green (previously blue). Resize to 390×800 and screenshot: the modal is pinned to the bottom with rounded top corners and full-width stacked buttons.

- [ ] **Step 4: Commit**

```bash
git add src/components/common
git commit -m "$(cat <<'EOF'
feat(ui): restyle Modal and ConfirmDialog on tokens, bottom sheet on phones

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: App shell: layout, grouped sidebar and drawer

**Files:**
- Rewrite: `src/layouts/layout.css`, `src/layouts/AdminLayout.tsx`, `src/components/Sidebar/Sidebar.tsx`, `src/components/Sidebar/sidebar.css`
- Modify: `src/components/Header/Topbar.tsx` (props only, so the build stays green; rewritten in Task 8)

**Interfaces:**
- Produces:
  - `Sidebar({ open: boolean, onNavigate: () => void })` (default export). The element has `id="app-sidebar"`.
  - `AdminLayout` holds `navOpen` state and passes `navOpen` and `onMenu` to `Topbar`.
  - Topbar props become `{ setIsLoggedIn, navOpen: boolean, onMenu: () => void }` (the real hamburger button arrives in Task 8).

- [ ] **Step 1: Replace `src/layouts/layout.css`**

All shell rules move here from `sidebar.css`. `.main` is the scroll container now that `body` no longer clips.

```css
.appContainer {
  display: flex;
  height: 100vh; /* fallback */
  height: 100dvh;
}

.contentWrapper {
  flex: 1;
  min-width: 0; /* lets wide tables scroll inside .main instead of stretching the page */
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding: var(--space-5);
  overflow-y: auto;
}

.drawerBackdrop {
  display: none;
}

@media (max-width: 1024px) {
  .drawerBackdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-drawer) - 1);
    background: var(--overlay);
  }
}

@media (max-width: 640px) {
  .main {
    padding: var(--space-3);
  }
}
```

- [ ] **Step 2: Replace `src/layouts/AdminLayout.tsx`**

```tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Header/Topbar";
import "./layout.css";

interface LayoutProps {
  children?: React.ReactNode;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Layout: React.FC<LayoutProps> = ({ children, setIsLoggedIn }) => {
  // Below 1024px the sidebar is a drawer; on wider screens this flag has no visual effect.
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [navOpen]);

  return (
    <div className="appContainer">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && <div className="drawerBackdrop" onClick={() => setNavOpen(false)} />}
      <div className="contentWrapper">
        <Topbar setIsLoggedIn={setIsLoggedIn} navOpen={navOpen} onMenu={() => setNavOpen((o) => !o)} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
```

- [ ] **Step 3: Replace `src/components/Sidebar/Sidebar.tsx`**

```tsx
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { MdDashboard, MdLocationOn, MdCampaign, MdEventNote, MdRestaurantMenu, MdDeliveryDining, MdAssessment, MdSettings, MdHistory } from "react-icons/md";
import { FaUsers, FaUserShield, FaClipboardList } from "react-icons/fa";
import { getSession } from "../../services/apiClient";
import "./sidebar.css";

interface NavItem {
  name: string;
  icon: ReactNode;
  path: string;
  superOnly?: boolean; // UI gating only; the backend enforces roles
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  { title: "Overview", items: [{ name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" }] },
  {
    title: "Customers",
    items: [
      { name: "Users", icon: <FaUsers />, path: "/users" },
      { name: "Orders", icon: <FaClipboardList />, path: "/orders" },
      { name: "Notices", icon: <MdCampaign />, path: "/notices" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Delivery Areas", icon: <MdLocationOn />, path: "/delivery-areas" },
      { name: "Sessions", icon: <MdEventNote />, path: "/sessions" },
      { name: "Food Items", icon: <MdRestaurantMenu />, path: "/food-items" },
      { name: "Delivery Persons", icon: <MdDeliveryDining />, path: "/delivery-persons" },
    ],
  },
  { title: "Insights", items: [{ name: "Reports", icon: <MdAssessment />, path: "/reports" }] },
  {
    title: "Admin",
    items: [
      { name: "Admins", icon: <FaUserShield />, path: "/admins", superOnly: true },
      { name: "Settings", icon: <MdSettings />, path: "/settings", superOnly: true },
      { name: "Audit Logs", icon: <MdHistory />, path: "/audit-logs", superOnly: true },
    ],
  },
];

interface SidebarProps {
  open: boolean; // drawer state below 1024px
  onNavigate: () => void; // called after a link is chosen so the drawer can close
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const isSuper = getSession()?.role === "super_admin";

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__title">Admin Panel</div>
      <nav className="nav" aria-label="Main">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => isSuper || !i.superOnly);
          if (items.length === 0) return null;
          return (
            <div key={g.title} className="nav__group">
              <div className="nav__group-title">{g.title}</div>
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onNavigate} className={({ isActive }) => `nav__item ${isActive ? "nav__item--active" : ""}`}>
                  <span className="nav__icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav__text">{item.name}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Replace `src/components/Sidebar/sidebar.css`**

The topbar, search and user rules that used to live here move to `topbar.css` in Task 8. Until that task lands the topbar is unstyled but still works; do not commit this task on its own (see Step 6).

```css
.sidebar {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--gray-200);
  background: var(--white);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar__title {
  padding: var(--space-4) var(--space-4) var(--space-2);
  font-weight: 800;
  font-size: 22px;
  color: var(--color-primary-solid);
}

.nav {
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.nav__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav__group-title {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gray-500);
}

.nav__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px var(--space-3);
  border-radius: var(--radius-md);
  color: var(--gray-900);
  text-decoration: none;
  font-size: var(--text-base);
}

.nav__item:hover {
  background: var(--gray-50);
}

.nav__icon {
  display: inline-flex;
  font-size: 18px;
  color: var(--gray-500);
}

.nav__item--active {
  background: var(--color-primary-bg);
  color: var(--color-primary-text);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.nav__item--active .nav__icon {
  color: var(--color-primary);
}

/* Below 1024px the sidebar is a drawer. Hidden links must not be reachable by keyboard, hence visibility. */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: var(--z-drawer);
    max-width: 85vw;
    transform: translateX(-100%);
    visibility: hidden;
    transition: transform 0.2s ease, visibility 0s linear 0.2s;
  }

  .sidebar--open {
    transform: none;
    visibility: visible;
    transition: transform 0.2s ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar--open {
    transition: none;
  }
}
```

- [ ] **Step 5: Update `Topbar.tsx` props so the build stays green**

In `src/components/Header/Topbar.tsx` replace

```tsx
interface TopbarProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = ({ setIsLoggedIn }) => {
```

with

```tsx
interface TopbarProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  navOpen: boolean; // used by the hamburger added in the next task
  onMenu: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ setIsLoggedIn }) => {
```

`navOpen` and `onMenu` stay declared on the interface but are not destructured yet, so nothing is flagged as unused.

- [ ] **Step 6: Verify, then continue straight into Task 8 without committing**

Run: `npx tsc -b` then `npx eslint src/layouts src/components/Sidebar src/components/Header/Topbar.tsx`
Expected: no output.

Screenshot `/orders` at 1440×900. Expected: the sidebar shows five labelled groups (Overview, Customers, Operations, Insights, Admin) with the active item highlighted in green; the topbar is temporarily unstyled (its rules were removed from this stylesheet). This is expected: Task 8 restyles it and the pair is committed together there.

---

### Task 8: Topbar: hamburger, user menu, shared dismiss hook

**Files:**
- Create: `src/hooks/useDismiss.ts`, `src/components/Header/UserMenu.tsx`
- Rewrite: `src/components/Header/Topbar.tsx`, `src/components/Header/topbar.css`
- Modify: `src/components/Header/Bell.tsx`, `src/components/Header/GlobalSearch.tsx`

**Interfaces:**
- Produces: `useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void)` (closes on an outside click or Escape while `open`); `UserMenu({ setIsLoggedIn })`; `Topbar({ setIsLoggedIn, navOpen, onMenu })` with the hamburger visible below 1024px.

- [ ] **Step 1: Create `src/hooks/useDismiss.ts`**

```ts
import { useEffect } from "react";
import type { RefObject } from "react";

/** While `open`, calls `close` on a click outside `ref` or on Escape. */
export function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open, ref, close]);
}
```

- [ ] **Step 2: Create `src/components/Header/UserMenu.tsx`**

```tsx
import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown } from "react-icons/md";
import { getSession } from "../../services/apiClient";
import { logout } from "../../services/auth.service";
import { useDismiss } from "../../hooks/useDismiss";

interface UserMenuProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export default function UserMenu({ setIsLoggedIn }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useDismiss(open, box, () => setOpen(false));
  const name = getSession()?.name ?? "Admin";

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="user" ref={box}>
      <button type="button" className="user__trigger" aria-expanded={open} aria-controls="user-menu-panel" onClick={() => setOpen((o) => !o)}>
        <span className="user__avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
        <span className="user__name">{name}</span>
        <MdKeyboardArrowDown className="user__caret" aria-hidden="true" />
      </button>
      {open && (
        <div id="user-menu-panel" className="user__dropdown">
          <button type="button" className="dropdown__item" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/components/Header/Topbar.tsx`**

```tsx
import type { Dispatch, SetStateAction } from "react";
import { MdMenu } from "react-icons/md";
import Bell from "./Bell";
import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";
import "./topbar.css";

interface TopbarProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  navOpen: boolean;
  onMenu: () => void;
}

export default function Topbar({ setIsLoggedIn, navOpen, onMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" aria-label="Menu" aria-expanded={navOpen} aria-controls="app-sidebar" onClick={onMenu}>
        <MdMenu aria-hidden="true" />
      </button>
      <GlobalSearch />
      <div className="topbar__right">
        <Bell />
        <UserMenu setIsLoggedIn={setIsLoggedIn} />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Replace `src/components/Header/topbar.css`**

This replaces both the old `topbar.css` and the topbar rules removed from `sidebar.css`. The search input class is renamed `topbar__search` because `Pages/Users/users.css` also defines a global `.search` that used to restyle it.

```css
.topbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-5);
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
}

.topbar__menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  font-size: 22px;
  cursor: pointer;
}

.topbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Search */
.searchWrap {
  position: relative;
  flex: 1;
  max-width: 420px;
  min-width: 0;
}

.topbar__search {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font: inherit;
}

.topbar__search:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.searchResults {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  max-height: 70vh;
  overflow-y: auto;
  padding: var(--space-1) 0;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.searchResults__group { padding: 6px var(--space-3) 2px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gray-500); }
.searchResults__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  padding: 7px var(--space-3);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
}
.searchResults__item span { font-size: var(--text-xs); color: var(--gray-500); }
.searchResults__item:hover, .searchResults__item:focus-visible { background: var(--color-primary-bg); outline: none; }
.searchResults__note { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); color: var(--gray-500); }

/* Bell */
.bell { position: relative; }
.iconBtn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  font-size: 20px;
  color: var(--gray-700);
  cursor: pointer;
}
.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: var(--white);
  font-size: 11px;
  font-weight: 700;
}
.bell__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: var(--z-dropdown);
  min-width: 250px;
  padding: 6px 0;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.bell__title { padding: 6px 14px; font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; color: var(--gray-500); }
.bell__row { display: block; width: 100%; padding: var(--space-2) 14px; background: none; border: none; cursor: pointer; text-align: left; font: inherit; font-size: var(--text-base); }
.bell__row:hover, .bell__row:focus-visible { background: var(--color-primary-bg); outline: none; }
.bell__note { padding: var(--space-2) 14px; font-size: var(--text-sm); color: var(--gray-500); }

/* User menu */
.user { position: relative; }
.user__trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: var(--white);
  font: inherit;
  cursor: pointer;
}
.user__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-primary-solid);
  color: var(--white);
  font-size: var(--text-sm);
  font-weight: 700;
}
.user__name { font-size: var(--text-sm); font-weight: 600; }
.user__caret { color: var(--gray-500); font-size: 20px; }
.user__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--z-dropdown);
  min-width: 150px;
  overflow: hidden;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.dropdown__item {
  width: 100%;
  padding: 10px var(--space-4);
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
  cursor: pointer;
}
.dropdown__item:hover { background: var(--gray-50); }

@media (max-width: 1024px) {
  .topbar { padding: 0 var(--space-3); }
  .topbar__menu { display: inline-flex; }
}

@media (max-width: 640px) {
  .user__name, .user__caret { display: none; }
}
```

- [ ] **Step 5: Use `useDismiss` and the icon in `Bell.tsx`**

In `src/components/Header/Bell.tsx`:

Replace `import { useEffect, useRef, useState } from "react";` with
```tsx
import { useRef, useState } from "react";
import { MdNotificationsNone } from "react-icons/md";
```

Replace `import { useAttention } from "../../hooks/useAttention";` with
```tsx
import { useAttention } from "../../hooks/useAttention";
import { useDismiss } from "../../hooks/useDismiss";
```

Replace this block:

```tsx
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
```

with

```tsx
  useDismiss(open, box, () => setOpen(false));
```

Replace the `🔔` line (the text `        🔔` inside the button) with
```tsx
        <MdNotificationsNone aria-hidden="true" />
```

- [ ] **Step 6: Use `useDismiss` and the new class in `GlobalSearch.tsx`**

In `src/components/Header/GlobalSearch.tsx`:

Replace `import { useEffect, useRef, useState } from "react";` with `import { useRef, useState } from "react";`

Replace `import { useGlobalSearch } from "../../hooks/useGlobalSearch";` with
```tsx
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { useDismiss } from "../../hooks/useDismiss";
```

Replace the same `useEffect` block as in Bell (identical text) with
```tsx
  useDismiss(open, box, () => setOpen(false));
```

Replace `        className="search"` with `        className="topbar__search"`.

- [ ] **Step 7: Verify**

Run: `npx tsc -b` then `npx eslint src/hooks/useDismiss.ts src/components/Header src/components/Sidebar src/layouts`
Expected: no output.

Desktop (1440×900, `/orders`): screenshot. Expected: sidebar with groups on the left, topbar with search left and a bell plus avatar (letter "B") on the right, no hamburger. Click the avatar: a "Log out" panel opens; click elsewhere or press Escape: it closes. Click the bell: the panel lists "3 customers awaiting approval" etc.

Tablet and phone (390×800, `/orders`): screenshot. Expected: sidebar hidden, hamburger visible left of the search. Run `browser_evaluate`: `() => getComputedStyle(document.getElementById("app-sidebar")).visibility` → `"hidden"`. Click the hamburger: the drawer slides in over a dim backdrop; run the same evaluate → `"visible"`; click "Users": navigation happens and the drawer closes; press the hamburger then Escape: it closes. Also `() => document.documentElement.scrollWidth <= window.innerWidth` → `true`.

- [ ] **Step 8: Commit Tasks 7 and 8 together**

```bash
git add src/layouts src/components/Sidebar src/components/Header src/hooks/useDismiss.ts
git commit -m "$(cat <<'EOF'
feat(ui): grouped sidebar, drawer below 1024px and accessible topbar

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Migrate Orders onto the kit (the pilot)

**Files:**
- Modify: `src/hooks/useOrders.ts`
- Rewrite: `src/Pages/orders/Orders.tsx`
- Delete: `src/Pages/orders/orders.css`

**Interfaces:**
- Consumes: everything exported from `src/components/ui`; `ConfirmDialog` with `tone`; `Modal`.
- Changes: `useOrders().sendReminders` now returns `Promise<string | null>` (the summary message on success, `null` on failure with the error left in `error`). `reminderResult` and `dismissReminderResult` are removed; the page shows the summary as a toast.

- [ ] **Step 1: Edit `src/hooks/useOrders.ts`**

Remove this line:

```ts
    const [reminderResult, setReminderResult] = useState("");
```

Replace

```ts
        reminderResult,
        sendReminders: async () => {
            try {
                const r = await notifyUnpaid(selected);
                const parts = [`Reminder sent to ${r.sent} customer${r.sent === 1 ? "" : "s"}`];
                if (r.no_device) parts.push(`${r.no_device} ha${r.no_device === 1 ? "s" : "ve"} no device registered`);
                if (r.nothing_unpaid) parts.push(`${r.nothing_unpaid} had nothing unpaid`);
                if (r.failed) parts.push(`${r.failed} failed`);
                setReminderResult(parts.join(", ") + ".");
                setActionError("");
                setSelected([]);
            } catch (e) {
                setActionError(e instanceof Error ? e.message : "Could not send the reminders");
            }
        },
        dismissReminderResult: () => setReminderResult(""),
```

with

```ts
        /** Resolves to a one-line summary on success, or null on failure (the reason is in `error`). */
        sendReminders: async (): Promise<string | null> => {
            try {
                const r = await notifyUnpaid(selected);
                const parts = [`Reminder sent to ${r.sent} customer${r.sent === 1 ? "" : "s"}`];
                if (r.no_device) parts.push(`${r.no_device} ha${r.no_device === 1 ? "s" : "ve"} no device registered`);
                if (r.nothing_unpaid) parts.push(`${r.nothing_unpaid} had nothing unpaid`);
                if (r.failed) parts.push(`${r.failed} failed`);
                setActionError("");
                setSelected([]);
                return parts.join(", ") + ".";
            } catch (e) {
                setActionError(e instanceof Error ? e.message : "Could not send the reminders");
                return null;
            }
        },
```

- [ ] **Step 2: Replace `src/Pages/orders/Orders.tsx`**

```tsx
import { useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import { Alert, Badge, Button, Card, DataTable, Field, FilterBar, PageHeader, useToast } from "../../components/ui";
import type { BadgeTone, Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { NEXT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "../../types/orders";

const STATUSES: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];
const label = (s: string) => s.replace("_", " ");

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  preparing: "info",
  delivering: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  delivery_failed: "danger",
};
const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = { pending: "warning", paid: "success", unpaid: "danger", ignored: "neutral" };

export default function OrdersPage() {
  const o = useOrders();
  const toast = useToast();
  const [editing, setEditing] = useState<Order | null>(null);
  const [next, setNext] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [confirmingReminder, setConfirmingReminder] = useState(false);

  const openStatus = (order: Order) => {
    setNext(NEXT_STATUSES[order.status]?.[0] ?? "");
    setReason("");
    setEditing(order);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && next && (await o.setStatus(editing, next, reason.trim() || undefined))) {
      setEditing(null);
      toast.show("Order updated");
    }
  };
  const pay = async (order: Order, status: PaymentStatus) => {
    if (await o.setPayment(order, status)) toast.show(`Marked ${status}`);
  };
  const sendReminders = async () => {
    setConfirmingReminder(false);
    const summary = await o.sendReminders();
    if (summary) toast.show(summary);
  };

  const unpaidOnly = o.filters.payment_status === "unpaid";
  const nextOptions = (editing && NEXT_STATUSES[editing.status]) || [];

  const selectColumn: Column<Order> = {
    key: "select",
    label: "Select",
    mobile: "select",
    header: (
      <input
        type="checkbox"
        aria-label="Select all customers on this page"
        checked={o.orders.length > 0 && o.orders.every((r) => o.selected.includes(r.customer_id))}
        onChange={(e) => o.selectPage(e.target.checked)}
      />
    ),
    cell: (r) => (
      <input
        type="checkbox"
        aria-label={`Select ${r.customer_name ?? r.customer_id}`}
        checked={o.selected.includes(r.customer_id)}
        onChange={() => o.toggleCustomer(r.customer_id)}
      />
    ),
  };
  const columns: Column<Order>[] = [
    ...(unpaidOnly ? [selectColumn] : []),
    { key: "id", label: "Order", mobile: "title", cell: (r) => <span className="ui-mono">{r.id}</span> },
    { key: "customer", label: "Customer", cell: (r) => r.customer_name ?? r.customer_id.slice(0, 8) },
    { key: "area", label: "Area", cell: (r) => o.areaName(r.area_id) },
    { key: "items", label: "Items", cell: (r) => r.order_items.reduce((n, i) => n + i.quantity, 0) },
    { key: "total", label: "Total", cell: (r) => formatMoney(Number(r.total_price)) },
    { key: "status", label: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{label(r.status)}</Badge> },
    { key: "payment", label: "Payment", cell: (r) => <Badge tone={PAYMENT_TONE[r.payment_status]}>{r.payment_status}</Badge> },
    { key: "created", label: "Created", nowrap: true, cell: (r) => formatDateTime(r.created_at) },
    {
      key: "actions",
      label: "Actions",
      mobile: "actions",
      nowrap: true,
      cell: (r) => (
        <div className="ui-actions">
          {NEXT_STATUSES[r.status] && <Button size="sm" onClick={() => openStatus(r)}>Update status</Button>}
          {r.payment_status === "paid" ? (
            <Button size="sm" onClick={() => pay(r, "unpaid")}>Mark unpaid</Button>
          ) : (
            r.status !== "cancelled" && <Button size="sm" variant="primary" onClick={() => pay(r, "paid")}>Mark paid</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`Refreshes every 30s${o.updatedAt ? ` · updated ${o.updatedAt.toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" })}` : ""}`}
      />

      <FilterBar label="Order filters">
        <select value={o.filters.status} onChange={(e) => o.setFilter("status", e.target.value as OrderStatus | "")} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={o.filters.payment_status} onChange={(e) => o.setFilter("payment_status", e.target.value as PaymentStatus | "")} aria-label="Payment">
          <option value="">All payments</option>
          {PAYMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={o.filters.area_id} onChange={(e) => o.setFilter("area_id", e.target.value)} aria-label="Area">
          <option value="">All areas</option>
          {o.areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
        </select>
        <input type="search" placeholder="Order id…" value={o.filters.q} onChange={(e) => o.setFilter("q", e.target.value.trim())} aria-label="Order id" />
        <label>
          From <input type="date" value={o.filters.from} max={o.filters.to || undefined} onChange={(e) => o.setFilter("from", e.target.value)} />
        </label>
        <label>
          To <input type="date" value={o.filters.to} min={o.filters.from || undefined} onChange={(e) => o.setFilter("to", e.target.value)} />
        </label>
        <Button aria-pressed={unpaidOnly} onClick={() => o.setFilter("payment_status", unpaidOnly ? "" : "unpaid")}>
          Unpaid only
        </Button>
        {unpaidOnly && (
          <Button variant="primary" disabled={o.selected.length === 0} onClick={() => setConfirmingReminder(true)}>
            {o.selected.length === 0 ? "Notify customers" : `Notify ${o.selected.length} customer${o.selected.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </FilterBar>
      {(o.filters.from === "") !== (o.filters.to === "") && <Alert tone="warning">Pick both dates to filter by date.</Alert>}

      <Card flush>
        <DataTable
          columns={columns}
          rows={o.orders}
          rowKey={(r) => r.id}
          loading={!o.loaded}
          error={editing ? null : o.error}
          emptyTitle="No orders found"
        />
      </Card>

      <div className="ui-actions" style={{ justifyContent: "flex-end", alignItems: "center" }}>
        <Button disabled={o.page === 0} onClick={() => o.setPage(o.page - 1)}>Previous</Button>
        <span>Page {o.page + 1}</span>
        <Button disabled={!o.hasNext} onClick={() => o.setPage(o.page + 1)}>Next</Button>
      </div>

      <ConfirmDialog
        open={confirmingReminder}
        title="Send payment reminders"
        message={`Send a payment reminder to ${o.selected.length} customer${o.selected.length === 1 ? "" : "s"}? Each gets one push with their unpaid total. Customers without the app installed will not receive it.`}
        confirmLabel="Send"
        tone="primary"
        onCancel={() => setConfirmingReminder(false)}
        onConfirm={sendReminders}
      />

      <Modal open={!!editing} title={`Update ${editing?.id ?? ""}`} onClose={() => setEditing(null)}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="New status">
            <select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} required>
              {nextOptions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </Field>
          {next === "delivery_failed" && (
            <Field label="Failure reason (required)">
              <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Field>
          )}
          {o.error && <Alert>{o.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Delete the old stylesheet**

Run: `git rm src/Pages/orders/orders.css`
Then: `grep -rn "orders.css" src` → expected: no output.

- [ ] **Step 4: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/Pages/orders src/hooks/useOrders.ts`
Expected: no output.

- [ ] **Step 5: Verify desktop behaviour (1440×900, `/orders`)**

Screenshot. Expected: page title "Orders" with the subtitle; a filter bar on one row; a card containing the table with coloured status and payment badges; ids in monospace; the "Mark paid" buttons green; the pager bottom-right.

Then click the "Unpaid only" button (get the ref with `browser_snapshot`). Expected: the URL stays `/orders`; the button shows as pressed (amber); a checkbox column and a "Notify customers" button appear; only unpaid rows remain. Tick two rows; the button reads "Notify 2 customers". Click it: a confirm dialog opens with a **green** "Send" button (not red). Press Cancel.

Click "Update status" on a pending order: the modal shows a labelled "New status" select. Cancel.

- [ ] **Step 6: Verify phone behaviour (390×800, `/orders`)**

Screenshot. Expected: each order is a card (id as heading, customer, area, items, total, status, payment, created as label/value rows, the action buttons at the bottom); the filter controls fill the width; no horizontal scrollbar. Run `browser_evaluate`: `() => document.documentElement.scrollWidth <= window.innerWidth` → `true`. Open "Update status": the modal is a bottom sheet with stacked full-width buttons.

- [ ] **Step 7: Check the error path**

Run `browser_run_code_unsafe` with `async (page) => { await page.unroute(/localhost:400\d\/api/); await page.route(/localhost:400\d\/api/, (r) => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Boom" }) })); await page.goto("http://localhost:5173/orders"); await page.waitForTimeout(800); return await page.locator('[role="alert"]').first().innerText(); }`
Expected: returns `Boom`, shown in a red alert inside the card with no table. Restore the stubs afterwards by re-running `docs/superpowers/ui-baseline/setup.js` in a fresh page (or reload the browser session).

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useOrders.ts src/Pages/orders
git commit -m "$(cat <<'EOF'
refactor(ui): move Orders onto the ui kit

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Document the conventions, run the final checks, take "after" shots

**Files:**
- Modify: `docs/ADMIN-PLAN.md`, `docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md`
- Create: `docs/superpowers/ui-baseline/after/*.png` (not committed)

- [ ] **Step 1: Add the UI kit convention to `docs/ADMIN-PLAN.md`**

Replace the text `**Auth and roles.**` (it appears once, at the start of a paragraph in "Conventions") with:

```
**UI kit.** New and migrated pages use `src/components/ui` (`import { Button, Badge, Card, PageHeader, FilterBar, Field, DataTable, Alert, EmptyState, Spinner, useToast } from "../../components/ui"`). Colours, spacing and type come from the tokens in `src/styles/variables.css`; never write a hex value in a page stylesheet. Lists use `DataTable` (it becomes stacked cards on phones); errors use `Alert`; success feedback uses `useToast`; destructive confirms use `ConfirmDialog` (`tone="primary"` for non-destructive ones). Look at `src/Pages/orders/Orders.tsx` for the reference page, and at `/ui-kit` in `npm run dev` for every component. Pages not yet migrated still use their own CSS; see `docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md`.

**Auth and roles.**
```

- [ ] **Step 2: Record the deviations in the spec**

Run:

```bash
cat >> docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md <<'EOF'

## Amendments (2026-10-18, while writing the foundation plan)

- Filled buttons use `#15803d` (`--color-primary-solid`); the brand green `#16a34a` stays for accents, icons and focus. Reason: `#16a34a` with white text is 3.3:1, below WCAG AA (4.5:1).
- `Skeleton` is not built; `Spinner` covers loading until a page needs more.
- `Tabs` is built with its first consumer (the Users page) in the next plan, not in the foundation.
- `Alert` is added to the kit; it replaces `.sectionNote` and the bare `<p role="alert">` and is used by `DataTable`.
- On phones the global search shrinks to the available width instead of collapsing to an icon.
- The user menu uses the disclosure pattern (button plus panel; Escape and outside click close it). It has one item, so arrow-key menu navigation is not needed.
- Plan 1 (`docs/superpowers/plans/2026-10-18-admin-ui-foundation.md`) covers Phases 0, 1, 2 and the Orders pilot. Plan 2 covers the remaining page migrations and Phase 4.
EOF
```

- [ ] **Step 3: Run the mechanical checks**

Run each; expected results in the comments.

```bash
npx tsc -b                      # no output
npx eslint src                  # no output (the repo had one setState-in-effect lint error before; if eslint reports only errors in files this plan did not touch, list them in the report and do not fix them here)
grep -rnE "#[0-9a-fA-F]{3,8}\b" src/components/ui src/layouts src/components/Sidebar src/components/Header src/components/common/modal.css src/Pages/UiKit src/Pages/orders src/styles/global.css src/index.css   # no output
grep -rn "orders.css" src       # no output
npm run build                   # completes with no errors
```

- [ ] **Step 4: Take the "after" screenshots**

Edit `docs/superpowers/ui-baseline/shots.js`: change the `OUT` path's final segment from `before` to `after`. Run `mkdir -p docs/superpowers/ui-baseline/after`. Call `browser_run_code_unsafe` with `filename: "docs/superpowers/ui-baseline/shots.js"` (run `setup.js` first if this is a fresh browser session). Then change `OUT` back to `before` so the file matches what is committed.

Read `orders-desktop.png`, `orders-mobile.png`, `users-desktop.png` and `dashboard-mobile.png` from `after/` and compare with `before/`. Expected: Orders is visibly standardized on both sizes; every page now has the grouped sidebar, the hamburger and drawer on mobile, and green modal buttons; the unmigrated pages (Users, Dashboard and the rest) still use their own page styling inside the new shell. List any page that looks broken by the shell change (for example a page with its own `padding` doubling up with `.main`'s padding) so plan 2 can fix it.

- [ ] **Step 5: Commit**

```bash
git add docs/ADMIN-PLAN.md docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md docs/superpowers/ui-baseline/shots.js
git commit -m "$(cat <<'EOF'
docs: document the ui kit convention and record spec amendments

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Plan 2 (to be written after this plan lands)

Migrate, one commit per page with its old CSS deleted: Users (build `Tabs` here), Dashboard, Delivery Areas, Sessions, Food Items, Notices (replace both `window.confirm` calls with `ConfirmDialog`), Delivery Persons, Admins, Reports, Audit Logs, Settings, Login and the password-reset pages. Then Phase 4: remove the legacy `.modal__btn*` classes and the legacy `--primary-color` aliases, merge `components/common/Icons.tsx` into `react-icons`, add labels to every form, and finish with the full-app checks from the spec (zero hex outside `variables.css`, zero cross-page CSS imports, one button, one table, zero `window.confirm`, Lighthouse accessibility 95 or higher).
