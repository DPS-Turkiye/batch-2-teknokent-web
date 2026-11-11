import { existsSync } from "node:fs";
import path from "node:path";
import { renderHook } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { useProgramNavigation } from "@/hooks/use-program-navigation";
import { ProgramType } from "@/interfaces/program";
import {
  misplacedTabHref,
  participantTabs,
  ProgramTab,
  programTabs,
} from "@/lib/coordinator-program-detail";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const PROGRAM_ID = "p1";
const ADMIN_PROGRAM = `/admin/programs/${PROGRAM_ID}`;

/** The App Router page file that serves an /admin/programs/<id>/… link. */
function pageFileOf(href: string) {
  const rest = href.slice(ADMIN_PROGRAM.length).split(/[?#]/)[0];
  return path.resolve(
    __dirname,
    "../../../../src/app/admin/programs/[id]",
    `.${rest}`,
    "page.tsx",
  );
}

describe("admin program tabs", () => {
  it.each(Object.values(ProgramType))(
    "every %s tab or redirect an admin can land on has an admin page",
    (type) => {
      vi.mocked(usePathname).mockReturnValue(ADMIN_PROGRAM);
      const { result } = renderHook(() => useProgramNavigation(PROGRAM_ID));
      const base = coordinatorProgramDetail();
      const detail = { ...base, program: { ...base.program, type } };
      const hrefs = [
        ...programTabs(detail, PROGRAM_ID).map((tab) => tab.href),
        ...participantTabs(detail, PROGRAM_ID).map((tab) => tab.href),
        ...Object.values(ProgramTab).map((tab) =>
          misplacedTabHref(detail, PROGRAM_ID, tab),
        ),
      ]
        .filter((href): href is string => href !== null)
        .map(result.current.resolveHref);

      const outsideAdmin = hrefs.filter(
        (href) =>
          href !== ADMIN_PROGRAM && !href.startsWith(`${ADMIN_PROGRAM}/`),
      );
      const withoutPage = hrefs.filter((href) => !existsSync(pageFileOf(href)));

      expect(hrefs.length).toBeGreaterThan(0);
      expect(outsideAdmin).toEqual([]);
      expect(withoutPage).toEqual([]);
    },
  );
});
