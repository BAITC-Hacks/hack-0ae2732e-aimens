"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Award, GraduationCap, Plus, Users } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate } from "@/components/ui";
import { TeamIcon } from "@/components/team-icon";

export default function TeamsPage() {
  const { data, actor, setActor } = useDemo();
  const router = useRouter();
  const rankedTeams = [...(data?.teams ?? [])].sort(
    (left, right) =>
      right.points - left.points || left.name.localeCompare(right.name, "ru"),
  );
  const teamRanks = new Map<string, number>();
  rankedTeams.forEach((team, index) => {
    if (index === 0 || team.points !== rankedTeams[index - 1]?.points) {
      teamRanks.set(team.id, index + 1);
    } else {
      teamRanks.set(team.id, teamRanks.get(rankedTeams[index - 1]!.id)!);
    }
  });
  return (
    <DataGate>
      <div className="page-heading">
        <div>
          <div className="eyebrow">КОМАНДЫ SANALINK</div>
          <h1>Команды, которые решают реальные задачи</h1>
          <p>
            Найдите команду по её направлениям и откройте профиль, чтобы
            посмотреть отклики и подтверждённые результаты.
          </p>
        </div>
        <Link className="button primary" href="/teams/new">
          <Plus size={17} /> Создать свою команду
        </Link>
      </div>
      <div className="team-grid">
        {rankedTeams.map((team) => (
          <article
            className={`team-card ${actor === team.id ? "active-team-card" : ""}`}
            key={team.id}
          >
            <div className="team-card-topline">
              <div className="team-avatar" title={team.iconKey ?? "Шанырак"}>
                <TeamIcon iconKey={team.iconKey} size={28} />
              </div>
              <span
                className="team-rank"
                aria-label={`${teamRanks.get(team.id)} место`}
              >
                #{teamRanks.get(team.id)}
              </span>
              {actor === team.id && (
                <span className="team-current-badge">Активный профиль</span>
              )}
            </div>
            <h2 data-no-translate>{team.name}</h2>
            <p data-no-translate>{team.tagline}</p>
            <div className="team-profile-meta">
              <p className="subtle text-small">
                <GraduationCap size={15} aria-hidden="true" />
                {team.university ? (
                  <span data-no-translate>{team.university}</span>
                ) : (
                  "Учебное заведение не указано"
                )}
              </p>
              <p className="subtle text-small">
                <Users size={15} aria-hidden="true" />
                {team.memberCount
                  ? `Участников: ${team.memberCount}`
                  : "Состав команды не указан"}
              </p>
            </div>
            <div className="tags">
              {team.skills.map((skill) => (
                <span key={skill} data-no-translate>
                  {skill}
                </span>
              ))}
            </div>
            <div
              className="team-interest-tags"
              aria-label="Направления команды"
            >
              {team.interests.map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
            </div>
            {!!team.technologies?.length && (
              <p className="team-technologies text-small muted">
                Технологии:{" "}
                <span data-no-translate>{team.technologies.join(" · ")}</span>
              </p>
            )}
            <div className="team-card-footer">
              <span style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <Award size={17} />
                {team.points} баллов
              </span>
              <button
                className="text-link"
                onClick={() => {
                  if (actor !== team.id) setActor(team.id);
                  router.push("/team");
                }}
              >
                {actor === team.id ? "Открыть профиль" : "Выбрать команду"}{" "}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="muted text-small" style={{ marginTop: 23 }}>
        Все профили и задачи вымышленные. Баллы начисляются за подтверждённый
        бизнесом первый результат, а не за количество откликов.
      </p>
    </DataGate>
  );
}
