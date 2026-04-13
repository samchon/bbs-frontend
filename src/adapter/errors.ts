import { HttpError } from "@samchon/bbs-api";
import type { AppError } from "../domain/models";
import { isRecord } from "../shared/utils";

interface Diagnosis {
  accessor: string;
  message: string;
}

const isDiagnosis = (value: unknown): value is Diagnosis =>
  isRecord(value) &&
  typeof value.accessor === "string" &&
  typeof value.message === "string";

const isAppError = (value: unknown): value is AppError =>
  isRecord(value) &&
  typeof value.title === "string" &&
  typeof value.message === "string" &&
  Array.isArray(value.details);

export const normalizeError = (error: unknown): AppError => {
  if (error instanceof HttpError) {
    const payload = error.toJSON<unknown>();
    const details: string[] = [];
    let message = "The server rejected the request.";

    if (typeof payload.message === "string") {
      message = payload.message;
    } else if (Array.isArray(payload.message) && payload.message.every(isDiagnosis)) {
      message = "Request validation failed.";
      details.push(
        ...payload.message.map(
          (entry) => `${entry.accessor || "request"}: ${entry.message}`,
        ),
      );
    } else if (
      isRecord(payload.message) &&
      typeof payload.message.message === "string"
    ) {
      message = payload.message.message;
    } else if (payload.message !== undefined) {
      message = JSON.stringify(payload.message, null, 2);
    }

    return {
      title: `HTTP ${error.status}`,
      message,
      details,
      status: error.status,
      path: error.path,
    };
  }

  if (error instanceof Error) {
    return {
      title: error.name || "Unexpected error",
      message: error.message,
      details: [],
    };
  }

  return {
    title: "Unexpected error",
    message: "An unknown error was thrown.",
    details: [],
  };
};

export const toAppError = (error: unknown): AppError =>
  isAppError(error) ? error : normalizeError(error);
