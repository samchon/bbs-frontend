# Frontend of Bullet-in Board System
## 1. Outline
![Nestia Logo](https://nestia.io/logo.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/bbs-frontend/tree/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@samchon/bbs-api.svg)](https://www.npmjs.com/package/@samchon/bbs-api)
[![Build Status](https://github.com/samchon/bbs-frontend/workflows/build/badge.svg)](https://github.com/samchon/bbs-frontend/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/guide-documents-forestgreen)](https://nestia.io/docs/)

This is a [Nestia](https://github.com/samchon/nestia)-born frontend project built for the sample BBS backend.

The purpose of this repo is simple. If the backend gives you a decent SDK, typed DTOs, and readable comments, frontend automation becomes much more realistic. This repo was built as a vibe coding project, with the generated SDK and local [CLAUDE.md](CLAUDE.md) doing most of the steering through Codex and Claude Code.

It is not meant to prove that AI can always design a perfect UI on its own. It is meant to show that backend documentation quality directly changes how far frontend automation can go.

## 2. Getting Started
Start the backend first.

This sample backend is not a Docker-first service. It is a local NestJS + Prisma + SQLite project that runs directly on Node.js with a local SQLite database.

```bash
git clone https://github.com/samchon/bbs-backend
cd bbs-backend
pnpm install
pnpm build:main
pnpm start
```

> Run this once if you want dummy articles and comments for testing.
>
> ```bash
> git clone https://github.com/samchon/bbs-backend
> cd bbs-backend
> pnpm install
> pnpm build
> pnpm test --reset true --simultaneous 1
> pnpm start
> ```

Then start the frontend in another terminal.

```bash
git clone https://github.com/samchon/bbs-frontend
cd bbs-frontend
pnpm install
pnpm dev
```

Default addresses:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:37000`

If the backend host changes, set `NEXT_PUBLIC_BBS_API_HOST` before starting the frontend.

## 3. Stack
- Next.js App Router
- React
- TypeScript
- React Query
- Playwright
- `@samchon/bbs-api`

## 4. Screens
### Home
![Home screen](public/readme/home.png)

### Post Detail
![Post detail screen](public/readme/detail.png)

### Write Post
![Write post screen](public/readme/write-post.png)

## 5. Test Automation
This repo uses browser-first testing.

- `pnpm test:e2e`: builds the app in SDK simulation mode and runs Playwright against the frontend only
- `pnpm ui:review`: builds the app, opens the main screens, checks key controls, and stores fresh screenshots under `.artifacts/ui-review/`
- GitHub Actions runs typecheck, e2e, and UI review without booting the backend server

Useful commands:

- `pnpm dev`
- `pnpm typecheck`
- `pnpm build`
- `pnpm start`
- `pnpm test:e2e`
- `pnpm ui:review`
