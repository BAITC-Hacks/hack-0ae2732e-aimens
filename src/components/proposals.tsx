"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Check,
  X,
  ArrowUpRight,
  Send,
  Award,
  Info,
} from "lucide-react";
import { Proposal, Task } from "@/domain/task";
import { useDemo } from "./demo-provider";
import { Status } from "./ui";

export function ProposalForm({ task }: { task: Task }) {
  const { actor, act, busy, data } = useDemo();
  const [idea, setIdea] = useState("");
  const [plan, setPlan] = useState("");
  const [duration, setDuration] = useState("");
  const [link, setLink] = useState("");
  const [sent, setSent] = useState(false);
  const team = data?.teams.find((team) => team.id === actor);
  const existingCount =
    data?.proposals.filter(
      (proposal) => proposal.taskId === task.id && proposal.teamId === actor,
    ).length ?? 0;
  if (sent)
    return (
      <div className="panel" id="proposal">
        <div className="section-title">
          <h2>Предложение отправлено</h2>
          <Check size={22} color="var(--green)" />
        </div>
        <p className="muted text-small">
          Бизнес рассмотрит вашу идею. Статус предложения доступен в разделе
          «Мои отклики».
        </p>
        <div className="form-actions">
          <Link href="/team" className="button primary">
            Мои отклики <ArrowUpRight size={16} />
          </Link>
          <button className="button secondary" onClick={() => setSent(false)}>
            Ещё одно предложение
          </button>
        </div>
      </div>
    );
  return (
    <section className="panel" id="proposal">
      <div className="section-title">
        <h2>Предложите своё решение</h2>
        <span>{team?.name}</span>
      </div>
      <p className="text-small muted" style={{ marginBottom: 22 }}>
        Расскажите, как ваша команда подойдёт к задаче. Окончательное решение
        принимает бизнес.
      </p>
      {existingCount > 0 && (
        <div className="info-note">
          <Info size={16} aria-hidden="true" />
          <span>
            У команды уже есть предложение по этой задаче. Можно отправить ещё
            один самостоятельный вариант — бизнес рассмотрит варианты отдельно.
          </span>
        </div>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await act(
              { type: "propose", taskId: task.id, idea, plan, duration, link },
              "Предложение отправлено бизнесу",
            );
            setSent(true);
            setIdea("");
            setPlan("");
            setDuration("");
            setLink("");
          } catch {}
        }}
      >
        <label className="field">
          <span>Идея решения *</span>
          <textarea
            required
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            maxLength={4000}
            placeholder="Что вы предлагаете и почему это поможет?"
          />
        </label>
        <label className="field">
          <span>План работы *</span>
          <textarea
            required
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            maxLength={4000}
            placeholder="Опишите 2–3 основных шага"
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Срок *</span>
            <input
              required
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Например: 2 недели"
              maxLength={4000}
            />
          </label>
          <label className="field">
            <span>Ссылка на прототип *</span>
            <input
              required
              type="url"
              pattern="https?://.*"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://…"
              maxLength={2000}
            />
          </label>
        </div>
        <button className="button primary" disabled={busy}>
          <Send size={15} />
          Отправить предложение
        </button>
      </form>
    </section>
  );
}
function ProgressForm({ taskId }: { taskId: string }) {
  const { act, busy } = useDemo();
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  return (
    <form
      className="result-box"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await act(
            { type: "submit-progress", taskId, description, link },
            "Первый результат отправлен на подтверждение",
          );
        } catch {}
      }}
    >
      <h4>Первый результат</h4>
      <p style={{ marginBottom: 14 }}>
        Покажите, что получилось. После подтверждения бизнесом команда получит
        10 баллов.
      </p>
      <label className="field">
        <span>Что сделано *</span>
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
        />
      </label>
      <label className="field">
        <span>Ссылка на результат *</span>
        <input
          required
          type="url"
          pattern="https?://.*"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          maxLength={2000}
          placeholder="https://…"
        />
      </label>
      <button className="button primary small" disabled={busy}>
        Отправить результат
      </button>
    </form>
  );
}
export function ProposalCard({
  proposal,
  showTask = false,
}: {
  proposal: Proposal;
  showTask?: boolean;
}) {
  const { data, actor, act, busy } = useDemo();
  const team = data?.teams.find((team) => team.id === proposal.teamId);
  const task = data?.tasks.find((task) => task.id === proposal.taskId);
  const progress = data?.progress.find(
    (row) => row.taskId === proposal.taskId && row.teamId === proposal.teamId,
  );
  const business = actor === "business";
  return (
    <article className="proposal-card" id={`proposal-${proposal.id}`}>
      <div className="proposal-header">
        <div className="team-avatar">{team?.initials}</div>
        <div>
          <h3>{team?.name}</h3>
          <p className="team-profile-meta text-small muted">
            {team?.university || "Учебное заведение не указано"}
            {team?.memberCount ? ` · Участников: ${team.memberCount}` : ""}
          </p>
          {showTask && (
            <Link
              className="text-small muted"
              href={`/tasks/${proposal.taskId}`}
            >
              {task?.card.title || "Открыть задачу"}
            </Link>
          )}
        </div>
        <Status status={proposal.status} />
      </div>
      {!!team?.skills.length && (
        <div className="tags">
          {team.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      )}
      <h4>Идея решения</h4>
      <p>{proposal.idea}</p>
      <details className="proposal-expand">
        <summary>План и информация о команде</summary>
        <h4>План</h4>
        <p>{proposal.plan}</p>
        {team?.tagline && <p className="muted text-small">{team.tagline}</p>}
        {!!team?.technologies?.length && (
          <p className="text-small">
            Технологии: {team.technologies.join(" · ")}
          </p>
        )}
      </details>
      <div className="proposal-details">
        <span>Срок: {proposal.duration}</span>
        <a href={proposal.link} target="_blank" rel="noopener noreferrer">
          Прототип <ExternalLink size={12} />
        </a>
      </div>
      <ProposalDecisionButtons proposal={proposal} />
      {proposal.status === "selected" && progress && (
        <div className="result-box">
          <h4>
            {progress.confirmedAt
              ? "Первый результат подтверждён"
              : "Первый результат на проверке"}
          </h4>
          <p>{progress.description}</p>
          <a
            href={progress.link}
            className="text-link"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 10 }}
          >
            Посмотреть результат <ExternalLink size={13} />
          </a>
          {progress.confirmedAt ? (
            <p
              className="text-green"
              style={{
                marginTop: 12,
                display: "flex",
                gap: 7,
                alignItems: "center",
              }}
            >
              <Award size={17} />
              +10 баллов команде
            </p>
          ) : (
            business && (
              <div>
                <button
                  disabled={busy}
                  className="button primary small"
                  onClick={() => {
                    void act(
                      { type: "confirm-progress", progressId: progress.id },
                      "Результат подтверждён. Команде начислено 10 баллов.",
                    ).catch(() => {});
                  }}
                >
                  Подтвердить результат · +10
                </button>
              </div>
            )
          )}
        </div>
      )}
      {proposal.status === "selected" &&
        !progress &&
        !business &&
        actor === proposal.teamId && <ProgressForm taskId={proposal.taskId} />}
      {proposal.status === "selected" && !progress && business && (
        <p className="text-small muted" style={{ marginTop: 17 }}>
          Ожидаем первый результат от команды.
        </p>
      )}
    </article>
  );
}

export function ProposalDecisionButtons({ proposal }: { proposal: Proposal }) {
  const { actor, act, busy } = useDemo();
  if (actor !== "business" || proposal.status !== "pending") return null;
  return (
    <div className="form-actions">
      <button
        className="button primary small"
        disabled={busy}
        onClick={() => {
          void act(
            { type: "decide", proposalId: proposal.id, status: "selected" },
            "Команда выбрана. Остальные предложения доступны для рассмотрения.",
          ).catch(() => {});
        }}
      >
        <Check size={14} aria-hidden="true" />
        Выбрать команду
      </button>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={() => {
          void act(
            { type: "decide", proposalId: proposal.id, status: "rejected" },
            "Предложение отклонено",
          ).catch(() => {});
        }}
      >
        <X size={14} aria-hidden="true" />
        Отклонить
      </button>
    </div>
  );
}
