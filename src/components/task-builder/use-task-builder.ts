import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Analysis, Card, emptyCard, Task } from "@/domain/task";
import { useDemo } from "../demo-provider";

export type UpdateCard = <K extends keyof Card>(key: K, value: Card[K]) => void;
export type BuilderStep = 0 | 1 | 2 | 3;

export function useTaskBuilder(task?: Task) {
  const router = useRouter();
  const { act, busy } = useDemo();
  const [card, setCard] = useState<Card>(task?.card ?? { ...emptyCard });
  const [raw, setRawState] = useState(task?.rawDescription ?? "");
  const [step, setStep] = useState<BuilderStep>(task ? 2 : 0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (step !== previousStep.current) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  function invalidateConfirmation() {
    setConfirmed(false);
    setAcknowledged(false);
    setError("");
  }
  const update: UpdateCard = (key, value) => {
    setCard((current) => ({ ...current, [key]: value }));
    invalidateConfirmation();
  };
  function setRaw(value: string) {
    setRawState(value);
    invalidateConfirmation();
  }
  function goToStep(next: BuilderStep) {
    setStep(next);
    setError("");
  }
  async function analyze() {
    setError("");
    if (raw.trim().length < 10) {
      setError("Расскажите о задаче чуть подробнее — минимум 10 символов.");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: raw, card }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не удалось получить вопросы.");
      const nextAnalysis = result as Analysis;
      setAnalysis(nextAnalysis);
      setCard((current) => {
        const next = { ...current };
        for (const [field, value] of Object.entries(nextAnalysis.suggestions)) {
          const key = field as keyof Analysis["suggestions"];
          if (!next[key].trim() && value) next[key] = value;
        }
        if (!next.context.trim()) next.context = raw;
        return next;
      });
      invalidateConfirmation();
      setStep(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось получить вопросы. Повторите попытку.",
      );
    } finally {
      setAnalyzing(false);
    }
  }
  function confirm() {
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
    setError("");
    if (!validateSkills()) return;
    if (publish && !confirmed) {
      setError("Подтвердите карточку перед публикацией.");
      return;
    }
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
      // The provider shows the API error; all form values stay in local state.
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
    analyze,
    confirm,
    save,
    setAcknowledged: (value: boolean) => {
      setAcknowledged(value);
      if (!value) setConfirmed(false);
    },
  };
}
