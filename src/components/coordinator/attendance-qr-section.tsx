// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { AttendanceQrDialog } from "@/components/coordinator/attendance-qr-dialog";
import { useAttendanceQr } from "@/hooks/use-attendance-qr";

/** Each week's lesson and workshop with a "QR göster" button; an archived program's codes are not shown. */
export function AttendanceQrSection({
  programId,
  archived,
}: {
  programId: string;
  archived: boolean;
}) {
  const t = useTranslations("programReport.attendanceQr");
  const qr = useAttendanceQr(programId);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold text-[#22262b]">
          {t("title")}
        </h2>
        <p className="mt-1 max-w-[640px] text-[12.5px] text-[#676e78]">
          {t("hint")}
        </p>
      </div>
      {qr.isLoading || qr.error ? (
        <QueryNotice isLoading={qr.isLoading} error={qr.error} />
      ) : (
        <Panel>
          {!qr.attendanceEnabled ? (
            <EmptyNote>{t("off")}</EmptyNote>
          ) : qr.weeks.length === 0 ? (
            <EmptyNote>{t("empty")}</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="text-[12px] text-[#858c96]">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-medium">
                      {t("weekColumn")}
                    </th>
                    <th scope="col" className="px-5 py-2 font-medium">
                      {t("lesson")}
                    </th>
                    <th scope="col" className="px-5 py-2 font-medium">
                      {t("workshop")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qr.weeks.map((row) => (
                    <tr key={row.week} className="border-t border-[#f1f3f5]">
                      <th
                        scope="row"
                        className="px-5 py-2.5 font-medium whitespace-nowrap text-[#22262b]"
                      >
                        {row.label}
                      </th>
                      {row.sessions.map((session, index) => (
                        // eslint-disable-next-line react/no-array-index-key -- always two fixed slots: lesson, workshop
                        <td key={index} className="px-5 py-2.5">
                          {session ? (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[13px] text-[#22262b]">
                                  {session.when}
                                </p>
                                {session.title ? (
                                  <p className="truncate text-[12px] text-[#858c96]">
                                    {session.title}
                                  </p>
                                ) : null}
                                {session.checkedIn ? (
                                  <p className="text-[12px] text-[#1f7a4d]">
                                    {session.checkedIn}
                                  </p>
                                ) : null}
                              </div>
                              {archived ? null : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    qr.open(session.ref);
                                  }}
                                  aria-label={session.showLabel}
                                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#e9ecef] bg-white px-3 text-[12.5px] font-medium text-[#22262b]"
                                >
                                  <QrCode aria-hidden className="size-4" />
                                  {t("show")}
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-[12.5px] text-[#aeb4bc]">
                              {t("noWorkshop")}
                            </p>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
      {qr.selected ? <AttendanceQrDialog qr={qr} /> : null}
    </section>
  );
}
