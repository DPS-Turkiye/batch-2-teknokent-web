import { clientText } from "@/i18n/client-texts";

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
    return clientText("phone.digits");
  }

  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+90") && digits.length !== 12) {
    return clientText("phone.turkey");
  }
  if (!phone.startsWith("+") && ![10, 11].includes(digits.length)) {
    return clientText("phone.local");
  }
  if (phone.startsWith("+") && (digits.length < 8 || digits.length > 15)) {
    return clientText("phone.international");
  }
  return null;
}
