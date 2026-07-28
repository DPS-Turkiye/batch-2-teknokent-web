import { describe, expect, it } from "vitest";

import { HealthStatus, type HealthResponse } from "@/interfaces/health";
import { healthyResponse, unhealthyResponse } from "@test/fixtures/health";

describe("health interfaces", () => {
  it("accepts typed health responses from fixtures", () => {
    const response: HealthResponse = healthyResponse;

    expect(response.version).toBe("local");
    expect(unhealthyResponse.status).toBe(HealthStatus.DOWN);
  });
});
