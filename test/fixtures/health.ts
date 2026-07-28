import { HealthStatus, type HealthResponse } from "@/interfaces/health";

export const healthyResponse: HealthResponse = {
  status: HealthStatus.UP,
  timestamp: "2026-01-01T00:00:00Z",
  version: "local",
  components: {
    database: HealthStatus.UP,
  },
};

export const unhealthyResponse: HealthResponse = {
  status: HealthStatus.DOWN,
  timestamp: "2026-01-01T00:00:01Z",
  version: "local",
  components: {
    database: HealthStatus.DOWN,
  },
};

export function createAxiosResponse<T>(
  data: T,
  status: number,
): import("axios").AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    headers: {},
    config: {} as import("axios").AxiosResponse<T>["config"],
  };
}
