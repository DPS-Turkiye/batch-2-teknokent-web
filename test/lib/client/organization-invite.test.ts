import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  getInviteCode,
  rotateInviteCode,
} from "@/lib/client/organization-invite";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { OWN_ORGANIZATION_PATH as OWN } from "@test/mocks/own-organization";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

const calls: ClientCall[] = [
  {
    title: "getInviteCode reads the own startup's code",
    call: () => getInviteCode(),
    method: "get",
    args: [`${OWN}/invite-code`],
  },
  {
    title: "rotateInviteCode asks for a new one, naming nobody",
    call: () => rotateInviteCode(),
    method: "post",
    args: [`${OWN}/invite-code`, {}],
  },
];

describe("organization invite client, straight to the backend", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});
