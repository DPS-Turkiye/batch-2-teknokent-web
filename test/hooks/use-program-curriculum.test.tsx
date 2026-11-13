import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { useProgramCurriculum } from "@/hooks/use-program-curriculum";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  replaceCoordinatorProgramPhases: vi.fn(),
}));

it("keeps manual phase entry available without the retired syllabus importer", () => {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <InLocale locale="tr">{children}</InLocale>
      </QueryClientProvider>
    );
  }
  const { result } = renderHook(
    () => useProgramCurriculum("program-1", coordinatorProgramDetail()),
    { wrapper: Wrapper },
  );
  expect(result.current.canAdd).toBe(true);
});
