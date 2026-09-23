import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Card,
  FieldKey,
  Analysis,
  fields,
  accessLabels,
  topics,
  workFormatLabels,
} from "@/domain/task";
import { UpdateCard } from "./use-task-builder";
import styles from "./task-builder.module.css";

export function CardFields({
  card,
  raw,
  setRaw,
  update,
  analysis,
  fillWithAI,
  fillMessage,
}: {
  card: Card;
  raw: string;
  setRaw: (value: string) => void;
  update: UpdateCard;
  analysis: Analysis | null;
  fillWithAI: (field?: FieldKey) => void;
  fillMessage: string;
}) {
  const [skillText, setSkillText] = useState(card.skills.join(", "));
  return (
    <>
      <p className={styles.intro}>
        Здесь ваши ответы и принятые фрагменты описания. Каждое поле можно
        отредактировать. Рейтинг справа пересчитывается по мере заполнения.
      </p>
      <fieldset className={styles.fieldGroup}>
        <legend>
          <span>01</span> О задаче
        </legend>
        <label className="field">
          <span>Название задачи *</span>
          <input
            required
            value={card.title}
            maxLength={160}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Какой результат вы хотите получить?"
          />
        </label>
        <div className={styles.twoColumns}>
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
          <label className="field">
            <span>Формат работы</span>
            <select
              value={card.workFormat}
              onChange={(event) =>
                update("workFormat", event.target.value as Card["workFormat"])
              }
            >
              {Object.entries(workFormatLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Навыки команды</span>
          <input
            value={skillText}
            maxLength={300}
            onChange={(event) => {
              setSkillText(event.target.value);
              update("skills", [
                ...new Set(
                  event.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                ),
              ]);
            }}
            placeholder="Например: аналитика данных, Python, UX/UI"
          />
          <small className={styles.hint}>
            До 12 навыков через запятую, каждый — до 60 символов.
          </small>
        </label>
        <label className="field">
          <span>Исходное описание</span>
          <textarea
            rows={3}
            value={raw}
            maxLength={4000}
            onChange={(event) => setRaw(event.target.value)}
          />
        </label>
      </fieldset>
      <div className={styles.fillToolbar}>
        <button
          type="button"
          className="button secondary"
          onClick={() => fillWithAI()}
        >
          <Sparkles size={16} aria-hidden="true" /> Заполнить пустые поля с ИИ
        </button>
        <p className={styles.hint}>
          Только сведения из вашего описания. Введённые ответы сохранятся.
        </p>
      </div>
      {fillMessage && (
        <p role="status" className="info-note">
          {fillMessage}
        </p>
      )}
      {[
        { title: "Проблема и участники", keys: ["context", "need", "users"] },
        {
          title: "Материалы и результат",
          keys: [
            "dataDescription",
            "expectedResult",
            "successMetric",
            "successTarget",
          ],
        },
        {
          title: "Условия и связь",
          keys: ["constraints", "contact", "interaction"],
        },
      ].map((group, index) => (
        <fieldset className={styles.fieldGroup} key={group.title}>
          <legend>
            <span>0{index + 2}</span> {group.title}
          </legend>
          {fields
            .filter((field) => group.keys.includes(field.key))
            .map((field) => (
              <div key={field.key}>
                <div className={styles.fieldAiAction}>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={Boolean(card[field.key].trim())}
                    title={
                      card[field.key].trim()
                        ? "Поле уже заполнено — текст можно редактировать ниже"
                        : "Найти сведения в исходном описании"
                    }
                    onClick={() => fillWithAI(field.key)}
                  >
                    <Sparkles size={14} aria-hidden="true" /> Заполнить с ИИ
                    <span className="sr-only">: {field.label}</span>
                  </button>
                </div>
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
                      rows={3}
                      value={card[field.key]}
                      maxLength={4000}
                      onChange={(event) =>
                        update(field.key, event.target.value)
                      }
                      placeholder={field.hint}
                    />
                  )}
                </label>
                {analysis?.sources[field.key] &&
                  card[field.key] === analysis.suggestions[field.key] && (
                    <p className={styles.source}>
                      Из вашего описания: «{analysis.sources[field.key]}»
                    </p>
                  )}
                {field.key === "dataDescription" && (
                  <label className="field">
                    <span>Доступ к данным</span>
                    <select
                      value={card.dataAccess}
                      onChange={(event) =>
                        update(
                          "dataAccess",
                          event.target.value as Card["dataAccess"],
                        )
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
        </fieldset>
      ))}
      <p className={styles.hint}>
        * Для публикации достаточно названия, темы и вашего подтверждения.
        Подробности можно добавить позже.
      </p>
    </>
  );
}
