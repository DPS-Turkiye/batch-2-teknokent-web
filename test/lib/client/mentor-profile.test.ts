import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateMentorProfilePayload } from "@/interfaces/mentor";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorProfile,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const payload: UpdateMentorProfilePayload = {
  professionalTitle: "Mentor",
  company: "Acme",
  availabilityLabel: "Bu hafta müsait",
  responseTimeLabel: "~24 saat",
  meetingMode: "Online",
  communicationPreference: "Mesajlaşma açık",
  mentoringStyle: "Yapılandırılmış",
  fitLabel: "Yüksek",
  experienceLevel: "Kıdemli",
  sectorExperience: "SaaS",
  startupStages: "Seed",
  specialties: ["Büyüme"],
};

describe("mentor profile client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the mentor's own profile", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: { fullName: "Leyla Aksoy" },
    });

    await getMentorProfile();

    expect(httpClient.get).toHaveBeenCalledWith("/api/mentor-profile");
  });

  it("sends the full payload when updating the profile", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({
      status: 200,
      data: {},
    });

    await updateMentorProfile(payload);

    expect(httpClient.put).toHaveBeenCalledWith(
      "/api/mentor-profile",
      payload,
      undefined,
    );
  });

  it("attaches the bearer token when onboarding saves before approval", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({
      status: 200,
      data: {},
    });

    await updateMentorProfile(payload, "id-token");

    expect(httpClient.put).toHaveBeenCalledWith(
      "/api/mentor-profile",
      payload,
      { headers: { Authorization: "Bearer id-token" } },
    );
  });

  it("fetches the mentor's availability slots", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: [],
    });

    await getMentorAvailability();

    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/mentor-profile/availability",
    );
  });

  it("creates a new availability slot", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {},
    });

    await createAvailabilitySlot({
      startsAt: "2026-08-25T10:00:00.000Z",
      durationMinutes: 60,
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentor-profile/availability",
      { startsAt: "2026-08-25T10:00:00.000Z", durationMinutes: 60 },
    );
  });

  it("deletes an availability slot by id", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({
      status: 204,
      data: "",
    });

    await deleteAvailabilitySlot("slot-1");

    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/mentor-profile/availability/slot-1",
    );
  });
});
