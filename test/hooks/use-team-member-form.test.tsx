import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTeamMemberForm } from "@/hooks/use-team-member-form";

function fill(
  result: { current: ReturnType<typeof useTeamMemberForm> },
  email: string,
) {
  act(() => {
    result.current.update("fullName", "Ali Veli");
    result.current.update("email", email);
  });
}

describe("useTeamMemberForm", () => {
  it("adds a member from any domain when none is set", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() => useTeamMemberForm(onAdd, []));
    fill(result, "ali@gmail.com");

    act(() => result.current.submit());

    expect(onAdd).toHaveBeenCalledWith({
      fullName: "Ali Veli",
      jobTitle: "",
      email: "ali@gmail.com",
    });
  });

  it("refuses a member e-mail outside the deployment's domains", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() =>
      useTeamMemberForm(onAdd, ["metu.edu.tr"]),
    );
    fill(result, "ali@gmail.com");

    act(() => result.current.submit());

    expect(onAdd).not.toHaveBeenCalled();
    expect(result.current.error).toBe(
      "Üyenin @metu.edu.tr uzantılı e-posta adresini yaz.",
    );
  });

  it("adds a member with a university address", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() =>
      useTeamMemberForm(onAdd, ["metu.edu.tr"]),
    );
    fill(result, "ali@metu.edu.tr");

    act(() => result.current.submit());

    expect(onAdd).toHaveBeenCalledOnce();
    expect(result.current.error).toBe("");
  });
});
