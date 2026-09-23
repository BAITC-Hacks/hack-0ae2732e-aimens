"use client";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Award } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate } from "@/components/ui";

export default function TeamsPage() {
  const { data, actor, setActor } = useDemo();
  const router = useRouter();
  return (
    <DataGate>
      <div className="page-heading">
        <div>
          <div className="eyebrow">СООБЩЕСТВО ПРАКТИКИ</div>
          <h1>Команды, готовые пробовать</h1>
          <p>
            Пять демокоманд с разными навыками. Общий каталог открыт каждой.
          </p>
        </div>
      </div>
      <div className="team-grid">
        {data?.teams.map((team) => (
          <article className="team-card" key={team.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="team-avatar">{team.initials}</div>
              {actor === team.id && (
                <span className="text-green text-small">Ваш профиль</span>
              )}
            </div>
            <h2>{team.name}</h2>
            <p>{team.tagline}</p>
            <div className="tags">
              {team.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <p className="text-small">Интересы: {team.interests.join(" · ")}</p>
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
