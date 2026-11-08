import type { AdminAcademic } from "@/interfaces/admin-academics";

export function adminAcademic(
  overrides: Partial<AdminAcademic> = {},
): AdminAcademic {
  return {
    personId: "p-ali",
    userId: "u-ali",
    fullName: "Ali Demir",
    email: "ali.demir@metu.edu.tr",
    academicTitle: "Doç. Dr.",
    faculty: "Mühendislik Fakültesi",
    departmentCode: "CENG",
    departmentName: "Bilgisayar Mühendisliği",
    active: true,
    signedIn: true,
    lastLoginAt: "2026-11-07T09:00:00Z",
    adviseeCount: 3,
    ...overrides,
  };
}

export const ADMIN_ACADEMICS: AdminAcademic[] = [
  adminAcademic(),
  adminAcademic({
    personId: "p-zeynep",
    userId: null,
    fullName: "Zeynep Kara",
    email: "zkara@metu.edu.tr",
    academicTitle: "Prof. Dr.",
    departmentCode: "EE",
    departmentName: "Elektrik-Elektronik Mühendisliği",
    signedIn: false,
    lastLoginAt: null,
    adviseeCount: 0,
  }),
  adminAcademic({
    personId: "p-mert",
    userId: "u-mert",
    fullName: "Mert Aydın",
    email: "maydin@metu.edu.tr",
    academicTitle: null,
    departmentCode: "CENG",
    active: false,
    adviseeCount: 1,
  }),
];
