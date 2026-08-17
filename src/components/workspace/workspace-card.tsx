type WorkspaceCardProps = {
  title: string;
  role: string;
  status: string;
  onSelect: () => void;
};

export function WorkspaceCard({
  title,
  role,
  status,
  onSelect,
}: WorkspaceCardProps) {
  return (
    <article className="border border-zinc-300 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-[10px] text-zinc-500">{role}</p>
        </div>
        <span className="border border-zinc-300 px-2 py-1 text-[9px] text-zinc-500">
          {status}
        </span>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="mt-4 w-full border border-zinc-600 px-4 py-2.5 text-xs font-medium hover:bg-zinc-50"
      >
        Çalışma alanına geç
      </button>
    </article>
  );
}
