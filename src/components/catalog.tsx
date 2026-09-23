"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  Bookmark,
  Check,
  Sparkles,
} from "lucide-react";
import {
  topics,
  levels,
  workFormats,
  workFormatLabels,
  type WorkFormat,
} from "@/domain/task";
import {
  filterCatalog,
  recommendTasks,
  type CatalogSort,
} from "@/domain/catalog";
import { useDemo } from "./demo-provider";
import { DataGate, TaskCard, Badge } from "./ui";
import { useFavorites, FavoriteButton } from "./favorites";

export function Catalog() {
  const params = useSearchParams();
  return <CatalogContent key={params.get("q") ?? ""} />;
}
function CatalogContent() {
  const { data, actor } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const { ids } = useFavorites();
  const [selectedId, setSelectedId] = useState("");
  const previewRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const topic = params.get("topic") ?? "",
    level = params.get("level") ?? "",
    format = params.get("format") ?? "",
    sort = params.get("sort") ?? "readiness",
    saved = params.get("saved") === "1";
  const published = data?.tasks.filter((t) => t.publishedAt) ?? [];
  const tasks = filterCatalog(published, {
    query,
    topic,
    level: level as "",
    workFormat: format as WorkFormat,
    sort: sort as CatalogSort,
  }).filter((t) => !saved || ids.includes(t.id));
  const team = data?.teams.find((t) => t.id === actor);
  const recommendations = recommendTasks(published, team, 2);
  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const activeFilters = [
    ...(query ? [{ key: "q", label: `Поиск: ${query}` }] : []),
    ...(topic ? [{ key: "topic", label: topic }] : []),
    ...(level
      ? [
          {
            key: "level",
            label: levels.find((item) => item.key === level)?.label ?? level,
          },
        ]
      : []),
    ...(format
      ? [
          {
            key: "format",
            label: workFormatLabels[format as WorkFormat] ?? format,
          },
        ]
      : []),
    ...(saved ? [{ key: "saved", label: "Избранное" }] : []),
  ];
  function showPreview(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      previewRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1000px)").matches)
        previewRef.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        });
    });
  }
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/catalog?${next.toString()}`, { scroll: false });
  }
  function clearLocalSearch() {
    setQuery("");
    setSelectedId("");
  }
  return (
    <DataGate>
      <div className="page-heading catalog-page-heading">
        <div>
          <div className="eyebrow">ОТКРЫТЫЕ ВОЗМОЖНОСТИ ДЛЯ КОМАНД</div>
          <h1>Каталог бизнес-задач</h1>
          <p>
            Реальные потребности бизнеса. Открытые возможности для каждой
            команды.
          </p>
        </div>
        <Link href="/tasks/new" className="button primary">
          Разместить задачу <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="catalog-search-row">
        <form
          className="search-box"
          id="search"
          onSubmit={(e) => {
            e.preventDefault();
            update("q", query);
          }}
        >
          <Search size={20} />
          <input
            aria-label="Поиск задач"
            placeholder="Задача, компания или навык"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="icon-button"
              aria-label="Очистить поиск"
              onClick={() => {
                setQuery("");
                update("q", "");
              }}
            >
              <X size={16} />
            </button>
          )}
          <button className="text-link" type="submit">
            Найти
          </button>
        </form>
        <button
          className={`button ${saved ? "primary" : "secondary"}`}
          aria-pressed={saved}
          onClick={() => update("saved", saved ? "" : "1")}
        >
          <Bookmark size={17} />
          Избранное <span>{ids.length}</span>
        </button>
      </div>
      {team && recommendations.length > 0 && (
        <section
          className="recommendations"
          aria-label="Рекомендовано вашей команде"
        >
          <div className="recommendation-heading">
            <Sparkles size={18} />
            <h2>Рекомендовано вашей команде</h2>
            <span>{team.name} · по интересам и навыкам</span>
          </div>
          <div className="recommendation-grid">
            {recommendations.map(({ task, reasons }) => (
              <Link
                href={`/tasks/${task.id}`}
                key={task.id}
                className="recommendation-card"
              >
                <div>
                  <strong>{task.card.title}</strong>
                  <span>{reasons.join(" · ")}</span>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="market-layout">
        <aside className="filter-panel">
          <div className="filter-heading">
            <h2>
              <SlidersHorizontal size={18} />
              Фильтры
            </h2>
            <Link
              className="text-link"
              href="/catalog"
              onClick={clearLocalSearch}
            >
              Сбросить
            </Link>
          </div>
          <fieldset>
            <legend>Направление</legend>
            <div className="filter-topics">
              {["", ...topics].map((item) => (
                <button
                  key={item}
                  className={topic === item ? "selected" : ""}
                  aria-pressed={topic === item}
                  onClick={() => update("topic", item)}
                >
                  <span>{item || "Все направления"}</span>
                  <small>
                    {
                      published.filter((t) => !item || t.card.topic === item)
                        .length
                    }
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Уровень готовности</span>
            <select
              aria-label="Уровень готовности"
              value={level}
              onChange={(e) => update("level", e.target.value)}
            >
              <option value="">Все уровни</option>
              {levels.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Формат работы</span>
            <select
              aria-label="Формат работы"
              value={format}
              onChange={(e) => update("format", e.target.value)}
            >
              <option value="">Любой формат</option>
              {workFormats.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-explainer">
            <Check size={19} />
            <h3>
              Любой балл —<br />
              возможность начать
            </h3>
            <p>
              Рейтинг отражает полноту описания. Откликнуться можно на каждую
              опубликованную задачу.
            </p>
            <Link href="/guide#rating">
              Как считаются баллы <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
        <section className="catalog-results" aria-label="Результаты поиска">
          <div className="list-toolbar">
            <span aria-live="polite">
              <strong>{tasks.length}</strong> задач
            </span>
            <label>
              <span className="sr-only">Сортировка</span>
              <select
                aria-label="Сортировка"
                value={sort}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="readiness">Сначала самые готовые</option>
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала ранние</option>
              </select>
            </label>
          </div>
          {activeFilters.length > 0 && (
            <div
              className="active-filters"
              role="group"
              aria-label="Активные фильтры"
            >
              {activeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.key}
                  aria-label={`Убрать фильтр: ${filter.label}`}
                  onClick={() => {
                    if (filter.key === "q") setQuery("");
                    update(filter.key, "");
                  }}
                >
                  <span>{filter.label}</span>
                  <X size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selected?.id === task.id}
                onPreview={() => showPreview(task.id)}
              />
            ))}
            {!tasks.length && (
              <div className="empty">
                <Image
                  src="/assets/svg/empty-state.svg"
                  alt=""
                  width={128}
                  height={80}
                />
                <h2>
                  {saved
                    ? "В избранном пока нет таких задач"
                    : "Задач по этим условиям нет"}
                </h2>
                <p>
                  Измените запрос или сбросьте фильтры, чтобы увидеть все
                  открытые задачи.
                </p>
                <Link
                  className="button secondary"
                  href="/catalog"
                  onClick={clearLocalSearch}
                >
                  Сбросить фильтры <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
        <aside
          id="catalog-preview"
          className="catalog-preview"
          aria-label="Быстрый просмотр"
          ref={previewRef}
          tabIndex={-1}
        >
          {selected ? (
            <div className="preview-inner">
              <div className="section-title">
                <span className="eyebrow">БЫСТРЫЙ ПРОСМОТР</span>
                <FavoriteButton id={selected.id} title={selected.card.title} />
              </div>
              <div
                className={`company-mark large topic-${selected.card.topic}`}
              >
                {selected.company[0]}
              </div>
              <p className="text-small muted">{selected.company}</p>
              <h2>{selected.card.title}</h2>
              <Badge readiness={selected.readiness} />
              <div className="preview-score">
                <strong>
                  {selected.readiness.score}
                  <small>/100</small>
                </strong>
                <span>
                  готовность
                  <br />
                  задачи
                </span>
              </div>
              <div className="progress-track">
                <div style={{ width: `${selected.readiness.score}%` }} />
              </div>
              <h3>Что предстоит сделать</h3>
              <p>
                {selected.card.expectedResult ||
                  selected.card.need ||
                  "Результат ещё предстоит уточнить с бизнесом."}
              </p>
              <div className="tags">
                {(selected.card.skills ?? []).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <dl>
                <div>
                  <dt>Формат</dt>
                  <dd>
                    {
                      workFormatLabels[
                        selected.card.workFormat ?? "unspecified"
                      ]
                    }
                  </dd>
                </div>
                <div>
                  <dt>Предложений</dt>
                  <dd>{selected.proposalCount}</dd>
                </div>
              </dl>
              <Link className="button primary" href={`/tasks/${selected.id}`}>
                Открыть задачу <ArrowUpRight size={17} />
              </Link>
              <p className="preview-footnote">
                Выбор команды всегда за бизнесом.
              </p>
            </div>
          ) : (
            <div className="preview-inner">
              <p className="muted">
                Здесь появится краткая информация о выбранной задаче.
              </p>
            </div>
          )}
        </aside>
      </div>
    </DataGate>
  );
}
