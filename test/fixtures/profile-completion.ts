import { StudyLevel, type InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind } from "@/interfaces/session";
import { DocumentKind } from "@/interfaces/startup-document";
import type { StoredDocument } from "@/lib/client/documents";

/** An ODTÜ student's institution record as the profile-completion wizard reads it. */
export const STUDENT_RECORD: InstitutionRecord = {
  kinds: [IdentityKind.Student],
  fullName: "Ayşe Yılmaz",
  email: "ayse.yilmaz@odtu-dev.invalid",
  faculty: "Mühendislik Fakültesi",
  departmentName: "Endüstri Mühendisliği",
  classYear: 3,
  programLevel: StudyLevel.Bachelor,
  academicTitle: null,
  iskurParticipant: false,
  advisor: { userId: null, fullName: "Elif Şahin", academicTitle: "Doç. Dr." },
  syncedAt: "2026-11-08T09:00:00Z",
};

export const STUDENT_AVATAR: StoredDocument = {
  id: "avatar-1",
  kind: DocumentKind.Avatar,
  originalFilename: "me.png",
  sizeBytes: 10,
};
