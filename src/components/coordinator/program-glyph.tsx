import { FolderKanban } from "lucide-react";

export function ProgramGlyph({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-12 place-items-center rounded-2xl ${
        muted ? "bg-[#f4f5f7] text-[#858c96]" : "bg-[#22262b] text-white"
      }`}
    >
      <FolderKanban className="size-5" />
    </span>
  );
}
