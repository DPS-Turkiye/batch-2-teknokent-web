import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCoordinatorAnnouncements,
  useMyAnnouncements,
} from "@/hooks/use-program-announcements";
import {
  AnnouncementAudience,
  type ProgramAnnouncement,
} from "@/interfaces/program-announcement";
import {
  getMyAnnouncements,
  getProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/client/program-announcements";
import { programAnnouncement } from "@test/fixtures/program-announcements";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-announcements", () => ({
  getMyAnnouncements: vi.fn(),
  getProgramAnnouncements: vi.fn(),
  postProgramAnnouncement: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const programs = [
  { id: "program-1", name: "METU Stars 2026", individualMentees: false },
  { id: "program-2", name: "İŞKUR 2026", individualMentees: true },
];

describe("program announcement hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyAnnouncements).mockResolvedValue([programAnnouncement()]);
    vi.mocked(getProgramAnnouncements).mockResolvedValue([
      programAnnouncement(),
    ]);
    vi.mocked(postProgramAnnouncement).mockResolvedValue(programAnnouncement());
  });

  it("opens and closes a read-only program thread", async () => {
    const { result } = renderHook(() => useMyAnnouncements(), { wrapper });
    await waitFor(() => expect(result.current.threads).toHaveLength(1));

    act(() => result.current.open("program-1"));
    expect(result.current.active?.programName).toBe("METU Stars 2026");
    act(() => result.current.close());
    expect(result.current.active).toBeNull();
  });

  it("posts the trimmed draft to the open program and clears it", async () => {
    const { result } = renderHook(() => useCoordinatorAnnouncements(programs), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.threads[0]?.latest ?? null).not.toBeNull(),
    );

    act(() => result.current.open("program-1"));
    act(() => result.current.setDraft("  Demo Day  "));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.draft).toBe(""));
    expect(postProgramAnnouncement).toHaveBeenCalledWith("program-1", {
      body: "Demo Day",
      audience: AnnouncementAudience.Everyone,
    });
  });

  it("sends to the chosen audience, then goes back to everyone", async () => {
    const { result } = renderHook(() => useCoordinatorAnnouncements(programs), {
      wrapper,
    });
    act(() => result.current.open("program-1"));
    expect(result.current.audience).toBe(AnnouncementAudience.Everyone);
    act(() => result.current.setAudience(AnnouncementAudience.Mentors));
    act(() => result.current.setAudience("ADMINS"));
    act(() => result.current.setDraft("Mentor toplantısı"));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.draft).toBe(""));
    expect(postProgramAnnouncement).toHaveBeenCalledWith("program-1", {
      body: "Mentor toplantısı",
      audience: AnnouncementAudience.Mentors,
    });
    expect(result.current.audience).toBe(AnnouncementAudience.Everyone);
  });

  it("keeps the next program's draft when an earlier post settles", async () => {
    let settle: (value: ProgramAnnouncement) => void = () => undefined;
    vi.mocked(postProgramAnnouncement).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    const { result } = renderHook(() => useCoordinatorAnnouncements(programs), {
      wrapper,
    });
    act(() => result.current.open("program-1"));
    act(() => result.current.setDraft("Demo Day"));
    act(() => result.current.send());
    act(() => result.current.open("program-2"));
    act(() => result.current.setAudience(AnnouncementAudience.Participants));
    act(() => result.current.setDraft("Kayıtlar açıldı"));

    await act(async () => settle(programAnnouncement()));

    expect(result.current.draft).toBe("Kayıtlar açıldı");
    expect(result.current.audience).toBe(AnnouncementAudience.Participants);
  });

  it("names the participants by the open program's type", () => {
    const { result } = renderHook(() => useCoordinatorAnnouncements(programs), {
      wrapper,
    });

    act(() => result.current.open("program-1"));
    expect(
      result.current.audienceOptions.map((option) => option.label),
    ).toEqual(["Herkes", "Yalnızca mentorlar", "Yalnızca takımlar"]);
    act(() => result.current.setAudience(AnnouncementAudience.Participants));
    act(() => result.current.open("program-2"));
    expect(result.current.audience).toBe(AnnouncementAudience.Everyone);
    expect(result.current.audienceOptions[2]?.label).toBe(
      "Yalnızca katılımcılar",
    );
  });
});
