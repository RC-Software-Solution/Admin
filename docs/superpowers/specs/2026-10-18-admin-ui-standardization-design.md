# Admin Panel UI/UX standardization: design

Date: 2026-10-18. Branch: `feat/notices`. Status: design approved, plan not yet written.

## Goal

Make the Admin Panel look and behave consistently on every page, and usable down to a 390px phone. Do it with design tokens plus a small in-house UI kit, with no new dependencies. Keep the existing green brand.

## Audit summary (from the source, 2026-10-18)

Screenshots could not be taken (Playwright Edge profile locked by another instance), so these come from CSS, markup and routes. Phase 0 confirms them visually.

1. **No real tokens.** `styles/variables.css` has 4 variables and only 2 `var()` uses. About 50 distinct hex colours; green appears as `#16a34a` and `#0ea65a`; the primary button is blue (`#2563eb`) in modals and green elsewhere; the user-menu hover is `#007bff`. Three `font-family` stacks.
2. **Three page shells.** `.content` + `.pageTitle` (Dashboard, Reports, Settings, Audit Logs); `.admins-page` + `.admins-card` (Admins, Sessions, Food Items, Delivery Persons); bespoke (Users, Delivery Areas, Orders, Notices).
3. **CSS coupling.** Seven pages import another page's stylesheet. Global collisions: `.search` (`sidebar.css`, `users.css`), `.table` (`dashboard.css`, `cards.css`). App layout styles live in `sidebar.css`; `layouts/layout.css` is empty.
4. **More than 10 button styles:** `modal__btn` (31 uses, used on ordinary pages), `orders-btn`, `btn-add`, `pill-btn`, `da-actionBtn`, `da-addBtn`, `nt-send`, `nt-delete`, `loginBtn`, `btn-export`. Delete looks identical to Edit on Food Items.
5. **Five table implementations** (`.table`, `.admins-table`, `.orders-table`, `.users-table`, `.table-card`) and four status-pill families.
6. **Inconsistent feedback.** Plain "Loading…" text in 7 places, no spinner or skeleton. Errors are a faint `.sectionNote` or an unstyled `<p role="alert">`. Empty states are a text cell in a table row. No toast. `Notices.tsx` uses `window.confirm` twice.
7. **Shell problems.** Flat 12-item sidebar. Items are `<a href="#">` with a click handler (no open-in-new-tab, no `aria-current`). The user menu is a clickable `<div>` (not keyboard-accessible) with an emoji avatar and a `margin-right: 60px` hack. Fixed 260px sidebar, no collapse.
8. **Not responsive.** No media queries in the shell; `html, body { overflow: hidden }`. Only 3 CSS files have media queries.
9. **Weak accessibility.** `:focus` styles in 5 places, several `outline: none`. The Food Items modal uses placeholders as labels. Two icon sources (`react-icons` and `components/common/Icons.tsx`).
10. **Smaller drift.** Filter bars differ per page (tabs, `.filters`, `.toolbar`). Only Audit Logs paginates; no list sorts. The sidebar footer hardcodes "v1.0.0 · Production".

## Decisions

- **Approach:** tokens + own UI kit, migrated page by page. Rejected: a component library (large dependency, replaces the look, forces a big-bang rewrite) and a CSS-only cleanup (leaves duplicated markup, so pages drift again).
- **Responsive scope:** fully mobile (390px), including tables as stacked cards.
- **Brand:** keep green `#16a34a` as primary. Blue is the "info" colour only.

## Design

### 1. Tokens (`src/styles/variables.css`)

Single source for every value; no hex outside this file afterwards.

- Colour roles: `--color-primary`, `--color-danger`, `--color-warning`, `--color-info`, neutral steps `--gray-50…900`. Each status colour has `-bg`, `-border` and `-text` variants for pills and banners.
- Type scale (12/13/14/16/20/24), 4px spacing scale, radii (8/12), shadows, z-index layers, breakpoints (640 and 1024).
- One font stack in `global.css`. A visible `:focus-visible` ring on every interactive element.

### 2. UI kit (`src/components/ui/`)

Plain CSS with a `ui-` class prefix so kit styles cannot collide with page classes.

| Component | Notes |
|---|---|
| `Button` | primary / secondary / danger / ghost; sm / md; `loading` prop |
| `Badge` | tone + label; replaces all four pill families |
| `Field` | label, hint and error wrapped around input / select / textarea |
| `PageHeader` | title, subtitle, actions slot |
| `Card` | replaces `.card`, `.admins-card`, `.table-card` |
| `Tabs` | replaces the per-page tab classes |
| `FilterBar` | one filter row for every list page |
| `EmptyState`, `Spinner`, `Skeleton` | shared loading and empty states |
| `Toast` | provider plus `useToast`; success and error feedback |
| `DataTable` | see below |

