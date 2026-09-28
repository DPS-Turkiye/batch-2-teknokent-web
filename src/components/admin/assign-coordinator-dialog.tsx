"use client";

import Link from "next/link";

import { AdminOverlay } from "@/components/admin/admin-ui";
import { useAssignProgramCoordinator } from "@/hooks/use-admin-coordinators";

export function AssignCoordinatorDialog({
  programId,
  programName,
  onClose,
}: {
  programId: string;
  programName: string;
  onClose: () => void;
}) {
  const assign = useAssignProgramCoordinator(programId, onClose);

  return (
    <AdminOverlay label="Koordinatör ata" onClose={onClose}>
      <form
        aria-label="Koordinatör ata"
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (assign.canSave) assign.save();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          Koordinatör ata
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {programName} programına koordinatör ekle. Programın kurallarını ve
          takımlarını koordinatör yönetir.
        </p>

        <div className="mt-5 max-h-[300px] overflow-y-auto text-[13px]">
          {assign.isLoading ? (
            <p className="text-[#858c96]">Yükleniyor…</p>
          ) : assign.loadError ? (
            <p className="text-[#d9464b]">{assign.loadError.message}</p>
          ) : assign.candidates.length === 0 ? (
            <p className="leading-[1.5] text-[#676e78]">
              Eklenebilecek onaylı koordinatör yok. Önce{" "}
              <Link
                href="/admin/users"
                className="font-medium text-[#22262b] underline"
              >
                Kullanıcılar
              </Link>{" "}
              sayfasından bir koordinatör ekle.
            </p>
          ) : (
            <div className="space-y-2">
              {assign.candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] has-[:checked]:border-[#22262b]"
                >
                  <input
                    type="radio"
                    name="coordinator"
                    checked={assign.selectedId === candidate.id}
                    onChange={() => assign.select(candidate.id)}
                    className="accent-[#22262b]"
                  />
                  {candidate.fullName}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b]"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={!assign.canSave}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {assign.saving ? "Ekleniyor…" : "Programa ekle"}
          </button>
        </div>
      </form>
    </AdminOverlay>
  );
}
