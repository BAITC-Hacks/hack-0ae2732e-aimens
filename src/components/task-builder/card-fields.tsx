import { useState } from "react";
import {
  Card,
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
}: {
  card: Card;
  raw: string;
  setRaw: (value: string) => void;
  update: UpdateCard;
  analysis: Analysis | null;
}) {
  const [skillText, setSkillText] = useState(card.skills.join(", "));
  return (
    <>
      <p className={styles.intro}>
        Собрали ваши ответы в карточку. Дополните важные для команды детали и
        проверьте формулировки.
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
