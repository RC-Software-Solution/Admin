# Admin Visual Identity (Phases A and B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Admin Panel the approved visual identity (fonts, palette, restyled kit and shell) and rebuild Orders as the showcase page with status chips, ticket rows, the order lifecycle track, a one-click next action and a floating selection bar.

**Architecture:** Plan 1 already shipped tokens, a UI kit and a responsive shell. This plan changes the token values and restyles the kit and shell in place (same class names, same component APIs), adds the few kit pieces Orders needs (`Chip`, `OrderTrack`, `PaymentMark`, `Menu`, `SelectionBar`, `DataTable` row tones and alignment), then rebuilds the Orders page on them. Fonts are self-hosted woff2 files, so there are no new dependencies. Unmigrated pages keep their own CSS and simply sit in the new shell on a Paper background.

**Tech Stack:** React 19, TypeScript 5.9 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 7, react-router-dom 7, react-icons 5.5 (Lucide set, `react-icons/lu`). No test framework: verification is `npx tsc -b`, `npx eslint`, and headless-browser screenshots and measurements against stubbed API responses.

**Spec:** `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md`. Visual reference: `docs/superpowers/mockups/admin-ui-mockups.html` and `docs/superpowers/mockups/png/` (open `orders-desktop.png`, `orders-mobile.png`, `components-desktop.png`). Earlier context: `docs/superpowers/specs/2026-10-18-admin-ui-standardization-design.md` and `docs/superpowers/plans/2026-10-18-admin-ui-foundation.md` (already executed).

**Scope note:** This is Phases A and B. Plan 3 covers Dashboard and Users, plan 4 the remaining pages. Do not touch pages other than Orders; they are restyled when their own plan lands.

## Global Constraints

- Admin repo root is `C:\Users\budglk\RC\Admin`; run every command from there (Git Bash: `cd /c/Users/budglk/RC/Admin`). Branch `feat/notices`.
- No new npm dependencies and no `npm install` (the working tree has an unrelated uncommitted `package-lock.json` change that must stay untouched). Fonts are downloaded as files into `src/assets/fonts`.
- No hex colours (`#rgb`/`#rrggbb`) outside `src/styles/variables.css` in any file this plan creates or rewrites. Everything else uses `var(--token)`.
- Kit class names all start with `ui-`.
- Palette (values copied from the spec): Tea `#123524`, Leaf `#16803c`, Paper `#f3f5f0`, Ink `#18241d`, Mist `#5c6b61`, Turmeric `#e0a100` (text on it `#6b4b00`), Brick `#b3362a`, Mint `#8fd0a8`.
- Type: Bricolage Grotesque (headings, big numbers) and IBM Plex Sans (everything else); sentence-case labels, no all-caps labels.
- Radii: 4px badges, 6px controls, 10px floating things and panels, 999px chips and the user pill.
- Breakpoints are 640px (phone) and 1024px (drawer); write the literals in media queries. Sidebar width is 244px.
- TypeScript rules: `import type` for type-only imports, no enums or parameter properties, no unused locals or parameters. Lint rule `react-refresh/only-export-components`: a `.tsx` file exports components (and types) only.
- Imports are case-sensitive and the Orders directory is lowercase: `src/Pages/orders`. Files are CRLF on Windows; ignore line-ending warnings.
- Commit one task at a time, staging only the files the task names by explicit path (never `git add -A`). End every commit message with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never commit `package-lock.json`, `.env`, or the untracked `docs/superpowers/ui-baseline/after/` folder.
- Before claiming a task done: `npx tsc -b` prints nothing and `npx eslint <touched paths>` prints nothing.

## Verification tooling (read once)

The Vite dev server must be running at `http://localhost:5173` (`npm run dev`; if `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` is not `200`, start it in the background). The backend is not running, so browser checks use the stubs in `docs/superpowers/ui-baseline/setup.js` (a fake `super_admin` session plus stubbed API answers, including 30 orders for `/orders`).

Run browser scripts with a headless runner. If the Playwright MCP tool `browser_run_code_unsafe` works in your session, use it (pass `filename` for a script file). If it reports the browser is "already in use", use the standalone runner below; never close or kill another Edge process.

Standalone runner (one-time setup, outside the repo):

```bash
mkdir -p "$SCRATCH/pw" && cd "$SCRATCH/pw" && npm init -y >/dev/null && npm install playwright-core --silent
```

where `$SCRATCH` is your scratchpad directory. Save this as `$SCRATCH/pw/run.mjs` (it uses the installed Microsoft Edge, no browser download):

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

Usage: `node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/my-check.js"`. Each script file contains `async (page) => { ... }`; scripts run in order on one page, so list `setup.js` first. Write your own throwaway check scripts in `$SCRATCH`, not in the repo. Screenshot to `$SCRATCH` and look at the images with the Read tool.

If Vite serves an empty or stale file right after you create it, `touch` the file or restart the dev server.

## File structure

Create:
- `src/assets/fonts/bricolage-grotesque-latin-wght.woff2`, `ibm-plex-sans-latin-400.woff2`, `ibm-plex-sans-latin-500.woff2`, `ibm-plex-sans-latin-600.woff2`, `README.txt`
- `src/styles/fonts.css`
- `src/components/ui/Chip.tsx`, `OrderTrack.tsx`, `PaymentMark.tsx`, `Menu.tsx`, `SelectionBar.tsx`

Rewrite (whole file): `src/styles/variables.css`, `src/styles/global.css`, `src/components/ui/ui.css`, `src/components/ui/DataTable.tsx`, `src/Pages/UiKit/UiKit.tsx`, `src/components/Sidebar/Sidebar.tsx`, `src/components/Sidebar/sidebar.css`, `src/layouts/layout.css`, `src/components/Header/topbar.css`, `src/components/common/modal.css`, `src/Pages/orders/Orders.tsx`.

Modify (small edits): `src/index.css`, `src/components/ui/index.ts`, `src/components/Header/Topbar.tsx`, `src/components/Header/UserMenu.tsx`, `src/components/Header/Bell.tsx`, `src/components/Header/GlobalSearch.tsx`, `docs/ADMIN-PLAN.md`.

---

### Task 1: Self-hosted fonts, new token values, global base

**Files:**
- Create: `src/assets/fonts/*.woff2` (4 files), `src/assets/fonts/README.txt`, `src/styles/fonts.css`
- Rewrite: `src/styles/variables.css`, `src/styles/global.css`
- Modify: `src/index.css`

