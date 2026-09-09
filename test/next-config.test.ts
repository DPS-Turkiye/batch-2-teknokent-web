import { describe, expect, it } from "vitest";

import nextConfig, { securityHeaders } from "../next.config";

describe("browser security headers", () => {
  it("protects every route against framing, content sniffing, and unsafe embeds", async () => {
    const configured = await nextConfig.headers?.();
    const headers = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key, value]),
    );

    expect(configured?.[0]?.source).toBe("/:path*");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
  });
});
