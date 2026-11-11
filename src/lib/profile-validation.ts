import { z } from "zod";

import { clientText } from "@/i18n/client-texts";
import {
  StartupFundingStage,
  type StartupProfileInput,
} from "@/interfaces/organization";
import type { UserProfileInput } from "@/interfaces/user-profile";
import { isEnumValue } from "@/lib/enum";
import { phoneNumberError } from "@/lib/phone";

type FieldErrors<T extends object> = Partial<Record<keyof T, string>>;

/** The founding year as typed: digits only, and an empty field clears it. */
export function toFoundedYear(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** The funding stage a select sends back; its empty option clears it. */
export function toFundingStage(value: string) {
  return isEnumValue(StartupFundingStage, value) ? value : null;
}

type ProfileField = Parameters<typeof fieldLabel>[0];

function fieldLabel(
  field:
    | "fullName"
    | "jobTitle"
    | "phone"
    | "bio"
    | "linkedinUrl"
    | "expertise"
    | "startupName"
    | "description"
    | "website"
    | "problem"
    | "solution"
    | "currentSolution"
    | "targetUser"
    | "sector"
    | "maturity"
    | "programLevel"
    | "supportArea",
) {
  return clientText(`profile.fields.${field}`);
}

function tooLong(field: ProfileField, max: number) {
  return clientText("profile.tooLong", { label: fieldLabel(field), max });
}

const optionalText = (field: ProfileField, max: number) =>
  z.string().max(max, tooLong(field, max)).nullable();

// Built per call: the messages come from the active language, which is set after this module loads.
const personalProfileSchema = () =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(1, clientText("profile.fullNameRequired"))
      .max(255, tooLong("fullName", 255)),
    jobTitle: optionalText("jobTitle", 255),
    phone: optionalText("phone", 32).superRefine((value, context) => {
      const error = phoneNumberError(value);
      if (error) context.addIssue({ code: "custom", message: error });
    }),
    bio: optionalText("bio", 5000),
    linkedinUrl: optionalText("linkedinUrl", 255),
    expertise: z.array(z.string().max(255, tooLong("expertise", 255))),
  });

const startupProfileSchema = () =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, clientText("profile.startupNameRequired"))
      .max(255, tooLong("startupName", 255)),
    description: optionalText("description", 5000),
    website: optionalText("website", 255),
    problem: optionalText("problem", 5000),
    solution: optionalText("solution", 5000),
    currentSolution: optionalText("currentSolution", 5000),
    targetUser: optionalText("targetUser", 5000),
    sector: optionalText("sector", 255),
    maturity: optionalText("maturity", 255),
    programLevel: optionalText("programLevel", 255),
    supportAreas: z.array(z.string().max(255, tooLong("supportArea", 255))),
    fundingStage: z.enum(StartupFundingStage).nullable(),
    foundedYear: z
      .number()
      .int(clientText("profile.foundedYearInteger"))
      .min(1900, clientText("profile.foundedYearRange"))
      .max(2100, clientText("profile.foundedYearRange"))
      .nullable(),
  });

function fieldErrors<T extends object>(result: z.ZodSafeParseResult<T>) {
  if (result.success) return {};
  return result.error.issues.reduce<FieldErrors<T>>((errors, issue) => {
    const field = issue.path[0] as keyof T | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

export function validatePersonalProfile(draft: UserProfileInput) {
  return fieldErrors<UserProfileInput>(
    personalProfileSchema().safeParse(draft),
  );
}

export function validateStartupProfile(draft: StartupProfileInput) {
  return fieldErrors<StartupProfileInput>(
    startupProfileSchema().safeParse(draft),
  );
}
