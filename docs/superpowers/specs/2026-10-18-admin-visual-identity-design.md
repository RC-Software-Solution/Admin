# Admin Panel visual identity: design

Date: 2026-10-18. Branch: `feat/notices`. Status: design approved by the user from the mockups. Builds on `2026-10-18-admin-ui-standardization-design.md` (tokens, kit, shell already shipped by plan 1).

## Why

Plan 1 gave the app one set of tokens, a UI kit and a responsive shell, but the result is a neutral grey-and-white default, and only Orders uses it. This design gives the app a point of view and a reason for every visual choice.

## Mockups (the approved visual reference)

- `docs/superpowers/mockups/admin-ui-mockups.html`: every screen and a components sheet, with a screen picker (open in a browser; loads fonts from Google Fonts).
- `docs/superpowers/mockups/png/`: the same screens rendered at 1440px (`-desktop`) and 390px (`-mobile`).

Where the plan and the mockups disagree, the mockups win for appearance and the plan wins for behaviour.

## Subject and job

A Sri Lankan lunch-delivery service (rice-and-curry sessions, areas like Colombo 03, amounts in LKR). The users are a small ops team working the lunch rush. Their job is to see what needs a human right now and clear it fast.

## Palette (named for the subject)

| Name | Hex | Use |
|---|---|---|
| Tea | `#123524` | sidebar, headings on dark, selected chips |
| Leaf | `#16803c` | primary actions, active states, focus (white text 5.0:1) |
| Paper | `#f3f5f0` | page ground, a cool green-grey (deliberately not cream) |
| Ink | `#18241d` | text; Mist `#5c6b61` is secondary text |
| Turmeric | `#e0a100` | "needs a human": pending and unpaid (fills only; text on it is `#6b4b00`) |
| Brick | `#b3362a` | failed, cancelled, danger |

Supporting: Mint `#8fd0a8` (marker on Tea), Line `#dde3db`, Line strong `#c3ccc1`. Blue is not used for status.

## Type

- **Bricolage Grotesque** (variable, weight 500 to 800) for page titles, section titles, big numbers and the wordmark.
- **IBM Plex Sans** (400, 500, 600) for UI and tables, with tabular figures so LKR amounts align.
- Sentence-case labels everywhere; no all-caps labels. Fonts are self-hosted (woff2 in `src/assets/fonts`), so there is no CDN and no new npm dependency. Only the Latin subset is shipped; Sinhala and Tamil names fall back to the system font.

## Shape and surface

- One main surface: ruled rows on Paper, not a card around every table. Panels (white, 1px Line border) only for forms and grouped content.
- Radii: 4px badges, 6px controls, 10px floating things (menus, dialogs, panels), 999px chips and the user pill. Shadows only on floating things.
- Motion: only motion that answers an action (drawer, toast, spinner). Reduced motion is respected.

## Signature element: the order lifecycle track

Each order shows four segments (pending, preparing, delivering, delivered/completed) with the current step filled: turmeric for pending, leaf for in progress, tea for done, hatched brick for cancelled, three leaf plus one brick for delivery failed. It replaces five competing badge colours with one progression plus two alert colours. A coloured left edge on a row marks it: turmeric for needs attention (pending or unpaid), brick for failed.

## Orders behaviour decisions (approved with the mockups)

- Status filter is a row of chips (All, Pending, Preparing, Delivering, Delivered, Completed, Cancelled, Failed), replacing the status dropdown.
- Each row shows one next action: the forward status move (`NEXT_STATUSES[status][0]`) as a one-click button ("Move to preparing", "Move to delivering", "Mark delivered"); otherwise "Mark paid" when the order is not paid and not cancelled. Everything else (update status with a reason, cancel, mark paid or unpaid) is under a "..." menu.
- Bulk payment reminders: a floating bar appears at the bottom when customers are selected in "Unpaid only" mode.

## Data the mockups imply that the app does not have yet (do not build these in plan 2)

- The Dashboard "Needs attention" strip shows "LKR 4,150 outstanding"; the attention endpoint returns counts only.
- The customer profile line "blocked automatically at 3" needs the threshold, which only super admins can read.

## Phasing

- **Plan 2 (this work):** Phase A identity (fonts, tokens, restyled kit and shell and modals) plus Phase B (kit additions and Orders as the showcase).
- **Plan 3:** Dashboard (attention-first) and Users (with `Tabs`/chips and the profile drawer).
- **Plan 4:** the remaining pages (Notices, Delivery Areas, Sessions, Food Items, Delivery Persons, Admins, Reports, Settings, Audit Logs, Login and password reset), then the accessibility pass.

Unmigrated pages keep their own CSS until their phase; after plan 2 they sit in the new shell on a Paper background.
