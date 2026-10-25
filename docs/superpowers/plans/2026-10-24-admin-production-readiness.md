# Admin Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the RC Admin console safe and operable to put in front of real staff and customer PII: patched toolchain, hardened SPA, hardened backend surface it depends on, and a repeatable deploy.

**Architecture:** The Admin is a static React SPA (S3 + CloudFront, per `AWS-INFRASTRUCTURE-PLAYBOOK.md`) that calls the Backend's Express services. Security is layered: (1) nothing vulnerable in the toolchain or dependencies, (2) a bundle that cannot ship dev URLs or secrets, (3) browser-side controls (CSP and headers, idle logout, error boundary), (4) backend controls the Admin relies on (short admin tokens, CORS allowlist, no EOL runtime), (5) edge controls (WAF rate limits, TLS, private bucket). Every control gets a check that fails when the control is missing.

**Tech Stack:** Vite 7, React 19, TypeScript 5.9, Node 24 LTS (>= 24.22.1), GitHub Actions, AWS S3/CloudFront/WAF, Express 4 services (Backend repo).

**Spec:** Section 1 of this file (scope and threat analysis). No separate design doc.

## Global Constraints

- Node.js >= 24.22.1 everywhere (dev, CI, containers). Node 18 and 20 are end-of-life and receive no security fixes.
- No new runtime dependency in the Admin bundle. Dev tooling only if unavoidable.
- No PHP and no NGINX in the delivery path. Static files come from S3 via CloudFront.
- Production API URLs must be `https://`. A production build must fail otherwise.
- Backend role checks (`checkRole`) remain the enforcement point. UI gating is convenience only.
- Every code task ends with a runnable check and its own commit. Commit message ends with the attribution line from the session reminder.
- Admin repo tasks run in `C:\Users\budglk\RC\Admin`; Backend repo tasks run in `C:\Users\budglk\RC\Backend`.

## Before you start

- **Branches.** Admin is on `feat/identity-remaining-pages` with a merge/push decision pending. Merge or park that first, then `git switch -c chore/production-readiness` from `main`. Backend: branch from `dev` (it holds unpushed commits per `ADMIN-PLAN.md`).
- **Pre-existing dirty state.** `package-lock.json` is modified and `docs/superpowers/ui-baseline/after/` is untracked. Do not sweep them into these commits; Task 1 handles the lockfile explicitly.
- **Local env block.** Several verification steps use the local API URLs. Paste once per shell:

```bash
export VITE_USER_API=http://localhost:4001/api VITE_ANALYTICS_API=http://localhost:4006/api \
  VITE_LOCATIONS_API=http://localhost:4004/api VITE_MENU_API=http://localhost:4005/api \
  VITE_ORDER_API=http://localhost:4002/api
```

---

# 1. Scope and threat analysis

## 1.1 What is in scope

| Layer | In scope | Out of scope (tracked elsewhere) |
|---|---|---|
| Admin SPA (`Admin/`) | Toolchain, dependencies, bundle contents, auth/session handling, headers/CSP, error handling, CI, deploy | New features, UI work |
| Backend services the Admin calls (`user`, `order`, `menu`, `locations`, `analytics`, `delivery`) | Runtime version, dependency patching, CORS, admin token lifetime, compose hardening | Mobile-only flows, payment gateway, push-notification E2E |
| Edge and hosting | S3 + CloudFront + WAF configuration, TLS, caching, logging | Full IaC for the six Lambdas (see AWS playbook) |

## 1.2 Recent events and whether they touch this stack

Sources are listed at the end. Secondary sources disagree on some details, so the version numbers below come from the vendors' own pages (nodejs.org, nginx.org, NCSC).

