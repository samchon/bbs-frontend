# Architecture Decisions

## Frontend Strategy

This project is implemented as a client-rendered TypeScript SPA.

- Problem solved:
  - The SDK exposes external HTTP endpoints for list, detail, create, update, delete, search, pagination, and history flows.
  - The app needs quick refetching and low-friction navigation more than server-rendered SEO.
- Why the platform default is not enough:
  - Plain DOM scripting would make cross-screen state, forms, cache invalidation, and history selection hard to maintain.
- Why the added complexity is worth it:
  - A component model plus route-based UI lets us keep the adapter boundary narrow while still shipping the whole board workflow in one coherent app.

## Chosen Stack

### React + Vite + TypeScript

- Problem solved:
  - React gives a practical component model for board list, post detail, comment detail, and editor screens.
  - Vite keeps the toolchain small and fast for a pure frontend client.
  - TypeScript helps keep normalized domain models and SDK adapters aligned.
- Why the platform default is not enough:
  - There is no existing app shell, router, or build pipeline in the repository.
- Why the added complexity is worth it:
  - This is the smallest modern stack that still supports a maintainable production frontend.

### React Router

- Problem solved:
  - Home, post creation, and post detail are distinct navigable screens.
- Why the platform default is not enough:
  - Conditional rendering alone makes deep-linking, browser navigation, and route-based loading awkward.
- Why the added complexity is worth it:
  - It gives stable URLs for the core board flows without introducing a full meta-framework.

### TanStack Query

- Problem solved:
  - The app needs request status, retries, cache invalidation, refetching, and mutation coordination across post and comment flows.
- Why the platform default is not enough:
  - Manual `useEffect` plus local state would duplicate loading and invalidation logic in every screen.
- Why the added complexity is worth it:
  - One shared query layer reduces repeated error-prone boilerplate and improves user feedback.

### React Hook Form

- Problem solved:
  - Post and comment editors include repeated linked-file rows, password confirmation, and create versus edit variants.
- Why the platform default is not enough:
  - Hand-written controlled form state would become noisy and difficult to validate consistently.
- Why the added complexity is worth it:
  - It keeps the form layer concise without leaking SDK payloads into the UI.

### React Markdown + DOMPurify

- Problem solved:
  - The SDK can return post and comment bodies in `txt`, `md`, and `html` formats.
- Why the platform default is not enough:
  - Raw HTML rendering is unsafe and plain text rendering loses markdown structure.
- Why the added complexity is worth it:
  - `react-markdown` gives a safe markdown rendering path and `dompurify` keeps HTML rendering explicit and sanitized.

### Custom CSS

- Problem solved:
  - The app needs a deliberate but familiar board layout without depending on a heavy UI framework.
- Why the platform default is not enough:
  - Browser defaults are not sufficient for a production-grade list, detail, and editor experience.
- Why the added complexity is worth it:
  - A small token-based stylesheet keeps the UI easy to adjust while still letting the product feel like a traditional bulletin board instead of an SDK demo.

## Adapter Boundary

- SDK-specific code lives under an adapter layer
- The adapter owns:
  - `IConnection` creation from environment config
  - SDK function calls
  - `HttpError` and validation failure normalization
  - Mapping SDK DTOs into normalized domain models
- The UI owns:
  - Route structure
  - View models and hooks
  - Form state
  - Presentational rendering

## Runtime Notes

- The screens consume normalized post and comment models rather than SDK DTOs directly
- The home screen defaults to the abridged list and exposes a two-button view toggle for preview versus compact board rows
- Search fields stay off the main screen until the user opens a modal from the toolbar, which keeps the first impression list-first
- Post detail now follows a single-column reading flow first, with saved versions and destructive actions tucked into foldouts
- Comment filtering is optional instead of always expanded, which keeps the detail screen focused on reading first
- Update actions are labeled as edits in the UI, while history remains visible through selectable saved versions
- Vite is configured to split React, data, markdown, and SDK code into separate chunks so the production bundle does not ship as one oversized file

## Implemented Route Map

- `/`: post list with search, sort, pagination, and a bottom write action
- `/articles/new`: post creation
- `/articles/:articleId`: post detail, selectable history, comments, and mutations

## Current Notes

- Keep post and comment rendering format-aware: text, markdown, sanitized HTML
- Default API host should be overridable by env but fall back to `http://127.0.0.1:37000`
- Use the wiki as a live project log and update it alongside structural changes
