import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useDismissedHomeTasks } from "@/hooks/use-dismissed-home-tasks";
import { readDismissedHomeTasks } from "@/lib/mentee-home";

describe("useDismissedHomeTasks", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("dismisses nothing for a signed-out visitor and stores nothing", () => {
    const { result } = renderHook(() => useDismissedHomeTasks(undefined));

    act(() => result.current.dismissHomeTask("task-1"));

    expect(result.current.dismissedTaskIds).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it("remembers a dismissed task for this user and shows it at once", () => {
    const { result } = renderHook(() => useDismissedHomeTasks("user-1"));

    act(() => result.current.dismissHomeTask("task-1"));

    expect(result.current.dismissedTaskIds).toEqual(["task-1"]);
    expect(readDismissedHomeTasks("user-1")).toEqual(["task-1"]);
  });

  it("keeps each user's dismissals apart", () => {
    const first = renderHook(() => useDismissedHomeTasks("user-1"));
    act(() => first.result.current.dismissHomeTask("task-1"));

    const second = renderHook(() => useDismissedHomeTasks("user-2"));

    expect(second.result.current.dismissedTaskIds).toEqual([]);
  });

  it("does not store the same task twice", () => {
    const { result } = renderHook(() => useDismissedHomeTasks("user-1"));

    act(() => {
      result.current.dismissHomeTask("task-1");
    });
    act(() => {
      result.current.dismissHomeTask("task-1");
      result.current.dismissHomeTask("task-2");
    });

    expect(result.current.dismissedTaskIds).toEqual(["task-1", "task-2"]);
  });
});