| Event | Facts | Exposure here | Action |
|---|---|---|---|
| **PHP2Shell**, CVE-2026-109618 / CVE-2026-109619 (Oct 21) | Two unauthenticated RCEs in PHP core, CVSS 9.2. Fixed in 8.5.12, 8.4.27, 8.3.36, 8.2.35. Exploitation reports conflict (watchTowr and Cloudflare say yes; Talos and Canada's Cyber Centre said not yet). | **Admin: none** (no PHP). **Backend: yes, one place.** `docker/docker-compose.yml` runs `phpmyadmin/phpmyadmin` (unpinned image) on published port 8080 with the MySQL **root** credentials preconfigured. If that compose file is ever used on a server, it is an unauthenticated path to root on the database. | Task 13 |
| **NGINX** security releases through Oct 14: stable 1.30.6 / mainline 1.31.7 (5 CVEs: `alias`+`rewrite` overflow, variable-expression overflow, HTTP/3 request-body injection, TLS session-ticket forgery, SSI use-after-free). CVE-2026-42945 (rewrite overflow, May) was reported exploited within days. | **None by design**: the playbook serves the Admin from S3 + CloudFront. NGINX does not appear anywhere in either repo. | Rule, not a task: do not introduce NGINX. If it is ever added, it needs >= 1.30.6 / 1.31.7 and no `rewrite`/`alias`/SSI/HTTP3 use without review. |
| **Node.js Oct 21**: patched 22.23.4, 24.22.1, 26.12.1. CVE-2026-111497 (High): Brotli decoder out-of-bounds write, exploitable only when `node:zlib` decompresses **attacker-controlled** Brotli data. Also High: DNS NUL-byte truncation, two `tls.checkServerIdentity` IP-spelling bypasses. Node 18 and 20 are not patched (end-of-life). | **Yes.** (a) This machine runs v24.22.0, one patch behind. (b) Six Backend Dockerfiles use `node:18-alpine` or `node:20-alpine`: unfixable by definition. (c) The playbook targets Lambda `NODEJS_20_X`. Brotli exposure looks low (Admin does no server-side decompression; Backend axios calls go to its own services, Firebase and SMTP), but the TLS identity bugs apply to every outbound HTTPS call. | Tasks 1, 9 |
| **npm advisory state** (measured today with `npm audit`) | Admin production dependencies: **0**. Admin dev tooling: 3 high (Vite dev-server and launch-editor). Backend production dependencies: 5 to 36 per service, including 5 critical in user-service (`proxy-addr`, `form-data`, `fast-xml-parser`, `protobufjs`, `websocket-driver`) and `express`/`path-to-regexp`/`axios` high. Every item reports a fix available. | Audit severity is not exploitability, but all of it is fixable at low cost. | Tasks 1, 10, 7 |

## 1.3 Findings, with evidence

IDs are referenced by the tasks. "Verified" means I read the code or ran the command in this session.

**Admin SPA**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| A1 | High | Local Node is 24.22.0; fix is 24.22.1. No `.nvmrc` or `engines`, so nothing enforces a patched runtime locally or in CI. | `node -v`; `package.json` has no `engines` |
| A2 | Medium | Dev tooling has 3 high advisories (Vite 7.0.0-7.3.6 dev-server cross-origin script execution and arbitrary file serving, `source-map-js` DoS, `brace-expansion`). They affect the dev machine and CI, not the shipped bundle. | `npm audit` |
| A3 | Medium | `apiClient.ts` falls back to `http://localhost:400x/api` when an env var is missing. The existing `dist/` was built that way and contains all five localhost URLs. A forgotten env var would ship a broken, plaintext-configured production bundle. | `grep` of `dist/assets/*.js` |
| A4 | High (without CSP) | Access token (7-day lifetime, no refresh) in `localStorage`. Any XSS reads it and gets a full admin session for a week. | `apiClient.ts:9-10`, `jwt.js` default `7d` |
| A5 | High | No CSP, HSTS, framing or referrer protection. `index.html` has no security meta. For a console that renders customer PII this is the main missing browser-side defense. | `index.html`, no deploy config exists |
| A6 | Medium | The emailed password-reset token sits in the URL (`/reset-password?token=`), so it persists in history and can leak through `Referer`. | `PasswordReset.tsx:81` |
| A7 | Low | No `ErrorBoundary`: any render error blanks the whole console. | grep found none |
| A8 | Low (latent) | `.env` holds `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`. Nothing reads them today (gitignored, not in `src`), but Vite inlines any `VITE_*` variable that is ever referenced, which would publish admin credentials. | `.env`, grep of `src` |
| A9 | Medium | No CI, no audit gate, no dependency-update automation, no install-script protection. The 2025-2026 npm supply-chain incidents all rode on install scripts and unpinned automation. | no `.github/` |

**Backend surface the Admin depends on**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| B1 | High | `POST /api/users/login` has no throttle and no lockout. The only limiter covers forgot/reset password, is Redis-backed, keyed on `req.ip`, and **fails open**. The AWS playbook provisions **no Redis**, so on AWS the limiter is a no-op everywhere. | `auth.routes.js`, `rateLimiter.js`, `AWS-INFRASTRUCTURE-PLAYBOOK.md` |
| B2 | Medium | `cors()` with no origin list on every service. | each `index.js` |
| B3 | High | Dockerfiles on `node:18-alpine` (5) and `node:20-alpine` (1); playbook targets `NODEJS_20_X`. All end-of-life. | `apps/*/Dockerfile` |
| B4 | High | Per-service production advisories listed in 1.2. | `npm audit --omit=dev` |
| B5 | High if deployed | phpMyAdmin (unpinned) with root credentials, MySQL on `3307`, Redis on `6379`, every service port published on all interfaces. Dev compose, but it also holds a plaintext SMTP password already tracked in `ADMIN-PLAN.md`. | `docker/docker-compose.yml` |
| B6 | Medium | Admin access tokens last 7 days (`ACCESS_TOKEN_TTL` default). | `jwt.js:36` |
| B7 | Low | `helmet` is missing on order, menu and locations services. | `index.js` files |
| B8 | Medium (deferred) | 6-character password minimum on login and reset, including for staff. | `auth.controller.js`, `PasswordReset.tsx` |
| B9 | Medium (deferred) | No MFA for `super_admin`. | no code path |
| B10 | Low (deferred) | Login handler returns `error.message` on 500. | `auth.controller.js` |

**Already good (keep it that way):** JWT is RS256 with explicit `algorithms` on verify; bearer-header auth means no CSRF; no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or inline `<style>` anywhere in `src`; fonts are self-hosted; no source maps in `dist`; the `/ui-kit` route is `import.meta.env.DEV` only; backend enforces roles; passwords use bcrypt; the login 401 does not distinguish unknown email from wrong password.

## 1.4 Decisions needed before Task 5, 6 and 14

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | **Session model.** (a) 8-hour admin access token + 30-minute idle logout, token stays in `localStorage`. (b) httpOnly-cookie refresh flow. | **(a)** for launch. | A refresh token in JS-reachable storage lives 30 days, which is *worse* than a short access token. A real fix is (b), which needs backend cookie handling and CSRF design, a separate project. (a) plus a strict CSP removes most of the exposure for no new moving parts. |
| D2 | **API edge.** (a) CloudFront (with WAF) in front of the API. (b) Switch to a REST API Gateway and attach WAF. (c) No WAF; API Gateway throttling plus an app-level lockout (needs a DB migration). | **(a)**. | AWS WAF attaches to CloudFront and REST APIs, not to HTTP APIs (confirm in current AWS docs; the AWS MCP was offline this session). The playbook uses an HTTP API, so (a) avoids re-platforming. |
| D3 | **Admin to API topology.** (a) Same origin: `admin.<domain>` serves `/*` from S3 and `/api/*` from the API through one CloudFront. (b) Separate `api.<domain>` plus CORS. | **(a)** for the Admin (mobile apps keep `api.<domain>`). | One distribution, one WAF, `connect-src 'self'`, and the browser never makes a cross-origin call. Tasks work either way. |

**Quote impact to raise with the client:** a WAF web ACL with three managed rule groups and two rate rules is roughly $10 per month (verify on the AWS pricing page), against the client-facing "$1-8/mo Year 1" hosting estimate in `GO-LIVE-PLAYBOOK.md`. Option D2(c) avoids that cost but leaves login brute-force protection to custom code.

## 1.5 Explicitly deferred (with reason)

- **MFA for `super_admin` (B9)** and **12-character staff password minimum (B8):** both need backend and UI work and a product decision. Strongly recommended within 30 days of launch. Not a launch blocker only if the edge rate limit (Task 14) is in place and the super-admin password is long and unique.
- **httpOnly-cookie sessions (D1b), CSP `report-uri` collection, Sentry/CloudWatch alarms:** operations work, listed in Task 14 as minimum alarms only.
- **Sanitising the 500 body (B10).**

---

# 2. File structure

**Admin repo — create**

| File | Responsibility |
|---|---|
| `.nvmrc`, `.npmrc` | Pin Node, refuse to install on a wrong version |
| `.env.example` | Documents the five build-time URLs |
| `deploy/apiEnv.ts` | The list of API env vars and the function that turns them into origins (shared by the build guard, the CSP and the checks) |
| `deploy/securityHeaders.ts` | Single source of truth for every response header and the CSP |
| `deploy/printCloudFrontPolicy.ts` | Emits the CloudFront response-headers-policy JSON from the same source |
| `deploy/README.md` | Build, upload, cache, invalidate, rollback runbook |
| `scripts/check-bundle.mjs` | Fails if the built bundle contains dev URLs, secrets, source maps |
| `scripts/check-headers.mjs` | Fails if a deployed URL is missing any expected header |
| `src/components/ErrorBoundary.tsx` | Last-resort error screen |
| `src/hooks/useIdleLogout.ts` | Idle sign-out |
| `.github/workflows/ci.yml`, `.github/dependabot.yml` | CI gate and update automation |

**Admin repo — modify:** `package.json`, `vite.config.ts`, `index.html`, `src/services/apiClient.ts`, `src/app/App.tsx`, `src/layouts/AdminLayout.tsx`, `src/Pages/Auth/PasswordReset.tsx`.

**Backend repo — create:** `.nvmrc`, `apps/user-service/src/utils/jwt.test.js`.
**Backend repo — modify:** six `apps/*/Dockerfile`, seven `apps/*/index.js`, six `apps/*/package.json` (+ lockfiles), `apps/user-service/src/utils/jwt.js`, `docker/docker-compose.yml`.
**Workspace root (not a git repo):** `AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## Task overview and order

| Gate | Task | Findings | Size* |
|---|---|---|---|
| **0: patch now** | 1 Toolchain and dev dependencies | A1, A2 | S |
| | 9 Backend runtime to Node 24 | B3 | M |
| | 10 Backend dependency patching | B4 | M |
| **1: Admin code** | 2 Production build guard | A3 | S |
| | 3 No localhost in the bundle; secret hygiene; bundle scan | A3, A8 | S |
| | 4 Error boundary | A7 | S |
| | 5 Session hardening | A4, A6 | S |
| | 6 Security headers and CSP | A5 | M |
| | 7 CI and supply chain | A9 | S |
| | 8 Deploy runbook | | S |
| **2: Backend** | 11 Short admin tokens | B6 | S |
| | 12 CORS allowlist and helmet | B2, B7 | S |
| | 13 Compose hardening (phpMyAdmin) | B5 | S |
| **3: Edge** | 14 Hosting, WAF, alarms | B1, A5 | L |
| **4: Verify** | 15 Pre-launch verification | all | M |

*Rough: S under an hour, M half a day, L a day or more. Gate 0 is urgent because of active exploitation reports. Gates 1 and 2 can run in parallel in separate worktrees.

---

# 3. Tasks

## Task 1: Pin the toolchain and patch dev dependencies

**Repo:** Admin. **Findings:** A1, A2.

**Files:**
- Create: `.nvmrc`, `.npmrc`
- Modify: `package.json` (add `engines`), `package-lock.json`

**Interfaces:** Produces: a guarantee that `npm install` fails on Node < 24.22.1.

- [ ] **Step 1: Install the patched Node and confirm**

Install Node 24.22.1 with your version manager (for nvm-windows: `nvm install 24.22.1 && nvm use 24.22.1`), then:

Run: `node -v`
Expected: `v24.22.1`

- [ ] **Step 2: Add the pins**

`.nvmrc`:
```
24.22.1
```

`.npmrc`:
```
engine-strict=true
```

In `package.json`, add after `"type": "module",`:
```json
  "engines": {
    "node": ">=24.22.1"
  },
```

- [ ] **Step 3: Handle the pre-existing lockfile change on its own**

Run: `git diff --stat package-lock.json`
Read the diff. If it is only an unrelated churn, `git checkout package-lock.json` to drop it. If it is wanted, commit it separately first: `git add package-lock.json && git commit -m "chore: update lockfile"`. Do not mix it with the next steps.

- [ ] **Step 4: Patch the advisories**

Run: `npm audit fix`
Run: `npm audit`
Expected: `found 0 vulnerabilities`

- [ ] **Step 5: Prove nothing broke**

Run: `npx tsc -b && npm run lint && VITE_USER_API=https://x.example/api VITE_ANALYTICS_API=https://x.example/api VITE_LOCATIONS_API=https://x.example/api VITE_MENU_API=https://x.example/api VITE_ORDER_API=https://x.example/api npm run build`
Expected: all three exit 0.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc .npmrc package.json package-lock.json
git commit -m "chore(security): pin Node >= 24.22.1 and patch dev-tooling advisories"
```

---

## Task 2: Production build guard

**Repo:** Admin. **Finding:** A3.

**Files:**
- Create: `deploy/apiEnv.ts`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `API_VARS` (readonly tuple of the five env var names) and `apiOrigins(env): string[]` (throws on a missing/invalid URL). Task 6 reuses both.

- [ ] **Step 1: Prove today's build lets a bad config through (the failing check)**

Run: `npm run build` (with no `VITE_*` variables set in the shell and no `.env.production`)
Expected today: build **succeeds**, which is the bug.

- [ ] **Step 2: Create `deploy/apiEnv.ts`**

```ts
export const API_VARS = [
  "VITE_USER_API",
  "VITE_ANALYTICS_API",
  "VITE_LOCATIONS_API",
  "VITE_MENU_API",
  "VITE_ORDER_API",
] as const;

/** The distinct origins the console calls; throws naming every variable that is missing or not a URL. */
export function apiOrigins(env: Record<string, string | undefined>): string[] {
  const bad = API_VARS.filter((k) => !URL.canParse(env[k] ?? ""));
  if (bad.length) throw new Error(`Missing or invalid URL: ${bad.join(", ")}`);
  return [...new Set(API_VARS.map((k) => new URL(env[k]!).origin))];
}
```

- [ ] **Step 3: Replace `vite.config.ts`**

```ts
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { API_VARS } from './deploy/apiEnv.ts'

// A production bundle must never be built against missing or plaintext API URLs.
function requireHttpsApis(env: Record<string, string>): Plugin {
  return {
    name: 'require-https-apis',
    buildStart() {
      const bad = API_VARS.filter((k) => !env[k]?.startsWith('https://'))
      if (bad.length) this.error(`Production build needs https:// URLs for: ${bad.join(', ')}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), ...(mode === 'production' ? [requireHttpsApis(env)] : [])],
  }
})
```

`--mode local` (used in Task 6) skips the guard so a developer can still build against `http://localhost`.

- [ ] **Step 4: Run it to verify the guard fires**

Run: `npm run build`
Expected: FAIL, message `Production build needs https:// URLs for: VITE_USER_API, VITE_ANALYTICS_API, VITE_LOCATIONS_API, VITE_MENU_API, VITE_ORDER_API`.

Run: `VITE_USER_API=http://x.example/api VITE_ANALYTICS_API=https://x.example/api VITE_LOCATIONS_API=https://x.example/api VITE_MENU_API=https://x.example/api VITE_ORDER_API=https://x.example/api npm run build`
Expected: FAIL naming only `VITE_USER_API`.

Run: all five set to `https://x.example/api`, then `npm run build`
Expected: PASS.

Run: `npx tsc -p tsconfig.node.json`
Expected: exit 0 (the config and `deploy/apiEnv.ts` type-check).

- [ ] **Step 5: Commit**

```bash
git add deploy/apiEnv.ts vite.config.ts
git commit -m "feat(build): fail production builds without https API URLs"
```

---

## Task 3: No localhost in the bundle, no stray secrets, a scan that proves it

**Repo:** Admin. **Findings:** A3, A8.

**Files:**
- Create: `scripts/check-bundle.mjs`, `.env.example`
- Modify: `src/services/apiClient.ts:1-5`
- Local only (gitignored): `.env`

**Interfaces:** Produces: `node scripts/check-bundle.mjs [dir]` exits 1 and prints one line per problem.

- [ ] **Step 1: Write the bundle check**

`scripts/check-bundle.mjs`:
```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  [/localhost:40\d\d/, "dev API fallback URL"],
  [/VITE_ADMIN/, "admin credential variable"],
  [/internal-dev-key/, "dev internal API key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/sourceMappingURL=/, "source map reference"],
];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const problems = [];
for (const file of walk(process.argv[2] ?? "dist")) {
  if (file.endsWith(".map")) problems.push(`${file}: source map shipped`);
  if (!/\.(js|css|html)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [re, why] of FORBIDDEN) if (re.test(text)) problems.push(`${file}: ${why}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("bundle clean");
```

- [ ] **Step 2: Run it against the existing `dist/` to see it fail**

Run: `node scripts/check-bundle.mjs dist`
Expected: FAIL, five lines like `dist/assets/index-CO81y-Ns.js: dev API fallback URL`.

- [ ] **Step 3: Remove the fallbacks from production builds**

In `src/services/apiClient.ts`, replace lines 1-5 with:
```ts
// The localhost defaults exist for `npm run dev` only; import.meta.env.DEV is false in a build, so they are stripped from it.
export const USER_API = import.meta.env.VITE_USER_API ?? (import.meta.env.DEV ? "http://localhost:4001/api" : "");
export const ANALYTICS_API = import.meta.env.VITE_ANALYTICS_API ?? (import.meta.env.DEV ? "http://localhost:4006/api" : "");
export const LOCATIONS_API = import.meta.env.VITE_LOCATIONS_API ?? (import.meta.env.DEV ? "http://localhost:4004/api" : "");
export const MENU_API = import.meta.env.VITE_MENU_API ?? (import.meta.env.DEV ? "http://localhost:4005/api" : "");
export const ORDER_API = import.meta.env.VITE_ORDER_API ?? (import.meta.env.DEV ? "http://localhost:4002/api" : "");
```

- [ ] **Step 4: Rebuild and re-run the check**

Run: all five `VITE_*` set to `https://x.example/api`, `npm run build`, then `node scripts/check-bundle.mjs dist`
Expected: build PASS, then `bundle clean`.

Run: `npm run dev` for 10 seconds, open `http://localhost:5173/login`, confirm sign-in still reaches `http://localhost:4001` (dev defaults intact).

- [ ] **Step 5: Remove the dead credentials and document the real variables**

Delete the two `VITE_ADMIN_*` lines from the local `.env` (it is gitignored, so nothing to commit there). Create `.env.example` (the `.gitignore` already allows it):
```
# Build-time API base URLs. A production build requires https:// for all five.
VITE_USER_API=https://admin.example.com/api
VITE_ANALYTICS_API=https://admin.example.com/api
VITE_LOCATIONS_API=https://admin.example.com/api
VITE_MENU_API=https://admin.example.com/api
VITE_ORDER_API=https://admin.example.com/api
```

- [ ] **Step 6: Commit**

```bash
git add scripts/check-bundle.mjs src/services/apiClient.ts .env.example
git commit -m "feat(build): strip dev API fallbacks from production and scan the bundle"
```

---

## Task 4: Error boundary

**Repo:** Admin. **Finding:** A7.

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/** Last-resort screen: a render error anywhere below shows this instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ponytail: console only; forward to an error tracker here once one exists (Task 14 alarms cover the API side)
    console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ padding: "4rem 1.5rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Reloading usually fixes it.</p>
        <button onClick={() => window.location.assign("/dashboard")}>Reload the dashboard</button>
      </div>
    );
  }
}
```

- [ ] **Step 2: Wrap the app**

`src/app/App.tsx`: add `import ErrorBoundary from "../components/ErrorBoundary";` and wrap the existing return:
```tsx
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
```

- [ ] **Step 3: Verify it catches a crash (manual, then revert)**

Temporarily add `throw new Error("boundary test");` as the first line of the `Dashboard` function body. Run `npm run dev`, sign in. Expected: the "Something went wrong" screen, not a blank page, and the error in the console. Remove the throw.

Run: `npx tsc -b && npm run lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/app/App.tsx
git commit -m "feat(app): show a recovery screen instead of a blank page on render errors"
```

---

## Task 5: Session hardening

**Repo:** Admin. **Findings:** A4, A6. **Needs decision D1(a).**

**Files:**
- Create: `src/hooks/useIdleLogout.ts`
- Modify: `src/layouts/AdminLayout.tsx:1-4,11-14`, `src/Pages/Auth/PasswordReset.tsx:2,81`, `index.html`

**Interfaces:** Produces: `useIdleLogout(onIdle: () => void, minutes?: number): void`. `onIdle` must be referentially stable (wrap in `useCallback`) or the timer restarts every render.

- [ ] **Step 1: Create the hook**

```ts
import { useEffect } from "react";

const ACTIVITY = ["pointerdown", "pointermove", "keydown", "wheel"] as const;

/** Calls onIdle after `minutes` without input. Also checks when a tab left idle in the background comes back. */
export function useIdleLogout(onIdle: () => void, minutes = 30) {
  useEffect(() => {
    let last = Date.now();
    const touch = () => { last = Date.now(); };
    const check = () => {
      if (Date.now() - last < minutes * 60_000) return;
      last = Date.now(); // don't fire again while the sign-out request is in flight
      onIdle();
    };
    const onVisible = () => { if (!document.hidden) check(); };

    ACTIVITY.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, 30_000);
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [onIdle, minutes]);
}
```

- [ ] **Step 2: Use it in the layout**

`src/layouts/AdminLayout.tsx`: change line 1 to
```tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
```
add after the existing imports:
```tsx
import { logout } from "../services/auth.service";
import { useIdleLogout } from "../hooks/useIdleLogout";
```
and add inside `Layout`, directly after the `menuButton` ref:
```tsx
  // Staff leave consoles open on shared machines; sign out after 30 idle minutes.
  const signOut = useCallback(() => {
    logout().finally(() => setIsLoggedIn(false));
  }, [setIsLoggedIn]);
  useIdleLogout(signOut);
```

- [ ] **Step 3: Verify idle logout (manual)**

Temporarily call `useIdleLogout(signOut, 0.5)`. Run `npm run dev`, sign in, touch nothing for 60 seconds. Expected: redirected to `/login`, and `localStorage` has no `access_token` or `user`. Move the mouse every 20 seconds in a second run: expected, no sign-out. Restore the default.

- [ ] **Step 4: Strip the reset token from the address bar**

`src/Pages/Auth/PasswordReset.tsx` line 2 becomes:
```tsx
import { Link, useNavigate, useSearchParams } from "react-router-dom";
```
Replace line 81 (`const token = useSearchParams()[0].get("token") ?? "";`) with:
```tsx
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => params.get("token") ?? "");
  // Drop the token from the address bar so it doesn't linger in history or the Referer header
  useEffect(() => {
    navigate("/reset-password", { replace: true });
  }, [navigate]);
```

Verify (manual): open `http://localhost:5173/reset-password?token=abc123`. Expected: the address bar shows `/reset-password` within a moment, and submitting a new password still sends `abc123` (check the request body in DevTools, Network tab).

- [ ] **Step 5: Referrer policy and a real page title**

`index.html`, inside `<head>` after the viewport meta:
```html
    <meta name="referrer" content="no-referrer" />
```
and change `<title>admin</title>` to `<title>RC Admin</title>`.

- [ ] **Step 6: Check and commit**

Run: `npx tsc -b && npm run lint`
Expected: exit 0 (watch for a `react-hooks` complaint about the effect; the navigate call is not a setState so none is expected).

```bash
git add src/hooks/useIdleLogout.ts src/layouts/AdminLayout.tsx src/Pages/Auth/PasswordReset.tsx index.html
git commit -m "feat(auth): idle sign-out, keep the reset token out of the URL, no-referrer"
```

---

## Task 6: Security headers and CSP, one source of truth

**Repo:** Admin. **Finding:** A5.

**Files:**
- Create: `deploy/securityHeaders.ts`, `deploy/printCloudFrontPolicy.ts`, `scripts/check-headers.mjs`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: `apiOrigins(env): string[]` from `deploy/apiEnv.ts` (Task 2).
- Produces: `buildHeaders({ apiOrigins }): Record<string, string>`; `node scripts/check-headers.mjs <url>` (exit 1 on any mismatch).

**Why these directives (checked against the code):** no inline `<style>`/script and no external fonts or scripts exist, so `script-src`, `style-src` and `font-src` can be `'self'` only. React sets `style={{}}` through the CSSOM, which CSP allows. Food-item images come from `image_url` with no fixed host yet, so `img-src` allows `https:`.

- [ ] **Step 1: Create `deploy/securityHeaders.ts`**

```ts
interface Inputs {
  /** Every origin the console calls (from apiOrigins). */
  apiOrigins: string[];
}

export function buildHeaders({ apiOrigins }: Inputs) {
  const csp = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    // ponytail: any https image host because image_url has no fixed origin yet; pin to the media bucket once uploads exist
    "img-src 'self' data: https:",
    `connect-src ${["'self'", ...apiOrigins].join(" ")}`,
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  } as const;
}
```

`upgrade-insecure-requests` is deliberately omitted: it would break the local `vite preview` check below, and HSTS plus an https-only `connect-src` already cover it in production.

- [ ] **Step 2: Serve the same headers from `vite preview`**

`vite.config.ts` becomes:
```ts
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { API_VARS, apiOrigins } from './deploy/apiEnv.ts'
import { buildHeaders } from './deploy/securityHeaders.ts'

// A production bundle must never be built against missing or plaintext API URLs.
function requireHttpsApis(env: Record<string, string>): Plugin {
  return {
    name: 'require-https-apis',
    buildStart() {
      const bad = API_VARS.filter((k) => !env[k]?.startsWith('https://'))
      if (bad.length) this.error(`Production build needs https:// URLs for: ${bad.join(', ')}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), ...(mode === 'production' ? [requireHttpsApis(env)] : [])],
    // Preview serves the production headers so CSP breakage shows up locally, before deploy
    preview: isPreview ? { headers: buildHeaders({ apiOrigins: apiOrigins(env) }) } : undefined,
  }
})
```

- [ ] **Step 3: Create the CloudFront policy printer**

`deploy/printCloudFrontPolicy.ts`:
```ts
import { apiOrigins } from "./apiEnv.ts";
import { buildHeaders } from "./securityHeaders.ts";

const h = buildHeaders({ apiOrigins: apiOrigins(process.env) });
const custom = ["Permissions-Policy", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy"] as const;

console.log(
  JSON.stringify(
    {
      Name: "rc-admin-security-headers",
      Comment: "Security headers for the RC Admin console",
      SecurityHeadersConfig: {
        ContentSecurityPolicy: { Override: true, ContentSecurityPolicy: h["Content-Security-Policy"] },
        StrictTransportSecurity: { Override: true, AccessControlMaxAgeSec: 63072000, IncludeSubdomains: true, Preload: false },
        ContentTypeOptions: { Override: true },
        FrameOptions: { Override: true, FrameOption: "DENY" },
        ReferrerPolicy: { Override: true, ReferrerPolicy: "no-referrer" },
      },
      CustomHeadersConfig: {
        Quantity: custom.length,
        Items: custom.map((Header) => ({ Header, Value: h[Header], Override: true })),
      },
    },
    null,
    2,
  ),
);
```

- [ ] **Step 4: Create the header check**

`scripts/check-headers.mjs`:
```js
import { apiOrigins } from "../deploy/apiEnv.ts";
import { buildHeaders } from "../deploy/securityHeaders.ts";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/check-headers.mjs <url>");
  process.exit(2);
}

const expected = buildHeaders({ apiOrigins: apiOrigins(process.env) });
const res = await fetch(url);
const bad = Object.entries(expected).filter(([name, want]) => res.headers.get(name) !== want);
for (const [name, want] of bad) console.error(`${name}\n  want: ${want}\n  got:  ${res.headers.get(name)}`);
console.log(bad.length ? `${bad.length} header(s) wrong` : "all security headers present");
process.exit(bad.length ? 1 : 0);
```

- [ ] **Step 5: Run the checks (fail first, then pass)**

Run (with the local env block exported): `node scripts/check-headers.mjs http://localhost:4173/`
Expected before preview is running: FAIL (`fetch failed`).

Run: `npx tsc -b && npx vite build --mode local && npx vite preview --mode local --port 4173` in one terminal.
Run in another: `node scripts/check-headers.mjs http://localhost:4173/`
Expected: `all security headers present`, exit 0.

Run: `node deploy/printCloudFrontPolicy.ts | node -e "JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('valid json')"`
Expected: `valid json`.

- [ ] **Step 6: Prove the CSP does not break the app (manual, in a browser)**

With the preview and the local backend (docker compose) running, open `http://localhost:4173/login`. Sign in, then visit Dashboard, Users, Orders, Food items, Reports, Notices. Open DevTools, Console.
Expected: **no** `Refused to ...` / `Content Security Policy` messages, fonts render, food-item images load. If an API call is blocked by CORS rather than CSP, add `http://localhost:4173` to `CORS_ORIGINS` (Task 12) and retry.
If anything is CSP-blocked, widen only that one directive and note why in the source comment.

- [ ] **Step 7: Commit**

```bash
git add deploy/securityHeaders.ts deploy/printCloudFrontPolicy.ts scripts/check-headers.mjs vite.config.ts
git commit -m "feat(security): single-source CSP and security headers, served by preview and exportable to CloudFront"
```

---

## Task 7: CI and supply-chain protection

**Repo:** Admin. **Finding:** A9.

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/dependabot.yml`

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      VITE_USER_API: https://admin.example.com/api
      VITE_ANALYTICS_API: https://admin.example.com/api
      VITE_LOCATIONS_API: https://admin.example.com/api
      VITE_MENU_API: https://admin.example.com/api
      VITE_ORDER_API: https://admin.example.com/api
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      # --ignore-scripts: dependency install scripts are the usual route for npm supply-chain malware
      - run: npm ci --ignore-scripts
      - run: npx tsc -b
      - run: npm run lint
      - run: npm audit --audit-level=high
      - run: npm run build
      - run: node scripts/check-bundle.mjs dist
```

- [ ] **Step 2: Pin the actions to commit SHAs**

For each action, get the commit and replace the tag, keeping the tag as a comment:
```bash
gh api repos/actions/checkout/commits/v4 --jq .sha
gh api repos/actions/setup-node/commits/v4 --jq .sha
```
Result form: `- uses: actions/checkout@<40-char-sha> # v4`.

- [ ] **Step 3: Dependabot**

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

- [ ] **Step 4: Prove the gate works locally**

Run exactly the CI commands: `npm ci --ignore-scripts && npx tsc -b && npm run lint && npm audit --audit-level=high && npm run build && node scripts/check-bundle.mjs dist` (with the five `https://` variables exported).
Expected: all exit 0. This also proves the app builds without install scripts (esbuild and rollup ship prebuilt binaries); if it does not, stop and investigate before enabling the flag.

- [ ] **Step 5: Commit, push, and confirm the first run is green**

```bash
git add .github
git commit -m "ci: typecheck, lint, audit, build and scan the bundle on every PR"
git push -u origin chore/production-readiness
```
Open a PR and confirm the `verify` job passes. In the repo settings, require it before merging to `main`.

---

## Task 8: Deploy and rollback runbook

**Repo:** Admin.

**Files:**
- Create: `deploy/README.md`

- [ ] **Step 1: Write the runbook**

````markdown
# Deploying the Admin console

Hosted as static files in a private S3 bucket behind CloudFront (see `AWS-INFRASTRUCTURE-PLAYBOOK.md` §8). There is no server process.

## Build (CI or a clean checkout on Node >= 24.22.1)

```bash
npm ci --ignore-scripts
export VITE_USER_API=https://admin.<domain>/api VITE_ANALYTICS_API=https://admin.<domain>/api \
  VITE_LOCATIONS_API=https://admin.<domain>/api VITE_MENU_API=https://admin.<domain>/api \
  VITE_ORDER_API=https://admin.<domain>/api
npm run build                      # fails unless all five are https://
node scripts/check-bundle.mjs dist # fails on localhost URLs, secrets, source maps
```

## Upload

Hashed assets are immutable; everything else must revalidate. Upload assets first so a new `index.html` never points at files that do not exist yet. No `--delete`: old assets stay so clients holding the previous `index.html` keep working and rollback is instant.

```bash
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public,max-age=31536000,immutable"
aws s3 sync dist "s3://$BUCKET" --exclude "assets/*" --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html" "/vite.svg"
```

## Verify the release

```bash
node scripts/check-headers.mjs https://admin.<domain>/   # needs the same five variables exported
curl -sI https://admin.<domain>/ | grep -i cache-control # expect: no-cache
curl -s -o /dev/null -w "%{http_code}\n" https://admin.<domain>/users  # expect: 200 (SPA fallback)
```

## Roll back

The bucket has versioning on. Restore the previous `index.html` (it references the previous hashed assets, which are still in the bucket):

```bash
aws s3api list-object-versions --bucket "$BUCKET" --prefix index.html --max-items 5
aws s3api copy-object --bucket "$BUCKET" --key index.html \
  --copy-source "$BUCKET/index.html?versionId=<previous-version-id>" \
  --cache-control "no-cache" --metadata-directive REPLACE --content-type text/html
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html"
```

Prune assets older than 30 days from the bucket occasionally (a lifecycle rule on the `assets/` prefix does it).
````

- [ ] **Step 2: Dry-run the build section locally**

Run the three build commands in a scratch shell with `https://admin.example.com/api` for the variables.
Expected: build PASS, `bundle clean`.

- [ ] **Step 3: Commit**

```bash
git add deploy/README.md
git commit -m "docs(deploy): build, upload, verify and rollback runbook"
```

---

## Task 9: Backend runtime to Node 24

**Repo:** Backend (+ workspace-root playbook). **Finding:** B3.

**Files:**
- Create: `.nvmrc`
- Modify: `apps/{analytics,delivery,locations,menu,order,user,websocket}-service/Dockerfile`, `../AWS-INFRASTRUCTURE-PLAYBOOK.md`

- [ ] **Step 1: Baseline: tests pass on the current runtime**

Run, in each of `apps/user-service`, `apps/order-service`, `apps/analytics-service`: `npm test`
Expected: user 30/30, order 19/19, analytics 8/8 (the counts recorded in session memory). Record any difference now.

- [ ] **Step 2: Switch the base images**

```bash
sed -i -E 's#^FROM node:[0-9a-z.\-]+#FROM node:24.22.1-alpine#' apps/*/Dockerfile
grep -n "^FROM" apps/*/Dockerfile
echo "24.22.1" > .nvmrc
```
Expected: every line is `FROM node:24.22.1-alpine`. (`delivery-service` was `node:18`, the Debian image; if it needs Debian packages, use `node:24.22.1-slim` and re-check.)

- [ ] **Step 3: Rebuild and run the same tests under Node 24**

Run: `docker compose -f docker/docker-compose.yml build && docker compose -f docker/docker-compose.yml up -d`
Run: `docker run --rm node:24.22.1-alpine node -v`
Expected: `v24.22.1`.
Run the three `npm test` suites again with Node 24 locally.
Expected: same counts as Step 1.

- [ ] **Step 4: Smoke test the stack**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4006/health` and a sign-in from the Admin against `localhost:4001`.
Expected: `200` and a successful login.

- [ ] **Step 5: Fix the Lambda target in the playbook**

In `C:\Users\budglk\RC\AWS-INFRASTRUCTURE-PLAYBOOK.md` replace every `NODEJS_20_X` with `NODEJS_24_X` and the "Node 18/20 drift" bullet in "Pending code changes" with "all services on Node 24". When the CDK stacks are written, confirm `lambda.Runtime.NODEJS_24_X` exists in the installed `aws-cdk-lib` and that Lambda offers `nodejs24.x` in the target region.

- [ ] **Step 6: Commit (Backend repo)**

```bash
git add .nvmrc apps/*/Dockerfile
git commit -m "chore(security): move every service to Node 24.22.1 (18 and 20 are end-of-life and unpatched)"
```

---

## Task 10: Backend dependency patching

**Repo:** Backend. **Finding:** B4.

**Files:** `apps/*/package.json` and `package-lock.json` for `user`, `order`, `menu`, `locations`, `analytics`, `delivery`, `api-gateway`.

- [ ] **Step 1: Record the starting numbers**

Run in each service: `npm audit --omit=dev --json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.stringify(JSON.parse(d).metadata.vulnerabilities)))"`
Expected today (from this session): user 36 (5 critical), order 17, menu 20, locations 16, analytics 5, delivery 17, gateway 8.

