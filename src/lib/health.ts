import { getBackendHealthUrl, HEALTH_API_PATH } from "@/lib/const";
import { httpClient } from "@/lib/http-client";
import type { BackendHealthResult, HealthResponse } from "@/types/health";
import { HealthStatus, isHealthStatus } from "@/types/health";

export type {
  BackendHealthResult,
  HealthComponentsResponse,
  HealthResponse,
} from "@/types/health";
export { HealthStatus, isHealthStatus } from "@/types/health";

export class HealthFetchError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "HealthFetchError";
  }
}

export function isHealthUp(health: HealthResponse): boolean {
  return health.status === HealthStatus.UP;
}

export function isValidHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const components = candidate.components;

  return (
    isHealthStatus(candidate.status) &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.version === "string" &&
    !!components &&
    typeof components === "object" &&
    isHealthStatus((components as { database: unknown }).database)
  );
}

function parseHealthResponse(
  payload: unknown,
  httpStatus: number,
  invalidShapeMessage: string,
): BackendHealthResult {
  if (!isValidHealthResponse(payload)) {
    throw new HealthFetchError(invalidShapeMessage);
  }

  return {
    data: payload,
    httpStatus,
  };
}

function toHealthFetchError(message: string, error: unknown): HealthFetchError {
  if (error instanceof HealthFetchError) {
    return error;
  }

  return new HealthFetchError(message, error);
}

export const healthKeys = {
  all: ["health"] as const,
  status: () => [...healthKeys.all, "status"] as const,
};

export async function fetchBackendHealth(): Promise<BackendHealthResult> {
  try {
    const response = await httpClient.get(getBackendHealthUrl());

    return parseHealthResponse(
      response.data,
      response.status,
      "Backend health response has an invalid shape",
    );
  } catch (error) {
    throw toHealthFetchError("Backend health check request failed", error);
  }
}

export { HEALTH_API_PATH } from "@/lib/const";

export async function fetchHealthClient(): Promise<HealthResponse> {
  try {
    const response = await httpClient.get(HEALTH_API_PATH);

    return parseHealthResponse(
      response.data,
      response.status,
      "Health API response has an invalid shape",
    ).data;
  } catch (error) {
    throw toHealthFetchError("Health API request failed", error);
  }
}
