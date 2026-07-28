"use client";

import { useHealthStatus } from "@/hooks/use-health-status";

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </div>
  );
}

export function HealthStatus() {
  const { health, isLoading, isError, error, isUp, refetch } =
    useHealthStatus();

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        data-testid="health-status-loading"
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Backend health status is loading...
        </p>
      </section>
    );
  }

  if (isError || !health) {
    return (
      <section
        aria-live="polite"
        className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/40"
        data-testid="health-status-error"
      >
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
          Health check failed
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error?.message ?? "Unable to load backend health status."}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      data-testid="health-status-panel"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Backend Health
        </h2>
        <span
          data-testid="health-status-badge"
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isUp
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {health.status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <StatusBadge label="Version" value={health.version} />
        <StatusBadge label="Database" value={health.components.database} />
        <StatusBadge label="Checked at" value={health.timestamp} />
      </div>

      <button
        type="button"
        onClick={refetch}
        className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Refresh
      </button>
    </section>
  );
}