- [ ] **Step 2: Apply the non-breaking fixes, service by service**

For each service directory: `npm audit fix` then `npm test` (where a test script exists) then `npm audit --omit=dev`.
Expected after: zero critical; remaining items listed.

- [ ] **Step 3: Handle what `audit fix` cannot**

Any item still listed is a direct dependency needing an explicit bump (the audit output names it under `fix available via`). Known one: user-service `nodemailer`:
```bash
cd apps/user-service && npm install nodemailer@10.2.1 && npm test
```
For each other leftover, `npm ls <package>` to find the parent, bump that parent, re-run tests. Do **not** use `npm audit fix --force`; review a major bump on its own.

- [ ] **Step 4: Verify the end state per service**

Run: `npm audit --omit=dev --audit-level=high`
Expected: exit 0 for all seven. Record any exception with the reason in the commit body.

- [ ] **Step 5: Full-stack regression**

Run: `docker compose -f docker/docker-compose.yml up -d --build`, then the Admin sign-in, Orders list, Users list, Dashboard and a notice send against the local stack.
Expected: all load without console errors. Also run the root `tests/routes-access.test.js` with the `NODE_PATH` note from `ADMIN-PLAN.md`.

- [ ] **Step 6: Commit**

```bash
git add apps/*/package.json apps/*/package-lock.json
git commit -m "chore(security): patch production dependency advisories across services"
```

