import { beforeEach, describe, vi } from "vitest";

import { Weekday } from "@/interfaces/mentor";
import { backendHttp } from "@/lib/client/backend-http";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getAvailabilityRules,
  getAvailabilitySettings,
  updateAvailabilitySettings,
} from "@/lib/client/mentor-profile";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const RULES = "/api/mentors/user%2F1/availability-rules";
const SETTINGS = "/api/mentors/user%2F1/availability-settings";
const rule = {
  dayOfWeek: Weekday.Monday,
  startTime: "09:00",
  endTime: "12:00",
  slotMinutes: 30,
};
const settings = {
  rules: [rule],
  exceptions: [],
  menteeCapacity: 3,
  defaultMeetingDurationMinutes: 45,
  meetingBufferMinutes: 15,
};

const calls: ClientCall[] = [
  {
    title: "getAvailabilityRules lists the weekly rules",
    call: () => getAvailabilityRules(),
    method: "get",
    args: [RULES],
  },
  {
    title: "getAvailabilitySettings reads the booking settings",
    call: () => getAvailabilitySettings(),
    method: "get",
    args: [SETTINGS],
  },
  {
    title: "updateAvailabilitySettings saves on the session with no token",
    call: () => updateAvailabilitySettings(settings),
    method: "put",
    args: [SETTINGS, settings, undefined],
  },
  {
    title: "updateAvailabilitySettings attaches the bearer token when given",
    call: () => updateAvailabilitySettings(settings, "id-token"),
    method: "put",
    args: [
      SETTINGS,
      settings,
      { headers: { Authorization: "Bearer id-token" } },
    ],
  },
  {
    title: "createAvailabilityRule posts the rule",
    call: () => createAvailabilityRule(rule),
    method: "post",
    args: [RULES, rule],
  },
  {
    title: "deleteAvailabilityRule deletes the encoded rule",
    call: () => deleteAvailabilityRule("rule/1"),
    method: "delete",
    args: [`${RULES}/rule%2F1`],
    returnsNothing: true,
  },
];

describe("mentor profile client (availability rules and settings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
