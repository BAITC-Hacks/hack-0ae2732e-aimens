import { ArrowUpRight, Sparkles, WandSparkles } from "lucide-react";
import { Card, TopicSuggestion, topics } from "@/domain/task";
import { draftExamples } from "@/domain/demo-data";
import { UpdateCard } from "./use-task-builder";
import styles from "./task-builder.module.css";

export function DraftStep({
  raw,
  card,
  disabled,
  setRaw,
  update,
  suggestTopic,
  suggestingTopic,
  topicSuggestion,
}: {
  raw: string;
  card: Card;
  disabled: boolean;
  setRaw: (value: string) => void;
  update: UpdateCard;
  suggestTopic: () => void;
  suggestingTopic: boolean;
  topicSuggestion: TopicSuggestion | null;
}) {
  return (
    <>
      <p className={styles.intro}>
        Опишите, что происходит сейчас и что хочется изменить. Не нужно
        составлять техническое задание: помощник найдёт пробелы и задаст
        вопросы.
      </p>
      <label className="field">
        <span>Описание задачи</span>
        <textarea
          aria-label="Описание задачи"
          rows={7}
          maxLength={4000}
          value={raw}
          disabled={disabled}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="У нас сеть кофеен. Каждый вечер остаётся непроданная выпечка. Хотим понять, сколько готовить на завтра…"
        />
        <small className={styles.counter}>{raw.length} / 4000</small>
      </label>
      <div className={styles.topicSuggestion}>
        <button
          type="button"
          className="button secondary"
          disabled={disabled || suggestingTopic}
          onClick={suggestTopic}
        >
          <WandSparkles size={16} />
          {suggestingTopic
            ? "Подбираем направление…"
            : "Не знаю тему — определить по описанию"}
        </button>
        {topicSuggestion && (
          <small role="status">
            {topicSuggestion.mode === "local"
              ? "Локальный подбор. "
              : "AI-подбор. "}
            Предлагаем: <strong>{topicSuggestion.topic}</strong> ·{" "}
            {Math.round(topicSuggestion.confidence * 100)}% уверенности.{" "}
            {topicSuggestion.reason}
          </small>
        )}
      </div>
      <label className="field">
        <span>Тема</span>
        <select
          value={card.topic}
          disabled={disabled}
          onChange={(event) => update("topic", event.target.value)}
        >
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.examples}>
        <h3>
          <Sparkles size={16} aria-hidden="true" /> Примеры исходных описаний
        </h3>
        <div className={styles.exampleGrid}>
          {draftExamples.map((example) => (
            <button
              key={example.title}
              type="button"
              disabled={disabled}
              onClick={() => {
                setRaw(example.text);
                update("topic", example.topic);
              }}
            >
              <span>{example.title}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <p className={styles.hint}>
        Помощник заполнит пустые поля сведениями из вашего текста и задаст 3–5
        вопросов. Проверьте и отредактируйте карточку перед публикацией.
      </p>
      <p className={styles.hint}>
        Если включён OpenAI, описание и заполненные поля передаются внешнему
        AI-сервису. Не добавляйте секреты и персональные данные.
      </p>
    </>
  );
}
