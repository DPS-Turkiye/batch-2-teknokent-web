"use client";

import { useQuery } from "@tanstack/react-query";

import { getStudentHome } from "@/lib/client/student-home";

export const STUDENT_HOME_QUERY_KEY = ["student-home"] as const;

export function useStudentHome() {
  return useQuery({
    queryKey: STUDENT_HOME_QUERY_KEY,
    queryFn: getStudentHome,
  });
}
