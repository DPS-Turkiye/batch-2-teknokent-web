import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import MentorshipDetailRedirect from "@/app/mentor-dashboard/mentorship/[id]/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("old mentor mentorship detail route", () => {
  it("sends old links to the request's startup detail page", async () => {
    await MentorshipDetailRedirect({
      params: Promise.resolve({ id: "req 1" }),
    });

    expect(redirect).toHaveBeenCalledWith("/mentorships/requests/req%201");
  });
});
