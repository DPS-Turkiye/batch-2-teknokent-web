import { describe, expect, it } from "vitest";

import { AcademicFilter } from "@/interfaces/admin-academics";
import {
  academicCounts,
  academicDepartments,
  filterAcademics,
} from "@/lib/admin-academics";
import { ADMIN_ACADEMICS } from "@test/fixtures/admin-academics";

const names = (rows: { fullName: string }[]) => rows.map((row) => row.fullName);

describe("admin academics list", () => {
  it("counts each filter", () => {
    expect(academicCounts(ADMIN_ACADEMICS)).toEqual({
      [AcademicFilter.All]: 3,
      [AcademicFilter.SignedIn]: 2,
      [AcademicFilter.NotSignedIn]: 1,
      [AcademicFilter.Inactive]: 1,
    });
  });

  it("lists each department once, by Turkish order", () => {
    expect(academicDepartments(ADMIN_ACADEMICS)).toEqual([
      "Bilgisayar Mühendisliği",
      "Elektrik-Elektronik Mühendisliği",
    ]);
  });

  it("combines the filter, the department and the search", () => {
    const all = { filter: AcademicFilter.All, query: "", department: null };
    expect(names(filterAcademics(ADMIN_ACADEMICS, all))).toEqual([
      "Ali Demir",
      "Zeynep Kara",
      "Mert Aydın",
    ]);
    expect(
      names(
        filterAcademics(ADMIN_ACADEMICS, {
          ...all,
          filter: AcademicFilter.NotSignedIn,
        }),
      ),
    ).toEqual(["Zeynep Kara"]);
    expect(
      names(
        filterAcademics(ADMIN_ACADEMICS, {
          ...all,
          department: "Bilgisayar Mühendisliği",
        }),
      ),
    ).toEqual(["Ali Demir", "Mert Aydın"]);
    expect(
      names(filterAcademics(ADMIN_ACADEMICS, { ...all, query: " ZKARA " })),
    ).toEqual(["Zeynep Kara"]);
    expect(
      names(filterAcademics(ADMIN_ACADEMICS, { ...all, query: "ceng" })),
    ).toEqual(["Ali Demir", "Mert Aydın"]);
    expect(
      names(
        filterAcademics(ADMIN_ACADEMICS, {
          ...all,
          filter: AcademicFilter.Inactive,
          query: "ali",
        }),
      ),
    ).toEqual([]);
  });
});
