import { ArrowUpRight, Sparkles } from "lucide-react";
import { Card, topics } from "@/domain/task";
import { draftExamples } from "@/domain/demo-data";
import { UpdateCard } from "./use-task-builder";
import styles from "./task-builder.module.css";

export function DraftStep({
  raw,
  card,
  disabled,
  setRaw,
  update,
}: {
  raw: string;
  card: Card;
  disabled: boolean;
  setRaw: (value: string) => void;
  update: UpdateCard;
}) {
  return (
    <>
      <p className={styles.intro}>
        Расскажите своими словами, какую проблему вы хотите решить. Начнём с
        того, что уже известно.
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
      <label className="field">
        <span>Тема</span>
        <select
          value={card.topic}
          disabled={disabled}
          onChange={(event) => update("topic", event.target.value)}
        >
          {topics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </label>
      <div className={styles.examples}>
        <h3>
          <Sparkles size={16} aria-hidden="true" /> Начните с похожей ситуации
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
        Помощник задаст 3–5 вопросов. Вы сможете проверить и изменить каждое
        поле перед публикацией.
      </p>
    </>
  );
}
