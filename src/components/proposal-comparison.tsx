"use client";

import { useId, useState, type ReactNode } from "react";
import { Columns3, ExternalLink, List } from "lucide-react";
import { type Proposal, type Team } from "@/domain/task";
import { useDemo } from "./demo-provider";
import { ProposalCard, ProposalDecisionButtons } from "./proposals";
import { Status } from "./ui";

export function ProposalComparison({ proposals }: { proposals: Proposal[] }) {
  const { data } = useDemo();
  const [comparing, setComparing] = useState(false);
  const comparisonId = useId();
  const entries = proposals.map((proposal) => ({
    proposal,
    team: data?.teams.find((team) => team.id === proposal.teamId),
  }));
  const rows: {
    label: string;
    content: (proposal: Proposal, team: Team | undefined) => ReactNode;
  }[] = [
    {
      label: "Учебное заведение",
      content: (_, team) => (
        <span data-no-translate={!!team?.university || undefined}>
          {team?.university || "Не указано"}
        </span>
      ),
    },
    {
      label: "Участники",
      content: (_, team) => team?.memberCount ?? "Не указано",
    },
    {
      label: "Навыки",
      content: (_, team) => (
        <span data-no-translate={!!team?.skills.length || undefined}>
          {team?.skills.join(" · ") || "Не указаны"}
        </span>
      ),
    },
    {
      label: "Технологии",
      content: (_, team) => (
        <span data-no-translate={!!team?.technologies?.length || undefined}>
          {team?.technologies?.join(" · ") || "Не указаны"}
        </span>
      ),
    },
    {
      label: "Идея решения",
      content: (proposal) => <span data-no-translate>{proposal.idea}</span>,
    },
    {
      label: "План работы",
      content: (proposal) => <span data-no-translate>{proposal.plan}</span>,
    },
    {
      label: "Срок",
      content: (proposal) => <span data-no-translate>{proposal.duration}</span>,
    },
    {
      label: "Прототип",
      content: (proposal) => (
        <a
          className="text-link"
          href={proposal.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Открыть прототип <ExternalLink size={13} aria-hidden="true" />
        </a>
      ),
    },
    {
      label: "Статус",
      content: (proposal) => <Status status={proposal.status} />,
    },
    {
      label: "Решение бизнеса",
      content: (proposal) =>
        proposal.status === "pending" ? (
          <ProposalDecisionButtons proposal={proposal} />
        ) : (
          <span className="muted text-small">Решение сохранено</span>
        ),
    },
  ];

  return (
    <div className="proposal-comparison stack">
      {proposals.length > 1 && (
        <div className="comparison-toolbar">
          <span className="muted text-small">
            Сравните подходы, сроки и навыки команд
          </span>
          <button
            className="button secondary small"
            aria-pressed={comparing}
            aria-controls={comparisonId}
            onClick={() => setComparing((current) => !current)}
          >
            {comparing ? (
              <List size={16} aria-hidden="true" />
            ) : (
              <Columns3 size={16} aria-hidden="true" />
            )}
            {comparing ? "Показать карточки" : "Сравнить предложения"}
          </button>
        </div>
      )}
      <div id={comparisonId}>
        {comparing ? (
          <div
            className="comparison-scroll"
            role="region"
            aria-label="Сравнение предложений"
            tabIndex={0}
          >
            <table className="comparison-table">
              <caption className="sr-only">
                Сравнение всех предложений по задаче. Решение принимает бизнес.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Предложение</th>
                  {entries.map(({ proposal, team }) => (
                    <th scope="col" key={proposal.id}>
                      <div className="comparison-team">
                        <span className="team-avatar" aria-hidden="true">
                          {team?.initials}
                        </span>
                        <strong data-no-translate={!!team?.name || undefined}>
                          {team?.name || "Команда"}
                        </strong>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {entries.map(({ proposal, team }) => (
                      <td key={proposal.id}>{row.content(proposal, team)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Первый результат</th>
                  {entries.map(({ proposal }) => (
                    <td key={proposal.id}>
                      <button
                        className="text-link"
                        onClick={() => setComparing(false)}
                      >
                        Открыть карточки и результаты
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="stack">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