**Interfaces:**
- Produces: the font families `"Bricolage Grotesque"` and `"IBM Plex Sans"` available app-wide; token names kept from plan 1 (`--color-primary*`, `--color-danger*`, `--color-warning*`, `--color-info*`, `--white`, `--gray-50…900`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--overlay`, `--focus-ring`, `--z-*`, legacy `--primary-color` etc.) with new values, plus new tokens: `--tea`, `--mint`, `--paper`, `--ink`, `--font-head`, `--rail-text`, `--rail-muted`, `--on-dark-hover`, `--on-dark-active`, `--on-dark-soft`, `--hover-wash`.

- [ ] **Step 1: Download the font files**

```bash
mkdir -p src/assets/fonts
B=https://cdn.jsdelivr.net/fontsource/fonts
curl -fsSL -o src/assets/fonts/bricolage-grotesque-latin-wght.woff2 "$B/bricolage-grotesque:vf@latest/latin-wght-normal.woff2"
for w in 400 500 600; do curl -fsSL -o src/assets/fonts/ibm-plex-sans-latin-$w.woff2 "$B/ibm-plex-sans@latest/latin-$w-normal.woff2"; done
ls -l src/assets/fonts
```

Expected: four `.woff2` files, each between 20 KB and 45 KB. If a download fails (non-zero exit), stop and report; do not substitute another font.

- [ ] **Step 2: Create `src/assets/fonts/README.txt`**

```
Bricolage Grotesque (variable, weight 200-800) and IBM Plex Sans (400, 500, 600): Latin subset woff2 files from Fontsource (https://fontsource.org), served from the app so there is no CDN dependency. Both families are licensed under the SIL Open Font License 1.1. Sinhala and Tamil text falls back to the system font.
```

- [ ] **Step 3: Create `src/styles/fonts.css`**

```css
@font-face {
  font-family: "Bricolage Grotesque";
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url("../assets/fonts/bricolage-grotesque-latin-wght.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../assets/fonts/ibm-plex-sans-latin-400.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("../assets/fonts/ibm-plex-sans-latin-500.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../assets/fonts/ibm-plex-sans-latin-600.woff2") format("woff2");
}
```

- [ ] **Step 4: Replace `src/styles/variables.css`**

```css
:root {
  /* Palette: see docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md */
  --tea: #123524; /* sidebar, selected chips, toasts */
  --mint: #8fd0a8; /* marker on Tea */
  --paper: #f3f5f0; /* page ground */
  --ink: #18241d; /* text */

  /* Semantic colours. Each has a solid colour plus bg / border / text for soft surfaces. */
  --color-primary: #16803c; /* Leaf: accents, active states, focus */
  --color-primary-solid: #16803c; /* filled buttons; white text on it is 5.0:1 */
  --color-primary-solid-hover: #116332;
  --color-primary-bg: #e2f0e6;
  --color-primary-border: #b9d9c3;
  --color-primary-text: #116332;

  --color-danger: #b3362a; /* Brick: failed, cancelled, destructive */
  --color-danger-hover: #8a261c;
  --color-danger-bg: #f8dfdb;
  --color-danger-border: #e8b5ae;
  --color-danger-text: #8a261c;

  --color-warning: #e0a100; /* Turmeric: needs a human (use as a fill; text on it is --color-warning-text) */
  --color-warning-bg: #fbefc9;
  --color-warning-border: #ecd185;
  --color-warning-text: #6b4b00;

  --color-info: #2c4c68;
  --color-info-bg: #e6edf3;
  --color-info-border: #c6d4e0;
  --color-info-text: #1f3a52;

  --white: #ffffff;
  --gray-50: #f6f8f4;
  --gray-100: #eef1ec;
  --gray-200: #dde3db; /* hairlines */
  --gray-300: #c3ccc1; /* control borders */
  --gray-400: #98a69c;
  --gray-500: #5c6b61; /* Mist: secondary text (5.5:1 on white) */
  --gray-600: #4a5a50;
  --gray-700: #36463c;
  --gray-800: #25352b;
  --gray-900: #18241d;

  /* On the dark rail and on dark pills */
  --rail-text: #c9dccf;
  --rail-muted: #86a893;
  --on-dark-hover: rgba(255, 255, 255, 0.06);
  --on-dark-active: rgba(255, 255, 255, 0.1);
  --on-dark-soft: rgba(255, 255, 255, 0.72);
  --hover-wash: rgba(18, 53, 36, 0.07);

  --font-head: "Bricolage Grotesque", "IBM Plex Sans", system-ui, sans-serif;
  --font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", "Nirmala UI", Roboto, Arial, sans-serif;
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

  --radius-sm: 4px; /* badges */
  --radius-md: 6px; /* controls */
  --radius-lg: 10px; /* floating things and panels */
  --radius-full: 999px; /* chips, user pill */

  --shadow-sm: 0 1px 2px rgba(18, 53, 36, 0.08);
  --shadow-md: 0 8px 16px rgba(18, 53, 36, 0.12);
  --shadow-lg: 0 12px 32px rgba(18, 53, 36, 0.16), 0 2px 6px rgba(18, 53, 36, 0.08); /* menus, dialogs, toasts */
  --overlay: rgba(18, 53, 36, 0.45);
  --focus-ring: 0 0 0 3px rgba(22, 128, 60, 0.28);

  --z-drawer: 100;
  --z-dropdown: 1000;
  --z-toast: 3000;

  /* Breakpoints (media queries cannot read custom properties, so write the literals): 640px phone, 1024px drawer */

  /* Legacy names, still used by notices.css; remove when the Notices page migrates. */
  --primary-color: var(--color-primary);
  --danger-color: var(--color-danger);
  --warning-color: var(--color-warning);
  --neutral-color: var(--gray-500);
}
```

- [ ] **Step 5: Replace `src/styles/global.css`**

```css
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-sans);
  background: var(--paper);
  color: var(--ink);
  font-variant-numeric: tabular-nums; /* amounts and ids line up */
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  font-family: var(--font-head);
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

- [ ] **Step 6: Edit `src/index.css`**

Replace the line `@import "./styles/variables.css";` with:

```css
@import "./styles/fonts.css";
@import "./styles/variables.css";
```

- [ ] **Step 7: Verify**

Run: `npx tsc -b`. Expected: no output.

Write `$SCRATCH/fonts-check.js`:

```js
async (page) => {
  const bad = [];
  page.on("response", (r) => { if (r.url().includes("/assets/fonts/") && r.status() !== 200) bad.push(r.url() + " " + r.status()); });
  await page.goto("http://localhost:5173/orders");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return await page.evaluate((bad) => ({
    bodyFont: getComputedStyle(document.body).fontFamily.split(",")[0],
    h1Font: getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily.split(",")[0],
    bodyBg: getComputedStyle(document.body).backgroundColor,
    loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`),
    bad,
  }), bad);
}
```

Run: `node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/fonts-check.js"`.
Expected: `bodyFont` is `"IBM Plex Sans"`, `h1Font` is `"Bricolage Grotesque"`, `bodyBg` is `rgb(243, 245, 240)`, `loaded` lists Bricolage Grotesque and IBM Plex Sans (400/500/600 as used), `bad` is `[]`. Take a screenshot of `/orders` and `/users`: both pages still render with the sidebar and topbar; backgrounds are now the pale green-grey Paper; green buttons are slightly deeper; other colours shift to the new palette.

- [ ] **Step 8: Commit**

