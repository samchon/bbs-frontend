import type { PaginationMeta } from "../../domain/models";

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const canGoBack = pagination.current > 1;
  const canGoForward = pagination.current < Math.max(pagination.pages, 1);

  return (
    <div className="pagination-controls">
      <div>
        Page <strong>{pagination.current}</strong> of{" "}
        <strong>{Math.max(pagination.pages, 1)}</strong>
      </div>
      <div className="pagination-controls__actions">
        <button
          type="button"
          className="button button--ghost"
          disabled={!canGoBack}
          onClick={() => onPageChange(pagination.current - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="button button--ghost"
          disabled={!canGoForward}
          onClick={() => onPageChange(pagination.current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
