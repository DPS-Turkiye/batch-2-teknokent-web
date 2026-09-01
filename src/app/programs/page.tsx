"use client";

import { FormEvent, useMemo, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  useAddProgramStartup,
  useCreateProgram,
  useDecideProgramMentorRequest,
  useInviteProgramMentor,
  useProgramDirectory,
  usePrograms,
  useRemoveProgramStartup,
} from "@/hooks/use-programs";
import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
} from "@/interfaces/program";
import { AppArea } from "@/types/app-area";

export default function ProgramsPage() {
  const programsQuery = usePrograms();
  const directoryQuery = useProgramDirectory();
  const createProgram = useCreateProgram();
  const addStartup = useAddProgramStartup();
  const removeStartup = useRemoveProgramStartup();
  const inviteMentor = useInviteProgramMentor();
  const decideRequest = useDecideProgramMentorRequest();

  const programs = programsQuery.data ?? [];
  const mentors = directoryQuery.data?.mentors ?? [];

  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [targetProgramId, setTargetProgramId] = useState("");
  const [mentorByProgram, setMentorByProgram] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedProgramId = targetProgramId || programs[0]?.id || "";

  const visibleStartups = useMemo(() => {
    const startups = directoryQuery.data?.startups ?? [];
    const needle = query.trim().toLocaleLowerCase("tr");
    if (!needle) return startups;
    return startups.filter((startup) =>
      startup.name.toLocaleLowerCase("tr").includes(needle),
    );
  }, [query, directoryQuery.data?.startups]);

  function flash(message: string) {
    setError("");
    setNotice(message);
  }

  function fail(reason: unknown) {
    setNotice("");
    setError(reason instanceof Error ? reason.message : "İşlem tamamlanamadı.");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await createProgram.mutateAsync(name);
      setName("");
      setTargetProgramId(created.id);
      flash("Program oluşturuldu.");
    } catch (reason) {
      fail(reason);
    }
  }

  async function handleAddStartup(organizationId: string) {
    if (!selectedProgramId) {
      setError("Önce bir program oluşturun.");
      return;
    }
    try {
      await addStartup.mutateAsync({
        programId: selectedProgramId,
        organizationId,
      });
      flash("Startup programa eklendi.");
    } catch (reason) {
      fail(reason);
    }
  }

  return (
    <AppShell active={AppArea.Programs} title="Programlar">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-12 pt-6 sm:px-8">
        {notice ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {notice}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <form
          onSubmit={(event) => void handleCreate(event)}
          className="rounded-xl border border-[#e5e7eb] bg-white p-5"
        >
          <h2 className="text-sm font-semibold">Program oluştur</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Program adı"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-sm"
            />
            <button
              type="submit"
              disabled={createProgram.isPending || !name.trim()}
              className="h-10 rounded-lg bg-[#e86f22] px-4 text-sm font-semibold text-white disabled:bg-[#c9cdd2]"
            >
              Oluştur
            </button>
          </div>
        </form>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Startup’lar</h2>
              <p className="mt-1 text-xs text-[#6a7282]">
                Arama çubuğunun altında tüm startup’lar listelenir. Seçtiğiniz
                programa ekleyin.
              </p>
            </div>
            {programs.length > 1 ? (
              <label className="text-xs text-[#6a7282]">
                Hedef program
                <select
                  value={selectedProgramId}
                  onChange={(event) => setTargetProgramId(event.target.value)}
                  className="mt-1 block h-10 min-w-48 rounded-lg border border-[#e5e7eb] px-2 text-sm text-[#171717]"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Startup ara"
            className="h-10 w-full rounded-lg border border-[#e5e7eb] px-3 text-sm"
          />
          {directoryQuery.isLoading ? (
            <p className="text-sm text-[#6a7282]">Yükleniyor...</p>
          ) : visibleStartups.length === 0 ? (
            <p className="text-sm text-[#6a7282]">Startup bulunamadı.</p>
          ) : (
            <ul className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white">
              {visibleStartups.map((startup) => (
                <li
                  key={startup.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm font-medium">{startup.name}</span>
                  <button
                    type="button"
                    disabled={!selectedProgramId || addStartup.isPending}
                    onClick={() => void handleAddStartup(startup.id)}
                    className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    Programa ekle
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Programlar</h2>
          {programsQuery.isLoading ? (
            <p className="text-sm text-[#6a7282]">Yükleniyor...</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-[#6a7282]">Henüz program yok.</p>
          ) : (
            programs.map((program) => {
              const accepted = program.mentors.filter(
                (mentor) => mentor.status === ProgramMentorStatus.Accepted,
              );
              const pendingInvites = program.mentors.filter(
                (mentor) =>
                  mentor.status === ProgramMentorStatus.Pending &&
                  mentor.invitedBy === ProgramMentorInvitedBy.Coordinator,
              );
              const pendingRequests = program.mentors.filter(
                (mentor) =>
                  mentor.status === ProgramMentorStatus.Pending &&
                  mentor.invitedBy === ProgramMentorInvitedBy.Mentor,
              );
              const takenMentorIds = new Set(
                program.mentors
                  .filter(
                    (mentor) => mentor.status !== ProgramMentorStatus.Rejected,
                  )
                  .map((mentor) => mentor.mentorId),
              );
              const availableMentors = mentors.filter(
                (mentor) => !takenMentorIds.has(mentor.id),
              );
              return (
                <article
                  key={program.id}
                  className="space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-5"
                >
                  <h3 className="text-base font-semibold">{program.name}</h3>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
                      Startup’lar
                    </p>
                    {program.startups.length === 0 ? (
                      <p className="mt-2 text-sm text-[#6a7282]">
                        Bu programda henüz startup yok.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {program.startups.map((startup) => (
                          <li
                            key={startup.id}
                            className="flex items-center gap-2 rounded-full border border-[#e5e7eb] px-3 py-1 text-xs"
                          >
                            {startup.name}
                            <button
                              type="button"
                              disabled={removeStartup.isPending}
                              onClick={() =>
                                void removeStartup
                                  .mutateAsync({
                                    programId: program.id,
                                    organizationId: startup.id,
                                  })
                                  .then(() => flash("Startup çıkarıldı."))
                                  .catch(fail)
                              }
                              className="text-[#858c96] hover:text-red-600"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
                      Mentörler
                    </p>
                    {accepted.length === 0 ? (
                      <p className="mt-2 text-sm text-[#6a7282]">
                        Kabul etmiş mentör yok.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {accepted.map((mentor) => (
                          <li key={mentor.mentorId}>{mentor.fullName}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {pendingInvites.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
                        Mentör yanıtı bekleniyor
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-[#6a7282]">
                        {pendingInvites.map((mentor) => (
                          <li key={mentor.mentorId}>{mentor.fullName}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {pendingRequests.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
                        Mentör başvuruları
                      </p>
                      <ul className="mt-2 space-y-2">
                        {pendingRequests.map((mentor) => (
                          <li
                            key={mentor.mentorId}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-sm">{mentor.fullName}</span>
                            <span className="flex gap-2">
                              <button
                                type="button"
                                disabled={decideRequest.isPending}
                                onClick={() =>
                                  void decideRequest
                                    .mutateAsync({
                                      programId: program.id,
                                      mentorId: mentor.mentorId,
                                      accepted: true,
                                    })
                                    .then(() => flash("Mentör kabul edildi."))
                                    .catch(fail)
                                }
                                className="rounded-lg bg-[#e86f22] px-3 py-1.5 text-xs font-semibold text-white disabled:bg-[#c9cdd2]"
                              >
                                Kabul
                              </button>
                              <button
                                type="button"
                                disabled={decideRequest.isPending}
                                onClick={() =>
                                  void decideRequest
                                    .mutateAsync({
                                      programId: program.id,
                                      mentorId: mentor.mentorId,
                                      accepted: false,
                                    })
                                    .then(() => flash("Mentör reddedildi."))
                                    .catch(fail)
                                }
                                className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs"
                              >
                                Reddet
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={mentorByProgram[program.id] ?? ""}
                      onChange={(event) =>
                        setMentorByProgram((current) => ({
                          ...current,
                          [program.id]: event.target.value,
                        }))
                      }
                      className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-2 text-sm"
                    >
                      <option value="">Mentör seç</option>
                      {availableMentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={
                        inviteMentor.isPending || !mentorByProgram[program.id]
                      }
                      onClick={() =>
                        void inviteMentor
                          .mutateAsync({
                            programId: program.id,
                            mentorId: mentorByProgram[program.id],
                          })
                          .then(() => {
                            setMentorByProgram((current) => ({
                              ...current,
                              [program.id]: "",
                            }));
                            flash(
                              "Davet gönderildi. Mentör bildirimden kabul veya red edebilir.",
                            );
                          })
                          .catch(fail)
                      }
                      className="h-10 rounded-lg bg-[#e86f22] px-4 text-sm font-semibold text-white disabled:bg-[#c9cdd2]"
                    >
                      Mentör davet et
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}