---

## Task 11: Short admin access tokens

**Repo:** Backend. **Finding:** B6. **Needs decision D1(a).**

**Files:**
- Create: `apps/user-service/src/utils/jwt.test.js`
- Modify: `apps/user-service/src/utils/jwt.js:36-39`

**Interfaces:** Consumes `generateAccessToken(user)`. Produces: admin roles get `ADMIN_ACCESS_TOKEN_TTL` (default `8h`); every other role keeps `ACCESS_TOKEN_TTL` (default `7d`), so the mobile apps are unaffected.

- [ ] **Step 1: Write the failing test**

`apps/user-service/src/utils/jwt.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jwt-test-'));
fs.writeFileSync(path.join(dir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(dir, 'public.pem'), publicKey);
process.env.JWT_PRIVATE_KEY_PATH = path.join(dir, 'private.pem');
process.env.JWT_PUBLIC_KEY_PATH = path.join(dir, 'public.pem');
delete process.env.ACCESS_TOKEN_TTL;
delete process.env.ADMIN_ACCESS_TOKEN_TTL;

const { generateAccessToken } = require('./jwt');

const lifetime = (role) => {
  const p = jwt.decode(generateAccessToken({ id: 'u1', role, area_id: null }));
  return p.exp - p.iat;
};

test('admin roles get an 8 hour token', () => {
  assert.equal(lifetime('admin'), 8 * 3600);
  assert.equal(lifetime('super_admin'), 8 * 3600);
});

test('other roles keep the 7 day token', () => {
  assert.equal(lifetime('customer'), 7 * 24 * 3600);
  assert.equal(lifetime('delivery_person'), 7 * 24 * 3600);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (in `apps/user-service`): `node --test src/utils/jwt.test.js`
Expected: FAIL on the first test (`604800 !== 28800`).

- [ ] **Step 3: Implement**

In `jwt.js`, above `generateAccessToken` add:
```js
const ADMIN_ROLES = ['admin', 'super_admin'];
const accessTokenTtl = (role) =>
  ADMIN_ROLES.includes(role)
    ? process.env.ADMIN_ACCESS_TOKEN_TTL || '8h' // staff use a browser console that has no refresh flow
    : process.env.ACCESS_TOKEN_TTL || '7d'; // e.g. ACCESS_TOKEN_TTL=1m to test refresh
