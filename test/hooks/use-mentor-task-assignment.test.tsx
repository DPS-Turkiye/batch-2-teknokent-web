import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorTaskAssignment } from "@/hooks/use-mentor-task-assignment";
import {
  assignMentorshipTask,
  getTaskAssignees,
} from "@/lib/client/mentor-task-assignment";
import { formSubmitEvent } from "@test/fixtures/form-events";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/mentor-task-assignment", () => ({
  assignMentorshipTask: vi.fn(),
  getTaskAssignees: vi.fn(),
}));
const ownerId = "00000000-0000-4000-8000-000000000001";
function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <InLocale locale="tr">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </InLocale>
  );
  return renderHook(() => useMentorTaskAssignment("request-1"), { wrapper });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTaskAssignees).mockResolvedValue([
    { id: ownerId, fullName: "Deniz" },
  ]);
});
describe("useMentorTaskAssignment", () => {
  it("rejects whitespace titles and a manually injected assignee outside the roster", async () => {
    const { result } = setup();
    act(() => result.current.open());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setTitle(" ");
      result.current.setOwnerId(ownerId);
    });
    await act(() => result.current.submit(formSubmitEvent()));
    expect(result.current.error).not.toBe("");
    act(() => {
      result.current.setTitle("Task");
      result.current.setOwnerId("00000000-0000-4000-8000-000000000099");
    });
    await act(() => result.current.submit(formSubmitEvent()));
    expect(assignMentorshipTask).not.toHaveBeenCalled();
  });
  it("clears an abandoned draft when the dialog is reopened", () => {
    const { result } = setup();
    act(() => {
      result.current.open();
      result.current.setTitle("Old task");
      result.current.setOwnerId(ownerId);
    });
    act(() => result.current.close());
    act(() => result.current.open());
    expect(result.current.title).toBe("");
    expect(result.current.ownerId).toBe("");
    expect(result.current.error).toBe("");
  });
});
