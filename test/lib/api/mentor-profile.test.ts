import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMentorAvailabilityRule,
  createMentorAvailabilitySlot,
  deleteMentorAvailabilityRule,
  deleteMentorAvailabilitySlot,
  fetchMentorAvailability,
  fetchMentorAvailabilityRules,
  fetchMentorAvailabilitySettings,
  fetchMentorProfile,
  updateMentorAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/api/mentor-profile";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const MENTOR_URL = "/api/mentors/mentor%2F1";

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads the mentor's profile at its encoded path",
    () => fetchMentorProfile("mentor/1"),
    { method: "GET", url: MENTOR_URL },
  ],
  [
    "lists the mentor's recurring availability rules",
    () => fetchMentorAvailabilityRules("mentor/1"),
    { method: "GET", url: `${MENTOR_URL}/availability-rules` },
  ],
  [
    "reads the mentor's availability settings",
    () => fetchMentorAvailabilitySettings("mentor/1"),
    { method: "GET", url: `${MENTOR_URL}/availability-settings` },
  ],
  [
    "adds an availability rule with the payload as the body",
    () =>
      createMentorAvailabilityRule("mentor/1", {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
      }),
    {
      method: "POST",
      url: `${MENTOR_URL}/availability-rules`,
      data: { dayOfWeek: "MONDAY", startTime: "10:00" },
    },
  ],
  [
    "deletes an availability rule by encoded id",
    () => deleteMentorAvailabilityRule("mentor/1", "rule 1"),
    { method: "DELETE", url: `${MENTOR_URL}/availability-rules/rule%201` },
  ],
  [
    "lists the mentor's one-off availability slots",
    () => fetchMentorAvailability("mentor/1"),
    { method: "GET", url: `${MENTOR_URL}/availability` },
  ],
  [
    "adds a one-off slot with the payload as the body",
    () =>
      createMentorAvailabilitySlot("mentor/1", {
        startsAt: "2026-11-12T10:00:00Z",
      }),
    {
      method: "POST",
      url: `${MENTOR_URL}/availability`,
      data: { startsAt: "2026-11-12T10:00:00Z" },
    },
  ],
  [
    "deletes a one-off slot by encoded id",
    () => deleteMentorAvailabilitySlot("mentor/1", "slot 1"),
    { method: "DELETE", url: `${MENTOR_URL}/availability/slot%201` },
  ],
];

describe("mentor profile server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });

  describe("updateMentorProfile", () => {
    it("signs the save with the onboarding token when one is given", async () => {
      await updateMentorProfile("mentor/1", { bio: "Yeni" }, "id-token");

      expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
        { method: "PUT", url: MENTOR_URL, data: { bio: "Yeni" } },
        { idToken: "id-token" },
      ]);
    });

    it("falls back to the server's own credentials without a token", async () => {
      await updateMentorProfile("mentor/1", { bio: "Yeni" });

      expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
        { method: "PUT", url: MENTOR_URL, data: { bio: "Yeni" } },
        undefined,
      ]);
    });

    it("treats an empty token as no token", async () => {
      await updateMentorProfile("mentor/1", { bio: "Yeni" }, "");

      expect(vi.mocked(backendRequest).mock.lastCall?.[1]).toBeUndefined();
    });
  });

  describe("updateMentorAvailabilitySettings", () => {
    it("signs the save with the onboarding token when one is given", async () => {
      await updateMentorAvailabilitySettings(
        "mentor/1",
        { slotMinutes: 30 },
        "id-token",
      );

      expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
        {
          method: "PUT",
          url: `${MENTOR_URL}/availability-settings`,
          data: { slotMinutes: 30 },
        },
        { idToken: "id-token" },
      ]);
    });

    it("falls back to the server's own credentials without a token", async () => {
      await updateMentorAvailabilitySettings("mentor/1", { slotMinutes: 30 });

      expect(vi.mocked(backendRequest).mock.lastCall?.[1]).toBeUndefined();
    });
  });
});
