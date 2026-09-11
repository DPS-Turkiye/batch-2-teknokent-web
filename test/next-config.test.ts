import { describe, expect, it } from "vitest";

import nextConfig, {
  buildContentSecurityPolicy,
  securityHeaders,
} from "../next.config";

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

  it("lets the browser reach the local backend during development", () => {
    const policy = buildContentSecurityPolicy(true);

    expect(policy).toContain(
      "connect-src 'self' https: wss: http://localhost:8080 http://127.0.0.1:8080",
    );
  });

  it("allows eval only in development, for hot reload", () => {
    expect(buildContentSecurityPolicy(true)).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    );
    expect(buildContentSecurityPolicy(false)).not.toContain("unsafe-eval");
  });

  it("keeps plain-HTTP backend origins out of the deployed policy", () => {
    const policy = buildContentSecurityPolicy(false);

    expect(policy).toContain("connect-src 'self' https: wss:;");
    expect(policy).not.toContain("localhost");
    expect(policy).not.toContain("127.0.0.1");
  });
});
