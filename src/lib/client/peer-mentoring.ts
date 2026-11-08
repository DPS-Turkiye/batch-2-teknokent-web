import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentorFilter,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";
import {
  addPeerMentoringRequestFixture,
  peerMentoringRequestsFixture,
  peerMentorsFixture,
} from "@/lib/client/fixtures/peer-mentoring";

// Answer from fixtures until the peer-mentoring endpoints exist (shapes in interfaces/peer-mentoring.ts).
export function getPeerMentors(
  filter: PeerMentorFilter,
): Promise<PeerMentorCard[]> {
  return fixtureResponse(peerMentorsFixture(filter));
}

export function getPeerMentoringRequests(): Promise<PeerMentoringRequest[]> {
  return fixtureResponse(peerMentoringRequestsFixture());
}

export function createPeerMentoringRequest(
  input: CreatePeerMentoringRequestInput,
): Promise<PeerMentoringRequest> {
  return fixtureResponse(addPeerMentoringRequestFixture(input));
}
