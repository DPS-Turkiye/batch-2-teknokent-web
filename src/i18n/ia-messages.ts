import { Locale } from "@/lib/i18n";
import academicianEn from "@/messages/ia/academician/en.json";
import academicianTr from "@/messages/ia/academician/tr.json";
import coordinatorEn from "@/messages/ia/coordinator/en.json";
import coordinatorTr from "@/messages/ia/coordinator/tr.json";
import iskurReportsEn from "@/messages/ia/iskur-reports/en.json";
import iskurReportsTr from "@/messages/ia/iskur-reports/tr.json";
import iskurEn from "@/messages/ia/iskur/en.json";
import iskurTr from "@/messages/ia/iskur/tr.json";
import kitEn from "@/messages/ia/kit/en.json";
import kitTr from "@/messages/ia/kit/tr.json";
import profileEn from "@/messages/ia/profile/en.json";
import profileTr from "@/messages/ia/profile/tr.json";
import studentEn from "@/messages/ia/student/en.json";
import studentTr from "@/messages/ia/student/tr.json";
import tourEn from "@/messages/ia/tour/en.json";
import tourTr from "@/messages/ia/tour/tr.json";

/**
 * The IA Revizyon screens keep their copy in one catalog pair per screen group, so parallel work on the groups
 * never edits the same file. Each pair is one top-level namespace.
 */
const TR_CATALOGS = {
  iaKit: kitTr,
  iaStudent: studentTr,
  iaIskur: iskurTr,
  iaIskurReports: iskurReportsTr,
  iaAcademician: academicianTr,
  iaCoordinator: coordinatorTr,
  iaProfile: profileTr,
  iaTour: tourTr,
};

/** Each catalog's Turkish shape; English must match it key for key. */
export type IaMessages = typeof TR_CATALOGS;

export const IA_MESSAGES: Record<Locale, IaMessages> = {
  [Locale.Tr]: TR_CATALOGS,
  [Locale.En]: {
    iaKit: kitEn,
    iaStudent: studentEn,
    iaIskur: iskurEn,
    iaIskurReports: iskurReportsEn,
    iaAcademician: academicianEn,
    iaCoordinator: coordinatorEn,
    iaProfile: profileEn,
    iaTour: tourEn,
  },
};
