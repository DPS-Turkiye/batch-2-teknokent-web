import { Minus, Plus } from "lucide-react";

/** One numeric program rule with − / + buttons; shared by Program Ayarları and the launch wizard. */
export function RuleStepper({
  title,
  hint,
  value,
  unit = "gün",
  disabled = false,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  unit?: string;
  disabled?: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-[13.5px] text-[#22262b]">{title}</span>
        <span className="block text-[12.5px] text-[#858c96]">{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 rounded-full border border-[#e9ecef] px-3 py-1.5">
        <span className="min-w-[2ch] text-[14px] font-semibold text-[#22262b]">
          {value}
        </span>
        <span className="text-[12.5px] text-[#858c96]">{unit}</span>
        <button
          type="button"
          aria-label={`${title}: azalt`}
          disabled={disabled}
          onClick={() => onChange(-1)}
          className="grid size-7 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78] disabled:opacity-40"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`${title}: artır`}
          disabled={disabled}
          onClick={() => onChange(1)}
          className="grid size-7 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78] disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
