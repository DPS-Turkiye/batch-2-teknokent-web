"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";

import { type RegisterForm } from "@/interfaces/auth";
import { emailCharacterError } from "@/lib/email";
import { ClientApiError } from "@/lib/client/api";
import { describeAuthError } from "@/lib/firebase/auth";
import { passwordStrengthError } from "@/lib/password";
import { normalizePhoneInput, phoneNumberError } from "@/lib/phone";

export function useRegisterForm(
  onSubmit?: (form: RegisterForm) => Promise<void>,
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  const passwordStrengthErrorMessage = passwordStrengthError(form.password);
  const phoneErrorMessage = phoneNumberError(form.phone);

  const updatePhone = useCallback((value: string) => {
    setForm((current) => ({
      ...current,
      phone: normalizePhoneInput(value),
    }));
  }, []);

  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const emailCharacterErrorMessage = emailCharacterError(form.email);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        !emailCharacterErrorMessage &&
        form.phone.trim() &&
        !phoneErrorMessage &&
        form.password.trim() &&
        !passwordStrengthErrorMessage &&
        form.password === form.passwordConfirm,
      ),
    [
      form,
      emailCharacterErrorMessage,
      passwordStrengthErrorMessage,
      phoneErrorMessage,
    ],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit || !canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : describeAuthError(caught),
      );
      setSubmitting(false);
    }
  }

  return {
    form,
    update,
    updatePhone,
    canSubmit,
    passwordStrengthErrorMessage,
    passwordsMismatch,
    emailCharacterErrorMessage,
    phoneErrorMessage,
    submitting,
    error,
    submit,
  };
}
