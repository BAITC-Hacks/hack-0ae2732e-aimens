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
  return (
    <DataGate>
      <div className="page-heading">
        <div>
          <div className="eyebrow">КОМАНДЫ SANALINK</div>
          <h1>Команды, готовые пробовать</h1>
          <p>
            Баллы показывают подтверждённые бизнесом первые результаты. При
            равенстве команды делят место.
          </p>
        </div>
        <Link className="button primary" href="/teams/new">
          <Plus size={17} /> Создать свою команду
        </Link>
      </div>
      <div className="team-grid">
        {rankedTeams.map((team) => (
          <article className="team-card" key={team.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="team-avatar" title={team.iconKey ?? "Шанырак"}>
                <TeamIcon iconKey={team.iconKey} size={28} />
              </div>
              <span
                className="team-rank"
                aria-label={`${rankedTeams.findIndex((candidate) => candidate.points === team.points) + 1} место`}
              >
                #
                {rankedTeams.findIndex(
                  (candidate) => candidate.points === team.points,
                ) + 1}
              </span>
              {actor === team.id && (
                <span className="text-green text-small">Ваш профиль</span>
              )}
            </div>
            <h2>{team.name}</h2>
            <p>{team.tagline}</p>
            <div className="team-profile-meta">
              <p className="subtle text-small">
                <GraduationCap size={15} aria-hidden="true" />
                {team.university || "Учебное заведение не указано"}
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
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <p className="text-small">Интересы: {team.interests.join(" · ")}</p>
            {!!team.technologies?.length && (
              <p className="team-technologies text-small muted">
                Технологии: {team.technologies.join(" · ")}
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
                Выбрать профиль <ArrowUpRight size={15} />
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
