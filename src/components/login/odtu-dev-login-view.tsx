// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AuthShell } from "@/components/auth/auth-shell";
import { useOdtuDevLogin } from "@/hooks/use-odtu-dev-login";

export function OdtuDevLoginView() {
  const copy = useTranslations("odtuDevLogin");
  const state = useSearchParams().get("state");
  const {
    personas,
    isLoading,
    loadError,
    ready,
    signingInAs,
    error,
    signInAs,
  } = useOdtuDevLogin(state);

  return (
    <AuthShell>
      <div className="flex w-full max-w-[440px] flex-col gap-3 pt-8">
        <h1 className="text-center text-2xl font-bold text-[#676e78]">
          {copy("title")}
        </h1>
        <p className="text-center text-sm text-[#6b7280]">{copy("intro")}</p>
        {isLoading ? (
          <p role="status" className="text-sm text-[#6b7280]">
            {copy("loading")}
          </p>
        ) : null}
        {loadError ? (
          <p role="alert" className="text-sm text-red-700">
            {loadError}
          </p>
        ) : null}
        {!isLoading && !loadError && personas.length === 0 ? (
          <p className="text-sm text-[#6b7280]">{copy("empty")}</p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {personas.map((persona) => (
            <li key={persona.id}>
              <button
                type="button"
                disabled={!ready || signingInAs !== null}
                onClick={() => void signInAs(persona.id)}
                className="flex w-full flex-col items-start rounded-[16px] border border-[#e4e7ea] px-4 py-3 text-left transition hover:border-[#e86f22] hover:bg-[#fff9f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-[#111827]">
                  {persona.fullName}
                </span>
                <span className="text-xs text-[#6b7280]">
                  {persona.label} ·{" "}
                  {persona.kinds
                    .map((kind) => copy(`kinds.${kind}`))
                    .join(", ")}
                </span>
                {signingInAs === persona.id ? (
                  <span role="status" className="text-xs text-[#c85816]">
                    {copy("signingIn")}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
