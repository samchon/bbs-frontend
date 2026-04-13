# Screen Structure

## Home

- The first screen is a traditional post list
- The list is shown before any write action
- Supports:
  - switching between a preview list and a compact list from a two-button view toggle
  - keyword and fielded search through a modal opened from the list toolbar
  - sort selection
  - pagination
  - empty, loading, and error states
- The write entry point sits at the bottom of the list instead of living in a top tab
- The default home view uses the preview list backed by the abridged endpoint
- The compact list remains available for a denser board view without exposing SDK terms in the UI
- Active search conditions stay visible as a short summary above the table

## Post Detail

- Fetches article detail through `articles.at`
- Shows:
  - the latest saved version by default
  - body rendering by format
  - linked files
  - a selectable saved-version list inside a foldout so older versions stay available without dominating the page
  - edit and delete actions as secondary foldouts instead of always-open side panels

## Comments

- Lives underneath the post body
- Lists comments through `comments.index`
- Supports sort, pagination, and an optional filter panel
- Opens a focused comment detail section from the already loaded list data
- Shows the latest saved version by default and lets the reader open older saved versions
- Keeps comment update and delete flows behind foldouts so the read flow stays first
- Provides create, update, and delete flows
- Surfaces `parent_id` when present, but does not invent reply creation because the SDK does not expose it

## Residual Risks

- No automated UI or adapter tests are in place yet
- The SDK bundle is chunk-split for production, but the generated SDK still contributes a meaningful payload because it includes validation and simulation code
- Comment reply creation is intentionally absent because the SDK surface does not expose `parent_id` in create or update requests
