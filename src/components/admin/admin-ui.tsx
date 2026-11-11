import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, type ReactNode } from "react";

type AdminIconProps = {
  src: string;
  className?: string;
} & (
  | { fill: true; width?: never; height?: never }
  | { fill?: false; width: number; height: number }
);

export function AdminOverlay({
  label,
  onClose,
  className = "z-50",
  children,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 grid place-items-center bg-black/30 p-4 ${className}`}
      onClick={onClose}
    >
      {children}
    </div>
  );
}

export function AdminIcon(props: AdminIconProps) {
  if (props.fill) {
    return (
      <Image
        alt=""
        src={props.src}
        fill
        sizes="40px"
        className={props.className}
      />
    );
  }
  return (
    <Image
      alt=""
      src={props.src}
      width={props.width}
      height={props.height}
      className={props.className}
    />
  );
}

type AvatarTone = "orange" | "blue";

export function Avatar({
  initials,
  tone = "orange",
  size = "md",
}: {
  initials: string;
  tone?: AvatarTone;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "size-11 text-[13px]"
      : size === "sm"
        ? "size-6 text-[9px]"
        : "size-7 text-[10px]";
  const palette =
    tone === "blue"
      ? "bg-[#eaf6ff] text-[#1583d6]"
      : "bg-[#fbe2d0] text-[#a8480e]";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${box} ${palette}`}
    >
      {initials}
    </span>
  );
}

export function StatusChip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "amber" | "red" | "neutral" | "blue" | "orange";
}) {
  const styles = {
    green: {
      box: "bg-[#eaf7f0] text-[#2f9e6b]",
      dot: "/admin/dot-success.svg",
    },
    amber: { box: "bg-[#fff6e5] text-[#b7791f]", dot: "/admin/dot-warn.svg" },
    red: { box: "bg-[#fdeeee] text-[#d9464b]", dot: "/admin/dot-critical.svg" },
    neutral: {
      box: "bg-[#f5f6f8] text-[#676e78]",
      dot: "/admin/dot-muted.svg",
    },
    blue: { box: "bg-[#eaf6ff] text-[#1583d6]", dot: "/admin/dot-info.svg" },
    orange: { box: "bg-[#fff1ec] text-[#e0522a]", dot: null },
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${styles.box}`}
    >
      {styles.dot ? (
        <AdminIcon src={styles.dot} width={6} height={6} className="shrink-0" />
      ) : null}
      {children}
    </span>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

export function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#f4f5f7] p-1">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] ${
              selected
                ? "bg-white font-medium text-[#22262b] shadow-[0_1px_2px_rgba(33,38,43,0.08)]"
                : "text-[#858c96]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-3.5 text-[#858c96] sm:max-w-[280px] sm:flex-none">
      <Search className="size-4 shrink-0" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
      />
    </label>
  );
}

export function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-3.5 text-[13px]">
      {label ? <span className="text-[#858c96]">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent font-medium text-[#22262b] outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="size-4 text-[#858c96]" aria-hidden />
    </label>
  );
}

export function SolidButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e9ecef] bg-white">
      {children}
    </div>
  );
}

export function ScrollTable({
  children,
  minWidth = 1080,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <Panel>
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
      </div>
    </Panel>
  );
}

export function QueryNotice({
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: Error | null;
}) {
  const t = useTranslations("common");
  if (isLoading) {
    return <p className="text-sm text-[#858c96]">{t("loading")}</p>;
  }
  if (error) {
    return <p className="text-sm text-[#d9464b]">{error.message}</p>;
  }
  return null;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-sm text-[#858c96]">{children}</p>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[12px] text-[#858c96]">{eyebrow}</p>
        ) : null}
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#22262b]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[13.5px] text-[#676e78]">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
