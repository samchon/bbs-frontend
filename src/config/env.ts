const DEFAULT_API_HOST = "http://127.0.0.1:37000";

const normalizeHost = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_API_HOST;
  }

  return trimmed.replace(/\/+$/, "");
};

export const appEnv = {
  apiHost: normalizeHost(
    process.env.NEXT_PUBLIC_BBS_API_HOST ?? process.env.VITE_BBS_API_HOST,
  ),
};
