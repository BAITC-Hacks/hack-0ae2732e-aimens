import { createHash, randomUUID } from "node:crypto";
import {
  Card,
  cardSchema,
  QualityAssessment,
  qualityAssessmentSchema,
} from "@/domain/task";

const tickets = new Map<
  string,
  { fingerprint: string; expiresAt: number; assessment: QualityAssessment }
>();

function fingerprint(rawDescription: string, card: Card) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        rawDescription: rawDescription.trim(),
        card: cardSchema.parse(card),
      }),
    )
    .digest("hex");
}

export function issueReviewTicket(
  rawDescription: string,
  card: Card,
  assessment: QualityAssessment,
) {
  const now = Date.now();
  for (const [key, ticket] of tickets)
    if (ticket.expiresAt < now) tickets.delete(key);
  const token = randomUUID();
  tickets.set(token, {
    fingerprint: fingerprint(rawDescription, card),
    expiresAt: now + 15 * 60_000,
    assessment: qualityAssessmentSchema.parse(assessment),
  });
  return token;
}

export function consumeReviewTicket(
  token: string,
  rawDescription: string,
  card: Card,
): QualityAssessment | null {
  const ticket = tickets.get(token);
  tickets.delete(token);
  return ticket &&
    ticket.expiresAt >= Date.now() &&
    ticket.fingerprint === fingerprint(rawDescription, card)
    ? ticket.assessment
    : null;
}
