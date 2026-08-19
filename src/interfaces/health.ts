export enum HealthStatus {
  UP = "UP",
  DOWN = "DOWN",
}

export interface HealthComponentsResponse {
  database: HealthStatus;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  components: HealthComponentsResponse;
}

export interface BackendHealthResult {
  data: HealthResponse;
  httpStatus: number;
}

export interface UseHealthStatusResult {
  health: HealthResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isUp: boolean;
  refetch: () => void;
}

const healthStatuses = new Set<string>(Object.values(HealthStatus));

export function isHealthStatus(value: unknown): value is HealthStatus {
  return typeof value === "string" && healthStatuses.has(value);
}
