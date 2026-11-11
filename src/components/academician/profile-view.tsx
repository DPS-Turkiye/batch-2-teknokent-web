"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { fieldClass, labelClass } from "@/components/academician/workspace-ui";
import { PageHeading, SolidButton } from "@/components/admin/admin-ui";
import { InstitutionRecordCard } from "@/components/institution/institution-record-card";
import { useAcademicianProfile } from "@/hooks/use-academician-profile";

const FIELDS = [
  {
    field: "defaultPlace",
    type: "text",
    placeholder: "defaultPlacePlaceholder",
  },
  { field: "onlineLink", type: "url", placeholder: "onlineLinkPlaceholder" },
  { field: "contactEmail", type: "email", placeholder: null },
] as const;

export function AcademicianProfileView() {
  const t = useTranslations("academicianWorkspace.profile");
  const profile = useAcademicianProfile();
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <WorkspaceQueryState
        isLoading={profile.recordLoading}
        error={profile.recordError}
        onRetry={profile.retryRecord}
      />
      {!profile.recordLoading && !profile.recordError ? (
        <InstitutionRecordCard record={profile.record} />
      ) : null}
      <section
        aria-labelledby="office-hours-settings-title"
        className="space-y-4 rounded-3xl border border-[#e9ecef] bg-white px-6 py-5"
      >
        <div>
          <h2
            id="office-hours-settings-title"
            className="text-[16px] font-semibold leading-[1.3] text-[#22262b]"
          >
            {t("settingsTitle")}
          </h2>
          <p className="mt-1 text-[12.5px] text-[#858c96]">
            {t("settingsHint")}
          </p>
        </div>
        <SampleDataNotice />
        <WorkspaceQueryState
          isLoading={profile.settingsLoading}
          error={profile.settingsError}
          onRetry={profile.retrySettings}
        />
        {profile.form ? (
          <form
            noValidate
            onSubmit={profile.submit}
            className="grid gap-4 md:grid-cols-2"
          >
            {FIELDS.map(({ field, type, placeholder }) => {
              const error = profile.errors[field];
              const errorId = `office-hours-${field}-error`;
              return (
                <div key={field}>
                  <label
                    htmlFor={`office-hours-${field}`}
                    className={labelClass}
                  >
                    {t(field)}
                  </label>
                  <input
                    id={`office-hours-${field}`}
                    type={type}
                    value={profile.form?.[field] ?? ""}
                    placeholder={placeholder ? t(placeholder) : undefined}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) =>
                      profile.change(field, event.target.value)
                    }
                    className={fieldClass}
                  />
                  {error ? (
                    <p
                      id={errorId}
                      role="alert"
                      className="mt-1.5 text-[12px] text-[#d9464b]"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
            <div className="md:col-span-2">
              <SolidButton
                type="submit"
                disabled={profile.isSaving || !profile.isDirty}
              >
                {profile.isSaving ? t("saving") : t("save")}
              </SolidButton>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
