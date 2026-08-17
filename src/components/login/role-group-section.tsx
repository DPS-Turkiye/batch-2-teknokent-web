import { RoleOptionCard } from "@/components/login/role-option-card";
import { LoginRoleId, type LoginRoleGroup } from "@/interfaces/login";

export function RoleGroupSection({
  group,
  isOpen,
  selectedRoleIds,
  onToggleOpen,
  onToggleRole,
}: {
  group: LoginRoleGroup;
  isOpen: boolean;
  selectedRoleIds: Set<LoginRoleId>;
  onToggleOpen: () => void;
  onToggleRole: (id: LoginRoleId) => void;
}) {
  const selectedCount = group.roles.filter((role) =>
    selectedRoleIds.has(role.id),
  ).length;

  return (
    <section className="border border-zinc-300 bg-white">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-5 p-4 text-left sm:p-5"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {group.title}
            {selectedCount > 0 ? (
              <span className="border border-zinc-300 px-2 py-0.5 text-[9px] font-normal text-zinc-500">
                {selectedCount} seçili
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-[10px] leading-4 text-zinc-500 sm:text-xs">
            {group.description}
          </span>
        </span>
        <span aria-hidden="true" className="text-lg font-light">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2 sm:p-5">
          {group.roles.map((role) => (
            <RoleOptionCard
              key={role.id}
              role={role}
              selected={selectedRoleIds.has(role.id)}
              onToggle={onToggleRole}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
