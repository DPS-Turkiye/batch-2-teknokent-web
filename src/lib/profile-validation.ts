import { z } from "zod";

import {
  StartupFundingStage,
  type StartupProfileInput,
} from "@/interfaces/organization";
import type { UserProfileInput } from "@/interfaces/user-profile";
import { phoneNumberError } from "@/lib/phone";

type FieldErrors<T extends object> = Partial<Record<keyof T, string>>;

/** The founding year as typed: digits only, and an empty field clears it. */
export function toFoundedYear(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** The funding stage a select sends back; its empty option clears it. */
export function toFundingStage(value: string) {
  return (
    Object.values(StartupFundingStage).find((stage) => stage === value) ?? null
  );
}

const optionalText = (label: string, max: number) =>
  z.string().max(max, `${label} en fazla ${max} karakter olabilir.`).nullable();

const personalProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Ad soyad zorunludur.")
    .max(255, "Ad soyad en fazla 255 karakter olabilir."),
  jobTitle: optionalText("Rol", 255),
  phone: optionalText("Telefon", 32).superRefine((value, context) => {
    const error = phoneNumberError(value);
    if (error) context.addIssue({ code: "custom", message: error });
  }),
  bio: optionalText("Kısa tanıtım", 5000),
  linkedinUrl: optionalText("LinkedIn", 255),
  expertise: z.array(
    z.string().max(255, "Uzmanlık alanı en fazla 255 karakter olabilir."),
  ),
});

const startupProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Startup adı zorunludur.")
    .max(255, "Startup adı en fazla 255 karakter olabilir."),
  description: optionalText("Tek satırlık tanım", 5000),
  website: optionalText("Web sitesi", 255),
  problem: optionalText("Problem", 5000),
  solution: optionalText("Çözüm", 5000),
  currentSolution: optionalText("Mevcut çözüm", 5000),
  targetUser: optionalText("Hedef kullanıcı", 5000),
  sector: optionalText("Sektör", 255),
  maturity: optionalText("Aşama", 255),
  programLevel: optionalText("Program seviyesi", 255),
  supportAreas: z.array(
    z.string().max(255, "Destek alanı en fazla 255 karakter olabilir."),
  ),
  fundingStage: z.enum(StartupFundingStage).nullable(),
  foundedYear: z
    .number()
    .int("Kuruluş yılı tam sayı olmalıdır.")
    .min(1900, "Kuruluş yılı 1900 ile 2100 arasında olmalıdır.")
    .max(2100, "Kuruluş yılı 1900 ile 2100 arasında olmalıdır.")
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
  return fieldErrors<UserProfileInput>(personalProfileSchema.safeParse(draft));
}

export function validateStartupProfile(draft: StartupProfileInput) {
  return fieldErrors<StartupProfileInput>(
    startupProfileSchema.safeParse(draft),
  );
}
