import { act, renderHook } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { describe, expect, it, vi } from "vitest";

import { useRegisterForm } from "@/hooks/use-auth-form";
import { formSubmitEvent } from "@test/fixtures/form-events";

const STRONG_PASSWORD = "Sifre1234!";

describe("useRegisterForm", () => {
  function fillValid(result: { current: ReturnType<typeof useRegisterForm> }) {
    act(() => {
      result.current.update("firstName", "Gülse");
      result.current.update("lastName", "Buran");
      result.current.update("email", "gulse@dongu.co");
      result.current.update("phone", "+905551112233");
      result.current.update("password", STRONG_PASSWORD);
      result.current.update("passwordConfirm", STRONG_PASSWORD);
    });
  }

  it("enables submission only when every field is valid", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.canSubmit).toBe(false);
    fillValid(result);
    expect(result.current.canSubmit).toBe(true);
  });

  it("flags a weak password, but not while empty", () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.passwordStrengthErrorMessage).toBeNull();

    act(() => result.current.update("password", "kisa"));
    expect(result.current.passwordStrengthErrorMessage).toMatch(/en az 8/);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.update("password", STRONG_PASSWORD));
    expect(result.current.passwordStrengthErrorMessage).toBeNull();
  });

  it("refuses a long password that is still missing a symbol", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => {
      result.current.update("password", "sifre1234");
      result.current.update("passwordConfirm", "sifre1234");
    });
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.passwordStrengthErrorMessage).toMatch(
      /büyük harf|özel karakter/,
    );
  });

  it("flags mismatched passwords only once the confirmation is typed", () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => result.current.update("password", STRONG_PASSWORD));
    expect(result.current.passwordsMismatch).toBe(false);

    act(() => result.current.update("passwordConfirm", "Sifre12"));
    expect(result.current.passwordsMismatch).toBe(true);

    act(() => result.current.update("passwordConfirm", STRONG_PASSWORD));
    expect(result.current.passwordsMismatch).toBe(false);
  });

  it("refuses submission when the passwords do not match", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => result.current.update("passwordConfirm", "BaskaSifre1!"));
    expect(result.current.canSubmit).toBe(false);
  });

  it("refuses an email that contains ı or other Turkish letters", () => {
    const { result } = renderHook(() => useRegisterForm());
    fillValid(result);

    act(() => result.current.update("email", "süde@gmail.com"));
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.emailCharacterErrorMessage).toMatch(/ı yerine i/);
  });

  it("accepts any address when the deployment sets no domain", () => {
    const { result } = renderHook(() => useRegisterForm(undefined, []));
    fillValid(result);

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.allowedEmailDomains).toBe("");
    expect(result.current.emailDomainNotAllowed).toBe(false);
  });

  it("only takes an address from the deployment's domains", () => {
    const { result } = renderHook(() =>
      useRegisterForm(undefined, ["metu.edu.tr"]),
    );
    fillValid(result);

    expect(result.current.allowedEmailDomains).toBe("@metu.edu.tr");
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.emailDomainNotAllowed).toBe(true);

    act(() => result.current.update("email", "e123456@metu.edu.tr"));
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.emailDomainNotAllowed).toBe(false);
  });

  it("does not flag the domain while the address is half typed", () => {
    const { result } = renderHook(() =>
      useRegisterForm(undefined, ["metu.edu.tr"]),
    );

    act(() => result.current.update("email", "e123456@metu"));
    expect(result.current.emailDomainNotAllowed).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  it("blocks invalid submission and prevents the browser navigation", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useRegisterForm(onSubmit));
    const event = formSubmitEvent();

    await act(() => result.current.submit(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it("keeps submission disabled while account creation is pending", async () => {
    let resolve!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { result } = renderHook(() => useRegisterForm(onSubmit));
    fillValid(result);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit(formSubmitEvent());
    });

    expect(result.current.submitting).toBe(true);
    await act(() => result.current.submit(formSubmitEvent()));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve();
      await pending;
    });
  });

  it("reports Firebase errors and lets the user retry without losing fields", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(
        new FirebaseError("auth/email-already-in-use", "Firebase error"),
      )
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useRegisterForm(onSubmit));
    fillValid(result);

    await act(() => result.current.submit(formSubmitEvent()));

    expect(result.current.error).not.toBe("");
    expect(result.current.error).not.toBe("Firebase error");
    expect(result.current.submitting).toBe(false);
    expect(result.current.form.email).toBe("gulse@dongu.co");
    await act(() => result.current.submit(formSubmitEvent()));
    expect(result.current.error).toBe("");
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
