"use client";

import { FileText, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePeerMentorSharedDocuments } from "@/hooks/use-peer-mentor-documents";

/**
 * "Paylaşılan belgeler" and "Bağlantılar" on a peer mentor's profile (Figma 83:384, 116:433): the files and portfolio
 * links they chose to show, plus their LinkedIn. Each section is left out when it has nothing to show.
 */
export function PeerMentorSharedEvidence({
  mentorId,
  linkedinUrl,
}: {
  mentorId: string;
  linkedinUrl: string | null;
}) {
  const t = useTranslations("iaIskur.take.profile");
  const tType = useTranslations("iaIskur.wizard.documents.types");
  const { files, links } = usePeerMentorSharedDocuments(mentorId);

  return (
    <>
      {files.length > 0 ? (
        <section aria-labelledby="mentor-documents" className="space-y-2.5">
          <h2 id="mentor-documents" className="type-label text-text-primary">
            {t("sharedDocuments")}
          </h2>
          <ul className="space-y-2.5">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-[14px] border border-border-subtle px-3.5 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-card-featured-bg">
                  <FileText
                    aria-hidden
                    className="size-[18px] text-text-accent"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate type-label text-text-primary">
                    {file.name}
                  </span>
                  <span className="block type-caption text-text-muted">
                    {tType(file.evidenceType)}
                  </span>
                </span>
                <a
                  href={file.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("viewFile", { name: file.name })}
                  className="inline-flex h-9 shrink-0 items-center rounded-button-sm border border-border-default px-3 type-button-sm text-text-primary hover:bg-background-subtle"
                >
                  {t("view")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {linkedinUrl || links.length > 0 ? (
        <section aria-labelledby="mentor-links" className="space-y-2">
          <h2 id="mentor-links" className="type-label text-text-primary">
            {t("links")}
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {linkedinUrl ? (
              <li>
                <ExternalLink href={linkedinUrl} label={t("linkedin")} />
              </li>
            ) : null}
            {links.map((link) => (
              <li key={link.id}>
                <ExternalLink
                  href={link.url}
                  label={t("portfolioLink", { host: link.host })}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const t = useTranslations("iaIskur.take.profile");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1.5 type-label text-text-accent hover:underline"
    >
      <Link2 aria-hidden className="size-4" />
      {label} <span className="sr-only">{t("newTab")}</span>
    </a>
  );
}
