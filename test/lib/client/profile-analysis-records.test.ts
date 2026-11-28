import { beforeEach, describe, vi } from "vitest";

import { ProfileAnalysisRecordScope } from "@/interfaces/profile-analysis";
import { backendHttp } from "@/lib/client/backend-http";
import {
  confirmStartupProfileRecord,
  createStartupProfileRecord,
  getProfileAnalysisRecord,
} from "@/lib/client/profile-analysis-records";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const profile = { startup_name: "Döngü" };

const calls: ClientCall[] = [
  {
    title: "getProfileAnalysisRecord reads the scope's record",
    call: () => getProfileAnalysisRecord(ProfileAnalysisRecordScope.Personal),
    method: "get",
    args: [
      "/api/profile-analysis-records",
      { params: { scope: ProfileAnalysisRecordScope.Personal } },
    ],
  },
  {
    title: "createStartupProfileRecord saves the startup's profile",
    call: () => createStartupProfileRecord(profile),
    method: "post",
    args: ["/api/profile-analysis-records", { profile }],
  },
  {
    title: "confirmStartupProfileRecord confirms the encoded record",
    call: () => confirmStartupProfileRecord("rec/1", profile),
    method: "patch",
    args: ["/api/profile-analysis-records/rec%2F1", { profile }],
  },
];

describe("profile analysis records client, straight to the backend", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});
