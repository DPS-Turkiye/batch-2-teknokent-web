"use client";

import { useSubmittedProfile } from "@/hooks/use-submitted-profile";
import { CONTACT_PREFERENCE_LABELS } from "@/interfaces/signup";
import type { DocumentKind } from "@/interfaces/startup-document";
import { DOCUMENT_KIND_LABELS } from "@/lib/startup-files";
import { formatFileSize } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs text-[#676e78]">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] text-[#1f2328]">
        {value || "—"}
      </dd>
    </div>
  );
}

export function SubmittedProfileSummary({
  organizationName,
}: {
  organizationName?: string | null;
}) {
  const { messages } = useLocale();
  const copy = messages.submittedProfile;
  const { profile, documents, isLoading, isError } = useSubmittedProfile();

  return (
    <section
      aria-labelledby="submitted-profile-title"
      className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6"
    >
      <h2
        id="submitted-profile-title"
        className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]"
      >
        {copy.title}
      </h2>
      {isLoading ? (
        <p role="status" className="mt-3 text-xs text-[#676e78]">
          {copy.loading}
        </p>
      ) : isError || !profile ? (
        <p className="mt-3 text-xs text-[#676e78]">{copy.unavailable}</p>
      ) : (
        <>
          <dl className="mt-2 divide-y divide-[#f1f2f4]">
            <Row label={copy.fullName} value={profile.fullName} />
            {organizationName ? (
              <Row label={copy.startup} value={organizationName} />
            ) : null}
            <Row label={copy.role} value={profile.jobTitle ?? ""} />
            <Row label={copy.linkedin} value={profile.linkedinUrl ?? ""} />
            <Row label={copy.bio} value={profile.bio ?? ""} />
            <Row
              label={copy.contact}
              value={(profile.contactPreferences ?? [])
                .map((preference) => CONTACT_PREFERENCE_LABELS[preference])
                .join(", ")}
            />
          </dl>
          <h3 className="mt-5 text-xs font-semibold text-[#1f2328]">
            {copy.files}
          </h3>
          {documents.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f8f9] px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate text-[#1f2328]">
                    <span className="font-medium">
                      {DOCUMENT_KIND_LABELS[document.kind as DocumentKind] ??
                        document.kind}
                    </span>
                    {" · "}
                    {document.originalFilename}
                  </span>
                  <span className="shrink-0 text-[#676e78]">
                    {formatFileSize(document.sizeBytes)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#676e78]">Dosya yüklenmedi.</p>
          )}
        </>
      )}
    </section>
  );
}
