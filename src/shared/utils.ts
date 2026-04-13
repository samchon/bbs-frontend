export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

export const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const size = value / 1024 ** exponent;

  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const toLocalDateTimeInputValue = (value: string) => {
  const date = new Date(value);
  const pad = (part: number) => `${part}`.padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toIsoDateTime = (value: string) =>
  value ? new Date(value).toISOString() : undefined;

export const excerpt = (value: string, limit = 180) => {
  const flattened = value.replace(/\s+/g, " ").trim();

  if (flattened.length <= limit) {
    return flattened;
  }

  return `${flattened.slice(0, limit).trimEnd()}...`;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
