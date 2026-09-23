import { Check, CheckCheck, Pencil, ShieldCheck } from "lucide-react";
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
}: {
  card: Card;
  raw: string;
  company: string;
  acknowledged: boolean;
  confirmed: boolean;
  setAcknowledged: (value: boolean) => void;
  confirm: () => void;
  edit: () => void;
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
      <div className={styles.confirmation}>
        <div className={styles.confirmTitle}>
          <ShieldCheck size={19} aria-hidden="true" />
          <h3>Вы отвечаете за сведения в карточке</h3>
        </div>
        <p>
          Рейтинг отражает полноту описания. Он помогает командам оценить задачу
          и не проверяет достоверность фактов.
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
            disabled={!acknowledged}
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