```
and replace the `expiresIn:` line in `generateAccessToken` with:
```js
      expiresIn: accessTokenTtl(user.role)
```

- [ ] **Step 4: Run to verify it passes, then the whole suite**

Run: `node --test src/utils/jwt.test.js` then `npm test`
Expected: PASS, and the existing 30 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add apps/user-service/src/utils/jwt.js apps/user-service/src/utils/jwt.test.js
git commit -m "feat(auth): 8 hour access tokens for admin roles"
```

Existing admin sessions keep their 7-day token until it expires; to force the change immediately, rotate nothing, just have admins sign in again.

---

## Task 12: CORS allowlist and helmet

**Repo:** Backend. **Findings:** B2, B7.

**Files:**
- Modify: `apps/{user,order,menu,locations,analytics,delivery}-service/index.js`, `apps/api-gateway/index.js`, `apps/{menu,locations}-service/package.json`, `docker/docker-compose.yml`

**Interfaces:** Produces: env var `CORS_ORIGINS` (comma-separated origins). Unset means CORS is off (no `Access-Control-Allow-Origin` header), correct for the Admin on a same-origin path (D3a) and for mobile apps, which do not use CORS.

- [ ] **Step 1: Write the failing check**

With the stack running:
```bash
curl -s -D - -o /dev/null -X OPTIONS http://localhost:4001/api/users/login \
  -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```
