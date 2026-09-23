import { describe, expect, it } from "vitest";
import { parseBuilderAnalysis } from "@/domain/builder-analysis";
import { emptyCard } from "@/domain/task";

const description = "Кофейня списывает выпечку вечером.";
const response = {
  mode: "openai",
  message: "Готово",
  suggestions: { context: description },
  sources: { context: description },
  missingFields: ["need"],
  questions: [
    { field: "need", question: "Что нужно изменить?" },
    { field: "users", question: "Кому нужно решение?" },
    { field: "constraints", question: "Какие есть ограничения?" },
  ],
};

describe("builder analysis boundary", () => {
  it("accepts cited facts without changing the card", () => {
    const card = { ...emptyCard };
    expect(
      parseBuilderAnalysis(response, description, card).suggestions.context,
    ).toBe(description);
    expect(card.context).toBe("");
  });
  it("drops invented facts and refuses to overwrite existing answers", () => {
    const invalid = { ...response, suggestions: { context: "Пять кофеен" } };
    expect(
      parseBuilderAnalysis(invalid, description, emptyCard).suggestions,
    ).toEqual({});
    expect(
      parseBuilderAnalysis(response, description, {
        ...emptyCard,
        context: "Мой ответ",
      }).suggestions,
    ).toEqual({});
  });
  it("rejects malformed and duplicate questions", () => {
    expect(() => parseBuilderAnalysis({}, description, emptyCard)).toThrow();
    expect(() =>
      parseBuilderAnalysis(
        { ...response, questions: Array(3).fill(response.questions[0]) },
        description,
        emptyCard,
      ),
    ).toThrow();
  });
  it("does not present generated facts as local suggestions", () => {
    expect(
      parseBuilderAnalysis(
        { ...response, mode: "local" },
        description,
        emptyCard,
      ).suggestions,
    ).toEqual({});
  });
});
