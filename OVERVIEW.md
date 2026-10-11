# RC Admin — Overview

RC is a food-delivery platform: a customer app, a delivery-driver app, this admin console, and a backend of microservices. This file is a brief orientation for anyone (including a future Claude Code session) opening this repo on its own, without the rest of the project's context. Full detail lives in the RC root: `../GO-LIVE-PLAYBOOK.md` and `../AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## What this repo is

A React 19 + Vite + TypeScript single-page app — the internal dashboard RC staff use to manage users, admins, delivery areas, and orders. Only `main` exists here; there's no `dev` branch for this repo.

## Current status: partly wired to the real backend

- **Real**: login (`POST /users/login` on user-service, admin/super_admin only) and the Notices page (list/create/delete on user-service `/users/notices`, areas from locations-service `/areas`). Client lives in `src/services/apiClient.ts`; base URLs come from `VITE_USER_API` / `VITE_LOCATIONS_API` (default `localhost:4001` / `4004`). No refresh-token handling: an expired token sends the admin back to login.
- **Still mock data**: Dashboard, Users, Admins, Delivery Areas — working pages and hooks over `src/data/*.ts`; their `*.service.ts` files are empty.
- **Empty, unrouted stubs**: Orders, Food Items, Sales, Reports, Settings, Audit Logs, Deposits, Delivery Persons, Sessions.

## Fix before doing anything else here

**`.env` is tracked in git** (not in `.gitignore`) and contains a plaintext admin email/password, already pushed to GitHub. Remove it from tracking, rotate the credential, and add it to `.gitignore` before any further work.

## Launch scope

Only four pages need wiring to real backend APIs for launch: **Dashboard, Users, Admins, Delivery Areas** — plus a minimal new Orders view. Everything else (Reports, Settings, Audit Logs, Sales, Deposits) is explicitly deferred to post-launch.

## Deployment direction

Static build (`npm run build` → `dist/`), hosted via S3 + CloudFront on AWS at `admin.<domain>` — the same AWS account as the backend, kept cheap since it's just a static SPA. See `../AWS-INFRASTRUCTURE-PLAYBOOK.md` §8 for the actual stack.

## Backend it will talk to

Once wired up, the four core pages call `user-service` (users/admins) and `locations-service` (delivery areas) via the same API Gateway the mobile apps use — see `../Backend/OVERVIEW.md` for what's actually built there.
