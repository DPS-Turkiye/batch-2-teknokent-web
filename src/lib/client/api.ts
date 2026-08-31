import type { AxiosResponse } from "axios";

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export function requireSuccess<T>(response: AxiosResponse<T>): T {
  if (response.status >= 200 && response.status < 300) return response.data;
  const body = response.data as unknown;
  const message =
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message
      : `Request failed with HTTP ${response.status}.`;
  const code =
    body &&
    typeof body === "object" &&
    "code" in body &&
    typeof body.code === "string"
      ? body.code
      : undefined;
  throw new ClientApiError(message, response.status, code);
}
