import { ProfileAnalysisType } from "@/interfaces/profile-analysis";
import type {
  ProfileAnalysis as Analysis,
  ProfileType,
} from "@/interfaces/profile-analysis";

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
type TechnologyInference = {
  tag: string;
  type: "EXPLICIT_RECOVERY" | "DERIVED_CAPABILITY";
  confidence: "HIGH" | "MEDIUM";
  evidence: string;
};

export function list(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function profileFields(
  profileType: ProfileType,
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

export function editableProfile(
  profile: Record<string, unknown>,
  profileType: ProfileType,
): EditableProfile {
  return Object.fromEntries(
    profileFields(profileType).map(([key]) => [
      key,
      Array.isArray(profile[key])
        ? list(profile[key]).join(", ")
        : String(profile[key] ?? ""),
    ]),
  );
}

export function profilePayload(
  original: Record<string, unknown>,
  draft: EditableProfile,
  profileType: ProfileType,
) {
  const listKeys = new Set(
    profileType === ProfileAnalysisType.Personal
      ? ["industries", "technologies", "skills_to_develop"]
      : ["sectors", "target_markets", "technologies"],
  );
  const payload = Object.fromEntries(
    Object.entries({ ...original, ...draft }).map(([key, value]) => [
      key,
      listKeys.has(key) && typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : value,
    ]),
  );
  const retainedTechnologies = new Set(
    Array.isArray(payload.technologies)
      ? payload.technologies.filter(
          (technology): technology is string => typeof technology === "string",
        )
      : [],
  );
  if (Array.isArray(payload.technology_inferences)) {
    payload.technology_inferences = payload.technology_inferences.filter(
      (inference) =>
        inference &&
        typeof inference === "object" &&
        "tag" in inference &&
        typeof inference.tag === "string" &&
        retainedTechnologies.has(inference.tag),
    );
  }
  return payload;
}

export function technologyInferences(
  profile: Record<string, unknown>,
): TechnologyInference[] {
  if (!Array.isArray(profile.technology_inferences)) return [];
  return profile.technology_inferences.filter(
    (item): item is TechnologyInference =>
      Boolean(item) &&
      typeof item === "object" &&
      "tag" in item &&
      typeof item.tag === "string" &&
      "type" in item &&
      (item.type === "EXPLICIT_RECOVERY" ||
        item.type === "DERIVED_CAPABILITY") &&
      "confidence" in item &&
      (item.confidence === "HIGH" || item.confidence === "MEDIUM") &&
      "evidence" in item &&
      typeof item.evidence === "string",
  );
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
