"use client";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Award } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate } from "@/components/ui";

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
          <div className="eyebrow">СООБЩЕСТВО ПРАКТИКИ</div>
          <h1>Команды и их прогресс</h1>
          <p>
            Баллы показывают подтверждённые бизнесом первые результаты. При
            равенстве команды делят место.
          </p>
        </div>
      </div>
      <div className="team-grid">
        {rankedTeams.map((team, index) => {
          const previous = rankedTeams[index - 1];
          const rank =
            index === 0 || team.points < previous.points
              ? index + 1
              : rankedTeams.findIndex(
                  (candidate) => candidate.points === team.points,
                ) + 1;
          return (
            <article className="team-card" key={team.id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="team-avatar">{team.initials}</div>
                <div className="team-rank" aria-label={`${rank} место`}>
                  #{rank}
                </div>
              </div>
              <h2>{team.name}</h2>
              {actor === team.id && (
                <span className="text-green text-small">Ваш профиль</span>
              )}
              <p>{team.tagline}</p>
              <div className="tags">
                {team.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <p className="text-small">
                Интересы: {team.interests.join(" · ")}
              </p>
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
          );
        })}
      </div>
      <p className="muted text-small" style={{ marginTop: 23 }}>
        Все профили и задачи вымышленные. Баллы начисляются за подтверждённый
        бизнесом первый результат, а не за количество откликов.
      </p>
    </DataGate>
  );
}
