"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useArticlesQuery } from "./hooks";
import { toAppError } from "../../adapter/errors";
import {
  defaultArticleBrowseState,
  emptyArticleSearchState,
  type ArticleListItem,
  type ArticleSearchState,
} from "../../domain/models";
import { ErrorNotice } from "../../shared/components/ErrorNotice";
import { Notice } from "../../shared/components/Notice";
import { PaginationControls } from "../../shared/components/PaginationControls";
import {
  excerpt,
  formatDateTime,
  toIsoDateTime,
  toLocalDateTimeInputValue,
} from "../../shared/utils";

const articleSortOptions = [
  { value: "updated_desc", label: "Latest activity" },
  { value: "updated_asc", label: "Oldest activity" },
  { value: "created_desc", label: "Newest posts" },
  { value: "created_asc", label: "Oldest posts" },
  { value: "writer_asc", label: "Writer A-Z" },
  { value: "writer_desc", label: "Writer Z-A" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
] as const;

type BrowseState = ReturnType<typeof defaultArticleBrowseState>;

export function ArticleExplorerPage() {
  const [browseState, setBrowseState] = useState(() => defaultArticleBrowseState());
  const [draftSearch, setDraftSearch] = useState<ArticleSearchState>(
    () => defaultArticleBrowseState().search,
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const articlesQuery = useArticlesQuery(browseState);

  const updateBrowseState = (updater: (previous: BrowseState) => BrowseState) => {
    setBrowseState(updater);
  };

  const setViewMode = (mode: BrowseState["mode"]) => {
    updateBrowseState((previous) => ({
      ...previous,
      mode,
      page: 1,
    }));
  };

  const activeSearchEntries = describeSearchState(browseState.search);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen]);

  const openSearch = () => {
    setDraftSearch({
      ...browseState.search,
      from: browseState.search.from
        ? toLocalDateTimeInputValue(browseState.search.from)
        : "",
      to: browseState.search.to
        ? toLocalDateTimeInputValue(browseState.search.to)
        : "",
    });
    setIsSearchOpen(true);
  };

  const clearSearch = () => {
    const cleared = emptyArticleSearchState();
    setDraftSearch(cleared);
    updateBrowseState((previous) => ({
      ...previous,
      page: 1,
      search: cleared,
    }));
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-header">
          <div>
            <h2>Posts</h2>
          </div>
          {articlesQuery.data ? (
            <span className="muted">{articlesQuery.data.pagination.records} posts</span>
          ) : null}
        </div>

        <div className="board-toolbar">
          <div className="view-toggle" role="group" aria-label="Post list view">
            <button
              type="button"
              className={
                browseState.mode === "abridge"
                  ? "view-toggle__button view-toggle__button--active"
                  : "view-toggle__button"
              }
              aria-pressed={browseState.mode === "abridge"}
              onClick={() => setViewMode("abridge")}
              title="Preview list"
            >
              <PreviewIcon />
              <span>Preview</span>
            </button>

            <button
              type="button"
              className={
                browseState.mode === "summary"
                  ? "view-toggle__button view-toggle__button--active"
                  : "view-toggle__button"
              }
              aria-pressed={browseState.mode === "summary"}
              onClick={() => setViewMode("summary")}
              title="Compact list"
            >
              <CompactIcon />
              <span>Compact</span>
            </button>
          </div>

          <label className="toolbar-field">
            <span className="toolbar-label">Sort</span>
            <select
              value={browseState.sort}
              onChange={(event) =>
                updateBrowseState((previous) => ({
                  ...previous,
                  page: 1,
                  sort: event.target.value as typeof previous.sort,
                }))
              }
            >
              {articleSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="toolbar-field">
            <span className="toolbar-label">Page size</span>
            <select
              value={browseState.limit}
              onChange={(event) =>
                updateBrowseState((previous) => ({
                  ...previous,
                  page: 1,
                  limit: Number(event.target.value),
                }))
              }
            >
              {[5, 10, 20, 50].map((limit) => (
                <option key={limit} value={limit}>
                  {limit} per page
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="toolbar-search" onClick={openSearch}>
            <SearchIcon />
            <span>
              Search
              {activeSearchEntries.length ? ` (${activeSearchEntries.length})` : ""}
            </span>
          </button>
        </div>

        {activeSearchEntries.length ? (
          <div className="filter-summary">
            <span className="muted">Search applied:</span>
            {activeSearchEntries.map((entry) => (
              <span key={entry} className="pill pill--subtle">
                {entry}
              </span>
            ))}
            <button type="button" className="button button--ghost" onClick={clearSearch}>
              Clear search
            </button>
          </div>
        ) : null}

        {articlesQuery.isFetching ? (
          <p className="muted">Refreshing list...</p>
        ) : null}

        {articlesQuery.isLoading ? (
          <Notice title="Loading posts">
            <p>The board is loading the current page.</p>
          </Notice>
        ) : null}

        {articlesQuery.isError ? (
          <ErrorNotice error={toAppError(articlesQuery.error)} />
        ) : null}

        {articlesQuery.data && articlesQuery.data.items.length === 0 ? (
          <Notice title="No posts matched" tone="warning">
            <p>Try a different search or clear the filters.</p>
          </Notice>
        ) : null}

        {articlesQuery.data ? (
          <>
            <div className="board-table-wrap">
              <table
                className={
                  browseState.mode === "summary"
                    ? "board-table board-table--compact"
                    : "board-table board-table--preview"
                }
              >
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Title</th>
                    <th scope="col">Writer</th>
                    <th scope="col">Created</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesQuery.data.items.map((item, index) => (
                    <ArticleRow
                      key={item.id}
                      item={item}
                      number={(browseState.page - 1) * browseState.limit + index + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              pagination={articlesQuery.data.pagination}
              onPageChange={(page) =>
                updateBrowseState((previous) => ({
                  ...previous,
                  page,
                }))
              }
            />
          </>
        ) : null}

        <div className="board-actions">
          <p className="muted">Want to add something new to the board?</p>
          <Link href="/articles/new" className="button">
            Write a post
          </Link>
        </div>
      </section>

      {isSearchOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => setIsSearchOpen(false)}
          role="presentation"
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-search-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="section-header modal-header">
              <div>
                <h2 id="post-search-title">Search posts</h2>
                <p>Filter the board by writer, title, body, or date.</p>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setIsSearchOpen(false)}
              >
                Close
              </button>
            </div>

            <form
              className="filter-grid"
              onSubmit={(event) => {
                event.preventDefault();
                updateBrowseState((previous) => ({
                  ...previous,
                  page: 1,
                  search: {
                    ...draftSearch,
                    from: toIsoDateTime(draftSearch.from) ?? "",
                    to: toIsoDateTime(draftSearch.to) ?? "",
                  },
                }));
                setIsSearchOpen(false);
              }}
            >
              <label>
                <span>Writer</span>
                <input
                  value={draftSearch.writer}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      writer: event.target.value,
                    }))
                  }
                  placeholder="Search by writer"
                />
              </label>

              <label>
                <span>Title</span>
                <input
                  value={draftSearch.title}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Search by title"
                />
              </label>

              <label>
                <span>Body</span>
                <input
                  value={draftSearch.body}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      body: event.target.value,
                    }))
                  }
                  placeholder="Search body text"
                />
              </label>

              <label className="filter-grid__wide">
                <span>Title or body</span>
                <input
                  value={draftSearch.titleOrBody}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      titleOrBody: event.target.value,
                    }))
                  }
                  placeholder="Search both title and body"
                />
              </label>

              <label>
                <span>From</span>
                <input
                  type="datetime-local"
                  value={draftSearch.from}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      from: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>To</span>
                <input
                  type="datetime-local"
                  value={draftSearch.to}
                  onChange={(event) =>
                    setDraftSearch((previous) => ({
                      ...previous,
                      to: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="filter-grid__actions">
                <button type="submit" className="button">
                  Apply search
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    clearSearch();
                    setIsSearchOpen(false);
                  }}
                >
                  Clear search
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ArticleRow({
  item,
  number,
}: {
  item: ArticleListItem;
  number: number;
}) {
  return (
    <tr>
      <td className="board-table__number">{number}</td>
      <td className="board-table__title">
        <div className="board-table__title-block">
          <Link href={`/articles/${item.id}`} className="board-table__link">
            {item.title}
          </Link>
          <div className="board-table__mobile-meta">
            <span>{item.writer}</span>
            <span>Created {formatDateTime(item.createdAt)}</span>
            <span>Updated {formatDateTime(item.updatedAt)}</span>
          </div>
          {item.kind === "abridge" ? (
            <>
              <p className="board-table__excerpt">{excerpt(item.body, 180)}</p>
              {item.attachments.length ? (
                <p className="muted">
                  {item.attachments.length} linked file
                  {item.attachments.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </td>
      <td>{item.writer}</td>
      <td>{formatDateTime(item.createdAt)}</td>
      <td>{formatDateTime(item.updatedAt)}</td>
    </tr>
  );
}

function describeSearchState(search: ArticleSearchState) {
  const entries: string[] = [];

  if (search.writer) {
    entries.push(`Writer: ${search.writer}`);
  }
  if (search.title) {
    entries.push(`Title: ${search.title}`);
  }
  if (search.body) {
    entries.push(`Body: ${search.body}`);
  }
  if (search.titleOrBody) {
    entries.push(`Title or body: ${search.titleOrBody}`);
  }
  if (search.from) {
    entries.push(`From: ${formatDateTime(search.from)}`);
  }
  if (search.to) {
    entries.push(`To: ${formatDateTime(search.to)}`);
  }

  return entries;
}

function PreviewIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="view-toggle__icon"
    >
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M5 7h10M5 10h6M5 13h8" />
    </svg>
  );
}

function CompactIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="view-toggle__icon"
    >
      <path d="M3 5h14M3 8h14M3 11h14M3 14h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="view-toggle__icon"
    >
      <circle cx="8.5" cy="8.5" r="4.5" />
      <path d="M12 12l4 4" />
    </svg>
  );
}
