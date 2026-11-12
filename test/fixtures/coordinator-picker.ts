import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onTestFinished, vi } from "vitest";

import { COORDINATOR_SEARCH_DELAY_MS } from "@/lib/coordinator-picker";

/**
 * userEvent for screens with the coordinator e-mail field, on fake timers so its search debounce can be run at
 * once with {@link settleSearch} instead of waited for. The fake clock also follows real time, so Testing
 * Library's `findBy*` polling keeps working.
 */
export function pickerUser() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** Lets the e-mail field's debounce run out now, so the search (or its absence) can be asserted at once. */
export async function settleSearch() {
  await act(() => vi.advanceTimersByTimeAsync(COORDINATOR_SEARCH_DELAY_MS));
}
