import {
  Check,
  CheckCheck,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Card,
  accessLabels,
  fields,
  workFormatLabels,
  computeReadiness,
} from "@/domain/task";
import { Badge } from "../ui";
import styles from "./task-builder.module.css";

export function PublishStep({
  card,
  raw,
  company,
  acknowledged,
  confirmed,
  setAcknowledged,
  confirm,
  edit,
  qualityAssessment,
  reviewing,
  reviewTask,
}: {
  card: Card;
  raw: string;
  company: string;
  acknowledged: boolean;
  confirmed: boolean;
  setAcknowledged: (value: boolean) => void;
  confirm: () => void;
  edit: () => void;
  qualityAssessment: import("@/domain/task").QualityAssessment | null;
  reviewing: boolean;
  reviewTask: () => void;
}) {
  return (
    <>
      <p className={styles.intro}>
        Так команды увидят вашу задачу. Проверьте сведения и подтвердите
        карточку перед публикацией.
      </p>
      <article
        className={styles.preview}
        aria-label="Предпросмотр карточки задачи"
      >
        <div className={styles.previewMeta}>
          <span>{company}</span>
          <Badge readiness={computeReadiness(card)} />
        </div>
        <h3>{card.title.trim() || "Название задачи пока не указано"}</h3>
        <div className={styles.previewTags}>
          <span>{card.topic || "Тема не указана"}</span>
          <span>{workFormatLabels[card.workFormat]}</span>
          {card.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <dl className={styles.previewFields}>
          <div>
            <dt>Исходное описание</dt>
            <dd>{raw.trim() || "Пока не уточнено"}</dd>
          </div>
          {fields.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{card[field.key].trim() || "Пока не уточнено"}</dd>
              {field.key === "dataDescription" && (
                <dd className={styles.access}>
                  Доступ: {accessLabels[card.dataAccess]}
                </dd>
              )}
            </div>
          ))}
        </dl>
        <button type="button" className="button secondary" onClick={edit}>
          <Pencil size={15} />
          Редактировать карточку
        </button>
      </article>
      <section
        className={styles.confirmation}
        aria-label="Финальная оценка задачи"
      >
        <h3>Финальная оценка по сути задачи</h3>
        <p>
          Проверка оценивает, достаточно ли конкретики команде для оценки объёма
          и подготовки решения. Публикация доступна с любым результатом.
        </p>
        <button
          type="button"
          className="button secondary"
          disabled={reviewing}
          onClick={reviewTask}
        >
          {reviewing ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {reviewing
            ? "Анализируем задачу…"
            : qualityAssessment
              ? "Повторить анализ задачи"
              : "Анализ задачи"}
        </button>
        {qualityAssessment && (
          <div className={styles.qualityResult} role="status">
            <strong>{qualityAssessment.score} / 100 баллов</strong>
            <p>{qualityAssessment.summary}</p>
            <ul>
              {qualityAssessment.dimensions.map((item) => (
                <li key={item.field}>
                  <span>{item.label}</span>
                  <b>
                    {item.score}/{item.max}
                  </b>
                  <small>{item.reason}</small>
                </li>
              ))}
            </ul>
            <small>
              {qualityAssessment.mode === "openai"
                ? "AI-анализ"
                : "Локальная оценка"}
            </small>
          </div>
        )}
      </section>
      <div className={styles.confirmation}>
        <div className={styles.confirmTitle}>
          <ShieldCheck size={19} aria-hidden="true" />
          <h3>Вы отвечаете за сведения в карточке</h3>
        </div>
        <p>
          Рейтинг помогает командам оценить объём и подготовить план. Факты и
          реалистичность задачи подтверждает бизнес.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <span>
            Я проверил(а) сведения и подтверждаю, что карточка описывает
            реальную потребность бизнеса.
          </span>
        </label>
        {!qualityAssessment && (
          <p className={styles.hint}>
            Сначала выполните финальный анализ задачи.
          </p>
        )}
        {confirmed ? (
          <div className={styles.confirmed} role="status">
            <CheckCheck size={18} />
            Карточка подтверждена. Можно публиковать.
          </div>
        ) : (
          <button
            type="button"
            className="button secondary"
            onClick={confirm}
            disabled={!acknowledged || !qualityAssessment}
          >
            <Check size={16} />
            Подтвердить карточку
          </button>
        )}
      </div>
      <p className={styles.hint}>
        Задачу увидят все команды в общем каталоге. Любой рейтинг подходит для
        публикации; команды вы выбираете самостоятельно.
      </p>
    </>
  );
}
