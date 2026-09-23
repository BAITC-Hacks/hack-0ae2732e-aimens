import { describe, expect, it } from "vitest";
import {
  ANALYZE_RATE_LIMIT,
  consumeAnalyzeRateLimit,
  localAnalysis,
  resetAnalyzeRateLimitForTests,
  validateAnalysis,
} from "@/server/ai";
import { emptyCard } from "@/domain/task";
import { POST } from "@/app/api/analyze/route";
describe("AI assistance", () => {
  it("has at least three useful questions without a key", () => {
    const result = localAnalysis("Кофейня списывает выпечку", emptyCard);
    expect(result.mode).toBe("local");
    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions).toEqual({});
  });
  it("rejects inventions even with a valid-looking source", () => {
    const questions = localAnalysis(
      "Кофейня списывает выпечку",
      emptyCard,
    ).questions;
    const result = validateAnalysis(
      {
        extractions: [
          {
            field: "context",
            value: "Кофейня списывает выпечку",
            sourceQuote: "Кофейня списывает выпечку",
          },
          {
            field: "successTarget",
            value: "Снижение на 50%",
            sourceQuote: "Кофейня списывает выпечку",
          },
        ],
        questions,
      },
      "Кофейня списывает выпечку",
      emptyCard,
    );
    expect(result.suggestions.context).toBe("Кофейня списывает выпечку");
    expect(result.suggestions.successTarget).toBeUndefined();
  });
  it("rejects malformed model responses", () => {
    expect(() =>
      validateAnalysis({ questions: [] }, "Текст", emptyCard),
    ).toThrow();
  });
  it("deduplicates repeated model questions and fills unique fields locally", () => {
    const result = validateAnalysis(
      {
        extractions: [],
        questions: [
          { field: "need", question: "Что именно нужно изменить?" },
          { field: "need", question: "Какую проблему нужно решить?" },
          { field: "users", question: "Что именно нужно изменить?!" },
          { field: "users", question: "Кто будет пользоваться решением?" },
          { field: "users", question: "Кто будет пользоваться решением?" },
        ],
      },
      "Кофейня списывает выпечку",
      emptyCard,
    );

    expect(result.questions).toHaveLength(5);
    expect(new Set(result.questions.map(({ field }) => field)).size).toBe(5);
    const normalized = result.questions.map(({ question }) =>
      question
        .toLocaleLowerCase("ru")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim(),
    );
    expect(new Set(normalized).size).toBe(5);
  });
  it("keeps accepted source quotes when questions need repair", () => {
    const result = validateAnalysis(
      {
        extractions: [
          {
            field: "context",
            value: "Кофейня списывает выпечку",
            sourceQuote: "Кофейня списывает выпечку",
          },
        ],
        questions: [
          { field: "need", question: "Что нужно изменить в процессе?" },
          { field: "need", question: "Какую проблему важно решить?" },
          { field: "need", question: "Какой результат ожидаете?" },
        ],
      },
      "Кофейня списывает выпечку",
      emptyCard,
    );

    expect(result.suggestions.context).toBe("Кофейня списывает выпечку");
    expect(result.sources.context).toBe("Кофейня списывает выпечку");
    expect(result.questions).toHaveLength(3);
    expect(new Set(result.questions.map(({ field }) => field)).size).toBe(3);
  });
});

describe("AI endpoint rate limit", () => {
  it("blocks an over-limit client and sends a retry hint", async () => {
    resetAnalyzeRateLimitForTests();
    const client = "203.0.113.42";
    const now = Date.now();
    for (let index = 0; index < ANALYZE_RATE_LIMIT.maxRequests; index += 1) {
      expect(consumeAnalyzeRateLimit(client, now).allowed).toBe(true);
    }

    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "x-forwarded-for": client },
      }),
    );
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    resetAnalyzeRateLimitForTests();
  });

  it("stops an oversized streaming body without trusting Content-Length", async () => {
    resetAnalyzeRateLimitForTests();
    let pulls = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(20_000));
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.43" },
      body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(10);
    resetAnalyzeRateLimitForTests();
  });
});
