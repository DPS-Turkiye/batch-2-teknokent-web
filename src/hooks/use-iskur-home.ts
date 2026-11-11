"use client";

import {
  usePeerMentorGate,
  usePeerMentorProfile,
  usePeerRequestDecision,
  useReceivedPeerRequests,
} from "@/hooks/use-peer-mentor-give";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import { iskurHomeMode, peerMentorCapacity } from "@/lib/peer-mentoring";
import { IskurHomeMode } from "@/types/iskur-student";

const HOME_WAITING_SHOWN = 3;

/**
 * The İŞKUR home blocks: which ones show (iskurHomeMode), the requests waiting for the mentor's answer with the
 * decision actions, and the "Mentor profilin" capacity. Queries run only for a published peer mentor.
 */
export function useIskurHome() {
  const gate = usePeerMentorGate();
  const earned =
    gate.state === PeerMentorGateState.Earned && !gate.sessionBehind;
  const profile = usePeerMentorProfile(earned);
  const hasProfile = Boolean(profile.data);
  const received = useReceivedPeerRequests(hasProfile);
  const decision = usePeerRequestDecision();
  return {
    // Nothing until the profile answers, so a published mentor never flashes the "create your profile" card.
    mode:
      gate.isLoading || profile.isLoading
        ? IskurHomeMode.None
        : iskurHomeMode(gate.state, hasProfile),
    profile: profile.data ?? null,
    /** The first waiting requests; the rest are counted behind "Mentorluk Ver". */
    waiting: received.waiting.slice(0, HOME_WAITING_SHOWN),
    moreWaiting: Math.max(0, received.waiting.length - HOME_WAITING_SHOWN),
    loaded: received.query.data !== undefined,
    decision,
    capacity: peerMentorCapacity(
      received.mentees.length,
      profile.data?.menteeCapacity ?? null,
    ),
  };
}
