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
