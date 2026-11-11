import { Locale } from "@/lib/i18n";
import academicianEn from "@/messages/ia/academician/en.json";
import academicianTr from "@/messages/ia/academician/tr.json";
import coordinatorEn from "@/messages/ia/coordinator/en.json";
import coordinatorTr from "@/messages/ia/coordinator/tr.json";
import iskurEn from "@/messages/ia/iskur/en.json";
import iskurTr from "@/messages/ia/iskur/tr.json";
import kitEn from "@/messages/ia/kit/en.json";
import kitTr from "@/messages/ia/kit/tr.json";
import studentEn from "@/messages/ia/student/en.json";
import studentTr from "@/messages/ia/student/tr.json";
import tourEn from "@/messages/ia/tour/en.json";
import tourTr from "@/messages/ia/tour/tr.json";

/**
 * The IA Revizyon screens keep their copy in one catalog pair per screen group, so parallel work on the groups
 * never edits the same file. Each pair is one top-level namespace.
 */
export const IA_MESSAGES = {
  [Locale.Tr]: {
    iaKit: kitTr,
    iaStudent: studentTr,
    iaIskur: iskurTr,
    iaAcademician: academicianTr,
    iaCoordinator: coordinatorTr,
    iaTour: tourTr,
  },
  [Locale.En]: {
    iaKit: kitEn,
    iaStudent: studentEn,
    iaIskur: iskurEn,
    iaAcademician: academicianEn,
    iaCoordinator: coordinatorEn,
    iaTour: tourEn,
  },
};

export type IaMessages = (typeof IA_MESSAGES)[Locale.Tr];
