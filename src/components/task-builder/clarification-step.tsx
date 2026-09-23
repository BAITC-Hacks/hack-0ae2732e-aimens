import { Check, Info, MessageSquareText, Sparkles } from "lucide-react";
import { accessLabels, Analysis, Card, FieldKey, fields } from "@/domain/task";
import { UpdateCard } from "./use-task-builder";
import styles from "./task-builder.module.css";

export function ClarificationStep({
  analysis,
  card,
  update,
  acceptSuggestion,
  rejectSuggestion,
  fillWithAI,
  fillMessage,
}: {
  analysis: Analysis;
  card: Card;
  update: UpdateCard;
  acceptSuggestion: (field: FieldKey) => void;
  rejectSuggestion: (field: FieldKey) => void;
  fillWithAI: () => void;
  fillMessage: string;
}) {
  const suggestions = fields.filter(
    ({ key }) => analysis.suggestions[key] && analysis.sources[key],
  );
  const missing = analysis.missingFields
    .map(
      (key) =>
        fields.find((field) => field.key === key)?.label ??
        (key === "dataAccess"
          ? "Доступ к данным"
          : key === "title"
            ? "Название задачи"
            : key === "topic"
              ? "Тема"
              : null),
    )
    .filter(Boolean);
  return (
    <>
      <div
        className={`${styles.analysisMode} ${analysis.mode === "local" ? styles.localMode : ""}`}
      >
        <Info size={16} aria-hidden="true" />
        <div>
          <strong>
            {analysis.mode === "openai"
              ? "Анализ через OpenAI API"
              : "Локальный режим · без внешнего ИИ"}
          </strong>
          <p>{analysis.message}</p>
        </div>
      </div>
      <section
        className={styles.evidence}
        aria-labelledby="builder-evidence-title"
      >
        <div className={styles.sectionHeading}>
          <h3 id="builder-evidence-title">Что найдено в вашем тексте</h3>
          <span>{suggestions.length}</span>
        </div>
        <p className={styles.intro}>
          Найденные сведения уже добавлены в пустые поля карточки. Сверьте их с
          источниками: любой фрагмент можно убрать или отредактировать перед
          публикацией.
        </p>
        {suggestions.length ? (
          <div className={styles.suggestions}>
            {suggestions.map(({ key, label }) => {
              const accepted = card[key] === analysis.suggestions[key];
              return (
                <article className={styles.suggestion} key={key}>
                  <h4>{label}</h4>
                  <p data-no-translate>{analysis.suggestions[key]}</p>
                  <blockquote className={styles.source}>
                    Источник: «
                    <span data-no-translate>{analysis.sources[key]}</span>»
                  </blockquote>
                  <div className={styles.suggestionActions}>
                    {accepted ? (
                      <span className={styles.accepted}>
                        <Check size={15} aria-hidden="true" /> Добавлено в
                        карточку
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => acceptSuggestion(key)}
                        disabled={Boolean(card[key].trim())}
                      >
                        Добавить: {label}
                      </button>
                    )}
                    {
                      <button
                        type="button"
                        className={styles.dismissSuggestion}
                        onClick={() => rejectSuggestion(key)}
                      >
                        {accepted ? "Убрать" : "Пропустить"}: {label}
                      </button>
                    }
                  </div>
                  {!accepted && card[key].trim() && (
                    <small>
                      Поле уже заполнено вами. Изменить его можно в карточке.
                    </small>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyEvidence}>
            {analysis.mode === "local"
              ? "Локальный помощник не извлекает факты. Заполните сведения своими словами ниже."
              : "Нет предложений, ожидающих переноса. Проверьте добавленные сведения в карточке и ответьте на вопросы ниже."}
          </p>
        )}
      </section>
      {missing.length > 0 && (
        <div className={styles.missing}>
          <h3>Чего не хватало при анализе</h3>
          <ul>
            {missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.sectionHeading}>
        <h3>Вопросы к вашей задаче</h3>
        <span>{analysis.questions.length}</span>
      </div>
      <p className={styles.intro}>
        Ответьте на то, что знаете. Если детали ещё обсуждаются, оставьте поле
        пустым и вернитесь к нему позже.
      </p>
      <div className={styles.fillToolbar}>
        <button
          type="button"
          className="button secondary"
          onClick={() => fillWithAI()}
        >
          <Sparkles size={16} aria-hidden="true" /> Заполнить с ИИ
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
              {analysis.sources[question.field] &&
                card[question.field] ===
                  analysis.suggestions[question.field] && (
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
