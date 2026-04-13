# CLAUDE.md

## Goal
Build a production-ready frontend application that fully understands and exploits the installed SDK.

Design the app so it does not become tightly coupled to one specific SDK. If the SDK changes later, most of the replacement cost should stay in the adapter layer rather than spilling across the UI.

## Starting Principles
Before doing anything else, read the SDK's real exports and `d.ts` files end to end, then map its APIs, DTOs, and constraints. For this task, you must specifically read `node_modules/@samchon/bbs-api/lib/**/*.d.ts` first. Treat code and type declarations as the source of truth over README-style prose.

Do not hardcode the server host directly into the app. Inject it through environment variables. Use `http://localhost:37000` as the default host unless the task explicitly provides another one.

## Design Principles
Keep SDK-specific code inside a dedicated adapter layer. The UI and screen layer should work with normalized domain models and hooks instead of talking to SDK types everywhere.

Do not leak SDK types across the entire app. Keep the replacement boundary narrow and deliberate. For important technical choices such as framework, routing, state management, data fetching, styling, and form handling, make the reasoning explicit:

- what problem it solves
- why the platform default is not enough
- why the added complexity is worth it

## Stack Choice
Do not treat any framework or library as mandatory. Choose based on the SDK shape, rendering strategy, app complexity, and maintenance cost.

If you need a default starting point, begin with `TypeScript + Next.js + shadcn/ui`. This is still a default, not a hard rule.

You may install packages freely with `pnpm`, but do not add them out of habit. Every addition should have a clear problem statement and a clear reason.

## Working Method
Use the `wiki/` folder as living documentation throughout the project. It is not an after-the-fact report. It is a working tool that should be continuously added to, revised, deleted, and edited while implementation is in progress.

Keep `wiki/` updated with API mappings, screen structure, data models, architecture decisions, open questions, and remaining work. When package choices, structure, or user flows change, update the wiki in the same stretch of work. Do not leave stale assumptions or outdated documents behind.

## Implementation Principles
Use every meaningful read and write capability the SDK exposes in real user flows. Do not leave unused endpoints, decorative integrations, or dead screens in the product.

If the SDK supports them, turn list, detail, create, update, delete, search, sort, pagination, attachments, history, diagnostics, and status views into real product features.

Do not invent capabilities that are not grounded in the SDK surface. Authentication, authorization, uploads, nested resources, extra fields, and custom workflows should only appear when the SDK actually supports them.

If the app needs to render HTML or remote content, handle it safely. Put destructive or failure-inducing operations behind dedicated diagnostic surfaces and explicit confirmation. Do not stop at the happy path; finish loading, empty, error, retry, and cache invalidation behavior as well.

## Done Criteria
The app should be explorable immediately after it starts, and the core user flows should actually work.

In the final explanation, focus more on why choices were made than on listing tools. The `wiki/` folder should stay aligned with the current codebase so that a newly joined teammate can understand the structure and reasoning without guessing.
