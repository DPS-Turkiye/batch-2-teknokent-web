import { describe, expect, it } from "vitest";

import {
  headingForPickFilter,
  mentorsForPickFilter,
} from "@/lib/mentor-request-pick";
import { mentorProfile } from "@test/fixtures/mentors";

const nihan = {
  ...mentorProfile,
  id: "mentor-nihan",
  fullName: "Nihan Öztürk",
  meetingMode: "Online",
  availabilityLabel: "Bu hafta müsait",
};

const ali = {
  ...mentorProfile,
  id: "mentor-ali",
  fullName: "Ali Erdem",
  meetingMode: "Yüz yüze",
  specialties: [],
  availabilityLabel: "",
};

describe("mentor-request-pick", () => {
  it("defaults Önerilen to the matched mentors and Tümü to the full list", () => {
    expect(
      mentorsForPickFilter("recommended", [nihan], [nihan, ali]).map(
        (mentor) => mentor.id,
      ),
    ).toEqual(["mentor-nihan"]);
    expect(
      mentorsForPickFilter("all", [nihan], [nihan, ali]).map(
        (mentor) => mentor.id,
      ),
    ).toEqual(["mentor-nihan", "mentor-ali"]);
    expect(headingForPickFilter("recommended")).toBe("En Uygun Mentorlar");
    expect(headingForPickFilter("all")).toBe("Tüm Mentorlar");
  });

  it("filters Online and Yüz yüze from the full list", () => {
    expect(
      mentorsForPickFilter("online", [nihan], [nihan, ali]).map(
        (mentor) => mentor.fullName,
      ),
    ).toEqual(["Nihan Öztürk"]);
    expect(
      mentorsForPickFilter("in-person", [nihan], [nihan, ali]).map(
        (mentor) => mentor.fullName,
      ),
    ).toEqual(["Ali Erdem"]);
  });
});
