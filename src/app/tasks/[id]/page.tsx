"use client";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  ArrowUpRight,
  Info,
  Users,
  MapPin,
} from "lucide-react";
import { accessLabels } from "@/domain/task";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty, Badge, ScorePanel } from "@/components/ui";
import { ProposalCard, ProposalForm } from "@/components/proposals";

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, actor, setActor } = useDemo();
  const task = data?.tasks.find((task) => task.id === id);
  const proposals =
    data?.proposals.filter((proposal) => proposal.taskId === id) ?? [];
  return (
    <DataGate>
      {!task ? (
        <Empty
          title="Задача не найдена"
          text="Неопубликованные задачи доступны в режиме бизнеса."
          href="/"
        />
      ) : (
        <>
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            Каталог задач
          </Link>
          <div className="detail-heading">
            <div className="detail-meta">
              <div className={`company-mark topic-${task.card.topic}`}>
                {task.company[0]}
              </div>
              <strong>{task.company}</strong>
              <span>·</span>
              <span>{task.card.topic}</span>
              <Badge readiness={task.readiness} />
              {!task.publishedAt && (
                <span className="badge draft">Не опубликована</span>
              )}
            </div>
            <h1>{task.card.title}</h1>
            <div className="detail-meta">
              <span className="subtle">
                <MapPin size={14} />
                Астана · можно работать удалённо
              </span>
              <span className="subtle">
                <Users size={14} />
                {task.proposalCount} откликов
              </span>
            </div>
          </div>
          <div className="content-columns">
            <div className="stack">
              <section className="panel">
                <div className="section-title">
                  <h2>О задаче</h2>
                  {actor === "business" && (
                    <Link href={`/tasks/${id}/edit`} className="text-link">
                      <Pencil size={13} />
                      Редактировать
                    </Link>
                  )}
                </div>
                {[
                  ["Контекст", task.card.context],
                  ["Что нужно изменить", task.card.need],
                  ["Для кого решение", task.card.users],
                  [
                    "Данные и материалы",
                    task.card.dataDescription
                      ? `${task.card.dataDescription}\nДоступ: ${accessLabels[task.card.dataAccess]}`
                      : "",
                  ],
                  ["Ожидаемый результат", task.card.expectedResult],
                  ["Критерий успеха", task.card.successMetric],
                  ["Ограничения", task.card.constraints],
                  ["Связь с бизнесом", task.card.contact],
                  ["Формат взаимодействия", task.card.interaction],
                ].map(([title, text]) => (
                  <div className="detail-block" key={title}>
                    <h2>{title}</h2>
                    <p className={!text ? "missing" : ""}>
                      {text || "Пока не уточнено — обсудите с бизнесом"}
                    </p>
                    {title === "Критерий успеха" && task.card.successTarget && (
                      <p className="target">Цель: {task.card.successTarget}</p>
                    )}
                  </div>
                ))}
              </section>
              {actor === "business" ? (
                <section className="stack">
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    <h2>Предложения команд</h2>
                    <span>{proposals.length} откликов</span>
                  </div>
                  <div className="info-note">
                    <Info size={16} />
                    <span>
                      Вы можете выбрать несколько команд, одну или ни одной.
                      Решение остаётся за вами.
                    </span>
                  </div>
                  {proposals.map((proposal) => (
                    <ProposalCard key={proposal.id} proposal={proposal} />
                  ))}
                  {!proposals.length && (
                    <Empty
                      title="Первое предложение впереди"
                      text="Чтобы попробовать сценарий, переключитесь на команду и отправьте отклик на эту задачу."
                    />
                  )}
                </section>
              ) : (
                <>
                  {task.publishedAt && <ProposalForm task={task} />}{" "}
                  {proposals.length > 0 && (
                    <section className="stack">
                      <div className="section-title">
                        <h2>Ваши предложения</h2>
                      </div>
                      {proposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
            <aside className="sticky-aside stack">
              <ScorePanel
                card={
                  task.confirmedAt
                    ? task.card
                    : {
                        ...task.card,
                        context: "",
                        need: "",
                        users: "",
                        dataDescription: "",
                        expectedResult: "",
                        successMetric: "",
                        constraints: "",
                        contact: "",
                        interaction: "",
                      }
                }
              />
              {actor === "business" ? (
                <div className="panel">
                  <h3 style={{ fontSize: 13, marginBottom: 10 }}>
                    Посмотрите глазами команды
                  </h3>
                  <p className="text-small muted">
                    В демо можно пройти обе стороны сценария.
                  </p>
                  <button
                    className="button secondary"
                    style={{ marginTop: 17, width: "100%" }}
                    onClick={() => setActor("team-1")}
                  >
                    Стать Nomad Labs
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="panel">
                  <a
                    className="button primary"
                    style={{ width: "100%" }}
                    href="#proposal"
                  >
                    Предложить решение
                    <ArrowUpRight size={15} />
                  </a>
                  <p className="text-small muted" style={{ marginTop: 13 }}>
                    Низкий рейтинг не ограничивает отклики. Уточните детали в
                    своём предложении.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </DataGate>
  );
}