```bash
git add src/assets/fonts src/styles/fonts.css src/styles/variables.css src/styles/global.css src/index.css
git commit -m "$(cat <<'EOF'
feat(ui): add self-hosted fonts and the tea, leaf and paper palette

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Restyle the kit stylesheet

**Files:**
- Rewrite: `src/components/ui/ui.css`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: styles for every existing kit class (unchanged names) plus classes that Task 3 components and the Orders page use: `.ui-chips`, `.ui-chip`, `.ui-chip__count`, `.ui-chip--attn`, `.ui-track`, `.ui-track__bars`, `.ui-track__label`, `.ui-track--{status}`, `.ui-seg` and `.ui-seg--wait|on|done|x|bad`, `.ui-pay`, `.ui-pay__dot`, `.ui-pay--{paid|unpaid|pending|ignored}`, `.ui-menu`, `.ui-menu__trigger`, `.ui-menu__panel`, `.ui-menu__item`, `.ui-menu__item--danger`, `.ui-selbar`, `.ui-cell__title`, `.ui-cell__meta`, `.ui-hint`, `.ui-pager`, `.ui-radios`, `.ui-radio` (`.is-on`, `.is-bad`), `.ui-right`, `.ui-row--attn`, `.ui-row--bad`, and DataTable phone slots `title|amount|select|inline|actions`.

- [ ] **Step 1: Replace `src/components/ui/ui.css` with the following (whole file)**

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
.ui-right {
  text-align: right;
}
.ui-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.ui-hint {
  margin: 0 0 var(--space-3);
  color: var(--gray-500);
  font-size: var(--text-sm);
}

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
  min-height: 38px;
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}
.ui-btn--sm {
  min-height: 31px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}
.ui-btn:disabled {
  opacity: 0.45;
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
  color: var(--ink);
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
  color: var(--ink);
}
.ui-btn--ghost:hover:not(:disabled) {
  background: var(--hover-wash);
}
@media (max-width: 640px) {
  /* Touch targets */
  .ui-btn--md { min-height: 44px; }
  .ui-btn--sm { min-height: 38px; }
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
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: var(--text-xs);
  font-weight: 600;
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
.ui-empty__title { margin: 0; font-family: var(--font-head); font-size: 19px; font-weight: 700; color: var(--ink); }
.ui-empty__hint { margin: 0; font-size: var(--text-sm); }

/* ===== Card (panel) ===== */
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
.ui-card__title { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.ui-card__body { padding: var(--space-5); }

/* ===== PageHeader ===== */
.ui-pageheader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0 var(--space-5);
}
.ui-pageheader__title { margin: 0; font-size: 32px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.ui-pageheader__subtitle { margin: var(--space-2) 0 0; color: var(--gray-500); font-size: var(--text-base); }
@media (max-width: 640px) {
  .ui-pageheader__title { font-size: 26px; }
}

/* ===== FilterBar ===== */
.ui-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.ui-filterbar :is(input, select) {
  min-height: 38px;
  padding: 0 var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.ui-filterbar :is(input, select):focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}
.ui-filterbar label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--gray-500);
}
/* Phone-only control (e.g. select-all, whose table header is hidden on phones) */
.ui-filterbar .ui-phone-only { display: none; }

@media (max-width: 640px) {
  .ui-filterbar > * { flex: 1 1 140px; }
  .ui-filterbar :is(input, select) { min-height: 44px; min-width: 0; flex: 1 1 140px; font-size: 16px; }
  .ui-filterbar label { flex: 1 1 100%; }
  .ui-filterbar .ui-phone-only { display: flex; }
  .ui-filterbar .ui-phone-only input { min-height: 0; flex: none; }
}

/* ===== Field ===== */
.ui-field { display: flex; flex-direction: column; gap: 6px; }
.ui-field__label { font-size: var(--text-sm); font-weight: 600; color: var(--ink); }
.ui-field :is(input, select, textarea) {
  min-height: 40px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
  font-size: var(--text-base);
}
.ui-field :is(input, select, textarea):focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}
.ui-field :is(input, select, textarea)[aria-invalid="true"] { border-color: var(--color-danger); }
/* After the base rule above: equal specificity, so source order decides. 16px stops iOS focus zoom. */
@media (max-width: 640px) {
  .ui-field :is(input, select, textarea) { font-size: 16px; min-height: 44px; }
}
.ui-field__hint, .ui-field__error { margin: 0; font-size: var(--text-xs); }
.ui-field__hint { color: var(--gray-500); }
.ui-field__error { color: var(--color-danger-text); font-weight: 500; }

/* ===== Toast ===== */
.ui-toasts {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: min(380px, calc(100vw - 2 * var(--space-4)));
}
.ui-toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 14px var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  background: var(--tea);
  color: var(--white);
  font-size: var(--text-base);
  font-weight: 500;
}
.ui-toast--danger { background: var(--color-danger); }
.ui-toast__close {
  flex-shrink: 0;
  border: 0;
  background: none;
  color: var(--on-dark-soft);
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
}
@media (max-width: 640px) {
  .ui-toasts { left: var(--space-4); max-width: none; bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px)); }
}

/* ===== Chips (filters that are one click) ===== */
.ui-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--ink);
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}
.ui-chip:hover { background: var(--gray-50); }
.ui-chip__count { font-size: var(--text-xs); font-weight: 600; color: var(--gray-500); }
.ui-chip[aria-pressed="true"] { background: var(--tea); border-color: var(--tea); color: var(--white); }
.ui-chip[aria-pressed="true"] .ui-chip__count { color: var(--on-dark-soft); }
.ui-chip--attn[aria-pressed="true"] { background: var(--color-warning-bg); border-color: var(--color-warning); color: var(--color-warning-text); }
@media (max-width: 640px) {
  .ui-chip { min-height: 40px; }
}

/* ===== Order lifecycle track ===== */
.ui-track { display: flex; flex-direction: column; gap: 5px; }
.ui-track__bars { display: flex; gap: 3px; }
.ui-seg { width: 26px; height: 6px; border-radius: 3px; background: var(--gray-200); }
.ui-seg--wait { background: var(--color-warning); }
.ui-seg--on { background: var(--color-primary); }
.ui-seg--done { background: var(--tea); }
.ui-seg--x { background: repeating-linear-gradient(135deg, var(--color-danger-border) 0 3px, var(--color-danger-bg) 3px 6px); }
.ui-seg--bad { background: var(--color-danger); }
.ui-track__label { font-size: 12.5px; font-weight: 600; }
.ui-track--pending .ui-track__label { color: var(--color-warning-text); }
.ui-track--cancelled .ui-track__label,
.ui-track--delivery_failed .ui-track__label { color: var(--color-danger-text); }

/* ===== Payment mark ===== */
.ui-pay { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 500; white-space: nowrap; }
.ui-pay__dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex: none; }
.ui-pay--paid .ui-pay__dot { background: var(--color-primary); }
.ui-pay--unpaid { font-weight: 600; }
.ui-pay--unpaid .ui-pay__dot { background: var(--color-warning); }
.ui-pay--pending, .ui-pay--ignored { color: var(--gray-500); }
.ui-pay--pending .ui-pay__dot { border: 2px solid var(--gray-300); }
.ui-pay--ignored .ui-pay__dot { background: var(--gray-300); }

/* ===== Row menu ("...") ===== */
.ui-menu { position: relative; display: inline-block; }
.ui-menu__trigger {
  display: inline-grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  color: var(--ink);
  font-size: 18px;
  cursor: pointer;
}
.ui-menu__trigger:hover { background: var(--hover-wash); }
/* position: fixed so a table's horizontal scroll area cannot clip it */
.ui-menu__panel {
  position: fixed;
  z-index: var(--z-dropdown);
  min-width: 190px;
  padding: 6px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.ui-menu__item {
  display: block;
  width: 100%;
  padding: 9px var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  color: var(--ink);
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
  cursor: pointer;
}
.ui-menu__item:hover, .ui-menu__item:focus-visible { background: var(--gray-100); }
.ui-menu__item--danger { color: var(--color-danger-text); }

/* ===== Selection bar (floats at the bottom while rows are selected) ===== */
.ui-selbar {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-dropdown);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 10px 10px 10px var(--space-5);
  background: var(--tea);
  color: var(--white);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
}
.ui-selbar .ui-btn { border-radius: var(--radius-full); }
@media (min-width: 1025px) {
  /* centre on the content area, not the window (the sidebar is 244px wide) */
  .ui-selbar { left: calc(50% + 122px); }
}
@media (max-width: 640px) {
  .ui-selbar {
    left: var(--space-3);
    right: var(--space-3);
    transform: none;
    justify-content: space-between;
    border-radius: var(--radius-lg);
    bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  }
}

/* ===== Radio cards (pick one next step) ===== */
.ui-radios { display: grid; gap: var(--space-2); margin: 0; padding: 0; border: 0; min-width: 0; }
.ui-radios legend { padding: 0 0 6px; font-size: var(--text-sm); font-weight: 600; }
.ui-radio {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  cursor: pointer;
}
.ui-radio input { accent-color: var(--color-primary); }
.ui-radio.is-on { border-color: var(--color-primary); background: var(--color-primary-bg); }
.ui-radio.is-bad.is-on { border-color: var(--color-danger); background: var(--color-danger-bg); }
.ui-radio.is-bad input { accent-color: var(--color-danger); }

/* ===== Two-line cell, pager ===== */
.ui-cell__title { display: block; font-size: 14.5px; font-weight: 600; }
.ui-cell__meta { margin-top: 2px; color: var(--gray-500); font-size: var(--text-sm); }
.ui-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  color: var(--gray-500);
  font-size: var(--text-sm);
}

/* ===== DataTable (ruled rows on paper) ===== */
.ui-datatable > .ui-alert { margin: 0 0 var(--space-3); }
.ui-datatable__state { display: flex; justify-content: center; padding: var(--space-8); color: var(--gray-500); }
.ui-datatable__scroll { overflow-x: auto; border-top: 1px solid var(--gray-300); }
.ui-table { width: 100%; border-collapse: collapse; font-size: var(--text-base); }
.ui-table th {
  height: 40px;
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-500);
  font-size: 12.5px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}
.ui-table td {
  padding: 11px var(--space-3);
  border-bottom: 1px solid var(--gray-200);
  vertical-align: middle;
}
.ui-table tbody tr:hover { background: var(--white); }
/* A coloured edge marks rows that need a human (turmeric) or went wrong (brick) */
.ui-row--attn > td:first-child { box-shadow: inset 4px 0 0 var(--color-warning); }
.ui-row--bad > td:first-child { box-shadow: inset 4px 0 0 var(--color-danger); }

/* Phones: every row becomes a card. Select first, title and amount on one line, then inline cells, then actions. */
@media (max-width: 640px) {
  .ui-table, .ui-table tbody { display: block; }
  .ui-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .ui-table tr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--gray-200);
  }
  .ui-table td {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    flex: 0 0 100%;
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
  .ui-table td[data-slot="select"] { order: -1; flex: none; }
  .ui-table td[data-slot="title"] { flex: 1 1 0; min-width: 0; }
  .ui-table td[data-slot="amount"] { flex: none; }
  .ui-table td[data-slot="inline"] { flex: 0 1 auto; }
  .ui-table td[data-slot="actions"] { flex: 1 1 auto; flex-wrap: wrap; justify-content: flex-end; }
  .ui-row--attn { box-shadow: inset 4px 0 0 var(--color-warning); }
  .ui-row--bad { box-shadow: inset 4px 0 0 var(--color-danger); }
  .ui-row--attn > td:first-child, .ui-row--bad > td:first-child { box-shadow: none; }
  .ui-nowrap { white-space: normal; }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc -b`. Expected: no output.

Write `$SCRATCH/kit-style-check.js`:

```js
async (page) => {
  await page.goto("http://localhost:5173/ui-kit");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const css = (sel, props) => page.evaluate(([s, p]) => { const el = document.querySelector(s); const c = getComputedStyle(el); return Object.fromEntries(p.map((k) => [k, c[k]])); }, [sel, props]);
  return {
    primary: await css(".ui-btn--primary", ["backgroundColor", "borderRadius", "minHeight"]),
    badge: await css(".ui-badge--danger", ["backgroundColor", "color", "borderRadius"]),
    title: await css(".ui-pageheader__title", ["fontFamily", "fontSize", "fontWeight"]),
  };
}
```

Run: `node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/kit-style-check.js"`.
Expected: primary button `rgb(22, 128, 60)`, radius `6px`, min-height `38px`; danger badge background `rgb(248, 223, 219)`, text `rgb(138, 38, 28)`, radius `4px`; page title font starts with Bricolage Grotesque, size `32px`, weight `700`. Screenshot `/ui-kit` at 1440 and 390 wide and look: tea-green toast, chips and track are not yet shown (Task 3 adds them); the existing sections (buttons, badges, alerts, field, filter bar, DataTable) all render with the new palette and no layout breakage. At 390px the DataTable rows still render as cards.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ui.css
git commit -m "$(cat <<'EOF'
feat(ui): restyle the ui kit stylesheet to the new identity

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Kit components Orders needs, and the gallery

