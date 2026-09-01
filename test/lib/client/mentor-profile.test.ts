import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("mentor profile client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the mentor's own profile", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: { fullName: "Leyla Aksoy" },
    } as never);

    await getMentorProfile();

    expect(httpClient.get).toHaveBeenCalledWith("/api/mentor-profile");
  });

  it("sends the full payload when updating the profile", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({
      status: 200,
      data: {},
    } as never);

    const payload = {
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
    } as never);

    await updateMentorProfile(
      { specialties: [] } as unknown as Parameters<
        typeof updateMentorProfile
      >[0],
      "id-token",
    );

    expect(httpClient.put).toHaveBeenCalledWith(
      "/api/mentor-profile",
      { specialties: [] },
      { headers: { Authorization: "Bearer id-token" } },
    );
  });

  it("fetches the mentor's availability slots", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: [],
    } as never);

    await getMentorAvailability();

    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/mentor-profile/availability",
    );
  });

  it("creates a new availability slot", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {},
    } as never);

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
    } as never);

    await deleteAvailabilitySlot("slot-1");

    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/mentor-profile/availability/slot-1",
    );
  });
});