Expected today: `access-control-allow-origin: *` (the bug).

- [ ] **Step 2: Replace `app.use(cors());` in all seven `index.js` files**

```js
// Browsers may call this API only from the listed origins; unset = no cross-origin access (mobile apps don't use CORS)
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
```
Match each file's quote style (user, analytics and delivery use double quotes). In `menu-service/index.js` leave the Socket.IO `cors` block alone but note it: Socket.IO there is configured separately and needs the same allowlist if the websocket is used by the Admin (it is not today).

- [ ] **Step 3: Add helmet where it is missing**

order-service already depends on helmet: add `const helmet = require('helmet');` and `app.use(helmet());` after `express.json()`. For menu and locations:
```bash
(cd apps/menu-service && npm install helmet@^8.1.0) && (cd apps/locations-service && npm install helmet@^8.1.0)
```
then add the same two lines to each `index.js`.

- [ ] **Step 4: Configure the dev compose**

For each of user, order, menu, locations, analytics and delivery in `docker/docker-compose.yml`, add under `environment:`:
```yaml
      CORS_ORIGINS: http://localhost:5173,http://localhost:4173
```

- [ ] **Step 5: Run the check to verify it passes**

Rebuild: `docker compose -f docker/docker-compose.yml up -d --build`.
Run the Step 1 command: Expected: **no output** (header absent).
Run it again with `-H "Origin: http://localhost:5173"`: Expected: `access-control-allow-origin: http://localhost:5173`.
Run the Admin on `npm run dev` and sign in: Expected: works. Run `npm test` in user, order and analytics: Expected: unchanged counts.

