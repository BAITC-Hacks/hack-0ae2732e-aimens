import { Info, MessageSquareText } from "lucide-react";
import { accessLabels, Analysis, Card } from "@/domain/task";
import { UpdateCard } from "./use-task-builder";
import styles from "./task-builder.module.css";

export function ClarificationStep({
  analysis,
  card,
  update,
}: {
  analysis: Analysis;
  card: Card;
  update: UpdateCard;
}) {
  return (
    <>
      <div className={`info-note ${analysis.mode === "local" ? "local" : ""}`}>
        <Info size={16} aria-hidden="true" />
        <span>{analysis.message}</span>
      </div>
      <p className={styles.intro}>
        Ответьте на то, что знаете. Если детали ещё обсуждаются, оставьте поле
        пустым и вернитесь к нему позже.
      </p>
      <div className={styles.questions}>
        {analysis.questions.map((question, index) => (
          <div className={styles.question} key={`${question.field}-${index}`}>
            <span className={styles.questionNumber} aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <label className="field">
                <span>{question.question}</span>
                <textarea
                  value={card[question.field]}
                  maxLength={4000}
                  rows={3}
                  placeholder="Ваш ответ"
                  onChange={(event) =>
                    update(question.field, event.target.value)
                  }
                />
              </label>
              {question.field === "dataDescription" && (
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
              {analysis.sources[question.field] && (
                <p className={styles.source}>
                  Из вашего описания: «{analysis.sources[question.field]}»
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className={styles.hint}>
        <MessageSquareText size={16} aria-hidden="true" /> Ваши ответы станут
        редактируемыми полями карточки.
      </p>
    </>
  );
}
