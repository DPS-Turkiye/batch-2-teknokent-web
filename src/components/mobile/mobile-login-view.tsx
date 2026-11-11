"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { OtgLoginButton } from "@/components/login/otg-login-button";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import {
  MobileButton,
  MobileButtonLink,
} from "@/components/mobile/mobile-button";
import { MobileLoginSheet, useMobileLogin } from "@/hooks/use-mobile-login";
import { MobileButtonVariant } from "@/interfaces/mobile";
import { SIGNUP_ON_WEB_HREF } from "@/lib/mobile";

const LABEL_CLASS = "text-[13.5px] leading-[1.35] font-medium text-[#22262b]";
// A focused field gets the frame's 1.5px dark border; the input itself shows no outline.
const FIELD_CLASS =
  "flex h-[52px] w-full items-center gap-2.5 rounded-2xl border bg-white px-4 focus-within:border-[1.5px] focus-within:border-[#22262b]";
const INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-[15px] leading-[1.35] text-[#22262b] outline-none focus-visible:outline-none! placeholder:text-[#aeb4bc]";

function BrandVisual() {
  return (
    <div
      className="relative h-[300px] overflow-hidden bg-[#fbf8f6]"
      aria-hidden="true"
    >
      <div className="absolute top-[-90px] left-[-60px] size-[300px]">
        <Image
          src="/mobile/brand-glow-warm.svg"
          alt=""
          width={460}
          height={460}
          className="absolute inset-[-26.67%] max-w-none"
          priority
        />
      </div>
      <div className="absolute top-[-40px] right-[-60px] size-[280px]">
        <Image
          src="/mobile/brand-glow-cool.svg"
          alt=""
          width={440}
          height={440}
          className="absolute inset-[-28.57%] max-w-none"
          priority
        />
      </div>
      <div className="absolute inset-x-0 top-[160px] h-[140px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-white" />
      <p className="absolute inset-x-0 top-[118px] text-center text-[30px] leading-[1.35] font-bold tracking-[-0.9px] text-[#898989]">
        menton
      </p>
    </div>
  );
}

export function MobileLoginView() {
  const t = useTranslations("mobile.login");
  const login = useMobileLogin();

  if (login.needsEmailVerification) {
    return (
      <VerifyEmailView
        email={login.email}
        onVerified={login.continueAfterEmailVerified}
      />
    );
  }

  const passwordError = login.loginError && !login.sheet;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-white">
      <BrandVisual />
      <div className="relative -mt-12 flex flex-col gap-[22px] px-6 pb-10">
        <header className="flex flex-col gap-1.5 leading-[1.35]">
          <h1 className="text-[26px] font-bold text-[#22262b]">{t("title")}</h1>
          <p className="text-[15px] text-[#676e78]">{t("subtitle")}</p>
        </header>

        <form
          onSubmit={login.submitLogin}
          noValidate
          className="flex flex-col gap-[22px]"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="mobile-login-email" className={LABEL_CLASS}>
                {t("email")}
              </label>
              <div className={`${FIELD_CLASS} border-[#e9ecef]`}>
                <input
                  id="mobile-login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={login.email}
                  onChange={(event) => login.setEmail(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mobile-login-password" className={LABEL_CLASS}>
                {t("password")}
              </label>
              <div
                className={`${FIELD_CLASS} ${
                  passwordError
                    ? "border-[1.5px] border-[#d9464b]"
                    : "border-[#e9ecef]"
                }`}
              >
                <input
                  id="mobile-login-password"
                  type={login.showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={login.password}
                  onChange={(event) => login.setPassword(event.target.value)}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={
                    passwordError ? "mobile-login-error" : undefined
                  }
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={login.togglePassword}
                  aria-label={
                    login.showPassword ? t("hidePassword") : t("showPassword")
                  }
                  aria-pressed={login.showPassword}
                  className="flex size-11 shrink-0 items-center justify-center -mr-3"
                >
                  <Image
                    src="/mobile/icon-eye.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>
              {passwordError ? (
                <p
                  id="mobile-login-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-[12.5px] leading-[1.35] font-medium text-[#d9464b]"
                >
                  <Image
                    src="/mobile/icon-info-error.svg"
                    alt=""
                    width={15}
                    height={15}
                  />
                  {login.loginError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => login.openSheet(MobileLoginSheet.PasswordReset)}
                className="text-sm leading-[1.35] font-medium text-[#22262b]"
              >
                {t("forgotPassword")}
              </button>
            </div>
          </div>

          <MobileButton
            type="submit"
            variant={MobileButtonVariant.Neutral}
            disabled={login.isVerifying}
          >
            {login.isVerifying ? t("submitting") : t("submit")}
          </MobileButton>
        </form>

        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        <OtgLoginButton next={login.next} />

        <div className="flex flex-col items-center gap-2 border-t border-[#f0f2f4] pt-[18px]">
          <button
            type="button"
            onClick={() => login.openSheet(MobileLoginSheet.SignupInfo)}
            className="flex items-center gap-1.5 text-sm leading-[1.35] text-[#676e78]"
          >
            {t("noAccount")}
            <Image src="/mobile/icon-info.svg" alt="" width={16} height={16} />
            <span className="sr-only">{t("whySignupOnWeb")}</span>
          </button>
          <a
            href={SIGNUP_ON_WEB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[15px] leading-[1.35] font-semibold text-[#22262b]"
          >
            {t("signUpOnWeb")}
            <Image src="/mobile/icon-ext.svg" alt="" width={16} height={16} />
          </a>
        </div>
      </div>

      {login.sheet === MobileLoginSheet.SignupInfo ? (
        <BottomSheet labelledBy="signup-info-title" onClose={login.closeSheet}>
          <span className="flex size-[52px] items-center justify-center rounded-[18px] bg-[#f5f6f8]">
            <Image
              src="/mobile/icon-info-lg.svg"
              alt=""
              width={24}
              height={24}
            />
          </span>
          <div className="flex flex-col gap-2">
            <h2
              id="signup-info-title"
              className="text-xl leading-[1.35] font-semibold text-[#22262b]"
            >
              {t("whySignupOnWeb")}
            </h2>
            <p className="text-[14.5px] leading-[1.5] text-[#676e78]">
              {t("signupInfo")}
            </p>
          </div>
          <MobileButtonLink href={SIGNUP_ON_WEB_HREF} external>
            <Image
              src="/mobile/icon-ext-light.svg"
              alt=""
              width={18}
              height={18}
            />
            {t("signUpOnWebShort")}
          </MobileButtonLink>
          <MobileButton
            variant={MobileButtonVariant.Ghost}
            onClick={login.closeSheet}
          >
            {t("close")}
          </MobileButton>
        </BottomSheet>
      ) : null}

      {login.sheet === MobileLoginSheet.PasswordReset ? (
        <BottomSheet
          labelledBy="password-reset-title"
          onClose={login.closeSheet}
        >
          <div className="flex flex-col gap-2">
            <h2
              id="password-reset-title"
              className="text-xl leading-[1.35] font-semibold text-[#22262b]"
            >
              {t("resetTitle")}
            </h2>
            <p className="text-[14.5px] leading-[1.5] text-[#676e78]">
              {t("resetDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mobile-reset-email" className={LABEL_CLASS}>
              {t("email")}
            </label>
            <div className={`${FIELD_CLASS} border-[#e9ecef]`}>
              <input
                id="mobile-reset-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={login.email}
                onChange={(event) => login.setEmail(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            {login.loginError ? (
              <p
                role="alert"
                className="text-[12.5px] leading-[1.35] font-medium text-[#d9464b]"
              >
                {login.loginError}
              </p>
            ) : null}
            {login.notice ? (
              <p
                role="status"
                className="text-[12.5px] leading-[1.35] font-medium text-[#2f9e6b]"
              >
                {login.notice}
              </p>
            ) : null}
          </div>
          <MobileButton onClick={login.sendPasswordReset}>
            {t("sendLink")}
          </MobileButton>
          <MobileButton
            variant={MobileButtonVariant.Ghost}
            onClick={login.closeSheet}
          >
            {t("cancel")}
          </MobileButton>
        </BottomSheet>
      ) : null}
    </main>
  );
}
