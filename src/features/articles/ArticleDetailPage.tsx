"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toAppError } from "../../adapter/errors";
import { AttachmentList } from "../../shared/components/AttachmentList";
import { ErrorNotice } from "../../shared/components/ErrorNotice";
import { Notice } from "../../shared/components/Notice";
import { PaginationControls } from "../../shared/components/PaginationControls";
import { RichContent } from "../../shared/components/RichContent";
import { formatDateTime } from "../../shared/utils";
import { ArticleEditorForm } from "./ArticleEditorForm";
import { CommentEditorForm } from "./CommentEditorForm";
import {
  useArticleDetailQuery,
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteArticleMutation,
  useUpdateArticleMutation,
} from "./hooks";
import { SelectedCommentPanel } from "./SelectedCommentPanel";
import {
  defaultCommentBrowseState,
  defaultCommentEditorValues,
  type CommentDetail,
  type CommentSearchState,
} from "../../domain/models";

const commentSortOptions = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "writer_asc", label: "Writer A-Z" },
  { value: "writer_desc", label: "Writer Z-A" },
] as const;

export function ArticleDetailPage({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [deletePassword, setDeletePassword] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [commentBrowseState, setCommentBrowseState] = useState(() =>
    defaultCommentBrowseState(),
  );
  const [commentDraftSearch, setCommentDraftSearch] = useState<CommentSearchState>(
    () => defaultCommentBrowseState().search,
  );
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [newCommentVersion, setNewCommentVersion] = useState(0);
  const [isCommentFilterOpen, setIsCommentFilterOpen] = useState(false);
  const [isCommentFilterTransitionPending, startCommentFilterTransition] =
    useTransition();

  if (!articleId) {
    return (
      <Notice title="Missing post id" tone="danger">
        <p>The route did not include a post identifier.</p>
      </Notice>
    );
  }

  const articleQuery = useArticleDetailQuery(articleId);
  const commentsQuery = useCommentsQuery(articleId, commentBrowseState);
  const createCommentMutation = useCreateCommentMutation(articleId);
  const updateArticleMutation = useUpdateArticleMutation(articleId);
  const deleteArticleMutation = useDeleteArticleMutation(articleId);

  useEffect(() => {
    if (!articleQuery.data) {
      setSelectedSnapshotId(null);
      return;
    }

    const stillExists = articleQuery.data.snapshots.some(
      (snapshot) => snapshot.id === selectedSnapshotId,
    );

    if (!stillExists) {
      setSelectedSnapshotId(articleQuery.data.latestSnapshot.id);
    }
  }, [articleQuery.data, selectedSnapshotId]);

  useEffect(() => {
    if (!commentsQuery.data?.items.length) {
      setSelectedCommentId(null);
      return;
    }

    const stillExists = commentsQuery.data.items.some(
      (comment) => comment.id === selectedCommentId,
    );

    if (!stillExists) {
      setSelectedCommentId(commentsQuery.data.items[0].id);
    }
  }, [commentsQuery.data, selectedCommentId]);

  const selectedSnapshot =
    articleQuery.data?.snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ??
    articleQuery.data?.latestSnapshot ??
    null;
  const isLatestSnapshot =
    articleQuery.data && selectedSnapshot
      ? articleQuery.data.latestSnapshot.id === selectedSnapshot.id
      : false;
  const activeCommentFilters = describeCommentSearchState(commentBrowseState.search);
  const selectedComment =
    commentsQuery.data?.items.find((comment) => comment.id === selectedCommentId) ?? null;

  return (
    <div className="page-stack">
      <section className="panel page-intro">
        <div>
          <Link href="/" className="back-link">
            Back to posts
          </Link>
          <h2>{articleQuery.data?.latestSnapshot.title ?? "Loading post..."}</h2>

          {articleQuery.data ? (
            <>
              <p className="detail-meta-line">
                <span>Writer {articleQuery.data.writer}</span>
                <span>Posted {formatDateTime(articleQuery.data.createdAt)}</span>
                <span>
                  Updated {formatDateTime(articleQuery.data.latestSnapshot.createdAt)}
                </span>
                <span>{articleQuery.data.snapshots.length} versions</span>
              </p>
              <p className="lead">
                The latest saved version is shown first. Open saved versions only when
                you need an older one.
              </p>
            </>
          ) : (
            <p className="lead">Loading the latest saved version of this post.</p>
          )}
        </div>
      </section>

      {articleQuery.isLoading ? (
        <Notice title="Loading post">
          <p>The post is loading.</p>
        </Notice>
      ) : null}

      {articleQuery.isError ? (
        <ErrorNotice error={toAppError(articleQuery.error)} />
      ) : null}

      {articleQuery.data && selectedSnapshot ? (
        <>
          <section className="panel">
            <div className="section-header">
              <div>
                <p>
                  {isLatestSnapshot
                    ? "Showing the latest saved version."
                    : `Showing a saved version from ${formatDateTime(
                        selectedSnapshot.createdAt,
                      )}.`}
                </p>
              </div>
              <div className="pill-row">
                <span className="pill">{selectedSnapshot.format.toUpperCase()}</span>
                {!isLatestSnapshot ? (
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setSelectedSnapshotId(articleQuery.data.latestSnapshot.id)}
                  >
                    Show latest
                  </button>
                ) : null}
              </div>
            </div>

            <RichContent format={selectedSnapshot.format} value={selectedSnapshot.body} />
            <AttachmentList attachments={selectedSnapshot.attachments} />

            {articleQuery.data.snapshots.length > 1 ? (
              <details className="foldout" open={!isLatestSnapshot}>
                <summary className="foldout__summary">
                  <span>Saved versions</span>
                  <span className="muted">{articleQuery.data.snapshots.length}</span>
                </summary>

                <div className="foldout__body">
                  <ul className="history-list">
                    {articleQuery.data.snapshots.map((snapshot, index) => {
                      const active = snapshot.id === selectedSnapshot.id;

                      return (
                        <li key={snapshot.id}>
                          <button
                            type="button"
                            className={
                              active
                                ? "history-button history-button--active"
                                : "history-button"
                            }
                            onClick={() => setSelectedSnapshotId(snapshot.id)}
                          >
                            <strong>
                              {index === 0 ? "Latest version" : "Earlier version"}
                            </strong>
                            <span>{snapshot.title}</span>
                            <small>
                              {formatDateTime(snapshot.createdAt)} |{" "}
                              {snapshot.format.toUpperCase()} |{" "}
                              {snapshot.attachments.length} linked file
                              {snapshot.attachments.length === 1 ? "" : "s"}
                            </small>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>
            ) : null}
          </section>

          <section className="panel">
            <div className="section-header">
              <div>
                <h2>Comments</h2>
                <p>Select one to read it in full, then edit it if needed.</p>
              </div>
              {commentsQuery.data ? (
                <span className="muted">
                  {commentsQuery.data.pagination.records} comments
                </span>
              ) : null}
            </div>

            <div className="board-toolbar">
              <label className="toolbar-field">
                <span className="toolbar-label">Sort</span>
                <select
                  value={commentBrowseState.sort}
                  onChange={(event) =>
                    startCommentFilterTransition(() => {
                      setCommentBrowseState((previous) => ({
                        ...previous,
                        page: 1,
                        sort: event.target.value as typeof previous.sort,
                      }));
                    })
                  }
                >
                  {commentSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="toolbar-field">
                <span className="toolbar-label">Page size</span>
                <select
                  value={commentBrowseState.limit}
                  onChange={(event) =>
                    startCommentFilterTransition(() => {
                      setCommentBrowseState((previous) => ({
                        ...previous,
                        page: 1,
                        limit: Number(event.target.value),
                      }));
                    })
                  }
                >
                  {[5, 10, 20].map((limit) => (
                    <option key={limit} value={limit}>
                      {limit} per page
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="toolbar-search"
                onClick={() => {
                  setCommentDraftSearch({ ...commentBrowseState.search });
                  setIsCommentFilterOpen((current) => !current);
                }}
              >
                <SearchIcon />
                <span>Filter{activeCommentFilters.length ? ` (${activeCommentFilters.length})` : ""}</span>
              </button>
            </div>

            {activeCommentFilters.length ? (
              <div className="filter-summary">
                <span className="muted">Comment filter:</span>
                {activeCommentFilters.map((entry) => (
                  <span key={entry} className="pill pill--subtle">
                    {entry}
                  </span>
                ))}
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    const reset = defaultCommentBrowseState();
                    setCommentDraftSearch(reset.search);
                    startCommentFilterTransition(() => {
                      setCommentBrowseState(reset);
                    });
                  }}
                >
                  Clear filter
                </button>
              </div>
            ) : null}

            {isCommentFilterOpen ? (
              <form
                className="filter-grid filter-panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  startCommentFilterTransition(() => {
                    setCommentBrowseState((previous) => ({
                      ...previous,
                      page: 1,
                      search: { ...commentDraftSearch },
                    }));
                  });
                  setIsCommentFilterOpen(false);
                }}
              >
                <label>
                  <span>Writer</span>
                  <input
                    value={commentDraftSearch.writer}
                    onChange={(event) =>
                      setCommentDraftSearch((previous) => ({
                        ...previous,
                        writer: event.target.value,
                      }))
                    }
                    placeholder="Search by writer"
                  />
                </label>

                <label className="filter-grid__wide">
                  <span>Body</span>
                  <input
                    value={commentDraftSearch.body}
                    onChange={(event) =>
                      setCommentDraftSearch((previous) => ({
                        ...previous,
                        body: event.target.value,
                      }))
                    }
                    placeholder="Search within comment bodies"
                  />
                </label>

                <div className="filter-grid__actions">
                  <button type="submit" className="button">
                    Apply filter
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      const reset = defaultCommentBrowseState();
                      setCommentDraftSearch(reset.search);
                      startCommentFilterTransition(() => {
                        setCommentBrowseState(reset);
                      });
                      setIsCommentFilterOpen(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            ) : null}

            {isCommentFilterTransitionPending ? (
              <p className="muted">Refreshing comments...</p>
            ) : null}

            {commentsQuery.isLoading ? (
              <Notice title="Loading comments">
                <p>The comment list is loading.</p>
              </Notice>
            ) : null}

            {commentsQuery.isError ? (
              <ErrorNotice error={toAppError(commentsQuery.error)} />
            ) : null}

            {commentsQuery.data && commentsQuery.data.items.length === 0 ? (
              <Notice title="No comments yet" tone="warning">
                <p>
                  {activeCommentFilters.length
                    ? "No comments matched the current filter."
                    : "Be the first to leave a comment on this post."}
                </p>
              </Notice>
            ) : null}

            {commentsQuery.data ? (
              <>
                <div className="stack-list">
                  {commentsQuery.data.items.map((comment) => (
                    <CommentSummaryCard
                      key={comment.id}
                      comment={comment}
                      active={comment.id === selectedCommentId}
                      onSelect={() => setSelectedCommentId(comment.id)}
                    />
                  ))}
                </div>
                <PaginationControls
                  pagination={commentsQuery.data.pagination}
                  onPageChange={(page) =>
                    startCommentFilterTransition(() => {
                      setCommentBrowseState((previous) => ({
                        ...previous,
                        page,
                      }));
                    })
                  }
                />
              </>
            ) : null}
          </section>

          <SelectedCommentPanel articleId={articleId} comment={selectedComment} />


          <section className="panel">
            <CommentEditorForm
              key={`new-comment-${newCommentVersion}`}
              mode="create"
              initialValues={defaultCommentEditorValues()}
              submitLabel="Post comment"
              busy={createCommentMutation.isPending}
              error={
                createCommentMutation.error
                  ? toAppError(createCommentMutation.error)
                  : null
              }
              successMessage={
                createCommentMutation.isSuccess ? "Your comment was posted." : null
              }
              onSubmit={async (values) => {
                const comment = await createCommentMutation.mutateAsync(values);
                setNewCommentVersion((current) => current + 1);
                setSelectedCommentId(comment.id);
                startCommentFilterTransition(() => {
                  setCommentBrowseState((previous) => ({
                    ...previous,
                    page: 1,
                  }));
                });
              }}
            />
          </section>

          <details className="foldout">
            <summary className="foldout__summary">
              <span>Edit post</span>
            </summary>

            <div className="foldout__body">
              <ArticleEditorForm
                key={articleQuery.data.latestSnapshot.id}
                mode="update"
                initialValues={{
                  format: articleQuery.data.latestSnapshot.format,
                  title: articleQuery.data.latestSnapshot.title,
                  body: articleQuery.data.latestSnapshot.body,
                  password: "",
                  attachments: articleQuery.data.latestSnapshot.attachments.map(
                    (attachment) => ({
                      name: attachment.name,
                      extension: attachment.extension ?? "",
                      url: attachment.url,
                    }),
                  ),
                }}
                submitLabel="Save changes"
                showHeader={false}
                busy={updateArticleMutation.isPending}
                error={
                  updateArticleMutation.error
                    ? toAppError(updateArticleMutation.error)
                    : null
                }
                successMessage={
                  updateArticleMutation.isSuccess
                    ? "Your changes were saved as the newest version."
                    : null
                }
                onSubmit={async (values) => {
                  await updateArticleMutation.mutateAsync(values);
                  setSelectedSnapshotId(null);
                  await articleQuery.refetch();
                }}
              />
            </div>
          </details>

          <details className="foldout foldout--danger">
            <summary className="foldout__summary">
              <span>Delete post</span>
            </summary>

            <div className="foldout__body">
              {deleteArticleMutation.error ? (
                <ErrorNotice error={toAppError(deleteArticleMutation.error)} />
              ) : null}

              <p className="muted">
                Deleting the post removes every saved version and every comment.
              </p>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="Enter the post password"
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="button button--danger"
                  disabled={deleteArticleMutation.isPending || !deletePassword}
                  onClick={async () => {
                    await deleteArticleMutation.mutateAsync(deletePassword);
                    router.push("/");
                  }}
                >
                  {deleteArticleMutation.isPending ? "Deleting..." : "Delete post"}
                </button>
              </div>
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}

function CommentSummaryCard({
  comment,
  active,
  onSelect,
}: {
  comment: CommentDetail;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "comment-card comment-card--active" : "comment-card"}
      onClick={onSelect}
    >
      <div className="record-card__header">
        <div>
          <h3>{comment.writer}</h3>
        </div>
        {comment.parentId ? <span className="pill">Linked reply</span> : null}
      </div>

      <p className="muted">
        {comment.latestSnapshot.format.toUpperCase()} |{" "}
        {formatDateTime(comment.latestSnapshot.createdAt)}
      </p>
      <p>
        {comment.latestSnapshot.body.length > 120
          ? `${comment.latestSnapshot.body.slice(0, 120)}...`
          : comment.latestSnapshot.body}
      </p>
    </button>
  );
}

function describeCommentSearchState(search: CommentSearchState) {
  const entries: string[] = [];

  if (search.writer) {
    entries.push(`Writer: ${search.writer}`);
  }
  if (search.body) {
    entries.push(`Body: ${search.body}`);
  }

  return entries;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="view-toggle__icon">
      <circle cx="8.5" cy="8.5" r="4.5" />
      <path d="M12 12l4 4" />
    </svg>
  );
}