- [ ] **Step 6: Commit**

```bash
git add apps docker/docker-compose.yml
git commit -m "feat(security): CORS allowlist from CORS_ORIGINS and helmet on every service"
```

---

## Task 13: Compose hardening (the phpMyAdmin exposure)

**Repo:** Backend. **Finding:** B5.

**Files:**
- Modify: `docker/docker-compose.yml`

- [ ] **Step 1: Write the failing check**

Run: `docker compose -f docker/docker-compose.yml config | grep -E "phpmyadmin|published|host_ip" | head`
and `docker ps --format '{{.Names}} {{.Ports}}' | grep -E "phpmyadmin|db|redis"`
Expected today: `0.0.0.0:8080->80`, `0.0.0.0:3307->3306`, `0.0.0.0:6379->6379`.

- [ ] **Step 2: Make phpMyAdmin opt-in and loopback-only**

In the `phpmyadmin:` service add `profiles: ["tools"]`, change `ports` to `- "127.0.0.1:8080:80"`, and replace `image: phpmyadmin/phpmyadmin` with a pinned tag. Before choosing the tag, confirm the image's PHP is at or above the fixed releases:
```bash
docker run --rm phpmyadmin:5-apache php -v
```
Expected: PHP 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35 or newer (the patched images shipped Oct 21; if the image is older, wait for the rebuild or do not run it). Pin the exact `phpmyadmin:<version>-apache` tag you verified.

Also stop using root: change `PMA_USER: root` / `PMA_PASSWORD` to a dedicated low-privilege user created for this purpose, or remove both and let phpMyAdmin prompt for credentials (`PMA_ARBITRARY` not needed; leave user/password unset).

- [ ] **Step 3: Bind every other published port to loopback**

```bash
sed -i -E 's#^(\s+- )"([0-9]+:[0-9]+)"#\1"127.0.0.1:\2"#' docker/docker-compose.yml
grep -nE '^\s+- "[0-9.]*:?[0-9]+:[0-9]+"' docker/docker-compose.yml
```
Expected: every entry starts with `127.0.0.1:` (redis, db, each service). Do not edit the `volumes:` lines (the pattern only matches port mappings).

- [ ] **Step 4: Verify**

Run: `docker compose -f docker/docker-compose.yml up -d` (phpMyAdmin must NOT start) and `docker ps --format '{{.Names}} {{.Ports}}'`.
Expected: no `phpmyadmin` container; every port shows `127.0.0.1:`.
Run: `docker compose -f docker/docker-compose.yml --profile tools up -d phpmyadmin && curl -sI http://127.0.0.1:8080 | head -1`
Expected: `HTTP/1.1 200`. From another machine on the network, `http://<your-ip>:8080` must refuse.

- [ ] **Step 5: Add a guard note**

At the top of the compose file add:
```yaml
# DEVELOPMENT ONLY. Never run this file on a server: it publishes the database and holds dev credentials.
```
The plaintext SMTP password in this file is tracked separately in `ADMIN-PLAN.md` (rotate it, move it to an untracked env file, and check history); do that in the same change if possible.

- [ ] **Step 6: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "chore(security): phpMyAdmin opt-in, pinned and loopback-only; bind all dev ports to 127.0.0.1"
```

---

## Task 14: Hosting, edge protection and alarms

**Repo:** infrastructure (the CDK stacks described in `AWS-INFRASTRUCTURE-PLAYBOOK.md` §8-9; not yet written). **Findings:** B1, A5. **Needs decisions D2 and D3.**

The AWS MCP servers were disconnected during this session, so construct and property names below are requirements to confirm against current CDK docs when the stack is written. Each requirement has a verification command that works regardless of how it is implemented.

**Files:** `StorageStack` (bucket, distribution), `DomainStack` (certificate, DNS), a new `EdgeSecurityStack` (WAF, in `us-east-1` for CloudFront scope), `ApiStack` (route and throttling settings).

- [ ] **Step 1: Private bucket, CloudFront only**

Requirements: S3 Block Public Access on (all four), bucket not a website endpoint, access only through CloudFront Origin Access Control, versioning enabled (rollback in Task 8), server-side encryption, lifecycle rule deleting `assets/` objects older than 30 days and noncurrent versions older than 90.
Verify: `aws s3api get-public-access-block --bucket $BUCKET` shows all `true`; `curl -sI https://$BUCKET.s3.amazonaws.com/index.html` returns 403.

- [ ] **Step 2: Distribution behaviour**

Requirements: viewer protocol policy redirect-to-https, minimum TLS `TLSv1.2_2021`, HTTP/2 and HTTP/3, default root object `index.html`, custom error responses mapping 403 and 404 to `/index.html` with status 200 (SPA routing), the response-headers policy from Task 6 attached to the default behaviour, standard logging to a private bucket.
Generate the policy: `node deploy/printCloudFrontPolicy.ts > headers-policy.json` (with the five production variables set), then create it from that JSON in the stack.
Verify: `node scripts/check-headers.mjs https://admin.<domain>/` exits 0; `curl -sI http://admin.<domain>/` returns a 301 to https; `curl -s -o /dev/null -w "%{http_code}" https://admin.<domain>/users` returns 200.

- [ ] **Step 3: Same-origin API path (decision D3a)**

Requirements: a second origin for the API Gateway, behaviour `/api/*` forwarding all methods, caching disabled, forwarding the `Authorization` header and all query strings, no cookies forwarded. Then `VITE_*_API=https://admin.<domain>/api` and no CORS is needed. If D3b is chosen instead, set `CORS_ORIGINS=https://admin.<domain>` on each service and add `https://api.<domain>` to the CSP via `apiOrigins`.
Verify: a login through `https://admin.<domain>/api/users/login` succeeds from the browser with no `Access-Control-*` headers involved.

- [ ] **Step 4: WAF (decision D2a)**

Requirements, web ACL scope CLOUDFRONT in `us-east-1`, attached to the Admin distribution (and the `api.<domain>` distribution if the mobile apps go through CloudFront): managed rule groups `AWSManagedRulesCommonRuleSet`, `AWSManagedRulesKnownBadInputsRuleSet`, `AWSManagedRulesAmazonIpReputationList`; rate-based rule limiting `POST` to paths ending `/users/login` to 20 requests per 5 minutes per IP (action: block); a second rate rule for `/users/forgot-password` and `/users/reset-password` at 10 per 5 minutes; a general rule of 2000 per 5 minutes per IP. Start the managed groups in `count` mode for 48 hours and review sampled requests before switching to `block`, to avoid blocking legitimate admin traffic.
Verify:
```bash
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code} " -X POST https://admin.<domain>/api/users/login \
  -H 'content-type: application/json' -d '{"email":"nobody@example.com","password":"wrong-password"}'; done; echo
```
Expected: `401` for the first ~20, then `403` (WAF block).

- [ ] **Step 5: Backend environment in Lambda/containers**

