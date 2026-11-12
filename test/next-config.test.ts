import { describe, expect, it } from "vitest";

import nextConfig, {
  buildContentSecurityPolicy,
  legacyRedirects,
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
      "frame-src 'self' blob:",
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
  });

  it("lets the browser reach the local backend during development", () => {
    const policy = buildContentSecurityPolicy(true);

    expect(policy).toContain(
      "connect-src 'self' https: wss: http://localhost:8080 http://127.0.0.1:8080 ws://localhost:8080 ws://127.0.0.1:8080",
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

  // The Akran Mentoru training embeds YouTube's privacy-enhanced player and loads its IFrame API.
  it("lets the training's YouTube player in, and nothing else of YouTube's", () => {
    const policy = buildContentSecurityPolicy(false);
    const directive = (name: string) =>
      policy.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";
    expect(directive("frame-src")).toContain(
      "https://www.youtube-nocookie.com",
    );
    expect(directive("frame-src")).not.toContain("https://www.youtube.com");
    expect(directive("script-src")).toContain("https://www.youtube.com");
  });
});

describe("legacy redirects", () => {
  it("sends the old academician pages to the screens that replaced them", async () => {
    expect(await nextConfig.redirects?.()).toEqual(legacyRedirects);
    expect(
      legacyRedirects.map(({ source, destination, permanent }) => [
        source,
        destination,
        permanent,
      ]),
    ).toEqual([
      [
        "/academician/requests",
        "/academician/appointments?filter=requests",
        false,
      ],
      [
        "/academician/calendar",
        "/academician/appointments/availability",
        false,
      ],
    ]);
  });
});
