import { describe, expect, it } from "vitest";

import { AccountType } from "@/interfaces/account-type";
import { IdentityKind, UserRole } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import {
  accountTypeOfSession,
  isAccountType,
  mergeMessages,
  resolveAccountType,
} from "@/lib/account-type";
import enBase from "@/messages/en.json";
import odtuEn from "@/messages/odtu/en.json";
import odtuTr from "@/messages/odtu/tr.json";
import trBase from "@/messages/tr.json";

/** Every text's dotted path in a messages file. */
function leafPaths(tree: object, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]: [string, unknown]) =>
    typeof value === "object" && value !== null
      ? leafPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("resolveAccountType", () => {
  it("keeps everyone on Teknokent unless ODTÜ was chosen", () => {
    expect(resolveAccountType(undefined)).toBe(AccountType.Teknokent);
    expect(resolveAccountType(null)).toBe(AccountType.Teknokent);
    expect(resolveAccountType("iskur")).toBe(AccountType.Teknokent);
    expect(resolveAccountType("odtu")).toBe(AccountType.Odtu);
    expect(resolveAccountType("teknokent")).toBe(AccountType.Teknokent);
  });

  it("recognises only the known account types", () => {
    expect(isAccountType("odtu")).toBe(true);
    expect(isAccountType("ODTU")).toBe(false);
    expect(isAccountType(1)).toBe(false);
  });
});

describe("accountTypeOfSession", () => {
  const student = {
    userId: "u-1",
    email: "ayse@odtu-dev.invalid",
    fullName: "Ayşe",
    jobTitle: "Mentee",
    role: UserRole.Mentee,
    institutionKinds: [IdentityKind.Student],
  };

  it("uses the ODTÜ wording in an ODTÜ workspace and Teknokent's elsewhere", () => {
    expect(accountTypeOfSession(student)).toBe(AccountType.Odtu);
    expect(accountTypeOfSession({ ...student, institutionKinds: [] })).toBe(
      AccountType.Teknokent,
    );
    // A student who is also on a startup team, switched to the Girişim workspace.
    expect(
      accountTypeOfSession({
        ...student,
        organizationId: "org-1",
        activeWorkspace: Workspace.GirisimMentee,
      }),
    ).toBe(AccountType.Teknokent);
  });
});

describe("mergeMessages", () => {
  it("replaces only the texts the overlay names and keeps the rest", () => {
    const base = {
      roleSelect: { mentor: "Mentor", mentee: "Mentee" },
      nav: { home: "Ana sayfa" },
    };
    const merged = mergeMessages(base, {
      roleSelect: { mentor: "Akademisyen" },
    });
    expect(merged).toEqual({
      roleSelect: { mentor: "Akademisyen", mentee: "Mentee" },
      nav: { home: "Ana sayfa" },
    });
    expect(base.roleSelect.mentor).toBe("Mentor");
  });
});

describe("ODTÜ overlay files", () => {
  it("only override texts that exist in the base messages", () => {
    const trKeys = new Set(leafPaths(trBase));
    const enKeys = new Set(leafPaths(enBase));
    expect(leafPaths(odtuTr).filter((key) => !trKeys.has(key))).toEqual([]);
    expect(leafPaths(odtuEn).filter((key) => !enKeys.has(key))).toEqual([]);
  });

  it("override the same texts in Turkish and English", () => {
    expect(leafPaths(odtuEn).sort()).toEqual(leafPaths(odtuTr).sort());
  });
});
