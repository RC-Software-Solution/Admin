# Admin Dashboard and Users (Plan 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Dashboard (attention-first strip, KPI panel, orders-by-session chart, top items, areas) and the Users page (status chips, search, ruled customer rows, profile drawer) onto the approved visual identity, matching `docs/superpowers/mockups/png/dashboard-*.png` and `users-*.png`.

**Architecture:** Plans 1 and 2 shipped the tokens, the UI kit in `src/components/ui` and the shell; Orders is the reference page. This plan adds the few kit pieces these two pages need (`Avatar`, `Segmented`, `SearchField`, `Drawer`, a `hide` slot for `DataTable`), restyles the shared `RangeFilters` (also used by Reports), then rebuilds Dashboard and Users on the kit. No data hooks change except one `loaded` flag in `useUsers`. Page-specific pieces live next to their page (`src/Pages/Dashboard`, `src/Pages/Users`); only generic pieces go in the kit.

**Tech Stack:** React 19, TypeScript 5.9 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 7, react-router-dom 7, react-icons 5.5 (`react-icons/lu`). No test framework: verification is `npx tsc -b`, `npx eslint`, a throwaway `node` check for the one pure-logic file, and headless-browser measurements against stubbed API responses.

**Spec:** `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md` (palette, type, shape, "Data the mockups imply that the app does not have yet"). Visual reference: `docs/superpowers/mockups/admin-ui-mockups.html` and `docs/superpowers/mockups/png/` (open `dashboard-desktop.png`, `dashboard-mobile.png`, `users-desktop.png`, `users-profile-desktop.png`, `users-mobile.png`). Earlier plans: `docs/superpowers/plans/2026-10-18-admin-visual-identity.md` (executed; its Orders page is the pattern to follow).

**Scope note:** Dashboard and Users only. Do not touch other pages. `src/Pages/Dashboard/dashboard.css` stays exactly as it is: Reports, Audit Logs and Settings still import it. Plan 4 migrates the rest and removes the leftovers.

## Global Constraints

- Admin repo root is `C:\Users\budglk\RC\Admin`; run every command from there (Git Bash: `cd /c/Users/budglk/RC/Admin`). Work on branch `feat/identity-dashboard-users`.
- No new npm dependencies and no `npm install` (the working tree has an unrelated uncommitted `package-lock.json` change that must stay untouched).
- No hex colours (`#rgb`/`#rrggbb`) outside `src/styles/variables.css` in any file this plan creates or rewrites. Everything else uses `var(--token)`. (The one place hex is allowed in this plan is the fixtures file under `docs/`, which contains none either.)
- Kit class names all start with `ui-`; page-local classes use the page prefix (`dash-`, `cust-`).
- Palette (values copied from the spec): Tea `#123524`, Leaf `#16803c`, Paper `#f3f5f0`, Ink `#18241d`, Mist `#5c6b61`, Turmeric `#e0a100` (text on it `#6b4b00`), Brick `#b3362a`, Mint `#8fd0a8`.
- Type: Bricolage Grotesque (headings, big numbers) and IBM Plex Sans (everything else); sentence-case labels, no all-caps labels.
- Radii: 4px badges, 6px controls, 10px floating things and panels, 999px chips and the user pill (use `--radius-sm|md|lg|full`).
- Breakpoints are 640px (phone) and 1024px (drawer); write the literals in media queries. Sidebar width is 244px.
- **Box sizing:** the kit's `box-sizing: border-box` rule only matches elements that carry a `ui-` class. Any CSS rule that sets a width, height or min-height together with padding or a border on a bare `input`, `select`, `textarea` or any non-`ui-` element must set `box-sizing: border-box` itself. (Plans 1-2 shipped this bug three times.)
- Do not put data the app does not have into the UI: no "LKR outstanding" on the attention strip and no "blocked automatically at N" line in the profile (spec, "Data the mockups imply that the app does not have yet").
- TypeScript rules: `import type` for type-only imports, no enums or parameter properties, no unused locals or parameters. Lint rule `react-refresh/only-export-components`: a `.tsx` file exports components (and types) only.
- Imports are case-sensitive: the page directories are `src/Pages/Dashboard`, `src/Pages/Users` (capitalised) and `src/Pages/orders` (lowercase). Files are CRLF on Windows; ignore line-ending warnings.
- Commit one task at a time, staging only the files the task names by explicit path (never `git add -A`). End every commit message with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never commit `package-lock.json`, `.env`, `.superpowers/`, or the untracked `docs/superpowers/ui-baseline/after/` folder.
- Before claiming a task done: `npx tsc -b` prints nothing and `npx eslint <touched paths>` prints nothing.

## Verification tooling (read once)

The Vite dev server must be running at `http://localhost:5173` (`npm run dev`; if `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` is not `200`, start it in the background). The backend is not running, so browser checks use stubs: `docs/superpowers/ui-baseline/setup.js` (a fake `super_admin` session plus stubbed API answers) always runs first; from Task 2 on, `docs/superpowers/ui-baseline/setup-dashboard-users.js` (created in Task 2) runs second and adds the dashboard and customer data.

Run browser scripts with a headless runner. If the Playwright MCP tool `browser_run_code_unsafe` works in your session, use it; if it reports the browser is "already in use", use the standalone runner below and never close or kill another Edge process. A runner may already exist at `C:/Users/budglk/AppData/Local/Temp/claude/c--Users-budglk-RC-Admin/c8df9c45-d895-4918-82ed-3fe9da9176e5/scratchpad/pw/run.mjs`; if that folder is gone, recreate it:

```bash
mkdir -p "$SCRATCH/pw" && cd "$SCRATCH/pw" && npm init -y >/dev/null && npm install playwright-core --silent
```

where `$SCRATCH` is your scratchpad directory (that `npm install` runs outside the repo and is allowed). Save this as `$SCRATCH/pw/run.mjs` (it uses the installed Microsoft Edge):

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

Usage: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js [docs/superpowers/ui-baseline/setup-dashboard-users.js] "$SCRATCH/my-check.js"`. Each script file contains `async (page) => { ... }`; scripts run in order on one page, so list the stubs first. Write throwaway check scripts in `$SCRATCH`, not in the repo.

Lessons from plans 1-2 that apply to every browser check:

- The app shell scrolls inside `main.main`, so `fullPage: true` screenshots do not show page content. Take viewport screenshots; to see a tall page, first call `page.setViewportSize({ width, height: 2600 })` (the layout uses `100dvh`, so the whole page then fits the viewport).
- The kit `Menu` closes on any scroll, and Playwright auto-scrolls before a click; scroll the trigger into view and wait first.
- If Vite serves a stale or empty CSS/TS file right after you create or edit it, `touch` the file or restart the dev server, then re-measure.
- Look at every screenshot with the Read tool and compare it with the named mockup before claiming a visual match.

## File structure

Create:
- `src/components/ui/Avatar.tsx`, `Segmented.tsx`, `SearchField.tsx`, `Drawer.tsx`
- `src/Pages/Dashboard/dashboard.logic.ts`, `AttentionStrip.tsx`, `KpiPanel.tsx`, `SessionChart.tsx`, `TopItemsList.tsx`, `AreaList.tsx`, `overview.css`
- `src/Pages/Users/customerActions.ts`, `customers.css`, `CustomerDrawer.tsx`
- `docs/superpowers/ui-baseline/setup-dashboard-users.js`

Rewrite (whole file): `src/components/common/RangeFilters.tsx`, `src/Pages/Dashboard/Dashboard.tsx`, `src/Pages/Users/Users.tsx`.

Modify (small edits): `src/components/ui/ui.css` (appends), `src/components/ui/index.ts`, `src/components/ui/DataTable.tsx`, `src/Pages/UiKit/UiKit.tsx`, `src/hooks/useUsers.ts`, `src/types/users.ts`, `src/components/common/modal.css`, `docs/ADMIN-PLAN.md`.

Delete: `src/components/Cards/Card.tsx` (only the old Dashboard used it), `src/Pages/Users/users.css`.

## Decisions the mockups left open

Recorded here so reviewers do not re-litigate them:

1. The attention strip shows counts only, with a link to each list (spec: the amount outstanding is not available). A zero count shows no button. A count that could not be loaded shows "—".
2. The little bar chart under the Sales and Orders numbers shows **orders per day** (sum of the three sessions). Revenue per day from `sessions[*].totalRevenue` includes unpaid orders while the Sales number is paid-only, so charting it under that number would mislead. The chart carries a caption "Orders per day".
3. The Sales label reads "Sales (paid)" because the figure counts paid orders only.
4. The approved three-series colours (Turmeric, Leaf, Tea) fail the dataviz validator: Tea is below the lightness band and chroma floor, and Turmeric on white is 2.21:1. The palette is the user-approved identity, so it stays. The validator's required relief is supplied: an always-visible legend, a 2px gap between stacked segments, a per-column `title` tooltip with the numbers, and a visually hidden data table for screen readers.
5. Dates in subtitles use the app's `en-LK` day-first style ("12 Oct to 18 Oct"), not the mockup's "Oct 12".
6. The "Updated hh:mm · Refresh" line and the stale-data warning stay (existing behaviour) but move to the bottom of the page and into an `Alert`.
7. Only pending customers get the turmeric row edge; no row gets the brick edge.
8. In the profile drawer, an action (Approve, Reject, Disable, Enable, Unlock) closes the drawer and opens the existing confirmation dialog, so the profile is never stale behind a dialog.
9. The drawer's rejection, block and unpaid notices use `Alert tone="warning"` (a polite status announcement) rather than `danger` (which interrupts screen readers when the drawer opens).

---

### Task 1: Kit additions: Avatar, Segmented, SearchField, Drawer, DataTable `hide` slot

**Files:**
- Create: `src/components/ui/Avatar.tsx`, `src/components/ui/Segmented.tsx`, `src/components/ui/SearchField.tsx`, `src/components/ui/Drawer.tsx`
- Modify: `src/components/ui/ui.css` (one edit plus an append), `src/components/ui/DataTable.tsx`, `src/components/ui/index.ts`, `src/Pages/UiKit/UiKit.tsx`

**Interfaces:**
- Consumes: tokens from `src/styles/variables.css`; `react-icons/lu` (`LuSearch`, `LuX`).
- Produces (exact):
  - `Avatar({ name: string, size?: "sm" | "md" | "lg", square?: boolean, tone?: "leaf" | "turmeric" | "sky" | "brick" | "auto", src?: string | null })`. `sm` 30px, `md` 44px, `lg` 56px. `tone="auto"` picks a tone from the name; default is `leaf`. Decorative (`aria-hidden`).
  - `Segmented<T extends string>({ label: string, value: T, options: { value: T; label: string }[], onChange: (v: T) => void })`: a button group, selected state exposed as `aria-pressed`.
  - `SearchField({ label: string, ...InputHTMLAttributes (without type) })`: an input with a search icon; `label` is its accessible name.
  - `Drawer({ open: boolean, label: string, onClose: () => void, children })`: a right-hand panel built on native `<dialog>` (focus trap, Esc, backdrop click). Renders its own Close button at the top right; children are laid out in a padded grid, and the first child must leave 40px of right padding for the Close button.
  - `Column.mobile` gains `"hide"`: the cell is not shown on phones.
  - CSS helpers: `.ui-sr-only`, `.ui-section`, `.ui-section--first`, `.ui-section--sub`, `a.ui-btn` without underline, `.ui-btn svg` sized 18px.

- [ ] **Step 1: Create `src/components/ui/Avatar.tsx`**

```tsx
type Tone = "leaf" | "turmeric" | "sky" | "brick";
const TONES: Tone[] = ["leaf", "turmeric", "sky", "brick"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0])
    .join("")
    .toUpperCase();

// The same name always gets the same tone, so a colour follows the entity and not its position in a list
const toneOf = (name: string): Tone => TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  square?: boolean; // item thumbnails are rounded squares, people are circles
  tone?: Tone | "auto";
  src?: string | null; // a picture replaces the initials
}

