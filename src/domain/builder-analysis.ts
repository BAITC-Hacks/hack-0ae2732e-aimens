import { z } from "zod";
import { Analysis, Card, cardSchema, FieldKey, fields } from "./task";

const field = z.enum(fields.map(({ key }) => key) as [FieldKey, ...FieldKey[]]);
const excerpts = z.partialRecord(field, z.string().trim().min(1).max(4000));
const schema = z.object({
  mode: z.enum(["openai", "local"]),
  message: z.string().min(1).max(1000),
  suggestions: excerpts,
  sources: excerpts,
  missingFields: z.array(cardSchema.keyof()).max(20),
  questions: z
    .array(z.object({ field, question: z.string().trim().min(5).max(500) }))
    .min(3)
    .max(5)
    .refine(
      (items) => new Set(items.map((item) => item.field)).size === items.length,
    ),
});

/** Recheck the HTTP boundary before rendering or accepting any suggested fact. */
export function parseBuilderAnalysis(
  input: unknown,
  description: string,
  card: Card,
): Analysis {
  const result = schema.parse(input);
  const sourceTexts = [
    description,
    card.title,
    card.topic,
    ...fields.map(({ key }) => card[key]),
    ...card.skills,
  ];
  const suggestions: Analysis["suggestions"] = {};
  const sources: Analysis["sources"] = {};
  if (result.mode === "openai") {
    for (const { key } of fields) {
      const value = result.suggestions[key];
      const quote = result.sources[key];
      if (
        value &&
        quote?.includes(value) &&
        !card[key].trim() &&
        sourceTexts.some((text) => text.includes(quote))
      ) {
        suggestions[key] = value;
        sources[key] = quote;
      }
    }
  }
  return { ...result, suggestions, sources };
}
