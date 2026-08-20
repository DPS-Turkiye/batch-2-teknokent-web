"use client";

import { useState } from "react";

import {
  useCreateMentorAvailabilitySlot,
  useDeleteMentorAvailabilitySlot,
  useOwnMentorAvailability,
} from "@/hooks/use-mentor-availability";
import { formatSlotDateTime } from "@/lib/format";

export function MentorAvailabilityPanel({
  mentorId,
}: {
  mentorId: string | null;
}) {
  const availabilityQuery = useOwnMentorAvailability(mentorId);
  const createMutation = useCreateMentorAvailabilitySlot(mentorId);
  const deleteMutation = useDeleteMentorAvailabilitySlot(mentorId);
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState("");

  async function addSlot() {
    if (!startsAt) return;
    setError("");
    try {
      await createMutation.mutateAsync({
        startsAt: new Date(startsAt).toISOString(),
      });
      setStartsAt("");
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Zaman dilimi eklenemedi.",
      );
    }
  }

  async function removeSlot(slotId: string) {
    setError("");
    try {
      await deleteMutation.mutateAsync(slotId);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Zaman dilimi kaldırılamadı.",
      );
    }
  }

  if (!mentorId) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-bold text-zinc-900">Müsaitliğim</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Girişimcilere sunulacak toplantı zaman dilimlerini buradan yönetin.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs"
        />
        <button
          type="button"
          disabled={!startsAt || createMutation.isPending}
          onClick={() => void addSlot()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {createMutation.isPending ? "Ekleniyor..." : "Zaman Dilimi Ekle"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {availabilityQuery.isLoading ? (
          <p className="text-xs text-zinc-500">Yükleniyor...</p>
        ) : availabilityQuery.data?.length ? (
          availabilityQuery.data.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs"
            >
              <span className="font-medium text-zinc-800">
                📅 {formatSlotDateTime(slot.startsAt)}
              </span>
              {slot.booked ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Rezerve
                </span>
              ) : (
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => void removeSlot(slot.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:underline disabled:text-zinc-400"
                >
                  Kaldır
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-500">
            Henüz tanımlı bir müsaitlik zamanınız yok.
          </p>
        )}
      </div>
    </section>
  );
}