Requirements: every service gets `INTERNAL_API_KEY` from SSM/Secrets Manager (no `internal-dev-key` default in compose or code; the middleware in `internalAuthMiddleware.js` already fails closed with 503 when the key is unset, keep that), `JWT_PRIVATE_KEY_PATH`/key material from Secrets Manager (not baked into the image or bucket), `ADMIN_ACCESS_TOKEN_TTL` unset (8h default), `CORS_ORIGINS` per D3. Service-to-service routes (`/api/internal/*`) must not be reachable from the internet at all: do not route them through the public API Gateway/CloudFront, or block `/api/internal/*` in the WAF as a second layer.
Verify: `curl -s -o /dev/null -w "%{http_code}" -X POST -H "X-Internal-Key: internal-dev-key" https://admin.<domain>/api/internal/customers/00000000-0000-0000-0000-000000000000/check-block` returns 403 or 404, never 200 or 500.

- [ ] **Step 6: Minimum alarms (all notify one SNS topic with an email subscription)**

CloudFront 5xx rate above 2% for 5 minutes; Lambda `Errors` above 0 for 3 consecutive 5-minute periods and any `Throttles`; API Gateway 5xx; WAF blocked requests spike (an early brute-force signal); RDS `CPUUtilization` above 80%, `DatabaseConnections` above 80% of the instance limit, `FreeStorageSpace` below 2 GiB; the notifications DLQ `ApproximateNumberOfMessagesVisible` above 0.
Verify: temporarily lower one threshold to trigger it and confirm the email arrives.

- [ ] **Step 7: Database safety (applies to the Admin because it is the main writer)**

Requirements: automated backups 7+ days, deletion protection on, final snapshot on delete, no public accessibility, a restore test performed once into a scratch instance and a successful login against the restored copy.
Verify: `aws rds describe-db-instances --query "DBInstances[].[DBInstanceIdentifier,BackupRetentionPeriod,DeletionProtection,PubliclyAccessible]"` shows `[>=7, true, false]`.

- [ ] **Step 8: Commit** in the infrastructure repo with one commit per stack.

---

## Task 15: Pre-launch verification and go/no-go

**Repos:** all. Run against **staging**, not production.

- [ ] **Step 1: Automated gates are green**

Run: `npm audit --audit-level=high` in Admin and each Backend service (`--omit=dev` for Backend); CI green on `main`; `node scripts/check-bundle.mjs dist`; `node scripts/check-headers.mjs https://staging-admin.<domain>/`.
Expected: all exit 0.

- [ ] **Step 2: External header and TLS grade**

Check the staging URL with an external TLS scanner and an external header scanner.
Expected: TLS grade A or better, header grade A.

- [ ] **Step 3: Web application scan (unauthenticated baseline)**

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://staging-admin.<domain>/ -I
```
Expected: no FAIL entries. Review WARN entries and either fix or record why they are accepted.

- [ ] **Step 4: Authorization matrix (backend is the real enforcement)**

```bash
API=https://staging-admin.<domain>/api
for p in users/customers users/admins users/settings users/audit-logs users/notices users/delivery-persons; do
  printf "%-26s no-token=%s " "$p" "$(curl -s -o /dev/null -w '%{http_code}' $API/$p)"
  printf "admin=%s super=%s\n" "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ADMIN_TOKEN" $API/$p)" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $SUPER_TOKEN" $API/$p)"
done
```
Expected: `no-token=401` on every row; `admin=403` for `users/admins`, `users/settings`, `users/audit-logs`; `admin=200` for `users/customers`, `users/notices`, `users/delivery-persons`; `super=200` everywhere. Also confirm `GET /api/users/<uuid>` without the internal key returns 401/403.

- [ ] **Step 5: Secrets scan, including history**

```bash
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect -s /repo --redact
```
Run in Admin and Backend. Expected: no findings. The known SMTP password in Backend history must be rotated (it stays in history until cleaned; rotation is what matters).

- [ ] **Step 6: Session behaviour on staging**

Sign in; confirm the stored token expires in about 8 hours (decode `exp - iat`); leave idle 30 minutes and confirm sign-out; open a reset link and confirm the token leaves the URL; open the app with DevTools open and confirm zero CSP violations across every page.

- [ ] **Step 7: Failure drills**

(1) Deploy a deliberately bad `index.html`, then roll back with the Task 8 commands and time it (target under 5 minutes). (2) Stop one backend service and confirm the Admin shows its partial-failure messages, not a blank page. (3) Trigger one alarm and confirm delivery.

- [ ] **Step 8: Go / no-go checklist**

Launch only when every line is true:

- [ ] Node >= 24.22.1 on every runtime; no Node 18/20 image or Lambda runtime remains
- [ ] `npm audit` clean for production dependencies in every service and for the Admin
- [ ] No PHP or NGINX anywhere in the deployed path; phpMyAdmin not deployed
- [ ] Login rate limit proven at the edge (Task 14 Step 4)
- [ ] CSP and headers verified on the deployed URL with zero console violations
- [ ] Production `INTERNAL_API_KEY` and JWT keys come from the secret store; SMTP password rotated
- [ ] Database backups on, restore tested
- [ ] Rollback drill done
- [ ] Alarms deliver
- [ ] A follow-up date is set for MFA and the staff password minimum (B8, B9)

---

# 4. Self-review

**Spec coverage.** A1, A2 -> Task 1. A3 -> Tasks 2, 3. A4 -> Tasks 5, 6, 11. A5 -> Tasks 6, 14. A6 -> Task 5. A7 -> Task 4. A8 -> Task 3. A9 -> Task 7. B1 -> Task 14. B2, B7 -> Task 12. B3 -> Task 9. B4 -> Task 10. B5 -> Task 13. B6 -> Task 11. B8, B9, B10 -> deferred (section 1.5). PHP, NGINX, Node events -> section 1.2 and Tasks 9, 13, rule for NGINX.

**Placeholders.** None of the code steps leave a body to fill in. Task 14 states requirements and verification rather than CDK code because the stacks do not exist yet and the AWS documentation server was unavailable; it says so.

**Consistency.** `API_VARS` and `apiOrigins` are defined in Task 2 and used unchanged in Task 6 (`vite.config.ts` imports both), `check-headers.mjs` and `printCloudFrontPolicy.ts`. `buildHeaders` is defined once and consumed by preview, the printer and the checker. `CORS_ORIGINS` is defined in Task 12 and referenced in Tasks 6 and 14. `useIdleLogout(onIdle, minutes)` matches its call site.

**Assumptions to confirm during execution:** the playbook's Lambda runtime enum `NODEJS_24_X` exists; WAF cannot attach to an HTTP API; `loadEnv` includes shell-exported `VITE_*` variables (it does in Vite 7, and Task 2 Step 4 proves it); the CloudFront policy JSON shape (validate with the create call).

# Sources

- [Node.js October 2026 Security Releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [nginx.org: 2026 news and security releases](https://nginx.org/2026.html)
- [NCSC: Critical security issue affecting PHP](https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php)
- [Qualys: PHP2Shell, find, mitigate, patch](https://blog.qualys.com/vulnerabilities-threat-research/2026/10/20/php-announces-critical-security-release-for-two-vulnerabilities)
- [watchTowr: PHP2Shell FAQ](https://watchtowr.com/intelligence/php-cve-2026-109618-faq/)
- [Talos: Two critical RCEs in PHP core](https://blog.talosintelligence.com/two-critical-rces-in-php-core/)
- [The Hacker News: NGINX fixes 5 flaws](https://thehackernews.com/2026/10/nginx-fixes-5-flaws-including-possible.html)
- [Help Net Security: NGINX CVE-2026-42945 exploited](https://www.helpnetsecurity.com/2026/05/18/ngnix-vulnerability-exploited-cve-2026-42945/)
- [Aikido: Node2Shell Brotli RCE (CVE-2026-111497)](https://www.aikido.dev/blog/node2shell-nodejs-brotli-rce-cve-2026-111497)