/** Initials (or a picture) in a soft tile. Decorative: the name always sits beside it. */
export function Avatar({ name, size = "sm", square = false, tone = "leaf", src }: AvatarProps) {
  const t = tone === "auto" ? toneOf(name) : tone;
  const cls = ["ui-avatar", `ui-avatar--${size}`, `ui-avatar--${t}`, square && "ui-avatar--square"].filter(Boolean).join(" ");
  return src ? (
    <img className={cls} src={src} alt="" loading="lazy" />
  ) : (
    <span className={cls} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Segmented.tsx`**

```tsx
interface SegmentedProps<T extends string> {
  label: string; // names the group for screen readers
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** Picks one of a few views of the same data (a date range). Chips filter a list; this switches a range. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="ui-segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="ui-segmented__btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/SearchField.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";
import { LuSearch } from "react-icons/lu";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string; // accessible name; the placeholder is only a hint
}

/** A search box with the magnifier inside it. */
export function SearchField({ label, className, ...rest }: SearchFieldProps) {
  return (
    <div className={["ui-search", className].filter(Boolean).join(" ")}>
      <LuSearch aria-hidden="true" />
      <input type="search" aria-label={label} {...rest} />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/Drawer.tsx`**

```tsx
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { LuX } from "react-icons/lu";

interface DrawerProps {
  open: boolean;
  label: string; // names the panel for screen readers
  onClose: () => void;
  children: ReactNode;
}

/** A panel that slides in from the right (a profile, a detail view). Native <dialog>: focus trap, Esc and the backdrop come free. */
export function Drawer({ open, label, onClose, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-drawer"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // a click on the backdrop lands on the dialog element itself
    >
      {open && (
        <div className="ui-drawer__inner">
          <button type="button" className="ui-drawer__close" aria-label="Close" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
```

- [ ] **Step 5: Edit `src/components/ui/DataTable.tsx` (add the `hide` slot)**

Replace the line

```ts
  mobile?: "title" | "amount" | "select" | "inline" | "actions";
```

with

```ts
  mobile?: "title" | "amount" | "select" | "inline" | "actions" | "hide";
```

and replace the comment line `// side by side, actions come last. Omit for a label/value pair.` with `// side by side, actions come last, hide drops the cell on phones. Omit for a label/value pair.`

- [ ] **Step 6: Edit `src/components/ui/ui.css` (one line inside the phone block)**

Find this line inside the `@media (max-width: 640px)` DataTable block:

```css
  .ui-table td[data-slot="actions"] { flex: 1 1 auto; order: 3; flex-wrap: wrap; justify-content: flex-end; }
```

and add directly after it:

```css
  .ui-table td[data-slot="hide"] { display: none; }
```

- [ ] **Step 7: Append to the end of `src/components/ui/ui.css`**

```css

/* ===== Plan 3 additions: helpers, avatar, segmented control, search field, drawer ===== */
a.ui-btn { text-decoration: none; }
.ui-btn svg { flex: none; width: 18px; height: 18px; }
.ui-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ui-section { margin: 30px 0 12px; font-family: var(--font-head); font-size: 19px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
.ui-section--first { margin-top: 0; }
.ui-section--sub { font-size: 16px; }

/* Avatar: initials in a soft tile */
.ui-avatar { display: grid; place-items: center; flex: none; border-radius: 50%; object-fit: cover; font-family: var(--font-head); font-weight: 600; }
.ui-avatar--sm { width: 30px; height: 30px; font-size: 13px; }
.ui-avatar--md { width: 44px; height: 44px; font-size: 15px; font-weight: 700; }
.ui-avatar--lg { width: 56px; height: 56px; font-size: 20px; }
.ui-avatar--square { border-radius: var(--radius-md); }
.ui-avatar--leaf { background: var(--color-primary-bg); color: var(--tea); }
.ui-avatar--turmeric { background: var(--color-warning-bg); color: var(--color-warning-text); }
.ui-avatar--sky { background: var(--color-info-bg); color: var(--color-info-text); }
.ui-avatar--brick { background: var(--color-danger-bg); color: var(--color-danger-text); }

/* Segmented control: one range out of a few */
.ui-segmented { display: inline-flex; gap: 2px; max-width: 100%; padding: 3px; overflow-x: auto; background: var(--hover-wash); border-radius: var(--radius-lg); }
.ui-segmented__btn {
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  color: var(--gray-500);
  font: inherit;
  font-size: var(--text-base);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.ui-segmented__btn:hover { color: var(--ink); }
.ui-segmented__btn[aria-pressed="true"] { background: var(--white); color: var(--ink); box-shadow: var(--shadow-sm); }

/* Search field */
.ui-search { position: relative; flex: 1 1 260px; max-width: 360px; }
.ui-search svg { position: absolute; left: 12px; top: 50%; width: 18px; height: 18px; transform: translateY(-50%); color: var(--gray-500); pointer-events: none; }
.ui-search input {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 var(--space-3) 0 38px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.ui-search input:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: var(--focus-ring); }

/* Drawer: a right-hand panel on a native dialog */
.ui-drawer {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(520px, 100%);
  max-width: 100%;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  overflow-y: auto;
  background: var(--white);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
}
.ui-drawer::backdrop { background: var(--overlay); }
.ui-drawer__inner { position: relative; display: grid; gap: var(--space-6); align-content: start; padding: var(--space-6); }
.ui-drawer__close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  color: var(--gray-500);
  cursor: pointer;
}
.ui-drawer__close:hover { background: var(--hover-wash); color: var(--ink); }
.ui-drawer__close svg { width: 20px; height: 20px; }
@media (prefers-reduced-motion: no-preference) {
  .ui-drawer[open] { animation: ui-drawer-in 0.18s ease-out; }
  @keyframes ui-drawer-in { from { transform: translateX(24px); opacity: 0; } }
}
@media (max-width: 640px) {
  .ui-segmented { display: flex; }
  .ui-segmented__btn { flex: 1 0 auto; padding: 0 var(--space-3); }
  .ui-search { max-width: none; flex-basis: 100%; }
  .ui-search input { min-height: 44px; }
  .ui-drawer__inner { padding: var(--space-5) var(--space-4); }
}
```

- [ ] **Step 8: Edit `src/components/ui/index.ts`**

Append these lines (keep every existing export):

```ts
export { Avatar } from "./Avatar";
export { Segmented } from "./Segmented";
export { SearchField } from "./SearchField";
export { Drawer } from "./Drawer";
```

- [ ] **Step 9: Edit the gallery `src/Pages/UiKit/UiKit.tsx`**

(a) Replace the import on line 3 with:

```tsx
import { Alert, Avatar, Badge, Button, Card, Chip, Chips, DataTable, Drawer, EmptyState, Field, FilterBar, Menu, OrderTrack, PageHeader, PaymentMark, SearchField, Segmented, SelectionBar, Spinner, useToast } from "../../components/ui";
```

(b) In `COLUMNS`, insert this entry directly before the `{ key: "total", ...` entry (it proves the phone `hide` slot):

```tsx
  { key: "meal", label: "Meal", mobile: "hide", cell: () => "Lunch" },
```

(c) Directly after `const [bar, setBar] = useState(false);` add:

```tsx
  const [range, setRange] = useState("7d");
  const [drawer, setDrawer] = useState(false);
```

(d) Directly before `<Section title="DataTable">` insert:

```tsx
      <Section title="Avatars">
        <div className="ui-actions" style={{ gap: "var(--space-4)" }}>
          <Avatar name="Amaya Rathnayake" />
          <Avatar name="Amaya Rathnayake" size="lg" />
          <Avatar name="Chicken fried rice" size="md" square tone="auto" />
          <Avatar name="Vegetable kottu" size="md" square tone="auto" />
          <Avatar name="Egg hoppers" size="md" square tone="auto" />
          <Avatar name="Fish ambul thiyal" size="md" square tone="auto" />
        </div>
      </Section>
      <Section title="Segmented control and search field">
        <div className="ui-actions">
          <Segmented
            label="Example range"
            value={range}
            onChange={setRange}
            options={[
              { value: "today", label: "Today" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        <SearchField label="Search customers" placeholder="Search by name or email" />
      </Section>
      <Section title="Drawer">
        <div className="ui-actions">
          <Button onClick={() => setDrawer(true)}>Open drawer</Button>
        </div>
        <Drawer open={drawer} label="Example drawer" onClose={() => setDrawer(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", paddingRight: 40 }}>
            <Avatar name="Amaya Rathnayake" size="lg" />
            <h2 style={{ margin: 0 }}>Amaya Rathnayake</h2>
          </div>
          <p className="ui-hint">The drawer is a native dialog: Esc, the Close button or a click outside close it.</p>
        </Drawer>
      </Section>
```

- [ ] **Step 10: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit`. Expected: no output from either.

- [ ] **Step 11: Verify in the browser**

Write `$SCRATCH/kit3-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  await page.goto("http://localhost:5173/ui-kit");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const box = (sel, i = 0) => page.locator(sel).nth(i).boundingBox().then((b) => b && { w: Math.round(b.width), h: Math.round(b.height) });
  out.avatarCount = await page.locator(".ui-avatar").count();
  out.avatarSizes = { sm: await box(".ui-avatar--sm"), md: await box(".ui-avatar--md"), lg: await box(".ui-avatar--lg") };
  out.avatarTones = await page.locator(".ui-avatar--md").evaluateAll((els) => els.map((e) => [...e.classList].find((c) => /^ui-avatar--(leaf|turmeric|sky|brick)$/.test(c))));
  out.avatarInitials = await page.locator(".ui-avatar--lg").first().innerText();
  // segmented
  await page.getByRole("button", { name: "Last 30 days" }).click();
  out.seg = await page.locator(".ui-segmented [aria-pressed=true]").innerText();
  // search field
  const input = page.getByRole("searchbox", { name: "Search customers" });
  out.search = await input.evaluate((el) => ({ h: el.offsetHeight, padLeft: getComputedStyle(el).paddingLeft, boxSizing: getComputedStyle(el).boxSizing }));
  // drawer: open, measure, close three ways
  const dlg = page.locator("dialog.ui-drawer");
  await page.getByRole("button", { name: "Open drawer" }).click();
  out.drawerOpen = await dlg.evaluate((d) => d.open);
  const db = await dlg.boundingBox();
  out.drawer = { w: Math.round(db.width), rightEdge: Math.round(db.x + db.width), h: Math.round(db.height) };
  await page.screenshot({ path: S + "/kit3-drawer-desktop.png" });
  await page.keyboard.press("Escape");
  out.closedByEsc = !(await dlg.evaluate((d) => d.open));
  await page.getByRole("button", { name: "Open drawer" }).click();
  await page.mouse.click(10, 450);
  out.closedByBackdrop = !(await dlg.evaluate((d) => d.open));
  await page.getByRole("button", { name: "Open drawer" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  out.closedByButton = !(await dlg.evaluate((d) => d.open));
  // phone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  out.hiddenCellDisplay = await page.locator('td[data-slot="hide"]').first().evaluate((el) => getComputedStyle(el).display);
  out.segFull = await box(".ui-segmented");
  await page.getByRole("button", { name: "Open drawer" }).click();
  const pb = await dlg.boundingBox();
  out.drawerPhoneW = Math.round(pb.width);
  await page.screenshot({ path: S + "/kit3-drawer-mobile.png" });
  await page.keyboard.press("Escape");
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/kit3-check.js"`.
Expected: `avatarCount` 6; sizes `sm` 30x30, `md` 44x44, `lg` 56x56; `avatarTones` has only the four tone names (no `undefined`); `avatarInitials` `AR`; `seg` `Last 30 days`; `search` height 40, `padLeft` `38px`, `boxSizing` `border-box`; `drawerOpen` true; drawer `w` 520, `rightEdge` 1440, `h` 900; `closedByEsc`, `closedByBackdrop`, `closedByButton` all true; `hiddenCellDisplay` `none`; `drawerPhoneW` 390; `docWidth` 390. Read `kit3-drawer-desktop.png`: a white panel on the right with the Close button top right, over a Tea-tinted scrim, with the avatar and name in the header row. Read `kit3-drawer-mobile.png`: the panel fills the width. If the run reports a PAGEERROR, fix it before continuing.

- [ ] **Step 12: Commit**

```bash
git add src/components/ui/Avatar.tsx src/components/ui/Segmented.tsx src/components/ui/SearchField.tsx src/components/ui/Drawer.tsx src/components/ui/ui.css src/components/ui/DataTable.tsx src/components/ui/index.ts src/Pages/UiKit/UiKit.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add avatar, segmented control, search field, drawer and a phone hide slot

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Dashboard on the new identity

**Files:**
- Create: `docs/superpowers/ui-baseline/setup-dashboard-users.js`, `src/Pages/Dashboard/dashboard.logic.ts`, `src/Pages/Dashboard/AttentionStrip.tsx`, `src/Pages/Dashboard/KpiPanel.tsx`, `src/Pages/Dashboard/SessionChart.tsx`, `src/Pages/Dashboard/TopItemsList.tsx`, `src/Pages/Dashboard/AreaList.tsx`, `src/Pages/Dashboard/overview.css`
- Rewrite: `src/components/common/RangeFilters.tsx`, `src/Pages/Dashboard/Dashboard.tsx`
- Modify: `src/components/ui/ui.css` (append)
- Delete: `src/components/Cards/Card.tsx`

**Interfaces:**
- Consumes: Task 1 kit (`Avatar`, `Segmented`, `DataTable` with `mobile: "hide"`, `.ui-section`, `.ui-sr-only`); existing `useDashboard()` (`data`, `error`, `updatedAt`, `refresh`, `loading`, `range`, filters), `useAttention()` (`data: Attention | null`, `error`), `FilterBar`, `PageHeader`, `Alert`, `Button`, `Spinner`, `formatMoney(n: number | null)`, types from `src/types/dashboard.ts` and `src/types/attention.ts`.
- Produces:
  - `RangeFilters({ f, showRange?: boolean })` (default export, same props plus `showRange`, default `true`): Reports keeps calling it as `<RangeFilters f={r} />` and still sees the range text.
  - `dashboard.logic.ts` exports `MEALS`, `MAX_DAYS`, `DayBucket`, `listDays`, `bucketDays`, `heightPct`, `barLabel`, `trendOf`, `rangeDays`, `unitOf` (signatures below).
  - Page components: `AttentionStrip()`, `KpiPanel({ stats, unit, days })`, `SessionChart({ days })`, `TopItemsList({ items })`, `AreaList({ rows })`, all default exports.
  - `setup-dashboard-users.js`: a Playwright stub script used by Tasks 2 to 5 (runs after `setup.js`).

- [ ] **Step 1: Create the fixtures `docs/superpowers/ui-baseline/setup-dashboard-users.js`**

It answers `GET /analytics/dashboard` (echoing the requested range, area and session, as the real API does), `GET /users/customers` and `GET /users/customers/:id/profile`. Everything else falls back to `setup.js`.

```js
async (page) => {
  // [name, email, phone, area_id, customer_status, created_at]
  const people = [
    ["Amaya Rathnayake", "amaya.r@mail.lk", "077 412 8890", 1, "pending", "2026-10-18T02:42:00Z"],
    ["Kasun Madushanka", "kasun.m@mail.lk", "071 220 5513", 2, "pending", "2026-10-18T02:10:00Z"],
    ["Fathima Rizna", "rizna.f@mail.lk", "076 901 2244", 3, "pending", "2026-10-17T12:45:00Z"],
    ["Nimal Perera", "nimal.p@mail.lk", "077 100 2001", 1, "accepted", "2026-09-02T04:00:00Z"],
    ["Kumari Silva", "kumari.s@mail.lk", "071 100 2002", 2, "accepted", "2026-09-03T04:00:00Z"],
    ["Ruwan Fernando", "ruwan.f@mail.lk", "076 100 2003", 3, "accepted", "2026-09-04T04:00:00Z"],
    ["Dilani Jayasinghe", "dilani.j@mail.lk", "077 100 2004", 1, "accepted", "2026-09-05T04:00:00Z"],
    ["Chaminda Wickramasinghe", "chaminda.w@mail.lk", "071 100 2005", 2, "accepted", "2026-09-06T04:00:00Z"],
    ["Sanduni Rajapaksa", "sanduni.r@mail.lk", "076 100 2006", 3, "rejected", "2026-09-07T04:00:00Z"],
    ["Tharindu Bandara", "tharindu.b@mail.lk", "077 100 2007", 1, "disabled", "2026-09-08T04:00:00Z"],
    ["Anjali Gunawardena", "anjali.g@mail.lk", "071 100 2008", 2, "disabled", "2026-09-09T04:00:00Z"],
    ["Prasad Weerasinghe", "prasad.w@mail.lk", "076 100 2009", 3, "blocked", "2026-09-10T04:00:00Z"],
  ];
  const customers = people.map(([full_name, email, phone, area_id, customer_status, created_at], i) => ({
    id: `u${String(i + 1).padStart(7, "0")}-0000-0000-0000-000000000000`,
    full_name, email, phone,
    address: `${i + 10}/2, Galle Road, Colombo 0${(i % 3) + 3}`,
    area_id,
    approved: customer_status === "accepted",
    customer_status,
    rejection_reason: customer_status === "rejected" ? "Address is outside the delivery areas" : null,
    blocked_reason: customer_status === "blocked" ? "3 unpaid orders" : null,
    created_at,
  }));
  const profile = (c) => ({
    ...c,
    order_history: [
      { id: "ORD-20261016-0302", status: "delivered", payment_status: "unpaid", total_price: "595.00", meal_time: "lunch", created_at: "2026-10-16T05:30:00Z" },
      { id: "ORD-20261014-0211", status: "delivered", payment_status: "unpaid", total_price: "555.00", meal_time: "lunch", created_at: "2026-10-14T05:30:00Z" },
      { id: "ORD-20261012-0188", status: "completed", payment_status: "paid", total_price: "485.00", meal_time: "dinner", created_at: "2026-10-12T12:30:00Z" },
      { id: "ORD-20261010-0150", status: "cancelled", payment_status: "ignored", total_price: "320.00", meal_time: "breakfast", created_at: "2026-10-10T02:30:00Z" },
    ],
    status_log: [
      { id: 1, previous_status: null, new_status: "pending", reason: "Registered from the app", performed_by: null, created_at: c.created_at },
      ...(c.customer_status === "pending" ? [] : [{ id: 2, previous_status: "pending", new_status: c.customer_status, reason: c.rejection_reason ?? c.blocked_reason, performed_by: "admin", created_at: "2026-10-18T05:00:00Z" }]),
    ],
  });

  await page.route(/localhost:400\d\/api/, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.pathname.endsWith("/analytics/dashboard")) {
      const q = url.searchParams;
      const from = q.get("from");
      const to = q.get("to");
      const session = q.get("session");
      const days = [];
      for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) days.push(new Date(t).toISOString().slice(0, 10));
      const series = (base) =>
        days.map((date, i) => {
          const orderCount = base + ((i * 7) % 5) * 12;
          return { date, orderCount, totalRevenue: orderCount * 520 };
        });
      const all = { breakfast: series(40), lunch: series(80), dinner: series(25) };
      const sessions = Object.fromEntries(Object.entries(all).map(([m, rows]) => [m, !session || session === m ? rows : null]));
      const total = Object.values(sessions).flat().filter(Boolean).reduce((n, r) => n + r.orderCount, 0);
      return json({
        generatedAt: new Date().toISOString(),
        range: { from, to, prevFrom: from, prevTo: to, areaId: q.get("area_id"), session },
        stats: {
          sales: { value: Math.round(total * 520 * 0.9), prev: Math.round(total * 520 * 0.8), change: 12.4 },
          orders: { total, completed: Math.round(total * 0.96), prevTotal: Math.round(total * 0.9), change: 6.1 },
          blockedUsers: 2,
          unpaidOrders: 5,
        },
        sessions,
        topItems: [
          { food_name: "Chicken fried rice", total_quantity: 412, total_revenue: 247200, image_url: null },
          { food_name: "Vegetable kottu", total_quantity: 356, total_revenue: 160200, image_url: null },
          { food_name: "Rice and curry (veg)", total_quantity: 301, total_revenue: 150500, image_url: null },
          { food_name: "Egg hoppers (3)", total_quantity: 244, total_revenue: 73200, image_url: null },
          { food_name: "Fish ambul thiyal", total_quantity: 198, total_revenue: 138600, image_url: null },
        ],
        areas: [
          { area_id: 1, area_name: "Colombo 03", orderCount: 512, totalRevenue: 612300, completedCount: 497 },
          { area_id: 2, area_name: "Nugegoda", orderCount: 388, totalRevenue: 441800, completedCount: 365 },
          { area_id: 3, area_name: "Dehiwala", orderCount: 242, totalRevenue: 230400, completedCount: 220 },
        ],
        errors: [],
      });
    }
    if (url.pathname.endsWith("/users/customers")) return json(customers);
    const m = url.pathname.match(/\/users\/customers\/([^/]+)\/profile$/);
    if (m) {
      const c = customers.find((x) => x.id === m[1]);
      return json(c ? profile(c) : {});
    }
    return route.fallback();
  });
  return "dashboard and customer fixtures";
}
```

- [ ] **Step 2: Write the failing logic check (outside the repo)**

`dashboard.logic.ts` is the only pure-logic file in this plan, so it gets a real check. Write `$SCRATCH/dashboard-logic-check.mjs` (Node 24 runs `.ts` files directly because the file uses only erasable TypeScript syntax and type-only imports):

```js
import assert from "node:assert/strict";
import { listDays, bucketDays, heightPct, barLabel, trendOf, rangeDays, unitOf, MEALS } from "file:///C:/Users/budglk/RC/Admin/src/Pages/Dashboard/dashboard.logic.ts";

assert.deepEqual(MEALS, ["breakfast", "lunch", "dinner"]);

// listDays: inclusive, crosses a month end, empty when from is after to
assert.deepEqual(listDays("2026-10-30", "2026-11-02"), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
assert.deepEqual(listDays("2026-10-18", "2026-10-18"), ["2026-10-18"]);
assert.deepEqual(listDays("2026-10-02", "2026-10-01"), []);

// rangeDays / unitOf
assert.equal(rangeDays("2026-10-12", "2026-10-18"), 7);
assert.equal(rangeDays("2026-10-18", "2026-10-18"), 1);
assert.equal(unitOf(1), "day");
assert.equal(unitOf(7), "7 days");

// bucketDays: fills missing days with 0, null meal lists count as 0, totals add up
const sessions = {
  breakfast: [{ date: "2026-10-12", orderCount: 3, totalRevenue: 100 }],
  lunch: [{ date: "2026-10-12", orderCount: 5, totalRevenue: 200 }, { date: "2026-10-14", orderCount: 2, totalRevenue: 80 }],
  dinner: null,
};
const b = bucketDays(["2026-10-12", "2026-10-13", "2026-10-14"], sessions);
assert.deepEqual(b.map((d) => d.total), [8, 0, 2]);
assert.deepEqual(b[0].orders, { breakfast: 3, lunch: 5, dinner: 0 });
assert.deepEqual(b[1].orders, { breakfast: 0, lunch: 0, dinner: 0 });

// heightPct: zero stays zero, tiny non-zero values stay visible, max is 100
assert.equal(heightPct(0, 10), 0);
assert.equal(heightPct(5, 0), 0);
assert.equal(heightPct(10, 10), 100);
assert.equal(heightPct(1, 1000), 2);
assert.equal(heightPct(5, 10), 50);

// barLabel: weekday up to 14 bars; day number every 5th bar beyond that
assert.equal(barLabel("2026-10-12", 7, 0), "Mon");
assert.equal(barLabel("2026-10-18", 7, 6), "Sun");
assert.equal(barLabel("2026-10-12", 30, 0), "12");
assert.equal(barLabel("2026-10-13", 30, 1), "");
assert.equal(barLabel("2026-10-17", 30, 5), "17");
assert.equal(barLabel("2026-10-05", 30, 10), "5");

// trendOf
assert.deepEqual(trendOf(12.4, "7 days"), { text: "Up 12.4% on the previous 7 days", tone: "up" });
assert.deepEqual(trendOf(-3, "day"), { text: "Down 3% on the previous day", tone: "down" });
assert.deepEqual(trendOf(0, "7 days"), { text: "Same as the previous 7 days", tone: "flat" });
assert.deepEqual(trendOf(null, "7 days"), { text: "No data in the previous 7 days", tone: "flat" });
assert.deepEqual(trendOf(undefined, "7 days"), { text: "No data in the previous 7 days", tone: "flat" });

console.log("dashboard.logic OK");
```

Run: `node "$SCRATCH/dashboard-logic-check.mjs"`. Expected: it FAILS (the module does not exist yet, `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 3: Create `src/Pages/Dashboard/dashboard.logic.ts`**

```ts
import type { MealType, SessionDay } from "../../types/dashboard";

export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

// ponytail: a custom range longer than this charts only its last MAX_DAYS days (the bars would be sub-pixel); the KPI numbers still cover the whole range. Raise it or aggregate by week if long ranges matter.
export const MAX_DAYS = 62;

export interface DayBucket {
  date: string; // YYYY-MM-DD, Sri Lanka calendar day
  orders: Record<MealType, number>;
  total: number;
}

/** Every calendar day from `from` to `to`, inclusive (empty when `from` is after `to`). Pure date arithmetic, no timezone involved. */
export function listDays(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`); t <= end; t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** One bucket per day with that day's orders for each meal. Days and meals the API sent nothing for count as 0. */
export function bucketDays(days: string[], sessions: Record<MealType, SessionDay[] | null>): DayBucket[] {
  return days.map((date) => {
    const orders: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const m of MEALS) orders[m] = sessions[m]?.find((s) => s.date === date)?.orderCount ?? 0;
    return { date, orders, total: orders.breakfast + orders.lunch + orders.dinner };
  });
}

/** Bar height as a percentage of the tallest bar; a non-zero value never rounds away to nothing. */
export const heightPct = (value: number, max: number) => (value <= 0 || max <= 0 ? 0 : Math.max(2, (value / max) * 100));

/** Axis label under a bar: weekday for up to 14 bars, otherwise the day of the month on every 5th bar only. */
export function barLabel(date: string, count: number, index: number): string {
  if (count <= 14) return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  return index % 5 === 0 ? String(Number(date.slice(8))) : "";
}

export interface Trend {
  text: string;
  tone: "up" | "down" | "flat";
}

/** "Up 12.4% on the previous 7 days". `change` is null when the previous range had nothing to compare. */
export const trendOf = (change: number | null | undefined, unit: string): Trend =>
  change === null || change === undefined ? { text: `No data in the previous ${unit}`, tone: "flat" }
  : change === 0 ? { text: `Same as the previous ${unit}`, tone: "flat" }
  : { text: `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on the previous ${unit}`, tone: change > 0 ? "up" : "down" };

export const rangeDays = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;

export const unitOf = (days: number) => (days === 1 ? "day" : `${days} days`);
```

- [ ] **Step 4: Run the logic check to verify it passes**

Run: `node "$SCRATCH/dashboard-logic-check.mjs"`. Expected: prints `dashboard.logic OK` (an `ExperimentalWarning` about type stripping is fine). If the weekday assertions fail because of locale data, report the actual output instead of editing the check.

- [ ] **Step 5: Rewrite `src/components/common/RangeFilters.tsx`**

```tsx
import { FilterBar, Segmented } from "../ui";
import type { useRangeFilters, Preset } from "../../hooks/useRangeFilters";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Preset / custom range, area and session pickers, shared by the Dashboard and Reports. */
export default function RangeFilters({ f, showRange = true }: { f: ReturnType<typeof useRangeFilters>; showRange?: boolean }) {
  const rangeLabel = f.range.from === f.range.to ? day(f.range.from) : `${day(f.range.from)} – ${day(f.range.to)}`;
  return (
    <FilterBar label="Range, area and session">
      <Segmented label="Range" value={f.preset} options={PRESETS} onChange={f.setPreset} />
      {f.preset === "custom" && (
        <>
          <label>
            From <input type="date" value={f.custom.from} max={f.custom.to} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, from: e.target.value })} />
          </label>
          <label>
            To <input type="date" value={f.custom.to} min={f.custom.from} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, to: e.target.value })} />
          </label>
        </>
      )}
      <select aria-label="Area" value={f.areaId} onChange={(e) => f.setAreaId(e.target.value)}>
        <option value="">All areas</option>
        {f.areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
      </select>
      <select aria-label="Session" value={f.session} onChange={(e) => f.setSession(e.target.value as typeof f.session)}>
        <option value="">All sessions</option>
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
      {showRange && <span className="ui-filterbar__note">{rangeLabel}</span>}
    </FilterBar>
  );
}
```

Append to the end of `src/components/ui/ui.css`:

```css

/* FilterBar inside a page header (Dashboard range controls) and the range note next to the filters */
.ui-pageheader .ui-filterbar { margin-bottom: 0; }
.ui-filterbar__note { color: var(--gray-500); font-size: var(--text-sm); }
```

- [ ] **Step 6: Create `src/Pages/Dashboard/AttentionStrip.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useAttention } from "../../hooks/useAttention";

