"use client";

import { useQuery } from "@tanstack/react-query";

import { getMentorRating } from "@/lib/client/mentors";

/** "Ortalama değerlendirme": the mentees' feedback average, overall and per mentorship. */
export function useMentorRating(mentorId: string) {
  return useQuery({
    queryKey: ["mentor-rating", mentorId],
    queryFn: () => getMentorRating(mentorId),
  });
}