**Files:**
- Rewrite: `src/components/ui/DataTable.tsx`, `src/Pages/UiKit/UiKit.tsx`
- Create: `src/components/ui/Chip.tsx`, `src/components/ui/OrderTrack.tsx`, `src/components/ui/PaymentMark.tsx`, `src/components/ui/Menu.tsx`, `src/components/ui/SelectionBar.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Consumes: Task 2 classes; `useDismiss(open, ref, close)` from `src/hooks/useDismiss.ts`; `OrderStatus`, `PaymentStatus` from `src/types/orders.ts`; `react-icons/lu`.
- Produces (exact):
  - `Chip({ selected?: boolean, count?: number, attention?: boolean, ...ButtonHTMLAttributes })` and `Chips({ label: string, children })`.
  - `OrderTrack({ status: OrderStatus })`.
  - `PaymentMark({ status: PaymentStatus })`.
  - `Menu({ label: string, items: MenuItem[] })` and `interface MenuItem { label: string; onSelect: () => void; tone?: "danger" }`; renders nothing when `items` is empty.
  - `SelectionBar({ label: string, children })`.
  - `Column<T>` gains `align?: "right"` and `mobile?: "title" | "amount" | "select" | "inline" | "actions"`; `DataTable<T>` gains `rowTone?: (row: T) => "attn" | "bad" | undefined`.

- [ ] **Step 1: Replace `src/components/ui/DataTable.tsx`**

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
  align?: "right"; // numbers and actions
  // Slot on phones: title and amount share the first line, select goes before them, inline cells sit unlabeled
  // side by side, actions come last. Omit for a label/value pair.
  mobile?: "title" | "amount" | "select" | "inline" | "actions";
  nowrap?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean; // true until the first load finishes
  error?: string | null;
  emptyTitle?: string;
  rowTone?: (row: T) => "attn" | "bad" | undefined; // coloured edge: needs a human / went wrong
}

const cls = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ") || undefined;

export function DataTable<T>({ columns, rows, rowKey, loading = false, error, emptyTitle = "Nothing to show", rowTone }: DataTableProps<T>) {
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
                  <th key={c.key} role="columnheader" scope="col" className={cls(c.nowrap && "ui-nowrap", c.align === "right" && "ui-right")}>
                    {c.header ?? c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => {
                const tone = rowTone?.(r);
                return (
                  <tr key={rowKey(r)} role="row" className={tone ? `ui-row--${tone}` : undefined}>
                    {columns.map((c) => (
                      <td key={c.key} role="cell" data-label={c.label} data-slot={c.mobile} className={cls(c.nowrap && "ui-nowrap", c.align === "right" && "ui-right")}>
                        {c.cell(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Chip.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
  attention?: boolean; // turmeric when selected: a filter that means "needs a human"
}

/** A one-click filter. Exposes its state as aria-pressed. */
export function Chip({ selected = false, count, attention = false, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={["ui-chip", attention && "ui-chip--attn", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {count !== undefined && <span className="ui-chip__count">{count}</span>}
    </button>
  );
}

export function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ui-chips" role="group" aria-label={label}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/OrderTrack.tsx`**

```tsx
import type { OrderStatus } from "../../types/orders"; // the one domain type the kit knows

// Four segments: pending, preparing, delivering, delivered. One state per segment.
const TRACK: Record<OrderStatus, { segs: string[]; label: string }> = {
  pending: { segs: ["wait", "", "", ""], label: "Pending" },
  preparing: { segs: ["on", "on", "", ""], label: "Preparing" },
  delivering: { segs: ["on", "on", "on", ""], label: "Delivering" },
  delivered: { segs: ["done", "done", "done", "done"], label: "Delivered" },
  completed: { segs: ["done", "done", "done", "done"], label: "Completed" },
  cancelled: { segs: ["x", "x", "x", "x"], label: "Cancelled" },
  delivery_failed: { segs: ["on", "on", "on", "bad"], label: "Delivery failed" },
};

/** How far an order has come. Turmeric asks for action, brick means it failed. */
export function OrderTrack({ status }: { status: OrderStatus }) {
  const { segs, label } = TRACK[status];
  return (
    <div className={`ui-track ui-track--${status}`} role="img" aria-label={label}>
      <div className="ui-track__bars">
        {segs.map((s, i) => (
          <i key={i} className={s ? `ui-seg ui-seg--${s}` : "ui-seg"} />
        ))}
      </div>
      <span className="ui-track__label" aria-hidden="true">{label}</span>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/PaymentMark.tsx`**

```tsx
import type { PaymentStatus } from "../../types/orders";

const LABEL: Record<PaymentStatus, string> = { paid: "Paid", unpaid: "Unpaid", pending: "Pending", ignored: "Ignored" };

/** Payment state as a dot and a word. Unpaid is the one that stands out. */
export function PaymentMark({ status }: { status: PaymentStatus }) {
  return (
    <span className={`ui-pay ui-pay--${status}`}>
      <i className="ui-pay__dot" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
```

- [ ] **Step 5: Create `src/components/ui/Menu.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { LuEllipsis } from "react-icons/lu";
import { useDismiss } from "../../hooks/useDismiss";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  tone?: "danger";
}

interface MenuProps {
  label: string; // accessible name of the "..." button
  items: MenuItem[];
}

interface Position {
  top?: number;
  bottom?: number;
  right: number;
}

const ROW_PX = 40; // estimated height of one item, used to decide whether to open upwards

/** A "..." button with a short list of actions. The panel is position: fixed so a scrolling table cannot clip it. */
export function Menu({ label, items }: MenuProps) {
  const [pos, setPos] = useState<Position | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setPos(null), []);
  useDismiss(pos !== null, box, close);

  // A fixed panel does not follow its row, so close it when the page scrolls or resizes.
  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    if (pos) return close();
    const r = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    const needed = items.length * ROW_PX + 16;
    setPos(r.bottom + needed > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right });
  };

  if (items.length === 0) return null;
  return (
    <div className="ui-menu" ref={box}>
      <button type="button" className="ui-menu__trigger" aria-label={label} aria-expanded={pos !== null} onClick={toggle}>
        <LuEllipsis aria-hidden="true" />
      </button>
      {pos && (
        <div className="ui-menu__panel" style={pos}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className={`ui-menu__item${it.tone ? ` ui-menu__item--${it.tone}` : ""}`}
              onClick={() => {
                close();
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/components/ui/SelectionBar.tsx`**

```tsx
import type { ReactNode } from "react";

/** Floats at the bottom of the screen while rows are selected; put the count and the action inside. */
export function SelectionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ui-selbar" role="region" aria-label={label}>
      {children}
    </div>
  );
}
```

- [ ] **Step 7: Replace `src/components/ui/index.ts`**

```ts
export { Alert } from "./Alert";
export { Badge } from "./Badge";
export type { BadgeTone } from "./Badge";
export { Button } from "./Button";
export { EmptyState } from "./EmptyState";
export { Spinner } from "./Spinner";
export { Card } from "./Card";
export { Field } from "./Field";
export { FilterBar } from "./FilterBar";
export { PageHeader } from "./PageHeader";
export { ToastProvider } from "./ToastProvider";
export { useToast } from "./useToast";
export { DataTable } from "./DataTable";
export type { Column } from "./DataTable";
export { Chip, Chips } from "./Chip";
export { OrderTrack } from "./OrderTrack";
export { PaymentMark } from "./PaymentMark";
export { Menu } from "./Menu";
export type { MenuItem } from "./Menu";
export { SelectionBar } from "./SelectionBar";
```

- [ ] **Step 8: Replace the gallery `src/Pages/UiKit/UiKit.tsx`**

