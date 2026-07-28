export const DEFAULT_APP_URL = "http://localhost:3000";
export const DEFAULT_BACKEND_URL = "http://localhost:8080";

export const BACKEND_HEALTH_PATH = "/api/health";
export const HEALTH_API_PATH = "/api/health";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export const APP_URL = normalizeUrl(process.env.APP_URL ?? DEFAULT_APP_URL);
export const BACKEND_URL = normalizeUrl(
  process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL,
);

export function getBackendUrl(): string {
  return BACKEND_URL;
}

export function getBackendHealthUrl(): string {
  return `${BACKEND_URL}${BACKEND_HEALTH_PATH}`;
}
