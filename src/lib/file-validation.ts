import { UPLOAD_ERROR_MESSAGES } from "@/lib/upload-error-messages";

const TEN_MB = 10 * 1024 * 1024;
const FIFTY_MB = 50 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type FilePolicy = {
  maxBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  typeLabel: string;
};

const DOCUMENT_POLICY: FilePolicy = {
  maxBytes: TEN_MB,
  allowedExtensions: ["pdf", "docx"],
  allowedMimeTypes: [PDF_MIME, DOCX_MIME],
  typeLabel: "PDF veya DOCX",
};

const PROFILE_PDF_POLICY: FilePolicy = {
  maxBytes: FIFTY_MB,
  allowedExtensions: ["pdf"],
  allowedMimeTypes: [PDF_MIME],
  typeLabel: "PDF",
};

export function formatLimitMb(bytes: number): number {
  return Math.floor(bytes / (1024 * 1024));
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function validateFileAgainstPolicy(
  file: File,
  policy: FilePolicy,
): string | null {
  const extension = extensionOf(file.name);
  const mime = (file.type || "").toLowerCase();

  if (!policy.allowedExtensions.includes(extension)) {
    return UPLOAD_ERROR_MESSAGES.unsupportedType(policy.typeLabel);
  }

  if (file.size > policy.maxBytes) {
    return UPLOAD_ERROR_MESSAGES.tooLarge(formatLimitMb(policy.maxBytes));
  }

  // Some browsers may omit MIME for unknown files; extension check above remains authoritative.
  if (mime && !policy.allowedMimeTypes.includes(mime)) {
    return UPLOAD_ERROR_MESSAGES.invalidContent(policy.typeLabel);
  }

  return null;
}

export function validateDocumentUploadFile(file: File): string | null {
  return validateFileAgainstPolicy(file, DOCUMENT_POLICY);
}

export function validateProfilePdfFile(file: File): string | null {
  return validateFileAgainstPolicy(file, PROFILE_PDF_POLICY);
}
