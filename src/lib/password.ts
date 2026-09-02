import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "@/interfaces/auth";

export const PASSWORD_HINT =
  "En az 8 karakter; büyük harf, küçük harf, rakam ve özel karakter kullanın.";

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`,
  )
  .regex(/\p{Ll}/u, "Şifre en az bir küçük harf içermeli.")
  .regex(/\p{Lu}/u, "Şifre en az bir büyük harf içermeli.")
  .regex(/\d/, "Şifre en az bir rakam içermeli.")
  .regex(
    /[^\p{L}\p{N}]/u,
    "Şifre en az bir özel karakter içermeli (!, ?, #, @ gibi).",
  );

export function passwordStrengthError(password: string): string | null {
  if (!password) return null;
  const parsed = passwordSchema.safeParse(password);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
}
