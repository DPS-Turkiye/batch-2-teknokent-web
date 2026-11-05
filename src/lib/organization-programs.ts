import type { OrganizationPrograms } from "@/interfaces/program";

/**
 * The program a startup works in: the one it chose, else the last one it
 * joined. Same rule the backend uses to pick the mentee's mentor pool.
 */
export function currentOrganizationProgram(
  data: OrganizationPrograms | null | undefined,
) {
  if (!data) return null;
  return (
    data.programs.find((program) => program.id === data.activeProgramId) ??
    data.programs.at(-1) ??
    null
  );
}