interface Cell {
  key: "pendingApprovals" | "unpaidOrders" | "failedDeliveries";
  tone: "hot" | "bad"; // turmeric asks for action, brick means something failed
  noun: [one: string, many: string];
  action: string;
  to: string;
}

const CELLS: Cell[] = [
  { key: "pendingApprovals", tone: "hot", noun: ["customer waiting for approval", "customers waiting for approval"], action: "Review customers", to: "/users?tab=pending" },
  { key: "unpaidOrders", tone: "hot", noun: ["unpaid order", "unpaid orders"], action: "Chase payments", to: "/orders?payment_status=unpaid" },
  { key: "failedDeliveries", tone: "bad", noun: ["failed delivery to follow up", "failed deliveries to follow up"], action: "Open orders", to: "/orders?status=delivery_failed" },
];

/** What needs a human right now: the three counts the bell shows, each with a link to its list. */
export default function AttentionStrip() {
  const { data, error } = useAttention();
  return (
    <section className="dash-attention" aria-label="Needs attention">
      {CELLS.map((c) => {
        const n = data?.[c.key];
        const text = !data && !error ? "Loading…" : n === null || n === undefined ? "couldn't be loaded" : c.noun[n === 1 ? 0 : 1];
        return (
          <div key={c.key} className="dash-attention__cell">
            <span className={`dash-attention__big${n ? ` dash-attention__big--${c.tone}` : ""}`}>{n ?? "—"}</span>
            <p>{text}</p>
            {n ? (
              <Link className="ui-btn ui-btn--secondary ui-btn--sm" to={c.to}>
                {c.action}
              </Link>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 7: Create `src/Pages/Dashboard/KpiPanel.tsx`**

```tsx
import { formatMoney } from "../../utils/formatMoney";
import type { DashboardData } from "../../types/dashboard";
import { barLabel, heightPct, trendOf } from "./dashboard.logic";
import type { DayBucket } from "./dashboard.logic";

interface KpiPanelProps {
  stats: DashboardData["stats"];
  unit: string; // "7 days", "day": how the previous range is named in the trend text
  days: DayBucket[];
}

const count = (n: number) => n.toLocaleString("en-LK");

/** Sales and order totals with their trend, and a small orders-per-day bar chart. */
export default function KpiPanel({ stats, unit, days }: KpiPanelProps) {
  const { sales, orders } = stats;
  const salesTrend = trendOf(sales?.change, unit);
  const ordersTrend = trendOf(orders?.change, unit);
  const max = Math.max(0, ...days.map((d) => d.total));
  const summary = days.map((d) => `${d.date}: ${d.total}`).join(", ");
  return (
    <section className="dash-panel" aria-label="Sales and orders">
      <div className="dash-kpis">
        <div>
          <div className="dash-kpi__label">Sales (paid)</div>
          {/* keyed on the value so a change remounts it and replays the flash animation */}
          <div className="dash-kpi__value dash-kpi__value--flash" key={sales?.value ?? "none"}>{formatMoney(sales?.value ?? null)}</div>
          <div className={`dash-delta dash-delta--${sales ? salesTrend.tone : "flat"}`}>{sales ? salesTrend.text : "Unavailable"}</div>
        </div>
        <div>
          <div className="dash-kpi__label">Orders</div>
          <div className="dash-kpi__value dash-kpi__value--flash" key={orders?.total ?? "none"}>{orders ? count(orders.total) : "—"}</div>
          <div className={`dash-delta dash-delta--${orders ? ordersTrend.tone : "flat"}`}>
            {orders ? `${ordersTrend.text} · ${count(orders.completed)} completed` : "Unavailable"}
          </div>
        </div>
      </div>
      <p className="dash-caption">Orders per day</p>
      <div className="dash-spark" role="img" aria-label={`Orders per day: ${summary}`}>
        {days.map((d, i) => (
          <div key={d.date} className="dash-col" title={`${d.date}: ${d.total} orders`}>
            <div className="dash-col__plot">
              <i className={`dash-spark__bar${i === days.length - 1 ? " is-last" : ""}`} style={{ height: `${heightPct(d.total, max)}%` }} />
            </div>
            <span className="dash-col__label">{barLabel(d.date, days.length, i)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Create `src/Pages/Dashboard/SessionChart.tsx`**

```tsx
import { MEALS, barLabel, heightPct } from "./dashboard.logic";
import type { DayBucket } from "./dashboard.logic";

const LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" } as const;
const STACK_ORDER = ["dinner", "lunch", "breakfast"] as const; // top to bottom

/** Orders per day, stacked by session. The chart is drawn for sighted users; a hidden table carries the same numbers. */
export default function SessionChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(0, ...days.map((d) => d.total));
  return (
    <section className="dash-panel" aria-label="Orders by session">
      <h2 className="dash-panel__title">Orders by session</h2>
      {max === 0 ? (
        <p className="ui-hint">No orders in this range</p>
      ) : (
        <>
          <div className="dash-bars" aria-hidden="true">
            {days.map((d, i) => (
              <div key={d.date} className="dash-col" title={`${d.date}: ${MEALS.map((m) => `${d.orders[m]} ${m}`).join(", ")}`}>
                <div className="dash-col__plot">
                  <div className="dash-stack" style={{ height: `${heightPct(d.total, max)}%` }}>
                    {STACK_ORDER.filter((m) => d.orders[m] > 0).map((m) => (
                      <i key={m} className={`dash-seg--${m}`} style={{ flexGrow: d.orders[m] }} />
                    ))}
                  </div>
                </div>
                <span className="dash-col__label">{barLabel(d.date, days.length, i)}</span>
              </div>
            ))}
          </div>
          <ul className="dash-legend">
            {MEALS.map((m) => (
              <li key={m}>
                <i className={`dash-seg--${m}`} />
                {LABEL[m]}
              </li>
            ))}
          </ul>
          <table className="ui-sr-only">
            <caption>Orders per day by session</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {MEALS.map((m) => (
                  <th key={m} scope="col">{LABEL[m]}</th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{d.date}</th>
                  {MEALS.map((m) => (
                    <td key={m}>{d.orders[m]}</td>
                  ))}
                  <td>{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 9: Create `src/Pages/Dashboard/TopItemsList.tsx` and `src/Pages/Dashboard/AreaList.tsx`**

`TopItemsList.tsx`:

```tsx
import { Avatar, DataTable } from "../../components/ui";
import type { Column } from "../../components/ui";
import { formatMoney } from "../../utils/formatMoney";
import type { TopItemData } from "../../types/dashboard";

/** Best sellers in the selected range; the bar shows each item's revenue against the best seller's. */
export default function TopItemsList({ items }: { items: TopItemData[] }) {
  const max = Math.max(0, ...items.map((i) => i.total_revenue));
  const columns: Column<TopItemData>[] = [
    {
      key: "item",
      label: "Item",
      mobile: "title",
      cell: (r) => (
        <div className="dash-who">
          <Avatar name={r.food_name} src={r.image_url} size="md" square tone="auto" />
          <b>{r.food_name}</b>
        </div>
      ),
    },
    { key: "sold", label: "Sold", align: "right", mobile: "hide", cell: (r) => r.total_quantity },
    { key: "revenue", label: "Revenue", align: "right", mobile: "amount", nowrap: true, cell: (r) => <strong>{formatMoney(r.total_revenue)}</strong> },
    {
      key: "share",
      label: "Share of revenue",
      header: <span className="ui-sr-only">Share of revenue</span>,
      mobile: "hide",
      cell: (r) => (
        <div className="dash-meter" aria-hidden="true">
          <i style={{ width: `${max > 0 ? (r.total_revenue / max) * 100 : 0}%` }} />
        </div>
      ),
    },
  ];
  return <DataTable columns={columns} rows={items} rowKey={(r) => r.food_name} emptyTitle="No sales in this range" />;
}
```

`AreaList.tsx`:

```tsx
import { DataTable } from "../../components/ui";
import type { Column } from "../../components/ui";
import { formatMoney } from "../../utils/formatMoney";
import type { AreaRow } from "../../types/dashboard";

const completed = (r: AreaRow) => (r.orderCount > 0 ? Math.round((r.completedCount / r.orderCount) * 100) : 0);

const columns: Column<AreaRow>[] = [
  { key: "area", label: "Area", mobile: "title", cell: (r) => <b className="ui-cell__title">{r.area_name}</b> },
  { key: "orders", label: "Orders", align: "right", mobile: "hide", cell: (r) => r.orderCount },
  { key: "revenue", label: "Revenue", align: "right", mobile: "amount", nowrap: true, cell: (r) => <strong>{formatMoney(r.totalRevenue)}</strong> },
  { key: "completed", label: "Completed", align: "right", mobile: "hide", cell: (r) => `${completed(r)}%` },
];

/** Orders, revenue and the share of orders completed, per delivery area. */
export default function AreaList({ rows }: { rows: AreaRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.area_id)} emptyTitle="No orders in this range" />;
}
```

- [ ] **Step 10: Create `src/Pages/Dashboard/overview.css`**

```css
/* Dashboard page. Tokens only; every class starts with dash-. */

/* ===== Needs attention ===== */
.dash-attention {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 26px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
}
.dash-attention__cell { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); padding: 20px 24px; }
.dash-attention__cell + .dash-attention__cell { border-left: 1px solid var(--gray-200); }
.dash-attention__cell p { margin: 0; color: var(--gray-500); }
.dash-attention__cell .ui-btn { margin-top: 10px; }
.dash-attention__big { font-family: var(--font-head); font-size: 46px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; }
.dash-attention__big--hot { box-shadow: inset 0 -10px 0 var(--color-warning-bg); }
.dash-attention__big--bad { box-shadow: inset 0 -10px 0 var(--color-danger-bg); }

/* ===== Panels and rows of panels ===== */
.dash-row { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: var(--space-4); }
.dash-panel { box-sizing: border-box; padding: 22px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); }
.dash-panel__title { margin: 0 0 var(--space-3); font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }

/* ===== KPIs ===== */
.dash-kpis { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-4); }
.dash-kpi__label { color: var(--gray-500); font-size: var(--text-sm); font-weight: 500; }
.dash-kpi__value { margin: 4px 0 2px; font-family: var(--font-head); font-size: 38px; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; }
.dash-delta { color: var(--gray-500); font-size: var(--text-sm); font-weight: 600; }
.dash-delta--up { color: var(--color-primary-text); }
.dash-delta--down { color: var(--color-danger-text); }
@media (prefers-reduced-motion: no-preference) {
  .dash-kpi__value--flash { animation: dash-flash 1.2s ease-out; }
  @keyframes dash-flash { from { background: var(--color-warning-bg); } to { background: transparent; } }
}

/* ===== Bar charts (orders per day, orders by session) ===== */
.dash-caption { margin: var(--space-4) 0 0; color: var(--gray-500); font-size: var(--text-xs); }
.dash-spark, .dash-bars { display: flex; gap: var(--space-3); }
.dash-spark { height: 112px; margin-top: var(--space-1); }
.dash-bars { height: 168px; }
.dash-col { display: flex; flex: 1 1 0; flex-direction: column; min-width: 0; }
.dash-col__plot { display: flex; flex: 1; flex-direction: column; justify-content: flex-end; align-items: center; min-height: 0; }
.dash-col__label { height: 18px; margin-top: 6px; color: var(--gray-500); font-size: var(--text-xs); text-align: center; white-space: nowrap; }
.dash-spark__bar { display: block; width: 100%; max-width: 40px; border-radius: var(--radius-sm) var(--radius-sm) 0 0; background: var(--color-primary-border); }
.dash-spark__bar.is-last { background: var(--color-primary); }
.dash-stack { display: flex; flex-direction: column; gap: 2px; width: 100%; max-width: 48px; }
.dash-stack > i { display: block; flex-basis: 0; min-height: 2px; border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
.dash-seg--breakfast { background: var(--color-warning); }
.dash-seg--lunch { background: var(--color-primary); }
.dash-seg--dinner { background: var(--tea); }
.dash-legend { display: flex; flex-wrap: wrap; gap: var(--space-4); margin: var(--space-3) 0 0; padding: 0; list-style: none; color: var(--gray-500); font-size: var(--text-sm); }
.dash-legend li { display: inline-flex; align-items: center; gap: 6px; }
.dash-legend i { display: block; width: 10px; height: 10px; border-radius: 50%; }

/* ===== Top items ===== */
.dash-who { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.dash-who b { font-size: 14.5px; font-weight: 600; }
.dash-meter { width: 100%; max-width: 180px; height: 6px; overflow: hidden; border-radius: var(--radius-sm); background: var(--gray-200); }
.dash-meter > i { display: block; height: 100%; background: var(--color-primary); }

/* Old numbers stay visible, dimmed, while a changed filter loads */
.dash-dim { opacity: 0.55; transition: opacity 0.15s; }

@media (max-width: 1024px) {
  .dash-row { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .dash-attention { grid-template-columns: minmax(0, 1fr); }
  .dash-attention__cell { flex-direction: row; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); padding: var(--space-4); }
  .dash-attention__cell + .dash-attention__cell { border-left: 0; border-top: 1px solid var(--gray-200); }
  .dash-attention__cell p { flex: 1 1 140px; }
  .dash-attention__cell .ui-btn { margin: 0 0 0 auto; }
  .dash-attention__big { font-size: 36px; }
  .dash-panel { padding: var(--space-4); }
  .dash-kpis { grid-template-columns: minmax(0, 1fr); }
  .dash-kpi__value { font-size: 32px; }
}
```

- [ ] **Step 11: Rewrite `src/Pages/Dashboard/Dashboard.tsx`**

```tsx
import "./overview.css";
import { useDashboard } from "../../hooks/useDashboard";
import { Alert, Button, PageHeader, Spinner } from "../../components/ui";
import RangeFilters from "../../components/common/RangeFilters";
import AttentionStrip from "./AttentionStrip";
import KpiPanel from "./KpiPanel";
import SessionChart from "./SessionChart";
import TopItemsList from "./TopItemsList";
import AreaList from "./AreaList";
import { MAX_DAYS, bucketDays, listDays, rangeDays, unitOf } from "./dashboard.logic";

const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-LK", { day: "numeric", month: "short", timeZone: "UTC" });

export default function Dashboard() {
  const d = useDashboard();
  const { data, error, updatedAt, refresh } = d;

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Sales and orders at a glance" />
        {error ? (
          <>
            <Alert>Couldn&apos;t load the dashboard: {error}</Alert>
            <Button onClick={refresh}>Retry</Button>
          </>
        ) : (
          <Spinner label="Loading" />
        )}
      </div>
    );
  }

  const { stats, sessions, topItems, areas, errors, range } = data;
  // Everything below describes the range the data was loaded for, which lags the picker while a new range loads
  const dayCount = rangeDays(range.from, range.to);
  const unit = unitOf(dayCount);
  const allDays = listDays(range.from, range.to);
  const days = bucketDays(allDays.slice(-MAX_DAYS), sessions);
  const subtitle = `Sales and orders for ${range.from === range.to ? dayLabel(range.from) : `${dayLabel(range.from)} to ${dayLabel(range.to)}`}, compared with the ${unit} before`;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={subtitle} actions={<RangeFilters f={d} showRange={false} />} />

      <AttentionStrip />

      {error && <Alert tone="warning">Showing stale data, the last refresh failed: {error}</Alert>}
      {errors.length > 0 && <Alert tone="warning">Some sections are unavailable: {errors.join(", ")}</Alert>}

      <div className={d.loading ? "dash-dim" : undefined}>
        <div className="dash-row">
          <KpiPanel stats={stats} unit={unit} days={days} />
          <SessionChart days={days} />
        </div>
        {allDays.length > MAX_DAYS && <p className="ui-hint">The charts show the last {MAX_DAYS} days of the range; the totals cover all of it.</p>}

        <h2 className="ui-section">Top items</h2>
        <TopItemsList items={topItems ?? []} />

        <h2 className="ui-section">Areas</h2>
        <AreaList rows={areas ?? []} />
      </div>

      <p className="ui-hint">
        Updated {updatedAt?.toLocaleTimeString()}.{" "}
        <Button variant="ghost" size="sm" onClick={refresh}>
          Refresh
        </Button>
      </p>
    </div>
  );
}
```

- [ ] **Step 12: Delete the old card components**

Run: `git rm src/components/Cards/Card.tsx` then `grep -rn "Cards/Card" src` (expected: no output). Do not touch `src/Pages/Dashboard/dashboard.css`; Reports, Audit Logs and Settings still import it.

- [ ] **Step 13: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/Pages/Dashboard src/components/common src/components/ui`. Expected: no output from either. Then run the hex check: `grep -nE "#[0-9a-fA-F]{3,8}\b" src/Pages/Dashboard/overview.css src/Pages/Dashboard/*.tsx src/Pages/Dashboard/dashboard.logic.ts src/components/common/RangeFilters.tsx` (expected: no output).

- [ ] **Step 14: Verify in the browser**

Write `$SCRATCH/dash-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  const reqs = [];
  page.on("request", (r) => r.url().includes("/analytics/dashboard") && reqs.push(new URL(r.url()).searchParams.get("from") + ".." + new URL(r.url()).searchParams.get("to")));
  await page.goto("http://localhost:5173/dashboard");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(".dash-bars");
  await page.waitForTimeout(500);
  out.title = await page.locator("h1").innerText();
  out.subtitle = await page.locator(".ui-pageheader__subtitle").innerText();
  out.attention = await page.locator(".dash-attention__cell").evaluateAll((els) => els.map((e) => ({ n: e.querySelector(".dash-attention__big").textContent, p: e.querySelector("p").textContent, href: e.querySelector("a")?.getAttribute("href") })));
  out.preset = await page.locator(".ui-segmented [aria-pressed=true]").innerText();
  out.kpi = await page.locator(".dash-kpi__value").allInnerTexts();
  out.delta = await page.locator(".dash-delta").allInnerTexts();
  out.counts = { spark: await page.locator(".dash-spark .dash-col").count(), bars: await page.locator(".dash-bars .dash-col").count(), segmentsFirstDay: await page.locator(".dash-bars .dash-stack").first().locator("i").count() };
  out.stackInside = await page.locator(".dash-bars .dash-stack").evaluateAll((els) => els.every((s) => s.getBoundingClientRect().height <= s.closest(".dash-col__plot").getBoundingClientRect().height + 0.5));
  out.legend = await page.locator(".dash-legend li").allInnerTexts();
  out.srTableRows = await page.locator("table.ui-sr-only tbody tr").count();
  out.tables = await page.locator(".ui-datatable").evaluateAll((els) => els.map((e) => ({ rows: e.querySelectorAll("tbody tr").length, firstRow: e.querySelector("tbody tr")?.innerText.replace(/\s+/g, " ") })));
  out.rowTitles = await page.locator(".dash-bars .dash-col").first().getAttribute("title");
  await page.screenshot({ path: S + "/dash-desktop.png" });
  // ranges
  await page.getByRole("button", { name: "Today" }).click();
  await page.waitForTimeout(500);
  out.today = { bars: await page.locator(".dash-bars .dash-col").count(), subtitle: await page.locator(".ui-pageheader__subtitle").innerText() };
  await page.getByRole("button", { name: "Last 30 days" }).click();
  await page.waitForTimeout(500);
  out.d30 = { bars: await page.locator(".dash-bars .dash-col").count(), labels: (await page.locator(".dash-bars .dash-col__label").allInnerTexts()).filter(Boolean).length };
  await page.getByRole("button", { name: "Custom" }).click();
  out.customDates = await page.locator('.ui-filterbar input[type="date"]').count();
  await page.getByLabel("Session").selectOption("lunch");
  await page.waitForTimeout(500);
  out.lunchOnly = { segs: await page.locator(".dash-bars .dash-stack").first().locator("i").count(), kpi: await page.locator(".dash-kpi__value").allInnerTexts() };
  out.requests = reqs.length;
  // reports still renders with the shared filters
  await page.goto("http://localhost:5173/reports");
  await page.waitForTimeout(600);
  out.reports = { filterbar: await page.locator(".ui-filterbar").count(), seg: await page.locator(".ui-segmented").count(), rangeNote: await page.locator(".ui-filterbar__note").count() };
  await page.screenshot({ path: S + "/reports-after-task2.png" });
  // phone
  await page.setViewportSize({ width: 390, height: 2600 });
  await page.goto("http://localhost:5173/dashboard");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(".dash-bars");
  await page.waitForTimeout(500);
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  out.hiddenCells = await page.locator('td[data-slot="hide"]').evaluateAll((els) => els.every((e) => getComputedStyle(e).display === "none"));
  await page.screenshot({ path: S + "/dash-mobile.png" });
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/dash-check.js"`.

Expected: `title` `Dashboard`; `subtitle` like `Sales and orders for 12 Oct to 18 Oct, compared with the 7 days before` (dates follow today's real date); `attention` has three entries with `n` `3`, `5`, `1`, texts `customers waiting for approval`, `unpaid orders`, `failed delivery to follow up` and hrefs `/users?tab=pending`, `/orders?payment_status=unpaid`, `/orders?status=delivery_failed`; `preset` `Last 7 days`; `kpi` two values, the first starting `LKR`; `delta` entries start `Up 12.4% on the previous 7 days` and `Up 6.1% on the previous 7 days · … completed`; `counts` `spark` 7, `bars` 7, `segmentsFirstDay` 3; `stackInside` true; `legend` `["Breakfast","Lunch","Dinner"]`; `srTableRows` 7; `tables` two entries with 5 and 3 rows (the first row of the first mentioning `Chicken fried rice`); the first bar's `title` lists breakfast, lunch and dinner counts; `today.bars` 1 and its subtitle ends `compared with the day before`; `d30.bars` 30 and `d30.labels` 6; `customDates` 2; `lunchOnly.segs` 1; `requests` at least 5; `reports.filterbar` at least 1, `reports.seg` 1, `reports.rangeNote` 1; `docWidth` 390; `hiddenCells` true. A PAGEERROR is a failure.

Read `dash-desktop.png` and compare with `docs/superpowers/mockups/png/dashboard-desktop.png`: Paper ground, the three-cell attention strip with large Bricolage numbers (turmeric underline on 3 and 5, brick on 1), the white KPI panel with pale bars and a Leaf last bar, the stacked chart (turmeric bottom, leaf middle, tea top) with a legend, ruled Top items and Areas lists with initials tiles and meters. The mockup shows "LKR 4,150 outstanding" on the second cell; this app does not have that data, so its absence is correct. Read `dash-mobile.png` against `dashboard-mobile.png`: the attention cells are rows, panels stack, and Top items and Areas show only name and amount. Read `reports-after-task2.png`: the filter row is the new segmented control and selects, and nothing is broken.

- [ ] **Step 15: Commit**

```bash
git add docs/superpowers/ui-baseline/setup-dashboard-users.js src/Pages/Dashboard/dashboard.logic.ts src/Pages/Dashboard/AttentionStrip.tsx src/Pages/Dashboard/KpiPanel.tsx src/Pages/Dashboard/SessionChart.tsx src/Pages/Dashboard/TopItemsList.tsx src/Pages/Dashboard/AreaList.tsx src/Pages/Dashboard/overview.css src/Pages/Dashboard/Dashboard.tsx src/components/common/RangeFilters.tsx src/components/ui/ui.css src/components/Cards/Card.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): attention strip, KPI panel, session chart and ruled lists on the new identity

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

(`git add` of the deleted `Card.tsx` path stages its removal.)

---

### Task 3: Users list on the new identity

**Files:**
- Create: `src/Pages/Users/customerActions.ts`, `src/Pages/Users/customers.css`
- Rewrite: `src/Pages/Users/Users.tsx`
- Modify: `src/hooks/useUsers.ts`

**Interfaces:**
- Consumes: Task 1 kit (`Avatar`, `SearchField`, `DataTable` `hide` slot), Task 2 fixtures (`setup-dashboard-users.js`), existing `useUsers()` (`activeTab`, `setActiveTab`, `query`, `setQuery`, `counts`, `filtered`, `areaName`, `error`, `areaFilter`, `clearAreaFilter`, `areas`, `profile`, `openProfile`, `closeProfile`, `exportCsv`, `approve`, `reject`, `disable`, `enable`, `unlock`, `tabs`), `Modal`, `ConfirmDialog` (`tone`), `getSession()`.
- Produces:
  - `customerActions.ts`: `type CustomerAction = "approve" | "reject" | "disable" | "enable" | "unlock"` and `ACTIONS: Record<UserStatus, { kind: CustomerAction; label: string; primary?: boolean }[]>`. Task 4 reuses both.
  - `useUsers()` gains `loaded: boolean` (true after the first customer list arrives).
  - `Users.tsx` keeps the existing profile `Modal` (and its `p`/`unpaid` variables and the `users.css` import) until Task 4 replaces them.

- [ ] **Step 1: Create `src/Pages/Users/customerActions.ts`**

```ts
import type { UserStatus } from "../../types/users";

export type CustomerAction = "approve" | "reject" | "disable" | "enable" | "unlock";

/** What a super admin can do to a customer in each status. A primary action moves the customer forward. */
export const ACTIONS: Record<UserStatus, { kind: CustomerAction; label: string; primary?: boolean }[]> = {
  pending: [
    { kind: "approve", label: "Approve", primary: true },
    { kind: "reject", label: "Reject" },
  ],
  accepted: [{ kind: "disable", label: "Disable" }],
  rejected: [],
  disabled: [{ kind: "enable", label: "Enable" }],
  blocked: [{ kind: "unlock", label: "Unlock", primary: true }],
};
```

- [ ] **Step 2: Edit `src/hooks/useUsers.ts` (add the `loaded` flag)**

(a) Directly after `const [error, setError] = useState("");` add:

```ts
    const [loaded, setLoaded] = useState(false); // false until the first customer list arrives
```

(b) Replace

```ts
    const load = useCallback(() => svc.listCustomers().then(setRows), []);
```

with

```ts
    const load = useCallback(
        () => svc.listCustomers().then((r) => { setRows(r); setLoaded(true); }),
        [],
    );
```

(c) In the returned object, change `activeTab, setActiveTab, query, setQuery, counts, filtered, areaName, error,` to `activeTab, setActiveTab, query, setQuery, counts, filtered, areaName, error, loaded,`.

- [ ] **Step 3: Create `src/Pages/Users/customers.css`**

```css
/* Customers list and profile. Tokens only; every class starts with cust-. */
.cust-tools { margin-bottom: var(--space-3); }
.cust { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.cust__text { min-width: 0; }
.cust__text .ui-cell__meta { margin-top: 0; overflow-wrap: anywhere; }
```

- [ ] **Step 4: Replace `src/Pages/Users/Users.tsx` (whole file)**

```tsx
import { useState } from "react";
import { LuDownload } from "react-icons/lu";
import "./users.css"; // still styles the profile modal below until Task 4 replaces it
import "./customers.css";
import { useUsers } from "../../hooks/useUsers";
import { Alert, Avatar, Button, Chip, Chips, DataTable, Field, PageHeader, SearchField } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { getSession } from "../../services/apiClient";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { statusOf, type Customer } from "../../types/users";
import { ACTIONS, type CustomerAction } from "./customerActions";

type Dialog = { kind: CustomerAction; user: Customer } | null;

const CONFIRM_COPY = {
  disable: { title: "Disable customer", verb: "Disable", text: "can no longer log in or order", tone: "danger" },
  enable: { title: "Enable customer", verb: "Enable", text: "regains access", tone: "primary" },
  unlock: { title: "Unlock customer", verb: "Unlock", text: "is unblocked and can order again", tone: "primary" },
} as const;

export default function UsersPage() {
  const u = useUsers();
  // UI gating only; the backend checkRole is the enforcement
  const isSuper = getSession()?.role === "super_admin";

  const [dialog, setDialog] = useState<Dialog>(null);
  const [areaId, setAreaId] = useState("");
  const [reason, setReason] = useState("");
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    setAreaId(String(d.user.area_id ?? ""));
    setReason("");
    setDialog(d);
  };

  const submitApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "approve" && (await u.approve(dialog.user, areaId))) close();
  };
  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "reject" && reason.trim() && (await u.reject(dialog.user, reason.trim()))) close();
  };
  const confirm = async () => {
    if (!dialog || dialog.kind === "approve" || dialog.kind === "reject") return;
    await u[dialog.kind](dialog.user);
    close();
  };

  const p = u.profile;
  const unpaid = p?.order_history.filter((o) => o.payment_status === "unpaid") ?? [];
  const confirmCopy = dialog && dialog.kind in CONFIRM_COPY ? CONFIRM_COPY[dialog.kind as keyof typeof CONFIRM_COPY] : null;

  const rowActions = (c: Customer) => (
    <div className="ui-actions">
      {isSuper &&
        ACTIONS[statusOf(c)].map((a) => (
          <Button key={a.kind} size="sm" variant={a.primary ? "primary" : "secondary"} aria-label={`${a.label} ${c.full_name}`} onClick={() => open({ kind: a.kind, user: c })}>
            {a.label}
          </Button>
        ))}
      <Button size="sm" variant="ghost" aria-label={`View ${c.full_name}`} onClick={() => u.openProfile(c.id)}>
        View
      </Button>
    </div>
  );

  const columns: Column<Customer>[] = [
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (c) => (
        <div className="cust">
          <Avatar name={c.full_name} />
          <div className="cust__text">
            <b className="ui-cell__title">{c.full_name}</b>
            <div className="ui-cell__meta">{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Phone", mobile: "hide", nowrap: true, cell: (c) => c.phone ?? "—" },
    { key: "area", label: "Area", mobile: "hide", cell: (c) => u.areaName(c.area_id) },
    { key: "registered", label: "Registered", mobile: "hide", nowrap: true, cell: (c) => <span className="ui-cell__meta">{formatDateTime(c.created_at)}</span> },
    { key: "actions", label: "Actions", align: "right", mobile: "actions", cell: rowActions },
  ];

  const waiting = u.activeTab === "pending" ? " waiting" : "";

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Approve new customers and manage their accounts"
        actions={
          <Button onClick={u.exportCsv}>
            <LuDownload aria-hidden="true" /> Export CSV
          </Button>
        }
      />

      {u.areaFilter && (
        <Alert tone="info">
          Showing customers in <strong>{u.areaName(u.areaFilter)}</strong>.{" "}
          <Button size="sm" variant="ghost" onClick={u.clearAreaFilter}>
            Clear filter
          </Button>
        </Alert>
      )}

      <Chips label="Customer status">
        {u.tabs.map((t) => (
          <Chip key={t.key} selected={u.activeTab === t.key} count={u.counts[t.key]} onClick={() => u.setActiveTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </Chips>

      <div className="cust-tools">
        <SearchField label="Search customers" placeholder="Search by name or email" value={u.query} onChange={(e) => u.setQuery(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={u.filtered}
        rowKey={(c) => c.id}
        loading={!u.loaded && !u.error}
        error={dialog ? null : u.error}
        emptyTitle="No customers found"
        rowTone={(c) => (statusOf(c) === "pending" ? "attn" : undefined)}
      />
      {u.filtered.length > 0 && (
        <p className="ui-hint">
          {u.filtered.length} {u.filtered.length === 1 ? "customer" : "customers"}
          {waiting}
        </p>
      )}

      <Modal open={dialog?.kind === "approve"} title={`Approve ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitApprove}>
          <Field label="Delivery area (required)">
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
              <option value="">Select an area…</option>
              {u.areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
              ))}
            </select>
          </Field>
          {u.error && <Alert>{u.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">Approve</Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "reject"} title={`Reject ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitReject}>
          <Field label="Reason (required)">
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          {u.error && <Alert>{u.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="danger">Reject</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmCopy}
        title={confirmCopy?.title ?? ""}
        message={`${dialog?.user.full_name} ${confirmCopy?.text}. Continue?`}
        confirmLabel={confirmCopy?.verb}
        tone={confirmCopy?.tone}
        onCancel={close}
        onConfirm={confirm}
      />

      <Modal open={!!p} title={p?.full_name ?? ""} onClose={u.closeProfile}>
        {p && (
          <div className="profile">
            <p className="muted">
              {p.email} · {p.phone ?? "no phone"} · {u.areaName(p.area_id)}
            </p>
            {p.address && <p className="muted">{p.address}</p>}
            {p.rejection_reason && <p>Rejected: {p.rejection_reason}</p>}
            {p.blocked_reason && <p>Blocked: {p.blocked_reason}</p>}

            <h3>Unpaid</h3>
            <p>
              {unpaid.length} order{unpaid.length === 1 ? "" : "s"} ·{" "}
              {formatMoney(unpaid.reduce((s, o) => s + Number(o.total_price), 0))}
            </p>

            <h3>Orders ({p.order_history.length})</h3>
            <ul>
              {p.order_history.map((o) => (
                <li key={o.id}>
                  {formatDate(o.created_at)} · {o.meal_time} · {o.status} · {o.payment_status} · {formatMoney(Number(o.total_price))}
                </li>
              ))}
              {p.order_history.length === 0 && <li>No orders</li>}
            </ul>

            <h3>Status history</h3>
            <ul>
              {p.status_log.map((l) => (
                <li key={l.id}>
                  {formatDateTime(l.created_at)} · {l.previous_status ?? "—"} → {l.new_status}
                  {l.reason ? ` (${l.reason})` : ""}
                </li>
              ))}
              {p.status_log.length === 0 && <li>No changes recorded</li>}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/Pages/Users src/hooks/useUsers.ts`. Expected: no output from either. Hex check: `grep -nE "#[0-9a-fA-F]{3,8}\b" src/Pages/Users/customers.css src/Pages/Users/Users.tsx src/Pages/Users/customerActions.ts` (expected: no output; `users.css` still has hex and is deleted in Task 4).

- [ ] **Step 6: Verify in the browser**

Write `$SCRATCH/users-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  const sent = [];
  page.on("request", (r) => r.method() !== "GET" && /\/users\/customers\//.test(r.url()) && sent.push(r.method() + " " + new URL(r.url()).pathname.split("/").slice(-2).join("/") + " " + (r.postData() ?? "")));
  await page.goto("http://localhost:5173/users");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("tbody tr");
  await page.waitForTimeout(400);
  const rows = () => page.locator("tbody tr").evaluateAll((els) => els.map((e) => e.innerText.replace(/\s+/g, " ").trim()));
  out.title = await page.locator("h1").innerText();
  out.chips = await page.locator(".ui-chips .ui-chip").allInnerTexts();
  out.pressed = await page.locator(".ui-chip[aria-pressed=true]").innerText();
  out.pendingRows = (await rows()).length;
  out.edges = await page.locator(".ui-row--attn").count();
  out.firstRow = (await rows())[0];
  out.header = await page.locator("thead th").allInnerTexts();
  out.hint = await page.locator("p.ui-hint").last().innerText();
  out.search = await page.getByRole("searchbox", { name: "Search customers" }).evaluate((el) => ({ h: el.offsetHeight, boxSizing: getComputedStyle(el).boxSizing }));
  await page.screenshot({ path: S + "/users-desktop-after.png" });
  // other tabs
  await page.getByRole("button", { name: /^Accepted/ }).click();
  out.accepted = { rows: (await rows()).length, edges: await page.locator(".ui-row--attn").count(), buttons: await page.locator("tbody tr").first().getByRole("button").allInnerTexts() };
  await page.getByRole("button", { name: /^Blocked/ }).click();
  out.blocked = { rows: (await rows()).length, buttons: await page.locator("tbody tr").first().getByRole("button").allInnerTexts() };
  await page.getByRole("button", { name: /^Rejected/ }).click();
  out.rejected = { rows: (await rows()).length, buttons: await page.locator("tbody tr").first().getByRole("button").allInnerTexts() };
  await page.getByRole("button", { name: /^Accepted/ }).click();
  await page.getByRole("searchbox", { name: "Search customers" }).fill("kumari");
  out.search1 = (await rows()).length;
  await page.getByRole("searchbox", { name: "Search customers" }).fill("zzz");
  out.searchEmpty = await page.locator(".ui-empty__title").innerText();
  await page.getByRole("searchbox", { name: "Search customers" }).fill("");
  // dialogs
  await page.getByRole("button", { name: /^Pending/ }).click();
  await page.getByRole("button", { name: "Approve Amaya Rathnayake" }).click();
  out.approveDialog = { title: await page.locator("dialog.modal[open] .modal__title").innerText(), selectLabel: await page.locator("dialog.modal[open] label.ui-field__label").innerText() };
  await page.locator("dialog.modal[open] select").selectOption("1");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.waitForTimeout(400);
  out.approveClosed = (await page.locator("dialog.modal[open]").count()) === 0;
  await page.getByRole("button", { name: "Reject Kasun Madushanka" }).click();
  await page.locator("dialog.modal[open] textarea").fill("Outside the delivery areas");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Accepted/ }).click();
  await page.getByRole("button", { name: "Disable Nimal Perera" }).click();
  out.disableConfirm = await page.locator("dialog.modal[open] .ui-btn--danger").innerText();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: /^Disabled/ }).click();
  await page.getByRole("button", { name: "Enable Tharindu Bandara" }).click();
  out.enableConfirmTone = await page.locator("dialog.modal[open] .ui-btn--primary").innerText();
  await page.getByRole("button", { name: "Cancel" }).click();
  out.requests = sent;
  // area filter notice and tab from the URL
  await page.goto("http://localhost:5173/users?tab=blocked&area=3");
  await page.waitForSelector("tbody tr");
  out.areaNotice = await page.locator(".ui-alert--info").innerText();
  out.urlTab = await page.locator(".ui-chip[aria-pressed=true]").innerText();
  // phone
  await page.setViewportSize({ width: 390, height: 1400 });
  await page.goto("http://localhost:5173/users");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("tbody tr");
  await page.waitForTimeout(400);
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  out.hiddenCells = await page.locator('td[data-slot="hide"]').evaluateAll((els) => els.every((e) => getComputedStyle(e).display === "none"));
  await page.screenshot({ path: S + "/users-mobile-after.png" });
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/users-check.js"`.

Expected: `title` `Users`; `chips` like `["Pending 3","Accepted 5","Rejected 1","Disabled 2","Blocked 1"]` (the count is a separate span, so the text may read `Pending\n3`); `pressed` starts `Pending`; `pendingRows` 3; `edges` 3; `firstRow` contains `Amaya Rathnayake`, `amaya.r@mail.lk`, `077 412 8890`, `Colombo 03`, `Approve`, `Reject`, `View`; `header` `["Customer","Phone","Area","Registered","Actions"]`; `hint` `3 customers waiting`; search height 40 with `border-box`; `accepted.rows` 5, `accepted.edges` 0, first row buttons `["Disable","View"]`; `blocked.rows` 1 with `["Unlock","View"]`; `rejected.rows` 1 with `["View"]`; `search1` 1; `searchEmpty` `No customers found`; `approveDialog.title` `Approve Amaya Rathnayake` and `selectLabel` starting `Delivery area`; `approveClosed` true; `disableConfirm` `Disable`; `enableConfirmTone` `Enable`; `requests` includes a `POST approve` with body containing `"area_id":"1"` and a `POST reject` with body containing `Outside the delivery areas`; `areaNotice` mentions `Dehiwala`; `urlTab` starts `Blocked`; `docWidth` 390; `hiddenCells` true. A PAGEERROR is a failure.

Read `users-desktop-after.png` against `docs/superpowers/mockups/png/users-desktop.png` (chips, search field, ruled rows with the turmeric edge and initials avatars, green Approve and quiet Reject, "View" as a text button, no status column) and `users-mobile-after.png` against `users-mobile.png` (cards with avatar, name, email and the action buttons; no phone, area or date). The actions sit right-aligned on phones where the mockup left-aligns them; that is the shared DataTable phone rule and is accepted.

- [ ] **Step 7: Commit**

```bash
git add src/Pages/Users/customerActions.ts src/Pages/Users/customers.css src/Pages/Users/Users.tsx src/hooks/useUsers.ts
git commit -m "$(cat <<'EOF'
feat(users): chips, search and ruled customer rows on the new identity

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Customer profile drawer, and retire `users.css`

**Files:**
- Create: `src/Pages/Users/CustomerDrawer.tsx`
- Modify: `src/Pages/Users/Users.tsx`, `src/Pages/Users/customers.css` (append), `src/types/users.ts`, `src/components/common/modal.css` (append)
- Delete: `src/Pages/Users/users.css`

**Interfaces:**
- Consumes: Task 1 `Drawer`, `Avatar`; Task 3 `ACTIONS`, `CustomerAction`, the profile `Modal` block and `open()` helper in `Users.tsx`; kit `Alert`, `Badge` (`BadgeTone`), `Button`, `OrderTrack`, `PaymentMark`; `formatDate`, `formatDateTime`, `formatMoney`; `statusOf`; fixtures from Task 2.
- Produces: `CustomerDrawer({ profile: CustomerProfile | null, areaName: string, canAct: boolean, onClose: () => void, onAction: (kind: CustomerAction) => void })` (default export). `CustomerOrder.status` becomes `OrderStatus` and `.payment_status` becomes `PaymentStatus` (type-only change).

- [ ] **Step 1: Take "before" screenshots of the pages that share legacy CSS**

`users.css` is global once loaded, and Reports and Admins render next to it. Before changing anything, write `$SCRATCH/legacy-shots.js` (the argument `process.env.TAG` names the files) and run it now with `TAG=before`:

```js
async (page) => {
  const S = process.env.SCRATCH;
  const tag = process.env.TAG;
  for (const p of ["reports", "admins", "sessions", "food-items"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:5173/" + p);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${S}/legacy-${p}-${tag}.png` });
  }
  return "ok";
}
```

Run: `TAG=before SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/legacy-shots.js"`.

Also confirm which `users.css` classes other pages use, by exact class name (this was checked while writing the plan and found only the Reports `tabs`/`tab` classes and the `.modal__form label` rule; repeat it so the plan's premise is verified on your tree): `grep -rnE "className=\"(tabs|tab|col-actions|col-name)[ \"]" src --include=*.tsx | grep -v "src/Pages/Users/"`. Expected: hits only in Reports (`tabs`, `tab`) and Admins/Delivery Persons/Food Items (`col-actions`, which `admins.css` defines for itself) and Admins (`col-name`, also in `admins.css`). If any other page uses a `users.css` class, stop and report it.

- [ ] **Step 2: Edit `src/types/users.ts`**

Add this import at the top of the file:

```ts
import type { OrderStatus, PaymentStatus } from "./orders";
```

and in `CustomerOrder` replace

```ts
    status: string;
    payment_status: "pending" | "paid" | "unpaid" | "ignored";
```

with

```ts
    status: OrderStatus;
    payment_status: PaymentStatus;
```

- [ ] **Step 3: Create `src/Pages/Users/CustomerDrawer.tsx`**

```tsx
import { Alert, Avatar, Badge, Button, Drawer, OrderTrack, PaymentMark } from "../../components/ui";
import type { BadgeTone } from "../../components/ui";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { statusOf } from "../../types/users";
import type { CustomerProfile, UserStatus } from "../../types/users";
import { ACTIONS } from "./customerActions";
import type { CustomerAction } from "./customerActions";

const STATUS: Record<UserStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending approval" },
  accepted: { tone: "success", label: "Accepted" },
  rejected: { tone: "danger", label: "Rejected" },
  disabled: { tone: "neutral", label: "Disabled" },
  blocked: { tone: "danger", label: "Blocked" },
};
const labelOf = (s: string) => STATUS[s as UserStatus]?.label ?? s;
const MAX_ORDERS = 10;
const newestFirst = <T extends { created_at: string }>(rows: T[]) => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

interface CustomerDrawerProps {
  profile: CustomerProfile | null;
  areaName: string;
  canAct: boolean; // super admins only; the backend enforces it
  onClose: () => void;
  onAction: (kind: CustomerAction) => void;
}

/** A customer's details, unpaid warning, recent orders and status history, in a drawer over the list. */
export default function CustomerDrawer({ profile: p, areaName, canAct, onClose, onAction }: CustomerDrawerProps) {
  const status = p ? statusOf(p) : null;
  const unpaid = p?.order_history.filter((o) => o.payment_status === "unpaid") ?? [];
  const orders = p ? newestFirst(p.order_history) : [];
  const log = p ? newestFirst(p.status_log) : [];
  return (
    <Drawer open={!!p} label={p ? `${p.full_name}, customer profile` : "Customer profile"} onClose={onClose}>
      {p && status && (
        <>
          <div className="cust-head">
            <Avatar name={p.full_name} size="lg" />
            <div>
              <h2>{p.full_name}</h2>
              <div className="cust-head__meta">
                <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                <span>Registered {formatDateTime(p.created_at)}</span>
              </div>
            </div>
          </div>

          {canAct && ACTIONS[status].length > 0 && (
            <div className="ui-actions">
              {ACTIONS[status].map((a) => (
                <Button key={a.kind} variant={a.primary ? "primary" : "secondary"} onClick={() => onAction(a.kind)}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}

          <dl className="cust-details">
            <div>
              <dt>Email</dt>
              <dd>{p.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{p.phone ?? "—"}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{areaName}</dd>
            </div>
            <div className="cust-details__wide">
              <dt>Address</dt>
              <dd>{p.address ?? "—"}</dd>
            </div>
          </dl>

          {p.rejection_reason && (
            <Alert tone="warning">
              <strong>Rejected:</strong> {p.rejection_reason}
            </Alert>
          )}
          {p.blocked_reason && (
            <Alert tone="warning">
              <strong>Blocked:</strong> {p.blocked_reason}
            </Alert>
          )}
          {unpaid.length > 0 && (
            <Alert tone="warning">
              <strong>
                {unpaid.length} unpaid order{unpaid.length === 1 ? "" : "s"}
              </strong>
              , {formatMoney(unpaid.reduce((s, o) => s + Number(o.total_price), 0))} outstanding.
            </Alert>
          )}

          <section>
            <h3 className="ui-section ui-section--sub ui-section--first">Recent orders</h3>
            {orders.length === 0 ? (
              <p className="ui-hint">No orders yet.</p>
            ) : (
              <ul className="cust-orders">
                {orders.slice(0, MAX_ORDERS).map((o) => (
                  <li key={o.id} className="cust-order">
                    <div>
                      <b>{o.id}</b>
                      <div className="ui-cell__meta">
                        {formatDate(o.created_at)} · <span className="cust-order__meal">{o.meal_time}</span>
                      </div>
                    </div>
                    <span className="cust-order__total">{formatMoney(Number(o.total_price))}</span>
                    <OrderTrack status={o.status} />
                    <span className="cust-order__pay">
                      <PaymentMark status={o.payment_status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {orders.length > MAX_ORDERS && <p className="ui-hint">Showing the {MAX_ORDERS} most recent of {orders.length} orders.</p>}
          </section>

          <section>
            <h3 className="ui-section ui-section--sub ui-section--first">Status history</h3>
            {log.length === 0 ? (
              <p className="ui-hint">No changes recorded.</p>
            ) : (
              <ol className="cust-timeline">
                {log.map((l) => {
                  const tone = l.new_status === "pending" ? "warn" : ["rejected", "disabled", "blocked"].includes(l.new_status) ? "bad" : "";
                  const detail = [l.previous_status ? `From ${labelOf(l.previous_status).toLowerCase()}` : null, l.reason, formatDateTime(l.created_at)].filter(Boolean).join(" · ");
                  return (
                    <li key={l.id}>
                      <i className={`cust-timeline__pt${tone ? ` cust-timeline__pt--${tone}` : ""}`} aria-hidden="true" />
                      <div>
                        <div className="cust-timeline__title">{labelOf(l.new_status)}</div>
                        <div className="ui-cell__meta">{detail}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
```

- [ ] **Step 4: Append the profile styles to `src/Pages/Users/customers.css`**

```css

/* ===== Profile drawer ===== */
.cust-head { display: flex; align-items: center; gap: var(--space-4); padding-right: 40px; }
.cust-head h2 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.cust-head__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-top: 6px; color: var(--gray-500); font-size: var(--text-sm); }
.cust-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4) 20px; margin: 0; }
.cust-details dt { color: var(--gray-500); font-size: var(--text-sm); font-weight: 600; }
.cust-details dd { margin: 4px 0 0; overflow-wrap: anywhere; }
.cust-details__wide { grid-column: 1 / -1; }
.cust-orders { margin: 0; padding: 0; list-style: none; }
.cust-order { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--gray-200); }
.cust-order__total { font-weight: 600; text-align: right; }
.cust-order__pay { justify-self: end; }
.cust-order__meal { text-transform: capitalize; }
.cust-timeline { display: grid; margin: 0; padding: 0; list-style: none; }
.cust-timeline > li { position: relative; display: grid; grid-template-columns: 14px 1fr; gap: 14px; padding-bottom: 18px; }
.cust-timeline > li::before { content: ""; position: absolute; left: 6px; top: 14px; bottom: 0; width: 2px; background: var(--gray-200); }
.cust-timeline > li:last-child::before { display: none; }
.cust-timeline__pt { box-sizing: border-box; width: 14px; height: 14px; margin-top: 3px; border: 3px solid var(--color-primary); border-radius: 50%; background: var(--white); }
.cust-timeline__pt--bad { border-color: var(--color-danger); }
.cust-timeline__pt--warn { border-color: var(--color-warning); }
.cust-timeline__title { font-weight: 600; }
@media (max-width: 640px) {
  .cust-details { grid-template-columns: minmax(0, 1fr); }
}
```

- [ ] **Step 5: Edit `src/Pages/Users/Users.tsx` to use the drawer**

(a) Delete the line `import "./users.css"; // still styles the profile modal below until Task 4 replaces it`.

(b) Replace the import line `import { formatDate, formatDateTime } from "../../utils/formatDate";` with `import { formatDateTime } from "../../utils/formatDate";` and delete the line `import { formatMoney } from "../../utils/formatMoney";`.

(c) After the line `import { ACTIONS, type CustomerAction } from "./customerActions";` add:

```tsx
import CustomerDrawer from "./CustomerDrawer";
```

(d) Delete these two lines (the drawer computes them itself):

```tsx
  const p = u.profile;
  const unpaid = p?.order_history.filter((o) => o.payment_status === "unpaid") ?? [];
```

(e) Replace the whole `<Modal open={!!p} title={p?.full_name ?? ""} onClose={u.closeProfile}> … </Modal>` block (the last element before the closing `</div>`) with:

```tsx
      <CustomerDrawer
        profile={u.profile}
        areaName={u.areaName(u.profile?.area_id ?? null)}
        canAct={isSuper}
        onClose={u.closeProfile}
        onAction={(kind) => {
          // close the drawer first so the profile is never stale behind the confirmation dialog
          if (u.profile) open({ kind, user: u.profile });
          u.closeProfile();
        }}
      />
```

- [ ] **Step 6: Move the one still-needed legacy rule, delete `users.css`**

`src/Pages/Users/users.css` ends with `.modal__form label { … }` and `.modal__form textarea { … }`. Other dialogs (Admins, Delivery Areas, Sessions, Food Items, Delivery Persons) lean on the label rule. Read `src/components/common/modal.css`: it already styles `.modal__form input, select, textarea`, so only the label rule needs a new home. Append to `src/components/common/modal.css` (no hex):

```css

/* Labels that wrap a field in a dialog form stack the text above the field (moved here from the retired users.css) */
.modal__form label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: var(--text-base); }
```

Then `git rm src/Pages/Users/users.css` and confirm nothing imports it: `grep -rn "users.css" src` (expected: no output).

- [ ] **Step 7: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/Pages/Users src/components/common src/types`. Expected: no output. Hex check: `grep -nE "#[0-9a-fA-F]{3,8}\b" src/Pages/Users/customers.css src/Pages/Users/CustomerDrawer.tsx src/Pages/Users/Users.tsx src/components/common/modal.css` (expected: no output).

- [ ] **Step 8: Verify the drawer in the browser**

Write `$SCRATCH/drawer-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  await page.goto("http://localhost:5173/users");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("tbody tr");
  const dlg = page.locator("dialog.ui-drawer");
  await page.getByRole("button", { name: "View Amaya Rathnayake" }).click();
  await dlg.waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  out.open = await dlg.evaluate((d) => d.open);
  out.name = await dlg.locator("h2").innerText();
  out.badge = await dlg.locator(".ui-badge").innerText();
  out.actions = await dlg.locator(".ui-actions button").allInnerTexts();
  out.details = await dlg.locator(".cust-details dt").allInnerTexts();
  out.alert = await dlg.locator(".ui-alert").allInnerTexts();
  out.orders = await dlg.locator(".cust-order").count();
  out.firstOrder = (await dlg.locator(".cust-order").first().innerText()).replace(/\s+/g, " ");
  out.tracks = await dlg.locator(".ui-track").count();
  out.timeline = await dlg.locator(".cust-timeline li").count();
  out.panel = await dlg.boundingBox().then((b) => ({ w: Math.round(b.width), right: Math.round(b.x + b.width) }));
  await page.screenshot({ path: S + "/users-profile-after.png" });
  // approve from inside the drawer: drawer closes, confirmation dialog opens
  await dlg.getByRole("button", { name: "Approve" }).click();
  await page.waitForTimeout(300);
  out.afterAction = { drawerOpen: await dlg.evaluate((d) => d.open), modalTitle: await page.locator("dialog.modal[open] .modal__title").innerText() };
  await page.getByRole("button", { name: "Cancel" }).click();
  // a rejected customer shows the reason and no actions
  await page.getByRole("button", { name: /^Rejected/ }).click();
  await page.getByRole("button", { name: "View Sanduni Rajapaksa" }).click();
  await dlg.waitFor({ state: "visible" });
  out.rejected = { badge: await dlg.locator(".ui-badge").innerText(), alerts: await dlg.locator(".ui-alert").allInnerTexts(), actions: await dlg.locator(".ui-actions button").count(), timelineTitles: await dlg.locator(".cust-timeline__title").allInnerTexts() };
  // close ways
  await page.keyboard.press("Escape");
  out.closedByEsc = !(await dlg.evaluate((d) => d.open));
  await page.getByRole("button", { name: "View Sanduni Rajapaksa" }).click();
  await dlg.getByRole("button", { name: "Close" }).click();
  out.closedByButton = !(await dlg.evaluate((d) => d.open));
  // phone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /^Pending/ }).click();
  await page.getByRole("button", { name: "View Amaya Rathnayake" }).click();
  await dlg.waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  out.phone = await dlg.boundingBox().then((b) => ({ w: Math.round(b.width) }));
  out.noHorizontalScroll = await dlg.evaluate((d) => d.scrollWidth <= d.clientWidth);
  await page.screenshot({ path: S + "/users-profile-mobile-after.png" });
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/drawer-check.js"`.

Expected: `open` true; `name` `Amaya Rathnayake`; `badge` `Pending approval`; `actions` is exactly `["Approve","Reject"]`; `details` `["Email","Phone","Area","Address"]`; `alert` has one entry starting `2 unpaid orders` and containing `outstanding` but not `blocked automatically`; `orders` 4 with the newest (`ORD-20261016-0302`) first; `tracks` 4; `timeline` 1; `panel` `w` 520 and `right` 1440; `afterAction.drawerOpen` false and `modalTitle` `Approve Amaya Rathnayake`; `rejected.badge` `Rejected`, its alerts include `Rejected: Address is outside the delivery areas`, `actions` 0, `timelineTitles` start with `Rejected`; `closedByEsc` and `closedByButton` true; `phone.w` 390; `noHorizontalScroll` true. A PAGEERROR is a failure.

Read `users-profile-after.png` against `docs/superpowers/mockups/png/users-profile-desktop.png` (large avatar, name, status badge, Approve and Reject, email/phone/address, a turmeric unpaid notice, order rows with the lifecycle track and payment dots, a vertical status timeline) and `users-profile-mobile-after.png` (full-width, single column).

- [ ] **Step 9: Verify nothing else changed when `users.css` went away**

Run `TAG=after SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/legacy-shots.js"`, then Read each pair `legacy-reports-before.png` / `legacy-reports-after.png`, and the same for `admins`, `sessions` and `food-items`. Report in one line per page what differs. Acceptable: Reports tab buttons look slightly different (they now follow `dashboard.css` alone) as long as the tabs are all visible and the active one is distinguishable; Admins column widths shifting to the `admins.css` values. Not acceptable: missing or overlapping content, a control that lost its border, or dialogs whose labels no longer stack. Open one dialog on Admins ("Add admin") and one on Sessions with a screenshot to confirm labels still stack above their fields. If something is broken, fix it with the smallest change in the CSS file of that page (or `modal.css`), and list it in your report.

- [ ] **Step 10: Commit**

```bash
git add src/Pages/Users/CustomerDrawer.tsx src/Pages/Users/Users.tsx src/Pages/Users/customers.css src/Pages/Users/users.css src/types/users.ts src/components/common/modal.css
git commit -m "$(cat <<'EOF'
feat(users): profile drawer with recent orders and status timeline; retire users.css

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

(`git add` of the deleted `users.css` path stages its removal. If Step 9 required a fix in another CSS file, add that file to the commit and name it in the commit body.)

---

### Task 5: Document, run the final checks, capture "after" shots

**Files:**
- Modify: `docs/ADMIN-PLAN.md`

- [ ] **Step 1: Update the UI kit paragraph in `docs/ADMIN-PLAN.md`**

Find the paragraph that starts with `**UI kit.**` and replace the whole paragraph (it is one line) with:

```
**UI kit.** New and migrated pages use `src/components/ui` (`import { Button, Chip, Chips, Segmented, SearchField, Avatar, Drawer, OrderTrack, PaymentMark, Menu, SelectionBar, Badge, Card, PageHeader, FilterBar, Field, DataTable, Alert, EmptyState, Spinner, useToast } from "../../components/ui"`). Colours, spacing, type and radii come from the tokens in `src/styles/variables.css`; never write a hex value in a page stylesheet. The look (Tea sidebar, Paper ground, Leaf actions, Turmeric for "needs a human", Brick for failures, Bricolage Grotesque headings, IBM Plex Sans body, ruled rows instead of cards) is specified in `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md` with mockups in `docs/superpowers/mockups/`. Lists use `DataTable` (ruled rows, stacked cards on phones; `rowTone` for the coloured edge; a column's `mobile` slot places it on a phone card or `hide`s it); a filter that is one click is a `Chip`; a date range is a `Segmented`; a search box is a `SearchField`; people and items get an `Avatar`; a profile or detail view is a `Drawer`; row actions are one primary `Button` plus a `Menu`; errors use `Alert`; success feedback uses `useToast`; confirms use `ConfirmDialog` (`tone="primary"` for non-destructive ones, `danger` otherwise). The kit's `box-sizing: border-box` only reaches elements with a `ui-` class, so any rule that sizes a bare `input`, `select` or `textarea` (width, min-height, padding, border) must set `box-sizing: border-box` itself. Look at `src/Pages/orders/Orders.tsx`, `src/Pages/Dashboard/Dashboard.tsx` and `src/Pages/Users/Users.tsx` for reference pages and at `/ui-kit` in `npm run dev` for every component. Pages not yet migrated still use their own CSS (and `src/Pages/Dashboard/dashboard.css`, which Reports, Audit Logs and Settings import) until their plan lands.
```

- [ ] **Step 2: Run the mechanical checks**

```bash
npx tsc -b                       # no output
npx eslint src                   # no output
grep -rnE "#[0-9a-fA-F]{3,8}\b" src/components/ui src/Pages/Dashboard/overview.css src/Pages/Dashboard/Dashboard.tsx src/Pages/Dashboard/AttentionStrip.tsx src/Pages/Dashboard/KpiPanel.tsx src/Pages/Dashboard/SessionChart.tsx src/Pages/Dashboard/TopItemsList.tsx src/Pages/Dashboard/AreaList.tsx src/Pages/Dashboard/dashboard.logic.ts src/Pages/Users src/components/common src/Pages/UiKit src/Pages/orders   # no output
npm run build                    # completes with no errors
node "$SCRATCH/dashboard-logic-check.mjs"   # prints: dashboard.logic OK
```

If `eslint src` reports errors only in files this plan did not touch, list them verbatim in your report and do not fix them here. If the hex grep prints anything, report each hit with file and line.

- [ ] **Step 3: Capture "after" screenshots**

Write `$SCRATCH/plan3-shots.js`:

```js
async (page) => {
  const S = process.env.SCRATCH;
  const out = [];
  const shot = async (path, name, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("http://localhost:5173" + path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${S}/${name}.png` });
    out.push(name);
  };
  await shot("/dashboard", "p3-dashboard-desktop", 1440, 1500);
  await shot("/dashboard", "p3-dashboard-mobile", 390, 2600);
  await shot("/users", "p3-users-desktop", 1440, 900);
  await shot("/users", "p3-users-mobile", 390, 1400);
  await shot("/orders", "p3-orders-desktop", 1440, 900);
  await shot("/reports", "p3-reports-desktop", 1440, 900);
  await shot("/ui-kit", "p3-kit-desktop", 1440, 3000);
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js docs/superpowers/ui-baseline/setup-dashboard-users.js "$SCRATCH/plan3-shots.js"`, then Read `p3-dashboard-desktop.png`, `p3-dashboard-mobile.png`, `p3-users-desktop.png`, `p3-users-mobile.png`, `p3-orders-desktop.png` and `p3-reports-desktop.png`. Compare Dashboard and Users with their mockups under `docs/superpowers/mockups/png/`. Confirm Orders still looks like `orders-desktop.png` (regression check; this plan touched shared CSS). In your report list, one line each: any visible difference from the mockups on Dashboard and Users, anything that looks broken on Orders or Reports, and anything on Notices, Delivery Areas, Sessions, Food Items, Settings that now looks broken by this plan's shared changes (Reports uses the new `RangeFilters`; the deleted `users.css`). Do not fix code in this task.

- [ ] **Step 4: Commit**

```bash
git add docs/ADMIN-PLAN.md
git commit -m "$(cat <<'EOF'
docs: add the dashboard and users kit pieces to the admin plan conventions

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Next plan

- **Plan 4:** Notices, Delivery Areas, Sessions, Food Items, Delivery Persons, Admins, Reports, Settings, Audit Logs, sign-in and password reset; then the accessibility pass (labels on every form, removal of the legacy `.modal__btn*` classes, the legacy `--primary-color` aliases, and the Dashboard-only rules still sitting in `src/Pages/Dashboard/dashboard.css`). `Switch` and `Tabs` are built there when Settings and Reports need them.