```tsx
import { useState } from "react";
import type { ReactNode } from "react";
import { Alert, Badge, Button, Card, Chip, Chips, DataTable, EmptyState, Field, FilterBar, Menu, OrderTrack, PageHeader, PaymentMark, SelectionBar, Spinner, useToast } from "../../components/ui";
import type { Column } from "../../components/ui";
import type { OrderStatus, PaymentStatus } from "../../types/orders";

interface Row { id: string; name: string; meta: string; total: number; status: OrderStatus; pay: PaymentStatus }
const ROWS: Row[] = [
  { id: "ORD-20261018-0042", name: "Nimal Perera", meta: "Colombo 03 · 2 items · 8:42 AM", total: 970, status: "pending", pay: "pending" },
  { id: "ORD-20261018-0041", name: "Kumari Silva", meta: "Nugegoda · 1 item · 8:31 AM", total: 485, status: "preparing", pay: "paid" },
  { id: "ORD-20261018-0039", name: "Dilani Jayasinghe", meta: "Colombo 03 · 1 item · 7:58 AM", total: 555, status: "delivered", pay: "unpaid" },
  { id: "ORD-20261018-0038", name: "Chaminda Wickramasinghe", meta: "Nugegoda · 2 items · 7:40 AM", total: 1180, status: "delivery_failed", pay: "unpaid" },
  { id: "ORD-20261018-0036", name: "Tharindu Bandara", meta: "Colombo 03 · 2 items · 7:12 AM", total: 1320, status: "cancelled", pay: "ignored" },
  { id: "ORD-20261018-0035", name: "Anjali Gunawardena", meta: "Nugegoda · 4 items · 6:55 AM", total: 2240, status: "completed", pay: "paid" },
];
const COLUMNS: Column<Row>[] = [
  { key: "select", label: "Select", mobile: "select", header: <input type="checkbox" aria-label="Select all" />, cell: (r) => <input type="checkbox" aria-label={`Select ${r.name}`} /> },
  {
    key: "customer",
    label: "Customer",
    mobile: "title",
    cell: (r) => (
      <div>
        <b className="ui-cell__title">{r.name}</b>
        <div className="ui-cell__meta">{r.id} · {r.meta}</div>
      </div>
    ),
  },
  { key: "total", label: "Total", align: "right", mobile: "amount", cell: (r) => <strong>LKR {r.total.toLocaleString("en-LK")}</strong> },
  { key: "progress", label: "Progress", mobile: "inline", cell: (r) => <OrderTrack status={r.status} /> },
  { key: "payment", label: "Payment", mobile: "inline", cell: (r) => <PaymentMark status={r.pay} /> },
  {
    key: "actions",
    label: "Next step",
    align: "right",
    mobile: "actions",
    cell: (r) => (
      <div className="ui-actions">
        <Button size="sm" variant={r.pay === "unpaid" ? "primary" : "secondary"}>{r.pay === "unpaid" ? "Mark paid" : "Move to delivering"}</Button>
        <Menu label={`More actions for ${r.id}`} items={[{ label: "Update status…", onSelect: () => {} }, { label: "Cancel order", tone: "danger", onSelect: () => {} }]} />
      </div>
    ),
  },
];
const ALL: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYS: PaymentStatus[] = ["paid", "unpaid", "pending", "ignored"];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
    <h2 style={{ margin: 0, fontSize: "var(--text-lg)" }}>{title}</h2>
    {children}
  </section>
);

/** Dev-only gallery (route /ui-kit) so every kit component can be checked at desktop and phone width. */
export default function UiKit() {
  const toast = useToast();
  const [chip, setChip] = useState("All");
  const [bar, setBar] = useState(false);
  return (
    <div>
      <PageHeader title="UI kit" subtitle="Everything the pages are built from" actions={<Button variant="primary">Primary action</Button>} />
      <Section title="Buttons">
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
      <Section title="Chips">
        <Chips label="Example filter">
          {["All", "Pending", "Preparing", "Delivering"].map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)} count={c === "All" ? undefined : 3}>{c}</Chip>
          ))}
          <Chip attention selected>Unpaid only</Chip>
        </Chips>
      </Section>
      <Section title="Order track and payment marks">
        <div className="ui-actions" style={{ gap: "var(--space-8)" }}>{ALL.map((s) => <OrderTrack key={s} status={s} />)}</div>
        <div className="ui-actions" style={{ gap: "var(--space-6)" }}>{PAYS.map((p) => <PaymentMark key={p} status={p} />)}</div>
      </Section>
      <Section title="Badges">
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
      <Section title="FilterBar, Card, Field">
        <FilterBar>
          <select aria-label="Area"><option>All areas</option></select>
          <input type="search" placeholder="Order id…" aria-label="Order id" />
          <label>From <input type="date" /></label>
        </FilterBar>
        <Card title="Card title" actions={<Button size="sm">Action</Button>}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <Field label="Name" hint="As shown to customers"><input /></Field>
            <Field label="Price" error="Enter a positive number"><input defaultValue="-1" /></Field>
          </div>
        </Card>
      </Section>
      <Section title="Toast and selection bar">
        <div className="ui-actions">
          <Button onClick={() => toast.show("Marked paid")}>Success toast</Button>
          <Button onClick={() => toast.show("Could not save", "danger")}>Error toast</Button>
          <Button onClick={() => setBar((b) => !b)}>{bar ? "Hide selection bar" : "Show selection bar"}</Button>
        </div>
        {bar && (
          <SelectionBar label="Selected customers">
            <span><strong>3 customers</strong> selected</span>
            <Button variant="primary">Send payment reminder</Button>
          </SelectionBar>
        )}
      </Section>
      <Section title="DataTable">
        <DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} rowTone={(r) => (r.status === "delivery_failed" ? "bad" : r.pay === "unpaid" || r.status === "pending" ? "attn" : undefined)} />
        <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading />
        <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.id} emptyTitle="No orders found" />
        <DataTable columns={COLUMNS} rows={ROWS.slice(0, 1)} rowKey={(r) => r.id} error="Refresh failed: Request failed (500)" />
      </Section>
    </div>
  );
}
```

- [ ] **Step 9: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/components/ui src/Pages/UiKit`. Expected: no output from either.

- [ ] **Step 10: Verify in the browser (desktop, phone, menu placement)**

Write `$SCRATCH/kit-check.js`:

```js
async (page) => {
  const out = {};
  await page.goto("http://localhost:5173/ui-kit");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: process.env.SCRATCH + "/kit-desktop.png", fullPage: true });
  out.tracks = await page.locator(".ui-track").count();
  out.rowEdges = await page.evaluate(() => ({ attn: document.querySelectorAll(".ui-row--attn").length, bad: document.querySelectorAll(".ui-row--bad").length }));
  // chip state
  await page.getByRole("button", { name: /^Preparing/ }).click();
  out.chipPressed = await page.getByRole("button", { name: /^Preparing/ }).getAttribute("aria-pressed");
  // menu opens and closes
  const trigger = page.getByRole("button", { name: "More actions for ORD-20261018-0042" }).first(); // the error-state table repeats this row
  await trigger.click();
  out.menuItems = await page.locator(".ui-menu__panel .ui-menu__item").allInnerTexts();
  await page.keyboard.press("Escape");
  out.menuClosed = (await page.locator(".ui-menu__panel").count()) === 0;
  // menu flips upwards near the bottom of a short viewport
  await page.setViewportSize({ width: 1440, height: 520 });
  const last = page.getByRole("button", { name: "More actions for ORD-20261018-0035" });
  await last.scrollIntoViewIfNeeded();
  await last.click();
  const box = await page.locator(".ui-menu__panel").boundingBox();
  out.menuInsideViewport = box.y >= 0 && box.y + box.height <= 520;
  await page.keyboard.press("Escape");
  // phone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: process.env.SCRATCH + "/kit-mobile.png", fullPage: true });
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  return out;
}
```

Run (set `SCRATCH` in the environment so the script can find it): `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/kit-check.js"`.
Expected: `tracks` is at least 7 (7 statuses plus 6 table rows), `rowEdges` has `attn >= 2` and `bad: 1`, `chipPressed` is `"true"`, `menuItems` is `["Update status…","Cancel order"]`, `menuClosed` is `true`, `menuInsideViewport` is `true`, `docWidth` is `390`. Read `kit-desktop.png`: ruled rows on the paper with the coloured left edges, track segments in turmeric, leaf, tea, hatched brick and brick, payment marks with dots, chips in tea when selected. Read `kit-mobile.png`: each row is a card with the customer name and total on the first line, the track and payment mark on the next, and the actions on the right; no horizontal overflow.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui/DataTable.tsx src/components/ui/Chip.tsx src/components/ui/OrderTrack.tsx src/components/ui/PaymentMark.tsx src/components/ui/Menu.tsx src/components/ui/SelectionBar.tsx src/components/ui/index.ts src/Pages/UiKit/UiKit.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add chips, order track, payment mark, row menu and selection bar

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Shell, header and modal restyle

**Files:**
- Rewrite: `src/components/Sidebar/Sidebar.tsx`, `src/components/Sidebar/sidebar.css`, `src/layouts/layout.css`, `src/components/Header/topbar.css`, `src/components/common/modal.css`
- Modify: `src/components/Header/Topbar.tsx`, `src/components/Header/UserMenu.tsx`, `src/components/Header/Bell.tsx`, `src/components/Header/GlobalSearch.tsx`

**Interfaces:**
- Keeps: `Sidebar({ open, onNavigate })` (element id `app-sidebar`), `Topbar({ setIsLoggedIn, navOpen, menuButtonRef, onMenu })`, `AdminLayout` (unchanged), class names `topbar`, `topbar__menu`, `topbar__right`, `searchWrap`, `topbar__search`, `searchResults*`, `bell*`, `iconBtn`, `notification-badge`, `user*`, `dropdown__item`, and the legacy `.modal*` classes.
- Adds: class `searchWrap__icon`, `sidebar__brand`, `sidebar__mark`.

- [ ] **Step 1: Replace `src/components/Sidebar/Sidebar.tsx`**

```tsx
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LuCalendarDays, LuChartColumn, LuHistory, LuLayoutDashboard, LuMapPin, LuMegaphone, LuReceiptText, LuShieldCheck, LuSlidersHorizontal, LuTruck, LuUsers, LuUtensils } from "react-icons/lu";
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
  { title: "Overview", items: [{ name: "Dashboard", icon: <LuLayoutDashboard />, path: "/dashboard" }] },
  {
    title: "Customers",
    items: [
      { name: "Users", icon: <LuUsers />, path: "/users" },
      { name: "Orders", icon: <LuReceiptText />, path: "/orders" },
      { name: "Notices", icon: <LuMegaphone />, path: "/notices" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Delivery Areas", icon: <LuMapPin />, path: "/delivery-areas" },
      { name: "Sessions", icon: <LuCalendarDays />, path: "/sessions" },
      { name: "Food Items", icon: <LuUtensils />, path: "/food-items" },
      { name: "Delivery Persons", icon: <LuTruck />, path: "/delivery-persons" },
    ],
  },
  { title: "Insights", items: [{ name: "Reports", icon: <LuChartColumn />, path: "/reports" }] },
  {
    title: "Admin",
    items: [
      { name: "Admins", icon: <LuShieldCheck />, path: "/admins", superOnly: true },
      { name: "Settings", icon: <LuSlidersHorizontal />, path: "/settings", superOnly: true },
      { name: "Audit Logs", icon: <LuHistory />, path: "/audit-logs", superOnly: true },
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
      <div className="sidebar__brand">
        <i className="sidebar__mark" aria-hidden="true" />
        Admin Panel
      </div>
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

- [ ] **Step 2: Replace `src/components/Sidebar/sidebar.css`**

```css
.sidebar {
  width: 244px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 20px 12px;
  background: var(--tea);
  color: var(--rail-text);
  overflow-y: auto;
}

/* The global focus ring is leaf green, which is too dark on Tea */
.sidebar :focus-visible {
  outline-color: var(--mint);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  color: var(--white);
  font-family: var(--font-head);
  font-size: 21px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
}

.sidebar__mark {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--mint), var(--color-primary));
}

