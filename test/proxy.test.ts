import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
import { proxy } from "@/proxy";

// The browser's hint (lib/session-hint), all the proxy can see of a sign-in.
const signedIn = `menton_signed_in=${UserRole.Mentee}`;
const coordinator = `menton_signed_in=${UserRole.Coordinator}`;

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

// Async, so a refused edition arrives as a rejection like any other answer.
async function request(
  path: string,
  cookie?: string,
  userAgent?: string,
  extraHeaders: Record<string, string> = {},
) {
  const headers = new Headers(extraHeaders);
  if (cookie) headers.set("cookie", cookie);
  if (userAgent) headers.set("user-agent", userAgent);
  return proxy(
    new NextRequest(new URL(path, "http://localhost:3000"), { headers }),
  );
}

function clearsTheHint(response: Response) {
  return (response.headers.get("set-cookie") ?? "").includes(
    "menton_signed_in=;",
  );
}

describe("proxy", () => {
  it("lets public routes through without a session cookie", async () => {
    const response = await request("/login");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets the application status page through without a session cookie", async () => {
    const response = await request("/application-status");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends unauthenticated visitors away from protected pages", async () => {
    const response = await request("/dashboard");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard",
    );
  });

  // A hint naming no known role is no sign-in; it is dropped so the next page load does not read it again.
  it("sends a visitor with a hint that names nobody to login, and clears it", async () => {
    for (const cookie of ["menton_signed_in=", "menton_signed_in=ROOT"]) {
      const response = await request("/profile", cookie);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?next=%2Fprofile",
      );
      expect(clearsTheHint(response)).toBe(true);
    }
  });

  // The API's session cookie lives on the API's host; an old app cookie on this one opens nothing.
  it("does not count the old app session cookie as a sign-in", async () => {
    const response = await request("/profile", "teknokent_session=sealed");
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fprofile",
    );
  });

  it("lets a visitor with a dead hint reach login instead of bouncing them away", async () => {
    const response = await request("/login", "menton_signed_in=ROOT");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(clearsTheHint(response)).toBe(true);
  });

  it("sends a signed-in visitor away from login", async () => {
    const response = await request("/login", signedIn);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("sends a signed-in visitor away from signup", async () => {
    const response = await request("/signup", signedIn);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("honours where the visitor was originally headed", async () => {
    const response = await request("/login?next=%2Fcalendar", signedIn);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/calendar",
    );
  });

  it("refuses to forward to another origin", async () => {
    const response = await request(
      "/login?next=https%3A%2F%2Fevil.example%2Fsteal",
      signedIn,
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("refuses a protocol-relative destination", async () => {
    const response = await request(
      "/login?next=%2F%2Fevil.example%2Fsteal",
      signedIn,
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("lets signed-in visitors into protected pages", async () => {
    const response = await request("/dashboard", signedIn);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(clearsTheHint(response)).toBe(false);
  });

  it("does not send API calls to login", async () => {
    const response = await request("/api/email-unsubscribe");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy on a phone", () => {
  function location(response: Response) {
    return response.headers.get("location");
  }

  it("shows a signed-out phone the landing page", async () => {
    const response = await request("/", undefined, IPHONE);
    expect(response.status).toBe(200);
    expect(location(response)).toBeNull();
  });

  it("sends a signed-in phone from the landing page to the phone app", async () => {
    const response = await request("/", signedIn, IPHONE);
    expect(location(response)).toBe("http://localhost:3000/m");
  });

  it("sends a signed-out phone from login to the phone login", async () => {
    const response = await request("/login", undefined, IPHONE);
    expect(location(response)).toBe("http://localhost:3000/m/login");
  });

  // A failed OTG start lands on /login?otg=hata; on a phone the alert must survive the hop to /m/login.
  it("keeps a known OTG failure when it sends a signed-out phone to the phone login", async () => {
    const response = await request("/login?otg=hata", undefined, IPHONE);
    expect(location(response)).toBe("http://localhost:3000/m/login?otg=hata");
  });

  // A scanned attendance code sends a signed-out phone to sign in; the phone login must send it back to the code.
  it("keeps an attendance link as next when it sends a signed-out phone to the phone login", async () => {
    const scanned = await request("/attend/Ab_-9", undefined, IPHONE);
    expect(location(scanned)).toBe(
      "http://localhost:3000/login?next=%2Fattend%2FAb_-9",
    );

    const login = await request(
      "/login?next=%2Fattend%2FAb_-9",
      undefined,
      IPHONE,
    );
    expect(location(login)).toBe(
      "http://localhost:3000/m/login?next=%2Fattend%2FAb_-9",
    );
  });

  it("carries no other next to the phone login", async () => {
    for (const path of [
      "/login?next=%2Fdashboard",
      "/login?next=%2F%2Fevil.example%2Fattend%2Fx",
      "/login?next=%2Fattendance",
    ]) {
      const response = await request(path, undefined, IPHONE);
      expect(location(response)).toBe("http://localhost:3000/m/login");
    }
  });

  // Only an allowlisted value under the one known key is carried; nothing else from the query goes through.
  it("passes nothing else from the query on to the phone login", async () => {
    for (const path of [
      "/login?otg=evil",
      "/login?otg=%3Cscript%3E",
      "/login?next=%2F%2Fevil.example&foo=bar",
    ]) {
      const response = await request(path, undefined, IPHONE);
      expect(location(response)).toBe("http://localhost:3000/m/login");
    }
    const mixed = await request(
      "/login?otg=hata&next=https%3A%2F%2Fevil.example&foo=bar",
      undefined,
      IPHONE,
    );
    expect(location(mixed)).toBe("http://localhost:3000/m/login?otg=hata");
  });

  it("still sends a signed-in phone to the phone app, without the failure", async () => {
    const response = await request("/login?otg=hata", signedIn, IPHONE);
    expect(location(response)).toBe("http://localhost:3000/m");
  });

  it("sends a signed-in mentee's phone from the web home to the phone app", async () => {
    for (const path of ["/dashboard", "/workspace", "/login"]) {
      const response = await request(path, signedIn, IPHONE);
      expect(location(response)).toBe("http://localhost:3000/m");
    }
  });

  it("leaves deeper web pages alone, so Web'de Aç still works", async () => {
    const response = await request("/profile/personal", signedIn, IPHONE);
    expect(response.status).toBe(200);
    expect(location(response)).toBeNull();
  });

  it("keeps tablets and desktops on the web pages", async () => {
    const tablet = await request("/dashboard", signedIn, IPAD);
    const desktop = await request("/dashboard", signedIn);
    expect(location(tablet)).toBeNull();
    expect(location(desktop)).toBeNull();
  });

  it("keeps a phone on the web once it asks for it, and remembers that", async () => {
    const asked = await request("/dashboard?web=1", signedIn, IPHONE);
    expect(location(asked)).toBeNull();
    expect(asked.headers.get("set-cookie")).toMatch(/menton_prefer_web=1/);

    const later = await request(
      "/dashboard",
      `${signedIn}; menton_prefer_web=1`,
      IPHONE,
    );
    expect(location(later)).toBeNull();
  });

  it("does not save the web preference when Next.js only prefetches a ?web=1 link", async () => {
    // What reaches the proxy: Next.js has already deleted its own prefetch headers.
    const prefetched = await request("/signup?web=1", undefined, IPHONE, {
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
    });
    expect(prefetched.headers.get("set-cookie") ?? "").not.toMatch(
      /menton_prefer_web=1/,
    );

    const opened = await request("/signup?web=1", undefined, IPHONE, {
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
    });
    expect(opened.headers.get("set-cookie")).toMatch(/menton_prefer_web=1/);
  });

  it("forgets the web preference once the phone app is opened again", async () => {
    const response = await request(
      "/m",
      `${signedIn}; menton_prefer_web=1`,
      IPHONE,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/menton_prefer_web=;/);
  });

  it("never sends a coordinator to the phone app", async () => {
    const entry = await request("/workspace", coordinator, IPHONE);
    expect(location(entry)).toBeNull();

    const phonePage = await request("/m", coordinator, IPHONE);
    expect(location(phonePage)).toBe("http://localhost:3000/workspace?web=1");
  });

  it("sends a signed-out visitor from a phone page to the phone login", async () => {
    const response = await request("/m/calendar", undefined, IPHONE);
    expect(location(response)).toBe(
      "http://localhost:3000/m/login?next=%2Fm%2Fcalendar",
    );
  });

  it("lets a signed-out visitor open the phone login", async () => {
    const response = await request("/m/login", undefined, IPHONE);
    expect(response.status).toBe(200);
    expect(location(response)).toBeNull();
  });

  it("sends a signed-in visitor away from the phone login to the phone home", async () => {
    const response = await request("/m/login", signedIn, IPHONE);
    expect(location(response)).toBe("http://localhost:3000/m");
  });
});

describe("proxy per edition", () => {
  const ODTU_PAGES = [
    "/student",
    "/student/peer-mentoring",
    "/academician/requests",
    "/office-hours/profile",
    "/lti/launch",
    "/login/odtu/dev",
  ];
  const TEKNOKENT_PAGES = [
    "/m",
    "/m/login",
    "/assistant",
    "/auth/otg/start",
    "/invite",
  ];

  function rewrittenTo(response: Response) {
    return response.headers.get("x-middleware-rewrite");
  }

  afterEach(() => vi.stubEnv("APP_EDITION", undefined));

  it.each(ODTU_PAGES)(
    "answers %s like a missing page in the Teknokent edition, even signed in",
    async (path) => {
      vi.stubEnv("APP_EDITION", "TEKNOKENT");
      for (const cookie of [undefined, signedIn]) {
        const response = await request(path, cookie);
        expect(rewrittenTo(response)).toBe(
          "http://localhost:3000/_edition-closed",
        );
        expect(response.headers.get("location")).toBeNull();
      }
    },
  );

  it.each(TEKNOKENT_PAGES)(
    "answers %s like a missing page in the ODTÜ edition",
    async (path) => {
      vi.stubEnv("APP_EDITION", "ODTU");
      const response = await request(path, signedIn, IPHONE);
      expect(rewrittenTo(response)).toBe(
        "http://localhost:3000/_edition-closed",
      );
    },
  );

  // A typo must not quietly open the other edition's screens.
  it("refuses to serve a page under an unknown edition", async () => {
    vi.stubEnv("APP_EDITION", "METU");
    await expect(request("/login")).rejects.toThrow(/APP_EDITION/);
  });

  it("treats an unset edition as Teknokent", async () => {
    vi.stubEnv("APP_EDITION", undefined);
    const response = await request("/student");
    expect(rewrittenTo(response)).toBe("http://localhost:3000/_edition-closed");
  });

  it("serves the ODTÜ pages in the ODTÜ edition behind the usual sign-in", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    const response = await request("/student");
    expect(rewrittenTo(response)).toBeNull();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fstudent",
    );
  });

  it("never sends a phone to the Teknokent phone app in the ODTÜ edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    const signedOut = await request("/login", undefined, IPHONE);
    expect(signedOut.headers.get("location")).toBeNull();
    expect(signedOut.status).toBe(200);
  });

  it("still sends a phone to the phone app in the Teknokent edition", async () => {
    vi.stubEnv("APP_EDITION", "TEKNOKENT");
    const signedOut = await request("/login", undefined, IPHONE);
    expect(signedOut.headers.get("location")).toBe(
      "http://localhost:3000/m/login",
    );
  });
});
