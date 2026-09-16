"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { REGULAR_MENTORSHIPS_QUERY_KEY } from "@/components/mentorships/regular-mentorships-tab";
import { StartupNameLink } from "@/components/common/startup-name-link";
import { useAppSession } from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import {
  addRegularMentorshipGoal,
  deleteRegularMentorship,
  getRegularMentorship,
  setRegularMentorshipGoalDone,
  updateRegularMentorship,
} from "@/lib/client/mentorships";
import { AppArea } from "@/types/app-area";

function formatDateLabel(value: string | null) {
  if (!value) return "Süresiz";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RegularMentorshipDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const session = useAppSession();
  const isMentor = session?.role === UserRole.Mentor;
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(1);

  const query = useQuery({
    queryKey: ["regular-mentorship", id],
    queryFn: () => getRegularMentorship(id),
    enabled: Boolean(id),
  });

  async function invalidateMentorship() {
    await queryClient.invalidateQueries({
      queryKey: ["regular-mentorship", id],
    });
    await queryClient.invalidateQueries({
      queryKey: REGULAR_MENTORSHIPS_QUERY_KEY,
    });
  }

  const addGoal = useMutation({
    mutationFn: () =>
      addRegularMentorshipGoal({ mentorshipId: id, title: title.trim() }),
    onSuccess: async () => {
      setTitle("");
      setError("");
      await invalidateMentorship();
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const toggleGoal = useMutation({
    mutationFn: (input: { goalId: string; done: boolean }) =>
      setRegularMentorshipGoalDone({
        mentorshipId: id,
        goalId: input.goalId,
        done: input.done,
      }),
    onSuccess: async () => {
      await invalidateMentorship();
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const saveDetails = useMutation({
    mutationFn: () =>
      updateRegularMentorship({
        mentorshipId: id,
        startDate,
        endDate: endDate || null,
        daysPerWeek,
      }),
    onSuccess: async () => {
      setEditing(false);
      setError("");
      await invalidateMentorship();
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const removeMentorship = useMutation({
    mutationFn: () => deleteRegularMentorship(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: REGULAR_MENTORSHIPS_QUERY_KEY,
      });
      router.push("/mentorships?tab=regular");
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const mentorship = query.data;

  return (
    <AppShell active={AppArea.Mentorships} mentorHome={isMentor}>
      <div className="mx-auto w-full max-w-[720px] px-4 pb-14 pt-8 sm:px-8">
        <Link
          href="/mentorships?tab=regular"
          className="text-sm font-medium text-[#e86f22]"
        >
          ← Düzenli mentorlüklere dön
        </Link>

        {query.isLoading ? (
          <p className="mt-8 text-sm text-[#676e78]">Yükleniyor...</p>
        ) : query.error || !mentorship ? (
          <p className="mt-8 text-sm text-red-600">
            {query.error?.message ?? "Mentorlük bulunamadı."}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-[28px] font-medium text-[#22262b]">
                  {isMentor ? (
                    <StartupNameLink organizationId={mentorship.organizationId}>
                      {mentorship.organizationName}
                    </StartupNameLink>
                  ) : (
                    mentorship.organizationName
                  )}
                </h1>
                <p className="mt-1 text-sm text-[#676e78]">
                  {mentorship.mentorName} · Haftada {mentorship.daysPerWeek} gün
                </p>
                <p className="mt-1 text-xs text-[#858c96]">
                  {formatDateLabel(mentorship.startDate)} –{" "}
                  {formatDateLabel(mentorship.endDate)}
                </p>
              </div>
              {isMentor ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editing) {
                        setStartDate(mentorship.startDate);
                        setEndDate(mentorship.endDate ?? "");
                        setDaysPerWeek(mentorship.daysPerWeek);
                      }
                      setEditing((value) => !value);
                      setError("");
                    }}
                    className="rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm font-medium text-[#515861]"
                  >
                    {editing ? "Vazgeç" : "Düzenle"}
                  </button>
                  <button
                    type="button"
                    disabled={removeMentorship.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Bu düzenli mentorlüğü silmek istediğine emin misin?",
                        )
                      ) {
                        return;
                      }
                      removeMentorship.mutate();
                    }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removeMentorship.isPending ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              ) : null}
            </div>

            {isMentor && editing ? (
              <form
                className="mt-5 rounded-[16px] border border-[#e4e7ea] bg-white p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!startDate) {
                    setError("Başlangıç tarihi gerekli.");
                    return;
                  }
                  saveDetails.mutate();
                }}
              >
                <h2 className="text-sm font-semibold text-[#22262b]">
                  Mentorlük bilgilerini düzenle
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs font-medium text-[#515861]">
                    Başlangıç
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#515861]">
                    Bitiş
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#515861]">
                    Haftada gün
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={daysPerWeek}
                      onChange={(event) =>
                        setDaysPerWeek(
                          Math.min(
                            7,
                            Math.max(1, Number(event.target.value) || 1),
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saveDetails.isPending}
                  className="mt-4 rounded-lg bg-[#e86f22] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saveDetails.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </form>
            ) : null}

            <div className="mt-6 rounded-[16px] border border-[#e4e7ea] bg-white p-5">
              <div className="mb-2 flex items-center justify-between text-sm text-[#676e78]">
                <span>İlerleme</span>
                <span className="font-medium text-[#22262b]">
                  %{mentorship.progressPercent}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#eef1f4]">
                <div
                  className="h-full rounded-full bg-[#e86f22] transition-[width]"
                  style={{
                    width: `${Math.min(100, mentorship.progressPercent)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-8">
              <DocumentRequestChecklist
                scope={{ mentorshipId: mentorship.id }}
                canManage={isMentor}
                canUpload={!isMentor}
              />
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-[#22262b]">Hedefler</h2>
              <ul className="mt-4 space-y-3">
                {mentorship.goalItems.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-[#e4e7ea] px-4 py-6 text-sm text-[#676e78]">
                    Henüz hedef eklenmemiş.
                  </li>
                ) : (
                  mentorship.goalItems.map((goal) => (
                    <li
                      key={goal.id}
                      className="flex items-start gap-3 rounded-xl border border-[#e4e7ea] bg-white px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={goal.done}
                        disabled={!isMentor || toggleGoal.isPending}
                        onChange={(event) =>
                          toggleGoal.mutate({
                            goalId: goal.id,
                            done: event.target.checked,
                          })
                        }
                        className="mt-1 h-4 w-4 accent-[#e86f22]"
                        aria-label={goal.title}
                      />
                      <span
                        className={
                          goal.done
                            ? "text-sm text-[#858c96] line-through"
                            : "text-sm text-[#22262b]"
                        }
                      >
                        {goal.title}
                      </span>
                    </li>
                  ))
                )}
              </ul>

              {isMentor ? (
                <form
                  className="mt-5 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!title.trim()) return;
                    addGoal.mutate();
                  }}
                >
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Yeni hedef..."
                    className="min-w-0 flex-1 rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={addGoal.isPending || !title.trim()}
                    className="rounded-lg bg-[#e86f22] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Hedef ekle
                  </button>
                </form>
              ) : null}

              {error ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
