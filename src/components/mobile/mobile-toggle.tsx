export function MobileToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[var(--mobile-accent)]" : "bg-[#dfe2e6]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] size-[25px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-[left] ${
          checked ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}
