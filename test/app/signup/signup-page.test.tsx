import { describe, expect, it, vi } from "vitest";

import SignupPage from "@/app/signup/page";
import { SignupFlow } from "@/components/signup/signup-flow";
import { Edition } from "@/interfaces/edition";

const connection = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/lib/server/edition", () => ({
  appEdition: () => "ODTU",
}));

describe("sign-up page", () => {
  it("renders per request with the deployment's edition", async () => {
    const page = await SignupPage();

    expect(connection).toHaveBeenCalledTimes(1);
    const flow = page.props.children;
    expect(flow.type).toBe(SignupFlow);
    expect(flow.props).toEqual({ edition: Edition.Odtu });
  });
});
