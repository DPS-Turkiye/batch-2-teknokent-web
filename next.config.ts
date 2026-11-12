import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Uploads and CV parsing go from the browser straight to the backend, so its
// origin has to be reachable. Deployed it is HTTPS and already covered by the
// blanket source; locally it is plain HTTP on another port, which nothing in
// the policy allows. 8090 is the ODTÜ edition's backend when both editions run
// side by side (the backend's dev/editions).
const LOCAL_BACKEND_ORIGINS = [8080, 8090].flatMap((port) => [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  `ws://localhost:${port}`,
  `ws://127.0.0.1:${port}`,
]);

export function buildContentSecurityPolicy(isDevelopment: boolean) {
  // Development builds evaluate modules for hot reload.
  const scriptSrc = [
    "script-src 'self' 'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : "",
    "https://apis.google.com https://www.gstatic.com",
    // The Akran Mentoru training's YouTube player (IFrame Player API).
    "https://www.youtube.com",
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = [
    "connect-src 'self' https: wss:",
    ...(isDevelopment ? LOCAL_BACKEND_ORIGINS : []),
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    connectSrc,
    // blob: is the in-app document preview (PDF/office fetched same-origin).
    "frame-src 'self' blob: https://accounts.google.com https://*.firebaseapp.com https://view.officeapps.live.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
  ].join("; ");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(process.env.NODE_ENV === "development"),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
] as const;

const nextConfig: NextConfig = {
  headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
