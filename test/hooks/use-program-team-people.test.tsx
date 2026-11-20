import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgramTeamPeople } from "@/hooks/use-program-team-people";
import {
  TeamPersonRole,
  type ProgramTeamPeopleHit,
} from "@/interfaces/coordinator-program";
import { getProgramTeamPeople } from "@/lib/client/coordinator-programs";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getProgramTeamPeople: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const hit = (fullName: string): ProgramTeamPeopleHit => ({
  id: fullName,
  fullName,
  role: TeamPersonRole.Member,
  jobTitle: null,
  organizationId: "org-1",
  teamName: "Kavşak",
});

describe("useProgramTeamPeople", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sends nothing for fewer than two letters", async () => {
    const { result } = renderHook(() => useProgramTeamPeople("program-1"), {
      wrapper,
    });

    act(() => result.current.setSearch(" ç "));
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    expect(result.current.active).toBe(false);
    expect(result.current.people).toEqual([]);
    expect(getProgramTeamPeople).not.toHaveBeenCalled();
  });

  it("asks the backend once typing pauses, with the folded text", async () => {
    vi.mocked(getProgramTeamPeople).mockResolvedValue({
      people: [hit("Çağrı Yılmaz")],
      truncated: true,
    });
    const { result } = renderHook(() => useProgramTeamPeople("program-1"), {
      wrapper,
    });

    act(() => result.current.setSearch("Ç"));
    act(() => result.current.setSearch("ÇAĞ"));
    expect(result.current.searching).toBe(true);

    await waitFor(() => expect(result.current.people).toHaveLength(1));
    expect(getProgramTeamPeople).toHaveBeenCalledTimes(1);
    expect(getProgramTeamPeople).toHaveBeenCalledWith("program-1", "cag");
    expect(result.current.truncated).toBe(true);
    expect(result.current.searching).toBe(false);
    expect(result.current.noMatch).toBe(false);
  });

  it("narrows the last answer right away, the way the backend matches, while the next one loads", async () => {
    vi.mocked(getProgramTeamPeople).mockResolvedValueOnce({
      people: [hit("Çağrı Yılmaz"), hit("Çağan Demir")],
      truncated: false,
    });
    vi.mocked(getProgramTeamPeople).mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useProgramTeamPeople("program-1"), {
      wrapper,
    });

    act(() => result.current.setSearch("cag"));
    await waitFor(() => expect(result.current.people).toHaveLength(2));

    act(() => result.current.setSearch("cag yil"));

    expect(result.current.people.map((person) => person.fullName)).toEqual([
      "Çağrı Yılmaz",
    ]);
    expect(result.current.searching).toBe(true);
    expect(result.current.truncated).toBe(false);
    expect(result.current.noMatch).toBe(false);

    act(() => result.current.setSearch(""));
    expect(result.current.active).toBe(false);
    expect(result.current.people).toEqual([]);
  });

  it("says nobody matched once the answer for the settled text is empty", async () => {
    vi.mocked(getProgramTeamPeople).mockResolvedValue({
      people: [],
      truncated: false,
    });
    const { result } = renderHook(() => useProgramTeamPeople("program-1"), {
      wrapper,
    });

    act(() => result.current.setSearch("zz"));

    await waitFor(() => expect(result.current.noMatch).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it("reports a failed search", async () => {
    vi.mocked(getProgramTeamPeople).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useProgramTeamPeople("program-1"), {
      wrapper,
    });

    act(() => result.current.setSearch("cagri"));

    await waitFor(() => expect(result.current.error?.message).toBe("down"));
  });
});
