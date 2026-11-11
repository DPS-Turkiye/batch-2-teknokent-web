import type { LoginRoleId, LoginRoleOption } from "@/interfaces/login";

export function RoleOptionCard({
  role,
  selected,
  onToggle,
}: {
  role: LoginRoleOption;
  selected: boolean;
  onToggle: (id: LoginRoleId) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-4 ${
        selected
          ? "border-black bg-zinc-50"
          : "border-zinc-300 hover:border-zinc-500"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(role.id)}
        className="mt-0.5 size-4 accent-black"
      />
      <span>
        <span className="text-xs font-semibold">{role.label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-zinc-500">
          {role.description}
        </span>
      </span>
    </label>
  );
}
