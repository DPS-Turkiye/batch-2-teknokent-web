import { describe, expect, it } from "vitest";

import { UserAccountStatus } from "@/interfaces/session";
import {
  StartupAccess,
  startupAccessOf,
  startupGate,
} from "@/lib/startup-access";

describe("startupAccessOf", () => {
  it("has no startup without an organization", () => {
    expect(startupAccessOf(undefined, undefined)).toBe(StartupAccess.None);
  });

  it("follows the startup's approval", () => {
    expect(startupAccessOf("org-1", UserAccountStatus.Pending)).toBe(
      StartupAccess.Pending,
    );
    expect(startupAccessOf("org-1", UserAccountStatus.Rejected)).toBe(
      StartupAccess.Rejected,
    );
    expect(startupAccessOf("org-1", UserAccountStatus.Approved)).toBe(
      StartupAccess.Ready,
    );
  });
});

describe("startupGate", () => {
  it("opens every page for an approved startup", () => {
    expect(startupGate("/mentor-request", StartupAccess.Ready)).toBeNull();
  });

  it("closes startup-only pages, including their sub-pages, without a startup", () => {
    expect(startupGate("/dashboard", StartupAccess.None)).toBe(
      StartupAccess.None,
    );
    expect(startupGate("/notes/meeting-1", StartupAccess.None)).toBe(
      StartupAccess.None,
    );
    expect(startupGate("/startup/team", StartupAccess.None)).toBe(
      StartupAccess.None,
    );
  });

  it("keeps the profile and Startup'ım open without a startup", () => {
    expect(startupGate("/startup", StartupAccess.None)).toBeNull();
    expect(startupGate("/startup/create", StartupAccess.None)).toBeNull();
    expect(startupGate("/profile", StartupAccess.None)).toBeNull();
    expect(startupGate("/mentors", StartupAccess.None)).toBeNull();
  });

  it("lets a waiting startup work on its team and files but nothing else", () => {
    expect(startupGate("/startup/team", StartupAccess.Pending)).toBeNull();
    expect(startupGate("/startup/files", StartupAccess.Rejected)).toBeNull();
    expect(startupGate("/mentorships", StartupAccess.Pending)).toBe(
      StartupAccess.Pending,
    );
    expect(startupGate("/startup/meetings", StartupAccess.Rejected)).toBe(
      StartupAccess.Rejected,
    );
  });

  it("does not mistake a longer path for a gated one", () => {
    expect(startupGate("/notesx", StartupAccess.None)).toBeNull();
  });
});
