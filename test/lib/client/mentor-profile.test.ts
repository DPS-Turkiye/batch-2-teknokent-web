import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateMentorProfilePayload } from "@/interfaces/mentor";
import { backendHttp, signedInUserId } from "@/lib/client/backend-http";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorProfile,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const OWN = "/api/mentors/user%2F1";

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

describe("mentor profile client, straight to the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the mentor's own profile", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: { fullName: "Leyla Aksoy" },
    });

    await getMentorProfile();

    expect(backendHttp.get).toHaveBeenCalledWith(OWN);
  });

  it("sends the full payload when updating the profile", async () => {
    vi.mocked(backendHttp.put).mockResolvedValue({
      status: 200,
      data: {},
    });

    await updateMentorProfile(payload);

    expect(backendHttp.put).toHaveBeenCalledWith(OWN, payload, undefined);
  });

  it("attaches the bearer token when onboarding saves before approval", async () => {
    vi.mocked(backendHttp.put).mockResolvedValue({
      status: 200,
      data: {},
    });

    await updateMentorProfile(payload, "id-token");

    expect(backendHttp.put).toHaveBeenCalledWith(OWN, payload, {
      headers: { Authorization: "Bearer id-token" },
    });
    // The mentor's own id is asked with the same token, before any session exists.
    expect(signedInUserId).toHaveBeenCalledWith("id-token");
  });

  it("fetches the mentor's availability slots", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: [],
    });

    await getMentorAvailability();

    expect(backendHttp.get).toHaveBeenCalledWith(`${OWN}/availability`);
  });

  it("creates a new availability slot", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 201,
      data: {},
    });

    await createAvailabilitySlot({
      startsAt: "2026-08-25T10:00:00.000Z",
      durationMinutes: 60,
    });

    expect(backendHttp.post).toHaveBeenCalledWith(`${OWN}/availability`, {
      startsAt: "2026-08-25T10:00:00.000Z",
      durationMinutes: 60,
    });
  });

  it("deletes an availability slot by id", async () => {
    vi.mocked(backendHttp.delete).mockResolvedValue({
      status: 204,
      data: "",
    });

    await deleteAvailabilitySlot("slot-1");

    expect(backendHttp.delete).toHaveBeenCalledWith(
      `${OWN}/availability/slot-1`,
    );
  });
});
