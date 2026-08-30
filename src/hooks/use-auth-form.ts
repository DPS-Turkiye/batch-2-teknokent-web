"use client";

import { useCallback, useMemo, useState } from "react";

import { PASSWORD_MIN_LENGTH, type RegisterForm } from "@/interfaces/auth";

export function useRegisterForm() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const update = useCallback(
    <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) =>
      setForm((current) => ({ ...current, [key]: value })),
    [],
  );

  const passwordTooShort =
    form.password.length > 0 && form.password.length < PASSWORD_MIN_LENGTH;

  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        form.phone.trim() &&
        form.password.length >= PASSWORD_MIN_LENGTH &&
        form.password === form.passwordConfirm,
      ),
    [form],
  );

  return { form, update, canSubmit, passwordTooShort, passwordsMismatch };
}
