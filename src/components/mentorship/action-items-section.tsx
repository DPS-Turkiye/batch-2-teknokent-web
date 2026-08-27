"use client";

import { useState } from "react";

import { Badge } from "@/components/common/badge";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  useActionItems,
  useAddActionItem,
  useChangeActionItemStatus,
} from "@/hooks/use-action-items";
import { ActionItemStatus } from "@/interfaces/action-item";

const statusLabels: Record<ActionItemStatus, string> = {
  [ActionItemStatus.Open]: "Açık",
  [ActionItemStatus.InProgress]: "Devam Ediyor",
  [ActionItemStatus.Completed]: "Tamamlandı",
  [ActionItemStatus.Cancelled]: "İptal Edildi",
};

const statusTones: Record<ActionItemStatus, "gray" | "green" | "amber"> = {
  [ActionItemStatus.Open]: "amber",
  [ActionItemStatus.InProgress]: "amber",
  [ActionItemStatus.Completed]: "green",
  [ActionItemStatus.Cancelled]: "gray",
};

function formatDueDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ActionItemsSection({
  requestId,
  ownerId,
  ownerName,
}: {
  requestId: string;
  ownerId: string;
  ownerName?: string;
}) {
  const actionItemsQuery = useActionItems(requestId);
  const addActionItem = useAddActionItem(requestId);
  const changeStatus = useChangeActionItemStatus(requestId);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actionItems = actionItemsQuery.data ?? [];

  async function handleAdd() {
    if (!title.trim()) return;
    setError(null);
    try {
      await addActionItem.mutateAsync({
        requestId,
        ownerId,
        title: title.trim(),
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setDueDate("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aksiyon eklenemedi.");
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-zinc-900">Aksiyonlar</h3>
        {actionItems.length > 0 ? (
          <span className="text-xs text-zinc-500">
            {
              actionItems.filter(
                (item) => item.status !== ActionItemStatus.Completed,
              ).length
            }{" "}
            açık
          </span>
        ) : null}
      </div>

      {actionItemsQuery.isLoading ? (
        <p className="mt-4 text-xs text-zinc-500">Yükleniyor...</p>
      ) : actionItems.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-500">
          Henüz aksiyon eklenmedi. Görüşme sonrası takip maddelerini buradan
          atayabilirsiniz.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {actionItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-900">
                  {item.title}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {item.ownerName ?? "Atanmadı"}
                  {item.dueDate
                    ? ` · Son tarih: ${formatDueDate(item.dueDate)}`
                    : ""}
                </p>
              </div>
              <Badge tone={statusTones[item.status]}>
                {statusLabels[item.status]}
              </Badge>
              <select
                value={item.status}
                disabled={changeStatus.isPending}
                onChange={(event) =>
                  void changeStatus.mutateAsync({
                    id: item.id,
                    requestId,
                    status: event.target.value as ActionItemStatus,
                  })
                }
                className="rounded-lg border border-zinc-300 p-1.5 text-[10px] focus:border-zinc-900 focus:outline-none"
              >
                {Object.values(ActionItemStatus).map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
        <label className="block text-xs font-semibold text-zinc-700">
          Yeni aksiyon{ownerName ? ` — ${ownerName} için` : ""}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn. Finansal projeksiyonu güncelle"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
          />
          <PrimaryButton
            disabled={!title.trim() || addActionItem.isPending}
            onClick={() => void handleAdd()}
          >
            {addActionItem.isPending ? "Ekleniyor..." : "Ekle"}
          </PrimaryButton>
        </div>
        {error ? <p className="text-[10px] text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
