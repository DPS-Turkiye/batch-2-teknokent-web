import { describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { postRealtimeToken } from "@/lib/client/realtime-token";
import { itSendsEachClientCall } from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("realtime token client", () => {
  // Nothing names whom the token is for: the backend mints it for the caller and their own team.
  itSendsEachClientCall(
    [
      {
        title: "postRealtimeToken asks the backend, naming nobody",
        call: () => postRealtimeToken(),
        method: "post",
        args: ["/api/realtime/token"],
      },
    ],
    backendHttp,
  );
});
