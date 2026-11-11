import {
  ProfileAnalysisType,
  type ProfileAnalysis as Analysis,
} from "@/interfaces/profile-analysis";
import { isOneOf } from "@/lib/enum";

/** Largest pitch deck or CV the parser accepts. */
export const PROFILE_ANALYSIS_MAX_BYTES = 50 * 1024 * 1024;

export type EditableProfile = Record<string, string>;
type ProfileFieldKey =
  | "professional_summary"
  | "current_role"
  | "desired_role"
  | "industries"
  | "technologies"
  | "skills_to_develop"
  | "startup_name"
  | "startup_summary"
  | "stage"
  | "business_model"
  | "sectors"
  | "target_markets";
export type ProfileFieldDefinition = [ProfileFieldKey, "input" | "textarea"];
const INFERENCE_TYPES = ["EXPLICIT_RECOVERY", "DERIVED_CAPABILITY"] as const;
const INFERENCE_CONFIDENCES = ["HIGH", "MEDIUM"] as const;

type TechnologyInference = {
  tag: string;
  type: (typeof INFERENCE_TYPES)[number];
  confidence: (typeof INFERENCE_CONFIDENCES)[number];
  evidence: string;
};

export function list(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function profileFields(
  profileType: ProfileAnalysisType,
): ProfileFieldDefinition[] {
  return profileType === ProfileAnalysisType.Personal
    ? [
        ["professional_summary", "textarea"],
        ["current_role", "input"],
        ["desired_role", "input"],
        ["industries", "input"],
        ["technologies", "input"],
        ["skills_to_develop", "input"],
      ]
    : [
        ["startup_name", "input"],
        ["startup_summary", "textarea"],
        ["stage", "input"],
        ["business_model", "input"],
        ["sectors", "input"],
        ["target_markets", "input"],
        ["technologies", "input"],
      ];
}

function fieldText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

export function editableProfile(
  profile: Record<string, unknown>,
  profileType: ProfileAnalysisType,
): EditableProfile {
  return Object.fromEntries(
    profileFields(profileType).map(([key]) => [
      key,
      Array.isArray(profile[key])
        ? list(profile[key]).join(", ")
        : fieldText(profile[key]),
    ]),
  );
}

export function profilePayload(
  original: Record<string, unknown>,
  draft: EditableProfile,
  profileType: ProfileAnalysisType,
) {
  const listKeys = new Set(
    profileType === ProfileAnalysisType.Personal
      ? ["industries", "technologies", "skills_to_develop"]
      : ["sectors", "target_markets", "technologies"],
  );
  const payload: Record<string, unknown> = { ...original, ...draft };
  for (const key of listKeys) {
    const value = payload[key];
    if (typeof value !== "string") continue;
    payload[key] = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  const technologies = payload.technologies;
  const retainedTechnologies = new Set(
    Array.isArray(technologies)
      ? technologies.filter(
          (technology): technology is string => typeof technology === "string",
        )
      : [],
  );
  const inferences = payload.technology_inferences;
  if (Array.isArray(inferences)) {
    payload.technology_inferences = inferences.filter(
      (inference): inference is Record<string, unknown> => {
        if (!inference || typeof inference !== "object") return false;
        const record = inference as Record<string, unknown>;
        return (
          typeof record.tag === "string" && retainedTechnologies.has(record.tag)
        );
      },
    );
  }
  return payload;
}

export function technologyInferences(
  profile: Record<string, unknown>,
): TechnologyInference[] {
  const value = profile.technology_inferences;
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const { tag, type, confidence, evidence } = record;
    if (
      typeof tag !== "string" ||
      !isOneOf(INFERENCE_TYPES, type) ||
      !isOneOf(INFERENCE_CONFIDENCES, confidence) ||
      typeof evidence !== "string"
    ) {
      return [];
    }
    return [{ tag, type, confidence, evidence }];
  });
}

export function toProfileObject(
  profile: Analysis["profile"] | undefined,
): Record<string, unknown> {
  if (!profile) return {};
  if (typeof profile !== "string") return profile;
  try {
    const parsed: unknown = JSON.parse(profile);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
