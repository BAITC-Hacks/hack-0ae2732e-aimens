"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty } from "@/components/ui";
import { ProposalCard } from "@/components/proposals";

export default function TeamPage() {
  const { data, actor, setActor } = useDemo();
  const [status, setStatus] = useState("");
  const team = data?.teams.find((team) => team.id === actor);
  const proposals =
    data?.proposals.filter((proposal) => proposal.teamId === actor) ?? [];
  const filtered = proposals.filter(
    (proposal) => !status || proposal.status === status,
  );
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
                <div className="team-avatar">{team.initials}</div>
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
