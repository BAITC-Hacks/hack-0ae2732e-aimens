"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  LoaderCircle,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { Task } from "@/domain/task";
import { useDemo } from "./demo-provider";
import { ScorePanel, Empty } from "./ui";
import { BuilderStep, useTaskBuilder } from "./task-builder/use-task-builder";
import { DraftStep } from "./task-builder/draft-step";
import { ClarificationStep } from "./task-builder/clarification-step";
import { CardFields } from "./task-builder/card-fields";
import { PublishStep } from "./task-builder/publish-step";
import styles from "./task-builder/task-builder.module.css";

const steps = ["Черновик", "Уточнение", "Карточка", "Публикация"];
const headings = [
  "Начните с вашей идеи",
  "Уточним самое важное",
  "Проверьте карточку",
  "Всё готово к публикации?",
];

export function TaskEditor({ task }: { task?: Task }) {
  const { actor, setActor } = useDemo();
  const builder = useTaskBuilder(task);
  const {
    step,
    reachedStep,
    card,
    raw,
    busy,
    analyzing,
    analysis,
    confirmed,
    goToStep,
    update,
    setRaw,
    error,
    acknowledged,
    headingRef,
    setAcknowledged,
    confirm,
    analyze,
    save,
  } = builder;
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
      <Link
        href={task ? `/tasks/${task.id}` : "/catalog"}
        className="back-link"
      >
        <ArrowLeft size={15} />
        {task ? "К задаче" : "В каталог"}
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">КОНСТРУКТОР ЗАДАЧИ</div>
          <h1>
            {task
              ? "Сделаем задачу понятнее"
              : "Хорошее решение начинается с задачи"}
          </h1>
          <p>
            От первого описания до понятного брифа для студенческой команды.
          </p>
        </div>
      </div>
      <ol className={styles.stepper} aria-label="Этапы создания задачи">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              aria-current={step === index ? "step" : undefined}
              disabled={
                busy ||
                analyzing ||
                index > reachedStep ||
                (index === 1 && !analysis)
              }
              onClick={() => goToStep(index as BuilderStep)}
            >
              <span aria-hidden="true">
                {step > index ? <Check size={14} /> : `0${index + 1}`}
              </span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="content-columns">
        <section
          className="panel"
          aria-labelledby="builder-stage-title"
          aria-busy={analyzing || busy}
        >
          <h2
            id="builder-stage-title"
            tabIndex={-1}
            ref={headingRef}
            className={styles.stageTitle}
          >
            {headings[step]}
          </h2>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {step === 0 && (
            <DraftStep
              card={card}
              raw={raw}
              disabled={analyzing || busy}
              setRaw={setRaw}
              update={update}
            />
          )}
          {step === 1 && analysis && (
            <ClarificationStep
              analysis={analysis}
              card={card}
              update={update}
            />
          )}
          {step === 2 && (
            <>
              <CardFields
                card={card}
                raw={raw}
                setRaw={setRaw}
                update={update}
                analysis={analysis}
              />
              <button
                type="button"
                className="button secondary"
                disabled={busy || analyzing}
                onClick={analyze}
              >
                {analyzing ? "Анализируем карточку…" : "Повторно уточнить с AI"}
              </button>
            </>
          )}
          {step === 3 && (
            <PublishStep
              card={card}
              raw={raw}
              company={task?.company ?? "Моя компания"}
              acknowledged={acknowledged}
              confirmed={confirmed}
              setAcknowledged={setAcknowledged}
              confirm={confirm}
              edit={() => goToStep(2)}
            />
          )}
          <div className={`form-actions ${styles.actions}`}>
            {step === 1 && (
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => goToStep(0)}
              >
                <ArrowLeft size={15} />
                Назад
              </button>
            )}
            {!task?.publishedAt && (
              <button
                type="button"
                className="button secondary"
                disabled={busy || analyzing}
                onClick={() => save(false)}
              >
                <Save size={15} />
                Сохранить черновик
              </button>
            )}
            {step === 0 && (
              <button
                type="button"
                className="button primary push"
                disabled={busy || analyzing}
                onClick={analyze}
              >
                {analyzing ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {analyzing ? "Анализируем описание…" : "Помочь с описанием"}
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                className="button primary push"
                disabled={busy}
                onClick={() => goToStep(2)}
              >
                Перейти к карточке
                <ArrowRight size={16} />
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                className="button primary push"
                disabled={busy}
                onClick={() => goToStep(3)}
              >
                <Eye size={16} />
                Предпросмотр
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="button primary push"
                disabled={busy || !confirmed}
                onClick={() => save(true)}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Send size={16} />
                )}
                {task?.publishedAt
                  ? "Сохранить изменения"
                  : "Опубликовать задачу"}
              </button>
            )}
          </div>
          <p className={styles.saveNote}>
            {task?.publishedAt
              ? "В каталоге появятся только сохранённые и подтверждённые изменения."
              : "Черновик виден только бизнесу. Публикация — отдельный шаг."}
          </p>
        </section>
        <aside className="sticky-aside">
          <ScorePanel card={card} preview />
        </aside>
      </div>
    </>
  );
}
