"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Send,
  Save,
  Info,
  LoaderCircle,
} from "lucide-react";
import {
  Card,
  Task,
  Analysis,
  emptyCard,
  fields,
  topics,
  accessLabels,
} from "@/domain/task";
import { draftExamples } from "@/domain/demo-data";
import { useDemo } from "./demo-provider";
import { ScorePanel, Empty } from "./ui";

export function TaskEditor({ task }: { task?: Task }) {
  const router = useRouter();
  const { actor, setActor, act, busy } = useDemo();
  const [card, setCard] = useState<Card>(task?.card ?? { ...emptyCard });
  const [raw, setRaw] = useState(task?.rawDescription ?? "");
  const [step, setStep] = useState(task ? 2 : 0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  function update(key: keyof Card, value: string) {
    setCard((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
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
      if (!response.ok) throw new Error(result.error);
      setAnalysis(result);
      setCard((current) => ({
        ...current,
        ...result.suggestions,
        context: current.context || result.suggestions.context || raw,
      }));
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
  async function save(publish: boolean) {
    setError("");
    if ((publish || task?.publishedAt) && !confirmed) {
      setError("Подтвердите достоверность сведений перед публикацией.");
      return;
    }
    try {
      const result = await act(
        {
          type: "save-task",
          id: task?.id,
          card,
          rawDescription: raw,
          confirmed,
          publish,
        },
        publish ? "Задача опубликована в каталоге" : "Изменения сохранены",
      );
      router.push(
        publish || task?.publishedAt ? `/tasks/${result.taskId}` : "/business",
      );
    } catch {
      /* The provider presents the API error without losing form input. */
    }
  }
  if (actor !== "business")
    return (
      <>
        <Empty
          title="Задачи публикует бизнес"
          text="Переключитесь на бизнес, чтобы создать или отредактировать карточку."
        />
        <div className="form-actions">
          <button
            className="button primary"
            onClick={() => setActor("business")}
          >
            Перейти в режим бизнеса
          </button>
        </div>
      </>
    );
  return (
    <>
      <Link href={task ? `/tasks/${task.id}` : "/"} className="back-link">
        <ArrowLeft size={15} />
        {task ? "К задаче" : "В каталог"}
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">КОНСТРУКТОР ЗАДАЧИ</div>
          <h1>{task ? "Сделаем задачу понятнее" : "Начнём с вашей идеи"}</h1>
          <p>
            Расскажите о потребности бизнеса. Мы поможем уточнить детали
            <br className="desktop-break" /> и подготовить задачу, за которую
            захочется взяться.
          </p>
        </div>
      </div>
      <div className="stepper" aria-label="Этапы создания задачи">
        {["Описание", "Уточнения", "Карточка"].map((label, index) => (
          <Fragment key={label}>
            {index > 0 && <i />}
            <div
              className={step >= index ? "active" : ""}
              aria-current={step === index ? "step" : undefined}
            >
              <span>
                {step > index ? <Check size={12} /> : `0${index + 1}`}
              </span>
              {label}
            </div>
          </Fragment>
        ))}
      </div>
      <div className="content-columns">
        <div className="stack">
          <section className="panel">
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {step === 0 && (
              <>
                <div className="section-title">
                  <h2>Что вы хотите изменить?</h2>
                  <Sparkles size={19} color="var(--green)" />
                </div>
                <p className="muted text-small" style={{ marginBottom: 22 }}>
                  Пишите своими словами. Не обязательно знать все детали —
                  начнём с того, что уже есть.
                </p>
                <label className="field">
                  <span>Описание задачи</span>
                  <textarea
                    aria-label="Описание задачи"
                    rows={7}
                    maxLength={4000}
                    value={raw}
                    disabled={analyzing}
                    onChange={(event) => setRaw(event.target.value)}
                    placeholder="Например: у нас сеть кофеен. Каждый вечер остаётся выпечка. Хотим точнее планировать, сколько готовить на завтра…"
                  />
                </label>
                <label className="field">
                  <span>Тема</span>
                  <select
                    value={card.topic}
                    onChange={(event) => update("topic", event.target.value)}
                    disabled={analyzing}
                  >
                    {topics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
                <div className="muted text-small">Или начните с примера</div>
                <div className="example-options">
                  {draftExamples.map((example) => (
                    <button
                      key={example.title}
                      disabled={analyzing}
                      onClick={() => {
                        setRaw(example.text);
                        setError("");
                      }}
                    >
                      {example.title}
                    </button>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    className="button primary"
                    onClick={analyze}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}{" "}
                    {analyzing ? "Анализируем описание…" : "Помочь с описанием"}
                  </button>
                </div>
              </>
            )}
            {step === 1 && analysis && (
              <>
                <div className="section-title">
                  <h2>Несколько важных деталей</h2>
                  <span>Шаг 02</span>
                </div>
                <div
                  className={`info-note ${analysis.mode === "local" ? "local" : ""}`}
                >
                  <Info size={16} />
                  <span>{analysis.message}</span>
                </div>
                <p className="muted text-small" style={{ marginBottom: 20 }}>
                  Ответьте на то, что знаете. Остальное можно уточнить позже:
                  неполная задача тоже может быть опубликована.
                </p>
                {analysis.questions.map((question, index) => (
                  <label className="field" key={`${question.field}-${index}`}>
                    <span>
                      {index + 1}. {question.question}
                    </span>
                    <textarea
                      value={card[question.field]}
                      onChange={(event) =>
                        update(question.field, event.target.value)
                      }
                      maxLength={4000}
                      placeholder="Ваш ответ"
                    />
                  </label>
                ))}
                <div className="form-actions">
                  <button
                    className="button secondary"
                    onClick={() => setStep(0)}
                  >
                    <ArrowLeft size={15} />
                    Назад
                  </button>
                  <button
                    className="button primary push"
                    onClick={() => setStep(2)}
                  >
                    Перейти к карточке
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {step === 2 && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(true);
                }}
              >
                <div className="section-title">
                  <h2>Проверьте карточку</h2>
                  <span>{task?.publishedAt ? "Редактирование" : "Шаг 03"}</span>
                </div>
                <label className="field">
                  <span>Название задачи *</span>
                  <input
                    required
                    value={card.title}
                    onChange={(event) => update("title", event.target.value)}
                    maxLength={160}
                    placeholder="Какой результат вы хотите получить?"
                  />
                </label>
                <label className="field">
                  <span>Тема *</span>
                  <select
                    required
                    value={card.topic}
                    onChange={(event) => update("topic", event.target.value)}
                  >
                    {topics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="field">
                      <span>{field.label}</span>
                      {["contact", "successTarget"].includes(field.key) ? (
                        <input
                          value={card[field.key]}
                          maxLength={4000}
                          onChange={(event) =>
                            update(field.key, event.target.value)
                          }
                          placeholder={field.hint}
                        />
                      ) : (
                        <textarea
                          value={card[field.key]}
                          maxLength={4000}
                          onChange={(event) =>
                            update(field.key, event.target.value)
                          }
                          placeholder={field.hint}
                        />
                      )}
                    </label>
                    {field.key === "dataDescription" && (
                      <label className="field">
                        <span>Доступ к данным</span>
                        <select
                          value={card.dataAccess}
                          onChange={(event) =>
                            update("dataAccess", event.target.value)
                          }
                        >
                          {Object.entries(accessLabels).map(([key, label]) => (
                            <option value={key} key={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                ))}
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    Я проверил(а) сведения и подтверждаю, что карточка описывает
                    реальную потребность бизнеса.
                  </span>
                </label>
                <div className="form-actions">
                  {!task?.publishedAt && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => save(false)}
                      disabled={busy}
                    >
                      <Save size={15} />
                      Сохранить черновик
                    </button>
                  )}
                  <button
                    className="button primary push"
                    disabled={busy || !confirmed}
                  >
                    <Send size={15} />
                    {task?.publishedAt
                      ? "Сохранить изменения"
                      : "Опубликовать задачу"}
                  </button>
                </div>
                <p className="text-small muted" style={{ marginTop: 14 }}>
                  Любой рейтинг подходит для публикации. Вы сможете дополнить
                  задачу позже.
                </p>
              </form>
            )}
          </section>
        </div>
        <aside className="sticky-aside">
          <ScorePanel card={card} preview />
        </aside>
      </div>
    </>
  );
}
