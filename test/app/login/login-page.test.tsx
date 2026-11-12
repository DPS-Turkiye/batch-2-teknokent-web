import { describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { LoginFlowView } from "@/components/login/login-flow-view";
import { Edition } from "@/interfaces/edition";

const connection = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/lib/server/edition", () => ({
  appEdition: () => "ODTU",
}));

describe("login page", () => {
  it("renders per request with the deployment's edition", async () => {
    const page = await LoginPage();

    expect(connection).toHaveBeenCalledTimes(1);
    const view = page.props.children;
    expect(view.type).toBe(LoginFlowView);
    expect(view.props).toEqual({ edition: Edition.Odtu });
  });
});
