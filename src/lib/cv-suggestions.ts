import type { CvParseResult } from "@/hooks/use-cv-parse";

export type CvProfileFields = {
  role: string;
  bio: string;
  expertise: string[];
};

/**
 * Signup keeps whatever the person already typed. On the profile page they
 * asked for the CV explicitly and can still Vazgeç, so there it replaces the
 * role and bio. Expertise is only ever added to.
 */
export function applyCvParse(
  fields: CvProfileFields,
  parsed: CvParseResult,
  { keepFilled, bioMaxLength }: { keepFilled: boolean; bioMaxLength: number },
): CvProfileFields {
  const pick = (current: string, next: string) =>
    next && !(keepFilled && current.trim()) ? next : current;

  return {
    role: pick(fields.role, parsed.role),
    bio: pick(fields.bio, parsed.summary.slice(0, bioMaxLength)),
    expertise: [
      ...fields.expertise,
      ...parsed.expertise.filter((value) => !fields.expertise.includes(value)),
    ],
  };
}
