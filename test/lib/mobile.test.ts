import { describe, expect, it } from "vitest";

import { MobileTab } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  hasMobileApp,
  isMobilePath,
  isPhoneUserAgent,
  mobileAccentFor,
  mobileTabForPath,
  mobileTabsFor,
  webHref,
} from "@/lib/mobile";
import { isPublicPath, loginPathFor } from "@/lib/public-paths";

describe("isPhoneUserAgent", () => {
  it("recognises iPhones and Android phones", () => {
    expect(
      isPhoneUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
      ),
    ).toBe(true);
    expect(
      isPhoneUserAgent(
        "Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/129.0 Mobile Safari/537.36",
      ),
    ).toBe(true);
  });

  it("leaves tablets, desktops and a missing header on the web", () => {
    expect(
      isPhoneUserAgent("Mozilla/5.0 (Linux; Android 15; Tab S9) Chrome/129.0"),
    ).toBe(false);
    expect(isPhoneUserAgent("Mozilla/5.0 (iPad; CPU OS 18_0)")).toBe(false);
    expect(isPhoneUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)")).toBe(
      false,
    );
    expect(isPhoneUserAgent(null)).toBe(false);
  });
});

describe("mobileTabsFor", () => {
  it("gives a mentee Görevler as the third tab", () => {
    expect(mobileTabsFor(UserRole.Mentee).map((tab) => tab.label)).toEqual([
      "Ana Sayfa",
      "Takvim",
      "Görevler",
      "Mesajlar",
    ]);
  });

  it("gives a mentor Startuplar as the third tab", () => {
    expect(mobileTabsFor(UserRole.Mentor).map((tab) => tab.label)).toEqual([
      "Ana Sayfa",
      "Takvim",
      "Startuplar",
      "Mesajlar",
    ]);
  });
});

describe("mobileTabForPath", () => {
  const tabs = mobileTabsFor(UserRole.Mentee);

  it("keeps a nested screen on its tab", () => {
    expect(mobileTabForPath("/m/messages/abc", tabs)?.tab).toBe(
      MobileTab.Messages,
    );
    expect(mobileTabForPath("/m", tabs)?.tab).toBe(MobileTab.Home);
  });

  it("does not match a tab the role does not have", () => {
    expect(mobileTabForPath("/m/startups", tabs)).toBeUndefined();
  });
});

describe("roles and links", () => {
  it("only mentees and mentors have the phone app", () => {
    expect(hasMobileApp(UserRole.Mentee)).toBe(true);
    expect(hasMobileApp(UserRole.Mentor)).toBe(true);
    expect(hasMobileApp(UserRole.Coordinator)).toBe(false);
    expect(hasMobileApp(UserRole.Admin)).toBe(false);
  });

  it("colours mentees orange, mentors blue and everyone else dark", () => {
    expect(mobileAccentFor(UserRole.Mentee)).toBe("#e66600");
    expect(mobileAccentFor(UserRole.Mentor)).toBe("#26a4ff");
    expect(mobileAccentFor(undefined)).toBe("#22262b");
  });

  it("marks a web link so the phone is not sent back to /m", () => {
    expect(webHref("/profile/personal")).toBe("/profile/personal?web=1");
    expect(webHref("/signup?role=mentor")).toBe("/signup?role=mentor&web=1");
  });

  it("recognises phone paths without catching lookalikes", () => {
    expect(isMobilePath("/m")).toBe(true);
    expect(isMobilePath("/m/tasks")).toBe(true);
    expect(isMobilePath("/mentors")).toBe(false);
  });

  it("sends a signed-out phone page to the phone login, and web pages to /login", () => {
    expect(loginPathFor("/m/tasks")).toBe("/m/login?next=%2Fm%2Ftasks");
    expect(loginPathFor("/dashboard")).toBe("/login?next=%2Fdashboard");
    expect(isPublicPath("/m/login")).toBe(true);
    expect(isPublicPath("/m")).toBe(false);
  });
});
