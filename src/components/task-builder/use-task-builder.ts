import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Analysis,
  Card,
  emptyCard,
  QualityAssessment,
  Task,
  TopicSuggestion,
} from "@/domain/task";
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
  const [preliminaryReadiness, setPreliminaryReadiness] = useState<
    Analysis["preliminaryReadiness"] | null
  >(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [qualityAssessment, setQualityAssessment] =
    useState<QualityAssessment | null>(task?.qualityAssessment ?? null);
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [topicSuggestion, setTopicSuggestion] =
    useState<TopicSuggestion | null>(null);
  const [suggestingTopic, setSuggestingTopic] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const latestInput = useRef({ raw, card });
  const topicRequest = useRef<string | null>(null);
  useEffect(() => {
    latestInput.current = { raw, card };
  }, [raw, card]);
  const previousStep = useRef(step);
  useEffect(() => {
    if (step !== previousStep.current) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  function invalidateConfirmation() {
    setConfirmed(false);
    setAcknowledged(false);
    setError("");
    setQualityAssessment(null);
    setReviewToken(null);
  }
  const update: UpdateCard = (key, value) => {
    setCard((current) => ({ ...current, [key]: value }));
    setPreliminaryReadiness(null);
    invalidateConfirmation();
  };
  function setRaw(value: string) {
    setRawState(value);
    setTopicSuggestion(null);
    topicRequest.current = null;
    setPreliminaryReadiness(null);
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
      setPreliminaryReadiness(nextAnalysis.preliminaryReadiness);
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
  async function suggestTopic() {
    setError("");
    if (raw.trim().length < 8) {
      setError(
        "Добавьте несколько слов о задаче, чтобы подобрать направление.",
      );
      return;
    }
    if (topicRequest.current === raw) return;
    topicRequest.current = raw;
    setSuggestingTopic(true);
    try {
      const response = await fetch("/api/suggest-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: raw }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не удалось определить тему");
      if (latestInput.current.raw !== raw) return;
      setTopicSuggestion(result as TopicSuggestion);
      setCard((current) => ({ ...current, topic: result.topic }));
      invalidateConfirmation();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось определить тему",
      );
    } finally {
      if (topicRequest.current === raw) topicRequest.current = null;
      setSuggestingTopic(false);
    }
  }
  async function reviewTask() {
    setError("");
    setReviewing(true);
    try {
      const response = await fetch("/api/review-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: raw, card }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не удалось оценить задачу");
      if (
        latestInput.current.raw !== raw ||
        JSON.stringify(latestInput.current.card) !== JSON.stringify(card)
      )
        return;
      setQualityAssessment(result.assessment as QualityAssessment);
      setReviewToken(result.reviewToken as string);
      setConfirmed(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось оценить задачу",
      );
    } finally {
      setReviewing(false);
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
    if (publish && (!qualityAssessment || !reviewToken)) {
      setError("Сначала нажмите «Анализ задачи». ");
      return;
    }
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
          reviewToken: publish ? (reviewToken ?? undefined) : undefined,
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
    preliminaryReadiness,
    analyzing,
    busy,
    error,
    confirmed,
    qualityAssessment,
    reviewing,
    topicSuggestion,
    suggestingTopic,
    acknowledged,
    headingRef,
    update,
    setRaw,
    goToStep,
    analyze,
    suggestTopic,
    reviewTask,
    confirm,
    save,
    setAcknowledged: (value: boolean) => {
      setAcknowledged(value);
      if (!value) setConfirmed(false);
    },
  };
}