.sidebar__mark::after {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 2px;
  background: var(--tea);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.nav__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav__group-title {
  padding: 0 10px 6px;
  color: var(--rail-muted);
  font-size: var(--text-xs);
  font-weight: 500;
}

.nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  color: var(--rail-text);
  font-size: var(--text-base);
  text-decoration: none;
}

.nav__item:hover {
  background: var(--on-dark-hover);
  color: var(--white);
}

.nav__icon {
  display: inline-flex;
  font-size: 18px;
}

.nav__item--active {
  background: var(--on-dark-active);
  color: var(--white);
  font-weight: 600;
}

.nav__item--active::before {
  content: "";
  position: absolute;
  left: -12px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--mint);
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

- [ ] **Step 2b: Replace `src/layouts/layout.css`**

```css
.appContainer {
  display: flex;
  height: 100vh; /* fallback */
  height: 100dvh;
  background: var(--paper);
}

.contentWrapper {
  flex: 1;
  min-width: 0; /* lets wide tables scroll inside .main instead of stretching the page */
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding: 0 var(--space-6) var(--space-8);
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

  .main {
    padding: 0 var(--space-5) var(--space-6);
  }
}

@media (max-width: 640px) {
  .main {
    padding: 0 14px 96px; /* room for the selection bar */
  }
}
```

- [ ] **Step 3: Replace `src/components/Header/topbar.css`**

```css
.topbar {
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 var(--space-6);
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
  color: var(--ink);
  font-size: 20px;
  cursor: pointer;
}

.topbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Search */
.searchWrap {
  position: relative;
  flex: 1;
  max-width: 440px;
  min-width: 0;
}

.searchWrap__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-500);
  pointer-events: none;
}

.topbar__search {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3) 0 38px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  font: inherit;
}

.topbar__search::placeholder {
  color: var(--gray-500);
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
  padding: 6px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.searchResults__group { padding: 6px var(--space-2) 2px; font-size: var(--text-xs); font-weight: 600; color: var(--gray-500); }
.searchResults__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  padding: 8px var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
}
.searchResults__item span { font-size: var(--text-xs); color: var(--gray-500); }
.searchResults__item:hover, .searchResults__item:focus-visible { background: var(--gray-100); }
.searchResults__note { padding: var(--space-2); font-size: var(--text-sm); color: var(--gray-500); }

/* Bell */
.bell { position: relative; }
.iconBtn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--ink);
  font-size: 20px;
  cursor: pointer;
}
.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: var(--white);
  font-size: 11px;
  font-weight: 600;
}
.bell__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: var(--z-dropdown);
  min-width: 260px;
  padding: 6px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.bell__title { padding: 6px var(--space-2); font-size: var(--text-xs); font-weight: 600; color: var(--gray-500); }
.bell__row {
  display: block;
  width: 100%;
  padding: 9px var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
}
.bell__row:hover, .bell__row:focus-visible { background: var(--gray-100); }
.bell__note { padding: var(--space-2); font-size: var(--text-sm); color: var(--gray-500); }

/* User menu */
.user { position: relative; }
.user__trigger {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 var(--space-3) 0 5px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-full);
  background: var(--white);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.user__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--tea);
  color: var(--white);
  font-family: var(--font-head);
  font-size: var(--text-sm);
  font-weight: 600;
}
.user__name { font-size: var(--text-base); }
.user__caret { color: var(--gray-500); font-size: 16px; }
.user__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--z-dropdown);
  min-width: 160px;
  padding: 6px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.dropdown__item {
  width: 100%;
  padding: 9px var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: none;
  text-align: left;
  font: inherit;
  font-size: var(--text-base);
  cursor: pointer;
}
.dropdown__item:hover { background: var(--gray-100); }

@media (max-width: 1024px) {
  .topbar { padding: 0 var(--space-5); }
  .topbar__menu { display: inline-flex; }
}

@media (max-width: 640px) {
  .topbar { height: 64px; padding: 0 14px; gap: 10px; }
  .topbar__search { height: 44px; font-size: 16px; }
  .user__name, .user__caret { display: none; }
  .user__trigger { padding: 0 5px; }
}
```

- [ ] **Step 4: Replace `src/components/common/modal.css`**

```css
.modal {
  box-sizing: border-box; /* dialog defaults to content-box, so width:100% + padding overflowed phones */
  border: 0;
  border-radius: var(--radius-lg);
  padding: 26px;
  width: min(480px, 92vw);
  box-shadow: var(--shadow-lg);
  color: var(--ink);
}
.modal::backdrop { background: var(--overlay); }
.modal__title { margin: 0 0 var(--space-4); font-size: 21px; font-weight: 700; letter-spacing: -0.015em; }
.modal__body { margin: 0 0 var(--space-5); color: var(--gray-500); }
.modal__form { display: flex; flex-direction: column; gap: var(--space-4); }
.modal__form input, .modal__form select, .modal__form textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font: inherit;
}
.modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

/* Legacy button classes, still used by pages that have not moved to the ui kit */
.modal__btn {
  min-height: 38px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-300);
  background: var(--white);
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
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
    border-radius: 16px 16px 0 0;
    padding-bottom: calc(26px + env(safe-area-inset-bottom, 0px));
  }
  .modal__actions { flex-direction: column-reverse; }
  .modal__actions > * { width: 100%; }
}
```

- [ ] **Step 5: Swap the icons in the header components (small edits)**

In `src/components/Header/Topbar.tsx`:
- replace `import { MdMenu } from "react-icons/md";` with `import { LuMenu } from "react-icons/lu";`
- replace `<MdMenu aria-hidden="true" />` with `<LuMenu aria-hidden="true" />`

In `src/components/Header/UserMenu.tsx`:
- replace `import { MdKeyboardArrowDown } from "react-icons/md";` with `import { LuChevronDown } from "react-icons/lu";`
- replace `<MdKeyboardArrowDown className="user__caret" aria-hidden="true" />` with `<LuChevronDown className="user__caret" aria-hidden="true" />`

In `src/components/Header/Bell.tsx`:
- replace `import { MdNotificationsNone } from "react-icons/md";` with `import { LuBell } from "react-icons/lu";`
- replace `<MdNotificationsNone aria-hidden="true" />` with `<LuBell aria-hidden="true" />`

In `src/components/Header/GlobalSearch.tsx`:
- replace `import { statusOf } from "../../types/users";` with:

```tsx
import { LuSearch } from "react-icons/lu";
import { statusOf } from "../../types/users";
```

- replace `    <div className="searchWrap" ref={box}>` with:

```tsx
    <div className="searchWrap" ref={box}>
      <LuSearch className="searchWrap__icon" aria-hidden="true" />
```

- [ ] **Step 6: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/components/Sidebar src/components/Header src/components/common src/layouts`. Expected: no output.

- [ ] **Step 7: Verify in the browser**

Write `$SCRATCH/shell-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/orders");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  out.rail = await page.evaluate(() => { const s = getComputedStyle(document.querySelector(".sidebar")); return { bg: s.backgroundColor, width: s.width }; });
  out.groupTitleTransform = await page.evaluate(() => getComputedStyle(document.querySelector(".nav__group-title")).textTransform);
  out.brandFont = await page.evaluate(() => getComputedStyle(document.querySelector(".sidebar__brand")).fontFamily.split(",")[0]);
  out.hamburgerHiddenOnDesktop = await page.evaluate(() => getComputedStyle(document.querySelector(".topbar__menu")).display === "none");
  await page.screenshot({ path: S + "/shell-desktop.png" });
  // user menu and bell
  await page.getByRole("button", { name: /Account menu/ }).click();
  out.logoutVisible = await page.getByRole("button", { name: "Log out" }).isVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /need attention/ }).click();
  out.bellRows = await page.locator(".bell__row").count();
  await page.keyboard.press("Escape");
  // modal on a legacy page: primary button colour, radius
  await page.goto("http://localhost:5173/food-items");
  await page.getByRole("button", { name: /Add Item/ }).click();
  out.modalSave = await page.evaluate(() => { const b = document.querySelector(".modal__btn--primary"); const m = document.querySelector("dialog.modal"); return { bg: getComputedStyle(b).backgroundColor, radius: getComputedStyle(m).borderRadius, width: Math.round(m.getBoundingClientRect().width) }; });
  await page.screenshot({ path: S + "/shell-modal.png" });
  // phone drawer
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/orders");
  await page.waitForTimeout(300);
  out.drawerHidden = await page.evaluate(() => getComputedStyle(document.getElementById("app-sidebar")).visibility);
  await page.getByRole("button", { name: "Menu", exact: true }).click(); // exact: "Account menu" also contains "menu"
  await page.waitForTimeout(300);
  out.drawerOpen = await page.evaluate(() => getComputedStyle(document.getElementById("app-sidebar")).visibility);
  await page.screenshot({ path: S + "/shell-drawer.png" });
  await page.keyboard.press("Escape");
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  // legacy pages still render inside the shell
  for (const p of ["users", "sessions", "settings"]) { await page.goto("http://localhost:5173/" + p); await page.waitForTimeout(250); out["shell_" + p] = (await page.locator(".sidebar").count()) === 1; }
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/shell-check.js"`.
Expected: `rail.bg` is `rgb(18, 53, 36)` and width `244px`; `groupTitleTransform` is `none`; `brandFont` is `"Bricolage Grotesque"`; `hamburgerHiddenOnDesktop` is `true`; `logoutVisible` is `true`; `bellRows` is at least 3; `modalSave.bg` is `rgb(22, 128, 60)`, `radius` is `10px`, `width` is `480`; `drawerHidden` is `"hidden"` and `drawerOpen` is `"visible"`; `docWidth` is `390`; `shell_users`, `shell_sessions`, `shell_settings` are all `true`. Read the screenshots: `shell-desktop.png` shows the dark Tea rail with sentence-case group titles, a mint marker on Orders, a search box with a magnifier, the bell, and the user pill with a tea avatar, with no border under the top bar; `shell-modal.png` shows a 10px-radius dialog with a green Save button; `shell-drawer.png` shows the drawer over a dimmed page.

