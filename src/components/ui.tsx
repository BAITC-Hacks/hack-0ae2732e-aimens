"use client";
import { useLocale } from "./locale-provider";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  Banknote,
  BriefcaseBusiness,
  Check,
  Circle,
  Clock3,
  Factory,
  HeartPulse,
  Leaf,
  MapPinned,
  Megaphone,
  MessageSquare,
  ArrowRight,
  ShoppingBag,
  Truck,
  Eye,
  Wheat,
  Database,
  type LucideIcon,
} from "lucide-react";
import {
  Readiness,
  Task,
  Card,
  computeReadiness,
  levels,
  QualityAssessment,
  workFormatLabels,
} from "@/domain/task";
import { useDemo } from "./demo-provider";
import { FavoriteButton } from "./favorites";
import { ScoreRing } from "./score-ring";
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
      <Image src="/assets/svg/empty-state.svg" alt="" width={128} height={80} />
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
  assessment,
  preview = false,
}: {
  card: Card;
  assessment?: QualityAssessment | null;
  preview?: boolean;
}) {
  const result = computeReadiness(card);
  const nextLevel = levels.find((level) => level.min > result.score);
  const nextActions = [...result.missing]
    .sort((left, right) => right.max - left.max)
    .slice(0, 3);
  return (
    <section className="panel score-panel">
      <div className="eyebrow">
        {preview ? "ПРЕДВАРИТЕЛЬНЫЙ РЕЙТИНГ" : "РЕЙТИНГ ГОТОВНОСТИ"}
      </div>
      <ScoreRing score={result.score} />
      <Badge readiness={result} />
      <p className="muted text-small score-description">
        {preview
          ? "Изменения станут публичными после подтверждения карточки."
          : "Полнота задачи, а не оценка компании."}
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
            <div className="score-row-track">
              <i
                style={{
                  width: `${Math.max(0, Math.min(100, (row.earned / row.max) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {result.missing.length > 0 ? (
        <div className="improve">
          <h3>Что повысит рейтинг</h3>
          {nextActions.map((row) => (
            <div className="improvement-row" key={row.field}>
              <strong>+{row.max}</strong>
              <p>{row.tip}</p>
            </div>
          ))}
          {nextLevel && (
            <p className="next-level">
              До уровня «{nextLevel.label}» — {nextLevel.min - result.score}{" "}
              баллов
            </p>
          )}
        </div>
      ) : (
        <div className="improve complete-note">
          <Check size={18} />
          <div>
            <h3>Все детали на месте</h3>
            <p>Команда может оценить объём работы.</p>
          </div>
        </div>
      )}
      {assessment && (
        <div className="improve">
          <h3>Рекомендации по содержанию</h3>
          <p data-no-translate>{assessment.summary}</p>
          <p className="muted text-small">
            Дополнительный анализ не меняет рейтинг готовности.
          </p>
        </div>
      )}
    </section>
  );
}
export function categoryAsset(topic: string) {
  return (
    (
      {
        Торговля: "category-commerce",
        Образование: "category-education",
        Логистика: "category-logistics",
        Сервисы: "category-it",
        Маркетинг: "category-marketing",
      } as Record<string, string>
    )[topic] ?? "briefcase"
  );
}
const taskVisualIcon: Record<string, LucideIcon> = {
  Торговля: ShoppingBag,
  Образование: BookOpen,
  Логистика: Truck,
  Сервисы: BriefcaseBusiness,
  Маркетинг: Megaphone,
  "Сельское хозяйство": Wheat,
  Туризм: MapPinned,
  "IT и данные": Database,
  Производство: Factory,
  Здоровье: HeartPulse,
  Финансы: Banknote,
  Экология: Leaf,
};
const demoBrandSubtitle: Record<string, string> = {
  "task-coffee": "Zhibek Zholy",
  "task-education": "Bilim School",
  "task-delivery": "Тұлпар жеткізу",
};
export function TaskCard({
  task,
  visual = false,
  onPreview,
  selected = false,
}: {
  task: Task;
  visual?: boolean;
  onPreview?: () => void;
  selected?: boolean;
}) {
  const { locale, t } = useLocale();
  const readiness = task.readiness;
  const VisualIcon = taskVisualIcon[task.card.topic] ?? BriefcaseBusiness;
  return (
    <article
      className={`task-card ${visual ? "visual-card" : ""} ${selected ? "is-selected" : ""}`}
      data-task-id={task.id}
    >
      {visual && (
        <div className={`task-visual topic-${task.card.topic}`}>
          <VisualIcon size={58} strokeWidth={1.8} aria-hidden="true" />
          <span>{task.card.topic}</span>
          <span className="visual-brand">
            <span className="visual-word" data-no-translate>
              {task.company}
            </span>
            {demoBrandSubtitle[task.id] && (
              <small className="visual-transliteration">
                {demoBrandSubtitle[task.id]}
              </small>
            )}
          </span>
        </div>
      )}
      <div className="task-card-content">
        <div className="task-card-top">
          <div
            className={`company-mark topic-${task.card.topic}`}
            aria-hidden="true"
          >
            {task.company.slice(0, 1)}
          </div>
          <div className="company-info">
            <strong data-no-translate>{task.company}</strong>
            <span>
              {task.card.topic} ·{" "}
              {task.publishedAt
                ? new Date(task.publishedAt).toLocaleDateString(
                    { ru: "ru-RU", kk: "kk-KZ", en: "en-US" }[locale],
                    {
                      day: "numeric",
                      month: "short",
                    },
                  )
                : "Черновик"}
            </span>
          </div>
          <FavoriteButton id={task.id} title={task.card.title} />
        </div>
        <h2>
          <Link href={`/tasks/${task.id}`} data-no-translate>
            {task.card.title}
          </Link>
        </h2>
        <p
          className="task-summary"
          data-no-translate={
            !!(task.card.need || task.card.context) || undefined
          }
        >
          {task.card.need ||
            task.card.context ||
            "Бизнес уточняет детали этой задачи."}
        </p>
        <div className="tags">
          {(task.card.skills ?? []).slice(0, 3).map((skill) => (
            <span key={skill} data-no-translate>
              {skill}
            </span>
          ))}
        </div>
        <div className="task-card-footer">
          <span>{workFormatLabels[task.card.workFormat ?? "unspecified"]}</span>
          <span className="subtle">
            <MessageSquare size={14} />
            {task.proposalCount}{" "}
            {locale === "en"
              ? task.proposalCount === 1
                ? "response"
                : "responses"
              : locale === "kk"
                ? "жауап"
                : "откликов"}
          </span>
        </div>
        <div className="task-card-bottom">
          <div className="mini-score">
            <strong>
              {readiness.score}
              <small>/100</small>
            </strong>
            <Badge readiness={readiness} />
          </div>
          {onPreview ? (
            <button
              className="text-link preview-button"
              onClick={onPreview}
              aria-label={`${t("Предпросмотр")}: ${task.card.title}`}
              aria-pressed={selected}
              aria-controls="catalog-preview"
            >
              <Eye size={16} />
              <span>Обзор</span>
            </button>
          ) : (
            <Link
              href={`/tasks/${task.id}`}
              className="icon-button"
              aria-label={`${t("Открыть задачу")}: ${task.card.title}`}
            >
              <ArrowUpRight size={19} />
            </Link>
          )}
        </div>
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
