import { ProgramType } from "@/interfaces/program";
import { isOneOf } from "@/lib/enum";

export const ALL_PROGRAM_TYPES = "ALL";

/** A program-type filter: one type, or every type. */
export type ProgramTypeFilter = ProgramType | typeof ALL_PROGRAM_TYPES;

export const PROGRAM_TYPE_FILTERS: ProgramTypeFilter[] = [
  ALL_PROGRAM_TYPES,
  ...Object.values(ProgramType),
];

export function matchesProgramType(
  type: ProgramType,
  filter: ProgramTypeFilter,
) {
  return filter === ALL_PROGRAM_TYPES || type === filter;
}

/** A select's value read back as a program-type filter, or false when it is not one. */
export function isProgramTypeFilter(
  value: unknown,
): value is ProgramTypeFilter {
  return isOneOf(PROGRAM_TYPE_FILTERS, value);
}
