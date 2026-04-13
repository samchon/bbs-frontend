import { useEffect, useState } from "react";
import { toAppError } from "../../adapter/errors";
import { AttachmentList } from "../../shared/components/AttachmentList";
import { ErrorNotice } from "../../shared/components/ErrorNotice";
import { RichContent } from "../../shared/components/RichContent";
import { formatDateTime } from "../../shared/utils";
import type { CommentDetail } from "../../domain/models";
import { CommentEditorForm } from "./CommentEditorForm";
import { useDeleteCommentMutation, useUpdateCommentMutation } from "./hooks";

export function SelectedCommentPanel({
  articleId,
  comment,
}: {
  articleId: string;
  comment: CommentDetail | null;
}) {
  const [deletePassword, setDeletePassword] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const updateCommentMutation = useUpdateCommentMutation(articleId, comment?.id ?? null);
  const deleteCommentMutation = useDeleteCommentMutation(articleId, comment?.id ?? null);

  useEffect(() => {
    if (!comment) {
      setSelectedSnapshotId(null);
      return;
    }

    const stillExists = comment.snapshots.some(
      (snapshot) => snapshot.id === selectedSnapshotId,
    );

    if (!stillExists) {
      setSelectedSnapshotId(comment.latestSnapshot.id);
    }
  }, [comment, selectedSnapshotId]);

  if (!comment) {
    return null;
  }

  const selectedSnapshot =
    comment.snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ??
    comment.latestSnapshot;
  const isLatestSnapshot = comment.latestSnapshot.id === selectedSnapshot.id;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-header">
          <div>
            <h2>Selected comment</h2>
            <p>
              {comment.writer} |{" "}
              {isLatestSnapshot ? "latest version" : "older saved version"}
            </p>
          </div>
          <div className="pill-row">
            <span className="pill">{selectedSnapshot.format.toUpperCase()}</span>
            {!isLatestSnapshot ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setSelectedSnapshotId(comment.latestSnapshot.id)}
              >
                Show latest
              </button>
            ) : null}
          </div>
        </div>

        <RichContent format={selectedSnapshot.format} value={selectedSnapshot.body} />
        <AttachmentList attachments={selectedSnapshot.attachments} />
      </section>

      {comment.snapshots.length > 1 ? (
        <details className="foldout" open={!isLatestSnapshot}>
          <summary className="foldout__summary">
            <span>Comment history</span>
            <span className="muted">{comment.snapshots.length}</span>
          </summary>

          <div className="foldout__body">
            <ul className="history-list">
              {comment.snapshots.map((snapshot, index) => {
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
                      <span>{formatDateTime(snapshot.createdAt)}</span>
                      <small>
                        {snapshot.format.toUpperCase()} | {snapshot.attachments.length} linked
                        file
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

      <details className="foldout">
        <summary className="foldout__summary">
          <span>Edit comment</span>
        </summary>

        <div className="foldout__body">
          <CommentEditorForm
            key={comment.latestSnapshot.id}
            mode="update"
            initialValues={{
              format: comment.latestSnapshot.format,
              body: comment.latestSnapshot.body,
              password: "",
              attachments: comment.latestSnapshot.attachments.map((attachment) => ({
                name: attachment.name,
                extension: attachment.extension ?? "",
                url: attachment.url,
              })),
            }}
            submitLabel="Save changes"
            showHeader={false}
            busy={updateCommentMutation.isPending}
            error={
              updateCommentMutation.error
                ? toAppError(updateCommentMutation.error)
                : null
            }
            successMessage={
              updateCommentMutation.isSuccess
                ? "Your changes were saved as the newest version."
                : null
            }
            onSubmit={async (values) => {
              await updateCommentMutation.mutateAsync(values);
              setSelectedSnapshotId(null);
            }}
          />
        </div>
      </details>

      <details className="foldout foldout--danger">
        <summary className="foldout__summary">
          <span>Delete comment</span>
        </summary>

        <div className="foldout__body">
          {deleteCommentMutation.error ? (
            <ErrorNotice error={toAppError(deleteCommentMutation.error)} />
          ) : null}

          <p className="muted">
            Deletion is permanent and requires the comment password.
          </p>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="Enter the comment password"
            />
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="button button--danger"
              disabled={deleteCommentMutation.isPending || !deletePassword}
              onClick={async () => {
                await deleteCommentMutation.mutateAsync(deletePassword);
                setDeletePassword("");
              }}
            >
              {deleteCommentMutation.isPending ? "Deleting..." : "Delete comment"}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
