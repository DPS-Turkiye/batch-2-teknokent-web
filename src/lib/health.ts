import {
  HealthStatus,
  isHealthStatus,
  type BackendHealthResult,
  type HealthResponse,
} from "@/interfaces/health";
import { getBackendHealthUrl, HEALTH_API_PATH } from "@/lib/const";
import { httpClient } from "@/lib/http-client";

export type {
  BackendHealthResult,
  HealthComponentsResponse,
  HealthResponse,
} from "@/interfaces/health";
export { HealthStatus, isHealthStatus } from "@/interfaces/health";

export class HealthFetchError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
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
    Boolean(components) &&
    typeof components === "object" &&
    isHealthStatus((components as { database: unknown }).database) &&
    isHealthStatus((components as { redis: unknown }).redis)
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
    const response = await httpClient.get(getBackendHealthUrl(), {
      validateStatus: () => true,
    });

    return parseHealthResponse(
      response.data,
      response.status,
      "Sunucu sağlık yanıtı beklenen biçimde değil.",
    );
  } catch (error) {
    throw toHealthFetchError("Sunucu sağlık kontrolü başarısız oldu.", error);
  }
}

export { HEALTH_API_PATH } from "@/lib/const";

export async function fetchHealthClient(): Promise<HealthResponse> {
  try {
    const response = await httpClient.get(HEALTH_API_PATH, {
      validateStatus: () => true,
    });

    return parseHealthResponse(
      response.data,
      response.status,
      "Sağlık hizmeti yanıtı beklenen biçimde değil.",
    ).data;
  } catch (error) {
    throw toHealthFetchError("Sağlık hizmeti isteği başarısız oldu.", error);
  }
}
