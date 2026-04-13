# API Mapping

## Source of Truth

The mapping below is derived from the installed SDK declaration files under `node_modules/@samchon/bbs-api/lib/**/*.d.ts`.

## Export Surface

- Top-level runtime exports: `functional`, `HttpError`, default namespace export
- Main domains:
  - `functional.bbs.articles`
  - `functional.bbs.articles.comments`
  - `functional.monitors.health`
  - `functional.monitors.performance`
  - `functional.monitors.system`

## Connection Shape

- The SDK expects an `IConnection` compatible object with at least `host`
- JSON endpoints add `Content-Type: application/json`
- The frontend should inject `host` through environment variables
- Default host: `http://127.0.0.1:37000`

## Article Endpoints

- `PATCH /bbs/articles`
  - SDK function: `functional.bbs.articles.index`
  - Purpose: paged article summaries
  - Supports: `page`, `limit`, `search`, `sort`
  - Search fields: `writer`, `title`, `body`, `title_or_body`, `from`, `to`
  - Sort columns: `writer`, `title`, `created_at`, `updated_at`
- `PATCH /bbs/articles/abridges`
  - SDK function: `functional.bbs.articles.abridges`
  - Purpose: paged article abridged cards with latest content and attachments
  - Supports: same request body as article index
- `GET /bbs/articles/:id`
  - SDK function: `functional.bbs.articles.at`
  - Purpose: article detail with snapshot history
- `POST /bbs/articles`
  - SDK function: `functional.bbs.articles.create`
  - Purpose: create article
- `PUT /bbs/articles/:id`
  - SDK function: `functional.bbs.articles.update`
  - Purpose: update the article by saving a new latest snapshot
- `DELETE /bbs/articles/:id`
  - SDK function: `functional.bbs.articles.erase`
  - Purpose: delete article with password confirmation

## Comment Endpoints

- `PATCH /bbs/articles/:articleId/comments`
  - SDK function: `functional.bbs.articles.comments.index`
  - Purpose: paged comments for one article
  - Supports: `page`, `limit`, `search`, `sort`
  - Search fields: `writer`, `body`
  - Sort columns: `writer`, `created_at`
- `GET /bbs/articles/:articleId/comments/:id`
  - SDK function: `functional.bbs.articles.comments.at`
  - Purpose: comment detail with snapshot history
- `POST /bbs/articles/:articleId/comments`
  - SDK function: `functional.bbs.articles.comments.create`
  - Purpose: create comment
- `PUT /bbs/articles/:articleId/comments/:id`
  - SDK function: `functional.bbs.articles.comments.update`
  - Purpose: update the comment by saving a new latest snapshot
- `DELETE /bbs/articles/:articleId/comments/:id`
  - SDK function: `functional.bbs.articles.comments.erase`
  - Purpose: delete comment with password confirmation

## Monitor Endpoints

- `GET /monitors/health`
  - SDK function: `functional.monitors.health.get`
  - Returns no payload on success
- `GET /monitors/performance`
  - SDK function: `functional.monitors.performance.get`
  - Returns CPU, memory, and resource usage
- `GET /monitors/system`
  - SDK function: `functional.monitors.system.get`
  - Returns process arguments, commit info, package info, and created time
- `GET /monitors/system/internal_server_error`
  - SDK function: `functional.monitors.system.internal_server_error`
  - Purpose: intentionally trigger a server fault
- `GET /monitors/system/uncaught_exception`
  - SDK function: `functional.monitors.system.uncaught_exception`
  - Purpose: intentionally trigger a crash path

## Domain DTO Constraints

### Articles

- Article entity fields: `id`, `writer`, `snapshots`, `created_at`
- Formats: `txt`, `md`, `html`
- `snapshots` always has at least one item
- Latest snapshot carries `format`, `title`, `body`, `files`
- `IAbridge` includes the latest content directly
- Create requires `writer`, `format`, `title`, `body`, `files`, `password`
- Update requires `format`, `title`, `body`, `files`, `password`

### Comments

- Comment entity fields: `id`, `parent_id`, `writer`, `snapshots`, `created_at`
- Formats: `txt`, `md`, `html`
- Create requires `writer`, `format`, `body`, `files`, `password`
- Update requires `format`, `body`, `files`, `password`
- The SDK does not expose `parent_id` on create or update, so the UI must not invent a reply composer

### Attachments

- Attachment payload is metadata only, not binary upload
- Fields: `name`, `extension`, `url`
- `url` must be a valid URI

## Product Implications

- Use both article list endpoints through the adapter, while presenting one board list in the UI
- Show snapshot history for both articles and comments
- Expose search, sort, and pagination controls for both resources
- Render `html` safely and render `md` through a markdown renderer
