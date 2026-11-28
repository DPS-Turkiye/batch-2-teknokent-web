import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { ACADEMICIAN_ROUTES } from "./src/lib/academician-routes";
import { AppointmentsFilter } from "./src/types/academician-calendar";

// Locally the backend is plain HTTP on another port. 8090 is the ODTÜ edition's backend when both editions run
// side by side (the backend's dev/editions).
const LOCAL_BACKEND_ORIGINS = [8080, 8090].flatMap((port) => [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  `ws://localhost:${port}`,
  `ws://127.0.0.1:${port}`,
]);

// What the Firebase SDK calls from the page: sign-in and token refresh (Identity Toolkit, Secure Token), and for
// push notifications the installation and FCM registration APIs. www.googleapis.com is also the Calendar API that
// lib/google-calendar reads with the person's own OAuth token (the OAuth consent itself is a popup, not a fetch).
const GOOGLE_API_ORIGINS = [
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://firebaseinstallations.googleapis.com",
  "https://fcmregistrations.googleapis.com",
  "https://www.googleapis.com",
];

// Presigned S3 URLs from the backend (document previews, the assistant's transcript and report uploads and reads).
// The AWS SDK presigns virtual-hosted style, https://<bucket>.s3.eu-central-1.amazonaws.com/...
const OBJECT_STORAGE_ORIGINS = ["https://*.s3.eu-central-1.amazonaws.com"];

/** The build's environment, of which the NEXT_PUBLIC_ backend, realtime and Firebase auth-domain settings are read. */
type PolicyEnv = Readonly<Record<string, string | undefined>>;

function originOf(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const { origin } = new URL(url.trim());
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

/**
 * The origins the browser may call: the backend over HTTPS and its WebSocket (/ws) twin, the realtime URL when it
 * is set apart, and Firebase's auth domain. A deployed policy takes only secure origins, so a build left pointing
 * at a local backend stays closed rather than opening plain HTTP.
 */
function backendOrigins(env: PolicyEnv, isDevelopment: boolean): string[] {
  const backend = originOf(env.NEXT_PUBLIC_BACKEND_URL);
  const socketTwin = backend?.replace(/^http/, "ws") ?? null;
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const origins = [
    backend,
    socketTwin,
    originOf(env.NEXT_PUBLIC_REALTIME_URL),
    authDomain ? originOf(`https://${authDomain}`) : null,
  ].filter((origin): origin is string => origin !== null);
  return isDevelopment
    ? origins
    : origins.filter((origin) => /^(https|wss):\/\//.test(origin));
}

export function buildContentSecurityPolicy(
  isDevelopment: boolean,
  env: PolicyEnv = process.env,
) {
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
    "connect-src 'self'",
    ...new Set([
      ...backendOrigins(env, isDevelopment),
      ...GOOGLE_API_ORIGINS,
      ...OBJECT_STORAGE_ORIGINS,
      ...(isDevelopment ? LOCAL_BACKEND_ORIGINS : []),
    ]),
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

// Pages whose screens moved elsewhere; an old link or bookmark lands on the new home. Not permanent, so browsers
// don't cache the hop and a path can be given a page again later.
export const legacyRedirects = [
  // Talepler moved into Randevularım, with requests selected.
  {
    source: "/academician/requests",
    destination: `${ACADEMICIAN_ROUTES.appointments}?filter=${AppointmentsFilter.Requests}`,
    permanent: false,
  },
  // Takvim became "Müsaitliği düzenle" under Randevularım.
  {
    source: "/academician/calendar",
    destination: ACADEMICIAN_ROUTES.availability,
    permanent: false,
  },
];

const nextConfig: NextConfig = {
  headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  redirects() {
    return legacyRedirects;
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
