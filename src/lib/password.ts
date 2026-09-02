import { PASSWORD_MIN_LENGTH } from "@/interfaces/auth";

export const PASSWORD_HINT =
  "En az 8 karakter; büyük harf, küçük harf, rakam ve özel karakter kullanın.";

export function passwordStrengthError(password: string): string | null {
  if (!password) return null;
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`;
  }
  if (!/\p{Ll}/u.test(password)) {
    return "Şifre en az bir küçük harf içermeli.";
  }
  if (!/\p{Lu}/u.test(password)) {
    return "Şifre en az bir büyük harf içermeli.";
  }
  if (!/\d/.test(password)) {
    return "Şifre en az bir rakam içermeli.";
  }
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return "Şifre en az bir özel karakter içermeli (!, ?, #, @ gibi).";
  }
  return null;
}
