import { beforeEach, describe, expect, it, vi } from "vitest";

import MeetingPreparationPage from "@/app/meetings/research/prepare/page";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

describe("/meetings/research/prepare", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends an old link to that meeting's notebook", async () => {
    await MeetingPreparationPage({
      searchParams: Promise.resolve({ id: "meeting 1" }),
    });

    expect(redirect).toHaveBeenCalledWith("/notes/meeting%201");
  });

  it("sends a link without a meeting to the notes list", async () => {
    await MeetingPreparationPage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/notes");
  });
});
