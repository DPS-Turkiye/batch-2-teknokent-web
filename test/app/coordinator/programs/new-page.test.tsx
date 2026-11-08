import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import CoordinatorNewProgramPage from "@/app/coordinator/programs/new/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("old coordinator Yeni program route", () => {
  it("sends coordinators to Programlarım, since the admin creates programs", () => {
    CoordinatorNewProgramPage();

    expect(redirect).toHaveBeenCalledWith("/coordinator/programs");
  });
});
