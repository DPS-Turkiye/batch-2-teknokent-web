import { HealthStatus } from "@/components/health-status";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Teknokent Web
      </h1>
      <HealthStatus />
    </main>
  );
}
