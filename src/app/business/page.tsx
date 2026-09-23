"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pencil, Plus } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { Badge, DataGate, Empty } from "@/components/ui";
import { ProposalCard } from "@/components/proposals";

export default function BusinessPage() {
  const { data, actor, setActor } = useDemo();
  const [tab, setTab] = useState("tasks");
  const [taskFilter, setTaskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const awaiting = data?.progress.filter((row) => !row.confirmedAt) ?? [];
  const proposals = (data?.proposals ?? []).filter(
    (row) =>
      (!taskFilter || row.taskId === taskFilter) &&
      (tab !== "proposals" || !statusFilter || row.status === statusFilter),
  );
  const results = (data?.progress ?? []).flatMap((progress) => {
    const proposal = proposals.find(
      (row) =>
        row.status === "selected" &&
        row.taskId === progress.taskId &&
        row.teamId === progress.teamId,
    );
    return proposal ? [proposal] : [];
  });
  return (
    <DataGate>
      {actor !== "business" ? (
        <>
          <Empty
            title="Кабинет бизнеса"
            text="Здесь бизнес управляет задачами и рассматривает предложения команд."
          />
          <div className="form-actions">
            <button
              className="button primary"
              onClick={() => setActor("business")}
            >
              Перейти в режим бизнеса
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div>
              <h1>Кабинет бизнеса</h1>
              <p>Ваши задачи, предложения команд и первые результаты.</p>
            </div>
            <Link className="button primary" href="/tasks/new">
              <Plus size={16} />
              Создать задачу
            </Link>
          </div>
          <div className="stat-grid">
            <div className="stat-tile">
              <span>Опубликовано задач</span>
              <strong>
                {data?.tasks.filter((task) => task.publishedAt).length}
              </strong>
              <small>Доступны всем командам</small>
            </div>
            <div className="stat-tile">
              <span>Новых предложений</span>
              <strong>
                {
                  data?.proposals.filter((row) => row.status === "pending")
                    .length
                }
              </strong>
              <small>Ждут вашего решения</small>
            </div>
            <div className="stat-tile">
              <span>Результатов на проверке</span>
              <strong>{awaiting.length}</strong>
              <small>Подтвердите работу команды</small>
            </div>
          </div>
          <div className="section-tabs" aria-label="Разделы кабинета">
            {[
              ["tasks", "Мои задачи"],
              ["proposals", "Предложения"],
              ["results", "Результаты"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
                <span>
                  {key === "tasks"
                    ? data?.tasks.length
                    : key === "proposals"
                      ? data?.proposals.length
                      : data?.progress.length}
                </span>
              </button>
            ))}
          </div>
          {tab === "tasks" ? (
            <div className="stack">
              {data?.tasks.map((task) => (
                <article className="business-row" key={task.id}>
                  <div className="company-mark">{task.company.slice(0, 1)}</div>
                  <div className="row-main">
                    <h2>
                      <Link
                        href={`/tasks/${task.id}`}
                        data-no-translate={!!task.card.title || undefined}
                      >
                        {task.card.title || "Без названия"}
                      </Link>
                    </h2>
                    <p>
                      {task.publishedAt ? "В каталоге" : "Не опубликована"} ·{" "}
                      {task.card.topic} · {task.proposalCount} откликов ·{" "}
                      {task.readiness.score}/100
                    </p>
                  </div>
                  <Badge readiness={task.readiness} />
                  <div className="row-actions">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      className="icon-button"
                      aria-label={`Редактировать: ${task.card.title}`}
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      className="text-link"
                      onClick={() => {
                        setTaskFilter(task.id);
                        setStatusFilter("");
                        setTab("proposals");
                      }}
                    >
                      Отклики <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
              {!data?.tasks.length && (
                <Empty
                  title="Начните с первой задачи"
                  text="Расскажите, что вы хотите улучшить в своём бизнесе."
                  href="/tasks/new"
                  action="Создать задачу"
                />
              )}
            </div>
          ) : (
            <>
              <div className="filter-row">
                <label className="filter-select">
                  Задача
                  <select
                    value={taskFilter}
                    onChange={(event) => setTaskFilter(event.target.value)}
                  >
                    <option value="">Все задачи</option>
                    {data?.tasks.map((task) => (
                      <option
                        key={task.id}
                        value={task.id}
                        data-no-translate={!!task.card.title || undefined}
                      >
                        {task.card.title || "Без названия"}
                      </option>
                    ))}
                  </select>
                </label>
                {tab === "proposals" && (
                  <label className="filter-select">
                    Статус
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="">Все предложения</option>
                      <option value="pending">На рассмотрении</option>
                      <option value="selected">Команда выбрана</option>
                      <option value="rejected">Отклонено</option>
                    </select>
                  </label>
                )}
              </div>
              <p className="muted text-small" style={{ marginBottom: 20 }}>
                {tab === "proposals"
                  ? "Сравните идеи, планы и сроки. Можно выбрать несколько команд — остальные предложения останутся на рассмотрении."
                  : "За подтверждённый первый результат команда получает 10 баллов один раз по каждой задаче."}
              </p>
              <div className="proposal-grid">
                {(tab === "proposals" ? proposals : results).map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    showTask
                  />
                ))}
              </div>
              {!(tab === "proposals" ? proposals : results).length && (
                <Empty
                  title={
                    tab === "proposals"
                      ? "Предложений пока нет"
                      : "Первые результаты впереди"
                  }
                  text={
                    tab === "proposals"
                      ? "Попробуйте другой фильтр или отправьте отклик от имени команды через переключатель демопрофиля."
                      : "Выбранная команда отправит результат из раздела «Мои отклики»."
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </DataGate>
  );
}
