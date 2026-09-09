const MAX_E164_DIGITS = 15;

export function normalizePhoneInput(value: string) {
  const trimmed = value.trimStart();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "").slice(0, MAX_E164_DIGITS);
  return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

export function phoneNumberError(value: string | null | undefined) {
  const phone = value?.trim() ?? "";
  if (!phone) return null;
  if (!/^\+?\d+$/.test(phone)) {
    return "Telefon numarası yalnızca rakamlardan oluşmalıdır.";
  }

  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+90") && digits.length !== 12) {
    return "Türkiye numarası +90'dan sonra 10 haneli olmalıdır.";
  }
  if (!phone.startsWith("+") && ![10, 11].includes(digits.length)) {
    return "Telefon numarası alan koduyla birlikte 10 veya 11 haneli olmalıdır.";
  }
  if (phone.startsWith("+") && (digits.length < 8 || digits.length > 15)) {
    return "Uluslararası telefon numarası 8–15 haneli olmalıdır.";
  }
  return null;
}
