"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  ArrowUpRight,
  Sprout,
  Check,
  X,
} from "lucide-react";
import { topics, levels } from "@/domain/task";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty, TaskCard } from "@/components/ui";
import { NewTaskButton } from "@/components/shell";

export default function CatalogPage() {
  const { data, actor } = useDemo();
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
      <section className="page-heading catalog-heading">
        <div>
          <div className="eyebrow">ПЛОЩАДКА ПРАКТИЧЕСКИХ ВОЗМОЖНОСТЕЙ</div>
          <h1>
            Реальные задачи.
            <br />
            <span className="text-green">Ваш следующий шаг.</span>
          </h1>
          <p>
            Находите задачи бизнеса, объединяйтесь в команды
            <br className="desktop-break" /> и превращайте знания в работающие
            решения.
          </p>
        </div>
        <NewTaskButton />
      </section>
      <div className="catalog-stats">
        <div>
          <strong>{published.length.toString().padStart(2, "0")}</strong>
          <span>открытых задач</span>
        </div>
        <div>
          <strong>{data?.teams.length.toString().padStart(2, "0")}</strong>
          <span>студенческих команд</span>
        </div>
        <div>
          <strong>
            {published
              .filter((task) => task.readiness.score >= 70)
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <span>готовы к старту</span>
        </div>
        <span className="stats-caption">
          <span className="live-dot" />
          Открыто для каждой команды
        </span>
      </div>
      <div className="catalog-layout">
        <div>
          <div className="search-box">
            <Search size={20} />
            <input
              aria-label="Поиск задач"
              placeholder="Задача, компания или ключевое слово"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button aria-label="Очистить поиск" onClick={() => setSearch("")}>
                <X size={17} />
              </button>
            )}
            <span className="search-key">Поиск</span>
          </div>
          <div className="topic-tabs" aria-label="Темы задач">
            <button
              className={!topic ? "selected" : ""}
              onClick={() => setTopic("")}
            >
              Все темы
            </button>
            {topics.map((item) => (
              <button
                key={item}
                className={topic === item ? "selected" : ""}
                onClick={() => setTopic(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="list-toolbar">
            <span>
              <strong>{tasks.length}</strong> задач{topic && ` · ${topic}`}
            </span>
            <label>
              <SlidersHorizontal size={14} />
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
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {!tasks.length && (
              <>
                <Empty
                  title="Таких задач пока нет"
                  text="Попробуйте другую тему или уберите часть фильтров."
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
              </>
            )}
          </div>
        </div>
        <aside className="catalog-aside">
          <section className="start-card">
            <div className="start-card-icon">
              <Sprout size={29} />
            </div>
            <span className="eyebrow">ОТ ИДЕИ К ПРАКТИКЕ</span>
            <h2>
              У каждой задачи
              <br />
              есть своя команда.
            </h2>
            <p>А у каждой команды — возможность сделать первый шаг.</p>
            <Link href={actor === "business" ? "/tasks/new" : "/team"}>
              {actor === "business"
                ? "Создать свою задачу"
                : "Открыть мои отклики"}
              <ArrowUpRight size={18} />
            </Link>
            <div className="abstract-steps" aria-hidden="true">
              <div />
              <div />
              <div />
              <span>
                <Check size={22} />
              </span>
            </div>
          </section>
          <section className="aside-guide">
            <h2>Как начать?</h2>
            {[
              ["01", "Найдите свою задачу", "Выберите тему и изучите детали."],
              [
                "02",
                "Предложите решение",
                "Расскажите, как вы видите результат.",
              ],
              [
                "03",
                "Договоритесь с бизнесом",
                "Команда выбирается после отклика.",
              ],
            ].map(([n, title, text]) => (
              <div className="guide-step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
            <Link href="/guide" className="text-link">
              Подробный гид <ArrowRight size={15} />
            </Link>
          </section>
          <div className="rating-note">
            <span className="small-leaf">
              <Sprout size={19} />
            </span>
            <p>
              <strong>Что означает рейтинг?</strong>Полнота описания задачи.
              Даже на задачу с низким баллом можно откликнуться.
            </p>
          </div>
        </aside>
      </div>
    </DataGate>
  );
}
