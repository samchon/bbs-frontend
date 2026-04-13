# UI Review Workflow

## Purpose

This repository uses a browser-driven review loop so agents do not stop at code-level guesses when working on UI.

## When This Applies

`pnpm ui:review` assumes the repository has already been bootstrapped into a runnable frontend project.

If the repository is still empty or missing its app foundation:

1. scaffold the base app first
2. install project dependencies and review tooling
3. make the UI render
4. then run `pnpm ui:review`

In other words, `ui:review` is not the first command for a blank repository. It is the standard review command after the project can already build and open in a browser.

## Preferred Validation Order

1. Direct browser interaction through MCP or browser automation
2. Local scripted browser runs through Playwright
3. Screenshot review as evidence and final self-check

PNG files are not the goal by themselves. The goal is that the agent actually uses the rendered UI, then leaves screenshots and traces behind so the review is inspectable and repeatable.

## Install-First Rule

If Playwright MCP is not available yet, the agent should install or register it before giving up and falling back to screenshot-only review.

- Run `pnpm mcp:playwright:install`
- This script:
  - ensures Codex has a global `playwright` MCP server
  - ensures Claude Code has a project `playwright` MCP server
  - leaves repo-local Claude config in `.mcp.json`
- Do not stop to ask whether you are allowed to do this for normal local development work
- Treat this as default environment setup for any agent, including Codex and Claude Code
- Only fall back after the install step fails, and record the failure clearly

## Standard Command

- Run `pnpm ui:review`
- This command:
  - builds the app
  - starts a local static preview on a free `127.0.0.1` port
  - opens the rendered UI in Chromium through Playwright
  - captures screenshots into `.artifacts/ui-review/`
  - records a Playwright trace at `.artifacts/ui-review/ui-review-trace.zip`

## Current Capture Set

- `01-home-preview.png`
- `02-home-compact.png`
- `03-search-modal.png`
- `04-post-detail.png`
- `05-write-post.png`

## Using an Existing Dev Server

If a dev server is already running and you want to review that exact instance instead of the local preview:

- PowerShell:
  - `$env:UI_REVIEW_BASE_URL='http://127.0.0.1:3000'`
  - `node scripts/ui-review.mjs`

## Manual Inspection

- Open the screenshots directly and review spacing, copy, hierarchy, and whether controls cause visible state changes
- Open the trace with `pnpm ui:trace` when you need the interaction timeline, DOM snapshots, or action-by-action playback

## MCP Option

If the coding agent supports MCP browser tools, prefer attaching the official Playwright MCP server and letting the agent drive the page directly.

Standard config:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

That path is better than screenshot-only review because the agent can inspect the live page structure, click controls, fill inputs, and validate behavior in the same loop.

## Agent Expectations

- Codex should inspect the generated screenshots before calling UI work done
- Claude Code should inspect the same screenshots or an equivalent live preview before calling UI work done
- Layout polish, redundant headings, and ineffective controls are part of the same task, not optional follow-up
