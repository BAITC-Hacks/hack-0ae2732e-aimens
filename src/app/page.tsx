"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { topics, levels } from "@/domain/task";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty, TaskCard } from "@/components/ui";
import { NewTaskButton } from "@/components/shell";

export default function CatalogPage() {
  const { data } = useDemo();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const published = data?.tasks.filter((task) => task.publishedAt) ?? [];
  const tasks = published.filter(
    (task) =>
      (!topic || task.card.topic === topic) &&
      (!level || task.readiness.level.key === level) &&
      (!search ||
        `${task.card.title} ${task.company} ${task.card.need}`
          .toLocaleLowerCase("ru")
          .includes(search.toLocaleLowerCase("ru"))),
  );

  return (
    <DataGate>
      <section className="catalog-hero">
        <div>
          <div className="eyebrow">POWERED BY HACKALEM · ПРАКТИКА</div>
          <h1>Задачи бизнеса. Решения команд.</h1>
          <p>
            Выберите задачу, предложите план и покажите результат бизнесу. Все
            опубликованные задачи открыты каждой команде.
          </p>
        </div>
        <NewTaskButton />
      </section>
      <div className="catalog-stats" aria-label="Статистика площадки">
        <div>
          <strong>{published.length}</strong>
          <span>открытых задач</span>
        </div>
        <div>
          <strong>{data?.teams.length}</strong>
          <span>команд</span>
        </div>
        <div>
          <strong>
            {published.filter((task) => task.readiness.score >= 70).length}
          </strong>
          <span>готовых к старту</span>
        </div>
        <p>
          Рейтинг показывает полноту описания. Откликнуться можно на любую
          задачу.
        </p>
      </div>
      <section className="catalog-layout" aria-label="Каталог задач">
        <div className="catalog-controls">
          <div className="search-box">
            <Search size={20} aria-hidden="true" />
            <input
              aria-label="Поиск задач"
              placeholder="Поиск по задаче или компании"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button aria-label="Очистить поиск" onClick={() => setSearch("")}>
                <X size={18} />
              </button>
            )}
          </div>
          <div className="topic-tabs" role="group" aria-label="Темы задач">
            <button
              className={!topic ? "selected" : ""}
              aria-pressed={!topic}
              onClick={() => setTopic("")}
            >
              Все темы
            </button>
            {topics.map((item) => (
              <button
                key={item}
                className={topic === item ? "selected" : ""}
                aria-pressed={topic === item}
                onClick={() => setTopic(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="list-toolbar">
            <span aria-live="polite">
              <strong>{tasks.length}</strong> задач{topic && ` · ${topic}`}
            </span>
            <label>
              <SlidersHorizontal size={18} aria-hidden="true" />
              <select
                aria-label="Уровень готовности"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="">Все уровни</option>
                {levels.map((item) => (
                  <option value={item.key} key={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="sort-label">Сначала самые готовые</span>
          </div>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {!tasks.length && (
            <div>
              <Empty
                title="Задач по этим условиям нет"
                text="Выберите другую тему, уровень или измените поисковый запрос."
              />
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setTopic("");
                  setLevel("");
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </section>
    </DataGate>
  );
}
