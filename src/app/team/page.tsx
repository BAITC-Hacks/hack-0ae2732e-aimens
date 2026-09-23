"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty } from "@/components/ui";
import { ProposalCard } from "@/components/proposals";
import { TeamIcon } from "@/components/team-icon";

export default function TeamPage() {
  const { data, actor, setActor } = useDemo();
  const [status, setStatus] = useState("");
  const team = data?.teams.find((team) => team.id === actor);
  const proposals =
    data?.proposals.filter((proposal) => proposal.teamId === actor) ?? [];
  const filtered = proposals.filter(
    (proposal) => !status || proposal.status === status,
  );
  const selectedProposals = proposals.filter(
    (proposal) => proposal.status === "selected",
  );
  const teamProgress =
    data?.progress.filter((progress) => progress.teamId === actor) ?? [];
  const confirmedProgress = teamProgress.filter(
    (progress) => progress.confirmedAt,
  );
  const journey = [
    {
      label: "Отправить предложение",
      detail: proposals.length
        ? `${proposals.length} отправлено`
        : "Выберите задачу",
      complete: proposals.length > 0,
    },
    {
      label: "Получить выбор бизнеса",
      detail: selectedProposals.length
        ? `${selectedProposals.length} в работе`
        : "Ожидает решения",
      complete: selectedProposals.length > 0,
    },
    {
      label: "Показать первый результат",
      detail: teamProgress.length
        ? `${teamProgress.length} отправлено`
        : "Добавьте ссылку",
      complete: teamProgress.length > 0,
    },
    {
      label: "Получить подтверждение",
      detail: confirmedProgress.length
        ? `+${confirmedProgress.length * 10} баллов`
        : "+10 баллов",
      complete: confirmedProgress.length > 0,
    },
  ];
  return (
    <DataGate>
      {!team ? (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">ДЕМОПРОФИЛИ</div>
              <h1>Выберите свою команду</h1>
              <p>Сразу переходите к задачам — регистрация не нужна.</p>
            </div>
          </div>
          <div className="team-grid">
            {data?.teams.map((team) => (
              <button
                className="team-card"
                style={{ textAlign: "left" }}
                key={team.id}
                onClick={() => setActor(team.id)}
              >
                <div className="team-avatar">
                  <TeamIcon iconKey={team.iconKey} />
                </div>
                <h2>{team.name}</h2>
                <p>{team.tagline}</p>
                <span className="text-link">
                  Войти в деморежим <ArrowUpRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">КАБИНЕТ КОМАНДЫ · {team.name}</div>
              <h1>Мои отклики</h1>
              <p>От первой идеи до результата, который нужен бизнесу.</p>
            </div>
            <Link className="button primary" href="/catalog">
              Найти задачу <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="stat-grid">
            <div className="stat-tile">
              <span>Баллы команды</span>
              <strong data-testid="team-points">{team.points}</strong>
              <small>+10 за подтверждённый результат</small>
            </div>
            <div className="stat-tile">
              <span>Отправлено предложений</span>
              <strong>{proposals.length}</strong>
              <small>За отклики баллы не начисляются</small>
            </div>
            <div className="stat-tile">
              <span>Задач в работе</span>
              <strong>
                {
                  new Set(
                    proposals
                      .filter((row) => row.status === "selected")
                      .map((row) => row.taskId),
                  ).size
                }
              </strong>
              <small>Бизнес выбрал вашу команду</small>
            </div>
          </div>
          <section
            className="panel team-journey"
            aria-labelledby="journey-title"
          >
            <div className="section-title">
              <div>
                <div className="eyebrow">ПУТЬ К РЕЗУЛЬТАТУ</div>
                <h2 id="journey-title">Как команда получает баллы</h2>
              </div>
              <strong>+10 за каждую подтверждённую задачу</strong>
            </div>
            <ol>
              {journey.map((step, index) => (
                <li
                  className={step.complete ? "complete" : ""}
                  key={step.label}
                >
                  <span className="journey-marker" aria-hidden="true">
                    {step.complete ? <Check size={16} /> : <Circle size={15} />}
                  </span>
                  <div>
                    <b>
                      {index + 1}. {step.label}
                    </b>
                    <small>{step.detail}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <div className="section-tabs" aria-label="Фильтр предложений">
            {[
              ["", "Все"],
              ["pending", "На рассмотрении"],
              ["selected", "В работе"],
              ["rejected", "Отклонённые"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={status === key ? "active" : ""}
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
              >
                {label}
                <span>
                  {proposals.filter((row) => !key || row.status === key).length}
                </span>
              </button>
            ))}
          </div>
          <div className="stack">
            {filtered.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} showTask />
            ))}
          </div>
          {!filtered.length && (
            <Empty
              title="Здесь будут ваши предложения"
              text="Выберите задачу в каталоге и расскажите, как ваша команда может её решить. Доступны задачи с любым рейтингом."
              href="/catalog"
              action="Найти задачу"
            />
          )}
        </>
      )}
    </DataGate>
  );
}
