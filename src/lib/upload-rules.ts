import { DocumentKind } from "@/interfaces/startup-document";
import { DOCUMENT_MAX_BYTES } from "@/lib/const";
import { PROFILE_PHOTO_MAX_BYTES } from "@/lib/personal-profile";
import { UploadFileType, UploadProblem } from "@/types/upload";

/** Extensions and MIME types per format, as the backend's DocumentService checks them. */
const FILE_TYPES: Record<
  UploadFileType,
  { extensions: readonly string[]; mimeTypes: readonly string[] }
> = {
  [UploadFileType.Pdf]: {
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
  },
  [UploadFileType.Docx]: {
    extensions: ["docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  [UploadFileType.Xlsx]: {
    extensions: ["xlsx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  [UploadFileType.Pptx]: {
    extensions: ["pptx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  [UploadFileType.Png]: { extensions: ["png"], mimeTypes: ["image/png"] },
  [UploadFileType.Jpeg]: {
    extensions: ["jpg", "jpeg"],
    mimeTypes: ["image/jpeg"],
  },
  [UploadFileType.Webp]: { extensions: ["webp"], mimeTypes: ["image/webp"] },
};

// The backend reads the type from the extension when the browser sends none of its own.
const UNTYPED_MIME_TYPES = new Set(["", "application/octet-stream"]);

const VIDEO_EXTENSIONS = new Set([
  "3gp",
  "avi",
  "flv",
  "m4v",
  "mkv",
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "webm",
  "wmv",
]);

export interface UploadRule {
  types: readonly UploadFileType[];
  maxBytes: number;
  /** The field sits beside a link input, so a video is pointed there. */
  videoAsLink?: boolean;
}

/** The document kinds a sign-up or onboarding screen uploads. */
export type OnboardingUploadKind =
  | DocumentKind.Cv
  | DocumentKind.Canvas
  | DocumentKind.PitchDeck
  | DocumentKind.Mvp
  | DocumentKind.Logo
  | DocumentKind.Avatar;

const IMAGE_RULE: UploadRule = {
  types: [UploadFileType.Png, UploadFileType.Jpeg, UploadFileType.Webp],
  maxBytes: PROFILE_PHOTO_MAX_BYTES,
};

/**
 * Each onboarding field's formats and size. Sizes are the backend's DocumentKind limits. The backend takes PDF, DOCX,
 * XLSX and PPTX for every document kind; each field offers the formats that make sense for it, never one the backend
 * refuses. The backend stays the gate: this only spares the person a failed upload.
 */
export const ONBOARDING_UPLOAD_RULES: Record<OnboardingUploadKind, UploadRule> =
  {
    [DocumentKind.Cv]: {
      types: [UploadFileType.Pdf, UploadFileType.Docx],
      maxBytes: DOCUMENT_MAX_BYTES,
    },
    [DocumentKind.Canvas]: {
      types: [UploadFileType.Pdf, UploadFileType.Docx],
      maxBytes: DOCUMENT_MAX_BYTES,
    },
    [DocumentKind.PitchDeck]: {
      types: [UploadFileType.Pdf, UploadFileType.Pptx],
      maxBytes: DOCUMENT_MAX_BYTES,
    },
    [DocumentKind.Mvp]: {
      types: [UploadFileType.Pdf, UploadFileType.Docx, UploadFileType.Pptx],
      maxBytes: DOCUMENT_MAX_BYTES,
      videoAsLink: true,
    },
    [DocumentKind.Logo]: IMAGE_RULE,
    [DocumentKind.Avatar]: IMAGE_RULE,
  };

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** The `accept` attribute for a rule: extensions for desktop pickers, MIME types for mobile ones. */
export function uploadAccept(rule: UploadRule) {
  return rule.types
    .flatMap((type) => [
      ...FILE_TYPES[type].extensions.map((extension) => `.${extension}`),
      ...FILE_TYPES[type].mimeTypes,
    ])
    .join(",");
}

/** Why the backend would refuse a picked file under this rule, or null when it can be sent. */
export function uploadProblem(
  file: { name: string; size: number; type: string },
  rule: UploadRule,
): UploadProblem | null {
  const extension = extensionOf(file.name);
  const mimeType = file.type.toLowerCase();
  const matched = rule.types.find((type) =>
    FILE_TYPES[type].extensions.includes(extension),
  );
  if (!matched) {
    const video =
      mimeType.startsWith("video/") || VIDEO_EXTENSIONS.has(extension);
    return video && rule.videoAsLink
      ? UploadProblem.VideoAsLink
      : UploadProblem.WrongType;
  }
  if (
    !UNTYPED_MIME_TYPES.has(mimeType) &&
    !FILE_TYPES[matched].mimeTypes.includes(mimeType)
  ) {
    return UploadProblem.WrongType;
  }
  if (file.size === 0) return UploadProblem.Empty;
  if (file.size > rule.maxBytes) return UploadProblem.TooLarge;
  return null;
}

/** "PDF veya DOCX", "PDF, DOCX veya PPTX": the rule's formats for a hint or an error message. */
export function uploadTypesLabel(rule: UploadRule, locale: string) {
  return new Intl.ListFormat(locale, { type: "disjunction" }).format(
    rule.types,
  );
}
