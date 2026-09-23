import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Analysis,
  Card,
  emptyCard,
  FieldKey,
  fields,
  Task,
} from "@/domain/task";
import { parseBuilderAnalysis } from "@/domain/builder-analysis";
import { useDemo } from "../demo-provider";

export type UpdateCard = <K extends keyof Card>(key: K, value: Card[K]) => void;
export type BuilderStep = 0 | 1 | 2 | 3;

export function useTaskBuilder(task?: Task) {
  const router = useRouter();
  const { act, busy } = useDemo();
  const [card, setCard] = useState<Card>(task?.card ?? { ...emptyCard });
  const [raw, setRawState] = useState(task?.rawDescription ?? "");
  const [step, setStep] = useState<BuilderStep>(task ? 2 : 0);
  const [reachedStep, setReachedStep] = useState<BuilderStep>(task ? 2 : 0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [fillMessage, setFillMessage] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const saving = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (step !== previousStep.current) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);
  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
    },
    [],
  );

  function locked() {
    return busy || saving.current || !!request.current;
  }

  function invalidateConfirmation() {
    setConfirmed(false);
    setAcknowledged(false);
    setError("");
  }
  const update: UpdateCard = (key, value) => {
    if (locked()) return;
    setCard((current) => ({ ...current, [key]: value }));
    if (key === "topic") setAnalysis(null);
    invalidateConfirmation();
  };
  function setRaw(value: string) {
    if (locked()) return;
    setRawState(value);
    setAnalysis(null);
    invalidateConfirmation();
  }
  function goToStep(next: BuilderStep) {
    if (locked() || (next === 1 && !analysis)) return;
    navigate(next);
  }
  function navigate(next: BuilderStep) {
    setStep(next);
    setReachedStep((current) => Math.max(current, next) as BuilderStep);
    setError("");
  }
  function rejectSuggestion(field: FieldKey) {
    if (locked()) return;
    const proposed = analysis?.suggestions[field];
    setCard((current) =>
      proposed && current[field] === proposed
        ? { ...current, [field]: "" }
        : current,
    );
    invalidateConfirmation();
    setAnalysis((current) => {
      if (!current) return current;
      const suggestions = { ...current.suggestions };
      const sources = { ...current.sources };
      delete suggestions[field];
      delete sources[field];
      return { ...current, suggestions, sources };
    });
  }
  function acceptSuggestion(field: FieldKey) {
    if (locked()) return;
    const value = analysis?.suggestions[field];
    if (!value) return;
    setCard((current) =>
      current[field].trim() ? current : { ...current, [field]: value },
    );
    invalidateConfirmation();
  }
  function cancelAnalysis() {
    request.current?.abort();
    request.current = null;
    setAnalyzing(false);
    setError("Анализ отменён. Описание и ваши ответы сохранены в форме.");
  }
  async function runAnalysis(target?: FieldKey | "all") {
    if (locked()) return;
    setError("");
    setFillMessage("");
    if (raw.trim().length < 10) {
      setError("Расскажите о задаче чуть подробнее — минимум 10 символов.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setAnalyzing(true);
    // Leave enough time for the server's 20-second local fallback.
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: raw, card }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не удалось получить вопросы.");
      const nextAnalysis = parseBuilderAnalysis(result, raw, card);
      if (request.current !== controller) return;
      setAnalysis(nextAnalysis);
      setCard((current) => {
        const next = { ...current };
        for (const { key } of fields) {
          if (target && target !== "all" && target !== key) continue;
          const value = nextAnalysis.suggestions[key];
          if (!next[key].trim() && value) next[key] = value;
        }
        return next;
      });
      invalidateConfirmation();
      if (!target) navigate(1);
      else {
        const count = fields.filter(
          ({ key }) =>
            (target === "all" || target === key) &&
            nextAnalysis.suggestions[key],
        ).length;
        setFillMessage(
          nextAnalysis.mode === "local"
            ? "Локальный режим: ИИ недоступен. Заполните поля вручную или повторите позже."
            : count
              ? `Заполнено полей: ${count}. Текст можно сразу отредактировать ниже.`
              : "В описании не найдено подтверждённых сведений для заполнения. Дополните описание или введите ответ вручную.",
        );
      }
    } catch (err) {
      if (request.current !== controller) return;
      setError(
        controller.signal.aborted
          ? "Сервер не ответил вовремя. Ввод сохранён в форме — повторите анализ."
          : err instanceof Error &&
              err.name !== "ZodError" &&
              !(err instanceof SyntaxError)
            ? err.message
            : "Получен некорректный ответ. Ввод сохранён в форме — повторите анализ.",
      );
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setAnalyzing(false);
      }
    }
  }
  function confirm() {
    if (locked()) return;
    if (!validateSkills()) return;
    if (!card.title.trim() || !card.topic.trim()) {
      setError(
        "Укажите название и тему задачи. Остальные сведения можно дополнить позже.",
      );
      return;
    }
    if (!acknowledged) {
      setError("Подтвердите, что вы проверили сведения в карточке.");
      return;
    }
    setError("");
    setConfirmed(true);
  }
  async function save(publish: boolean) {
    if (locked()) return;
    setError("");
    if (!validateSkills()) return;
    if (publish && !confirmed) {
      setError("Подтвердите карточку перед публикацией.");
      return;
    }
    saving.current = true;
    try {
      const result = await act(
        {
          type: "save-task",
          id: task?.id,
          card,
          rawDescription: raw,
          confirmed: publish && confirmed,
          publish,
        },
        publish
          ? task?.publishedAt
            ? "Изменения сохранены"
            : "Задача опубликована в каталоге"
          : "Черновик сохранён",
      );
      router.push(publish ? `/tasks/${result.taskId}` : "/business");
    } catch {
      setError(
        "Не удалось сохранить карточку. Ввод остался в форме — повторите сохранение.",
      );
    } finally {
      saving.current = false;
    }
  }
  function validateSkills() {
    if (
      card.skills.length > 12 ||
      card.skills.some((skill) => skill.length > 60)
    ) {
      setError(
        "Укажите не больше 12 навыков, каждый — до 60 символов. Изменить их можно на шаге «Карточка».",
      );
      return false;
    }
    return true;
  }
  return {
    card,
    raw,
    step,
    reachedStep,
    analysis,
    analyzing,
    busy,
    error,
    confirmed,
    acknowledged,
    headingRef,
    update,
    setRaw,
    goToStep,
    analyze: () => runAnalysis(),
    fillWithAI: (field?: FieldKey) => runAnalysis(field ?? "all"),
    fillMessage,
    cancelAnalysis,
    acceptSuggestion,
    rejectSuggestion,
    confirm,
    save,
    setAcknowledged: (value: boolean) => {
      if (locked()) return;
      setAcknowledged(value);
      if (!value) setConfirmed(false);
    },
  };
}
