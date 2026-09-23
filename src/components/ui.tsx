"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Circle,
  Clock3,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Readiness, Task, Card, computeReadiness } from "@/domain/task";
import { useDemo } from "./demo-provider";

export function Loading() {
  return (
    <div className="loading" aria-busy="true" aria-label="Загрузка">
      <div className="skeleton short" />
      {[1, 2, 3].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Empty({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Circle size={27} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {href && (
        <Link className="button secondary" href={href}>
          {action || "В каталог"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Badge({ readiness }: { readiness: Readiness }) {
  return (
    <span className={`badge ${readiness.level.key}`}>
      <span className="badge-dot" />
      {readiness.level.label}
    </span>
  );
}
export function ScorePanel({
  card,
  preview = false,
}: {
  card: Card;
  preview?: boolean;
}) {
  const result = computeReadiness(card);
  return (
    <section className="panel score-panel">
      <div className="eyebrow">
        {preview ? "ПРЕДВАРИТЕЛЬНАЯ ГОТОВНОСТЬ" : "ГОТОВНОСТЬ ЗАДАЧИ"}
      </div>
      <div className="score-big">
        {result.score}
        <span>/ 100</span>
      </div>
      <Badge readiness={result} />
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Готовность задачи"
        aria-valuenow={result.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${result.score}%` }} />
      </div>
      <p className="muted text-small">
        {preview
          ? "Рейтинг в каталоге изменится после подтверждения сведений."
          : "Чем подробнее задача, тем проще команде приступить к работе."}
      </p>
      <div className="score-breakdown">
        {result.breakdown.map((row) => (
          <div key={row.field} className={row.complete ? "complete" : ""}>
            {row.complete ? <Check size={15} /> : <Circle size={13} />}
            <span>{row.label}</span>
            <strong>
              {row.earned}
              <small>/{row.max}</small>
            </strong>
          </div>
        ))}
      </div>
      {result.missing.length > 0 ? (
        <div className="improve">
          <h3>Следующий шаг</h3>
          <p>{result.missing[0].tip}</p>
          <span>+{result.missing[0].max} баллов к готовности</span>
        </div>
      ) : (
        <div className="improve">
          <h3>Можно начинать!</h3>
          <p>Все сведения заполнены. Командам будет проще оценить задачу.</p>
        </div>
      )}
    </section>
  );
}
export function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <div className="task-card-top">
        <div className={`company-mark topic-${task.card.topic}`}>
          {task.company.slice(0, 1)}
        </div>
        <div className="company-info">
          <strong>{task.company}</strong>
          <span>Астана · {task.card.topic}</span>
        </div>
        <Badge readiness={task.readiness} />
      </div>
      <h2>
        <Link href={`/tasks/${task.id}`}>{task.card.title}</Link>
      </h2>
      <p className="task-summary">
        {task.card.need ||
          task.card.context ||
          "Бизнес уточняет детали этой задачи."}
      </p>
      <div className="task-tags">
        <span>{task.card.topic}</span>
        <span>
          {task.readiness.breakdown.find(
            (row) => row.field === "dataDescription",
          )?.complete
            ? "Данные доступны"
            : "Данные уточняются"}
        </span>
      </div>
      <div className="task-card-footer">
        <span className="score-inline">
          <span className="mini-track">
            <i style={{ width: `${task.readiness.score}%` }} />
          </span>
          <strong>{task.readiness.score}</strong>/100
        </span>
        <span className="subtle">
          <MessageSquare size={14} />
          {task.proposalCount} откликов
        </span>
        <Link href={`/tasks/${task.id}`} className="text-link">
          Подробнее <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
export function DataGate({ children }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useDemo();
  if (loading) return <Loading />;
  if (!data)
    return (
      <div className="empty">
        <h2>Не удалось загрузить данные</h2>
        <p>{error}</p>
        <button
          className="button secondary"
          onClick={() => {
            void reload().catch(() => {});
          }}
        >
          Повторить
        </button>
      </div>
    );
  return children;
}
export function Status({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "На рассмотрении",
    selected: "Команда выбрана",
    rejected: "Отклонено",
  };
  return (
    <span className={`proposal-status ${status}`}>
      <Clock3 size={13} />
      {map[status] || status}
    </span>
  );
}