Existing `Modal` and `ConfirmDialog` are restyled with the new `Button`; below 640px modals render as bottom sheets.

**`DataTable`:** pages pass columns and rows. Desktop renders a normal table. Below 640px each row becomes a stacked card: the primary column is the title, the other columns are label/value pairs, and row actions sit at the bottom. It has built-in loading, empty and error states, and keeps the horizontal-scroll fallback for wide tables between 640px and 1024px.

### 3. Shell

- Sidebar entries grouped as Overview, Customers (Users, Orders, Notices), Operations (Delivery Areas, Sessions, Food Items, Delivery Persons), Insights (Reports), Admin (Admins, Settings, Audit Logs). Uses `NavLink` with `aria-current`. The hardcoded version footer is removed. Super-admin-only entries stay gated as today.
- Below 1024px the sidebar becomes a drawer opened from a topbar hamburger; it closes on navigation and on Escape.
- Topbar user menu becomes a real button with a menu (Escape and arrow keys), with an initials avatar in place of the emoji. Global search collapses to an icon on mobile.
- Layout CSS moves into `layouts/layout.css`. `overflow: hidden` on `body` is removed; `.main` is the scroll container.

### 4. Migration

- One page per commit, Orders first (most complex). Each page moves to `PageHeader`, `Card`, `FilterBar` and `DataTable`, and its old CSS file is deleted in the same commit. Order: Orders, Users, Dashboard, Delivery Areas, Sessions, Food Items, Notices, Delivery Persons, Admins, Reports, Audit Logs, Settings, Login.
- Commit message style: `refactor(ui): <page>`.
- Replace the two `window.confirm` calls in Notices with `ConfirmDialog`; surface success through `Toast`.
- Merge the two icon sources into `react-icons` only; delete `Icons.tsx` once unused.

### 5. Verification

- `npx tsc -b` and `npx eslint <touched paths>` clean on every commit.
- Playwright screenshots at 1440px and 390px for every page, compared with the Phase 0 baseline.
- Mechanical end-state checks: zero hex values outside `variables.css`; zero cross-page CSS imports; one button component; one table component; zero `window.confirm`; Lighthouse accessibility of 95 or higher.
- The backend is not running locally, so visual checks use stubbed API responses (a fake `super_admin` JWT in `localStorage` and route interception).

## Phases

| Phase | Work |
|---|---|
| 0. Baseline | Screenshot all 13 pages at 1440px and 390px. Resolve the Playwright browser lock first. |
| 1. Foundation | Tokens, `global.css`, UI kit, restyled `Modal`/`ConfirmDialog`. One pilot page (Orders) proves the kit. |
| 2. Shell | Grouped sidebar, drawer, topbar menu, `layout.css`. |
| 3. Pages | Migrate the remaining pages, deleting old CSS as each one moves. |
| 4. States and accessibility | Shared loading, empty and error states, toast, `window.confirm` removal, labels on every form, focus rings, contrast pass. |
| 5. Optional | Dark mode, sortable tables. Out of scope unless requested. |

## Risks

- **Mobile `DataTable`** is the largest piece of work. Orders has checkboxes, bulk notify and eight columns, which is the hardest case, so it is the pilot.
- **Global CSS** means deleting a page stylesheet can break a page that silently depended on it. Mitigation: the Phase 0 screenshots, and migrating the pages that import foreign CSS (Audit Logs, Reports, Settings, Food Items, Delivery Persons, Sessions) only after their source page's classes have kit replacements.
- **No backend** locally limits testing to stubbed data; real-data edge cases (long names, many rows) need manual checking.
- **Playwright lock:** closing the other Edge instance needs the user's OK.

## Out of scope

Dark mode, sortable or paginated lists (beyond Audit Logs), new features, backend changes, a component library.

## Amendments (2026-10-18, while writing the foundation plan)

- Filled buttons use `#15803d` (`--color-primary-solid`); the brand green `#16a34a` stays for accents, icons and focus. Reason: `#16a34a` with white text is 3.3:1, below WCAG AA (4.5:1).
- `Skeleton` is not built; `Spinner` covers loading until a page needs more.
- `Tabs` is built with its first consumer (the Users page) in the next plan, not in the foundation.
- `Alert` is added to the kit; it replaces `.sectionNote` and the bare `<p role="alert">` and is used by `DataTable`.
- On phones the global search shrinks to the available width instead of collapsing to an icon.
- The user menu uses the disclosure pattern (button plus panel; Escape and outside click close it). It has one item, so arrow-key menu navigation is not needed.
- Plan 1 (`docs/superpowers/plans/2026-10-18-admin-ui-foundation.md`) covers Phases 0, 1, 2 and the Orders pilot. Plan 2 covers the remaining page migrations and Phase 4.
