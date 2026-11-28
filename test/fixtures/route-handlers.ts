import type { BackendResponse } from "@/lib/server/api-response";

/** What a backend call of one of this app's own routes answers. */
export function backendResponse<T>(data: T, status = 200): BackendResponse<T> {
  return { data, headers: {}, status };
}
