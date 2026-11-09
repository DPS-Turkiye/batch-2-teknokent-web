import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  completeLtiLaunch,
  LtiRequestError,
  startLtiLogin,
} from "@/lib/api/lti";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

const LOGIN = {
  iss: "http://localhost:8081",
  login_hint: "2",
  target_link_uri: "http://localhost:3000/lti/launch",
  lti_message_hint: "hint",
  client_id: "client-1",
  lti_deployment_id: "1",
};

describe("LTI form parsing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hands the backend Moodle's login initiation in its own field names", async () => {
    await startLtiLogin(LOGIN);

    expect(backendRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/lti/login-initiations",
      data: {
        issuer: "http://localhost:8081",
        loginHint: "2",
        targetLinkUri: "http://localhost:3000/lti/launch",
        ltiMessageHint: "hint",
        clientId: "client-1",
        deploymentId: "1",
      },
    });
  });

  it("names every field a malformed initiation gets wrong and never calls the backend", async () => {
    const failure = startLtiLogin({ iss: "not a url", target_link_uri: "x" });

    await expect(failure).rejects.toBeInstanceOf(LtiRequestError);
    await expect(failure).rejects.toThrow(
      /iss: .*login_hint: .*target_link_uri: /,
    );
    expect(backendRequest).not.toHaveBeenCalled();
  });

  it("needs the token and the state to complete a launch", async () => {
    await expect(completeLtiLaunch({ state: "s" })).rejects.toThrow(
      /^id_token: /,
    );
    await completeLtiLaunch({ id_token: "token", state: "s" });

    expect(backendRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/lti/launches",
      data: { idToken: "token", state: "s" },
    });
  });
});
