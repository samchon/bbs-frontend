import type { AppError } from "../../domain/models";
import { Notice } from "./Notice";

export function ErrorNotice({ error }: { error: AppError }) {
  return (
    <Notice title={error.title} tone="danger">
      <p>{error.message}</p>
      {error.status ? <p className="notice-detail">Status: {error.status}</p> : null}
      {error.path ? <p className="notice-detail">Path: {error.path}</p> : null}
      {error.details.map((detail) => (
        <p key={detail} className="notice-detail">
          {detail}
        </p>
      ))}
    </Notice>
  );
}
