import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRequestAnswer } from "@/hooks/use-request-answer";
import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { ToastTone } from "@/interfaces/toast";
import { ACADEMICIAN_OFFICE_HOURS_QUERY_KEY } from "@/lib/academician-office-hours";
import { answerAcademicianRequest } from "@/lib/client/academician-office-hours";
import { useToastStore } from "@/stores/toast-store";
import { halfHour } from "@test/fixtures/academician-office-hours";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/academician-office-hours", () => ({
  answerAcademicianRequest: vi.fn(),
}));

function setup() {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { invalidate, ...renderHook(() => useRequestAnswer(), { wrapper }) };
}

function toasts() {
  return useToastStore
    .getState()
    .toasts.map(({ message, tone }) => ({ message, tone }));
}

afterEach(() => {
  useToastStore.setState({ toasts: [] });
});

const ACCEPT = {
  action: OfficeHoursRequestAction.Accept,
  time: halfHour("2026-11-17T11:00"),
} as const;

describe("useRequestAnswer", () => {
  it("sends the answer, reloads every Office Hours query and confirms", async () => {
    let finish = (value: null) => value;
    vi.mocked(answerAcademicianRequest).mockReturnValue(
      new Promise<null>((resolve) => {
        finish = (value) => {
          resolve(value);
          return value;
        };
      }),
    );
    const { result, invalidate } = setup();

    act(() => {
      result.current.answer("request-1", ACCEPT);
    });

    await waitFor(() => {
      expect(result.current.answeringId).toBe("request-1");
    });
    act(() => {
      finish(null);
    });
    await waitFor(() => {
      expect(result.current.answeringId).toBeNull();
    });
    expect(answerAcademicianRequest).toHaveBeenCalledWith("request-1", ACCEPT);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
    });
    expect(toasts()).toEqual([
      {
        message: "Talep kabul edildi, randevu oluşturuldu.",
        tone: ToastTone.Success,
      },
    ]);
  });

  it("reloads after a refusal too and says the list was refreshed", async () => {
    vi.mocked(answerAcademicianRequest).mockRejectedValue(new Error("gone"));
    const { result, invalidate } = setup();

    act(() => {
      result.current.answer("request-1", {
        action: OfficeHoursRequestAction.Decline,
        reason: null,
      });
    });

    await waitFor(() => {
      expect(toasts()).toEqual([
        {
          message: "Talep yanıtlanamadı; liste yenilendi.",
          tone: ToastTone.Error,
        },
      ]);
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
    });
  });
});
