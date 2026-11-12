const TURKISH_LETTERS = /[ıİşŞğĞüÜöÖçÇ]/;

export const EMAIL_TURKISH_CHAR_MESSAGE =
  "E-posta adresinde ı, ş, ğ, ü, ö, ç kullanılamaz. İngilizce harf yazın (ı yerine i).";

/** Firebase and the login field treat ı and i as different addresses. */
export function emailCharacterError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (TURKISH_LETTERS.test(trimmed)) return EMAIL_TURKISH_CHAR_MESSAGE;
  return null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A comma-separated domain list ("metu.edu.tr, @odtu.edu.tr") as bare lowercase domains. */
export function parseEmailDomains(raw: string | undefined): string[] {
  const domains = (raw ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return [...new Set(domains)];
}

/** Mirrors the backend's EmailDomainPolicy: no domains means anyone; subdomains count. */
export function isAllowedEmailDomain(
  email: string,
  domains: readonly string[],
): boolean {
  if (domains.length === 0) return true;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export function formatEmailDomains(domains: readonly string[]): string {
  return domains.map((domain) => `@${domain}`).join(", ");
}
