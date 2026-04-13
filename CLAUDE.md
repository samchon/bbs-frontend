# CLAUDE.md

## Goal
This project should produce a frontend that understands the SDK well.

Do not let raw SDK shapes take over the UI.

- Keep SDK-specific code in an adapter layer.
- Let the UI depend on normalized domain models and hooks.

## Stack
Use a fixed base unless the user explicitly wants something else.

- Use `TypeScript + Next.js + shadcn/ui` unless the user approves another stack.
- Use environment variables for the API host.
- Default API host: `http://127.0.0.1:37000`.
- Add libraries only when they solve a real problem.

## Start
Before designing screens, make the SDK surface clear.

- Scaffold the app.
- Install the SDK.
- Read `node_modules/@samchon/bbs-api/lib/**/*.d.ts` carefully.
- Read the comments too.
- Treat code, types, and comments as the source of truth.
- Map the main APIs, DTOs, and constraints before designing the UI.

## Design
The code structure should keep replacement cost low if the SDK changes later.

- Keep SDK code in a dedicated adapter layer.
- Do not spread SDK types across screens and components.
- Explain any non-default choice for routing, state, fetching, styling, forms, testing, or browser automation.

## Product
Read the SDK broadly.

Do not turn every endpoint into a feature. Prefer a clear product over full endpoint coverage.

- Do not force every API into the UI.
- Leave out APIs that are redundant, diagnostic, cluttering, or harmful to the main flow.
- Note intentional omissions in `wiki/`.
- Do not invent features the SDK does not support.
- Handle loading, empty, error, retry, and invalidation states.
- Finish the main user flows before adding secondary controls.

## Visual Style
The default direction is a simple prototype-first UI.

It is only a default. If the user gives a different direction, or if the existing product style is already clear, follow that instead.

- The UI must work well on mobile, tablet, and desktop.
- Start from real UI parts such as lists, tables, forms, detail views, dialogs, and pagination.
- Keep the layout readable and content-first.
- Avoid decorative choices that hurt clarity or usability.

## Workflow
Docs and helper commands should follow the code instead of drifting away from it.

- Keep `wiki/` aligned with the code.
- Update docs when architecture, package choices, user flows, or omissions change.
- If a useful project command does not exist yet, create it before relying on it.

## UI Review
UI work is not done when the code compiles.

It is done after the flow has been used and checked.

- Run the flow yourself.
- Prefer direct browser interaction.
- Install browser automation before falling back.
- Check the UI at mobile, tablet, and desktop sizes.
- Verify that controls cause observable changes.
- Verify that search, sort, pagination, page size, toggles, dialogs, and forms actually work when present.
- Do one final pass for layout and copy before calling the work done.
- Fall back to screenshots or raw API checks only when browser automation is not available.

## Done
Done means the product works, not just that files were written.

- The app starts.
- Core flows work.
- The UI is coherent.
- The docs match the code.
- If an SDK feature makes the product worse, simplify it or leave it out.