- [ ] **Step 8: Commit**

```bash
git add src/components/Sidebar src/layouts/layout.css src/components/Header src/components/common/modal.css
git commit -m "$(cat <<'EOF'
feat(ui): tea sidebar, quieter top bar and restyled dialogs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Rebuild Orders on the new identity

**Files:**
- Rewrite: `src/Pages/orders/Orders.tsx`

**Interfaces:**
- Consumes: everything exported from `src/components/ui` (Task 3), `useOrders()` unchanged (`orders`, `loaded`, `error`, `hasNext`, `page`, `setPage`, `filters`, `setFilter`, `areas`, `areaName`, `updatedAt`, `selected`, `toggleCustomer`, `selectPage`, `sendReminders(): Promise<string | null>`, `setStatus(order, status, reason?): Promise<boolean>`, `setPayment(order, status): Promise<boolean>`), `NEXT_STATUSES`, `ConfirmDialog` (with `tone`), `Modal`.
- Behaviour kept from the current page: 30s polling, URL-driven filters, area, order-id, date-range (with the both-dates hint) and payment filters, "Unpaid only", select-by-customer with select-all, bulk payment reminders with confirm, the update-status dialog (with a required reason for `delivery_failed`), mark paid and unpaid, pager, error and loading states, toasts.
- Behaviour changed (approved in the spec): status chips replace the status dropdown; each row has one next action (the forward status move, otherwise "Mark paid") plus a "..." menu; reminders are sent from a floating selection bar.

- [ ] **Step 1: Replace `src/Pages/orders/Orders.tsx`**

```tsx
import { useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import { Alert, Button, Chip, Chips, DataTable, Field, FilterBar, Menu, OrderTrack, PageHeader, PaymentMark, SelectionBar, useToast } from "../../components/ui";
import type { Column, MenuItem } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { NEXT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "../../types/orders";

const STATUS_CHIPS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "delivering", label: "Delivering" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "delivery_failed", label: "Failed" },
];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];
const label = (s: string) => s.replace("_", " ");
// Wording of the one-click button for each forward move (the first entry of NEXT_STATUSES)
const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = { preparing: "Move to preparing", delivering: "Move to delivering", delivered: "Mark delivered" };
// Wording of the choices in the update-status dialog
const MOVE_LABEL: Partial<Record<OrderStatus, string>> = { preparing: "Preparing", delivering: "Delivering", delivered: "Delivered", cancelled: "Cancel the order", delivery_failed: "Delivery failed" };
const itemCount = (o: Order) => o.order_items.reduce((n, i) => n + i.quantity, 0);

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
  const advance = async (order: Order, to: OrderStatus) => {
    if (await o.setStatus(order, to)) toast.show(`Moved to ${label(to)}`);
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
  const allSelected = o.orders.length > 0 && o.orders.every((r) => o.selected.includes(r.customer_id));

  // One next action per row: the forward move, or "Mark paid" once the order has gone as far as it can.
  const rowActions = (r: Order) => {
    const forward = NEXT_STATUSES[r.status]?.[0];
    const canPay = r.payment_status !== "paid" && r.status !== "cancelled";
    const primary = forward ? (
      <Button size="sm" onClick={() => advance(r, forward)}>{ADVANCE_LABEL[forward] ?? `Move to ${label(forward)}`}</Button>
    ) : canPay ? (
      <Button size="sm" variant="primary" onClick={() => pay(r, "paid")}>Mark paid</Button>
    ) : null;
    const items: MenuItem[] = [];
    if (NEXT_STATUSES[r.status]) items.push({ label: "Update status…", onSelect: () => openStatus(r) });
    if (forward && canPay) items.push({ label: "Mark paid", onSelect: () => pay(r, "paid") });
    if (r.payment_status === "paid") items.push({ label: "Mark unpaid", onSelect: () => pay(r, "unpaid") });
    return (
      <div className="ui-actions">
        {primary}
        <Menu label={`More actions for ${r.id}`} items={items} />
      </div>
    );
  };

  const selectColumn: Column<Order> = {
    key: "select",
    label: "Select",
    mobile: "select",
    header: <input type="checkbox" aria-label="Select all customers on this page" checked={allSelected} onChange={(e) => o.selectPage(e.target.checked)} />,
    cell: (r) => (
      <input type="checkbox" aria-label={`Select ${r.customer_name ?? r.customer_id}`} checked={o.selected.includes(r.customer_id)} onChange={() => o.toggleCustomer(r.customer_id)} />
    ),
  };
  const columns: Column<Order>[] = [
    ...(unpaidOnly ? [selectColumn] : []),
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (r) => (
        <div>
          <b className="ui-cell__title">{r.customer_name ?? r.customer_id.slice(0, 8)}</b>
          <div className="ui-cell__meta">
            {r.id} · {o.areaName(r.area_id)} · {itemCount(r)} {itemCount(r) === 1 ? "item" : "items"} · {formatDateTime(r.created_at)}
          </div>
        </div>
      ),
    },
    { key: "total", label: "Total", align: "right", mobile: "amount", cell: (r) => <strong>{formatMoney(Number(r.total_price))}</strong> },
    { key: "progress", label: "Progress", mobile: "inline", cell: (r) => <OrderTrack status={r.status} /> },
    { key: "payment", label: "Payment", mobile: "inline", cell: (r) => <PaymentMark status={r.payment_status} /> },
    { key: "actions", label: "Next step", align: "right", mobile: "actions", cell: rowActions },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`Refreshes every 30 seconds${o.updatedAt ? ` · updated ${o.updatedAt.toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" })}` : ""}`}
      />

      <Chips label="Order status">
        {STATUS_CHIPS.map((c) => (
          <Chip key={c.label} selected={o.filters.status === c.value} onClick={() => o.setFilter("status", c.value)}>
            {c.label}
          </Chip>
        ))}
      </Chips>

      <FilterBar label="Order filters">
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
        <Chip attention selected={unpaidOnly} onClick={() => o.setFilter("payment_status", unpaidOnly ? "" : "unpaid")}>
          Unpaid only
        </Chip>
        {unpaidOnly && (
          <label className="ui-phone-only">
            <input type="checkbox" checked={allSelected} onChange={(e) => o.selectPage(e.target.checked)} />
            Select all on this page
          </label>
        )}
      </FilterBar>
      {(o.filters.from === "") !== (o.filters.to === "") && <Alert tone="warning">Pick both dates to filter by date.</Alert>}
      {unpaidOnly && o.selected.length === 0 && <p className="ui-hint">Tick customers to send them a payment reminder.</p>}

      <DataTable
        columns={columns}
        rows={o.orders}
        rowKey={(r) => r.id}
        loading={!o.loaded && !o.error}
        error={editing ? null : o.error}
        emptyTitle="No orders found"
        rowTone={(r) => (r.status === "delivery_failed" ? "bad" : r.payment_status === "unpaid" || r.status === "pending" ? "attn" : undefined)}
      />

      <div className="ui-pager">
        <Button size="sm" disabled={o.page === 0} onClick={() => o.setPage(o.page - 1)}>Previous</Button>
        <span>Page {o.page + 1}</span>
        <Button size="sm" disabled={!o.hasNext} onClick={() => o.setPage(o.page + 1)}>Next</Button>
      </div>

      {unpaidOnly && o.selected.length > 0 && (
        <SelectionBar label="Selected customers">
          <span><strong>{o.selected.length}</strong> customer{o.selected.length === 1 ? "" : "s"} selected</span>
          <Button variant="primary" onClick={() => setConfirmingReminder(true)}>Send payment reminder</Button>
        </SelectionBar>
      )}

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
          {editing && (
            <div>
              <OrderTrack status={editing.status} />
              <p className="ui-hint" style={{ margin: "var(--space-2) 0 0" }}>
                {editing.customer_name ?? editing.customer_id.slice(0, 8)} · {o.areaName(editing.area_id)} · {formatMoney(Number(editing.total_price))}
              </p>
            </div>
          )}
          <fieldset className="ui-radios">
            <legend>Move to</legend>
            {nextOptions.map((s) => (
              <label key={s} className={`ui-radio${next === s ? " is-on" : ""}${s === "delivery_failed" || s === "cancelled" ? " is-bad" : ""}`}>
                <input type="radio" name="next-status" required checked={next === s} onChange={() => setNext(s)} />
                {MOVE_LABEL[s] ?? label(s)}
              </label>
            ))}
          </fieldset>
          {next === "delivery_failed" && (
            <Field label="What went wrong? (required)">
              <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Field>
          )}
          {o.error && <Alert>{o.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant={next === "delivery_failed" || next === "cancelled" ? "danger" : "primary"}>
              {next === "delivery_failed" ? "Mark delivery failed" : next === "cancelled" ? "Cancel order" : next ? `Move to ${label(next)}` : "Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc -b` then `npx eslint src/Pages/orders`. Expected: no output.

- [ ] **Step 3: Verify behaviour and appearance in the browser**

Write `$SCRATCH/orders-check.js`:

```js
async (page) => {
  const out = {};
  const S = process.env.SCRATCH;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/orders");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await page.screenshot({ path: S + "/orders-desktop.png", fullPage: true });
  out.rows = await page.locator(".ui-table tbody tr").count();
  out.edges = await page.evaluate(() => ({ attn: document.querySelectorAll(".ui-row--attn").length, bad: document.querySelectorAll(".ui-row--bad").length }));
  out.chips = await page.locator(".ui-chips .ui-chip").allInnerTexts();
  out.allChipPressed = await page.getByRole("button", { name: "All", exact: true }).getAttribute("aria-pressed");
  // status chip filters via the stub (the stub ignores status, so assert the chip state and request)
  const req = page.waitForRequest((r) => r.url().includes("/orders") && r.url().includes("status=pending"));
  await page.getByRole("button", { name: "Pending", exact: true }).click();
  await req;
  out.pendingChipPressed = await page.getByRole("button", { name: "Pending", exact: true }).getAttribute("aria-pressed");
  await page.getByRole("button", { name: "All", exact: true }).click();
  // first row's primary action advances the order (one click, PUT status) and toasts
  const put = page.waitForRequest((r) => r.method() === "PUT" && /\/orders\/.+\/status/.test(r.url()));
  const first = page.locator(".ui-table tbody tr").first();
  out.firstPrimary = (await first.locator(".ui-btn").first().innerText()).trim();
  await first.locator(".ui-btn").first().click();
  const sent = await put;
  out.advanceBody = sent.postDataJSON();
  await page.waitForSelector(".ui-toast");
  out.toast = (await page.locator(".ui-toast").first().innerText()).replace("×", "").trim();
  // menu has the extra actions
  await first.getByRole("button", { name: /More actions for/ }).click();
  out.menu = await page.locator(".ui-menu__item").allInnerTexts();
  await page.getByRole("button", { name: "Update status…" }).click();
  out.dialogTitle = (await page.locator("dialog.modal h2").innerText()).trim();
  out.radios = await page.locator(".ui-radio").allInnerTexts();
  await page.screenshot({ path: S + "/orders-dialog.png" });
  await page.keyboard.press("Escape");
  // unpaid mode: selection bar
  await page.getByRole("button", { name: "Unpaid only" }).click();
  await page.waitForTimeout(400);
  out.hintShown = (await page.locator(".ui-hint").count()) > 0;
  const boxes = page.locator('tbody input[type="checkbox"]');
  out.checkboxes = await boxes.count();
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  out.selbar = (await page.locator(".ui-selbar").innerText()).replace(/\s+/g, " ").trim();
  await page.screenshot({ path: S + "/orders-unpaid.png" });
  // phone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/orders");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await page.screenshot({ path: S + "/orders-mobile.png", fullPage: true });
  out.docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  // error path
  await page.unroute(/localhost:400\d\/api/);
  await page.route(/localhost:400\d\/api/, (r) => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Boom" }) }));
  await page.goto("http://localhost:5173/orders");
  await page.waitForTimeout(700);
  out.errorText = (await page.locator('[role="alert"]').first().innerText()).trim();
  out.spinnersOnError = await page.locator(".ui-spinner").count();
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/orders-check.js"`.
Expected:
- `rows` is 25 (or the stub page size); `edges.attn` is at least 3 and `edges.bad` is at least 1; `chips` is `["All","Pending","Preparing","Delivering","Delivered","Completed","Cancelled","Failed"]`; `allChipPressed` is `"true"`; `pendingChipPressed` is `"true"`.
- `firstPrimary` is `"Move to preparing"` (the first stub order is `pending`); `advanceBody.status` is `"preparing"`; `toast` is `"Moved to preparing"`.
- `menu` includes `"Update status…"` (and `"Mark paid"` for an unpaid first row); `dialogTitle` starts with `"Update ORD-"`; `radios` is `["Preparing","Cancel the order"]` (the first stub order is pending).
- `hintShown` is `true` before selection; `checkboxes` is at least 2; `selbar` reads `2 customers selected Send payment reminder` (the count may be higher if rows share a customer; it must start with the number of distinct customers ticked).
- `docWidth` is `390`; `errorText` is `Boom`; `spinnersOnError` is `0`.

Read the screenshots and compare with `docs/superpowers/mockups/png/orders-desktop.png`, `orders-mobile.png`, `orders-unpaid-desktop.png` and `orders-modal-desktop.png`: ruled rows with the coloured left edge, two-line customer cells, the track, payment dots, a single next-step button plus "...", chips in tea, the floating tea bar at the bottom, the phone layout as cards. Small differences (the payment select kept in the filter bar, real date strings in the meta line) are expected.

- [ ] **Step 4: Commit**

```bash
git add src/Pages/orders/Orders.tsx
git commit -m "$(cat <<'EOF'
feat(orders): status chips, ticket rows, order track and one-click next step

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Document the identity, run the final checks, capture "after" shots

**Files:**
- Modify: `docs/ADMIN-PLAN.md`

- [ ] **Step 1: Update the UI kit paragraph in `docs/ADMIN-PLAN.md`**

Find the paragraph that starts with `**UI kit.**` and replace the whole paragraph (it is one line) with:

```
**UI kit.** New and migrated pages use `src/components/ui` (`import { Button, Chip, Chips, OrderTrack, PaymentMark, Menu, SelectionBar, Badge, Card, PageHeader, FilterBar, Field, DataTable, Alert, EmptyState, Spinner, useToast } from "../../components/ui"`). Colours, spacing, type and radii come from the tokens in `src/styles/variables.css`; never write a hex value in a page stylesheet. The look (Tea sidebar, Paper ground, Leaf actions, Turmeric for "needs a human", Brick for failures, Bricolage Grotesque headings, IBM Plex Sans body, ruled rows instead of cards) is specified in `docs/superpowers/specs/2026-10-18-admin-visual-identity-design.md` with mockups in `docs/superpowers/mockups/`. Lists use `DataTable` (ruled rows, stacked cards on phones; `rowTone` for the coloured edge); a filter that is one click is a `Chip`; row actions are one primary `Button` plus a `Menu`; errors use `Alert`; success feedback uses `useToast`; confirms use `ConfirmDialog` (`tone="primary"` for non-destructive ones, `danger` otherwise). Look at `src/Pages/orders/Orders.tsx` for the reference page and at `/ui-kit` in `npm run dev` for every component. Pages not yet migrated still use their own CSS until their plan lands.
```

(`ConfirmDialog` lives at `src/components/common/ConfirmDialog`, not in the barrel.)

- [ ] **Step 2: Run the mechanical checks**

```bash
npx tsc -b                       # no output
npx eslint src                   # no output
grep -rnE "#[0-9a-fA-F]{3,8}\b" src/components/ui src/layouts src/components/Sidebar src/components/Header src/components/common/modal.css src/Pages/UiKit src/Pages/orders src/styles/global.css src/styles/fonts.css src/index.css   # no output
npm run build                    # completes with no errors
```

If `eslint src` reports errors only in files this plan did not touch, list them verbatim in your report and do not fix them here. If the hex grep prints anything, report each hit with file and line.

- [ ] **Step 3: Capture "after" screenshots of the identity**

Write `$SCRATCH/identity-shots.js`:

```js
async (page) => {
  const out = [];
  const S = process.env.SCRATCH;
  const shot = async (path, name, w, h, full) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("http://localhost:5173" + path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${S}/${name}.png`, fullPage: full });
    out.push(name);
  };
  await shot("/orders", "id-orders-desktop", 1440, 900, true);
  await shot("/orders", "id-orders-mobile", 390, 844, true);
  await shot("/ui-kit", "id-kit-desktop", 1440, 900, true);
  for (const p of ["users", "sessions", "food-items", "settings"]) await shot("/" + p, `id-${p}-desktop`, 1440, 900, false);
  return out;
}
```

Run: `SCRATCH="$SCRATCH" node "$SCRATCH/pw/run.mjs" docs/superpowers/ui-baseline/setup.js "$SCRATCH/identity-shots.js"`, then Read `id-orders-desktop.png`, `id-orders-mobile.png`, `id-users-desktop.png` and `id-settings-desktop.png`. Compare Orders with `docs/superpowers/mockups/png/orders-desktop.png`. In your report list, one line each, anything on an unmigrated page (Users, Sessions, Food Items, Settings) that looks broken by the new shell or palette (for example text that is now hard to read, double padding, or a control with no visible border); do not fix those pages.

- [ ] **Step 4: Commit**

```bash
git add docs/ADMIN-PLAN.md
git commit -m "$(cat <<'EOF'
docs: describe the visual identity in the admin plan conventions

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Next plans

- **Plan 3:** Dashboard (attention-first strip, KPI panel, orders-by-session chart, top items, areas) and Users (status chips, search, list rows, profile drawer with order history and status timeline). Builds `Tabs`/`Segmented`, `Switch` and `Drawer` in the kit as their first consumers need them.
- **Plan 4:** Notices, Delivery Areas, Sessions, Food Items, Delivery Persons, Admins, Reports, Settings, Audit Logs, sign-in and password reset; then the accessibility pass (labels on every form, contrast pass on control borders, removal of the legacy `.modal__btn*` classes and the legacy `--primary-color` aliases).
